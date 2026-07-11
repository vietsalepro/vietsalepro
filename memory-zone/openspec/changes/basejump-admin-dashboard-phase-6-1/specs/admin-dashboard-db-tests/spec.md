### ADDED Requirements

### Requirement: pgtap is installed
The system SHALL have the pgtap extension installed in the test/local database to enable DB unit testing.

#### Scenario: Install pgtap extension
- **GIVEN** the migration `xxxx_install_pgtap.sql` is run
- **WHEN** the migration executes `CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions`
- **THEN** the pgtap extension is available in the `extensions` schema

### Requirement: Helper function tests exist
The system SHALL have pgtap tests for `has_tenant_role()`, `get_tenants_for_user()`, `is_tenant_owner()`, and `is_system_admin()`.

#### Scenario: has_tenant_role returns true for correct role
- **GIVEN** a user is a member of a tenant with role `owner`
- **WHEN** `has_tenant_role(tenant_id, 'owner')` is called
- **THEN** it returns `true`

#### Scenario: has_tenant_role returns false for incorrect role
- **GIVEN** a user is a member of a tenant with role `member`
- **WHEN** `has_tenant_role(tenant_id, 'owner')` is called
- **THEN** it returns `false`

#### Scenario: get_tenants_for_user returns correct tenants
- **GIVEN** a user is an active member of 2 tenants
- **WHEN** `get_tenants_for_user()` is called
- **THEN** it returns both tenant IDs

#### Scenario: get_tenants_for_user filters by role
- **GIVEN** a user is owner of tenant A and member of tenant B
- **WHEN** `get_tenants_for_user('owner')` is called
- **THEN** it returns only tenant A

#### Scenario: is_tenant_owner returns true for owner
- **GIVEN** a user has role `owner` on a tenant
- **WHEN** `is_tenant_owner(tenant_id)` is called
- **THEN** it returns `true`

#### Scenario: is_tenant_owner returns false for non-owner
- **GIVEN** a user has role `admin` on a tenant
- **WHEN** `is_tenant_owner(tenant_id)` is called
- **THEN** it returns `false`

#### Scenario: is_system_admin returns true for system admin
- **GIVEN** a user has role `system_admin` in `user_roles`
- **WHEN** `is_system_admin()` is called
- **THEN** it returns `true`

### Requirement: RLS policy tests exist
The system SHALL have pgtap tests for RLS policies on `tenants` and `tenant_memberships` tables.

#### Scenario: Tenant members can select their tenant
- **GIVEN** a user is an active member of a tenant
- **WHEN** the user queries `tenants` table
- **THEN** the user can see their tenant row

#### Scenario: Non-members cannot select tenant
- **GIVEN** a user is NOT a member of a tenant
- **WHEN** the user queries `tenants` table
- **THEN** the user cannot see that tenant row

#### Scenario: Tenant admins can update tenant
- **GIVEN** a user has role `admin` on a tenant
- **WHEN** the user attempts to UPDATE the tenant row
- **THEN** the update succeeds

#### Scenario: Tenant members cannot update tenant
- **GIVEN** a user has role `member` on a tenant
- **WHEN** the user attempts to UPDATE the tenant row
- **THEN** the update is rejected by RLS

### Requirement: Billing tests exist
The system SHALL have pgtap tests for billing schema including `billing_customers` and `tenant_subscriptions`.

#### Scenario: Create billing customer
- **GIVEN** a tenant exists
- **WHEN** a billing customer record is inserted for that tenant
- **THEN** the record exists with correct provider and provider_customer_id

#### Scenario: Subscription lifecycle transitions
- **GIVEN** a tenant has a subscription with status `trialing`
- **WHEN** the subscription status is updated to `active`
- **THEN** the status changes to `active` and `current_period_start`/`current_period_end` are set

#### Scenario: Subscription past_due handling
- **GIVEN** a subscription is in `active` status
- **WHEN** the subscription status is updated to `past_due`
- **THEN** the status changes to `past_due` and the tenant billing status reflects the change

### Requirement: Audit log tests exist
The system SHALL have pgtap tests for audit log triggers on key tables.

#### Scenario: Insert triggers audit log
- **GIVEN** a new row is inserted into `tenants` table
- **WHEN** the insert trigger fires
- **THEN** an audit log entry is created with action `INSERT`, the table name, and the new data

#### Scenario: Update triggers audit log
- **GIVEN** an existing row in `tenants` is updated
- **WHEN** the update trigger fires
- **THEN** an audit log entry is created with action `UPDATE`, old data, and new data

#### Scenario: Delete triggers audit log
- **GIVEN** a row in `tenants` is deleted
- **WHEN** the delete trigger fires
- **THEN** an audit log entry is created with action `DELETE` and the old data
