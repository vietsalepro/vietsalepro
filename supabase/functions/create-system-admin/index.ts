import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

const getClientIp = (req: Request): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '0.0.0.0';
};

const isValidIp = (ip: string): boolean => {
  // ponytail: quick regex check; INET will reject anything that slips through.
  return /^((\d{1,3}\.){3}\d{1,3}|([0-9a-fA-F:]+))$/.test(ip);
};

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const rawIp = getClientIp(req);
    const ip = isValidIp(rawIp) ? rawIp : '0.0.0.0';
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    // Rate limiting: 10 requests per minute per IP.
    const { count, error: countError } = await supabaseAdmin
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('action', 'create_system_admin')
      .gte('window_start', windowStart);

    if (countError) throw countError;
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return jsonResponse({ error: 'Rate limit exceeded: 10 requests per minute' }, 429);
    }

    const { error: logError } = await supabaseAdmin.from('rate_limit_logs').insert({
      ip_address: ip,
      action: 'create_system_admin',
      window_start: new Date().toISOString(),
    });
    if (logError) throw logError;

    // Caller authentication.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    // System admin check.
    const { data: adminRow, error: adminError } = await supabaseAdmin
      .from('system_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (adminError) throw adminError;
    if (!adminRow) {
      return jsonResponse({ error: 'Only system admins can create system admins' }, 403);
    }

    // Input validation and user creation (Sub-phase 2)
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const { email, password } = await req.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return jsonResponse({ error: 'Email is required' }, 400);
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@') || normalizedEmail.length < 3) {
      return jsonResponse({ error: 'Invalid email format' }, 400);
    }

    // Validate password
    if (!password || typeof password !== 'string') {
      return jsonResponse({ error: 'Password is required' }, 400);
    }
    if (password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        return jsonResponse({ error: 'Email already exists' }, 409);
      }
      if (authError.message.includes('Invalid email') || authError.message.includes('password')) {
        return jsonResponse({ error: 'Invalid email or password' }, 400);
      }
      return jsonResponse({ error: 'Failed to create user: ' + authError.message }, 500);
    }

    if (!authData.user?.id) {
      return jsonResponse({ error: 'User creation failed: no user ID returned' }, 500);
    }

    const newUserId = authData.user.id;

    // Assign system admin role via RPC
    const { error: rpcError } = await supabaseAdmin.rpc('add_system_admin', {
      p_user_id: newUserId,
    });

    if (rpcError) {
      // Rollback: delete the user if admin assignment fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return jsonResponse({ error: 'Failed to assign system admin role: ' + rpcError.message }, 500);
    }

    // Audit logging
    const { error: auditError } = await supabaseAdmin.from('app_audit_log').insert({
      action: 'create_system_admin',
      target_user_id: newUserId,
      email: normalizedEmail,
      creator_id: user.id,
      created_at: new Date().toISOString(),
    });
    if (auditError) {
      // Log error but don't fail the request
      console.error('Failed to create audit log:', auditError);
    }

    return jsonResponse({
      success: true,
      userId: newUserId,
      email: normalizedEmail,
    }, 200);

  } catch (err) {
    // Comprehensive error handling with specific error types
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('create-system-admin error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Determine appropriate status code based on error type
    let status = 500;
    let userMessage = 'Internal server error';

    if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
      status = 401;
      userMessage = 'Authentication failed';
    } else if (error.message.includes('permission') || error.message.includes('authorization')) {
      status = 403;
      userMessage = 'Authorization failed';
    } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
      status = 429;
      userMessage = 'Rate limit exceeded';
    } else if (error.message.includes('validation') || error.message.includes('invalid')) {
      status = 400;
      userMessage = 'Invalid request';
    }

    return jsonResponse({ error: userMessage }, status);
  }
});
