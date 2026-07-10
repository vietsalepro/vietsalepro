const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://shbmzvfcenbybvyzclem.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYm16dmZjZW5ieWJ2eXpjbGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNDg5MDAsImV4cCI6MjA5ODcyNDkwMH0.PGB60jrP3MdNogDTwBE8b03bwKwvyidVqb4dQHB9zfs';

const accounts = JSON.parse(fs.readFileSync(path.join(__dirname, 'staging-phase15-accounts.json'), 'utf-8'));

const storeA = accounts.find((a) => a.tenant.subdomain === 'store-a');
const storeB = accounts.find((a) => a.tenant.subdomain === 'store-b');
const storeC = accounts.find((a) => a.tenant.subdomain === 'store-c');

const results = {
  timestamp: new Date().toISOString(),
  environment: 'staging',
  projectRef: 'shbmzvfcenbybvyzclem',
  tests: [],
};

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.error_description || 'Sign in failed');
  return data.access_token;
}

async function rest(method, path, token, tenantId, body) {
  const headers = { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (tenantId) headers['x-tenant-id'] = tenantId;
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  return { status: res.status, body: json || text };
}

async function run(name, fn) {
  console.log(`\n[TEST] ${name}`);
  try {
    const result = await fn();
    results.tests.push({ name, status: 'PASS', result });
    console.log(`  PASS: ${JSON.stringify(result)}`);
  } catch (err) {
    results.tests.push({ name, status: 'FAIL', error: err.message || String(err) });
    console.log(`  FAIL: ${err.message || String(err)}`);
  }
}

async function main() {
  // Ensure store-c is active before suspend test
  await fetch(`${SUPABASE_URL}/functions/v1/staging-update-tenant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
    body: JSON.stringify({ secret: 'phase15-update-tenant', tenant_id: storeC.tenant.id, status: 'active' }),
  });

  // 1. Data isolation
  await run('Data isolation: store-a product not visible in store-b', async () => {
    const aToken = await signIn(storeA.admin.email, storeA.admin.password);
    const productId = `prod-a-${Date.now()}`;
    const insert = await rest('POST', '/products', aToken, storeA.tenant.id, {
      id: productId,
      name: 'Store A Product',
      tenant_id: storeA.tenant.id,
      has_lots: false,
    });
    if (insert.status !== 201) throw new Error(`insert failed: ${insert.status} ${JSON.stringify(insert.body)}`);

    const aQuery = await rest('GET', `/products?id=eq.${productId}`, aToken, storeA.tenant.id);
    if (aQuery.status !== 200 || !Array.isArray(aQuery.body) || aQuery.body.length !== 1) {
      throw new Error(`store-a query failed: ${aQuery.status} ${JSON.stringify(aQuery.body)}`);
    }

    const bToken = await signIn(storeB.admin.email, storeB.admin.password);
    const bQuery = await rest('GET', `/products?id=eq.${productId}`, bToken, storeB.tenant.id);
    if (bQuery.status !== 200 || !Array.isArray(bQuery.body) || bQuery.body.length !== 0) {
      throw new Error(`store-b query should return 0 rows: ${bQuery.status} ${JSON.stringify(bQuery.body)}`);
    }
    return { productId, storeA: aQuery.body.length, storeB: bQuery.body.length };
  });

  // 2. RBAC: cashier cannot delete order
  await run('RBAC: cashier cannot delete order', async () => {
    const aToken = await signIn(storeA.admin.email, storeA.admin.password);
    const orderId = `order-a-${Date.now()}`;
    const create = await rest('POST', '/orders', aToken, storeA.tenant.id, {
      id: orderId,
      order_code: `ORD-${Date.now()}`,
      tenant_id: storeA.tenant.id,
    });
    if (create.status !== 201) throw new Error(`create order failed: ${create.status} ${JSON.stringify(create.body)}`);

    const cashier = storeA.members.find((m) => m.role === 'cashier');
    const cToken = await signIn(cashier.email, cashier.password);
    const del = await rest('DELETE', `/orders?id=eq.${orderId}`, cToken, storeA.tenant.id);

    // Verify order still exists as admin (RLS may make DELETE match 0 rows and return 200)
    const verify = await rest('GET', `/orders?id=eq.${orderId}`, aToken, storeA.tenant.id);
    if (!Array.isArray(verify.body) || verify.body.length !== 1) {
      throw new Error(`order was deleted by cashier; verify status: ${verify.status} rows: ${Array.isArray(verify.body) ? verify.body.length : '?'}`);
    }
    return { orderId, deleteStatus: del.status, verifyRows: verify.body.length };
  });

  // 3. RBAC: accountant cannot create order
  await run('RBAC: accountant cannot create order', async () => {
    const accountant = storeA.members.find((m) => m.role === 'accountant');
    const token = await signIn(accountant.email, accountant.password);
    const orderId = `order-acct-${Date.now()}`;
    const insert = await rest('POST', '/orders', token, storeA.tenant.id, {
      id: orderId,
      order_code: `ORD-ACCT-${Date.now()}`,
      tenant_id: storeA.tenant.id,
    });
    if (insert.status === 201) throw new Error('accountant was able to create order');
    return { orderId, insertStatus: insert.status, insertError: insert.body };
  });

  // 4. Suspend store-c -> data access blocked
  await run('Suspend: store-c data access blocked after suspension', async () => {
    const cToken = await signIn(storeC.admin.email, storeC.admin.password);
    const productId = `prod-c-${Date.now()}`;
    const create = await rest('POST', '/products', cToken, storeC.tenant.id, {
      id: productId,
      name: 'Store C Product',
      tenant_id: storeC.tenant.id,
      has_lots: false,
    });
    if (create.status !== 201) throw new Error(`create product failed: ${create.status} ${JSON.stringify(create.body)}`);

    const before = await rest('GET', `/products?id=eq.${productId}`, cToken, storeC.tenant.id);
    if (before.status !== 200 || !Array.isArray(before.body) || before.body.length !== 1) {
      throw new Error(`product not visible before suspension: ${before.status} ${JSON.stringify(before.body)}`);
    }

    const suspendRes = await fetch(`${SUPABASE_URL}/functions/v1/staging-update-tenant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
      body: JSON.stringify({ secret: 'phase15-update-tenant', tenant_id: storeC.tenant.id, status: 'suspended' }),
    });
    const suspendData = await suspendRes.json();
    if (!suspendRes.ok) throw new Error(`suspend failed: ${suspendRes.status} ${JSON.stringify(suspendData)}`);

    const after = await rest('GET', `/products?id=eq.${productId}`, cToken, storeC.tenant.id);
    if (after.status === 200 && Array.isArray(after.body) && after.body.length === 1) {
      throw new Error('store-c admin still sees product after suspension');
    }
    return { tenantId: storeC.tenant.id, status: 'suspended', productVisibleAfter: Array.isArray(after.body) ? after.body.length : '?' };
  });

  // 5. 404 / non-existent subdomain (check-subdomain returns available=true)
  await run('Subdomain 404: non-existent subdomain available', async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/check-subdomain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
      body: JSON.stringify({ subdomain: 'khongtontai' }),
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    if (data.available !== true) throw new Error('non-existent subdomain should be available');
    return { subdomain: 'khongtontai', available: data.available };
  });

  // 6. Storage RLS
  await run('Storage RLS: tenant B cannot read tenant A file', async () => {
    const aToken = await signIn(storeA.admin.email, storeA.admin.password);
    const fileName = `test-${Date.now()}.txt`;
    const pathA = `${storeA.tenant.id}/test/${fileName}`;

    const upload = await fetch(`${SUPABASE_URL}/storage/v1/object/tenant-assets/${pathA}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aToken}`, apikey: ANON_KEY, 'Content-Type': 'text/plain', 'x-tenant-id': storeA.tenant.id },
      body: 'hello tenant a',
    });
    if (!upload.ok) throw new Error(`upload failed: ${upload.status} ${await upload.text()}`);

    const bToken = await signIn(storeB.admin.email, storeB.admin.password);
    const download = await fetch(`${SUPABASE_URL}/storage/v1/object/tenant-assets/${pathA}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${bToken}`, apikey: ANON_KEY, 'x-tenant-id': storeB.tenant.id },
    });
    if (download.ok) throw new Error('tenant B was able to download tenant A file');
    return { pathA, downloadStatus: download.status };
  });

  // 7. Subscription limits: free tenant cannot add second user
  await run('Subscription limits: free tenant max users', async () => {
    const sysToken = await signIn('staging-admin@vietsalepro.com', 'StagingAdmin123!');
    const subdomain = `store-free-${Date.now()}`;
    const create = await fetch(`${SUPABASE_URL}/functions/v1/create-tenant`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sysToken}`, 'Content-Type': 'application/json', apikey: ANON_KEY },
      body: JSON.stringify({ name: 'Free Tenant', subdomain, email: `${subdomain}-admin@vietsalepro.com`, plan: 'free' }),
    });
    const createData = await create.json();
    if (!create.ok) throw new Error(`create free tenant: ${create.status} ${JSON.stringify(createData)}`);

    const freeTenantId = createData.tenant.id;
    // The system admin token can call invite-member; the subscription limit should still block the second user.
    const freeAdminToken = sysToken;
    const invite = await fetch(`${SUPABASE_URL}/functions/v1/invite-member`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${freeAdminToken}`, 'Content-Type': 'application/json', apikey: ANON_KEY },
      body: JSON.stringify({ tenant_id: freeTenantId, email: `${subdomain}-cashier@vietsalepro.com`, role: 'cashier' }),
    });
    const inviteData = await invite.json();
    if (invite.ok) throw new Error('free tenant was able to invite second user');
    return { freeTenantId, inviteStatus: invite.status, inviteError: inviteData.error };
  });

  // 8. Password reset redirect to correct subdomain
  await run('Password reset: redirectTo uses correct subdomain', async () => {
    const aToken = await signIn(storeA.admin.email, storeA.admin.password);
    const reset = await fetch(`${SUPABASE_URL}/functions/v1/reset-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aToken}`, 'Content-Type': 'application/json', apikey: ANON_KEY },
      body: JSON.stringify({ tenant_id: storeA.tenant.id, user_id: storeA.admin.userId }),
    });
    const resetData = await reset.json();
    if (!reset.ok) throw new Error(`reset-password failed: ${reset.status} ${JSON.stringify(resetData)}`);
    const expectedRedirect = `https://store-a.vietsalepro.com/reset-password`;
    if (resetData.redirectTo !== expectedRedirect) throw new Error(`expected ${expectedRedirect}, got ${resetData.redirectTo}`);
    return { redirectTo: resetData.redirectTo };
  });

  // 9. Rate limiting: check-subdomain spam blocked
  await run('Rate limiting: check-subdomain spam returns 429', async () => {
    // Clear previous rate limit logs for this action (via direct DB not available; we use short unique subdomains)
    let blocked = false;
    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/check-subdomain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
        body: JSON.stringify({ subdomain: `rate-limit-${i}` }),
      });
      if (res.status === 429) {
        blocked = true;
        break;
      }
    }
    if (!blocked) throw new Error('check-subdomain rate limit did not trigger');
    return { blocked };
  });

  // 10. Audit log
  await run('Audit log: records exist for store-a operations', async () => {
    const aToken = await signIn(storeA.admin.email, storeA.admin.password);
    const query = await rest('GET', `/app_audit_log?tenant_id=eq.${storeA.tenant.id}&limit=1`, aToken, storeA.tenant.id);
    if (query.status !== 200 || !Array.isArray(query.body) || query.body.length === 0) {
      throw new Error(`audit log query failed: ${query.status} ${JSON.stringify(query.body)}`);
    }
    return { count: query.body.length, sample: query.body[0] };
  });

  const outputPath = path.join(__dirname, 'staging-phase15-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults written to ${outputPath}`);

  const failures = results.tests.filter((t) => t.status === 'FAIL');
  console.log(`\nSummary: ${results.tests.length - failures.length}/${results.tests.length} passed`);
  if (failures.length > 0) {
    console.log('Failures:', failures.map((t) => t.name).join(', '));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
