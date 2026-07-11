## ADDED Requirements

### Requirement: Tenant subdomain resolution

The system MUST resolve the current tenant from the request subdomain.

#### Scenario: Valid tenant subdomain

GIVEN a user visits `store-a.vietsalepro.com`
WHEN the application loads
THEN `TenantContext` resolves `store-a` to a tenant row and sets the current tenant ID.

#### Scenario: Unknown tenant subdomain

GIVEN a user visits `notfound.vietsalepro.com`
WHEN the tenant lookup fails
THEN the user is redirected to the root domain or shown a 404 page.

#### Scenario: Suspended tenant

GIVEN a user visits `suspended.vietsalepro.com`
WHEN the tenant status is `suspended`
THEN the user sees a "Tài khoản đã bị tạm dừng" page and cannot log in.

### Requirement: Tenant data isolation

Every business table MUST only expose rows that belong to the current tenant.

#### Scenario: Cross-tenant read isolation

GIVEN user A belongs to tenant A
WHEN user A queries `products`, `orders`, or `customers`
THEN only rows with `tenant_id = tenant A` are returned.

#### Scenario: Cross-tenant write rejection

GIVEN user A belongs to tenant A
WHEN user A attempts to insert a row with `tenant_id = tenant B`
THEN the insert is rejected.

### Requirement: Role-based access control

Database policies and UI guards MUST restrict actions based on the user's role within the tenant.

#### Scenario: Cashier creates an order

GIVEN a user with role `cashier` in the current tenant
WHEN the user creates a new order
THEN the order is inserted successfully.

#### Scenario: Cashier cannot modify an order

GIVEN a user with role `cashier` in the current tenant
WHEN the user attempts to update or delete an order
THEN the operation is rejected.

#### Scenario: Accountant cannot create orders

GIVEN a user with role `accountant` in the current tenant
WHEN the user attempts to create an order
THEN the operation is rejected.

### Requirement: Subscription limits

Free and VIP tenants MUST enforce limits on users, products, and orders per month.

#### Scenario: Free tenant user limit

GIVEN a Free tenant already has 1 user
WHEN an admin attempts to invite a second user
THEN the invitation is rejected with a limit error.

#### Scenario: Free tenant product limit

GIVEN a Free tenant already has 50 products
WHEN an admin attempts to create a 51st product
THEN the insert is rejected with a limit error.

#### Scenario: Free tenant monthly order limit

GIVEN a Free tenant has already created 300 orders in the current month
WHEN a cashier attempts to create another order
THEN the insert is rejected with a limit error.

### Requirement: Audit logging

Critical operations MUST be recorded in `app_audit_log`.

#### Scenario: Order change audit

GIVEN an admin updates an order
WHEN the update succeeds
THEN a row is written to `app_audit_log` with `old_data`, `new_data`, `tenant_id`, `user_id`, and `action = 'UPDATE'`.

#### Scenario: Audit log visibility

GIVEN a user with role `cashier` in the current tenant
WHEN the user queries `app_audit_log`
THEN zero rows are returned.

### Requirement: Secure tenant management

Tenant creation and member invitation MUST be performed by authorized users through Edge Functions.

#### Scenario: System admin creates tenant

GIVEN a system admin calls the `create-tenant` Edge Function with a valid subdomain and admin email
WHEN the function executes
THEN a new tenant, admin user, membership, and subscription row are created.

#### Scenario: Non-admin invites rejected

GIVEN a user with role `cashier` calls the `invite-member` Edge Function
WHEN the function verifies the caller's role
THEN the request is rejected.

## MODIFIED Requirements

### Requirement: Service layer tenant injection

All CRUD operations in `services/supabaseService.ts` MUST inject the current `tenant_id` from `TenantContext`.

#### Scenario: Create product with injected tenant

GIVEN a user creates a product through the application
WHEN the service layer sends the insert request
THEN the product row contains the current tenant's `tenant_id` regardless of any `tenant_id` in the input object.

### Requirement: Data loading dependencies

Page-level data fetches MUST depend on the resolved tenant ID.

#### Scenario: Switch subdomain refreshes data

GIVEN a user is logged into tenant A
WHEN the user navigates to tenant B's subdomain
THEN the page re-fetches data and displays only tenant B's rows.

## REMOVED Requirements

### Requirement: Public access policies

**Reason:** Public access to business tables is a security risk and is no longer compatible with tenant isolation.
**Migration:** All public/anonymous policies are dropped and replaced with tenant-aware RLS policies.

### Requirement: Self-registration

**Reason:** Users must be invited to a tenant; open sign-up would bypass tenant assignment.
**Migration:** Disable `Enable new users` in Supabase Auth and remove social providers.
