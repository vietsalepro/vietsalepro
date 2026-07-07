## ADDED Requirements

<!-- No new requirements. -->

## MODIFIED Requirements

### Requirement: p8-1-plan-builder-schema

The system MUST ensure invoice numbering functions created/updated in P8.1 use the existing `public.get_next_invoice_number(p_year INT)` function instead of the non-existent `public.generate_invoice_number(p_date DATE)`.

#### Scenario: create_invoice works after P8.1
- **GIVEN** the system admin is authenticated and the P8.1 migration is applied
- **WHEN** the system admin calls `public.create_invoice(p_tenant_id, 'monthly', 1)`
- **THEN** the RPC succeeds and returns an invoice with `invoice_no` in the format `INV-YYYY-####`

#### Scenario: create_renewal_invoices works after P8.1
- **GIVEN** the P8.1 migration is applied and there is a VIP tenant expiring within the renewal window
- **WHEN** the cron/system admin calls `public.create_renewal_invoices(7)`
- **THEN** the function succeeds and generates renewal invoices with `invoice_no` in the format `INV-YYYY-####`

## REMOVED Requirements

<!-- No removed requirements. -->
