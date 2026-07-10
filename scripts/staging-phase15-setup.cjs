const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shbmzvfcenbybvyzclem.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYm16dmZjZW5ieWJ2eXpjbGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNDg5MDAsImV4cCI6MjA5ODcyNDkwMH0.PGB60jrP3MdNogDTwBE8b03bwKwvyidVqb4dQHB9zfs';

const ADMIN_EMAIL = 'staging-admin@vietsalepro.com';
const ADMIN_PASSWORD = 'StagingAdmin123!';
const USER_PASSWORD = 'TestPass123!';

const TENANTS = [
  { name: 'Store A', subdomain: 'store-a', plan: 'vip' },
  { name: 'Store B', subdomain: 'store-b', plan: 'vip' },
  { name: 'Store C', subdomain: 'store-c', plan: 'vip' },
];

const ROLES = ['cashier', 'inventory_manager', 'accountant'];

async function signIn(email, password) {
  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign in failed for ${email}: ${error.message}`);
  return { supabase, token: data.session.access_token, user: data.user };
}

async function createTenant(token, tenant) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-tenant`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      name: tenant.name,
      subdomain: tenant.subdomain,
      email: `${tenant.subdomain}-admin@vietsalepro.com`,
      plan: tenant.plan,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`create-tenant ${tenant.subdomain}: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function createMember(tenantId, email, role, password) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/staging-create-member`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ secret: 'phase15-create-member', tenant_id: tenantId, email, role, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`create-member ${email}: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function setPassword(userId, password) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/staging-set-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ secret: 'phase15-set-password', user_id: userId, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`set-password ${userId}: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log('Signing in as system admin...');
  const { token: adminToken } = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log('System admin signed in.');

  const results = [];

  for (const tenant of TENANTS) {
    console.log(`\nCreating tenant ${tenant.subdomain}...`);
    const created = await createTenant(adminToken, tenant);
    console.log(`Tenant created: ${created.tenant.id} (${created.tenant.subdomain})`);
    console.log(`Admin user: ${created.adminUser.email}`);

    await setPassword(created.adminUser.id, USER_PASSWORD);
    console.log('Set admin password.');

    const members = [];
    for (const role of ROLES) {
      const email = `${tenant.subdomain}-${role}@vietsalepro.com`;
      console.log(`Creating ${role}: ${email}`);
      const createdMember = await createMember(created.tenant.id, email, role, USER_PASSWORD);
      members.push({ role, email, userId: createdMember.userId, password: USER_PASSWORD });
      console.log(`Created ${role}: ${createdMember.userId}`);
    }

    results.push({
      tenant: created.tenant,
      admin: { email: created.adminUser.email, password: USER_PASSWORD, userId: created.adminUser.id },
      members,
    });
  }

  console.log('\n=== Setup complete ===');
  const outputPath = 'C:\\\\Users\\\\SUACAUBA\\\\Downloads\\\\Project\\\\vietsale-pro-v7\\\\scripts\\\\staging-phase15-accounts.json';
  require('fs').writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log('Accounts written to', outputPath);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
