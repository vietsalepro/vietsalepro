-- F26 baseline: application schema baseline
-- ponytail: this migration recreates the full application schema as it existed on the
-- linked remote project at the time of F26. It uses IF NOT EXISTS so it is safe to run
-- on databases that already have these tables. Foreign keys are intentionally omitted
-- here to avoid ordering conflicts with later migration-track tables; the migration track
-- adds FKs where needed. Routines and grants are included so early RPCs and RLS work.
-- This makes a fresh local/staging database pass `supabase migration up`.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Application schema baseline

CREATE TABLE IF NOT EXISTS "public"."system_admins" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."heavy_ops_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "job_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer DEFAULT 3 NOT NULL,
    "error_message" "text",
    "result" "jsonb",
    "scheduled_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "heavy_ops_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "invoice_id" "uuid",
    "amount" numeric(15,2) NOT NULL,
    "payment_method" "text" DEFAULT 'bank_transfer'::"text" NOT NULL,
    "payment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "reference_code" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payments_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['bank_transfer'::"text", 'cash'::"text", 'card'::"text", 'other'::"text"]))),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'rejected'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "invoice_no" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "issue_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "due_date" "date" NOT NULL,
    "period_start" "date",
    "period_end" "date",
    "subtotal" numeric(15,2) DEFAULT 0 NOT NULL,
    "discount" numeric(15,2) DEFAULT 0 NOT NULL,
    "tax" numeric(15,2) DEFAULT 0 NOT NULL,
    "total" numeric(15,2) DEFAULT 0 NOT NULL,
    "amount_paid" numeric(15,2) DEFAULT 0 NOT NULL,
    "balance" numeric(15,2) GENERATED ALWAYS AS (("total" - "amount_paid")) STORED,
    "notes" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "discount_code" "text",
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending'::"text", 'paid'::"text", 'overdue'::"text", 'cancelled'::"text", 'expired'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "subdomain" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "owner_id" "uuid",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "archived_at" timestamp with time zone,
    "isolation_mode" "text" DEFAULT 'shared'::"text",
    "isolation_schema" "text",
    "isolation_project_ref" "text",
    "custom_domain" "text",
    "white_label" "jsonb" DEFAULT '{}'::"jsonb",
    "read_replica_url" "text",
    "connection_pool_config" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "tenants_isolation_mode_check" CHECK (("isolation_mode" = ANY (ARRAY['shared'::"text", 'schema'::"text", 'project'::"text"]))),
    CONSTRAINT "tenants_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'suspended'::"text", 'trial'::"text", 'pending'::"text", 'archived'::"text", 'read_only'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."billing_job_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_name" "text" NOT NULL,
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "run_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "duration_ms" integer,
    "records_affected" integer DEFAULT 0 NOT NULL,
    "message" "text",
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "billing_job_logs_status_check" CHECK (("status" = ANY (ARRAY['running'::"text", 'success'::"text", 'failed'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."tenant_subscriptions" (
    "tenant_id" "uuid" NOT NULL,
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "max_users" integer DEFAULT 1 NOT NULL,
    "max_products" integer DEFAULT 50 NOT NULL,
    "max_orders_per_month" integer DEFAULT 300 NOT NULL,
    "current_month_orders" integer DEFAULT 0 NOT NULL,
    "current_month_start" "date" DEFAULT CURRENT_DATE NOT NULL,
    "billing_status" "text" DEFAULT 'ok'::"text",
    "expires_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."tenant_api_keys" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "api_key_hash" "text" NOT NULL,
    "api_key_preview" "text",
    "version" integer DEFAULT 1 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_by" "uuid",
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tenant_api_keys_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'revoked'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "address" "text",
    "total_spent" numeric DEFAULT 0,
    "debt" numeric DEFAULT 0,
    "loyalty_points" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "code" "text",
    "rank" "text",
    "last_purchase_date" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "chk_customers_debt_non_negative" CHECK ((("debt" IS NULL) OR ("debt" >= (0)::numeric))),
    CONSTRAINT "chk_customers_points_non_negative" CHECK ((("loyalty_points" IS NULL) OR ("loyalty_points" >= (0)::numeric))),
    CONSTRAINT "chk_customers_spent_non_negative" CHECK ((("total_spent" IS NULL) OR ("total_spent" >= (0)::numeric)))
);

CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "address" "text",
    "contact_person" "text",
    "debt" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "code" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."notification_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "channel" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "status" "text" DEFAULT 'sent'::"text" NOT NULL,
    "error_message" "text",
    "metadata" "jsonb",
    "sent_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notification_logs_channel_check" CHECK (("channel" = ANY (ARRAY['in_app'::"text", 'email'::"text", 'sms'::"text"]))),
    CONSTRAINT "notification_logs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'delivered'::"text", 'read'::"text", 'failed'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."admin_2fa_backup_codes" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code_hash" "text" NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."admin_login_history" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "status" "text" NOT NULL,
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "admin_login_history_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'failed'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "target_type" "text" DEFAULT 'all'::"text" NOT NULL,
    "targets" "jsonb",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "published_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "announcements_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'active'::"text", 'archived'::"text"]))),
    CONSTRAINT "announcements_target_type_check" CHECK (("target_type" = ANY (ARRAY['all'::"text", 'specific_tenants'::"text", 'specific_plans'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."app_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid",
    "user_id" "uuid",
    "table_name" "text" NOT NULL,
    "record_id" "text",
    "action" "text" NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "app_audit_log_action_check" CHECK (("action" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text", 'LOGIN'::"text", 'LOGOUT'::"text", 'EXPORT'::"text", 'IMPERSONATE'::"text", 'IMPERSONATE_END'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."app_audit_log_partitioned" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid",
    "user_id" "uuid",
    "table_name" "text" NOT NULL,
    "record_id" "text",
    "action" "text" NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_audit_log_partitioned_action_check" CHECK (("action" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text", 'LOGIN'::"text", 'LOGOUT'::"text", 'EXPORT'::"text", 'IMPERSONATE'::"text", 'IMPERSONATE_END'::"text"])))
)
PARTITION BY RANGE ("created_at");

CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" "text" DEFAULT 'default'::"text" NOT NULL,
    "point_conversion_rate" numeric DEFAULT 100000,
    "store_name" "text",
    "store_phone" "text",
    "store_address" "text",
    "bank_info" "text",
    "print_size" "text",
    "font_size" numeric,
    "font_family" "text",
    "tax_code" "text",
    "logo" "text",
    "invoice_title" "text" DEFAULT 'HÓA ĐƠN THANH TOÁN'::"text",
    "loyalty_policy" "text",
    "promo_info" "text",
    "thank_you_message" "text" DEFAULT 'Cảm ơn và hẹn gặp lại!'::"text",
    "return_fee_enabled" boolean DEFAULT false,
    "return_max_days" numeric DEFAULT 0,
    "return_fee_percent" numeric DEFAULT 0,
    "allow_negative_stock" boolean DEFAULT false NOT NULL,
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."bank_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_name" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "bank_name" "text" NOT NULL,
    "transfer_content" "text" DEFAULT ''::"text" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."billing_email_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid",
    "invoice_id" "uuid",
    "type" "text" NOT NULL,
    "recipient" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "provider_message_id" "text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "billing_email_logs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text"]))),
    CONSTRAINT "billing_email_logs_type_check" CHECK (("type" = ANY (ARRAY['payment_reminder'::"text", 'payment_confirmation'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."customer_payment_ledger" (
    "id" bigint NOT NULL,
    "customer_id" "text" NOT NULL,
    "reference_type" "text" NOT NULL,
    "reference_id" "text",
    "amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "balance_after" numeric(15,2),
    "reason" "text",
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."disposal_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "disposal_id" "text",
    "product_id" "text",
    "product_name" "text",
    "lot_id" "text",
    "lot_code" "text",
    "quantity" numeric,
    "cost_price" numeric,
    "total_value" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "product_code" "text",
    "category_id" "text",
    "category_name" "text",
    "brand_id" "text",
    "brand_name" "text",
    "expiry_date" "text",
    "reason" "text" DEFAULT ''::"text",
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."disposals" (
    "id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "date" timestamp with time zone DEFAULT "now"(),
    "created_by" "text",
    "status" "text" DEFAULT 'DRAFT'::"text",
    "reason" "text",
    "note" "text",
    "total_quantity" numeric DEFAULT 0,
    "total_value" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "disposals_status_check" CHECK (("status" = ANY (ARRAY['DRAFT'::"text", 'COMPLETED'::"text", 'CANCELLED'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."einvoice_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "api_key" "text",
    "api_secret" "text",
    "username" "text",
    "password" "text",
    "base_url" "text",
    "base_url_prod" "text",
    "store_name" "text",
    "store_address" "text",
    "store_tax_code" "text",
    "invoice_pattern" "text" DEFAULT '01GTKT0/001'::"text",
    "invoice_serial" "text" DEFAULT 'AA/22E'::"text",
    "is_connected" boolean DEFAULT false,
    "declaration_status" "text" DEFAULT 'draft'::"text",
    "declaration_id" "text",
    "approved_at" timestamp with time zone,
    "cert_type" "text" DEFAULT 'usb_token'::"text",
    "cert_serial" "text",
    "cert_issuer" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "einvoice_config_declaration_status_check" CHECK (("declaration_status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "einvoice_config_provider_check" CHECK (("provider" = ANY (ARRAY['sapo_invoice'::"text", 'm_invoice'::"text", 'vnpt'::"text", 'viettel'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."einvoice_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "text" NOT NULL,
    "invoice_number" "text",
    "invoice_pattern" "text" DEFAULT '01GTKT0/001'::"text",
    "invoice_serial" "text" DEFAULT 'AA/22E'::"text",
    "einvoice_status" "text" DEFAULT 'draft'::"text",
    "error_message" "text",
    "tax_code_received" "text",
    "tax_code_at" timestamp with time zone,
    "buyer_tax_code" "text",
    "buyer_address" "text",
    "buyer_name" "text",
    "payment_method" "text" DEFAULT 'cash'::"text",
    "tax_rate" numeric DEFAULT 10,
    "replacing_invoice_number" "text",
    "replaced_by_invoice_number" "text",
    "cancel_reason" "text",
    "cancel_at" timestamp with time zone,
    "xml_data" "text",
    "pdf_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "issued_at" timestamp with time zone,
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "einvoice_orders_einvoice_status_check" CHECK (("einvoice_status" = ANY (ARRAY['draft'::"text", 'pending_code'::"text", 'signed'::"text", 'error'::"text", 'canceled'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."email_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "subject" "text" NOT NULL,
    "body_html" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "email_templates_key_check" CHECK (("key" ~ '^[a-z0-9_]+$'::"text"))
);

CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "level" "text" DEFAULT 'error'::"text" NOT NULL,
    "message" "text" NOT NULL,
    "detail" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "error_logs_level_check" CHECK (("level" = ANY (ARRAY['error'::"text", 'warn'::"text", 'info'::"text", 'debug'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."fraud_queue" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "target_value" "text",
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "event_count" integer DEFAULT 0 NOT NULL,
    "window_start" timestamp with time zone,
    "window_end" timestamp with time zone,
    "resolver_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "fraud_queue_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "fraud_queue_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'reviewing'::"text", 'resolved'::"text", 'dismissed'::"text"]))),
    CONSTRAINT "fraud_queue_type_check" CHECK (("type" = ANY (ARRAY['ip_burst'::"text", 'email_domain_burst'::"text", 'owner_burst'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."import_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "receipt_id" "text",
    "product_id" "text",
    "product_name" "text",
    "quantity" numeric,
    "cost" numeric,
    "lot_code" "text",
    "expiry_date" timestamp with time zone,
    "discount" numeric(15,2) DEFAULT 0,
    "adjusted_cost" numeric(15,2),
    "tenant_id" "uuid" NOT NULL,
    "lot_id" "text"
);

CREATE TABLE IF NOT EXISTS "public"."import_receipts" (
    "id" "text" NOT NULL,
    "invoice_number" "text",
    "date" timestamp with time zone DEFAULT "now"(),
    "supplier_id" "text",
    "supplier_name" "text",
    "total_cost" numeric DEFAULT 0,
    "paid_amount" numeric DEFAULT 0,
    "debt_recorded" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "shipping_cost" numeric DEFAULT 0,
    "status" "text" DEFAULT 'completed'::"text",
    "discount_total" numeric DEFAULT 0,
    "note" "text",
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."integrations" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "partner_id" "uuid",
    "name" "text" NOT NULL,
    "slug" "text",
    "description" "text",
    "category" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "documentation_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "integrations_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."inventory_count_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "count_id" "text",
    "product_id" "text",
    "product_code" "text",
    "product_name" "text",
    "unit" "text",
    "system_quantity" numeric,
    "actual_quantity" numeric,
    "cost" numeric,
    "reason" "text",
    "lot_id" "text",
    "lot_code" "text",
    "expiry_date" "date",
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."inventory_counts" (
    "id" "text" NOT NULL,
    "code" "text",
    "date" timestamp with time zone DEFAULT "now"(),
    "status" "text",
    "notes" "text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "inventory_counts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'completed'::"text", 'cancelled'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."inventory_movements" (
    "id" bigint NOT NULL,
    "product_id" "text" NOT NULL,
    "movement_type" "text" NOT NULL,
    "reference_type" "text" NOT NULL,
    "reference_id" "text" NOT NULL,
    "qty_before" numeric(15,3) NOT NULL,
    "qty_change" numeric(15,3) NOT NULL,
    "qty_after" numeric(15,3) NOT NULL,
    "lot_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text",
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "inventory_movements_movement_type_check" CHECK (("movement_type" = ANY (ARRAY['IMPORT'::"text", 'SALE'::"text", 'RETURN'::"text", 'ADJUSTMENT'::"text", 'TRANSFER'::"text", 'DELETE_IMPORT'::"text", 'SUPPLIER_RETURN'::"text", 'SUPPLIER_EXCHANGE_IN'::"text"]))),
    CONSTRAINT "inventory_movements_reference_type_check" CHECK (("reference_type" = ANY (ARRAY['RECEIPT'::"text", 'ORDER'::"text", 'RETURN_ORDER'::"text", 'COUNT'::"text", 'MANUAL'::"text", 'SUPPLIER_EXCHANGE'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "quantity" numeric(15,2) DEFAULT 1 NOT NULL,
    "unit_price" numeric(15,2) DEFAULT 0 NOT NULL,
    "amount" numeric(15,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."invoice_number_counters" (
    "year" integer NOT NULL,
    "counter" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."invoice_reminder_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "milestone" "text" NOT NULL,
    "due_date" "date" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invoice_reminder_logs_milestone_check" CHECK (("milestone" = ANY (ARRAY['T-7'::"text", 'T-3'::"text", 'T-1'::"text"]))),
    CONSTRAINT "invoice_reminder_logs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."maintenance_windows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "maintenance_windows_ends_after_starts" CHECK (("ends_at" > "starts_at")),
    CONSTRAINT "maintenance_windows_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "text",
    "product_id" "text",
    "product_name" "text",
    "quantity" numeric,
    "unit_name" "text",
    "price" numeric,
    "lot_id" "text",
    "lot_code" "text",
    "cost" numeric(15,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "chk_order_items_quantity_positive" CHECK ((("quantity" IS NULL) OR ("quantity" > (0)::numeric)))
);

CREATE TABLE IF NOT EXISTS "public"."order_items_archive" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "text",
    "product_id" "text",
    "product_name" "text",
    "quantity" numeric,
    "unit_name" "text",
    "price" numeric,
    "lot_id" "text",
    "lot_code" "text",
    "cost" numeric(15,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "chk_order_items_quantity_positive" CHECK ((("quantity" IS NULL) OR ("quantity" > (0)::numeric)))
);

CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "text" NOT NULL,
    "date" timestamp with time zone DEFAULT "now"(),
    "customer_id" "text",
    "customer_name" "text",
    "total_amount" numeric DEFAULT 0,
    "paid_amount" numeric DEFAULT 0,
    "debt_recorded" numeric DEFAULT 0,
    "status" "text",
    "points_earned" numeric DEFAULT 0,
    "points_redeemed" numeric DEFAULT 0,
    "rewards_redeemed" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "payment_method" "text",
    "note" "text",
    "applied_promotions" "jsonb" DEFAULT '[]'::"jsonb",
    "has_return" boolean DEFAULT false NOT NULL,
    "total_returned_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_returned_count" integer DEFAULT 0 NOT NULL,
    "cancelled_at" timestamp with time zone,
    "tenant_id" "uuid" NOT NULL,
    "order_code" "text" NOT NULL,
    CONSTRAINT "chk_orders_returned_le_total" CHECK ((("total_returned_amount" IS NULL) OR ("total_amount" IS NULL) OR ("total_returned_amount" <= ("total_amount" + 0.01)))),
    CONSTRAINT "chk_orders_returned_non_negative" CHECK ((("total_returned_amount" IS NULL) OR ("total_returned_amount" >= (0)::numeric))),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['completed'::"text", 'pending'::"text", 'cancelled'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."orders_archive" (
    "id" "text" NOT NULL,
    "date" timestamp with time zone DEFAULT "now"(),
    "customer_id" "text",
    "customer_name" "text",
    "total_amount" numeric DEFAULT 0,
    "paid_amount" numeric DEFAULT 0,
    "debt_recorded" numeric DEFAULT 0,
    "status" "text",
    "points_earned" numeric DEFAULT 0,
    "points_redeemed" numeric DEFAULT 0,
    "rewards_redeemed" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "payment_method" "text",
    "note" "text",
    "applied_promotions" "jsonb" DEFAULT '[]'::"jsonb",
    "has_return" boolean DEFAULT false NOT NULL,
    "total_returned_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_returned_count" integer DEFAULT 0 NOT NULL,
    "cancelled_at" timestamp with time zone,
    "tenant_id" "uuid" NOT NULL,
    "order_code" "text" NOT NULL,
    CONSTRAINT "chk_orders_returned_le_total" CHECK ((("total_returned_amount" IS NULL) OR ("total_amount" IS NULL) OR ("total_returned_amount" <= ("total_amount" + 0.01)))),
    CONSTRAINT "chk_orders_returned_non_negative" CHECK ((("total_returned_amount" IS NULL) OR ("total_returned_amount" >= (0)::numeric))),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['completed'::"text", 'pending'::"text", 'cancelled'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text",
    "description" "text",
    "website" "text",
    "contact_email" "text",
    "logo_url" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "partners_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."plans" (
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "max_users" integer DEFAULT 0 NOT NULL,
    "max_products" integer DEFAULT 0 NOT NULL,
    "max_orders_per_month" integer DEFAULT 0 NOT NULL,
    "monthly_price" numeric(12,2) DEFAULT 0 NOT NULL,
    "yearly_price" numeric(12,2) DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."point_history" (
    "id" "text" NOT NULL,
    "customer_id" "text",
    "date" timestamp with time zone DEFAULT "now"(),
    "type" "text",
    "amount" numeric,
    "description" "text",
    "order_id" "text",
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "point_history_type_check" CHECK (("type" = ANY (ARRAY['earn'::"text", 'redeem'::"text", 'adjust'::"text", 'return'::"text", 'cancel_return'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."processed_operations" (
    "op_id" "text" NOT NULL,
    "op_type" "text" DEFAULT 'checkout'::"text" NOT NULL,
    "ref_id" "text",
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."product_lots" (
    "id" "text" NOT NULL,
    "product_id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "expiry_date" "date",
    "quantity" numeric(15,3) DEFAULT 0 NOT NULL,
    "cost" numeric(15,2) DEFAULT 0,
    "original_quantity" numeric(15,3),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "chk_product_lots_quantity_non_negative" CHECK ((("quantity" IS NULL) OR ("quantity" >= (0)::numeric)))
);

CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text",
    "sku" "text",
    "barcode" "text",
    "price" numeric DEFAULT 0,
    "cost" numeric DEFAULT 0,
    "quantity" numeric DEFAULT 0,
    "unit" "text",
    "location" "text",
    "category" "text",
    "brand" "text",
    "image" "text",
    "min_stock" numeric,
    "max_stock" numeric,
    "safety_stock" numeric,
    "is_point_accumulation_enabled" boolean DEFAULT false,
    "conversion_units" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "has_lots" boolean DEFAULT false NOT NULL,
    "category_id" "text",
    "brand_id" "text",
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "chk_products_quantity_non_negative" CHECK ((("quantity" IS NULL) OR ("quantity" >= (0)::numeric)))
);

CREATE TABLE IF NOT EXISTS "public"."promo_code_usages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promo_code_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "invoice_id" "uuid",
    "used_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."promo_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "kind" "text" DEFAULT 'fixed_amount'::"text" NOT NULL,
    "discount_value" numeric(12,2) DEFAULT 0 NOT NULL,
    "max_discount_amount" numeric(12,2),
    "min_invoice_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "valid_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "valid_until" "date",
    "max_uses_total" integer,
    "max_uses_per_tenant" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "target_conditions" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "promo_codes_kind_check" CHECK (("kind" = ANY (ARRAY['fixed_amount'::"text", 'percentage'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."promotion_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "condition_type" "text" DEFAULT 'always'::"text" NOT NULL,
    "condition_value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "benefit_type" "text" DEFAULT 'bonus_months'::"text" NOT NULL,
    "benefit_value" numeric(12,2) DEFAULT 0 NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "valid_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "valid_until" "date",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "promotion_rules_benefit_type_check" CHECK (("benefit_type" = ANY (ARRAY['bonus_months'::"text", 'discount_percentage'::"text", 'discount_fixed_amount'::"text"]))),
    CONSTRAINT "promotion_rules_condition_type_check" CHECK (("condition_type" = ANY (ARRAY['tenant_age_days'::"text", 'plan'::"text", 'specific_tenant'::"text", 'cycle_type'::"text", 'always'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."promotions" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "discount_percent" numeric,
    "discount_fixed" numeric,
    "target_product_id" "text",
    "target_category" "text",
    "target_product_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "buy_product_id" "text",
    "buy_quantity" numeric,
    "gift_product_id" "text",
    "gift_quantity" numeric,
    "gift_discount_percent" numeric,
    "tiers" "jsonb" DEFAULT '[]'::"jsonb",
    "main_product_id" "text",
    "combo_product_id" "text",
    "combo_discount_percent" numeric,
    "min_customer_rank" "text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "priority" integer DEFAULT 0 NOT NULL,
    "min_order_value" numeric(15,2) DEFAULT 0 NOT NULL,
    "max_discount" numeric(15,2) DEFAULT 0 NOT NULL,
    "stackable" boolean DEFAULT false NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "promotions_type_check" CHECK (("type" = ANY (ARRAY['percent_on_total'::"text", 'fixed_on_total'::"text", 'percent_on_product'::"text", 'percent_on_category'::"text", 'buy_x_get_y'::"text", 'tiered_quantity'::"text", 'combo'::"text", 'customer_rank'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."rank_configs" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "key" "text" NOT NULL,
    "color" "text" DEFAULT '#6B7280'::"text",
    "description" "text",
    "order" integer DEFAULT 0,
    "is_default" boolean DEFAULT false,
    "conditions" "jsonb" DEFAULT '[]'::"jsonb",
    "discount_percent" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."rank_history" (
    "id" "text" NOT NULL,
    "customer_id" "text",
    "customer_name" "text",
    "old_rank" "text",
    "old_rank_name" "text",
    "new_rank" "text" NOT NULL,
    "new_rank_name" "text" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"(),
    "reason" "text" DEFAULT 'Tự động'::"text",
    "total_spent_at_change" numeric DEFAULT 0,
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."rate_limit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_address" "inet" NOT NULL,
    "action" "text" NOT NULL,
    "attempt_count" integer DEFAULT 1 NOT NULL,
    "window_start" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rate_limit_logs_action_check" CHECK (("action" = ANY (ARRAY['login'::"text", 'create_tenant'::"text", 'check_subdomain'::"text", 'invite_member'::"text", 'process_checkout'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."return_order_items" (
    "id" "text" NOT NULL,
    "return_order_id" "text" NOT NULL,
    "product_id" "text" NOT NULL,
    "product_name" "text" NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "unit_name" "text" NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "subtotal" numeric(15,2) NOT NULL,
    "reason" "text" DEFAULT ''::"text" NOT NULL,
    "lot_id" "text",
    "lot_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "chk_return_order_items_quantity_positive" CHECK ((("quantity" IS NULL) OR ("quantity" > (0)::numeric)))
);

CREATE TABLE IF NOT EXISTS "public"."return_orders" (
    "id" "text" NOT NULL,
    "original_order_id" "text" NOT NULL,
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "customer_id" "text",
    "customer_name" "text" NOT NULL,
    "total_refund_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "refund_method" "text" DEFAULT 'cash'::"text" NOT NULL,
    "debt_reduction" numeric(15,2) DEFAULT 0 NOT NULL,
    "cash_refund" numeric(15,2) DEFAULT 0 NOT NULL,
    "reason" "text" DEFAULT ''::"text" NOT NULL,
    "note" "text",
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "gross_refund_amount" numeric(15,2) DEFAULT 0,
    "days_since_purchase" integer DEFAULT 0,
    "fee_percent" numeric DEFAULT 0,
    "fee_amount" numeric(15,2) DEFAULT 0,
    "original_payment_method" "text",
    "points_deducted" numeric DEFAULT 0,
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."rewards" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "point_cost" numeric DEFAULT 0,
    "description" "text",
    "stock" numeric DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "chk_rewards_stock_non_negative" CHECK ((("stock" IS NULL) OR ("stock" >= (0)::numeric)))
);

CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "posting_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "voucher_type" "text" NOT NULL,
    "voucher_no" "text" NOT NULL,
    "voucher_detail_no" "text" NOT NULL,
    "product_id" "text" NOT NULL,
    "lot_id" "text",
    "warehouse" "text" DEFAULT 'Kho Chính'::"text" NOT NULL,
    "actual_qty" numeric(15,3) NOT NULL,
    "qty_after_transaction" numeric(15,3) NOT NULL,
    "valuation_rate" numeric(15,2) DEFAULT 0 NOT NULL,
    "incoming_rate" numeric(15,2) DEFAULT 0 NOT NULL,
    "outgoing_rate" numeric(15,2) DEFAULT 0 NOT NULL,
    "stock_value" numeric(15,2) DEFAULT 0 NOT NULL,
    "balance_value" numeric(15,2) DEFAULT 0 NOT NULL,
    "reason" "text",
    "is_cancelled" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."supplier_exchange_received_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "exchange_id" "text" NOT NULL,
    "product_id" "text" NOT NULL,
    "product_name" "text",
    "lot_id" "text",
    "lot_code" "text" NOT NULL,
    "expiry_date" "date",
    "quantity" numeric(15,3) DEFAULT 0 NOT NULL,
    "cost" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_value" numeric(15,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."supplier_exchange_return_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "exchange_id" "text" NOT NULL,
    "product_id" "text" NOT NULL,
    "product_name" "text",
    "lot_id" "text",
    "lot_code" "text",
    "expiry_date" "date",
    "quantity" numeric(15,3) DEFAULT 0 NOT NULL,
    "cost" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_value" numeric(15,2) DEFAULT 0 NOT NULL,
    "reference_import_item_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."supplier_exchanges" (
    "id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "supplier_id" "text" NOT NULL,
    "supplier_name" "text",
    "reference_receipt_id" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "return_total_value" numeric(15,2) DEFAULT 0 NOT NULL,
    "received_total_value" numeric(15,2) DEFAULT 0 NOT NULL,
    "debt_adjustment" numeric(15,2) DEFAULT 0 NOT NULL,
    "reason" "text",
    "note" "text",
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "supplier_exchanges_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'completed'::"text", 'cancelled'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."supplier_payment_ledger" (
    "id" bigint NOT NULL,
    "supplier_id" "text" NOT NULL,
    "reference_type" "text" NOT NULL,
    "reference_id" "text",
    "amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "balance_after" numeric(15,2),
    "reason" "text",
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'support'::"text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "assigned_to" "uuid",
    "resolved_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "support_tickets_category_check" CHECK (("category" = ANY (ARRAY['bug'::"text", 'billing'::"text", 'support'::"text", 'feature_request'::"text"]))),
    CONSTRAINT "support_tickets_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'waiting_customer'::"text", 'resolved'::"text", 'closed'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid" DEFAULT "auth"."uid"()
);

CREATE TABLE IF NOT EXISTS "public"."tenant_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "invited_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "impersonated_by" "uuid",
    "impersonated_at" timestamp with time zone,
    "impersonated_expires_at" timestamp with time zone,
    CONSTRAINT "tenant_memberships_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'cashier'::"text", 'inventory_manager'::"text", 'accountant'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."tenant_registration_events" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "owner_user_id" "uuid",
    "email" "text",
    "email_domain" "text" GENERATED ALWAYS AS ("split_part"("email", '@'::"text", 2)) STORED,
    "ip_address" "inet",
    "user_agent" "text",
    "creator_id" "uuid" DEFAULT "auth"."uid"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."tenant_webhooks" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "url" "text" NOT NULL,
    "events" "text"[] DEFAULT ARRAY['*'::"text"] NOT NULL,
    "secret" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tenant_webhooks_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."terms_acceptance" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "terms_version" "text" NOT NULL,
    "terms_type" "text" NOT NULL,
    "accepted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "terms_acceptance_terms_type_check" CHECK (("terms_type" = ANY (ARRAY['tos'::"text", 'privacy'::"text", 'gdpr'::"text", 'cookie'::"text", 'custom'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."ticket_replies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "is_internal_note" boolean DEFAULT false NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."ticket_reply_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "category" "text",
    "content" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ticket_reply_templates_category_check" CHECK ((("category" IS NULL) OR ("category" = ANY (ARRAY['bug'::"text", 'billing'::"text", 'support'::"text", 'feature_request'::"text"]))))
);

CREATE TABLE IF NOT EXISTS "public"."webhook_deliveries" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "webhook_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "idempotency_key" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "http_status" integer,
    "response_body" "text",
    "error_message" "text",
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer DEFAULT 5 NOT NULL,
    "attempted_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "next_retry_at" timestamp with time zone,
    "attempt_log" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "webhook_deliveries_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'delivered'::"text", 'failed'::"text", 'exhausted'::"text"])))
);

-- Primary / unique constraints

ALTER TABLE ONLY "public"."admin_2fa_backup_codes"
    ADD CONSTRAINT "admin_2fa_backup_codes_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."admin_login_history"
    ADD CONSTRAINT "admin_login_history_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."app_audit_log_partitioned"
    ADD CONSTRAINT "app_audit_log_partitioned_pkey" PRIMARY KEY ("id", "created_at");

ALTER TABLE ONLY "public"."app_audit_log"
    ADD CONSTRAINT "app_audit_log_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."billing_email_logs"
    ADD CONSTRAINT "billing_email_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."billing_job_logs"
    ADD CONSTRAINT "billing_job_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."customer_payment_ledger"
    ADD CONSTRAINT "customer_payment_ledger_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."disposal_items"
    ADD CONSTRAINT "disposal_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."disposals"
    ADD CONSTRAINT "disposals_code_key" UNIQUE ("code");

ALTER TABLE ONLY "public"."disposals"
    ADD CONSTRAINT "disposals_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."einvoice_config"
    ADD CONSTRAINT "einvoice_config_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."einvoice_orders"
    ADD CONSTRAINT "einvoice_orders_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_key_key" UNIQUE ("key");

ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."fraud_queue"
    ADD CONSTRAINT "fraud_queue_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."heavy_ops_jobs"
    ADD CONSTRAINT "heavy_ops_jobs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."import_items"
    ADD CONSTRAINT "import_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."import_receipts"
    ADD CONSTRAINT "import_receipts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."integrations"
    ADD CONSTRAINT "integrations_slug_key" UNIQUE ("slug");

ALTER TABLE ONLY "public"."inventory_count_items"
    ADD CONSTRAINT "inventory_count_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."inventory_counts"
    ADD CONSTRAINT "inventory_counts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."invoice_number_counters"
    ADD CONSTRAINT "invoice_number_counters_pkey" PRIMARY KEY ("year");

ALTER TABLE ONLY "public"."invoice_reminder_logs"
    ADD CONSTRAINT "invoice_reminder_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_no_key" UNIQUE ("invoice_no");

ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."maintenance_windows"
    ADD CONSTRAINT "maintenance_windows_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."order_items_archive"
    ADD CONSTRAINT "order_items_archive_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."orders_archive"
    ADD CONSTRAINT "orders_archive_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_slug_key" UNIQUE ("slug");

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("key");

ALTER TABLE ONLY "public"."point_history"
    ADD CONSTRAINT "point_history_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."processed_operations"
    ADD CONSTRAINT "processed_operations_pkey" PRIMARY KEY ("op_id");

ALTER TABLE ONLY "public"."product_lots"
    ADD CONSTRAINT "product_lots_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."promo_code_usages"
    ADD CONSTRAINT "promo_code_usages_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_code_key" UNIQUE ("code");

ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."promotion_rules"
    ADD CONSTRAINT "promotion_rules_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."rank_configs"
    ADD CONSTRAINT "rank_configs_key_key" UNIQUE ("key");

ALTER TABLE ONLY "public"."rank_configs"
    ADD CONSTRAINT "rank_configs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."rank_history"
    ADD CONSTRAINT "rank_history_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."rate_limit_logs"
    ADD CONSTRAINT "rate_limit_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."return_order_items"
    ADD CONSTRAINT "return_order_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."return_orders"
    ADD CONSTRAINT "return_orders_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."supplier_exchange_received_items"
    ADD CONSTRAINT "supplier_exchange_received_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."supplier_exchange_return_items"
    ADD CONSTRAINT "supplier_exchange_return_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."supplier_exchanges"
    ADD CONSTRAINT "supplier_exchanges_code_key" UNIQUE ("code");

ALTER TABLE ONLY "public"."supplier_exchanges"
    ADD CONSTRAINT "supplier_exchanges_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."supplier_payment_ledger"
    ADD CONSTRAINT "supplier_payment_ledger_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_code_key" UNIQUE ("code");

ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."system_admins"
    ADD CONSTRAINT "system_admins_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");

ALTER TABLE ONLY "public"."tenant_api_keys"
    ADD CONSTRAINT "tenant_api_keys_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tenant_memberships"
    ADD CONSTRAINT "tenant_memberships_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tenant_memberships"
    ADD CONSTRAINT "tenant_memberships_tenant_id_user_id_key" UNIQUE ("tenant_id", "user_id");

ALTER TABLE ONLY "public"."tenant_registration_events"
    ADD CONSTRAINT "tenant_registration_events_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tenant_subscriptions"
    ADD CONSTRAINT "tenant_subscriptions_pkey" PRIMARY KEY ("tenant_id");

ALTER TABLE ONLY "public"."tenant_webhooks"
    ADD CONSTRAINT "tenant_webhooks_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_subdomain_key" UNIQUE ("subdomain");

ALTER TABLE ONLY "public"."terms_acceptance"
    ADD CONSTRAINT "terms_acceptance_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ticket_replies"
    ADD CONSTRAINT "ticket_replies_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ticket_reply_templates"
    ADD CONSTRAINT "ticket_reply_templates_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."product_lots"
    ADD CONSTRAINT "uniq_product_lot_code" UNIQUE ("product_id", "code");

ALTER TABLE ONLY "public"."admin_2fa_backup_codes"
    ADD CONSTRAINT "unique_user_code_hash" UNIQUE ("user_id", "code_hash");

ALTER TABLE ONLY "public"."product_lots"
    ADD CONSTRAINT "uq_product_lot_code" UNIQUE ("product_id", "code");

ALTER TABLE ONLY "public"."webhook_deliveries"
    ADD CONSTRAINT "uq_webhook_deliveries_idempotency_key" UNIQUE ("idempotency_key");

ALTER TABLE ONLY "public"."webhook_deliveries"
    ADD CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id");

-- Row level security

ALTER TABLE "public"."admin_2fa_backup_codes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."admin_login_history" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."app_audit_log" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."bank_accounts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."billing_email_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."billing_job_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."customer_payment_ledger" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."disposal_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."disposals" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."einvoice_config" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."einvoice_orders" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."fraud_queue" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."heavy_ops_jobs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."import_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."import_receipts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."integrations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inventory_count_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inventory_counts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inventory_movements" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."invoice_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."invoice_reminder_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."maintenance_windows" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."notification_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."partners" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."point_history" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."processed_operations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."product_lots" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."promo_code_usages" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."promotion_rules" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."promotions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."rank_configs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."rank_history" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."rate_limit_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."return_order_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."return_orders" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."rewards" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."stock_movements" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."supplier_exchange_received_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."supplier_exchange_return_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."supplier_exchanges" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."supplier_payment_ledger" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."system_admins" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tenant_api_keys" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tenant_memberships" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tenant_registration_events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tenant_subscriptions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tenant_webhooks" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."terms_acceptance" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ticket_replies" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ticket_reply_templates" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."webhook_deliveries" ENABLE ROW LEVEL SECURITY;

-- Helper routines (functions + procedures)

CREATE OR REPLACE FUNCTION "public"."add_system_admin"("p_user_id" "uuid") RETURNS "public"."system_admins"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_row public.system_admins;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được thêm system admin' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Không tìm thấy user: %', p_user_id;
  END IF;

  INSERT INTO public.system_admins (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."adjust_customer_debt"("p_customer_id" "text", "p_amount" numeric, "p_reason" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_customer RECORD; v_new_debt NUMERIC; v_balance_after NUMERIC;
BEGIN
  IF p_customer_id IS NULL OR p_customer_id = '' THEN RAISE EXCEPTION 'customer_id is required'; END IF;
  IF p_amount IS NULL OR p_amount = 0 THEN RAISE EXCEPTION 'Số tiền điều chỉnh phải khác 0'; END IF;
  IF p_reason IS NULL OR btrim(p_reason) = '' OR lower(btrim(p_reason)) = 'khớp' THEN
    RAISE EXCEPTION 'Lý do điều chỉnh công nợ bắt buộc và không được để Khớp' USING ERRCODE = 'P0001'; END IF;
  SELECT id, debt INTO v_customer FROM customers WHERE id = p_customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Khách hàng % không tồn tại', p_customer_id; END IF;
  v_new_debt := GREATEST(0, COALESCE(v_customer.debt, 0) + p_amount);
  UPDATE customers SET debt = v_new_debt, updated_at = NOW() WHERE id = p_customer_id;
  v_balance_after := public.insert_customer_ledger_entry(
    p_customer_id := p_customer_id, p_reference_type := 'adjustment',
    p_reference_id := NULL, p_amount := p_amount, p_reason := p_reason,
    p_created_by := current_setting('request.jwt.claim.sub', true));
  RETURN jsonb_build_object('ok', true, 'customer_id', p_customer_id,
    'adjustment_amount', p_amount, 'new_customer_debt', v_new_debt,
    'ledger_balance_after', v_balance_after, 'reason', p_reason);
END; $$;

CREATE OR REPLACE FUNCTION "public"."adjust_supplier_debt"("p_supplier_id" "text", "p_amount" numeric, "p_reason" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_supplier RECORD; v_new_debt NUMERIC; v_balance_after NUMERIC;
BEGIN
  IF p_supplier_id IS NULL OR p_supplier_id = '' THEN RAISE EXCEPTION 'supplier_id is required'; END IF;
  IF p_amount IS NULL OR p_amount = 0 THEN RAISE EXCEPTION 'Số tiền điều chỉnh phải khác 0'; END IF;
  IF p_reason IS NULL OR btrim(p_reason) = '' OR lower(btrim(p_reason)) = 'khớp' THEN
    RAISE EXCEPTION 'Lý do điều chỉnh công nợ bắt buộc và không được để Khớp' USING ERRCODE = 'P0001'; END IF;
  SELECT id, debt INTO v_supplier FROM suppliers WHERE id = p_supplier_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Nhà cung cấp % không tồn tại', p_supplier_id; END IF;
  v_new_debt := GREATEST(0, COALESCE(v_supplier.debt, 0) + p_amount);
  UPDATE suppliers SET debt = v_new_debt, updated_at = NOW() WHERE id = p_supplier_id;
  v_balance_after := public.insert_supplier_ledger_entry(
    p_supplier_id := p_supplier_id, p_reference_type := 'adjustment',
    p_reference_id := NULL, p_amount := p_amount, p_reason := p_reason,
    p_created_by := current_setting('request.jwt.claim.sub', true));
  RETURN jsonb_build_object('ok', true, 'supplier_id', p_supplier_id,
    'adjustment_amount', p_amount, 'new_supplier_debt', v_new_debt,
    'ledger_balance_after', v_balance_after, 'reason', p_reason);
END; $$;

CREATE OR REPLACE FUNCTION "public"."apply_voucher_to_invoice"("p_invoice_id" "uuid", "p_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_invoice public.invoices%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
  v_promo public.promo_codes%ROWTYPE;
  v_validation JSONB;
  v_discount NUMERIC(15,2);
  v_bonus_months INTEGER;
  v_total NUMERIC(15,2);
  v_cycle_type TEXT;
  v_item public.invoice_items%ROWTYPE;
  v_rule public.promotion_rules%ROWTYPE;
  v_usage_id UUID;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được áp dụng voucher' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy hóa đơn');
  END IF;

  IF v_invoice.status NOT IN ('draft', 'pending') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hóa đơn không ở trạng thái chờ thanh toán');
  END IF;

  IF EXISTS (SELECT 1 FROM public.promo_code_usages WHERE invoice_id = p_invoice_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hóa đơn đã áp dụng voucher');
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = v_invoice.tenant_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy tenant');
  END IF;

  v_validation := public.validate_promo_code(p_code, v_invoice.tenant_id, v_invoice.subtotal);
  IF NOT (v_validation->>'valid')::BOOLEAN THEN
    RETURN jsonb_build_object('success', false, 'error', v_validation->>'error');
  END IF;

  SELECT * INTO v_promo FROM public.promo_codes WHERE code = p_code;

  -- Tính discount
  IF v_promo.kind = 'percentage' THEN
    v_discount := v_invoice.subtotal * v_promo.discount_value / 100;
    IF v_promo.max_discount_amount IS NOT NULL AND v_discount > v_promo.max_discount_amount THEN
      v_discount := v_promo.max_discount_amount;
    END IF;
  ELSE
    v_discount := v_promo.discount_value;
  END IF;

  IF v_discount > v_invoice.subtotal THEN
    v_discount := v_invoice.subtotal;
  END IF;
  IF v_discount < 0 THEN
    v_discount := 0;
  END IF;
  v_discount := ROUND(v_discount, 2);

  -- Xác định cycle_type từ dòng dịch vụ chính (unit_price > 0)
  v_cycle_type := 'monthly';
  SELECT * INTO v_item
  FROM public.invoice_items
  WHERE invoice_id = p_invoice_id AND unit_price > 0
  ORDER BY created_at ASC
  LIMIT 1;
  IF FOUND AND v_item.unit_price = 59000 THEN
    v_cycle_type := 'yearly';
  END IF;

  -- Tính tổng tháng tặng từ promotion rules phù hợp
  v_bonus_months := 0;
  FOR v_rule IN
    SELECT * FROM public.promotion_rules
    WHERE is_active = true
      AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
      AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
      AND benefit_type = 'bonus_months'
    ORDER BY priority DESC
  LOOP
    IF public.promotion_rule_matches(v_rule.id, v_invoice.tenant_id, v_cycle_type) THEN
      v_bonus_months := v_bonus_months + COALESCE(v_rule.benefit_value, 0)::INTEGER;
    END IF;
  END LOOP;

  v_total := v_invoice.subtotal - v_discount;
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  -- Cập nhật invoice: discount nối vào cột giảm giá, kéo dài period_end nếu có tháng tặng
  UPDATE public.invoices
  SET discount = v_discount,
      total = v_total,
      period_end = CASE
        WHEN v_bonus_months > 0 AND v_invoice.period_end IS NOT NULL
        THEN (v_invoice.period_end + (v_bonus_months * INTERVAL '1 month'))::DATE
        ELSE v_invoice.period_end
      END,
      updated_at = now()
  WHERE id = p_invoice_id
  RETURNING * INTO v_invoice;

  -- Ghi dòng tháng tặng từ promotion
  IF v_bonus_months > 0 THEN
    INSERT INTO public.invoice_items (
      invoice_id,
      tenant_id,
      description,
      quantity,
      unit_price
    ) VALUES (
      p_invoice_id,
      v_invoice.tenant_id,
      'Tháng tặng (promotion)',
      v_bonus_months,
      0
    );
  END IF;

  -- Ghi nhận lượt sử dụng voucher
  INSERT INTO public.promo_code_usages (promo_code_id, tenant_id, invoice_id)
  VALUES (v_promo.id, v_invoice.tenant_id, p_invoice_id)
  RETURNING id INTO v_usage_id;

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', p_invoice_id,
    'promo_code_id', v_promo.id,
    'code', v_promo.code,
    'discount', v_discount,
    'bonus_months', v_bonus_months,
    'total', v_total,
    'period_end', v_invoice.period_end,
    'usage_id', v_usage_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."auth_tenant_api_key"("p_api_key" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_hash TEXT;
  v_key_id UUID;
  v_tenant_id UUID;
BEGIN
  IF p_api_key IS NULL OR length(p_api_key) < 32 THEN
    RETURN NULL;
  END IF;

  v_hash := encode(extensions.digest(p_api_key, 'sha256'), 'hex');

  SELECT id, tenant_id INTO v_key_id, v_tenant_id
  FROM public.tenant_api_keys
  WHERE api_key_hash = v_hash AND status = 'active'
  LIMIT 1;

  IF v_key_id IS NOT NULL THEN
    UPDATE public.tenant_api_keys
    SET last_used_at = now()
    WHERE id = v_key_id;
  END IF;

  RETURN v_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."backfill_stock_ledger"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count      INT := 0;
  v_rec        RECORD;
  v_balance    NUMERIC;
  v_qty_after  NUMERIC;
  v_min_date   TIMESTAMPTZ;
  v_opening_id TEXT;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS tmp_stock_backfill (
    posting_date      TIMESTAMPTZ,
    sort_order        INT,
    voucher_type      TEXT,
    voucher_no        TEXT,
    voucher_detail_no TEXT,
    product_id        TEXT,
    lot_id            TEXT,
    actual_qty        NUMERIC,
    incoming_rate     NUMERIC,
    outgoing_rate     NUMERIC,
    valuation_rate    NUMERIC,
    reason            TEXT,
    is_cancelled      BOOLEAN
  ) ON COMMIT DROP;

  INSERT INTO tmp_stock_backfill (
    posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
    product_id, lot_id, actual_qty, incoming_rate, outgoing_rate, valuation_rate,
    reason, is_cancelled
  )
  SELECT
    COALESCE(r.date, r.created_at, NOW()),
    1,
    'Purchase Receipt',
    r.id,
    i.id::TEXT,
    i.product_id,
    CASE WHEN pl.id IS NOT NULL THEN pl.id ELSE NULL END,
    i.quantity,
    i.cost,
    0::NUMERIC,
    i.cost,
    'Backfill nhập hàng ' || r.id,
    FALSE
  FROM public.import_items i
  JOIN public.import_receipts r ON i.receipt_id = r.id
  LEFT JOIN public.product_lots pl
    ON pl.product_id = i.product_id
   AND pl.code = NULLIF(i.lot_code, '')
   AND (i.expiry_date IS NULL OR pl.expiry_date = i.expiry_date::DATE)
  WHERE r.status = 'completed'
    AND COALESCE(i.quantity, 0) > 0;

  INSERT INTO tmp_stock_backfill (
    posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
    product_id, lot_id, actual_qty, incoming_rate, outgoing_rate, valuation_rate,
    reason, is_cancelled
  )
  SELECT
    COALESCE(o.date, o.created_at, NOW()),
    2,
    'Sales Invoice',
    o.id,
    oi.id::TEXT,
    oi.product_id,
    CASE WHEN pl_oi.id IS NOT NULL THEN oi.lot_id ELSE NULL END,
    -oi.quantity,
    0::NUMERIC,
    COALESCE(oi.cost, p.cost, 0),
    COALESCE(oi.cost, p.cost, 0),
    'Backfill bán hàng ' || o.id,
    FALSE
  FROM public.order_items oi
  JOIN public.orders o ON oi.order_id = o.id
  LEFT JOIN public.products p ON p.id = oi.product_id
  LEFT JOIN public.product_lots pl_oi ON pl_oi.id = oi.lot_id
  WHERE o.status != 'cancelled'
    AND COALESCE(oi.quantity, 0) > 0;

  INSERT INTO tmp_stock_backfill (
    posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
    product_id, lot_id, actual_qty, incoming_rate, outgoing_rate, valuation_rate,
    reason, is_cancelled
  )
  SELECT
    COALESCE(r.date, r.created_at, NOW()),
    3,
    'Delivery Note',
    r.id,
    ri.id,
    ri.product_id,
    CASE WHEN pl_ri.id IS NOT NULL THEN ri.lot_id ELSE NULL END,
    ri.quantity,
    COALESCE(pl_ri.cost, p.cost, 0),
    0::NUMERIC,
    COALESCE(pl_ri.cost, p.cost, 0),
    'Backfill trả hàng ' || r.id,
    FALSE
  FROM public.return_order_items ri
  JOIN public.return_orders r ON ri.return_order_id = r.id
  LEFT JOIN public.products p ON p.id = ri.product_id
  LEFT JOIN public.product_lots pl_ri ON pl_ri.id = ri.lot_id
  WHERE r.status != 'cancelled'
    AND COALESCE(ri.quantity, 0) > 0;

  INSERT INTO tmp_stock_backfill (
    posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
    product_id, lot_id, actual_qty, incoming_rate, outgoing_rate, valuation_rate,
    reason, is_cancelled
  )
  SELECT
    COALESCE(d.date, d.created_at, NOW()),
    4,
    'Stock Entry',
    d.id,
    di.id::TEXT,
    di.product_id,
    CASE WHEN pl_di.id IS NOT NULL THEN di.lot_id ELSE NULL END,
    -di.quantity,
    0::NUMERIC,
    COALESCE(di.cost_price, p.cost, 0),
    COALESCE(di.cost_price, p.cost, 0),
    'Backfill xuất hủy ' || d.id,
    FALSE
  FROM public.disposal_items di
  JOIN public.disposals d ON di.disposal_id = d.id
  LEFT JOIN public.products p ON p.id = di.product_id
  LEFT JOIN public.product_lots pl_di ON pl_di.id = di.lot_id
  WHERE d.status = 'COMPLETED'
    AND COALESCE(di.quantity, 0) > 0;

  INSERT INTO tmp_stock_backfill (
    posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
    product_id, lot_id, actual_qty, incoming_rate, outgoing_rate, valuation_rate,
    reason, is_cancelled
  )
  SELECT
    COALESCE(ic.date, ic.created_at, NOW()),
    5,
    'Stock Reconciliation',
    ic.id,
    ici.id::TEXT,
    ici.product_id,
    CASE WHEN pl_ici.id IS NOT NULL THEN ici.lot_id ELSE NULL END,
    (COALESCE(ici.actual_quantity, 0) - COALESCE(ici.system_quantity, 0)),
    CASE WHEN (COALESCE(ici.actual_quantity, 0) - COALESCE(ici.system_quantity, 0)) > 0
         THEN COALESCE(ici.cost, p.cost, 0) ELSE 0::NUMERIC END,
    CASE WHEN (COALESCE(ici.actual_quantity, 0) - COALESCE(ici.system_quantity, 0)) < 0
         THEN COALESCE(ici.cost, p.cost, 0) ELSE 0::NUMERIC END,
    COALESCE(ici.cost, p.cost, 0),
    'Backfill kiểm kê ' || ic.id,
    FALSE
  FROM public.inventory_count_items ici
  JOIN public.inventory_counts ic ON ici.count_id = ic.id
  LEFT JOIN public.products p ON p.id = ici.product_id
  LEFT JOIN public.product_lots pl_ici ON pl_ici.id = ici.lot_id
  WHERE ic.status = 'completed'
    AND (COALESCE(ici.actual_quantity, 0) - COALESCE(ici.system_quantity, 0)) != 0;

  FOR v_rec IN
    SELECT *
    FROM tmp_stock_backfill
    ORDER BY posting_date ASC, sort_order ASC, voucher_no ASC, voucher_detail_no ASC
  LOOP
    SELECT COALESCE(SUM(actual_qty), 0)
      INTO v_balance
    FROM public.stock_movements
    WHERE product_id = v_rec.product_id
      AND (v_rec.lot_id IS NULL OR lot_id = v_rec.lot_id);

    v_qty_after := v_balance + v_rec.actual_qty;

    PERFORM public.insert_stock_ledger_entry(
      v_rec.posting_date,
      v_rec.voucher_type,
      v_rec.voucher_no,
      v_rec.voucher_detail_no,
      v_rec.product_id,
      v_rec.lot_id,
      'Kho Chính',
      v_rec.actual_qty,
      v_qty_after,
      v_rec.valuation_rate,
      v_rec.incoming_rate,
      v_rec.outgoing_rate,
      v_rec.reason,
      v_rec.is_cancelled
    );
    v_count := v_count + 1;
  END LOOP;

  SELECT MIN(posting_date) - INTERVAL '1 day'
    INTO v_min_date
  FROM tmp_stock_backfill;

  IF v_min_date IS NULL THEN
    v_min_date := NOW() - INTERVAL '1 day';
  END IF;

  FOR v_rec IN
    SELECT
      pl.product_id,
      pl.id AS lot_id,
      COALESCE(pl.quantity, 0) AS target_qty,
      COALESCE(pl.cost, p.cost, 0) AS valuation_rate
    FROM public.product_lots pl
    JOIN public.products p ON p.id = pl.product_id
  LOOP
    SELECT COALESCE(SUM(actual_qty), 0)
      INTO v_balance
    FROM public.stock_movements
    WHERE product_id = v_rec.product_id
      AND (v_rec.lot_id IS NULL OR lot_id = v_rec.lot_id);

    IF v_balance != v_rec.target_qty THEN
      v_opening_id := 'OPENING-' || COALESCE(v_rec.lot_id, v_rec.product_id);
      PERFORM public.insert_stock_ledger_entry(
        v_min_date,
        'Stock Reconciliation',
        'OPENING-BALANCE',
        v_opening_id,
        v_rec.product_id,
        v_rec.lot_id,
        'Kho Chính',
        v_rec.target_qty - v_balance,
        v_rec.target_qty,
        v_rec.valuation_rate,
        CASE WHEN (v_rec.target_qty - v_balance) > 0 THEN v_rec.valuation_rate ELSE 0 END,
        CASE WHEN (v_rec.target_qty - v_balance) < 0 THEN v_rec.valuation_rate ELSE 0 END,
        'Điều chỉnh đầu kỳ để khớp tồn kho lô',
        FALSE
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  FOR v_rec IN
    SELECT
      p.id AS product_id,
      NULL::TEXT AS lot_id,
      COALESCE(p.quantity, 0) AS target_qty,
      COALESCE(p.cost, 0) AS valuation_rate
    FROM public.products p
    WHERE p.has_lots = FALSE OR p.has_lots IS NULL
  LOOP
    SELECT COALESCE(SUM(actual_qty), 0)
      INTO v_balance
    FROM public.stock_movements
    WHERE product_id = v_rec.product_id
      AND lot_id IS NULL;

    IF v_balance != v_rec.target_qty THEN
      v_opening_id := 'OPENING-' || v_rec.product_id;
      PERFORM public.insert_stock_ledger_entry(
        v_min_date,
        'Stock Reconciliation',
        'OPENING-BALANCE',
        v_opening_id,
        v_rec.product_id,
        NULL,
        'Kho Chính',
        v_rec.target_qty - v_balance,
        v_rec.target_qty,
        v_rec.valuation_rate,
        CASE WHEN (v_rec.target_qty - v_balance) > 0 THEN v_rec.valuation_rate ELSE 0 END,
        CASE WHEN (v_rec.target_qty - v_balance) < 0 THEN v_rec.valuation_rate ELSE 0 END,
        'Điều chỉnh đầu kỳ để khớp tồn kho sản phẩm',
        FALSE
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'message', 'Backfill stock_ledger xong',
    'entries_inserted', v_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."backfill_stock_ledger_v2"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count integer := 0;
  v_lot_id text;
  v_rate numeric;
  v_rec record;
  v_alloc record;
  v_movement record;
  v_balance numeric;
BEGIN
  -- Temporary table for all reconstructed lines.
  CREATE TEMP TABLE IF NOT EXISTS tmp_stock_backfill_v2 (
    tmp_id bigserial PRIMARY KEY,
    line_id integer,
    posting_date timestamp with time zone NOT NULL,
    sort_order integer NOT NULL,
    voucher_type text NOT NULL,
    voucher_no text NOT NULL,
    voucher_detail_no text NOT NULL,
    product_id text NOT NULL,
    lot_id text,
    warehouse text NOT NULL,
    actual_qty numeric NOT NULL,
    valuation_rate numeric,
    incoming_rate numeric,
    outgoing_rate numeric,
    reason text,
    is_cancelled boolean NOT NULL DEFAULT FALSE
  ) ON COMMIT DROP;

  TRUNCATE tmp_stock_backfill_v2;

  -- -------------------------------------------------------
  -- A. Purchase Receipts (incoming)
  -- -------------------------------------------------------
  FOR v_rec IN
    SELECT
      ir.id AS receipt_id,
      ir.date AS posting_date,
      ii.id AS item_id,
      ii.product_id,
      p.has_lots,
      ii.lot_code,
      ii.expiry_date::date AS expiry_date,
      ii.quantity,
      ii.cost
    FROM public.import_receipts ir
    JOIN public.import_items ii ON ii.receipt_id = ir.id
    JOIN public.products p ON p.id = ii.product_id
    WHERE ir.status != 'cancelled'
      AND ii.quantity > 0
  LOOP
    v_lot_id := public.backfill_v2_resolve_lot(v_rec.product_id, NULL, v_rec.lot_code, v_rec.expiry_date, 'fifo');
    IF v_lot_id IS NULL AND v_rec.has_lots THEN
      v_lot_id := public.backfill_v2_ensure_lot(v_rec.product_id, v_rec.lot_code, v_rec.expiry_date);
    END IF;

    INSERT INTO tmp_stock_backfill_v2 (
      posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
      product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
    ) VALUES (
      v_rec.posting_date,
      1,
      'Purchase Receipt',
      v_rec.receipt_id,
      v_rec.item_id,
      v_rec.product_id,
      v_lot_id,
      'Kho Chính',
      v_rec.quantity,
      COALESCE(v_rec.cost, 0),
      COALESCE(v_rec.cost, 0),
      0,
      'Nhập hàng',
      FALSE
    );
  END LOOP;

  -- -------------------------------------------------------
  -- B. Delivery Notes from return orders (incoming)
  -- -------------------------------------------------------
  FOR v_rec IN
    SELECT
      ro.id AS return_id,
      COALESCE(ro.date, ro.created_at) AS posting_date,
      roi.id AS item_id,
      roi.product_id,
      p.has_lots,
      roi.lot_id AS original_lot_id,
      roi.lot_code,
      roi.quantity,
      COALESCE(oi.cost, p.cost, 0) AS cost
    FROM public.return_orders ro
    JOIN public.return_order_items roi ON roi.return_order_id = ro.id
    JOIN public.products p ON p.id = roi.product_id
    LEFT JOIN public.order_items oi ON oi.order_id = ro.original_order_id AND oi.product_id = roi.product_id
    WHERE ro.status != 'cancelled'
      AND roi.quantity > 0
  LOOP
    v_lot_id := public.backfill_v2_resolve_lot(v_rec.product_id, v_rec.original_lot_id, v_rec.lot_code, NULL, 'fifo');
    IF v_lot_id IS NULL AND v_rec.has_lots THEN
      v_lot_id := public.backfill_v2_ensure_lot(v_rec.product_id, v_rec.lot_code, NULL);
    END IF;

    INSERT INTO tmp_stock_backfill_v2 (
      posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
      product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
    ) VALUES (
      v_rec.posting_date,
      2,
      'Delivery Note',
      v_rec.return_id,
      v_rec.item_id,
      v_rec.product_id,
      v_lot_id,
      'Kho Chính',
      v_rec.quantity,
      COALESCE(v_rec.cost, 0),
      COALESCE(v_rec.cost, 0),
      0,
      'Trả hàng',
      FALSE
    );
  END LOOP;

  -- -------------------------------------------------------
  -- C. Sales Invoices (outgoing)
  -- -------------------------------------------------------
  FOR v_rec IN
    SELECT
      o.id AS order_id,
      COALESCE(o.created_at, NOW()) AS posting_date,
      oi.id AS item_id,
      oi.product_id,
      p.has_lots,
      oi.lot_id AS original_lot_id,
      oi.lot_code,
      oi.quantity,
      COALESCE(oi.cost, p.cost, 0) AS cost
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    JOIN public.products p ON p.id = oi.product_id
    WHERE o.status != 'cancelled'
      AND oi.quantity > 0
  LOOP
    v_lot_id := public.backfill_v2_resolve_lot(v_rec.product_id, v_rec.original_lot_id, v_rec.lot_code, NULL, 'fifo');
    IF v_lot_id IS NULL AND v_rec.has_lots THEN
      v_lot_id := public.backfill_v2_ensure_lot(v_rec.product_id, v_rec.lot_code, NULL);
    END IF;

    INSERT INTO tmp_stock_backfill_v2 (
      posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
      product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
    ) VALUES (
      v_rec.posting_date,
      4,
      'Sales Invoice',
      v_rec.order_id,
      v_rec.item_id,
      v_rec.product_id,
      v_lot_id,
      'Kho Chính',
      -v_rec.quantity,
      COALESCE(v_rec.cost, 0),
      0,
      COALESCE(v_rec.cost, 0),
      'Bán hàng',
      FALSE
    );
  END LOOP;

  -- -------------------------------------------------------
  -- D. Stock Entry (disposals) (outgoing)
  -- -------------------------------------------------------
  FOR v_rec IN
    SELECT
      d.id AS disposal_id,
      COALESCE(d.date, d.created_at) AS posting_date,
      di.id AS item_id,
      di.product_id,
      p.has_lots,
      di.lot_id AS original_lot_id,
      di.lot_code,
      di.quantity,
      COALESCE(di.cost_price, p.cost, 0) AS cost
    FROM public.disposals d
    JOIN public.disposal_items di ON di.disposal_id = d.id
    JOIN public.products p ON p.id = di.product_id
    WHERE d.status != 'cancelled'
      AND di.quantity > 0
  LOOP
    v_lot_id := public.backfill_v2_resolve_lot(v_rec.product_id, v_rec.original_lot_id, v_rec.lot_code, NULL, 'fifo');
    IF v_lot_id IS NULL AND v_rec.has_lots THEN
      v_lot_id := public.backfill_v2_ensure_lot(v_rec.product_id, v_rec.lot_code, NULL);
    END IF;

    INSERT INTO tmp_stock_backfill_v2 (
      posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
      product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
    ) VALUES (
      v_rec.posting_date,
      5,
      'Stock Entry',
      v_rec.disposal_id,
      v_rec.item_id,
      v_rec.product_id,
      v_lot_id,
      'Kho Chính',
      -v_rec.quantity,
      COALESCE(v_rec.cost, 0),
      0,
      COALESCE(v_rec.cost, 0),
      'Xuất hủy',
      FALSE
    );
  END LOOP;

  -- -------------------------------------------------------
  -- E. Inventory Counts (positive and negative variances)
  -- -------------------------------------------------------
  FOR v_rec IN
    SELECT
      ic.id AS count_id,
      COALESCE(ic.completed_at, ic.date, ic.created_at) AS posting_date,
      ici.id AS item_id,
      ici.product_id,
      p.has_lots,
      ici.lot_id AS original_lot_id,
      ici.lot_code,
      ici.expiry_date,
      ici.system_quantity,
      ici.actual_quantity,
      (ici.actual_quantity - ici.system_quantity) AS variance,
      COALESCE(ici.cost, p.cost, 0) AS cost
    FROM public.inventory_counts ic
    JOIN public.inventory_count_items ici ON ici.count_id = ic.id
    JOIN public.products p ON p.id = ici.product_id
    WHERE ic.status != 'cancelled'
      AND (ici.actual_quantity - ici.system_quantity) <> 0
  LOOP
    -- If a valid lot_id was provided on the count line, use it directly.
    IF EXISTS (SELECT 1 FROM public.product_lots WHERE id = v_rec.original_lot_id AND product_id = v_rec.product_id) THEN
      v_lot_id := v_rec.original_lot_id;

      INSERT INTO tmp_stock_backfill_v2 (
        posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
        product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
      ) VALUES (
        v_rec.posting_date,
        CASE WHEN v_rec.variance > 0 THEN 3 ELSE 6 END,
        'Stock Reconciliation',
        v_rec.count_id,
        v_rec.item_id,
        v_rec.product_id,
        v_lot_id,
        'Kho Chính',
        v_rec.variance,
        COALESCE(v_rec.cost, 0),
        CASE WHEN v_rec.variance > 0 THEN COALESCE(v_rec.cost, 0) ELSE 0 END,
        CASE WHEN v_rec.variance < 0 THEN COALESCE(v_rec.cost, 0) ELSE 0 END,
        'Kiểm kê kho',
        FALSE
      );
    ELSE
      -- Missing or invalid lot_id: allocate the variance per helper rules.
      FOR v_alloc IN SELECT * FROM public.backfill_v2_allocate_variance(v_rec.product_id, v_rec.variance)
      LOOP
        v_lot_id := v_alloc.lot_id;
        IF v_lot_id IS NULL AND v_rec.has_lots THEN
          v_lot_id := public.backfill_v2_ensure_lot(v_rec.product_id, v_rec.lot_code, v_rec.expiry_date);
        END IF;

        INSERT INTO tmp_stock_backfill_v2 (
          posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
          product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
        ) VALUES (
          v_rec.posting_date,
          CASE WHEN v_alloc.qty > 0 THEN 3 ELSE 6 END,
          'Stock Reconciliation',
          v_rec.count_id,
          v_rec.item_id,
          v_rec.product_id,
          v_lot_id,
          'Kho Chính',
          v_alloc.qty,
          COALESCE(v_rec.cost, 0),
          CASE WHEN v_alloc.qty > 0 THEN COALESCE(v_rec.cost, 0) ELSE 0 END,
          CASE WHEN v_alloc.qty < 0 THEN COALESCE(v_rec.cost, 0) ELSE 0 END,
          'Kiểm kê kho',
          FALSE
        );
      END LOOP;
    END IF;
  END LOOP;

  -- -------------------------------------------------------
  -- F. Insert opening-balance adjustments per (product_id, lot_id)
  -- so that SUM(actual_qty) over the lot equals product_lots.quantity.
  -- -------------------------------------------------------
  FOR v_rec IN
    SELECT
      pl.product_id,
      pl.id AS lot_id,
      COALESCE(pl.quantity, 0) AS target_qty,
      COALESCE(pl.cost, 0) AS lot_cost
    FROM public.product_lots pl
  LOOP
    SELECT COALESCE(SUM(actual_qty), 0) INTO v_balance
    FROM tmp_stock_backfill_v2
    WHERE product_id = v_rec.product_id AND lot_id IS NOT DISTINCT FROM v_rec.lot_id;

    IF v_balance <> v_rec.target_qty THEN
      INSERT INTO tmp_stock_backfill_v2 (
        posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
        product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
      ) VALUES (
        '1900-01-01 00:00:00+00'::timestamp with time zone,
        0,
        'OPENING-BALANCE',
        v_rec.product_id,
        'OB-' || COALESCE(v_rec.lot_id, 'NULL'),
        v_rec.product_id,
        v_rec.lot_id,
        'Kho Chính',
        v_rec.target_qty - v_balance,
        COALESCE(v_rec.lot_cost, 0),
        CASE WHEN v_rec.target_qty > v_balance THEN COALESCE(v_rec.lot_cost, 0) ELSE 0 END,
        CASE WHEN v_rec.target_qty < v_balance THEN COALESCE(v_rec.lot_cost, 0) ELSE 0 END,
        'Điều chỉnh tồn đầu kỳ',
        FALSE
      );
    END IF;
  END LOOP;

  -- Also handle non-lot products (no lot rows) so their product.quantity matches the ledger.
  FOR v_rec IN
    SELECT
      p.id AS product_id,
      COALESCE(p.quantity, 0) AS target_qty,
      COALESCE(p.cost, 0) AS product_cost
    FROM public.products p
    WHERE COALESCE(p.has_lots, FALSE) = FALSE
  LOOP
    SELECT COALESCE(SUM(actual_qty), 0) INTO v_balance
    FROM tmp_stock_backfill_v2
    WHERE product_id = v_rec.product_id AND lot_id IS NULL;

    IF v_balance <> v_rec.target_qty THEN
      INSERT INTO tmp_stock_backfill_v2 (
        posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no,
        product_id, lot_id, warehouse, actual_qty, valuation_rate, incoming_rate, outgoing_rate, reason, is_cancelled
      ) VALUES (
        '1900-01-01 00:00:00+00'::timestamp with time zone,
        0,
        'OPENING-BALANCE',
        v_rec.product_id,
        'OB-' || v_rec.product_id,
        v_rec.product_id,
        NULL,
        'Kho Chính',
        v_rec.target_qty - v_balance,
        COALESCE(v_rec.product_cost, 0),
        CASE WHEN v_rec.target_qty > v_balance THEN COALESCE(v_rec.product_cost, 0) ELSE 0 END,
        CASE WHEN v_rec.target_qty < v_balance THEN COALESCE(v_rec.product_cost, 0) ELSE 0 END,
        'Điều chỉnh tồn đầu kỳ',
        FALSE
      );
    END IF;
  END LOOP;

  -- -------------------------------------------------------
  -- G. Assign deterministic ordering to the temp table
  -- -------------------------------------------------------
  UPDATE tmp_stock_backfill_v2 t
  SET line_id = s.rn
  FROM (
    SELECT tmp_id, row_number() OVER (ORDER BY posting_date, sort_order, voucher_type, voucher_no, voucher_detail_no) AS rn
    FROM tmp_stock_backfill_v2
  ) s
  WHERE t.tmp_id = s.tmp_id;

  -- -------------------------------------------------------
  -- H. Write rows to stock_movements with cumulative qty_after_transaction
  -- -------------------------------------------------------
  FOR v_movement IN
    SELECT *
    FROM tmp_stock_backfill_v2
    ORDER BY line_id
  LOOP
    SELECT COALESCE(SUM(actual_qty), 0) INTO v_balance
    FROM tmp_stock_backfill_v2 t
    WHERE t.product_id = v_movement.product_id
      AND t.lot_id IS NOT DISTINCT FROM v_movement.lot_id
      AND t.line_id < v_movement.line_id;

    PERFORM public.insert_stock_ledger_entry(
      v_movement.posting_date,
      v_movement.voucher_type,
      v_movement.voucher_no,
      v_movement.voucher_detail_no,
      v_movement.product_id,
      v_movement.lot_id,
      v_movement.warehouse,
      v_movement.actual_qty,
      v_balance + v_movement.actual_qty,
      v_movement.valuation_rate,
      v_movement.incoming_rate,
      v_movement.outgoing_rate,
      v_movement.reason,
      v_movement.is_cancelled
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'rows_processed', v_count,
    'message', 'Backfill completed. Check product/lot totals.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."backfill_v2_allocate_variance"("p_product_id" "text", "p_variance" numeric) RETURNS TABLE("lot_id" "text", "qty" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_remaining numeric := p_variance;
  v_lot record;
  v_alloc numeric;
  v_first_lot_id text;
BEGIN
  IF p_variance = 0 THEN
    RETURN;
  END IF;

  -- No existing lots: return a single row with NULL lot_id. Caller must create a placeholder lot for lot-products.
  IF NOT EXISTS (SELECT 1 FROM public.product_lots WHERE product_id = p_product_id) THEN
    RETURN QUERY SELECT NULL::text, p_variance;
    RETURN;
  END IF;

  IF p_variance > 0 THEN
    SELECT pl.id INTO lot_id
    FROM public.product_lots pl
    WHERE pl.product_id = p_product_id
    ORDER BY pl.expiry_date DESC NULLS FIRST, pl.created_at DESC
    LIMIT 1;
    RETURN QUERY SELECT lot_id, p_variance;
  ELSE
    -- Negative variance: consume FIFO lots, capped at each lot's current quantity.
    FOR v_lot IN
      SELECT pl.id, pl.quantity
      FROM public.product_lots pl
      WHERE pl.product_id = p_product_id
      ORDER BY pl.expiry_date ASC NULLS LAST, pl.created_at ASC
    LOOP
      EXIT WHEN v_remaining >= 0;
      v_alloc := GREATEST(-LEAST(ABS(v_remaining), v_lot.quantity), v_remaining);
      IF v_alloc < 0 THEN
        v_remaining := v_remaining - v_alloc;
        RETURN QUERY SELECT v_lot.id, v_alloc;
      END IF;
    END LOOP;

    -- If still remaining negative, dump on the first FIFO lot.
    IF v_remaining < 0 THEN
      SELECT id INTO v_first_lot_id
      FROM public.product_lots
      WHERE product_id = p_product_id
      ORDER BY expiry_date ASC NULLS LAST, created_at ASC
      LIMIT 1;
      RETURN QUERY SELECT v_first_lot_id, v_remaining;
    END IF;
  END IF;
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."backfill_v2_ensure_lot"("p_product_id" "text", "p_lot_code" "text" DEFAULT NULL::"text", "p_expiry_date" "date" DEFAULT NULL::"date") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_lot_id text;
  v_lot_code text;
  v_cost numeric;
BEGIN
  -- Non-lot products do not need a placeholder.
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id AND COALESCE(has_lots, FALSE) = TRUE) THEN
    RETURN NULL;
  END IF;

  -- If lots already exist, do nothing.
  IF EXISTS (SELECT 1 FROM public.product_lots WHERE product_id = p_product_id) THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(cost, 0) INTO v_cost FROM public.products WHERE id = p_product_id;
  v_lot_code := COALESCE(p_lot_code, 'RECOVER-' || LEFT(gen_random_uuid()::text, 8));

  INSERT INTO public.product_lots (
    id, product_id, code, expiry_date, quantity, original_quantity, cost, created_at, updated_at
  ) VALUES (
    gen_random_uuid()::text, p_product_id, v_lot_code, p_expiry_date, 0, 0, v_cost, NOW(), NOW()
  )
  RETURNING id INTO v_lot_id;

  RETURN v_lot_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."backfill_v2_resolve_lot"("p_product_id" "text", "p_lot_id" "text" DEFAULT NULL::"text", "p_lot_code" "text" DEFAULT NULL::"text", "p_expiry_date" "date" DEFAULT NULL::"date", "p_direction" "text" DEFAULT 'fifo'::"text") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_lot_id text;
BEGIN
  -- 1. If the proposed lot_id is valid for this product, use it.
  IF p_lot_id IS NOT NULL THEN
    SELECT id INTO v_lot_id
    FROM public.product_lots
    WHERE id = p_lot_id AND product_id = p_product_id
    LIMIT 1;
  END IF;

  -- 2. Try to match by lot_code (and expiry_date if supplied).
  IF v_lot_id IS NULL AND p_lot_code IS NOT NULL THEN
    IF p_expiry_date IS NOT NULL THEN
      SELECT id INTO v_lot_id
      FROM public.product_lots
      WHERE product_id = p_product_id
        AND code = p_lot_code
        AND expiry_date IS NOT DISTINCT FROM p_expiry_date
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;

    IF v_lot_id IS NULL THEN
      SELECT id INTO v_lot_id
      FROM public.product_lots
      WHERE product_id = p_product_id
        AND code = p_lot_code
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;
  END IF;

  -- 3. If there is exactly one lot for this product, use it.
  IF v_lot_id IS NULL THEN
    IF (SELECT COUNT(*) FROM public.product_lots WHERE product_id = p_product_id) = 1 THEN
      SELECT id INTO v_lot_id FROM public.product_lots WHERE product_id = p_product_id;
    END IF;
  END IF;

  -- 4. Fallback to FIFO or FEFO across the product's lots.
  IF v_lot_id IS NULL THEN
    IF p_direction = 'fifo' THEN
      SELECT id INTO v_lot_id
      FROM public.product_lots
      WHERE product_id = p_product_id
      ORDER BY expiry_date ASC NULLS LAST, created_at ASC
      LIMIT 1;
    ELSIF p_direction = 'fefo' THEN
      SELECT id INTO v_lot_id
      FROM public.product_lots
      WHERE product_id = p_product_id
      ORDER BY expiry_date DESC NULLS FIRST, created_at DESC
      LIMIT 1;
    END IF;
  END IF;

  RETURN v_lot_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."bulk_update_tenants"("p_tenant_ids" "uuid"[], "p_status" "text" DEFAULT NULL::"text", "p_plan" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_id UUID;
  v_tenant public.tenants%ROWTYPE;
  v_updated_ids UUID[] := ARRAY[]::UUID[];
  v_skipped_ids UUID[] := ARRAY[]::UUID[];
  v_count INTEGER := 0;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được bulk update tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_tenant_ids IS NULL OR array_length(p_tenant_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Danh sách tenant không được để trống';
  END IF;

  IF p_status IS NULL AND p_plan IS NULL THEN
    RAISE EXCEPTION 'Phải cung cấp ít nhất status hoặc plan để cập nhật';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('active', 'suspended', 'trial', 'pending', 'archived', 'read_only') THEN
    RAISE EXCEPTION 'Trạng thái tenant không hợp lệ: %', p_status;
  END IF;

  IF p_plan IS NOT NULL AND NOT public.is_valid_plan(p_plan) THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', p_plan;
  END IF;

  FOREACH v_id IN ARRAY p_tenant_ids LOOP
    SELECT * INTO v_tenant FROM public.tenants WHERE id = v_id;
    IF NOT FOUND THEN
      v_skipped_ids := array_append(v_skipped_ids, v_id);
      CONTINUE;
    END IF;

    UPDATE public.tenants
    SET status = COALESCE(p_status, status),
        plan = COALESCE(p_plan, plan),
        updated_at = now(),
        archived_at = CASE WHEN COALESCE(p_status, status) = 'archived' THEN now() ELSE NULL END
    WHERE id = v_id
    RETURNING * INTO v_tenant;

    v_updated_ids := array_append(v_updated_ids, v_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN json_build_object(
    'updated', v_count,
    'updatedIds', v_updated_ids,
    'skippedIds', v_skipped_ids
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."calc_qty_after_transaction"("p_product_id" "text", "p_lot_id" "text", "p_actual_qty" numeric) RETURNS numeric
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(actual_qty), 0) INTO v_balance
  FROM public.stock_movements
  WHERE product_id = p_product_id
    AND lot_id IS NOT DISTINCT FROM p_lot_id
    AND is_cancelled = FALSE;
  RETURN v_balance + p_actual_qty;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."calc_qty_after_transaction"("p_product_id" "text", "p_lot_id" "text", "p_actual_qty" numeric, "p_tenant_id" "uuid" DEFAULT NULL::"uuid") RETURNS numeric
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_balance NUMERIC;
  v_tenant_id UUID := COALESCE(p_tenant_id, public.current_tenant_id());
BEGIN
  SELECT COALESCE(SUM(actual_qty), 0) INTO v_balance
  FROM public.stock_movements
  WHERE product_id = p_product_id
    AND lot_id IS NOT DISTINCT FROM p_lot_id
    AND is_cancelled = FALSE
    AND (v_tenant_id IS NULL OR tenant_id = v_tenant_id);
  RETURN v_balance + p_actual_qty;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."cancel_inventory_count_rpc"("p_count_id" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_status TEXT;
  v_count_code TEXT;
  item RECORD;
  v_product RECORD;
  v_diff NUMERIC;
  v_qty_after NUMERIC;
  v_valuation_rate NUMERIC;
  v_lot_id TEXT;
BEGIN
  -- 1. Khóa header phiếu
  SELECT status, code INTO v_status, v_count_code
  FROM inventory_counts WHERE id = p_count_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phiếu kiểm kê không tồn tại';
  END IF;

  -- Chỉ cho hủy phiếu draft hoặc completed (cancelled thì đã hủy rồi)
  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'Phiếu kiểm kê đã bị hủy trước đó';
  END IF;

  -- 2. Nếu phiếu đã completed -> hoàn kho (bút toán đảo), KHÔNG xóa cứng
  IF v_status = 'completed' THEN
    FOR item IN
      SELECT id, product_id, actual_quantity, system_quantity, lot_id, lot_code, reason
      FROM inventory_count_items WHERE count_id = p_count_id
    LOOP
      -- Khóa dòng sản phẩm
      SELECT has_lots INTO v_product FROM products WHERE id = item.product_id FOR UPDATE;
      v_diff := item.actual_quantity - item.system_quantity;
      v_lot_id := item.lot_id;

      IF NOT v_product.has_lots THEN
        -- Trả lại tồn tổng sản phẩm không lô
        UPDATE products SET quantity = quantity - v_diff WHERE id = item.product_id;
      ELSE
        -- Đối với sản phẩm quản lý lô
        IF v_lot_id IS NOT NULL THEN
          -- Nếu lô tồn tại -> cập nhật chênh lệch
          IF EXISTS(SELECT 1 FROM product_lots WHERE id = v_lot_id) THEN
            UPDATE product_lots
            SET quantity = GREATEST(0, quantity - v_diff), updated_at = NOW()
            WHERE id = v_lot_id;
          ELSIF -v_diff > 0 THEN
            -- Lô đã bị xóa và chênh lệch là hoàn kho (v_diff âm -> -v_diff dương) -> Phục hồi lô
            INSERT INTO product_lots (id, product_id, code, quantity, original_quantity, created_at, updated_at)
            VALUES (v_lot_id, item.product_id, COALESCE(item.lot_code, 'RECOVERED_CNT'), -v_diff, -v_diff, NOW(), NOW());
          END IF;
        ELSIF item.lot_code IS NOT NULL AND TRIM(item.lot_code) != '' THEN
          IF EXISTS(SELECT 1 FROM product_lots WHERE product_id = item.product_id AND code = TRIM(item.lot_code)) THEN
            UPDATE product_lots
            SET quantity = GREATEST(0, quantity - v_diff), updated_at = NOW()
            WHERE product_id = item.product_id AND code = TRIM(item.lot_code);
            SELECT id INTO v_lot_id FROM product_lots WHERE product_id = item.product_id AND code = TRIM(item.lot_code) LIMIT 1;
          ELSIF -v_diff > 0 THEN
            v_lot_id := 'lot_rec_' || item.product_id || '_' || FLOOR(EXTRACT(EPOCH FROM NOW()))::TEXT;
            INSERT INTO product_lots (id, product_id, code, quantity, original_quantity, created_at, updated_at)
            VALUES (v_lot_id, item.product_id, TRIM(item.lot_code), -v_diff, -v_diff, NOW(), NOW());
          END IF;
        END IF;

        -- Phase 6: đồng bộ tường minh tồn tổng từ product_lots
        PERFORM sync_product_quantity_from_lots(item.product_id);
      END IF;

      -- Phase 7b: GHI BÚT TOÁN ĐẢO (chỉ khi có chênh lệch)
      IF v_diff != 0 THEN
        v_valuation_rate := get_product_valuation_rate(item.product_id, v_lot_id);
        v_qty_after := public.calc_qty_after_transaction(item.product_id, v_lot_id, -v_diff);

        PERFORM insert_stock_ledger_entry(
          NOW(),
          'Stock Reconciliation'::TEXT,
          v_count_code,
          item.id::TEXT,
          item.product_id,
          v_lot_id,
          'Kho Chính'::TEXT,
          -v_diff,
          v_qty_after,
          v_valuation_rate,
          0::NUMERIC,
          0::NUMERIC,
          COALESCE(item.reason, 'Hủy phiếu kiểm kê'),
          TRUE
        );
      END IF;
    END LOOP;
  END IF;

  -- 3. Đổi trạng thái thành cancelled (KHÔNG xóa cứng — giữ lịch sử)
  UPDATE inventory_counts
  SET status = 'cancelled', completed_at = NULL
  WHERE id = p_count_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."cancel_order"("p_order_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order             RECORD;
  v_item              RECORD;
  v_product           RECORD;
  v_active_returns    INTEGER;
  v_points_diff       NUMERIC;
  v_ratio             NUMERIC;
  v_base_qty          NUMERIC;
  v_conv              JSONB;
  v_first_lot_id      TEXT;
BEGIN
  IF p_order_id IS NULL OR p_order_id = '' THEN RAISE EXCEPTION 'order_id is required'; END IF;

  SELECT id, customer_id, total_amount, paid_amount, debt_recorded, points_earned, points_redeemed, has_return, status INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Đơn hàng % không tồn tại', p_order_id; END IF;
  IF v_order.status = 'cancelled' THEN RAISE EXCEPTION 'Đơn hàng % đã ở trạng thái Đã huỷ', p_order_id USING ERRCODE = 'P0001'; END IF;

  SELECT COUNT(*) INTO v_active_returns FROM return_orders WHERE original_order_id = p_order_id AND status != 'cancelled';
  IF v_active_returns > 0 THEN RAISE EXCEPTION 'Đơn hàng % đã có % phiếu trả còn hiệu lực. Vui lòng huỷ các phiếu trả trước khi huỷ đơn.', p_order_id, v_active_returns USING ERRCODE = 'P0001'; END IF;

  FOR v_item IN SELECT product_id, product_name, quantity, unit_name, lot_id FROM order_items WHERE order_id = p_order_id LOOP
    SELECT id, name, unit, conversion_units, has_lots INTO v_product FROM products WHERE id = v_item.product_id FOR UPDATE;
    IF NOT FOUND THEN RAISE NOTICE 'Sản phẩm % đã bị xoá, không hoàn kho được', v_item.product_id; CONTINUE; END IF;
    v_ratio := 1;
    IF v_item.unit_name IS NOT NULL AND v_item.unit_name != v_product.unit THEN
      IF jsonb_typeof(v_product.conversion_units) = 'array' THEN
        FOR v_conv IN SELECT * FROM jsonb_array_elements(v_product.conversion_units) LOOP
          IF v_conv->>'name' = v_item.unit_name THEN v_ratio := COALESCE((v_conv->>'ratio')::NUMERIC, 1); EXIT; END IF;
        END LOOP;
      END IF;
    END IF;
    v_base_qty := v_item.quantity * v_ratio;
    IF v_product.has_lots THEN
      IF v_item.lot_id IS NOT NULL AND EXISTS(SELECT 1 FROM product_lots WHERE id = v_item.lot_id) THEN
        UPDATE product_lots SET quantity = COALESCE(quantity, 0) + v_base_qty, updated_at = NOW() WHERE id = v_item.lot_id;
      ELSE
        SELECT id INTO v_first_lot_id FROM product_lots WHERE product_id = v_product.id ORDER BY expiry_date ASC NULLS LAST, created_at ASC LIMIT 1 FOR UPDATE;
        IF v_first_lot_id IS NOT NULL THEN
          UPDATE product_lots SET quantity = COALESCE(quantity, 0) + v_base_qty, updated_at = NOW() WHERE id = v_first_lot_id;
        ELSE
          INSERT INTO product_lots (id, product_id, code, quantity, original_quantity)
          VALUES ('LOT_REC_' || v_product.id || '_' || extract(epoch from NOW())::bigint, v_product.id, 'RECOVERED', v_base_qty, v_base_qty);
        END IF;
        PERFORM sync_product_quantity_from_lots(v_product.id);
      END IF;
    ELSE
      UPDATE products SET quantity = COALESCE(quantity, 0) + v_base_qty WHERE id = v_product.id;
    END IF;
  END LOOP;

  IF v_order.customer_id IS NOT NULL AND v_order.customer_id != 'guest' THEN
    v_points_diff := COALESCE(v_order.points_redeemed, 0) - COALESCE(v_order.points_earned, 0);
    UPDATE customers SET
      total_spent    = GREATEST(0, COALESCE(total_spent, 0) - COALESCE(v_order.total_amount, 0)),
      debt           = GREATEST(0, COALESCE(debt, 0) - COALESCE(v_order.debt_recorded, 0)),
      loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) + v_points_diff),
      updated_at     = NOW()
    WHERE id = v_order.customer_id;

    -- Phase 8b: GHI BÚT TOÁN CÔNG NỢ KH (cancel Sales Invoice đảo nợ)
    IF COALESCE(v_order.debt_recorded, 0) > 0 THEN
      PERFORM public.insert_customer_ledger_entry(
        p_customer_id    := v_order.customer_id,
        p_reference_type := 'cancel_order',
        p_reference_id   := p_order_id,
        p_amount         := -COALESCE(v_order.debt_recorded, 0),
        p_reason         := 'Hủy đơn ' || p_order_id || ' — đảo nợ',
        p_created_by     := COALESCE(current_setting('request.jwt.claim.sub', true), 'system'),
        p_created_at     := NOW()
      );
    END IF;
  END IF;

  DELETE FROM point_history WHERE order_id = p_order_id;

  UPDATE orders SET
    status        = 'cancelled',
    cancelled_at  = NOW(),
    debt_recorded = 0,
    points_earned = 0,
    points_redeemed = 0
  WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', true, 'cancelled_order_id', p_order_id, 'cancelled_at', NOW());
END;
$$;

CREATE OR REPLACE FUNCTION "public"."cancel_return_order_v2"("p_return_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_return          RECORD;
  v_item            RECORD;
  v_product         RECORD;
  v_remaining_total NUMERIC;
  v_allow_negative  BOOLEAN := FALSE;
  v_lot_qty         NUMERIC;
  v_prod_qty        NUMERIC;
  v_qty_after       NUMERIC;
  v_valuation_rate  NUMERIC;
BEGIN
  IF p_return_id IS NULL OR p_return_id = '' THEN RAISE EXCEPTION 'return_id is required'; END IF;

  SELECT id, original_order_id, total_refund_amount, debt_reduction, customer_id, status, points_deducted INTO v_return FROM return_orders WHERE id = p_return_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Phiếu trả % không tồn tại', p_return_id; END IF;
  IF v_return.status = 'cancelled' THEN RAISE EXCEPTION 'Phiếu trả % đã bị huỷ trước đó', p_return_id; END IF;

  BEGIN
    SELECT COALESCE(allow_negative_stock, FALSE) INTO v_allow_negative FROM app_settings WHERE id = 'default';
  EXCEPTION WHEN OTHERS THEN v_allow_negative := FALSE; END;

  UPDATE return_orders SET status = 'cancelled', updated_at = NOW() WHERE id = p_return_id;

  FOR v_item IN SELECT id, product_id, quantity, lot_id, lot_code FROM return_order_items WHERE return_order_id = p_return_id LOOP
    SELECT id, has_lots INTO v_product FROM products WHERE id = v_item.product_id FOR UPDATE;
    IF v_product.has_lots AND v_item.lot_id IS NOT NULL THEN
      SELECT quantity INTO v_lot_qty FROM product_lots WHERE id = v_item.lot_id AND product_id = v_item.product_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Lô % của sản phẩm % không tồn tại', v_item.lot_id, v_item.product_id; END IF;
      IF NOT v_allow_negative AND v_lot_qty < v_item.quantity THEN RAISE EXCEPTION 'Không đủ tồn kho lô để hủy phiếu trả (cần trừ %, còn %)', v_item.quantity, v_lot_qty USING ERRCODE = 'P0001'; END IF;
      UPDATE product_lots SET quantity = quantity - v_item.quantity, updated_at = NOW() WHERE id = v_item.lot_id;
      PERFORM sync_product_quantity_from_lots(v_item.product_id);
    ELSE
      SELECT quantity INTO v_prod_qty FROM products WHERE id = v_item.product_id;
      IF NOT v_allow_negative AND v_prod_qty < v_item.quantity THEN RAISE EXCEPTION 'Không đủ tồn kho để hủy phiếu trả cho % (cần trừ %, còn %)', v_item.product_id, v_item.quantity, v_prod_qty USING ERRCODE = 'P0001'; END IF;
      UPDATE products SET quantity = quantity - v_item.quantity WHERE id = v_item.product_id;
    END IF;
    v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_item.lot_id, -v_item.quantity);
    v_valuation_rate := get_product_valuation_rate(v_item.product_id, v_item.lot_id);
    PERFORM insert_stock_ledger_entry(NOW(), 'Delivery Note'::TEXT, p_return_id, v_item.id, v_item.product_id, v_item.lot_id, 'Kho Chính'::TEXT, -v_item.quantity, v_qty_after, v_valuation_rate, v_valuation_rate, 0::NUMERIC, 'Hủy phiếu trả hàng', TRUE);
  END LOOP;

  SELECT COALESCE(SUM(total_refund_amount), 0) INTO v_remaining_total FROM return_orders WHERE original_order_id = v_return.original_order_id AND status != 'cancelled';
  UPDATE orders SET has_return = (v_remaining_total > 0), total_returned_amount = v_remaining_total WHERE id = v_return.original_order_id;

  IF v_return.customer_id IS NOT NULL THEN
    UPDATE customers
    SET total_spent    = COALESCE(total_spent, 0) + v_return.total_refund_amount,
        debt           = COALESCE(debt, 0) + v_return.debt_reduction,
        loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) + COALESCE(v_return.points_deducted, 0)),
        updated_at     = NOW()
    WHERE id = v_return.customer_id;

    -- Phase 8b: GHI BÚT TOÁN CÔNG NỢ KH (cancel Sales Return đảo nợ)
    IF COALESCE(v_return.debt_reduction, 0) > 0 THEN
      PERFORM public.insert_customer_ledger_entry(
        p_customer_id    := v_return.customer_id,
        p_reference_type := 'cancel_return',
        p_reference_id   := p_return_id,
        p_amount         := v_return.debt_reduction,
        p_reason         := 'Hủy phiếu trả ' || p_return_id || ' — hoàn lại nợ',
        p_created_by     := COALESCE(current_setting('request.jwt.claim.sub', true), 'system'),
        p_created_at     := NOW()
      );
    END IF;

    IF COALESCE(v_return.points_deducted, 0) > 0 THEN
      INSERT INTO point_history (id, customer_id, date, type, amount, description, order_id)
      VALUES ('PH_CANCEL_RET_' || p_return_id, v_return.customer_id, NOW(), 'cancel_return', v_return.points_deducted, 'Hoàn điểm do hủy phiếu trả ' || p_return_id, v_return.original_order_id);
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'cancelled_return_id', p_return_id, 'points_restored', COALESCE(v_return.points_deducted, 0));
END;
$$;

CREATE OR REPLACE FUNCTION "public"."cancel_supplier_exchange"("p_exchange_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_exchange    RECORD;
  v_return_item RECORD;
  v_received_item RECORD;
  v_lot         RECORD;
  v_qty_before  NUMERIC;
  v_restore_lot_id TEXT;

  -- Phase 6b: stock ledger
  v_stock_lot_id TEXT;
  v_stock_qty_before NUMERIC;
  v_stock_qty_after NUMERIC;
  v_valuation_rate NUMERIC;
BEGIN
  SELECT * INTO v_exchange FROM supplier_exchanges WHERE id = p_exchange_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phiếu đổi trả % không tồn tại', p_exchange_id;
  END IF;
  IF v_exchange.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'already cancelled');
  END IF;

  PERFORM 1 FROM suppliers WHERE id = v_exchange.supplier_id FOR UPDATE;

  -- Hoàn lại lô cũ (hàng trả)
  FOR v_return_item IN SELECT * FROM supplier_exchange_return_items WHERE exchange_id = p_exchange_id LOOP
    v_stock_lot_id := NULL;
    IF v_return_item.lot_id IS NOT NULL THEN
      SELECT quantity INTO v_qty_before FROM product_lots WHERE id = v_return_item.lot_id;
      IF FOUND THEN
        UPDATE product_lots
          SET quantity = quantity + v_return_item.quantity, updated_at = NOW()
        WHERE id = v_return_item.lot_id;
        v_stock_lot_id := v_return_item.lot_id;
      ELSE
        INSERT INTO product_lots (
          id, product_id, code, expiry_date, quantity, original_quantity, cost, created_at, updated_at
        ) VALUES (
          v_return_item.lot_id,
          v_return_item.product_id,
          COALESCE(v_return_item.lot_code, 'RECOVERED_DTH'),
          v_return_item.expiry_date,
          v_return_item.quantity,
          v_return_item.quantity,
          v_return_item.cost,
          NOW(),
          NOW()
        );
        v_stock_lot_id := v_return_item.lot_id;
      END IF;
    ELSIF v_return_item.lot_code IS NOT NULL THEN
      SELECT id, quantity INTO v_lot
      FROM product_lots
      WHERE product_id = v_return_item.product_id AND code = v_return_item.lot_code
      LIMIT 1;
      IF FOUND THEN
        UPDATE product_lots
          SET quantity = quantity + v_return_item.quantity, updated_at = NOW()
        WHERE id = v_lot.id;
        v_stock_lot_id := v_lot.id;
      ELSE
        v_restore_lot_id := 'lot_' || v_return_item.product_id || '_' ||
                            REGEXP_REPLACE(v_return_item.lot_code, '[^a-zA-Z0-9]', '_', 'g') ||
                            '_rest_' || FLOOR(EXTRACT(EPOCH FROM NOW()))::TEXT;
        INSERT INTO product_lots (
          id, product_id, code, expiry_date, quantity, original_quantity, cost, created_at, updated_at
        ) VALUES (
          v_restore_lot_id,
          v_return_item.product_id,
          v_return_item.lot_code,
          v_return_item.expiry_date,
          v_return_item.quantity,
          v_return_item.quantity,
          v_return_item.cost,
          NOW(),
          NOW()
        );
        v_stock_lot_id := v_restore_lot_id;
      END IF;
    END IF;

    -- Phase 6b: GHI BÚT TOÁN ĐẢO KHO — HÀNG TRẢ
    IF v_stock_lot_id IS NOT NULL THEN
      v_stock_qty_after := public.calc_qty_after_transaction(v_return_item.product_id, v_stock_lot_id, -v_return_item.quantity);
      v_valuation_rate := COALESCE(v_return_item.cost, get_product_valuation_rate(v_return_item.product_id, v_stock_lot_id), 0);

      PERFORM public.insert_stock_ledger_entry(
        NOW(),
        'Stock Entry',
        p_exchange_id,
        v_return_item.id,
        v_return_item.product_id,
        v_stock_lot_id,
        'Kho Chính',
        -v_return_item.quantity,
        v_stock_qty_after,
        v_valuation_rate,
        0::NUMERIC,
        v_valuation_rate,
        'Hủy phiếu đổi trả NCC — đảo ngược hàng trả',
        TRUE
      );
    END IF;
  END LOOP;

  -- Trừ lô mới (hàng nhận đổi)
  FOR v_received_item IN SELECT * FROM supplier_exchange_received_items WHERE exchange_id = p_exchange_id LOOP
    v_stock_lot_id := NULL;
    IF v_received_item.lot_id IS NULL THEN
      IF v_received_item.lot_code IS NOT NULL THEN
        SELECT id, quantity INTO v_lot
        FROM product_lots
        WHERE product_id = v_received_item.product_id AND code = v_received_item.lot_code
        FOR UPDATE;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Lô mới "%" không còn tồn tại, không thể hủy phiếu', v_received_item.lot_code;
        END IF;
        IF v_lot.quantity < v_received_item.quantity THEN
          RAISE EXCEPTION 'Không thể hủy phiếu: lô mới "%" đã bán giảm (còn %, cần trừ %)', v_received_item.lot_code, v_lot.quantity, v_received_item.quantity;
        END IF;
        UPDATE product_lots
          SET quantity = quantity - v_received_item.quantity, updated_at = NOW()
        WHERE id = v_lot.id;
        v_stock_lot_id := v_lot.id;
      ELSE
        RAISE EXCEPTION 'Không thể hủy phiếu: thiếu lot_id và lot_code của hàng nhận đổi';
      END IF;
    ELSE
      SELECT quantity INTO v_qty_before FROM product_lots WHERE id = v_received_item.lot_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Lô mới % không còn tồn tại, không thể hủy phiếu', v_received_item.lot_id;
      END IF;
      IF v_qty_before < v_received_item.quantity THEN
        RAISE EXCEPTION 'Không thể hủy phiếu: lô mới "%" đã bán giảm (còn %, cần trừ %)', v_received_item.lot_code, v_qty_before, v_received_item.quantity;
      END IF;
      UPDATE product_lots
        SET quantity = quantity - v_received_item.quantity, updated_at = NOW()
      WHERE id = v_received_item.lot_id;
      v_stock_lot_id := v_received_item.lot_id;
    END IF;

    -- Phase 6b: GHI BÚT TOÁN ĐẢO KHO — HÀNG NHẬN ĐỔI
    IF v_stock_lot_id IS NOT NULL THEN
      v_stock_qty_after := public.calc_qty_after_transaction(v_received_item.product_id, v_stock_lot_id, v_received_item.quantity);
      v_valuation_rate := COALESCE(v_received_item.cost, get_product_valuation_rate(v_received_item.product_id, v_stock_lot_id), 0);

      PERFORM public.insert_stock_ledger_entry(
        NOW(),
        'Stock Entry',
        p_exchange_id,
        v_received_item.id,
        v_received_item.product_id,
        v_stock_lot_id,
        'Kho Chính',
        v_received_item.quantity,
        v_stock_qty_after,
        v_valuation_rate,
        v_valuation_rate,
        0::NUMERIC,
        'Hủy phiếu đổi trả NCC — đảo ngược hàng nhận đổi',
        TRUE
      );
    END IF;
  END LOOP;

  -- Đảo ngược công nợ
  UPDATE suppliers
    SET debt = GREATEST(0, COALESCE(debt, 0) - v_exchange.debt_adjustment),
        updated_at = NOW()
  WHERE id = v_exchange.supplier_id;

  -- Phase 6b: GHI SỔ CÁI CÔNG NỢ NCC
  IF v_exchange.supplier_id IS NOT NULL AND COALESCE(v_exchange.debt_adjustment, 0) != 0 THEN
    PERFORM public.insert_supplier_ledger_entry(
      p_supplier_id    := v_exchange.supplier_id,
      p_reference_type := 'exchange',
      p_reference_id   := p_exchange_id,
      p_amount         := -v_exchange.debt_adjustment,
      p_reason         := 'Hủy phiếu đổi trả NCC ' || p_exchange_id || ' — đảo ngược công nợ',
      p_created_by     := COALESCE(current_setting('request.jwt.claim.sub', true), 'system'),
      p_created_at     := NOW()
    );
  END IF;

  UPDATE supplier_exchanges
    SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_exchange_id;

  RETURN jsonb_build_object('ok', true, 'exchange_id', p_exchange_id, 'status', 'cancelled');
END;
$$;

CREATE OR REPLACE FUNCTION "public"."check_inventory_consistency"("p_product_ids" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_prod_id TEXT;
  v_prod_qty NUMERIC;
  v_lot_sum NUMERIC;
  v_prod_name TEXT;
BEGIN
  FOREACH v_prod_id IN ARRAY p_product_ids
  LOOP
    -- Chỉ kiểm tra chéo các sản phẩm có bật quản lý lô (has_lots = TRUE)
    SELECT name, quantity INTO v_prod_name, v_prod_qty 
    FROM products 
    WHERE id = v_prod_id AND has_lots = TRUE;
    
    IF FOUND THEN
      SELECT COALESCE(SUM(quantity), 0) INTO v_lot_sum 
      FROM product_lots 
      WHERE product_id = v_prod_id;
      
      IF v_prod_qty != v_lot_sum THEN
        RAISE EXCEPTION 'Lệch tồn kho sản phẩm % (ID: %): Tồn tổng = %, Tổng chi tiết các lô = %', 
          v_prod_name, v_prod_id, v_prod_qty, v_lot_sum;
      END IF;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."check_product_barcode_exists"("p_barcode" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM products WHERE barcode = p_barcode
  );
$$;

CREATE OR REPLACE FUNCTION "public"."check_product_code_exists"("p_code" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.products WHERE sku = p_code
  );
$$;

CREATE OR REPLACE FUNCTION "public"."check_reward_points_redemption"("p_customer_id" "text", "p_reward_id" "text", "p_quantity" integer DEFAULT 1) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_points INT;
  v_cost INT;
  v_reward_name TEXT;
  v_customer_name TEXT;
BEGIN
  -- Lấy thông tin khách hàng
  SELECT 
    COALESCE(loyalty_points, 0),
    COALESCE(name, 'Unknown')
  INTO v_points, v_customer_name
  FROM customers 
  WHERE id = p_customer_id;
  
  IF v_customer_name = 'Unknown' THEN
    RAISE EXCEPTION 'Khách hàng không tồn tại (ID: %)', p_customer_id;
  END IF;
  
  -- Lấy thông tin quà
  SELECT 
    point_cost,
    COALESCE(name, 'Unknown')
  INTO v_cost, v_reward_name
  FROM rewards 
  WHERE id = p_reward_id;
  
  IF v_reward_name = 'Unknown' THEN
    RAISE EXCEPTION 'Quà tặng không tồn tại (ID: %)', p_reward_id;
  END IF;
  
  -- Kiểm tra điểm
  IF v_points < (v_cost * p_quantity) THEN
    RAISE EXCEPTION 'Không đủ điểm để đổi quà "%". Cần % điểm, hiện có % điểm.', 
      v_reward_name, (v_cost * p_quantity), v_points;
  END IF;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."check_single_einvoice_config"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (SELECT COUNT(*) FROM einvoice_config) >= 1 THEN
    RAISE EXCEPTION 'Only one einvoice_config row allowed. Use UPDATE instead.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."check_stock_ledger_drift"() RETURNS TABLE("product_id" "text", "lot_id" "text", "products_quantity" numeric, "lot_sum" numeric, "movement_sum" numeric, "diff" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH lot_totals AS (
    SELECT product_id, SUM(quantity) AS lot_sum
    FROM public.product_lots GROUP BY product_id
  ),
  movement_totals AS (
    SELECT product_id, SUM(actual_qty) AS movement_sum
    FROM public.stock_movements WHERE is_cancelled = FALSE GROUP BY product_id
  )
  SELECT
    p.id AS product_id,
    NULL::TEXT AS lot_id,
    p.quantity AS products_quantity,
    lt.lot_sum,
    mt.movement_sum,
    COALESCE(p.quantity, 0) - COALESCE(mt.movement_sum, 0) AS diff
  FROM public.products p
  LEFT JOIN lot_totals lt ON lt.product_id = p.id
  LEFT JOIN movement_totals mt ON mt.product_id = p.id
  WHERE p.has_lots = TRUE
    AND (
      COALESCE(p.quantity, 0) <> COALESCE(lt.lot_sum, 0)
      OR COALESCE(p.quantity, 0) <> COALESCE(mt.movement_sum, 0)
      OR COALESCE(lt.lot_sum, 0) <> COALESCE(mt.movement_sum, 0)
    )
  UNION ALL
  SELECT
    p.id AS product_id,
    NULL::TEXT AS lot_id,
    p.quantity AS products_quantity,
    NULL::NUMERIC AS lot_sum,
    mt.movement_sum,
    COALESCE(p.quantity, 0) - COALESCE(mt.movement_sum, 0) AS diff
  FROM public.products p
  LEFT JOIN (
    SELECT product_id, SUM(actual_qty) AS movement_sum
    FROM public.stock_movements WHERE is_cancelled = FALSE GROUP BY product_id
  ) mt ON mt.product_id = p.id
  WHERE COALESCE(p.has_lots, FALSE) = FALSE
    AND COALESCE(p.quantity, 0) <> COALESCE(mt.movement_sum, 0);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."check_tenant_limits"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_current INTEGER;
  v_max INTEGER;
BEGIN
  -- ponytail: kiểm tra tenant tồn tại và đang active trước khi kiểm tra giới hạn.
  SELECT * INTO v_tenant FROM public.tenants WHERE id = NEW.tenant_id;
  IF NOT FOUND OR v_tenant.status NOT IN ('active', 'trial') THEN
    RAISE EXCEPTION 'Tenant không hoạt động hoặc không tồn tại';
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = NEW.tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant';
  END IF;

  IF TG_TABLE_NAME = 'tenant_memberships' THEN
    -- ponytail: impersonation rows không tính vào giới hạn user của gói dịch vụ.
    SELECT count(*) INTO v_current
      FROM public.tenant_memberships
      WHERE tenant_id = NEW.tenant_id AND impersonated_by IS NULL;
    v_max := v_sub.max_users;
    IF v_current >= v_max THEN
      RAISE EXCEPTION 'Đã đạt giới hạn số user của gói dịch vụ';
    END IF;
  ELSIF TG_TABLE_NAME = 'products' THEN
    SELECT count(*) INTO v_current FROM public.products WHERE tenant_id = NEW.tenant_id;
    v_max := v_sub.max_products;
    IF v_current >= v_max THEN
      RAISE EXCEPTION 'Đã đạt giới hạn số sản phẩm của gói dịch vụ';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."claim_heavy_op_job"() RETURNS "public"."heavy_ops_jobs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_job public.heavy_ops_jobs;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Không có quyền claim job' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_job
  FROM public.heavy_ops_jobs
  WHERE status = 'pending' AND scheduled_at <= now()
  ORDER BY scheduled_at, created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.heavy_ops_jobs
    SET status = 'processing', attempts = attempts + 1, updated_at = now()
    WHERE id = v_job.id
    RETURNING * INTO v_job;
  END IF;

  RETURN v_job;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."complete_disposal"("p_disposal_id" "text") RETURNS TABLE("id" "text", "code" "text", "status" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_item RECORD;
  v_lot_quantity NUMERIC;
  v_product_quantity NUMERIC;
  v_disposal_status TEXT;
  v_disposal_code TEXT;
  v_qty_after NUMERIC;
  v_valuation_rate NUMERIC;
BEGIN
  SELECT d.status, d.code INTO v_disposal_status, v_disposal_code FROM disposals AS d WHERE d.id = p_disposal_id FOR UPDATE;
  IF v_disposal_status IS NULL THEN RAISE EXCEPTION 'Phiếu xuất hủy không tồn tại (%)', p_disposal_id; END IF;
  IF v_disposal_status = 'COMPLETED' THEN RAISE EXCEPTION 'Phiếu xuất hủy đã hoàn thành trước đó'; END IF;
  FOR v_item IN SELECT di.id, di.product_id, di.lot_id, di.quantity, di.reason FROM disposal_items AS di WHERE di.disposal_id = p_disposal_id
  LOOP
    SELECT p.quantity INTO v_product_quantity FROM products AS p WHERE p.id = v_item.product_id FOR UPDATE;
    IF v_product_quantity IS NULL THEN RAISE EXCEPTION 'Sản phẩm % không tồn tại trong kho', v_item.product_id; END IF;
    IF v_product_quantity < v_item.quantity THEN RAISE EXCEPTION 'Sản phẩm % không đủ tồn kho', v_item.product_id; END IF;
    IF v_item.lot_id IS NOT NULL THEN
      SELECT pl.quantity INTO v_lot_quantity FROM product_lots AS pl WHERE pl.id = v_item.lot_id FOR UPDATE;
      IF v_lot_quantity IS NULL THEN RAISE EXCEPTION 'Lô % không tồn tại', v_item.lot_id; END IF;
      IF v_lot_quantity < v_item.quantity THEN RAISE EXCEPTION 'Lô % không đủ số lượng', v_item.lot_id; END IF;
      UPDATE product_lots AS pl SET quantity = pl.quantity - v_item.quantity WHERE pl.id = v_item.lot_id;
      PERFORM sync_product_quantity_from_lots(v_item.product_id);
    ELSE
      UPDATE products AS p SET quantity = p.quantity - v_item.quantity WHERE p.id = v_item.product_id;
    END IF;
    v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_item.lot_id, -v_item.quantity);
    v_valuation_rate := get_product_valuation_rate(v_item.product_id, v_item.lot_id);
    PERFORM insert_stock_ledger_entry(NOW(), 'Stock Entry'::TEXT, p_disposal_id, v_item.id::TEXT, v_item.product_id, v_item.lot_id, 'Kho Chính'::TEXT, -v_item.quantity, v_qty_after, v_valuation_rate, 0::NUMERIC, v_valuation_rate, v_item.reason, FALSE);
  END LOOP;
  UPDATE disposals AS d SET status = 'COMPLETED', updated_at = NOW() WHERE d.id = p_disposal_id;
  RETURN QUERY SELECT d.id, d.code, d.status FROM disposals AS d WHERE d.id = p_disposal_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."complete_heavy_op_job"("p_job_id" "uuid", "p_status" "text", "p_result" "jsonb" DEFAULT NULL::"jsonb", "p_error_message" "text" DEFAULT NULL::"text") RETURNS "public"."heavy_ops_jobs"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_job public.heavy_ops_jobs;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Không có quyền cập nhật job' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_status NOT IN ('completed','failed','cancelled','pending','processing') THEN
    RAISE EXCEPTION 'Trạng thái job không hợp lệ: %', p_status;
  END IF;

  UPDATE public.heavy_ops_jobs
  SET status = p_status,
      result = p_result,
      error_message = p_error_message,
      updated_at = now()
  WHERE id = p_job_id
  RETURNING * INTO v_job;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy job: %', p_job_id;
  END IF;

  RETURN v_job;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."complete_inventory_count"("p_count_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_status        TEXT;
  item            RECORD;
  v_current_qty   NUMERIC;
  v_delta         NUMERIC;
  v_lots_sum      NUMERIC;
  v_count_diff    NUMERIC;
  v_lot_id        TEXT;
  v_product       RECORD;
  v_current_lot_qty NUMERIC;
  v_count_code    TEXT;
  v_valuation_rate NUMERIC;
  v_qty_after     NUMERIC;
  v_ledger_qty    NUMERIC;
  v_ledger_lot_id TEXT;
BEGIN
  -- ===== 0. VALIDATE INPUT =====
  IF p_count_id IS NULL OR p_count_id = '' THEN
    RAISE EXCEPTION 'Mã phiếu kiểm kê không hợp lệ';
  END IF;

  -- ===== 1. KHÓA HEADER PHIẾU + CHẶN RE-COMPLETE =====
  SELECT status, code INTO v_status, v_count_code
  FROM inventory_counts WHERE id = p_count_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phiếu kiểm kê không tồn tại: %', p_count_id;
  END IF;
  IF v_status = 'completed' THEN
    RAISE EXCEPTION 'Phiếu kiểm kê đã được hoàn thành trước đó (id: %)', p_count_id;
  END IF;
  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'Phiếu kiểm kê đã bị hủy, không thể hoàn thành (id: %)', p_count_id;
  END IF;

  -- ===== 2. DUYỆT TỪNG ITEM, KHÓA DÒNG, ÁP DELTA =====
  FOR item IN
    SELECT id, product_id, system_quantity, actual_quantity, lot_id, lot_code, expiry_date, reason
    FROM inventory_count_items WHERE count_id = p_count_id
  LOOP
    IF item.actual_quantity IS NULL THEN
      RAISE EXCEPTION 'Số lượng thực tế chưa nhập cho sản phẩm: %', item.product_id;
    END IF;

    IF item.actual_quantity < 0 THEN
      RAISE EXCEPTION 'Số lượng thực tế không được âm (product_id: %)', item.product_id;
    END IF;

    -- Khóa dòng product để ngăn race condition
    SELECT quantity, COALESCE(has_lots, FALSE) AS has_lots, name INTO v_product
    FROM products WHERE id = item.product_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Sản phẩm không tồn tại: %', item.product_id;
    END IF;

    -- ===== Bắt buộc lý do khi có chênh lệch (Phase 7a) =====
    IF NOT v_product.has_lots THEN
      v_current_qty := v_product.quantity;
    ELSIF item.lot_id IS NOT NULL THEN
      SELECT COALESCE(quantity, 0) INTO v_current_qty
      FROM product_lots WHERE id = item.lot_id;
    ELSIF item.lot_code IS NOT NULL AND TRIM(item.lot_code) != '' THEN
      SELECT COALESCE(quantity, 0) INTO v_current_qty
      FROM product_lots WHERE product_id = item.product_id AND code = TRIM(item.lot_code) LIMIT 1;
    ELSE
      SELECT COALESCE(SUM(quantity), 0) INTO v_current_qty
      FROM product_lots WHERE product_id = item.product_id;
    END IF;

    IF item.actual_quantity != COALESCE(v_current_qty, 0) THEN
      IF item.reason IS NULL OR TRIM(item.reason) = '' OR TRIM(item.reason) = 'Khớp' THEN
        RAISE EXCEPTION 'Phải nhập lý do chênh lệch cho sản phẩm "%" (lệch %) — không được để "Khớp" khi có chênh lệch', v_product.name, (item.actual_quantity - COALESCE(v_current_qty, 0));
      END IF;
    END IF;

    -- Reset ledger vars
    v_ledger_qty := 0;
    v_ledger_lot_id := NULL;

    -- Phân loại xử lý lô / không lô
    IF NOT v_product.has_lots THEN
      -- Sản phẩm không có lô -> cập nhật products.quantity theo delta
      v_delta := item.actual_quantity - v_product.quantity;
      UPDATE products SET quantity = quantity + v_delta WHERE id = item.product_id;
      UPDATE inventory_count_items SET system_quantity = v_product.quantity WHERE id = item.id;

      v_ledger_qty := v_delta;
      v_ledger_lot_id := NULL;
    ELSE
      -- Sản phẩm có quản lý lô -> tìm lô để điều chỉnh
      v_lot_id := item.lot_id;

      IF v_lot_id IS NOT NULL OR (item.lot_code IS NOT NULL AND TRIM(item.lot_code) != '') THEN
        -- Tìm ID lô trong product_lots nếu client chưa gửi lot_id
        IF v_lot_id IS NULL THEN
          SELECT id INTO v_lot_id FROM product_lots
          WHERE product_id = item.product_id AND code = TRIM(item.lot_code) LIMIT 1;
        END IF;

        IF v_lot_id IS NOT NULL THEN
          -- Lô đã tồn tại -> Khóa lô và cộng dồn delta chênh lệch
          SELECT quantity INTO v_current_lot_qty FROM product_lots WHERE id = v_lot_id FOR UPDATE;
          v_delta := item.actual_quantity - COALESCE(v_current_lot_qty, 0);
          UPDATE product_lots SET quantity = quantity + v_delta, updated_at = NOW() WHERE id = v_lot_id;

          UPDATE inventory_count_items
          SET system_quantity = COALESCE(v_current_lot_qty, 0), lot_id = v_lot_id
          WHERE id = item.id;

          v_ledger_qty := v_delta;
          v_ledger_lot_id := v_lot_id;
        ELSE
          -- Lô chưa tồn tại (quét đếm ra lô mới) -> Tạo lô mới
          v_lot_id := 'lot_cnt_' || item.product_id || '_' || REGEXP_REPLACE(TRIM(item.lot_code), '[^a-zA-Z0-9]', '_', 'g') || '_' || FLOOR(EXTRACT(EPOCH FROM NOW()))::TEXT;
          INSERT INTO product_lots (id, product_id, code, expiry_date, quantity, original_quantity, created_at, updated_at)
          VALUES (v_lot_id, item.product_id, TRIM(item.lot_code), item.expiry_date, item.actual_quantity, item.actual_quantity, NOW(), NOW());

          UPDATE inventory_count_items
          SET system_quantity = 0, lot_id = v_lot_id
          WHERE id = item.id;

          v_ledger_qty := item.actual_quantity;
          v_ledger_lot_id := v_lot_id;
        END IF;
      ELSE
        -- Fallback: Nếu không chỉ định lô (phiếu kiểm cũ) -> Phân bổ chênh lệch tự động theo FIFO
        SELECT COALESCE(SUM(quantity), 0) INTO v_lots_sum FROM product_lots WHERE product_id = item.product_id;
        v_count_diff := item.actual_quantity - v_lots_sum;

        IF v_count_diff > 0 THEN
          SELECT id INTO v_lot_id FROM product_lots WHERE product_id = item.product_id ORDER BY expiry_date ASC NULLS LAST, created_at ASC LIMIT 1;
          IF v_lot_id IS NOT NULL THEN
            UPDATE product_lots SET quantity = quantity + v_count_diff, updated_at = NOW() WHERE id = v_lot_id;
          ELSE
            INSERT INTO product_lots (id, product_id, code, quantity, original_quantity, created_at, updated_at)
            VALUES ('LOT_CNT_' || item.product_id || '_' || FLOOR(EXTRACT(EPOCH FROM NOW()))::TEXT, item.product_id, 'KIEMKE_ADJ', v_count_diff, v_count_diff, NOW(), NOW());
          END IF;
        ELSIF v_count_diff < 0 THEN
          DECLARE
            v_rem_qty NUMERIC := ABS(v_count_diff);
            v_lot_row RECORD;
            v_deduct NUMERIC;
          BEGIN
            FOR v_lot_row IN SELECT id, quantity FROM product_lots WHERE product_id = item.product_id AND quantity > 0 ORDER BY expiry_date ASC NULLS LAST, created_at ASC FOR UPDATE LOOP
              IF v_rem_qty <= 0 THEN EXIT; END IF;
              v_deduct := LEAST(v_lot_row.quantity, v_rem_qty);
              UPDATE product_lots SET quantity = quantity - v_deduct, updated_at = NOW() WHERE id = v_lot_row.id;
              v_rem_qty := v_rem_qty - v_deduct;
            END LOOP;
          END;
        END IF;

        UPDATE inventory_count_items
        SET system_quantity = v_lots_sum
        WHERE id = item.id;

        v_ledger_qty := v_count_diff;
        v_ledger_lot_id := NULL;
      END IF;

      -- Dọn dẹp các lô số lượng <= 0 sau khi hoàn thành
      DELETE FROM product_lots WHERE product_id = item.product_id AND quantity <= 0;
      -- Phase 6: đồng bộ tường minh products.quantity từ product_lots
      PERFORM sync_product_quantity_from_lots(item.product_id);
    END IF;

    -- ===== Phase 7b: GHI BÚT TOÁN SỔ CÁI KHO =====
    IF v_ledger_qty != 0 THEN
      v_valuation_rate := get_product_valuation_rate(item.product_id, v_ledger_lot_id);
      v_qty_after := public.calc_qty_after_transaction(item.product_id, v_ledger_lot_id, v_ledger_qty);

      PERFORM insert_stock_ledger_entry(
        NOW(),
        'Stock Reconciliation'::TEXT,
        v_count_code,
        item.id::TEXT,
        item.product_id,
        v_ledger_lot_id,
        'Kho Chính'::TEXT,
        v_ledger_qty,
        v_qty_after,
        v_valuation_rate,
        0::NUMERIC,
        0::NUMERIC,
        item.reason,
        FALSE
      );
    END IF;
  END LOOP;

  -- ===== 3. ĐÁNH DẤU PHIẾU HOÀN THÀNH =====
  UPDATE inventory_counts SET status = 'completed', completed_at = now() WHERE id = p_count_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."confirm_payment"("p_invoice_id" "uuid", "p_payment_method" "text" DEFAULT 'bank_transfer'::"text", "p_reference_code" "text" DEFAULT NULL::"text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "public"."payments"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_invoice public.invoices%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_new_expires_at TIMESTAMPTZ;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xác nhận thanh toán' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_payment_method NOT IN ('bank_transfer', 'cash', 'card', 'other') THEN
    RAISE EXCEPTION 'Phương thức thanh toán không hợp lệ: %', p_payment_method;
  END IF;

  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy hóa đơn: %', p_invoice_id;
  END IF;

  IF v_invoice.status IN ('paid', 'cancelled', 'draft') THEN
    RAISE EXCEPTION 'Hóa đơn ở trạng thái %, không thể xác nhận thanh toán', v_invoice.status;
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = v_invoice.tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', v_invoice.tenant_id;
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = v_invoice.tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', v_invoice.tenant_id;
  END IF;

  -- Ghi payment đã xác nhận
  INSERT INTO public.payments (
    tenant_id,
    invoice_id,
    amount,
    payment_method,
    payment_date,
    reference_code,
    status,
    notes,
    created_by
  ) VALUES (
    v_invoice.tenant_id,
    v_invoice.id,
    v_invoice.total,
    p_payment_method,
    CURRENT_DATE,
    p_reference_code,
    'confirmed',
    p_notes,
    auth.uid()
  ) RETURNING * INTO v_payment;

  -- Cập nhật hóa đơn thành paid
  UPDATE public.invoices
  SET status = 'paid',
      amount_paid = total,
      updated_at = now()
  WHERE id = p_invoice_id;

  -- Cập nhật subscription: billing_status ok, expires_at = max(hiện tại, period_end) để giữ cộng dồn
  v_new_expires_at := GREATEST(
    COALESCE(v_sub.expires_at::DATE, CURRENT_DATE),
    v_invoice.period_end::DATE
  )::TIMESTAMPTZ;

  UPDATE public.tenant_subscriptions
  SET billing_status = 'ok',
      expires_at = v_new_expires_at,
      updated_at = now()
  WHERE tenant_id = v_invoice.tenant_id;

  -- Kích hoạt lại tenant nếu đang read_only
  IF v_tenant.status = 'read_only' THEN
    UPDATE public.tenants
    SET status = 'active',
        updated_at = now()
    WHERE id = v_invoice.tenant_id;
  END IF;

  RETURN v_payment;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."count_point_products"() RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
  SELECT COUNT(*)::int
  FROM products
  WHERE is_point_accumulation_enabled = true;
$$;

CREATE OR REPLACE FUNCTION "public"."create_exchange_transaction"("p_return_id" "text", "p_original_order_id" "text", "p_customer_id" "text", "p_customer_name" "text", "p_return_items" "jsonb" DEFAULT '[]'::"jsonb", "p_total_refund_amount" numeric DEFAULT 0, "p_gross_refund_amount" numeric DEFAULT NULL::numeric, "p_fee_percent" numeric DEFAULT 0, "p_fee_amount" numeric DEFAULT 0, "p_days_since_purchase" integer DEFAULT 0, "p_original_payment_method" "text" DEFAULT NULL::"text", "p_reason" "text" DEFAULT ''::"text", "p_note" "text" DEFAULT NULL::"text", "p_debt_reduction" numeric DEFAULT 0, "p_cash_refund" numeric DEFAULT 0, "p_exchange_order_id" "text" DEFAULT NULL::"text", "p_exchange_items" "jsonb" DEFAULT '[]'::"jsonb", "p_exchange_total" numeric DEFAULT 0, "p_exchange_paid_amount" numeric DEFAULT 0, "p_exchange_debt_recorded" numeric DEFAULT 0, "p_exchange_payment_method" "text" DEFAULT 'cash'::"text", "p_is_delivery" boolean DEFAULT false, "p_offset_amount" numeric DEFAULT 0, "p_cash_diff" numeric DEFAULT 0, "p_allow_negative" boolean DEFAULT false) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
    
DECLARE
  v_now                 TIMESTAMPTZ := NOW();
  v_order               RECORD;
  v_item                JSONB;
  v_product             RECORD;
  v_product_id          TEXT;
  v_qty                 NUMERIC;
  v_ordered_qty         NUMERIC;
  v_already_returned    NUMERIC;
  v_new_total_returned  NUMERIC;
  v_customer_id_clean   TEXT;
  v_has_return          BOOLEAN := FALSE;
  v_has_exchange        BOOLEAN := FALSE;
  v_net_spent_delta     NUMERIC := 0;
  v_net_debt_delta      NUMERIC := 0;
  v_lot_id              TEXT;
  v_lot_code            TEXT;
  v_lot_exists          BOOLEAN;
  v_affected_products   TEXT[] := ARRAY[]::TEXT[];

  -- Phase 7c: stock ledger
  v_return_item_id      TEXT;
  v_exchange_item_id    TEXT;
  v_qty_after           NUMERIC;
  v_valuation_rate      NUMERIC;
  v_orig_cost           NUMERIC;
  v_ex_lot_id           TEXT;
BEGIN
  v_has_return   := (jsonb_typeof(p_return_items)   = 'array' AND jsonb_array_length(p_return_items)   > 0);
  v_has_exchange := (jsonb_typeof(p_exchange_items) = 'array' AND jsonb_array_length(p_exchange_items) > 0);

  IF NOT v_has_return AND NOT v_has_exchange THEN
    RAISE EXCEPTION 'Phiếu trống: phải có ít nhất 1 sản phẩm trả hoặc 1 sản phẩm đổi'
      USING ERRCODE = 'P0001';
  END IF;

  v_customer_id_clean := NULLIF(NULLIF(p_customer_id, ''), 'guest');

  IF v_customer_id_clean IS NOT NULL THEN
    PERFORM 1 FROM customers WHERE id = v_customer_id_clean FOR UPDATE;
  END IF;

  -- PHẦN A — TRẢ HÀNG
  IF v_has_return THEN
    IF p_return_id IS NULL OR p_return_id = '' THEN
      RAISE EXCEPTION 'return_id is required khi có hàng trả';
    END IF;
    IF p_original_order_id IS NULL OR p_original_order_id = '' THEN
      RAISE EXCEPTION 'original_order_id is required khi có hàng trả';
    END IF;
    IF p_total_refund_amount < 0 THEN
      RAISE EXCEPTION 'Tổng tiền hoàn không thể âm';
    END IF;

    SELECT id, total_amount, total_returned_amount, customer_id
      INTO v_order
    FROM orders
    WHERE id = p_original_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Đơn hàng gốc % không tồn tại', p_original_order_id;
    END IF;

    v_new_total_returned := COALESCE(v_order.total_returned_amount, 0) + p_total_refund_amount;

    IF v_new_total_returned > COALESCE(v_order.total_amount, 0) + 0.01 THEN
      RAISE EXCEPTION 'Tổng tiền trả (%) vượt quá tổng tiền đơn hàng (%)',
        v_new_total_returned, v_order.total_amount
        USING ERRCODE = 'P0001';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_return_items) LOOP
      v_product_id := v_item->>'productId';
      v_qty := COALESCE((v_item->>'quantity')::NUMERIC, 0);

      IF v_qty <= 0 THEN
        RAISE EXCEPTION 'Số lượng trả của "%" phải > 0', v_item->>'productName';
      END IF;

      SELECT COALESCE(SUM(quantity), 0) INTO v_ordered_qty
      FROM order_items
      WHERE order_id = p_original_order_id
        AND product_id = v_product_id;

      IF v_ordered_qty = 0 THEN
        RAISE EXCEPTION 'Sản phẩm "%" không có trong đơn hàng gốc',
          v_item->>'productName'
          USING ERRCODE = 'P0001';
      END IF;

      SELECT COALESCE(SUM(roi.quantity), 0) INTO v_already_returned
      FROM return_order_items roi
      JOIN return_orders ro ON ro.id = roi.return_order_id
      WHERE ro.original_order_id = p_original_order_id
        AND roi.product_id = v_product_id
        AND ro.status != 'cancelled';

      IF v_already_returned + v_qty > v_ordered_qty + 0.001 THEN
        RAISE EXCEPTION 'Trả vượt số đã bán cho "%" (đã bán %, đã trả %, đang trả thêm %)',
          v_item->>'productName', v_ordered_qty, v_already_returned, v_qty
          USING ERRCODE = 'P0001';
      END IF;
    END LOOP;

    BEGIN
      INSERT INTO return_orders (
        id, original_order_id, date, customer_id, customer_name,
        total_refund_amount, refund_method,
        debt_reduction, cash_refund,
        reason, note, status,
        gross_refund_amount, fee_percent, fee_amount,
        days_since_purchase, original_payment_method,
        created_at, updated_at
      ) VALUES (
        p_return_id, p_original_order_id, v_now, v_customer_id_clean, p_customer_name,
        p_total_refund_amount, 'cash',
        p_debt_reduction, p_cash_refund,
        p_reason, p_note, 'completed',
        COALESCE(p_gross_refund_amount, p_total_refund_amount), p_fee_percent, p_fee_amount,
        p_days_since_purchase, p_original_payment_method,
        v_now, v_now
      );
    EXCEPTION
      WHEN undefined_column THEN
        INSERT INTO return_orders (
          id, original_order_id, date, customer_id, customer_name,
          total_refund_amount, refund_method,
          debt_reduction, cash_refund,
          reason, note, status,
          created_at, updated_at
        ) VALUES (
          p_return_id, p_original_order_id, v_now, v_customer_id_clean, p_customer_name,
          p_total_refund_amount, 'cash',
          p_debt_reduction, p_cash_refund,
          p_reason, p_note, 'completed',
          v_now, v_now
        );
    END;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_return_items) LOOP
      v_product_id := v_item->>'productId';
      v_lot_id     := NULLIF(v_item->>'lotId', '');
      v_lot_code   := NULLIF(v_item->>'lotCode', '');

      IF v_lot_id IS NULL THEN
        SELECT lot_id, lot_code INTO v_lot_id, v_lot_code
        FROM order_items
        WHERE order_id = p_original_order_id
          AND product_id = v_product_id
          AND (lot_code = v_lot_code OR v_lot_code IS NULL)
        ORDER BY (CASE WHEN lot_code = v_lot_code THEN 0 ELSE 1 END), id ASC
        LIMIT 1;
      END IF;

      v_lot_id   := NULLIF(v_lot_id, '');
      v_lot_code := NULLIF(v_lot_code, '');

      INSERT INTO return_order_items (
        id, return_order_id, product_id, product_name,
        quantity, unit_name, unit_price, subtotal, reason, lot_id
      ) VALUES (
        p_return_id || '_' || v_product_id || '_' || COALESCE(v_lot_id, floor(random()*1000000)::text),
        p_return_id,
        v_product_id,
        v_item->>'productName',
        COALESCE((v_item->>'quantity')::NUMERIC, 0),
        v_item->>'unitName',
        COALESCE((v_item->>'unitPrice')::NUMERIC, (v_item->>'price')::NUMERIC, 0),
        COALESCE((v_item->>'subtotal')::NUMERIC, 0),
        COALESCE(v_item->>'reason', ''),
        v_lot_id
      ) RETURNING id INTO v_return_item_id;
    END LOOP;

    UPDATE orders SET
      has_return = true,
      total_returned_amount = v_new_total_returned
    WHERE id = p_original_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_return_items) LOOP
      v_product_id := v_item->>'productId';
      v_qty        := COALESCE((v_item->>'quantity')::NUMERIC, 0);
      v_lot_id     := NULLIF(v_item->>'lotId', '');
      v_lot_code   := NULLIF(v_item->>'lotCode', '');

      IF v_qty <= 0 THEN CONTINUE; END IF;

      v_affected_products := array_append(v_affected_products, v_product_id);

      SELECT id, name, has_lots INTO v_product
      FROM products WHERE id = v_product_id FOR UPDATE;

      IF v_lot_id IS NULL THEN
        SELECT lot_id, lot_code INTO v_lot_id, v_lot_code
        FROM order_items
        WHERE order_id = p_original_order_id
          AND product_id = v_product_id
          AND (lot_code = v_lot_code OR v_lot_code IS NULL)
        ORDER BY (CASE WHEN lot_code = v_lot_code THEN 0 ELSE 1 END), id ASC
        LIMIT 1;
      END IF;

      v_lot_id   := NULLIF(v_lot_id, '');
      v_lot_code := NULLIF(v_lot_code, '');

      SELECT id INTO v_return_item_id
      FROM return_order_items
      WHERE return_order_id = p_return_id
        AND product_id = v_product_id
        AND (lot_id = v_lot_id OR (lot_id IS NULL AND v_lot_id IS NULL))
      ORDER BY created_at DESC
      LIMIT 1;

      IF v_product.has_lots AND v_lot_id IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM product_lots WHERE id = v_lot_id) INTO v_lot_exists;

        IF v_lot_exists THEN
          PERFORM 1 FROM product_lots WHERE id = v_lot_id FOR UPDATE;
          UPDATE product_lots
          SET quantity = COALESCE(quantity, 0) + v_qty, updated_at = NOW()
          WHERE id = v_lot_id;
        ELSE
          INSERT INTO product_lots (id, product_id, code, expiry_date, quantity, original_quantity, created_at, updated_at)
          VALUES (v_lot_id, v_product_id, COALESCE(v_lot_code, 'RECOVERED_EXC'), NULL, v_qty, v_qty, NOW(), NOW());
        END IF;

        PERFORM sync_product_quantity_from_lots(v_product_id);
      ELSE
        UPDATE products
        SET quantity = COALESCE(quantity, 0) + v_qty
        WHERE id = v_product_id;
      END IF;

      -- Phase 7c: GHI BÚT TOÁN SỔ CÁI KHO — TRẢ
      v_qty_after := public.calc_qty_after_transaction(v_product_id, v_lot_id, v_qty);

      SELECT cost INTO v_orig_cost
      FROM order_items
      WHERE order_id = p_original_order_id
        AND product_id = v_product_id
        AND (lot_id = v_lot_id OR (lot_id IS NULL AND v_lot_id IS NULL))
      ORDER BY id ASC
      LIMIT 1;

      v_valuation_rate := COALESCE(v_orig_cost, get_product_valuation_rate(v_product_id, v_lot_id));

      PERFORM insert_stock_ledger_entry(
        v_now,
        'Stock Entry'::TEXT,
        p_return_id,
        v_return_item_id,
        v_product_id,
        v_lot_id,
        'Kho Chính'::TEXT,
        v_qty,
        v_qty_after,
        v_valuation_rate,
        v_valuation_rate,
        0::NUMERIC,
        'Đổi hàng - trả',
        FALSE
      );
    END LOOP;

    v_net_spent_delta := v_net_spent_delta - p_total_refund_amount;
    v_net_debt_delta  := v_net_debt_delta  - p_debt_reduction;
  END IF;

  -- PHẦN B — ĐƠN ĐỔI MỚI
  IF v_has_exchange THEN
    IF p_exchange_order_id IS NULL OR p_exchange_order_id = '' THEN
      RAISE EXCEPTION 'exchange_order_id is required khi có hàng đổi';
    END IF;
    IF p_exchange_total < 0 THEN
      RAISE EXCEPTION 'exchange_total không thể âm';
    END IF;

    INSERT INTO orders (
      id, date, customer_id, customer_name,
      total_amount, paid_amount, debt_recorded, payment_method,
      status, points_earned, points_redeemed, rewards_redeemed,
      applied_promotions, note
    ) VALUES (
      p_exchange_order_id,
      v_now,
      v_customer_id_clean,
      p_customer_name,
      p_exchange_total,
      p_exchange_paid_amount,
      p_exchange_debt_recorded,
      p_exchange_payment_method,
      'completed',
      0,
      0,
      '[]'::jsonb,
      '[]'::jsonb,
      CASE
        WHEN v_has_return THEN 'Đơn đổi từ phiếu trả ' || COALESCE(p_return_id, '?')
          || CASE WHEN p_is_delivery THEN ' (Giao hàng)' ELSE '' END
        ELSE
          CASE WHEN p_is_delivery THEN 'Đơn bán (Giao hàng)' ELSE 'Đơn bán đổi' END
      END
    );

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_exchange_items) LOOP
      v_ex_lot_id := NULLIF(v_item->>'lotId', '');

      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_name, price, lot_id, lot_code)
      VALUES (
        p_exchange_order_id,
        v_item->>'productId',
        v_item->>'productName',
        COALESCE((v_item->>'quantity')::NUMERIC, 0),
        v_item->>'unitName',
        COALESCE((v_item->>'unitPrice')::NUMERIC, (v_item->>'price')::NUMERIC, 0),
        v_ex_lot_id,
        NULLIF(v_item->>'lotCode', '')
      ) RETURNING id INTO v_exchange_item_id;
    END LOOP;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_exchange_items) LOOP
      v_product_id := v_item->>'productId';
      v_qty        := COALESCE((v_item->>'quantity')::NUMERIC, 0);
      v_ex_lot_id  := NULLIF(v_item->>'lotId', '');

      IF v_qty <= 0 THEN CONTINUE; END IF;

      v_affected_products := array_append(v_affected_products, v_product_id);

      SELECT id, name, quantity, has_lots INTO v_product
      FROM products
      WHERE id = v_product_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Sản phẩm % không tồn tại trong kho', v_product_id
          USING ERRCODE = 'P0001';
      END IF;

      SELECT id INTO v_exchange_item_id
      FROM order_items
      WHERE order_id = p_exchange_order_id
        AND product_id = v_product_id
        AND (lot_id = v_ex_lot_id OR (lot_id IS NULL AND v_ex_lot_id IS NULL))
      ORDER BY created_at DESC
      LIMIT 1;

      IF v_product.has_lots THEN
        IF v_ex_lot_id IS NULL THEN
          DECLARE
            v_remaining_qty NUMERIC := v_qty;
            v_lot_row RECORD;
            v_deduct_qty NUMERIC;
            v_any_lot_id TEXT;
          BEGIN
            FOR v_lot_row IN
              SELECT id, quantity
              FROM product_lots
              WHERE product_id = v_product_id AND quantity > 0
              ORDER BY expiry_date ASC NULLS LAST, created_at ASC
              FOR UPDATE
            LOOP
              IF v_remaining_qty <= 0 THEN EXIT; END IF;
              v_deduct_qty := LEAST(v_lot_row.quantity, v_remaining_qty);
              UPDATE product_lots SET quantity = quantity - v_deduct_qty WHERE id = v_lot_row.id;
              v_remaining_qty := v_remaining_qty - v_deduct_qty;
            END LOOP;

            IF v_remaining_qty > 0 THEN
              IF NOT p_allow_negative THEN
                RAISE EXCEPTION 'Tồn kho lô của "%" không đủ (cần %, thiếu %)', v_product.name, v_qty, v_remaining_qty;
              END IF;

              SELECT id INTO v_any_lot_id FROM product_lots WHERE product_id = v_product_id ORDER BY expiry_date ASC NULLS LAST, created_at ASC LIMIT 1;
              IF v_any_lot_id IS NOT NULL THEN
                UPDATE product_lots SET quantity = quantity - v_remaining_qty WHERE id = v_any_lot_id;
              ELSE
                INSERT INTO product_lots (id, product_id, code, quantity, original_quantity)
                VALUES ('LOT_EXC_' || v_product_id || '_' || MD5(RANDOM()::TEXT), v_product_id, 'EXCHANGE_NEG', -v_remaining_qty, 0);
              END IF;
            END IF;
          END;
        ELSE
          DECLARE
            v_lot_qty NUMERIC;
          BEGIN
            SELECT quantity INTO v_lot_qty FROM product_lots WHERE id = v_ex_lot_id AND product_id = v_product_id FOR UPDATE;
            IF NOT FOUND THEN
              RAISE EXCEPTION 'Lô chỉ định % không tồn tại cho sản phẩm "%"', v_ex_lot_id, v_product.name;
            END IF;

            IF NOT p_allow_negative AND v_lot_qty < v_qty THEN
              RAISE EXCEPTION 'Lô chỉ định "%" không đủ tồn (cần %, còn %)', v_ex_lot_id, v_qty, v_lot_qty;
            END IF;

            UPDATE product_lots
            SET quantity = quantity - v_qty, updated_at = NOW()
            WHERE id = v_ex_lot_id;
          END;
        END IF;

        PERFORM sync_product_quantity_from_lots(v_product_id);
      ELSE
        IF NOT p_allow_negative AND COALESCE(v_product.quantity, 0) < v_qty THEN
          RAISE EXCEPTION 'Tồn kho không đủ cho "%" (cần %, còn %)', v_product.name, v_qty, v_product.quantity
            USING ERRCODE = 'P0001';
        END IF;

        UPDATE products
        SET quantity = COALESCE(quantity, 0) - v_qty
        WHERE id = v_product_id;
      END IF;

      -- Phase 7c: GHI BÚT TOÁN SỔ CÁI KHO — BÁN
      v_qty_after := public.calc_qty_after_transaction(v_product_id, v_ex_lot_id, -v_qty);
      v_valuation_rate := get_product_valuation_rate(v_product_id, v_ex_lot_id);

      PERFORM insert_stock_ledger_entry(
        v_now,
        'Stock Entry'::TEXT,
        p_exchange_order_id,
        v_exchange_item_id,
        v_product_id,
        v_ex_lot_id,
        'Kho Chính'::TEXT,
        -v_qty,
        v_qty_after,
        v_valuation_rate,
        0::NUMERIC,
        v_valuation_rate,
        'Đổi hàng - bán',
        FALSE
      );
    END LOOP;

    v_net_spent_delta := v_net_spent_delta + p_exchange_total;
    v_net_debt_delta  := v_net_debt_delta  + p_exchange_debt_recorded;
  END IF;

  IF v_customer_id_clean IS NOT NULL AND (v_net_spent_delta != 0 OR v_net_debt_delta != 0) THEN
    UPDATE customers SET
      debt        = GREATEST(0, COALESCE(debt, 0) + v_net_debt_delta),
      total_spent = GREATEST(0, COALESCE(total_spent, 0) + v_net_spent_delta),
      updated_at  = v_now
    WHERE id = v_customer_id_clean;
  END IF;

  -- Phase 6: GHI SỔ CÁI CÔNG NỢ KH
  IF v_customer_id_clean IS NOT NULL AND v_net_debt_delta != 0 THEN
    PERFORM public.insert_customer_ledger_entry(
      p_customer_id    := v_customer_id_clean,
      p_reference_type := 'exchange',
      p_reference_id   := p_return_id,
      p_amount         := v_net_debt_delta,
      p_reason         := 'Đổi hàng ' || p_return_id || ' — chênh lệch công nợ',
      p_created_by     := COALESCE(current_setting('request.jwt.claim.sub', true), 'system'),
      p_created_at     := v_now
    );
  END IF;

  IF ARRAY_LENGTH(v_affected_products, 1) > 0 THEN
    PERFORM check_inventory_consistency(v_affected_products);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'has_return', v_has_return,
    'has_exchange', v_has_exchange,
    'return_id', CASE WHEN v_has_return THEN p_return_id ELSE NULL END,
    'exchange_order_id', CASE WHEN v_has_exchange THEN p_exchange_order_id ELSE NULL END,
    'new_total_returned', CASE WHEN v_has_return THEN v_new_total_returned ELSE NULL END,
    'offset_amount', p_offset_amount,
    'cash_diff', p_cash_diff,
    'net_spent_delta', v_net_spent_delta,
    'net_debt_delta', v_net_debt_delta
  );
END;

    $$;

CREATE OR REPLACE FUNCTION "public"."create_integration"("p_partner_id" "uuid", "p_name" "text", "p_slug" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_category" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT 'active'::"text", "p_documentation_url" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_row public.integrations;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo integration' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Tên integration không được để trống';
  END IF;

  IF p_partner_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.partners WHERE id = p_partner_id) THEN
    RAISE EXCEPTION 'Không tìm thấy partner: %', p_partner_id;
  END IF;

  INSERT INTO public.integrations (
    partner_id, name, slug, description, category, status, documentation_url, created_by
  ) VALUES (
    p_partner_id,
    trim(p_name),
    NULLIF(trim(p_slug), ''),
    NULLIF(trim(p_description), ''),
    NULLIF(trim(p_category), ''),
    COALESCE(p_status, 'active'),
    NULLIF(trim(p_documentation_url), ''),
    auth.uid()
  )
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id', v_row.id,
    'partnerId', v_row.partner_id,
    'name', v_row.name,
    'slug', v_row.slug,
    'description', v_row.description,
    'category', v_row.category,
    'status', v_row.status,
    'documentationUrl', v_row.documentation_url,
    'createdBy', v_row.created_by,
    'createdAt', v_row.created_at,
    'updatedAt', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."create_invoice"("p_tenant_id" "uuid", "p_cycle_type" "text" DEFAULT 'monthly'::"text", "p_quantity" integer DEFAULT 1, "p_bonus_months" integer DEFAULT 0, "p_notes" "text" DEFAULT NULL::"text") RETURNS "public"."invoices"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_invoice public.invoices%ROWTYPE;
  v_invoice_no TEXT;
  v_paid_months INTEGER;
  v_unit_price NUMERIC;
  v_description TEXT;
  v_subtotal NUMERIC;
  v_start DATE;
  v_end DATE;
  v_today DATE;
  v_plan public.plans%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo hóa đơn' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', p_tenant_id;
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE key = v_sub.plan;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy gói dịch vụ: %', v_sub.plan;
  END IF;

  IF p_cycle_type NOT IN ('monthly', 'yearly') THEN
    RAISE EXCEPTION 'Chu kỳ không hợp lệ: %', p_cycle_type;
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Số lượng phải lớn hơn 0';
  END IF;

  IF COALESCE(p_bonus_months, 0) < 0 THEN
    RAISE EXCEPTION 'Số tháng tặng không hợp lệ';
  END IF;

  IF p_cycle_type = 'monthly' THEN
    v_paid_months := p_quantity;
    v_unit_price := COALESCE(v_plan.monthly_price, 0);
    v_description := 'Gói ' || v_plan.name || ' - Tháng';
  ELSE
    v_paid_months := p_quantity * 12;
    v_unit_price := COALESCE(v_plan.yearly_price, 0);
    v_description := 'Gói ' || v_plan.name || ' - Năm';
  END IF;

  v_subtotal := v_paid_months * v_unit_price;
  v_today := CURRENT_DATE;
  v_start := GREATEST(COALESCE(v_sub.expires_at::DATE, v_today), v_today);
  v_end := v_start + (v_paid_months + COALESCE(p_bonus_months, 0)) * INTERVAL '1 month';

  v_invoice_no := public.get_next_invoice_number(EXTRACT(YEAR FROM v_today)::INT);

  INSERT INTO public.invoices (
    tenant_id, invoice_no, status, issue_date, due_date,
    period_start, period_end, subtotal, discount, tax, total,
    amount_paid, notes, created_by
  )
  VALUES (
    p_tenant_id, v_invoice_no, 'pending', v_today, v_start + INTERVAL '2 days',
    v_start, v_end, v_subtotal, 0, 0, v_subtotal,
    0, p_notes, auth.uid()
  )
  RETURNING * INTO v_invoice;

  INSERT INTO public.invoice_items (invoice_id, tenant_id, description, quantity, unit_price)
  VALUES (v_invoice.id, p_tenant_id, v_description, v_paid_months, v_unit_price);

  IF COALESCE(p_bonus_months, 0) > 0 THEN
    INSERT INTO public.invoice_items (invoice_id, tenant_id, description, quantity, unit_price)
    VALUES (v_invoice.id, p_tenant_id, 'Tháng tặng', p_bonus_months, 0);
  END IF;

  RETURN v_invoice;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."create_maintenance_window"("p_title" "text", "p_description" "text" DEFAULT NULL::"text", "p_starts_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_ends_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_window public.maintenance_windows%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo maintenance window' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_title IS NULL OR TRIM(p_title) = '' THEN
    RAISE EXCEPTION 'Tiêu đề không được để trống';
  END IF;

  IF p_starts_at IS NULL OR p_ends_at IS NULL OR p_ends_at <= p_starts_at THEN
    RAISE EXCEPTION 'Thời gian bảo trì không hợp lệ: ends_at phải sau starts_at';
  END IF;

  INSERT INTO public.maintenance_windows (title, description, starts_at, ends_at)
  VALUES (TRIM(p_title), p_description, p_starts_at, p_ends_at)
  RETURNING * INTO v_window;

  RETURN row_to_json(v_window);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."create_partner"("p_name" "text", "p_slug" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_website" "text" DEFAULT NULL::"text", "p_contact_email" "text" DEFAULT NULL::"text", "p_logo_url" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_row public.partners;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo partner' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Tên partner không được để trống';
  END IF;

  INSERT INTO public.partners (
    name, slug, description, website, contact_email, logo_url, created_by
  ) VALUES (
    trim(p_name),
    NULLIF(trim(p_slug), ''),
    NULLIF(trim(p_description), ''),
    NULLIF(trim(p_website), ''),
    NULLIF(trim(p_contact_email), ''),
    NULLIF(trim(p_logo_url), ''),
    auth.uid()
  )
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id', v_row.id,
    'name', v_row.name,
    'slug', v_row.slug,
    'description', v_row.description,
    'website', v_row.website,
    'contactEmail', v_row.contact_email,
    'logoUrl', v_row.logo_url,
    'status', v_row.status,
    'createdBy', v_row.created_by,
    'createdAt', v_row.created_at,
    'updatedAt', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."create_plan"("p_key" "text", "p_name" "text", "p_description" "text" DEFAULT NULL::"text", "p_max_users" integer DEFAULT 1, "p_max_products" integer DEFAULT 1, "p_max_orders_per_month" integer DEFAULT 1, "p_monthly_price" numeric DEFAULT 0, "p_yearly_price" numeric DEFAULT 0) RETURNS json
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  v_key TEXT;
  v_plan public.plans%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo gói' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_key := lower(trim(p_key));
  IF v_key IS NULL OR v_key = '' THEN
    RAISE EXCEPTION 'Mã gói không được để trống';
  END IF;
  IF v_key !~ '^[a-z0-9_]+$' THEN
    RAISE EXCEPTION 'Mã gói chỉ được chứa chữ thường, số và dấu gạch dưới';
  END IF;

  IF p_max_users <= 0 OR p_max_products <= 0 OR p_max_orders_per_month <= 0 THEN
    RAISE EXCEPTION 'Giới hạn phải lớn hơn 0';
  END IF;

  INSERT INTO public.plans (key, name, description, max_users, max_products, max_orders_per_month, monthly_price, yearly_price, is_active)
  VALUES (v_key, trim(p_name), p_description, p_max_users, p_max_products, p_max_orders_per_month, COALESCE(p_monthly_price, 0), COALESCE(p_yearly_price, 0), true)
  ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    max_users = EXCLUDED.max_users,
    max_products = EXCLUDED.max_products,
    max_orders_per_month = EXCLUDED.max_orders_per_month,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price,
    is_active = true,
    updated_at = now()
  RETURNING * INTO v_plan;

  RETURN json_build_object(
    'key', v_plan.key,
    'name', v_plan.name,
    'description', v_plan.description,
    'max_users', v_plan.max_users,
    'max_products', v_plan.max_products,
    'max_orders_per_month', v_plan.max_orders_per_month,
    'monthly_price', v_plan.monthly_price,
    'yearly_price', v_plan.yearly_price,
    'is_active', v_plan.is_active,
    'created_at', v_plan.created_at,
    'updated_at', v_plan.updated_at
  );
END;
$_$;


ALTER FUNCTION "public"."create_plan"("p_key" "text", "p_name" "text", "p_description" "text", "p_max_users" integer, "p_max_products" integer, "p_max_orders_per_month" integer, "p_monthly_price" numeric, "p_yearly_price" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_renewal_invoices"("p_days_before" integer DEFAULT 7) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_sub RECORD;
  v_today DATE;
  v_period_start DATE;
  v_period_end DATE;
  v_plan public.plans%ROWTYPE;
  v_unit_price NUMERIC;
  v_created INTEGER := 0;
  v_invoice_id UUID;
BEGIN
  v_today := CURRENT_DATE;

  FOR v_sub IN
    SELECT s.tenant_id, s.expires_at, s.plan
    FROM public.tenant_subscriptions s
    JOIN public.tenants t ON t.id = s.tenant_id
    JOIN public.plans p ON p.key = s.plan AND p.is_active = true
    WHERE s.expires_at IS NOT NULL
      AND s.expires_at::DATE >= CURRENT_DATE
      AND s.expires_at::DATE <= CURRENT_DATE + (p_days_before || ' days')::INTERVAL
      AND t.status IN ('active', 'trial')
      AND NOT EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.tenant_id = s.tenant_id
          AND i.status IN ('pending', 'partial')
          AND i.period_end >= s.expires_at::DATE
      )
  LOOP
    SELECT * INTO v_plan FROM public.plans WHERE key = v_sub.plan;
    v_unit_price := COALESCE(v_plan.monthly_price, 0);

    v_period_start := v_sub.expires_at::DATE;
    v_period_end := v_period_start + INTERVAL '1 month';

    INSERT INTO public.invoices (tenant_id, invoice_no, status, issue_date, due_date, period_start, period_end, subtotal, discount, tax, total, amount_paid, created_by)
    VALUES (
      v_sub.tenant_id,
      public.get_next_invoice_number(EXTRACT(YEAR FROM v_today)::INT),
      'pending',
      v_today,
      v_period_start,
      v_period_start,
      v_period_end,
      v_unit_price,
      0,
      0,
      v_unit_price,
      0,
      auth.uid()
    )
    RETURNING id INTO v_invoice_id;

    INSERT INTO public.invoice_items (invoice_id, tenant_id, description, quantity, unit_price)
    VALUES (v_invoice_id, v_sub.tenant_id, 'Gói ' || v_plan.name || ' - Tháng (gia hạn)', 1, v_unit_price);

    v_created := v_created + 1;
  END LOOP;

  RETURN v_created;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."create_return_order"("p_id" "text", "p_original_order_id" "text", "p_customer_id" "text", "p_customer_name" "text", "p_items" "jsonb", "p_total_refund_amount" numeric, "p_debt_reduction" numeric DEFAULT 0, "p_cash_refund" numeric DEFAULT 0, "p_reason" "text" DEFAULT ''::"text", "p_note" "text" DEFAULT NULL::"text", "p_gross_refund_amount" numeric DEFAULT NULL::numeric, "p_fee_percent" numeric DEFAULT 0, "p_fee_amount" numeric DEFAULT 0, "p_days_since_purchase" integer DEFAULT 0, "p_original_payment_method" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_now                 TIMESTAMPTZ := NOW();
  v_order               RECORD;
  v_item                JSONB;
  v_product_id          TEXT;
  v_qty                 NUMERIC;
  v_ordered_qty         NUMERIC;
  v_already_returned    NUMERIC;
  v_new_total_returned  NUMERIC;
  v_customer_id_clean   TEXT;
  v_lot_id              TEXT;
  v_lot_code            TEXT;
  v_lot_exists          BOOLEAN;
  v_points_to_deduct    NUMERIC := 0;
  v_point_rate          NUMERIC;
  v_is_point_enabled    BOOLEAN;
  v_eligible_subtotal   NUMERIC := 0;
  v_return_item_id      TEXT;
  v_qty_after           NUMERIC;
  v_valuation_rate      NUMERIC;
  v_orig_cost           NUMERIC;
BEGIN
  IF p_id IS NULL OR p_id = '' THEN RAISE EXCEPTION 'return_order.id is required'; END IF;
  IF p_original_order_id IS NULL OR p_original_order_id = '' THEN RAISE EXCEPTION 'original_order_id is required'; END IF;
  IF jsonb_typeof(p_items) != 'array' OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Phiếu trả phải có ít nhất 1 sản phẩm'; END IF;
  IF p_total_refund_amount < 0 THEN RAISE EXCEPTION 'Tổng tiền hoàn không thể âm'; END IF;

  v_customer_id_clean := NULLIF(NULLIF(p_customer_id, ''), 'guest');

  SELECT id, total_amount, total_returned_amount, customer_id INTO v_order
  FROM orders WHERE id = p_original_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Đơn hàng gốc % không tồn tại', p_original_order_id; END IF;

  v_new_total_returned := COALESCE(v_order.total_returned_amount, 0) + p_total_refund_amount;
  IF v_new_total_returned > COALESCE(v_order.total_amount, 0) + 0.01 THEN
    RAISE EXCEPTION 'Tổng tiền trả (%) vượt quá tổng tiền đơn hàng (%)', v_new_total_returned, v_order.total_amount USING ERRCODE = 'P0001';
  END IF;

  IF v_customer_id_clean IS NOT NULL THEN
    PERFORM 1 FROM customers WHERE id = v_customer_id_clean FOR UPDATE;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := v_item->>'productId';
    v_qty := COALESCE((v_item->>'quantity')::NUMERIC, 0);
    IF v_qty <= 0 THEN RAISE EXCEPTION 'Số lượng trả của "%" phải > 0', v_item->>'productName'; END IF;
    SELECT COALESCE(SUM(quantity), 0) INTO v_ordered_qty FROM order_items WHERE order_id = p_original_order_id AND product_id = v_product_id;
    IF v_ordered_qty = 0 THEN RAISE EXCEPTION 'Sản phẩm "%" không có trong đơn hàng gốc', v_item->>'productName' USING ERRCODE = 'P0001'; END IF;
    SELECT COALESCE(SUM(roi.quantity), 0) INTO v_already_returned FROM return_order_items roi JOIN return_orders ro ON ro.id = roi.return_order_id WHERE ro.original_order_id = p_original_order_id AND roi.product_id = v_product_id AND ro.status != 'cancelled';
    IF v_already_returned + v_qty > v_ordered_qty + 0.001 THEN
      RAISE EXCEPTION 'Trả vượt số đã bán cho "%" (đã bán %, đã trả %, đang trả thêm %)', v_item->>'productName', v_ordered_qty, v_already_returned, v_qty USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  BEGIN
    SELECT point_conversion_rate INTO v_point_rate FROM app_settings WHERE id = 'default';
  EXCEPTION WHEN OTHERS THEN v_point_rate := NULL; END;
  IF v_point_rate IS NULL OR v_point_rate <= 0 THEN v_point_rate := 100000; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := v_item->>'productId';
    SELECT is_point_accumulation_enabled INTO v_is_point_enabled FROM products WHERE id = v_product_id;
    IF v_is_point_enabled THEN v_eligible_subtotal := v_eligible_subtotal + COALESCE((v_item->>'subtotal')::NUMERIC, 0); END IF;
  END LOOP;
  v_points_to_deduct := FLOOR(v_eligible_subtotal / v_point_rate);

  BEGIN
    INSERT INTO return_orders (id, original_order_id, date, customer_id, customer_name, total_refund_amount, refund_method, debt_reduction, cash_refund, reason, note, status, gross_refund_amount, fee_percent, fee_amount, days_since_purchase, original_payment_method, points_deducted, created_at, updated_at)
    VALUES (p_id, p_original_order_id, v_now, v_customer_id_clean, p_customer_name, p_total_refund_amount, 'cash', p_debt_reduction, p_cash_refund, p_reason, p_note, 'completed', COALESCE(p_gross_refund_amount, p_total_refund_amount), p_fee_percent, p_fee_amount, p_days_since_purchase, p_original_payment_method, v_points_to_deduct, v_now, v_now);
  EXCEPTION WHEN undefined_column THEN
    INSERT INTO return_orders (id, original_order_id, date, customer_id, customer_name, total_refund_amount, refund_method, debt_reduction, cash_refund, reason, note, status, created_at, updated_at)
    VALUES (p_id, p_original_order_id, v_now, v_customer_id_clean, p_customer_name, p_total_refund_amount, 'cash', p_debt_reduction, p_cash_refund, p_reason, p_note, 'completed', v_now, v_now);
  END;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := v_item->>'productId';
    v_lot_id     := NULLIF(v_item->>'lotId', '');
    v_lot_code   := NULLIF(v_item->>'lotCode', '');
    IF v_lot_id IS NULL THEN
      SELECT lot_id, lot_code INTO v_lot_id, v_lot_code FROM order_items WHERE order_id = p_original_order_id AND product_id = v_product_id AND (lot_code = v_lot_code OR v_lot_code IS NULL) ORDER BY (CASE WHEN lot_code = v_lot_code THEN 0 ELSE 1 END), id ASC LIMIT 1;
    END IF;
    v_lot_id   := NULLIF(v_lot_id, '');
    v_lot_code := NULLIF(v_lot_code, '');
    INSERT INTO return_order_items (id, return_order_id, product_id, product_name, quantity, unit_name, unit_price, subtotal, reason, lot_id, lot_code)
    VALUES (p_id || '_' || v_product_id || '_' || COALESCE(v_lot_id, floor(random()*1000000)::text), p_id, v_product_id, v_item->>'productName', COALESCE((v_item->>'quantity')::NUMERIC, 0), v_item->>'unitName', COALESCE((v_item->>'unitPrice')::NUMERIC, 0), COALESCE((v_item->>'subtotal')::NUMERIC, 0), COALESCE(v_item->>'reason', ''), v_lot_id, v_lot_code) RETURNING id INTO v_return_item_id;
  END LOOP;

  UPDATE orders SET has_return = true, total_returned_amount = v_new_total_returned WHERE id = p_original_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := v_item->>'productId';
    v_qty        := COALESCE((v_item->>'quantity')::NUMERIC, 0);
    v_lot_id     := NULLIF(v_item->>'lotId', '');
    v_lot_code   := NULLIF(v_item->>'lotCode', '');
    IF v_qty <= 0 THEN CONTINUE; END IF;
    IF v_lot_id IS NULL THEN
      SELECT lot_id, lot_code INTO v_lot_id, v_lot_code FROM order_items WHERE order_id = p_original_order_id AND product_id = v_product_id AND (lot_code = v_lot_code OR v_lot_code IS NULL) ORDER BY (CASE WHEN lot_code = v_lot_code THEN 0 ELSE 1 END), id ASC LIMIT 1;
    END IF;
    v_lot_id   := NULLIF(v_lot_id, '');
    v_lot_code := NULLIF(v_lot_code, '');
    SELECT id INTO v_return_item_id FROM return_order_items WHERE return_order_id = p_id AND product_id = v_product_id AND (lot_id = v_lot_id OR (lot_id IS NULL AND v_lot_id IS NULL)) ORDER BY id DESC LIMIT 1;
    IF v_lot_id IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM product_lots WHERE id = v_lot_id) INTO v_lot_exists;
      IF v_lot_exists THEN
        PERFORM 1 FROM product_lots WHERE id = v_lot_id FOR UPDATE;
        UPDATE product_lots SET quantity = COALESCE(quantity, 0) + v_qty, updated_at = NOW() WHERE id = v_lot_id;
      ELSE
        INSERT INTO product_lots (id, product_id, code, expiry_date, quantity, original_quantity, created_at, updated_at)
        VALUES (v_lot_id, v_product_id, COALESCE(v_lot_code, 'RECOVERED_RTN'), NULL, v_qty, v_qty, NOW(), NOW());
      END IF;
      PERFORM sync_product_quantity_from_lots(v_product_id);
    ELSE
      PERFORM 1 FROM products WHERE id = v_product_id FOR UPDATE;
      UPDATE products SET quantity = COALESCE(quantity, 0) + v_qty WHERE id = v_product_id;
    END IF;
    v_qty_after := public.calc_qty_after_transaction(v_product_id, v_lot_id, v_qty);
    SELECT cost INTO v_orig_cost FROM order_items WHERE order_id = p_original_order_id AND product_id = v_product_id AND (lot_id = v_lot_id OR (lot_id IS NULL AND v_lot_id IS NULL)) ORDER BY id ASC LIMIT 1;
    v_valuation_rate := COALESCE(v_orig_cost, get_product_valuation_rate(v_product_id, v_lot_id));
    PERFORM insert_stock_ledger_entry(v_now, 'Delivery Note'::TEXT, p_id, v_return_item_id, v_product_id, v_lot_id, 'Kho Chính'::TEXT, v_qty, v_qty_after, v_valuation_rate, v_valuation_rate, 0::NUMERIC, COALESCE(v_item->>'reason', 'Trả hàng'), FALSE);
  END LOOP;

  IF v_customer_id_clean IS NOT NULL THEN
    UPDATE customers SET
      debt           = GREATEST(0, COALESCE(debt, 0) - p_debt_reduction),
      total_spent    = GREATEST(0, COALESCE(total_spent, 0) - p_total_refund_amount),
      loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) - v_points_to_deduct),
      updated_at     = v_now
    WHERE id = v_customer_id_clean;

    -- Phase 8b: GHI BÚT TOÁN CÔNG NỢ KH (Sales Return giảm nợ)
    IF p_debt_reduction > 0 THEN
      PERFORM public.insert_customer_ledger_entry(
        p_customer_id    := v_customer_id_clean,
        p_reference_type := 'return',
        p_reference_id   := p_id,
        p_amount         := -p_debt_reduction,
        p_reason         := 'Trả hàng giảm nợ ' || p_id,
        p_created_by     := COALESCE(current_setting('request.jwt.claim.sub', true), 'system'),
        p_created_at     := v_now
      );
    END IF;

    IF v_points_to_deduct > 0 THEN
      INSERT INTO point_history (id, customer_id, date, type, amount, description, order_id)
      VALUES ('PH_RET_' || p_id, v_customer_id_clean, v_now, 'return', -v_points_to_deduct, 'Trừ điểm do trả hàng từ đơn ' || p_original_order_id, p_original_order_id);
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'return_id', p_id, 'new_total_returned', v_new_total_returned, 'points_deducted', v_points_to_deduct);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."create_supplier_exchange"("p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_exchange_id       TEXT;
  v_code              TEXT;
  v_date              TIMESTAMPTZ;
  v_supplier_id       TEXT;
  v_supplier_name     TEXT;
  v_reference_receipt_id TEXT;
  v_reason            TEXT;
  v_note              TEXT;
  v_status            TEXT;
  v_return_total      NUMERIC := 0;
  v_received_total    NUMERIC := 0;
  v_debt_adjustment   NUMERIC := 0;

  v_return_item       JSONB;
  v_received_item     JSONB;
  v_product           RECORD;
  v_lot               RECORD;
  v_import_item       RECORD;
  v_clean_lot_code    TEXT;
  v_clean_expiry      DATE;
  v_new_lot_id        TEXT;
  v_existing_lot      RECORD;
  v_return_qty        NUMERIC;
  v_received_qty      NUMERIC;
  v_return_cost       NUMERIC;
  v_received_cost     NUMERIC;
  v_qty_before        NUMERIC;
BEGIN
  -- ═══════════════════════════════════════════════════════════════════
  -- 0. PARSE & VALIDATE INPUT
  -- ═══════════════════════════════════════════════════════════════════
  v_exchange_id := p_payload->>'id';
  v_code := COALESCE(p_payload->>'code', get_supplier_exchange_auto_code());
  v_date := COALESCE((p_payload->>'date')::TIMESTAMPTZ, NOW());
  v_supplier_id := p_payload->>'supplier_id';
  v_reference_receipt_id := p_payload->>'reference_receipt_id';
  v_reason := COALESCE(p_payload->>'reason', '');
  v_note := p_payload->>'note';
  v_status := COALESCE(p_payload->>'status', 'completed');

  IF v_exchange_id IS NULL OR v_exchange_id = '' THEN
    RAISE EXCEPTION 'Mã phiếu đổi trả không được để trống';
  END IF;
  IF v_supplier_id IS NULL OR v_supplier_id = '' THEN
    RAISE EXCEPTION 'Vui lòng chọn nhà cung cấp';
  END IF;
  IF v_reference_receipt_id IS NULL OR v_reference_receipt_id = '' THEN
    RAISE EXCEPTION 'Vui lòng chọn phiếu nhập gốc';
  END IF;

  -- Lấy tên NCC và khóa dòng
  SELECT name INTO v_supplier_name FROM suppliers WHERE id = v_supplier_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nhà cung cấp % không tồn tại', v_supplier_id;
  END IF;
  PERFORM 1 FROM suppliers WHERE id = v_supplier_id FOR UPDATE;

  -- Kiểm tra phiếu nhập gốc tồn tại và thuộc NCC
  IF NOT EXISTS (
    SELECT 1 FROM import_receipts
    WHERE id = v_reference_receipt_id AND supplier_id = v_supplier_id
  ) THEN
    RAISE EXCEPTION 'Phiếu nhập gốc không tồn tại hoặc không thuộc nhà cung cấp đã chọn';
  END IF;

  -- ═══════════════════════════════════════════════════════════════════
  -- 1. VALIDATE HÀNG TRẢ
  -- ═══════════════════════════════════════════════════════════════════
  IF jsonb_typeof(p_payload->'return_items') != 'array' OR jsonb_array_length(p_payload->'return_items') = 0 THEN
    RAISE EXCEPTION 'Phiếu phải có ít nhất 1 dòng hàng trả';
  END IF;

  FOR v_return_item IN SELECT * FROM jsonb_array_elements(p_payload->'return_items') LOOP
    v_return_qty := COALESCE((v_return_item->>'quantity')::NUMERIC, 0);
    v_return_cost := COALESCE((v_return_item->>'cost')::NUMERIC, 0);

    IF v_return_qty <= 0 THEN
      RAISE EXCEPTION 'Số lượng trả phải > 0';
    END IF;

    -- Kiểm tra sản phẩm có quản lý lô
    SELECT id, name, has_lots INTO v_product
    FROM products WHERE id = v_return_item->>'product_id' FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Sản phẩm % không tồn tại', v_return_item->>'product_id';
    END IF;
    IF NOT v_product.has_lots THEN
      RAISE EXCEPTION 'Sản phẩm "%" không bật quản lý lô, không thể đổi trả theo lô', v_product.name;
    END IF;

    -- Kiểm tra dòng nhập gốc
    SELECT * INTO v_import_item
    FROM import_items
    WHERE id = NULLIF(v_return_item->>'reference_import_item_id', '')::UUID
      AND receipt_id = v_reference_receipt_id
      AND product_id = v_return_item->>'product_id'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Dòng hàng trả không khớp với phiếu nhập gốc';
    END IF;

    -- Kiểm tra lô cũ trong kho
    SELECT id, code, expiry_date, quantity, cost INTO v_lot
    FROM product_lots
    WHERE id = NULLIF(v_return_item->>'lot_id', '')
      AND product_id = v_product.id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Lô % của sản phẩm "%" không tồn tại trong kho', v_return_item->>'lot_id', v_product.name;
    END IF;

    IF v_lot.code IS DISTINCT FROM v_import_item.lot_code THEN
      RAISE EXCEPTION 'Lô trả "%" không khớp với lô trong phiếu nhập gốc', v_lot.code;
    END IF;

    IF v_lot.quantity < v_return_qty THEN
      RAISE EXCEPTION 'Lô "%" của "%" không đủ tồn để trả (còn %, cần %)', v_lot.code, v_product.name, v_lot.quantity, v_return_qty;
    END IF;

    v_return_total := v_return_total + (v_return_qty * v_return_cost);
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════
  -- 2. VALIDATE HÀNG NHẬN
  -- ═══════════════════════════════════════════════════════════════════
  IF jsonb_typeof(p_payload->'received_items') != 'array' OR jsonb_array_length(p_payload->'received_items') = 0 THEN
    RAISE EXCEPTION 'Phiếu phải có ít nhất 1 dòng hàng nhận đổi';
  END IF;

  FOR v_received_item IN SELECT * FROM jsonb_array_elements(p_payload->'received_items') LOOP
    v_received_qty := COALESCE((v_received_item->>'quantity')::NUMERIC, 0);
    v_received_cost := COALESCE((v_received_item->>'cost')::NUMERIC, 0);

    IF v_received_qty <= 0 THEN
      RAISE EXCEPTION 'Số lượng nhận đổi phải > 0';
    END IF;

    SELECT id, name, has_lots INTO v_product
    FROM products WHERE id = v_received_item->>'product_id' FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Sản phẩm % không tồn tại', v_received_item->>'product_id';
    END IF;
    IF NOT v_product.has_lots THEN
      RAISE EXCEPTION 'Sản phẩm "%" không bật quản lý lô', v_product.name;
    END IF;

    v_clean_lot_code := TRIM(v_received_item->>'lot_code');
    IF v_clean_lot_code IS NULL OR v_clean_lot_code = '' THEN
      RAISE EXCEPTION 'Số lô mới không được để trống';
    END IF;

    v_received_total := v_received_total + (v_received_qty * v_received_cost);
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════
  -- 3. KIỂM TRA CÙNG SẢN PHẨM VÀ SỐ LƯỢNG CÂN BẰNG
  -- ═══════════════════════════════════════════════════════════════════
  IF (
    SELECT COUNT(DISTINCT product_id)
    FROM (
      SELECT product_id FROM jsonb_to_recordset(p_payload->'return_items') AS x(product_id TEXT)
      UNION ALL
      SELECT product_id FROM jsonb_to_recordset(p_payload->'received_items') AS x(product_id TEXT)
    ) t
  ) > (
    SELECT COUNT(DISTINCT product_id)
    FROM jsonb_to_recordset(p_payload->'return_items') AS x(product_id TEXT)
  ) THEN
    RAISE EXCEPTION 'Chỉ cho phép đổi cùng sản phẩm. Mỗi sản phẩm trả phải có sản phẩm nhận đổi tương ứng';
  END IF;

  -- Tính chênh lệch công nợ
  v_debt_adjustment := v_received_total - v_return_total;

  -- ═══════════════════════════════════════════════════════════════════
  -- 4. INSERT HEADER
  -- ═══════════════════════════════════════════════════════════════════
  INSERT INTO supplier_exchanges (
    id, code, date, supplier_id, supplier_name, reference_receipt_id,
    status, return_total_value, received_total_value, debt_adjustment,
    reason, note, created_at, updated_at
  ) VALUES (
    v_exchange_id, v_code, v_date, v_supplier_id, v_supplier_name, v_reference_receipt_id,
    v_status, v_return_total, v_received_total, v_debt_adjustment,
    v_reason, v_note, NOW(), NOW()
  );

  -- ═══════════════════════════════════════════════════════════════════
  -- 5. INSERT HÀNG TRẢ + TRỪ TỒN LÔ CŨ
  -- ═══════════════════════════════════════════════════════════════════
  FOR v_return_item IN SELECT * FROM jsonb_array_elements(p_payload->'return_items') LOOP
    v_return_qty := COALESCE((v_return_item->>'quantity')::NUMERIC, 0);
    v_return_cost := COALESCE((v_return_item->>'cost')::NUMERIC, 0);

    SELECT id, code, expiry_date, quantity, cost INTO v_lot
    FROM product_lots
    WHERE id = NULLIF(v_return_item->>'lot_id', '') AND product_id = v_return_item->>'product_id'
    FOR UPDATE;

    INSERT INTO supplier_exchange_return_items (
      exchange_id, product_id, product_name, lot_id, lot_code, expiry_date,
      quantity, cost, total_value, reference_import_item_id
    ) VALUES (
      v_exchange_id,
      v_return_item->>'product_id',
      v_product.name,
      v_lot.id,
      v_lot.code,
      v_lot.expiry_date,
      v_return_qty,
      v_return_cost,
      v_return_qty * v_return_cost,
      NULLIF(v_return_item->>'reference_import_item_id', '')::UUID
    );

    -- Trừ tồn lô cũ
    UPDATE product_lots
      SET quantity = quantity - v_return_qty, updated_at = NOW()
    WHERE id = v_lot.id;

    -- Ghi nhật ký biến động kho
    INSERT INTO inventory_movements (
      product_id, movement_type, reference_type, reference_id,
      qty_before, qty_change, qty_after, lot_code, created_at
    ) VALUES (
      v_return_item->>'product_id',
      'SUPPLIER_RETURN',
      'SUPPLIER_EXCHANGE',
      v_exchange_id,
      v_lot.quantity,
      -v_return_qty,
      v_lot.quantity - v_return_qty,
      v_lot.code,
      NOW()
    );
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════
  -- 6. INSERT HÀNG NHẬN + TẠO/CỘNG LÔ MỚI
  -- ═══════════════════════════════════════════════════════════════════
  FOR v_received_item IN SELECT * FROM jsonb_array_elements(p_payload->'received_items') LOOP
    v_received_qty := COALESCE((v_received_item->>'quantity')::NUMERIC, 0);
    v_received_cost := COALESCE((v_received_item->>'cost')::NUMERIC, 0);
    v_clean_lot_code := TRIM(v_received_item->>'lot_code');
    v_clean_expiry := NULLIF(v_received_item->>'expiry_date', '')::DATE;

    SELECT id, name INTO v_product
    FROM products WHERE id = v_received_item->>'product_id';

    -- Kiểm tra lô mới đã tồn tại chưa
    SELECT id, quantity INTO v_existing_lot
    FROM product_lots
    WHERE product_id = v_product.id AND code = v_clean_lot_code;

    IF FOUND THEN
      -- Cộng thêm vào lô đã tồn tại
      v_new_lot_id := v_existing_lot.id;
      v_qty_before := v_existing_lot.quantity;
      UPDATE product_lots
        SET quantity = quantity + v_received_qty,
            cost = v_received_cost,
            expiry_date = COALESCE(v_clean_expiry, expiry_date),
            updated_at = NOW()
      WHERE id = v_new_lot_id;
    ELSE
      -- Tạo lô mới
      v_new_lot_id := 'lot_' || v_product.id || '_' || REGEXP_REPLACE(v_clean_lot_code, '[^a-zA-Z0-9]', '_', 'g') || '_' || FLOOR(EXTRACT(EPOCH FROM NOW()))::TEXT;
      v_qty_before := 0;
      INSERT INTO product_lots (
        id, product_id, code, expiry_date, quantity, original_quantity, cost, created_at, updated_at
      ) VALUES (
        v_new_lot_id,
        v_product.id,
        v_clean_lot_code,
        v_clean_expiry,
        v_received_qty,
        v_received_qty,
        v_received_cost,
        NOW(),
        NOW()
      );
    END IF;

    INSERT INTO supplier_exchange_received_items (
      exchange_id, product_id, product_name, lot_id, lot_code, expiry_date,
      quantity, cost, total_value
    ) VALUES (
      v_exchange_id,
      v_received_item->>'product_id',
      v_product.name,
      v_new_lot_id,
      v_clean_lot_code,
      v_clean_expiry,
      v_received_qty,
      v_received_cost,
      v_received_qty * v_received_cost
    );

    INSERT INTO inventory_movements (
      product_id, movement_type, reference_type, reference_id,
      qty_before, qty_change, qty_after, lot_code, created_at
    ) VALUES (
      v_received_item->>'product_id',
      'SUPPLIER_EXCHANGE_IN',
      'SUPPLIER_EXCHANGE',
      v_exchange_id,
      v_qty_before,
      v_received_qty,
      v_qty_before + v_received_qty,
      v_clean_lot_code,
      NOW()
    );
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════
  -- 7. CẬP NHẬT CÔNG NỢ NCC
  -- ═══════════════════════════════════════════════════════════════════
  UPDATE suppliers
    SET debt = GREATEST(0, COALESCE(debt, 0) + v_debt_adjustment),
        updated_at = NOW()
  WHERE id = v_supplier_id;

  -- ═══════════════════════════════════════════════════════════════════
  -- 8. KIỂM TRA NHẤT QUÁN TỒN KHO
  -- ═══════════════════════════════════════════════════════════════════
  PERFORM check_inventory_consistency(
    ARRAY(
      SELECT DISTINCT product_id FROM supplier_exchange_return_items WHERE exchange_id = v_exchange_id
      UNION
      SELECT DISTINCT product_id FROM supplier_exchange_received_items WHERE exchange_id = v_exchange_id
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'exchange_id', v_exchange_id,
    'code', v_code,
    'status', v_status,
    'return_total_value', v_return_total,
    'received_total_value', v_received_total,
    'debt_adjustment', v_debt_adjustment
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."create_tenant_api_key"("p_tenant_id" "uuid", "p_name" "text", "p_version" integer DEFAULT 1) RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_key TEXT;
  v_hash TEXT;
  v_preview TEXT;
  v_row public.tenant_api_keys;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo API key' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu tenant_id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Tên API key không được để trống';
  END IF;

  v_key := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(extensions.digest(v_key, 'sha256'), 'hex');
  v_preview := right(v_key, 4);

  INSERT INTO public.tenant_api_keys (
    tenant_id, name, api_key_hash, api_key_preview, version, created_by
  ) VALUES (
    p_tenant_id, trim(p_name), v_hash, v_preview, COALESCE(p_version, 1), auth.uid()
  )
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id', v_row.id,
    'tenantId', v_row.tenant_id,
    'name', v_row.name,
    'apiKey', v_key,
    'apiKeyPreview', v_row.api_key_preview,
    'version', v_row.version,
    'status', v_row.status,
    'createdAt', v_row.created_at,
    'lastUsedAt', v_row.last_used_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."create_tenant_webhook"("p_tenant_id" "uuid", "p_name" "text", "p_url" "text", "p_events" "text"[] DEFAULT ARRAY['*'::"text"], "p_secret" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_row public.tenant_webhooks;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo webhook' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu tenant_id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Tên webhook không được để trống';
  END IF;

  IF p_url IS NULL OR length(trim(p_url)) = 0 THEN
    RAISE EXCEPTION 'URL webhook không được để trống';
  END IF;

  IF p_url !~ '^https?://' THEN
    RAISE EXCEPTION 'URL webhook phải bắt đầu bằng http:// hoặc https://';
  END IF;

  INSERT INTO public.tenant_webhooks (
    tenant_id, name, url, events, secret, created_by
  ) VALUES (
    p_tenant_id, trim(p_name), trim(p_url),
    COALESCE(p_events, ARRAY['*']::TEXT[]),
    p_secret,
    auth.uid()
  )
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id', v_row.id,
    'tenantId', v_row.tenant_id,
    'name', v_row.name,
    'url', v_row.url,
    'events', v_row.events,
    'status', v_row.status,
    'createdAt', v_row.created_at,
    'updatedAt', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."create_tenant_with_admin"("p_name" "text", "p_subdomain" "text", "p_plan" "text" DEFAULT 'free'::"text", "p_owner_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "public"."tenants"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_owner_id UUID;
  v_tenant public.tenants;
  v_plan TEXT;
  v_limits JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tạo tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    RAISE EXCEPTION 'Tên cửa hàng không được để trống';
  END IF;

  IF p_subdomain IS NULL OR TRIM(p_subdomain) = '' THEN
    RAISE EXCEPTION 'Subdomain không được để trống';
  END IF;

  v_plan := COALESCE(p_plan, 'free');
  IF NOT public.is_valid_plan(v_plan) THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', v_plan;
  END IF;

  v_owner_id := COALESCE(p_owner_user_id, auth.uid());
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Không xác định được chủ sở hữu tenant';
  END IF;

  INSERT INTO public.tenants (name, subdomain, plan, owner_id, status)
  VALUES (TRIM(p_name), TRIM(p_subdomain), v_plan, v_owner_id, 'active')
  RETURNING * INTO v_tenant;

  v_limits := public.get_default_plan_limit_values(v_plan);

  INSERT INTO public.tenant_subscriptions (tenant_id, plan, max_users, max_products, max_orders_per_month)
  VALUES (
    v_tenant.id,
    v_plan,
    COALESCE((v_limits->>'max_users')::INTEGER, 0),
    COALESCE((v_limits->>'max_products')::INTEGER, 0),
    COALESCE((v_limits->>'max_orders_per_month')::INTEGER, 0)
  );

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (v_tenant.id, v_owner_id, 'admin');

  RETURN v_tenant;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."current_tenant_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_header TEXT;
  v_tenant_id UUID;
BEGIN
  v_header := nullif(current_setting('request.headers', true)::json->>'x-tenant-id', '');
  IF v_header IS NULL THEN RETURN NULL; END IF;
  BEGIN
    v_tenant_id := v_header::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    v_tenant_id := NULL;
  END;
  RETURN v_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."decrement_product_quantity"("p_product_id" "text", "p_quantity" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE products
  SET quantity = COALESCE(quantity, 0) - p_quantity
  WHERE id = p_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."delete_2fa_backup_codes"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Chỉ người dùng hiện tại mới được xóa backup code của chính mình' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.admin_2fa_backup_codes WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."delete_disposal_with_restore"("p_disposal_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_item RECORD;
  v_status TEXT;
  v_qty_after NUMERIC;
  v_valuation_rate NUMERIC;
BEGIN
  SELECT status INTO v_status FROM disposals WHERE id = p_disposal_id FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Phiếu xuất hủy không tồn tại'; END IF;
  IF v_status = 'COMPLETED' THEN
    FOR v_item IN SELECT di.id, di.product_id, di.lot_id, di.quantity, di.reason FROM disposal_items di WHERE di.disposal_id = p_disposal_id
    LOOP
      IF v_item.lot_id IS NOT NULL THEN
        UPDATE product_lots AS pl SET quantity = pl.quantity + v_item.quantity WHERE pl.id = v_item.lot_id;
        PERFORM sync_product_quantity_from_lots(v_item.product_id);
      ELSE
        UPDATE products AS p SET quantity = p.quantity + v_item.quantity WHERE p.id = v_item.product_id;
      END IF;
      v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_item.lot_id, v_item.quantity);
      v_valuation_rate := get_product_valuation_rate(v_item.product_id, v_item.lot_id);
      PERFORM insert_stock_ledger_entry(NOW(), 'Stock Entry'::TEXT, p_disposal_id, v_item.id::TEXT, v_item.product_id, v_item.lot_id, 'Kho Chính'::TEXT, v_item.quantity, v_qty_after, v_valuation_rate, v_valuation_rate, 0::NUMERIC, COALESCE(v_item.reason, 'Xóa phiếu xuất hủy'), TRUE);
    END LOOP;
  END IF;
  DELETE FROM disposals WHERE id = p_disposal_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."delete_import_v2"("p_receipt_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_receipt          RECORD;
  v_item             RECORD;
  v_current_qty      NUMERIC;
  v_current_cost     NUMERIC;
  v_has_lots         BOOLEAN;
  v_new_qty          NUMERIC;
  v_new_cost         NUMERIC;
  v_allow_negative   BOOLEAN := FALSE;
  v_item_cost        NUMERIC;

  v_existing_lot_qty  NUMERIC;
  v_existing_lot_cost NUMERIC;
  v_new_lot_qty       NUMERIC;
  v_new_lot_cost      NUMERIC;

  v_affected_products TEXT[] := ARRAY[]::TEXT[];
  v_total_removed_qty NUMERIC := 0;

  v_ledger_lot_id    TEXT;
  v_qty_after        NUMERIC;
BEGIN
  SELECT * INTO v_receipt FROM import_receipts WHERE id = p_receipt_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phiếu nhập % không tồn tại trong hệ thống', p_receipt_id;
  END IF;

  IF v_receipt.status = 'draft' THEN
    DELETE FROM import_items WHERE receipt_id = p_receipt_id;
    DELETE FROM import_receipts WHERE id = p_receipt_id;
    RETURN jsonb_build_object('receipt_id', p_receipt_id, 'status', 'draft_deleted');
  END IF;

  BEGIN
    SELECT COALESCE(allow_negative_stock, FALSE) INTO v_allow_negative FROM app_settings LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_allow_negative := FALSE;
  END;

  FOR v_item IN SELECT * FROM import_items WHERE receipt_id = p_receipt_id
  LOOP
    v_item_cost := COALESCE(v_item.adjusted_cost, v_item.cost, 0);

    SELECT quantity, COALESCE(cost, 0), COALESCE(has_lots, FALSE)
    INTO v_current_qty, v_current_cost, v_has_lots
    FROM products WHERE id = v_item.product_id FOR UPDATE;

    IF NOT v_allow_negative AND v_current_qty < v_item.quantity THEN
      RAISE EXCEPTION 'Không thể xóa phiếu nhập %: Sản phẩm % đã bán vượt quá số lượng nhập (Tồn hiện tại %, yêu cầu trả %)',
        p_receipt_id, v_item.product_name, v_current_qty, v_item.quantity;
    END IF;

    v_new_qty := v_current_qty - v_item.quantity;

    IF v_new_qty > 0 THEN
      v_new_cost := ROUND(((v_current_qty * v_current_cost) - (v_item.quantity * v_item_cost)) / v_new_qty, 2);
      IF v_new_cost < 0 THEN v_new_cost := 0; END IF;
    ELSE
      v_new_cost := 0;
    END IF;

    UPDATE products
    SET quantity = v_new_qty, cost = v_new_cost
    WHERE id = v_item.product_id;

    v_ledger_lot_id := NULL;

    IF v_has_lots THEN
      SELECT quantity, COALESCE(cost, 0)
      INTO v_existing_lot_qty, v_existing_lot_cost
      FROM product_lots
      WHERE product_id = v_item.product_id AND code = v_item.lot_code
      FOR UPDATE;

      IF NOT v_allow_negative AND (NOT FOUND OR v_existing_lot_qty < v_item.quantity) THEN
        RAISE EXCEPTION '%', format('Không thể xóa phiếu nhập %: Lô % của sản phẩm % không đủ tồn kho để giảm trừ (Lô hiện có %, yêu cầu trừ %)',
          p_receipt_id, v_item.lot_code, v_item.product_name, COALESCE(v_existing_lot_qty, 0), v_item.quantity);
      END IF;

      v_new_lot_qty := COALESCE(v_existing_lot_qty, 0) - v_item.quantity;

      IF v_new_lot_qty > 0 THEN
        v_new_lot_cost := ROUND(
          ((COALESCE(v_existing_lot_qty, 0) * COALESCE(v_existing_lot_cost, 0)) - (v_item.quantity * v_item_cost))
          / v_new_lot_qty,
          2
        );
        IF v_new_lot_cost < 0 THEN v_new_lot_cost := 0; END IF;
      ELSE
        v_new_lot_cost := 0;
      END IF;

      IF v_allow_negative THEN
        UPDATE product_lots
        SET quantity = COALESCE(quantity, 0) - v_item.quantity,
            cost = CASE WHEN COALESCE(quantity, 0) - v_item.quantity > 0 THEN v_new_lot_cost ELSE COALESCE(cost, 0) END,
            updated_at = NOW()
        WHERE product_id = v_item.product_id AND code = v_item.lot_code;

        DELETE FROM product_lots
        WHERE product_id = v_item.product_id AND code = v_item.lot_code AND quantity = 0;
      ELSE
        UPDATE product_lots
        SET quantity = GREATEST(0, COALESCE(quantity, 0) - v_item.quantity),
            cost = CASE WHEN GREATEST(0, COALESCE(quantity, 0) - v_item.quantity) > 0 THEN v_new_lot_cost ELSE COALESCE(cost, 0) END,
            updated_at = NOW()
        WHERE product_id = v_item.product_id AND code = v_item.lot_code;

        DELETE FROM product_lots
        WHERE product_id = v_item.product_id AND code = v_item.lot_code AND quantity <= 0;

        PERFORM sync_product_quantity_from_lots(v_item.product_id);
      END IF;

      SELECT id INTO v_ledger_lot_id
      FROM product_lots
      WHERE product_id = v_item.product_id AND code = v_item.lot_code
      LIMIT 1;
    END IF;

    INSERT INTO inventory_movements (
      product_id, movement_type, reference_type, reference_id, qty_before, qty_change, qty_after, lot_code, created_at
    ) VALUES (
      v_item.product_id, 'DELETE_IMPORT', 'RECEIPT', p_receipt_id, v_current_qty, -v_item.quantity, v_new_qty, v_item.lot_code, NOW()
    );

    v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_ledger_lot_id, -v_item.quantity);
    PERFORM insert_stock_ledger_entry(
      v_receipt.date,
      'Purchase Receipt'::TEXT,
      p_receipt_id,
      v_item.id::TEXT,
      v_item.product_id,
      v_ledger_lot_id,
      'Kho Chính'::TEXT,
      -v_item.quantity,
      v_qty_after,
      v_item_cost,
      v_item_cost,
      0::NUMERIC,
      'Xóa phiếu nhập'::TEXT,
      TRUE
    );

    v_affected_products := array_append(v_affected_products, v_item.product_id);
    v_total_removed_qty := v_total_removed_qty + v_item.quantity;
  END LOOP;

  IF v_receipt.debt_recorded > 0 AND v_receipt.supplier_id IS NOT NULL THEN
    UPDATE suppliers
    SET debt = GREATEST(0, debt - v_receipt.debt_recorded)
    WHERE id = v_receipt.supplier_id;
  END IF;

  DELETE FROM import_items WHERE receipt_id = p_receipt_id;
  DELETE FROM import_receipts WHERE id = p_receipt_id;

  PERFORM check_inventory_consistency(v_affected_products);

  RETURN jsonb_build_object(
    'receipt_id', p_receipt_id,
    'affected_products', to_jsonb(v_affected_products),
    'total_qty_removed', v_total_removed_qty,
    'status', 'completed_deleted'
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."delete_integration"("p_integration_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa integration' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.integrations WHERE id = p_integration_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy integration: %', p_integration_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."delete_inventory_count_rpc"("p_count_id" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_status TEXT;
BEGIN
  -- 1. Tìm và khóa header phiếu kiểm
  SELECT status INTO v_status FROM inventory_counts WHERE id = p_count_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phiếu kiểm kê không tồn tại';
  END IF;

  -- 2. CHẶN xóa hẳn phiếu 'completed' (Phase 7 SSOT Hardening — defense-in-depth)
  IF v_status = 'completed' THEN
    RAISE EXCEPTION 'Không thể xóa hẳn phiếu kiểm kê đã hoàn thành. Dùng cancel_inventory_count_rpc để hủy (giữ lịch sử + hoàn kho + bút toán đảo).';
  END IF;

  -- 3. Chỉ cho phép xóa hẳn khi draft hoặc cancelled
  IF v_status NOT IN ('draft', 'cancelled') THEN
    RAISE EXCEPTION 'Chỉ được xóa hẳn phiếu kiểm kê ở trạng thái draft hoặc cancelled (hiện tại: %)', v_status;
  END IF;

  -- 4. Xóa vật lý chứng từ
  --    - draft: chưa áp dụng delta, chưa ghi stock ledger → an toàn xóa.
  --    - cancelled: cancel_inventory_count_rpc đã hoàn kho + ghi bút toán đảo
  --      vào stock_movements. KHÔNG hoàn kho lại ở đây (tránh double-count).
  --      Stock_movements giữ nguyên dòng đảo để bảo toàn audit trail.
  DELETE FROM inventory_count_items WHERE count_id = p_count_id;
  DELETE FROM inventory_counts WHERE id = p_count_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."delete_maintenance_window"("p_id" "uuid") RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa maintenance window' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.maintenance_windows WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy maintenance window: %', p_id;
  END IF;

  RETURN json_build_object('id', p_id, 'deleted', true);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."delete_order"("p_order_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order             RECORD;
  v_item              RECORD;
  v_product           RECORD;
  v_active_returns    INTEGER;
  v_points_diff       NUMERIC;
  v_ratio             NUMERIC;
  v_base_qty          NUMERIC;
  v_conv              JSONB;
  v_first_lot_id      TEXT;
BEGIN
  IF p_order_id IS NULL OR p_order_id = '' THEN RAISE EXCEPTION 'order_id is required'; END IF;

  SELECT id, customer_id, total_amount, paid_amount, debt_recorded, points_earned, points_redeemed, has_return INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Đơn hàng % không tồn tại', p_order_id; END IF;

  SELECT COUNT(*) INTO v_active_returns FROM return_orders WHERE original_order_id = p_order_id AND status != 'cancelled';
  IF v_active_returns > 0 THEN RAISE EXCEPTION 'Đơn hàng % đã có % phiếu trả còn hiệu lực. Vui lòng huỷ các phiếu trả trước khi xoá đơn.', p_order_id, v_active_returns USING ERRCODE = 'P0001'; END IF;

  FOR v_item IN SELECT product_id, product_name, quantity, unit_name, lot_id FROM order_items WHERE order_id = p_order_id LOOP
    SELECT id, name, unit, conversion_units, has_lots INTO v_product FROM products WHERE id = v_item.product_id FOR UPDATE;
    IF NOT FOUND THEN RAISE NOTICE 'Sản phẩm % đã bị xoá, không hoàn kho được', v_item.product_id; CONTINUE; END IF;
    v_ratio := 1;
    IF v_item.unit_name IS NOT NULL AND v_item.unit_name != v_product.unit THEN
      IF jsonb_typeof(v_product.conversion_units) = 'array' THEN
        FOR v_conv IN SELECT * FROM jsonb_array_elements(v_product.conversion_units) LOOP
          IF v_conv->>'name' = v_item.unit_name THEN v_ratio := COALESCE((v_conv->>'ratio')::NUMERIC, 1); EXIT; END IF;
        END LOOP;
      END IF;
    END IF;
    v_base_qty := v_item.quantity * v_ratio;
    IF v_product.has_lots THEN
      IF v_item.lot_id IS NOT NULL AND EXISTS(SELECT 1 FROM product_lots WHERE id = v_item.lot_id) THEN
        UPDATE product_lots SET quantity = COALESCE(quantity, 0) + v_base_qty, updated_at = NOW() WHERE id = v_item.lot_id;
      ELSE
        SELECT id INTO v_first_lot_id FROM product_lots WHERE product_id = v_product.id ORDER BY expiry_date ASC NULLS LAST, created_at ASC LIMIT 1 FOR UPDATE;
        IF v_first_lot_id IS NOT NULL THEN
          UPDATE product_lots SET quantity = COALESCE(quantity, 0) + v_base_qty, updated_at = NOW() WHERE id = v_first_lot_id;
        ELSE
          INSERT INTO product_lots (id, product_id, code, quantity, original_quantity)
          VALUES ('LOT_REC_' || v_product.id || '_' || extract(epoch from NOW())::bigint, v_product.id, 'RECOVERED', v_base_qty, v_base_qty);
        END IF;
        PERFORM sync_product_quantity_from_lots(v_product.id);
      END IF;
    ELSE
      UPDATE products SET quantity = COALESCE(quantity, 0) + v_base_qty WHERE id = v_product.id;
    END IF;
  END LOOP;

  IF v_order.customer_id IS NOT NULL AND v_order.customer_id != 'guest' THEN
    v_points_diff := COALESCE(v_order.points_redeemed, 0) - COALESCE(v_order.points_earned, 0);
    UPDATE customers SET
      total_spent    = GREATEST(0, COALESCE(total_spent, 0) - COALESCE(v_order.total_amount, 0)),
      debt           = GREATEST(0, COALESCE(debt, 0) - COALESCE(v_order.debt_recorded, 0)),
      loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) + v_points_diff),
      updated_at     = NOW()
    WHERE id = v_order.customer_id;

    -- Phase 8b: GHI BÚT TOÁN CÔNG NỢ KH (cancel Sales Invoice đảo nợ)
    IF COALESCE(v_order.debt_recorded, 0) > 0 THEN
      PERFORM public.insert_customer_ledger_entry(
        p_customer_id    := v_order.customer_id,
        p_reference_type := 'cancel_order',
        p_reference_id   := p_order_id,
        p_amount         := -COALESCE(v_order.debt_recorded, 0),
        p_reason         := 'Xóa đơn ' || p_order_id || ' — đảo nợ',
        p_created_by     := COALESCE(current_setting('request.jwt.claim.sub', true), 'system'),
        p_created_at     := NOW()
      );
    END IF;
  END IF;

  DELETE FROM point_history WHERE order_id = p_order_id;
  DELETE FROM order_items WHERE order_id = p_order_id;
  DELETE FROM orders WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', true, 'deleted_order_id', p_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."delete_partner"("p_partner_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa partner' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.partners WHERE id = p_partner_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy partner: %', p_partner_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."delete_plan"("p_key" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_in_use BOOLEAN;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa gói' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_key IN ('free', 'vip') THEN
    RAISE EXCEPTION 'Không thể xóa gói mặc định %', p_key;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.tenants WHERE plan = p_key
    UNION ALL
    SELECT 1 FROM public.tenant_subscriptions WHERE plan = p_key
  ) INTO v_in_use;

  IF v_in_use THEN
    RAISE EXCEPTION 'Gói đang được sử dụng bởi tenant, không thể xóa';
  END IF;

  DELETE FROM public.plans WHERE key = p_key;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."delete_tenant_safe"("p_tenant_id" "uuid") RETURNS "public"."tenants"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_tenant public.tenants;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.tenants
  SET status = 'archived',
      archived_at = now(),
      updated_at = now()
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  RETURN v_tenant;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."delete_tenant_webhook"("p_webhook_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa webhook' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.tenant_webhooks WHERE id = p_webhook_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy webhook: %', p_webhook_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."enqueue_heavy_op_job"("p_tenant_id" "uuid", "p_job_type" "text", "p_payload" "jsonb" DEFAULT '{}'::"jsonb", "p_max_attempts" integer DEFAULT 3, "p_scheduled_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "public"."heavy_ops_jobs"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_job public.heavy_ops_jobs;
BEGIN
  IF NOT public.is_tenant_member(p_tenant_id) AND NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Không có quyền tạo job' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_max_attempts < 1 THEN
    RAISE EXCEPTION 'max_attempts phải >= 1';
  END IF;

  INSERT INTO public.heavy_ops_jobs (
    tenant_id, job_type, payload, status, max_attempts, scheduled_at
  ) VALUES (
    p_tenant_id, p_job_type, p_payload, 'pending',
    p_max_attempts, COALESCE(p_scheduled_at, now())
  )
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."expire_overdue_invoices"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_expired_count INTEGER := 0;
  v_error TEXT;
BEGIN
  BEGIN
    WITH expired AS (
      UPDATE public.invoices
      SET status = 'expired',
          updated_at = now()
      WHERE status = 'pending'
        AND created_at < now() - INTERVAL '48 hours'
      RETURNING tenant_id
    )
    SELECT count(DISTINCT tenant_id) INTO v_expired_count FROM expired;

    UPDATE public.tenant_subscriptions s
    SET billing_status = 'overdue',
        updated_at = now()
    WHERE EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.tenant_id = s.tenant_id
        AND i.status = 'expired'
    )
      AND s.billing_status <> 'overdue';

    UPDATE public.tenants t
    SET status = 'read_only',
        updated_at = now()
    WHERE t.status IN ('active', 'trial')
      AND EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.tenant_id = t.id
          AND i.status = 'expired'
      );

    PERFORM public.log_billing_job(
      'expire_overdue_invoices',
      'success',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      v_expired_count,
      format('Đã hết hạn %s hóa đơn', v_expired_count),
      jsonb_build_object('expired_count', v_expired_count)
    );

    RETURN v_expired_count;
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    PERFORM public.log_billing_job(
      'expire_overdue_invoices',
      'failed',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      0,
      v_error,
      jsonb_build_object('error', v_error)
    );
    RAISE;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."expire_pending_invoices"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_expired_count INT;
  v_readonly_count INT;
BEGIN
  -- pg_cron chạy với auth.uid() null; chỉ system admin được kích hoạt thủ công
  IF auth.uid() IS NOT NULL AND NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được chạy cron hết hạn' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.invoices
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'pending'
    AND created_at < (now() - INTERVAL '48 hours');

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  -- ponytail: chỉ tenant có hóa đơn expired mới chuyển sang read_only; giữ nguyên nếu đã read_only
  WITH expired_tenants AS (
    SELECT DISTINCT tenant_id FROM public.invoices WHERE status = 'expired'
  )
  UPDATE public.tenants
  SET status = 'read_only',
      updated_at = now()
  WHERE id IN (SELECT tenant_id FROM expired_tenants)
    AND status <> 'read_only';

  GET DIAGNOSTICS v_readonly_count = ROW_COUNT;

  UPDATE public.tenant_subscriptions
  SET billing_status = 'past_due',
      updated_at = now()
  WHERE tenant_id IN (SELECT tenant_id FROM public.invoices WHERE status = 'expired')
    AND billing_status <> 'past_due';

  RETURN json_build_object(
    'expired_count', v_expired_count,
    'read_only_count', v_readonly_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."export_tenant_data"("p_tenant_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_tenant JSON;
  v_subscription JSON;
  v_members JSON;
  v_table_list TEXT[];
  v_table_name TEXT;
  v_rows JSONB;
  v_tables JSONB := '[]'::jsonb;
BEGIN
  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu tenant_id';
  END IF;

  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được export dữ liệu tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT row_to_json(t) INTO v_tenant
  FROM public.tenants t
  WHERE t.id = p_tenant_id;

  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Tenant không tồn tại';
  END IF;

  SELECT row_to_json(s) INTO v_subscription
  FROM public.tenant_subscriptions s
  WHERE s.tenant_id = p_tenant_id;

  v_members := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT m.id, m.tenant_id, m.user_id, m.role, m.invited_by, m.created_at, m.updated_at, u.email
      FROM public.tenant_memberships m
      LEFT JOIN auth.users u ON u.id = m.user_id
      WHERE m.tenant_id = p_tenant_id
    ) t
  );

  SELECT array_agg(c.table_name::TEXT) INTO v_table_list
  FROM information_schema.columns c
  JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
  WHERE c.table_schema = 'public'
    AND c.column_name = 'tenant_id'
    AND c.table_name NOT IN (
      'tenants', 'tenant_memberships', 'tenant_subscriptions',
      'system_admins', 'admin_login_history', 'admin_2fa_backup_codes',
      'terms_acceptance'
    );

  FOREACH v_table_name IN ARRAY COALESCE(v_table_list, ARRAY[]::TEXT[])
  LOOP
    BEGIN
      EXECUTE format(
        'SELECT COALESCE(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) FROM (SELECT * FROM public.%I WHERE tenant_id = %L) t',
        v_table_name,
        p_tenant_id
      ) INTO v_rows;

      v_tables := v_tables || jsonb_build_object(
        'table_name', v_table_name,
        'row_count', jsonb_array_length(COALESCE(v_rows, '[]'::jsonb)),
        'rows', COALESCE(v_rows, '[]'::jsonb)
      );
    EXCEPTION WHEN OTHERS THEN
      v_tables := v_tables || jsonb_build_object(
        'table_name', v_table_name,
        'row_count', 0,
        'rows', '[]'::jsonb,
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'tenant', COALESCE(v_tenant::jsonb, '{}'::jsonb),
    'subscription', COALESCE(v_subscription::jsonb, '{}'::jsonb),
    'members', COALESCE(v_members::jsonb, '[]'::jsonb),
    'tables', v_tables,
    'exported_at', now()
  )::json;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."f_unaccent"("input" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT PARALLEL SAFE
    AS $$
  SELECT translate(
    extensions.unaccent(input),
    'đăâêôơưửĐĂÂÊÔƠỬỰ',
    'daaeoouuDAAEOOUU'
  );
$$;

CREATE OR REPLACE FUNCTION "public"."filter_customers_rpc"("p_search_term" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_by" "text" DEFAULT 'created_at'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_min_points" integer DEFAULT NULL::integer, "p_max_points" integer DEFAULT NULL::integer, "p_has_debt" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_offset int;
  v_result JSON;
  v_total int;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Đếm tổng số khách hàng khớp
  SELECT COUNT(*) INTO v_total
  FROM customers c
  WHERE (p_search_term IS NULL OR p_search_term = '' OR
         f_unaccent(c.name) ILIKE f_unaccent('%' || p_search_term || '%') OR
         COALESCE(c.phone, '') ILIKE '%' || p_search_term || '%' OR
         f_unaccent(COALESCE(c.code, '')) ILIKE f_unaccent('%' || p_search_term || '%'))
    AND (p_min_points IS NULL OR c.loyalty_points >= p_min_points)
    AND (p_max_points IS NULL OR c.loyalty_points <= p_max_points)
    AND (p_has_debt IS NULL OR
         CASE
           WHEN p_has_debt = 'true' THEN c.debt > 0
           WHEN p_has_debt = 'false' THEN c.debt = 0
           ELSE TRUE
         END);

  -- Lấy dữ liệu trang hiện tại
  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT c.*
      FROM customers c
      WHERE (p_search_term IS NULL OR p_search_term = '' OR
             f_unaccent(c.name) ILIKE f_unaccent('%' || p_search_term || '%') OR
             COALESCE(c.phone, '') ILIKE '%' || p_search_term || '%' OR
             f_unaccent(COALESCE(c.code, '')) ILIKE f_unaccent('%' || p_search_term || '%'))
        AND (p_min_points IS NULL OR c.loyalty_points >= p_min_points)
        AND (p_max_points IS NULL OR c.loyalty_points <= p_max_points)
        AND (p_has_debt IS NULL OR
             CASE
               WHEN p_has_debt = 'true' THEN c.debt > 0
               WHEN p_has_debt = 'false' THEN c.debt = 0
               ELSE TRUE
             END)
      ORDER BY
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc'  THEN c.name END ASC,
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN c.name END DESC,
        CASE WHEN p_sort_by = 'points' AND p_sort_order = 'asc'  THEN c.loyalty_points END ASC,
        CASE WHEN p_sort_by = 'points' AND p_sort_order = 'desc' THEN c.loyalty_points END DESC,
        CASE WHEN p_sort_by = 'debt' AND p_sort_order = 'asc'  THEN c.debt END ASC,
        CASE WHEN p_sort_by = 'debt' AND p_sort_order = 'desc' THEN c.debt END DESC,
        CASE WHEN p_sort_by = 'spent' AND p_sort_order = 'asc'  THEN c.total_spent END ASC,
        CASE WHEN p_sort_by = 'spent' AND p_sort_order = 'desc' THEN c.total_spent END DESC,
        c.created_at DESC
      LIMIT p_page_size
      OFFSET v_offset
    ) t
  );

  RETURN json_build_object(
    'customers', v_result,
    'totalCount', v_total
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."filter_disposals_rpc"("p_search_term" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_from_date" "date" DEFAULT NULL::"date", "p_to_date" "date" DEFAULT NULL::"date", "p_status" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_offset int;
  v_total int;
  v_result JSON;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Total count of DISPOSALS (not items)
  SELECT COUNT(*) INTO v_total
  FROM disposals d
  WHERE (p_search_term IS NULL OR p_search_term = '' OR
         d.code ILIKE '%' || p_search_term || '%')
    AND (p_from_date IS NULL OR d.date >= p_from_date::timestamptz)
    AND (p_to_date IS NULL OR d.date < (p_to_date + interval '1 day')::timestamptz)
    AND (p_status IS NULL OR d.status = p_status);

  -- Result set with nested disposal_items
  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        d.id,
        d.code,
        d.date,
        d.created_by,
        d.status,
        d.reason,
        d.note,
        d.total_quantity,
        d.total_value,
        d.created_at,
        d.updated_at,
        COALESCE(
          (
            SELECT json_agg(row_to_json(di_sub))
            FROM (
              SELECT
                di.id,
                di.disposal_id,
                di.product_id,
                di.product_code,
                di.product_name,
                di.quantity,
                di.cost_price,
                di.total_value,
                di.lot_id,
                di.lot_code,
                di.expiry_date,
                di.category_id,
                di.category_name,
                di.brand_id,
                di.brand_name
              FROM disposal_items di
              WHERE di.disposal_id = d.id
            ) di_sub
          ),
          '[]'::json
        ) AS disposal_items
      FROM disposals d
      WHERE (p_search_term IS NULL OR p_search_term = '' OR
             d.code ILIKE '%' || p_search_term || '%')
        AND (p_from_date IS NULL OR d.date >= p_from_date::timestamptz)
        AND (p_to_date IS NULL OR d.date < (p_to_date + interval '1 day')::timestamptz)
        AND (p_status IS NULL OR d.status = p_status)
      ORDER BY d.date DESC
      LIMIT p_page_size
      OFFSET v_offset
    ) t
  );

  RETURN json_build_object('disposals', v_result, 'totalCount', v_total);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."filter_import_receipts_rpc"("p_search_term" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_from_date" "date" DEFAULT NULL::"date", "p_to_date" "date" DEFAULT NULL::"date", "p_supplier_id" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_offset int;
  v_total int;
  v_result JSON;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  SELECT COUNT(*) INTO v_total
  FROM import_receipts r
  WHERE (p_search_term IS NULL OR p_search_term = '' OR
         r.invoice_number ILIKE '%' || p_search_term || '%')
    AND (p_from_date IS NULL OR r.date >= p_from_date::timestamptz)
    AND (p_to_date IS NULL OR r.date < (p_to_date + interval '1 day')::timestamptz)
    AND (p_supplier_id IS NULL OR r.supplier_id = p_supplier_id);

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT r.*
      FROM import_receipts r
      WHERE (p_search_term IS NULL OR p_search_term = '' OR
             r.invoice_number ILIKE '%' || p_search_term || '%')
        AND (p_from_date IS NULL OR r.date >= p_from_date::timestamptz)
        AND (p_to_date IS NULL OR r.date < (p_to_date + interval '1 day')::timestamptz)
        AND (p_supplier_id IS NULL OR r.supplier_id = p_supplier_id)
      ORDER BY r.date DESC
      LIMIT p_page_size
      OFFSET v_offset
    ) t
  );

  RETURN json_build_object('receipts', v_result, 'totalCount', v_total);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."filter_import_receipts_rpc"("p_search_term" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_from_date" "date" DEFAULT NULL::"date", "p_to_date" "date" DEFAULT NULL::"date", "p_supplier_id" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_offset int;
  v_total int;
  v_result JSON;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  SELECT COUNT(*) INTO v_total
  FROM import_receipts r
  WHERE (p_search_term IS NULL OR p_search_term = '' OR
         r.invoice_number ILIKE '%' || p_search_term || '%')
    AND (p_from_date IS NULL OR r.date >= p_from_date::timestamptz)
    AND (p_to_date IS NULL OR r.date < (p_to_date + interval '1 day')::timestamptz)
    AND (p_supplier_id IS NULL OR r.supplier_id = p_supplier_id)
    AND (p_status IS NULL OR r.status = p_status);

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT r.*
      FROM import_receipts r
      WHERE (p_search_term IS NULL OR p_search_term = '' OR
             r.invoice_number ILIKE '%' || p_search_term || '%')
        AND (p_from_date IS NULL OR r.date >= p_from_date::timestamptz)
        AND (p_to_date IS NULL OR r.date < (p_to_date + interval '1 day')::timestamptz)
        AND (p_supplier_id IS NULL OR r.supplier_id = p_supplier_id)
        AND (p_status IS NULL OR r.status = p_status)
      ORDER BY r.date DESC
      LIMIT p_page_size
      OFFSET v_offset
    ) t
  );

  RETURN json_build_object('receipts', v_result, 'totalCount', v_total);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."filter_products_rpc"("p_search_term" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_category_id" "text" DEFAULT NULL::"text", "p_brand_id" "text" DEFAULT NULL::"text", "p_sort_by" "text" DEFAULT 'created_at'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN filter_products_rpc(
    p_search_term, p_page, p_page_size, p_category_id, p_brand_id, p_sort_by, p_sort_order, NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."filter_products_rpc"("p_search_term" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_category_id" "text" DEFAULT NULL::"text", "p_brand_id" "text" DEFAULT NULL::"text", "p_sort_by" "text" DEFAULT 'created_at'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_stock_status" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_offset int;
  v_total int;
  v_result JSON;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  SELECT COUNT(*) INTO v_total
  FROM products p
  WHERE (p_search_term IS NULL OR p_search_term = '' OR
         f_unaccent(p.name) ILIKE f_unaccent('%' || p_search_term || '%') OR
         f_unaccent(COALESCE(p.sku, '')) ILIKE f_unaccent('%' || p_search_term || '%') OR
         COALESCE(p.barcode, '') ILIKE '%' || p_search_term || '%')
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_brand_id IS NULL OR p.brand_id = p_brand_id)
    AND (
      p_stock_status IS NULL OR p_stock_status = 'all' OR
      (p_stock_status = 'available' AND p.quantity > 0) OR
      (p_stock_status = 'out' AND p.quantity <= 0) OR
      (p_stock_status = 'low' AND p.quantity <= COALESCE(p.min_stock, 5))
    );

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        p.*,
        COALESCE(
          jsonb_agg(to_jsonb(pl.*) ORDER BY pl.expiry_date ASC, pl.created_at ASC)
          FILTER (WHERE pl.id IS NOT NULL),
          '[]'::jsonb
        ) AS product_lots
      FROM products p
      LEFT JOIN product_lots pl ON pl.product_id = p.id
      WHERE (p_search_term IS NULL OR p_search_term = '' OR
             f_unaccent(p.name) ILIKE f_unaccent('%' || p_search_term || '%') OR
             f_unaccent(COALESCE(p.sku, '')) ILIKE f_unaccent('%' || p_search_term || '%') OR
             COALESCE(p.barcode, '') ILIKE '%' || p_search_term || '%')
        AND (p_category_id IS NULL OR p.category_id = p_category_id)
        AND (p_brand_id IS NULL OR p.brand_id = p_brand_id)
        AND (
          p_stock_status IS NULL OR p_stock_status = 'all' OR
          (p_stock_status = 'available' AND p.quantity > 0) OR
          (p_stock_status = 'out' AND p.quantity <= 0) OR
          (p_stock_status = 'low' AND p.quantity <= COALESCE(p.min_stock, 5))
        )
      GROUP BY p.id
      ORDER BY
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN p.name END ASC,
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN p.name END DESC,
        CASE WHEN p_sort_by = 'quantity' AND p_sort_order = 'asc' THEN p.quantity END ASC,
        CASE WHEN p_sort_by = 'quantity' AND p_sort_order = 'desc' THEN p.quantity END DESC,
        CASE WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN p.price END ASC,
        CASE WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN p.price END DESC,
        p.created_at DESC
      LIMIT p_page_size
      OFFSET v_offset
    ) t
  );

  RETURN json_build_object('products', v_result, 'totalCount', v_total);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."filter_return_orders_rpc"("p_search_term" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_from_date" "date" DEFAULT NULL::"date", "p_to_date" "date" DEFAULT NULL::"date", "p_status" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_offset int;
  v_total int;
  v_result JSON;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  SELECT COUNT(*) INTO v_total
  FROM return_orders ro
  WHERE (p_search_term IS NULL OR p_search_term = '' OR
         ro.id ILIKE '%' || p_search_term || '%' OR
         ro.original_order_id ILIKE '%' || p_search_term || '%' OR
         f_unaccent(COALESCE(ro.customer_name, '')) ILIKE f_unaccent('%' || p_search_term || '%'))
    AND (p_from_date IS NULL OR ro.date >= p_from_date::timestamptz)
    AND (p_to_date IS NULL OR ro.date < (p_to_date + interval '1 day')::timestamptz)
    AND (p_status IS NULL OR ro.status = p_status);

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT ro.*
      FROM return_orders ro
      WHERE (p_search_term IS NULL OR p_search_term = '' OR
             ro.id ILIKE '%' || p_search_term || '%' OR
             ro.original_order_id ILIKE '%' || p_search_term || '%' OR
             f_unaccent(COALESCE(ro.customer_name, '')) ILIKE f_unaccent('%' || p_search_term || '%'))
        AND (p_from_date IS NULL OR ro.date >= p_from_date::timestamptz)
        AND (p_to_date IS NULL OR ro.date < (p_to_date + interval '1 day')::timestamptz)
        AND (p_status IS NULL OR ro.status = p_status)
      ORDER BY ro.date DESC
      LIMIT p_page_size
      OFFSET v_offset
    ) t
  );

  RETURN json_build_object('returnOrders', v_result, 'totalCount', v_total);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."filter_suppliers_rpc"("p_search_term" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_by" "text" DEFAULT 'name'::"text", "p_sort_order" "text" DEFAULT 'asc'::"text") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_offset int;
  v_total int;
  v_result JSON;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  SELECT COUNT(*) INTO v_total
  FROM suppliers s
  WHERE (p_search_term IS NULL OR p_search_term = '' OR
         f_unaccent(s.name) ILIKE f_unaccent('%' || p_search_term || '%') OR
         f_unaccent(COALESCE(s.code, '')) ILIKE f_unaccent('%' || p_search_term || '%') OR
         COALESCE(s.phone, '') ILIKE '%' || p_search_term || '%');

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT *
      FROM suppliers s
      WHERE (p_search_term IS NULL OR p_search_term = '' OR
             f_unaccent(s.name) ILIKE f_unaccent('%' || p_search_term || '%') OR
             f_unaccent(COALESCE(s.code, '')) ILIKE f_unaccent('%' || p_search_term || '%') OR
             COALESCE(s.phone, '') ILIKE '%' || p_search_term || '%')
      ORDER BY
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN s.name END ASC,
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN s.name END DESC,
        CASE WHEN p_sort_by = 'debt' AND p_sort_order = 'asc' THEN s.debt END ASC,
        CASE WHEN p_sort_by = 'debt' AND p_sort_order = 'desc' THEN s.debt END DESC,
        s.name ASC
      LIMIT p_page_size
      OFFSET v_offset
    ) t
  );

  RETURN json_build_object('suppliers', v_result, 'totalCount', v_total);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."generate_2fa_backup_codes"("p_user_id" "uuid", "p_count" integer DEFAULT 10) RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_codes TEXT[] := ARRAY[]::TEXT[];
  v_code TEXT;
  v_hash TEXT;
  v_i INTEGER;
  v_count INTEGER := GREATEST(1, LEAST(COALESCE(p_count, 10), 20));
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu user_id';
  END IF;

  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Chỉ người dùng hiện tại mới được tạo backup code cho chính mình' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Xóa code cũ chưa dùng (nếu user tạo lại, ví dụ lúc setup lại 2FA).
  DELETE FROM public.admin_2fa_backup_codes
  WHERE user_id = p_user_id AND used_at IS NULL;

  v_i := 0;
  WHILE v_i < v_count LOOP
    v_code := upper(encode(extensions.gen_random_bytes(4), 'hex'));
    v_hash := encode(extensions.digest(v_code, 'sha256'), 'hex');

    BEGIN
      INSERT INTO public.admin_2fa_backup_codes (user_id, code_hash)
      VALUES (p_user_id, v_hash);
      v_codes := array_append(v_codes, v_code);
      v_i := v_i + 1;
    EXCEPTION WHEN unique_violation THEN
      -- ponytail: trùng hash cực hiếm; thử lại với code mới.
      CONTINUE;
    END;
  END LOOP;

  RETURN json_build_object('user_id', p_user_id, 'codes', v_codes);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_admin_login_alerts"("p_hours_ago" integer DEFAULT 24) RETURNS json
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := now() - make_interval(hours => COALESCE(p_hours_ago, 24));
  v_failed_burst JSON;
  v_new_device JSON;
  v_rapid_login JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem login alerts' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_failed_burst := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        h.user_id,
        h.email,
        h.ip_address::TEXT AS ip_address,
        COUNT(*) AS failed_count,
        MIN(h.created_at) AS window_start,
        MAX(h.created_at) AS window_end
      FROM public.admin_login_history h
      WHERE h.status = 'failed'
        AND h.created_at >= v_cutoff
      GROUP BY h.user_id, h.email, h.ip_address,
        date_trunc('hour', h.created_at) + interval '15 min' * (extract(minute from h.created_at)::int / 15)
      HAVING COUNT(*) >= 3
      ORDER BY MAX(h.created_at) DESC
      LIMIT 50
    ) t
  );

  v_new_device := (
    WITH candidates AS (
      SELECT
        h.id,
        h.user_id,
        h.email,
        h.ip_address::TEXT AS ip_address,
        h.user_agent,
        h.created_at
      FROM public.admin_login_history h
      WHERE h.status = 'success'
        AND h.created_at >= v_cutoff
        AND h.user_agent IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.admin_login_history prev
          WHERE prev.user_id = h.user_id
            AND prev.status = 'success'
            AND prev.id <> h.id
            AND prev.user_agent IS NOT DISTINCT FROM h.user_agent
            AND prev.created_at >= h.created_at - interval '30 days'
            AND prev.created_at < h.created_at
        )
    )
    SELECT COALESCE(json_agg(row_to_json(candidates) ORDER BY candidates.created_at DESC), '[]'::json)
    FROM candidates
  );

  v_rapid_login := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        h.user_id,
        h.email,
        COUNT(*) AS success_count,
        MIN(h.created_at) AS window_start,
        MAX(h.created_at) AS window_end
      FROM public.admin_login_history h
      WHERE h.status = 'success'
        AND h.created_at >= v_cutoff
      GROUP BY h.user_id, h.email,
        date_trunc('hour', h.created_at) + interval '15 min' * (extract(minute from h.created_at)::int / 15)
      HAVING COUNT(*) >= 3
      ORDER BY MAX(h.created_at) DESC
      LIMIT 50
    ) t
  );

  RETURN json_build_object(
    'failed_burst', v_failed_burst,
    'new_device', v_new_device,
    'rapid_login', v_rapid_login
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_admin_login_history"("p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0, "p_status" "text" DEFAULT NULL::"text", "p_date_from" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_date_to" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS json
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_total INTEGER;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem login history' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.admin_login_history h
  WHERE (p_status IS NULL OR h.status = p_status)
    AND (p_date_from IS NULL OR h.created_at >= p_date_from)
    AND (p_date_to IS NULL OR h.created_at <= p_date_to);

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT h.id, h.user_id, h.email, h.ip_address::TEXT AS ip_address, h.user_agent, h.status, h.failure_reason, h.created_at
      FROM public.admin_login_history h
      WHERE (p_status IS NULL OR h.status = p_status)
        AND (p_date_from IS NULL OR h.created_at >= p_date_from)
        AND (p_date_to IS NULL OR h.created_at <= p_date_to)
      ORDER BY h.created_at DESC
      LIMIT COALESCE(p_limit, 50)
      OFFSET COALESCE(p_offset, 0)
    ) t
  );

  RETURN json_build_object(
    'data', v_result,
    'count', COALESCE(v_total, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_billing_automation_status"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_expiring_soon JSONB;
  v_overdue JSONB;
  v_dunning JSONB;
  v_pending_count INT;
BEGIN
  -- Sắp hết hạn: subscription có expires_at trong 7 ngày tới
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'subdomain', t.subdomain,
      'expires_at', s.expires_at,
      'days_remaining', GREATEST(0, (s.expires_at::DATE - CURRENT_DATE))
    )
  ), '[]'::JSONB)
  INTO v_expiring_soon
  FROM public.tenant_subscriptions s
  JOIN public.tenants t ON t.id = s.tenant_id
  WHERE s.expires_at IS NOT NULL
    AND s.expires_at::DATE >= CURRENT_DATE
    AND s.expires_at::DATE <= CURRENT_DATE + INTERVAL '7 days'
    AND t.status NOT IN ('archived');

  SELECT COUNT(*) INTO v_pending_count
  FROM public.invoices
  WHERE status IN ('pending', 'overdue', 'expired');

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'invoice_no', i.invoice_no,
      'tenant_id', i.tenant_id,
      'tenant_name', t.name,
      'tenant_subdomain', t.subdomain,
      'due_date', i.due_date,
      'status', i.status,
      'balance', i.balance
    )
  ), '[]'::JSONB)
  INTO v_overdue
  FROM public.invoices i
  JOIN public.tenants t ON t.id = i.tenant_id
  WHERE i.status IN ('overdue', 'expired')
    AND t.status NOT IN ('archived');

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'subdomain', t.subdomain,
      'status', t.status,
      'billing_status', s.billing_status
    )
  ), '[]'::JSONB)
  INTO v_dunning
  FROM public.tenants t
  JOIN public.tenant_subscriptions s ON s.tenant_id = t.id
  WHERE t.status = 'read_only'
    OR s.billing_status = 'overdue';

  RETURN jsonb_build_object(
    'expiring_soon_count', COALESCE(jsonb_array_length(v_expiring_soon), 0),
    'expiring_soon', v_expiring_soon,
    'pending_invoice_count', v_pending_count,
    'overdue_invoice_count', COALESCE(jsonb_array_length(v_overdue), 0),
    'overdue_invoices', v_overdue,
    'dunning_tenant_count', COALESCE(jsonb_array_length(v_dunning), 0),
    'dunning_tenants', v_dunning
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_billing_job_logs"("p_limit" integer DEFAULT 100) RETURNS TABLE("id" "uuid", "job_name" "text", "status" "text", "run_at" timestamp with time zone, "duration_ms" integer, "records_affected" integer, "message" "text", "details" "jsonb", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.job_name, l.status, l.run_at, l.duration_ms, l.records_affected, l.message, l.details, l.created_at
  FROM public.billing_job_logs l
  ORDER BY l.run_at DESC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_billing_reminder_config"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value
  FROM public.system_settings
  WHERE key = 'billing_reminder_config';

  IF v_value IS NULL THEN
    RETURN jsonb_build_object(
      'enabled', true,
      'milestones', jsonb_build_array(7, 3, 1),
      'send_time', '09:00',
      'function_url', '',
      'reminder_secret', ''
    );
  END IF;

  RETURN v_value;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_brand_product_counts"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_result
  FROM (
    SELECT b.id, COUNT(p.id)::int AS product_count
    FROM brands b
    LEFT JOIN products p ON p.brand_id = b.id
    GROUP BY b.id
  ) t;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_category_product_counts"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_result
  FROM (
    SELECT c.id, COUNT(p.id)::int AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
  ) t;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_churn_cohort_metrics"("p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date", "p_cohort_months" integer DEFAULT 12) RETURNS json
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_start DATE;
  v_end DATE;
  v_cohort_start DATE;
  v_active_start INTEGER;
  v_active_end INTEGER;
  v_churned INTEGER;
  v_churn_rate NUMERIC;
  v_total_revenue NUMERIC;
  v_paying_tenants INTEGER;
  v_ltv NUMERIC;
  v_trial INTEGER;
  v_active_free INTEGER;
  v_paying INTEGER;
  v_churned_funnel INTEGER;
  v_cohort JSONB := '[]'::JSONB;
  v_months TEXT[];
  v_ltv_by_plan JSON;
  v_cohort_row RECORD;
  v_offset INTEGER;
  v_offset_month DATE;
  v_max_offset INTEGER;
  v_converted INTEGER;
  v_retention JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem churn/cohort metrics' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_end := COALESCE(p_end_date, CURRENT_DATE);
  v_start := COALESCE(p_start_date, (v_end - INTERVAL '12 months')::DATE);
  v_cohort_start := (date_trunc('month', v_end) - ((p_cohort_months - 1) || ' months')::INTERVAL)::DATE;

  -- Churn: snapshot approximation trên tập tenant đã tồn tại đầu kỳ.
  SELECT
    COUNT(*) FILTER (WHERE t.created_at < v_start),
    COUNT(*) FILTER (WHERE t.created_at < v_start AND t.status IN ('active','trial','read_only') AND COALESCE(s.billing_status, 'ok') <> 'cancelled')
  INTO v_active_start, v_active_end
  FROM public.tenants t
  LEFT JOIN public.tenant_subscriptions s ON s.tenant_id = t.id;

  v_churned := v_active_start - v_active_end;
  v_churn_rate := CASE WHEN v_active_start > 0 THEN ROUND((v_churned::NUMERIC / v_active_start) * 100, 2) ELSE 0 END;

  -- LTV (lifetime, tất cả payments confirmed).
  SELECT COALESCE(SUM(p.amount), 0), COUNT(DISTINCT p.tenant_id)
  INTO v_total_revenue, v_paying_tenants
  FROM public.payments p
  WHERE p.status = 'confirmed';

  v_ltv := CASE WHEN v_paying_tenants > 0 THEN ROUND(v_total_revenue / v_paying_tenants, 2) ELSE 0 END;

  SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.revenue DESC), '[]'::json)
  INTO v_ltv_by_plan
  FROM (
    SELECT
      t.plan,
      pl.name AS plan_name,
      COALESCE(SUM(p.amount), 0) AS revenue,
      COUNT(DISTINCT p.tenant_id) AS tenants,
      CASE WHEN COUNT(DISTINCT p.tenant_id) > 0 THEN ROUND(COALESCE(SUM(p.amount), 0) / COUNT(DISTINCT p.tenant_id), 2) ELSE 0 END AS ltv
    FROM public.payments p
    JOIN public.tenants t ON t.id = p.tenant_id
    JOIN public.plans pl ON pl.key = t.plan
    WHERE p.status = 'confirmed'
    GROUP BY t.plan, pl.name
  ) r;

  -- Sales funnel (snapshot hiện tại).
  WITH paying_tenants AS (
    SELECT DISTINCT tenant_id FROM public.payments WHERE status = 'confirmed'
  )
  SELECT
    COUNT(*) FILTER (WHERE t.status = 'trial'),
    COUNT(*) FILTER (WHERE t.status = 'active' AND pt.tenant_id IS NULL AND COALESCE(s.billing_status, 'ok') <> 'cancelled'),
    COUNT(*) FILTER (WHERE t.status IN ('active','read_only') AND pt.tenant_id IS NOT NULL AND COALESCE(s.billing_status, 'ok') <> 'cancelled'),
    COUNT(*) FILTER (WHERE t.status IN ('suspended','archived') OR COALESCE(s.billing_status, 'ok') = 'cancelled')
  INTO v_trial, v_active_free, v_paying, v_churned_funnel
  FROM public.tenants t
  LEFT JOIN paying_tenants pt ON pt.tenant_id = t.id
  LEFT JOIN public.tenant_subscriptions s ON s.tenant_id = t.id;

  -- Cohort conversion-to-paid.
  -- ponytail: O(n²) nested scan; đủ nhanh với số lượng tenant hiện tại, nếu lớn hơn nên materialize first_payment.
  FOR v_cohort_row IN
    SELECT date_trunc('month', t.created_at)::DATE AS cohort_month, COUNT(*) AS total
    FROM public.tenants t
    WHERE t.created_at >= v_cohort_start AND t.created_at < date_trunc('month', v_end)::DATE + INTERVAL '1 month'
    GROUP BY date_trunc('month', t.created_at)::DATE
    ORDER BY cohort_month
  LOOP
    v_retention := '[]'::JSONB;
    v_max_offset := LEAST(
      p_cohort_months,
      (EXTRACT(YEAR FROM v_end)::INT * 12 + EXTRACT(MONTH FROM v_end)::INT) -
      (EXTRACT(YEAR FROM v_cohort_row.cohort_month)::INT * 12 + EXTRACT(MONTH FROM v_cohort_row.cohort_month)::INT)
    );
    FOR v_offset IN 1..GREATEST(v_max_offset, 0) LOOP
      v_offset_month := (v_cohort_row.cohort_month + (v_offset || ' months')::INTERVAL)::DATE;
      SELECT COUNT(DISTINCT t.id)
      INTO v_converted
      FROM public.tenants t
      WHERE date_trunc('month', t.created_at)::DATE = v_cohort_row.cohort_month
        AND EXISTS (
          SELECT 1 FROM public.payments p
          WHERE p.tenant_id = t.id
            AND p.status = 'confirmed'
            AND p.payment_date <= v_offset_month
        );
      v_retention := v_retention || jsonb_build_object(
        'month', to_char(v_offset_month, 'YYYY-MM'),
        'conversionRate', CASE WHEN v_cohort_row.total > 0 THEN ROUND((v_converted::NUMERIC / v_cohort_row.total) * 100, 2) ELSE 0 END
      );
    END LOOP;

    v_cohort := v_cohort || jsonb_build_object(
      'month', to_char(v_cohort_row.cohort_month, 'YYYY-MM'),
      'total', v_cohort_row.total,
      'retention', v_retention
    );
  END LOOP;

  SELECT array_agg(to_char(m, 'YYYY-MM') ORDER BY m)
  INTO v_months
  FROM generate_series(v_cohort_start, date_trunc('month', v_end)::DATE, '1 month'::INTERVAL) m;

  RETURN json_build_object(
    'churn', json_build_object(
      'active_start', v_active_start,
      'active_end', v_active_end,
      'churned_count', v_churned,
      'churn_rate', v_churn_rate,
      'period_start', v_start,
      'period_end', v_end
    ),
    'cohort', json_build_object(
      'months', v_months,
      'cohorts', v_cohort
    ),
    'ltv', json_build_object(
      'average_ltv', v_ltv,
      'total_revenue', v_total_revenue,
      'paying_tenants', v_paying_tenants,
      'by_plan', v_ltv_by_plan
    ),
    'funnel', json_build_object(
      'trial', v_trial,
      'active_free', v_active_free,
      'paying', v_paying,
      'churned', v_churned_funnel
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_connection_pool_stats"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_active INT;
  v_idle INT;
  v_total INT;
  v_max INT;
BEGIN
  -- ponytail: stats từ pg_stat_activity; trên Supabase free tier user thường không xem được hết,
  -- nên wrap trong exception trả về unknown để UI không crash.
  BEGIN
    SELECT COUNT(*) FILTER (WHERE state = 'active'),
           COUNT(*) FILTER (WHERE state = 'idle'),
           COUNT(*)
    INTO v_active, v_idle, v_total
    FROM pg_stat_activity
    WHERE datname = current_database();
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'active', 0, 'idle', 0, 'total', 0, 'max', 0,
      'status', 'unknown', 'message', 'Không thể đọc pg_stat_activity với quyền hiện tại'
    );
  END;

  v_max := GREATEST(v_total, 10);

  RETURN jsonb_build_object(
    'active', v_active,
    'idle', v_idle,
    'total', v_total,
    'max', v_max,
    'status', CASE
      WHEN v_total >= v_max * 0.9 THEN 'critical'
      WHEN v_total >= v_max * 0.75 THEN 'warning'
      ELSE 'healthy'
    END,
    'message', NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_current_announcements_for_tenant"("p_tenant_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "title" "text", "content" "text", "target_type" "text", "targets" "jsonb", "status" "text", "scheduled_at" timestamp with time zone, "published_at" timestamp with time zone, "expires_at" timestamp with time zone, "created_by" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_tenant_id UUID;
  v_plan TEXT;
BEGIN
  v_tenant_id := COALESCE(p_tenant_id, public.current_tenant_id());
  IF v_tenant_id IS NULL THEN
    RETURN;
  END IF;

  SELECT t.plan INTO v_plan FROM public.tenants t WHERE t.id = v_tenant_id;

  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.content,
    a.target_type,
    a.targets,
    a.status,
    a.scheduled_at,
    a.published_at,
    a.expires_at,
    a.created_by,
    a.created_at,
    a.updated_at
  FROM public.announcements a
  WHERE a.status = 'active'
    AND (a.scheduled_at IS NULL OR a.scheduled_at <= now())
    AND (a.expires_at IS NULL OR a.expires_at > now())
    AND (
      a.target_type = 'all'
      OR (
        a.target_type = 'specific_tenants'
        AND a.targets IS NOT NULL
        AND v_tenant_id = ANY(ARRAY(SELECT (jsonb_array_elements_text(a.targets))::UUID))
      )
      OR (
        a.target_type = 'specific_plans'
        AND a.targets IS NOT NULL
        AND v_plan IS NOT NULL
        AND v_plan = ANY(ARRAY(SELECT jsonb_array_elements_text(a.targets)))
      )
    )
  ORDER BY a.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_customer_debt_ledger"("p_customer_id" "text", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_rows JSON; v_total INT; v_balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_balance FROM public.customer_payment_ledger WHERE customer_id = p_customer_id;
  SELECT COUNT(*) INTO v_total FROM public.customer_payment_ledger WHERE customer_id = p_customer_id;
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY created_at DESC, id DESC), '[]'::json) INTO v_rows
  FROM (SELECT id, customer_id, reference_type, reference_id, amount, balance_after, reason, created_by, created_at
        FROM public.customer_payment_ledger WHERE customer_id = p_customer_id
        ORDER BY created_at DESC, id DESC LIMIT p_limit OFFSET p_offset) t;
  RETURN json_build_object('customer_id', p_customer_id, 'current_balance', v_balance,
    'total_entries', v_total, 'entries', v_rows);
END; $$;

CREATE OR REPLACE FUNCTION "public"."get_customer_report"("p_start_date" "date", "p_end_date" "date") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_summary JSON;
  v_top_customers JSON;
  v_customer_growth JSON;
BEGIN
  -- Summary
  SELECT json_build_object(
    'totalCustomers', COALESCE((SELECT COUNT(*) FROM customers), 0),
    'newCustomers', COALESCE((SELECT COUNT(*) FROM customers
                              WHERE (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date), 0),
    'totalDebt', COALESCE((SELECT SUM(debt) FROM customers), 0),
    'totalPoints', COALESCE((SELECT SUM(loyalty_points) FROM customers), 0),
    'totalSpent', COALESCE((SELECT SUM(total_spent) FROM customers), 0)
  )
  INTO v_summary;

  -- Top customers by total spent (all-time) with order count
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_top_customers
  FROM (
    SELECT
      c.id,
      c.name,
      COALESCE(c.total_spent, 0) AS total_spent,
      COALESCE(c.debt, 0) AS debt,
      COALESCE(c.loyalty_points, 0) AS loyalty_points,
      COUNT(DISTINCT o.id)::int AS order_count
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id, c.name, c.total_spent, c.debt, c.loyalty_points
    ORDER BY c.total_spent DESC NULLS LAST
    LIMIT 50
  ) t;

  -- Customer growth in period (new customers per day)
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date), '[]'::json)
  INTO v_customer_growth
  FROM (
    SELECT
      to_char((c.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
      COUNT(*)::int AS new_customers
    FROM customers c
    WHERE (c.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date
    GROUP BY (c.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
  ) t;

  RETURN json_build_object(
    'summary', v_summary,
    'topCustomers', v_top_customers,
    'customerGrowth', v_customer_growth
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_customer_stats"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_total INT;
  v_vip INT;
  v_debt INT;
  v_total_spent NUMERIC;
BEGIN
  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (
      WHERE COALESCE(rank, '') IN ('vip', 'vipvip', 'gold', 'diamond', 'platinum')
    )::int,
    COUNT(*) FILTER (WHERE COALESCE(debt, 0) > 0)::int,
    COALESCE(SUM(total_spent), 0)
  INTO v_total, v_vip, v_debt, v_total_spent
  FROM customers;

  RETURN json_build_object(
    'total', COALESCE(v_total, 0),
    'vip', COALESCE(v_vip, 0),
    'debt', COALESCE(v_debt, 0),
    'totalSpent', COALESCE(v_total_spent, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_dashboard_summary"("p_from" "date" DEFAULT NULL::"date", "p_to" "date" DEFAULT NULL::"date") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_revenue_data JSON;
  v_top_products JSON;
  v_inventory_value JSON;
  v_debt_customers JSON;
  v_top_customers JSON;
  v_total_debt NUMERIC;
  v_total_customers INTEGER;
  v_total_products INTEGER;
  v_active_products INTEGER;
  v_today_revenue NUMERIC;
  v_today_orders INTEGER;
  v_today_sold_products INTEGER;
  v_today_customers INTEGER;
  v_yesterday_revenue NUMERIC;
BEGIN
  -- Revenue / profit / orders per day for the requested date range
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.day DESC), '[]'::json)
  INTO v_revenue_data
  FROM (
    SELECT
      to_char((o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
      COALESCE(SUM(o.total_amount), 0) AS revenue,
      COALESCE(SUM(o.total_amount - COALESCE(oi.cost_total, 0)), 0) AS profit,
      COUNT(*)::int AS orders
    FROM orders o
    LEFT JOIN (
      SELECT oi.order_id,
             COALESCE(SUM(p.cost * oi.quantity), 0) AS cost_total
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      GROUP BY oi.order_id
    ) oi ON oi.order_id = o.id
    WHERE (p_from IS NULL OR (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date >= p_from)
      AND (p_to IS NULL OR (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date <= p_to)
    GROUP BY (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
  ) t;

  -- Top 10 products by revenue in the requested date range
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_top_products
  FROM (
    SELECT
      COALESCE(oi.product_name, 'Không xác định') AS name,
      COALESCE(SUM(oi.quantity), 0)::int AS quantity,
      COALESCE(SUM(oi.price * oi.quantity), 0) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE (p_from IS NULL OR (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date >= p_from)
      AND (p_to IS NULL OR (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date <= p_to)
    GROUP BY oi.product_id, oi.product_name
    ORDER BY COALESCE(SUM(oi.price * oi.quantity), 0) DESC
    LIMIT 10
  ) t;

  -- Inventory value (cost and retail) from current products
  SELECT json_build_object(
    'cost', COALESCE(SUM(p.cost * p.quantity), 0),
    'retail', COALESCE(SUM(p.price * p.quantity), 0)
  )
  INTO v_inventory_value
  FROM products p;

  -- Customers with debt
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_debt_customers
  FROM (
    SELECT *
    FROM customers
    WHERE debt > 0
    ORDER BY debt DESC
  ) t;

  -- Top 10 customers by total spent (all time) with order count
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_top_customers
  FROM (
    SELECT
      c.*,
      COALESCE(COUNT(o.id), 0)::int AS order_count
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id
    ORDER BY c.total_spent DESC NULLS LAST
    LIMIT 10
  ) t;

  -- Total debt and total customer count
  SELECT COALESCE(SUM(debt), 0)
  INTO v_total_debt
  FROM customers;

  SELECT COUNT(*)::int
  INTO v_total_customers
  FROM customers;

  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE quantity > 0)::int
  INTO v_total_products, v_active_products
  FROM products;

  -- Today / yesterday quick stats (always computed for the current DB date)
  SELECT COALESCE(SUM(o.total_amount), 0)
  INTO v_today_revenue
  FROM orders o
  WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;

  SELECT COUNT(*)::int
  INTO v_today_orders
  FROM orders o
  WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;

  SELECT COALESCE(SUM(oi.quantity), 0)::int
  INTO v_today_sold_products
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;

  SELECT COUNT(DISTINCT o.customer_id)::int
  INTO v_today_customers
  FROM orders o
  WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
    AND o.customer_id IS NOT NULL;

  SELECT COALESCE(SUM(o.total_amount), 0)
  INTO v_yesterday_revenue
  FROM orders o
  WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - 1;

  RETURN json_build_object(
    'revenueData', v_revenue_data,
    'topProducts', v_top_products,
    'inventoryValue', COALESCE((v_inventory_value->>'cost')::numeric, 0),
    'inventoryRetailValue', COALESCE((v_inventory_value->>'retail')::numeric, 0),
    'debtCustomers', v_debt_customers,
    'topCustomers', v_top_customers,
    'totalDebt', COALESCE(v_total_debt, 0),
    'totalCustomers', COALESCE(v_total_customers, 0),
    'totalProducts', COALESCE(v_total_products, 0),
    'activeProducts', COALESCE(v_active_products, 0),
    'todayRevenue', COALESCE(v_today_revenue, 0),
    'todayOrders', COALESCE(v_today_orders, 0),
    'todaySoldProducts', COALESCE(v_today_sold_products, 0),
    'todayCustomers', COALESCE(v_today_customers, 0),
    'yesterdayRevenue', COALESCE(v_yesterday_revenue, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_data_retention_config"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_config JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem cấu hình data retention' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT value INTO v_config FROM public.system_settings WHERE key = 'data_retention_config';

  RETURN json_build_object(
    'retentionDaysOrders', COALESCE((v_config->>'retention_days_orders')::INTEGER, 730),
    'retentionDaysProcessedOperations', COALESCE((v_config->>'retention_days_processed_operations')::INTEGER, 90),
    'retentionDaysRateLimitLogs', COALESCE((v_config->>'retention_days_rate_limit_logs')::INTEGER, 1),
    'retentionDaysFraudQueue', COALESCE((v_config->>'retention_days_fraud_queue')::INTEGER, 90),
    'retentionDaysRegistrationEvents', COALESCE((v_config->>'retention_days_registration_events')::INTEGER, 365),
    'cronSchedule', COALESCE(v_config->>'cron_schedule', '0 3 * * *')
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_data_retention_status"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_archived_orders BIGINT;
  v_archived_items BIGINT;
  v_rate_limit_count BIGINT;
  v_last_run JSONB;
  v_cron_setting JSONB;
  v_cron_job JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem trạng thái data retention' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_archived_orders FROM public.orders_archive;
  SELECT COUNT(*) INTO v_archived_items FROM public.order_items_archive;
  SELECT COUNT(*) INTO v_rate_limit_count FROM public.rate_limit_logs;

  SELECT value INTO v_last_run FROM public.system_settings WHERE key = 'data_retention_last_run';
  SELECT value INTO v_cron_setting FROM public.system_settings WHERE key = 'data_retention_cron';

  -- ponytail: thử đọc cron.job nếu có quyền; nếu không thì dùng setting.
  BEGIN
    SELECT jsonb_build_object('jobid', jobid, 'jobname', jobname, 'schedule', schedule, 'active', active)
    INTO v_cron_job
    FROM cron.job
    WHERE jobname = 'data-retention-daily';
  EXCEPTION WHEN OTHERS THEN
    v_cron_job := NULL;
  END;

  RETURN json_build_object(
    'archivedOrdersCount', COALESCE(v_archived_orders, 0),
    'archivedOrderItemsCount', COALESCE(v_archived_items, 0),
    'rateLimitLogsCount', COALESCE(v_rate_limit_count, 0),
    'lastRun', v_last_run,
    'cronSchedule', COALESCE(v_cron_setting->>'schedule', '0 3 * * *'),
    'cronJob', v_cron_job
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_default_plan_limit_values"("p_plan" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_plan public.plans%ROWTYPE;
BEGIN
  SELECT * INTO v_plan FROM public.plans WHERE key = p_plan AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', p_plan;
  END IF;

  RETURN jsonb_build_object(
    'max_users', v_plan.max_users,
    'max_products', v_plan.max_products,
    'max_orders_per_month', v_plan.max_orders_per_month
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_default_plan_limits"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_free JSONB;
  v_vip JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem cấu hình giới hạn' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_free := public.get_default_plan_limit_values('free');
  v_vip := public.get_default_plan_limit_values('vip');

  RETURN json_build_object('free', v_free, 'vip', v_vip);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_disposal_auto_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN 'XH' || LPAD(
    (COALESCE((SELECT COUNT(*) FROM disposals), 0) + 1)::TEXT,
    6,
    '0'
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_email_brand"() RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value FROM public.system_settings WHERE key = 'email_brand';
  RETURN COALESCE(v_value, jsonb_build_object(
    'logo_url', '',
    'brand_color', '#2563eb',
    'signature_html', 'Trân trọng,<br/>Đội ngũ VietSales Pro',
    'from_name', 'VietSales Pro'
  ));
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_email_template_by_key"("p_key" "text") RETURNS TABLE("id" "uuid", "key" "text", "name" "text", "subject" "text", "body_html" "text", "variables" "jsonb", "is_active" boolean)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id, t.key, t.name, t.subject, t.body_html, t.variables, t.is_active
  FROM public.email_templates t
  WHERE t.key = p_key
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_error_log_summary"("p_hours" integer DEFAULT 24, "p_limit" integer DEFAULT 50) RETURNS json
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_since TIMESTAMPTZ;
  v_total INTEGER;
  v_by_source JSON;
  v_recent JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem error logs' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_since := now() - (COALESCE(p_hours, 24) || ' hours')::interval;

  SELECT COUNT(*) INTO v_total FROM public.error_logs WHERE created_at >= v_since;

  v_by_source := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT source, level, COUNT(*) AS count
      FROM public.error_logs
      WHERE created_at >= v_since
      GROUP BY source, level
      ORDER BY count DESC, source
    ) t
  );

  v_recent := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT id, source, level, message, detail, metadata, created_at
      FROM public.error_logs
      WHERE created_at >= v_since
      ORDER BY created_at DESC
      LIMIT COALESCE(p_limit, 50)
    ) t
  );

  RETURN json_build_object(
    'total', COALESCE(v_total, 0),
    'since', v_since,
    'bySource', COALESCE(v_by_source, '[]'::json),
    'recent', COALESCE(v_recent, '[]'::json)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_fraud_detection_config"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_config JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem cấu hình fraud detection' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT value INTO v_config FROM public.system_settings WHERE key = 'fraud_detection_config';

  RETURN json_build_object(
    'enabled', COALESCE((v_config->>'enabled')::BOOLEAN, true),
    'ipWindowHours', COALESCE((v_config->>'ip_window_hours')::INTEGER, 24),
    'ipMax', COALESCE((v_config->>'ip_max')::INTEGER, 5),
    'emailDomainWindowHours', COALESCE((v_config->>'email_domain_window_hours')::INTEGER, 24),
    'emailDomainMax', COALESCE((v_config->>'email_domain_max')::INTEGER, 10),
    'ownerWindowHours', COALESCE((v_config->>'owner_window_hours')::INTEGER, 24),
    'ownerMax', COALESCE((v_config->>'owner_max')::INTEGER, 20)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_fraud_queue"("p_status" "text" DEFAULT NULL::"text", "p_severity" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS json
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_total INTEGER;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem fraud queue' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.fraud_queue q
  WHERE (p_status IS NULL OR q.status = p_status)
    AND (p_severity IS NULL OR q.severity = p_severity);

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        q.id,
        q.type,
        q.severity,
        q.status,
        q.target_value,
        q.event_count,
        q.details,
        q.window_start,
        q.window_end,
        q.notes,
        q.created_at,
        q.updated_at
      FROM public.fraud_queue q
      WHERE (p_status IS NULL OR q.status = p_status)
        AND (p_severity IS NULL OR q.severity = p_severity)
      ORDER BY
        CASE q.severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
        q.created_at DESC
      LIMIT COALESCE(p_limit, 50)
      OFFSET COALESCE(p_offset, 0)
    ) t
  );

  RETURN json_build_object('data', v_result, 'count', COALESCE(v_total, 0));
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_fraud_stats"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_status_counts JSON;
  v_severity_counts JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem fraud stats' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_status_counts := (
    SELECT COALESCE(json_object_agg(status, cnt), '{}'::json)
    FROM (
      SELECT status, COUNT(*) AS cnt
      FROM public.fraud_queue
      GROUP BY status
    ) s
  );

  v_severity_counts := (
    SELECT COALESCE(json_object_agg(severity, cnt), '{}'::json)
    FROM (
      SELECT severity, COUNT(*) AS cnt
      FROM public.fraud_queue
      GROUP BY severity
    ) s
  );

  RETURN json_build_object(
    'total', (SELECT COUNT(*) FROM public.fraud_queue),
    'byStatus', COALESCE(v_status_counts, '{}'::json),
    'bySeverity', COALESCE(v_severity_counts, '{}'::json)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_heavy_op_jobs"("p_tenant_id" "uuid" DEFAULT NULL::"uuid", "p_status" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "tenant_id" "uuid", "job_type" "text", "payload" "jsonb", "status" "text", "attempts" integer, "max_attempts" integer, "error_message" "text", "result" "jsonb", "scheduled_at" timestamp with time zone, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  IF p_tenant_id IS NOT NULL AND NOT public.is_tenant_member(p_tenant_id) AND NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Không có quyền xem job của tenant này' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT j.id, j.tenant_id, j.job_type, j.payload, j.status, j.attempts, j.max_attempts,
         j.error_message, j.result, j.scheduled_at, j.created_at, j.updated_at
  FROM public.heavy_ops_jobs j
  WHERE (p_tenant_id IS NULL OR j.tenant_id = p_tenant_id)
    AND (p_status IS NULL OR j.status = p_status)
  ORDER BY j.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_import_receipt_count_by_date"("p_date" "date") RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
  SELECT COUNT(*)::int
  FROM import_receipts
  WHERE (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = p_date;
$$;

CREATE OR REPLACE FUNCTION "public"."get_import_receipts_by_product_and_lot"("p_product_id" "text", "p_lot_id" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_result
  FROM (
    SELECT r.*,
           COALESCE(
             (SELECT json_agg(row_to_json(ii))
              FROM import_items ii
              WHERE ii.receipt_id = r.id
                AND ii.product_id = p_product_id
                AND (
                  p_lot_id IS NULL
                  OR (ii.lot_code IS NOT NULL AND ii.lot_code = p_lot_id)
                  OR (EXISTS (SELECT 1 FROM product_lots pl WHERE pl.id = p_lot_id AND pl.code = ii.lot_code))
                )
             ), '[]'::json
           ) AS import_items
    FROM import_receipts r
    WHERE r.id IN (
      SELECT DISTINCT ii.receipt_id
      FROM import_items ii
      WHERE ii.product_id = p_product_id
        AND (
          p_lot_id IS NULL
          OR (ii.lot_code IS NOT NULL AND ii.lot_code = p_lot_id)
          OR (EXISTS (SELECT 1 FROM product_lots pl WHERE pl.id = p_lot_id AND pl.code = ii.lot_code))
        )
    )
    ORDER BY r.date DESC
  ) t;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_import_receipts_by_supplier_id"("p_supplier_id" "text", "p_limit" integer DEFAULT 100) RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_result
  FROM (
    SELECT r.*,
      COALESCE(
        (SELECT json_agg(row_to_json(ii))
         FROM import_items ii
         WHERE ii.import_receipt_id = r.id),
        '[]'::json
      ) AS import_items
    FROM import_receipts r
    WHERE r.supplier_id = p_supplier_id
    ORDER BY r.date DESC
    LIMIT p_limit
  ) t;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_import_stats"("p_from_date" "date" DEFAULT NULL::"date", "p_to_date" "date" DEFAULT NULL::"date") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_total_count INT;
  v_total_cost NUMERIC;
  v_total_shipping NUMERIC;
  v_total_paid NUMERIC;
  v_total_debt NUMERIC;
BEGIN
  SELECT
    COUNT(*)::int,
    COALESCE(SUM(total_cost), 0),
    COALESCE(SUM(shipping_cost), 0),
    COALESCE(SUM(paid_amount), 0),
    COALESCE(SUM(debt_recorded), 0)
  INTO v_total_count, v_total_cost, v_total_shipping, v_total_paid, v_total_debt
  FROM import_receipts
  WHERE (p_from_date IS NULL OR (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date >= p_from_date)
    AND (p_to_date IS NULL OR (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date <= p_to_date);

  RETURN json_build_object(
    'totalCount', COALESCE(v_total_count, 0),
    'totalCost', COALESCE(v_total_cost, 0),
    'totalShipping', COALESCE(v_total_shipping, 0),
    'totalPaid', COALESCE(v_total_paid, 0),
    'totalDebt', COALESCE(v_total_debt, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_in_app_messages_for_tenant"("p_tenant_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "tenant_id" "uuid", "channel" "text", "title" "text", "content" "text", "status" "text", "error_message" "text", "metadata" "jsonb", "sent_by" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  v_tenant_id := COALESCE(p_tenant_id, public.current_tenant_id());
  IF v_tenant_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    n.id,
    n.tenant_id,
    n.channel,
    n.title,
    n.content,
    n.status,
    n.error_message,
    n.metadata,
    n.sent_by,
    n.created_at,
    n.updated_at
  FROM public.notification_logs n
  WHERE n.tenant_id = v_tenant_id
    AND n.channel = 'in_app'
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_inventory_report"("p_start_date" "date", "p_end_date" "date", "p_category" "text" DEFAULT ''::"text", "p_stock_status" "text" DEFAULT 'all'::"text") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH product_values AS (
    SELECT
      p.id,
      COALESCE(SUM(pl.quantity * pl.cost), p.quantity * p.cost) AS total_value,
      COALESCE(SUM(pl.quantity), p.quantity) AS total_qty
    FROM products p
    LEFT JOIN product_lots pl ON pl.product_id = p.id
    GROUP BY p.id, p.quantity, p.cost
  ),
  returned_items AS (
    SELECT
      ro.original_order_id AS order_id,
      roi.product_id,
      COALESCE(SUM(roi.quantity), 0) AS returned_qty
    FROM return_orders ro
    JOIN return_order_items roi ON roi.return_order_id = ro.id
    WHERE ro.status != 'cancelled'
    GROUP BY ro.original_order_id, roi.product_id
  ),
  summary AS (
    SELECT json_build_object(
      'totalValue', COALESCE(SUM(pv.total_value), 0),
      'totalQty', COALESCE(SUM(pv.total_qty), 0),
      'lowStockCount', COUNT(*) FILTER (WHERE p.quantity > 0 AND p.min_stock IS NOT NULL AND p.quantity <= p.min_stock),
      'outOfStockCount', COUNT(*) FILTER (WHERE COALESCE(p.quantity, 0) <= 0)
    ) AS result
    FROM products p
    LEFT JOIN product_values pv ON pv.id = p.id
    WHERE (p_category = '' OR p.category = p_category)
  ),
  inventory_by_category AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        COALESCE(p.category, 'Chưa phân loại') AS name,
        COALESCE(SUM(pv.total_value), 0) AS value
      FROM products p
      LEFT JOIN product_values pv ON pv.id = p.id
      WHERE (p_category = '' OR p.category = p_category)
      GROUP BY p.category
    ) t
  ),
  export_in_period AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        oi.product_id,
        COALESCE(oi.product_name, 'Không xác định') AS name,
        COALESCE(SUM(oi.quantity - COALESCE(ri.returned_qty, 0)), 0)::int AS qty,
        COALESCE(SUM(COALESCE(oi.cost, COALESCE(p.cost, 0)) * (oi.quantity - COALESCE(ri.returned_qty, 0))), 0) AS value
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN returned_items ri
        ON ri.order_id = o.id AND ri.product_id = oi.product_id
      WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date
        AND o.status != 'cancelled'
      GROUP BY oi.product_id, oi.product_name
      ORDER BY SUM(oi.quantity - COALESCE(ri.returned_qty, 0)) DESC
    ) t
  ),
  low_stock_products AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        p.id,
        p.sku AS code,
        p.name,
        p.category,
        p.unit,
        COALESCE(p.quantity, 0) AS quantity,
        COALESCE(p.min_stock, 5) AS min_stock,
        COALESCE(p.cost, 0) AS cost,
        COALESCE(pv.total_value, 0) AS value
      FROM products p
      LEFT JOIN product_values pv ON pv.id = p.id
      WHERE (p_category = '' OR p.category = p_category)
        AND p.quantity <= COALESCE(p.min_stock, 5)
      ORDER BY p.quantity ASC
    ) t
  ),
  products_filtered AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        p.id,
        p.sku AS code,
        p.name,
        p.category,
        p.unit,
        COALESCE(p.quantity, 0) AS quantity,
        COALESCE(p.min_stock, 5) AS min_stock,
        COALESCE(p.cost, 0) AS cost,
        COALESCE(pv.total_value, 0) AS value
      FROM products p
      LEFT JOIN product_values pv ON pv.id = p.id
      WHERE (p_category = '' OR p.category = p_category)
        AND (
          p_stock_status = 'all'
          OR (p_stock_status = 'in' AND p.quantity > COALESCE(p.min_stock, 5))
          OR (p_stock_status = 'low' AND p.quantity > 0 AND p.quantity <= COALESCE(p.min_stock, 5))
          OR (p_stock_status = 'out' AND COALESCE(p.quantity, 0) <= 0)
        )
      ORDER BY p.name ASC
    ) t
  ),
  categories AS (
    SELECT COALESCE(json_agg(DISTINCT category), '[]'::json) AS result
    FROM (
      SELECT DISTINCT TRIM(p.category) AS category
      FROM products p
      WHERE p.category IS NOT NULL AND p.category <> ''
      ORDER BY TRIM(p.category)
    ) cats
  )
  SELECT json_build_object(
    'summary', s.result,
    'inventoryByCategory', ibc.result,
    'exportInPeriod', eip.result,
    'lowStockProducts', lsp.result,
    'products', pf.result,
    'categories', c.result
  )
  INTO v_result
  FROM summary s, inventory_by_category ibc, export_in_period eip,
       low_stock_products lsp, products_filtered pf, categories c;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_maintenance_mode"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_value JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem maintenance mode' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT value INTO v_value FROM public.system_settings WHERE key = 'maintenance_mode';
  RETURN COALESCE(v_value, jsonb_build_object('enabled', false, 'message', ''));
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_maintenance_windows"("p_start" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS json
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem maintenance windows' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.starts_at), '[]'::json)
    FROM (
      SELECT
        id,
        title,
        description,
        starts_at,
        ends_at,
        status,
        created_by,
        created_at,
        updated_at
      FROM public.maintenance_windows
      WHERE (p_start IS NULL OR starts_at >= p_start)
        AND (p_end IS NULL OR ends_at <= p_end)
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_next_invoice_number"("p_year" integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_counter INT;
BEGIN
  INSERT INTO public.invoice_number_counters (year, counter) VALUES (p_year, 1)
  ON CONFLICT (year) DO UPDATE SET counter = public.invoice_number_counters.counter + 1
  RETURNING counter INTO v_counter;

  RETURN 'INV-' || p_year || '-' || LPAD(v_counter::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_order_auto_code"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN 'HD' || LPAD(nextval('order_code_seq')::TEXT, 7, '0');
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_pending_billing_reminders"() RETURNS TABLE("invoice_id" "uuid", "milestone" "text", "due_date" "date")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_config JSONB;
  v_milestones INT[];
  v_milestone INT;
  v_target DATE;
BEGIN
  v_config := public.get_billing_reminder_config();
  IF NOT (v_config->>'enabled')::BOOLEAN THEN
    RETURN;
  END IF;

  v_milestones := ARRAY(SELECT jsonb_array_elements_text(v_config->'milestones')::INT);

  FOREACH v_milestone IN ARRAY v_milestones
  LOOP
    v_target := CURRENT_DATE + v_milestone;

    RETURN QUERY
    SELECT i.id AS invoice_id,
           ('T-' || v_milestone)::TEXT AS milestone,
           i.due_date::DATE AS due_date
    FROM public.invoices i
    JOIN public.tenants t ON t.id = i.tenant_id
    WHERE i.status = 'pending'
      AND i.due_date = v_target
      AND t.status NOT IN ('archived')
      -- Chưa gửi reminder mốc này cho hóa đơn này.
      AND NOT EXISTS (
        SELECT 1 FROM public.invoice_reminder_logs r
        WHERE r.invoice_id = i.id AND r.milestone = ('T-' || v_milestone)::TEXT
      );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_pending_webhook_deliveries"("p_limit" integer DEFAULT 100) RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        d.id,
        d.webhook_id AS webhookId,
        d.tenant_id AS tenantId,
        d.event_type AS eventType,
        d.payload,
        d.idempotency_key AS idempotencyKey,
        d.attempt_count AS attemptCount,
        d.max_attempts AS maxAttempts,
        w.url,
        w.secret
      FROM public.webhook_deliveries d
      JOIN public.tenant_webhooks w ON w.id = d.webhook_id
      WHERE d.status = 'pending'
        AND (d.next_retry_at IS NULL OR d.next_retry_at <= now())
      ORDER BY d.created_at ASC
      LIMIT p_limit
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_plan_by_key"("p_key" "text") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_plan public.plans%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem chi tiết gói' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE key = p_key;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy gói: %', p_key;
  END IF;

  RETURN json_build_object(
    'key', v_plan.key,
    'name', v_plan.name,
    'description', v_plan.description,
    'max_users', v_plan.max_users,
    'max_products', v_plan.max_products,
    'max_orders_per_month', v_plan.max_orders_per_month,
    'monthly_price', v_plan.monthly_price,
    'yearly_price', v_plan.yearly_price,
    'is_active', v_plan.is_active,
    'created_at', v_plan.created_at,
    'updated_at', v_plan.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_plans"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem danh sách gói' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'key', key,
        'name', name,
        'description', description,
        'max_users', max_users,
        'max_products', max_products,
        'max_orders_per_month', max_orders_per_month,
        'monthly_price', monthly_price,
        'yearly_price', yearly_price,
        'is_active', is_active,
        'created_at', created_at,
        'updated_at', updated_at
      ) ORDER BY key
    ), '[]'::json)
    FROM public.plans
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_product_by_barcode"("p_barcode" "text") RETURNS TABLE("id" "text", "name" "text", "display_name" "text", "code" "text", "barcode" "text", "price" numeric, "cost" numeric, "quantity" numeric, "unit" "text", "location" "text", "category" "text", "brand" "text", "image" "text", "min_stock" numeric, "max_stock" numeric, "safety_stock" numeric, "is_point_accumulation_enabled" boolean, "conversion_units" "jsonb", "created_at" timestamp with time zone, "has_lots" boolean, "category_id" "text", "brand_id" "text", "product_lots" "jsonb")
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    p.id,
    p.name,
    p.display_name,
    p.sku,
    p.barcode,
    p.price,
    p.cost,
    p.quantity,
    p.unit,
    p.location,
    p.category,
    p.brand,
    p.image,
    p.min_stock,
    p.max_stock,
    p.safety_stock,
    p.is_point_accumulation_enabled,
    p.conversion_units,
    p.created_at,
    p.has_lots,
    p.category_id,
    p.brand_id,
    COALESCE(
      jsonb_agg(to_jsonb(pl.*) ORDER BY pl.expiry_date ASC, pl.created_at ASC)
      FILTER (WHERE pl.id IS NOT NULL),
      '[]'::jsonb
    ) AS product_lots
  FROM products p
  LEFT JOIN product_lots pl ON pl.product_id = p.id
  WHERE p.barcode = p_barcode
  GROUP BY p.id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION "public"."get_product_stats"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_total INT;
  v_active INT;
  v_low_stock INT;
  v_out_of_stock INT;
  v_inventory_value NUMERIC;
BEGIN
  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE quantity > 0)::int,
    COUNT(*) FILTER (WHERE quantity > 0 AND min_stock IS NOT NULL AND quantity <= min_stock)::int,
    COUNT(*) FILTER (WHERE COALESCE(quantity, 0) = 0)::int,
    COALESCE(SUM(cost * quantity), 0)
  INTO v_total, v_active, v_low_stock, v_out_of_stock, v_inventory_value
  FROM products;

  RETURN json_build_object(
    'total', COALESCE(v_total, 0),
    'active', COALESCE(v_active, 0),
    'lowStock', COALESCE(v_low_stock, 0),
    'outOfStock', COALESCE(v_out_of_stock, 0),
    'inventoryValue', COALESCE(v_inventory_value, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_product_stock_balance"("p_product_id" "text", "p_lot_id" "text" DEFAULT NULL::"text") RETURNS numeric
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_has_lots BOOLEAN;
  v_balance NUMERIC;
BEGIN
  SELECT COALESCE(has_lots, FALSE) INTO v_has_lots FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF v_has_lots AND p_lot_id IS NOT NULL THEN
    SELECT COALESCE(quantity, 0) INTO v_balance FROM product_lots WHERE id = p_lot_id;
  ELSIF v_has_lots THEN
    SELECT COALESCE(SUM(quantity), 0) INTO v_balance FROM product_lots WHERE product_id = p_product_id;
  ELSE
    SELECT COALESCE(quantity, 0) INTO v_balance FROM products WHERE id = p_product_id;
  END IF;

  RETURN COALESCE(v_balance, 0);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_product_valuation_rate"("p_product_id" "text", "p_lot_id" "text" DEFAULT NULL::"text") RETURNS numeric
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  IF p_lot_id IS NOT NULL THEN
    SELECT cost INTO v_rate FROM product_lots WHERE id = p_lot_id;
  END IF;
  IF v_rate IS NULL THEN
    SELECT cost INTO v_rate FROM products WHERE id = p_product_id;
  END IF;
  RETURN COALESCE(v_rate, 0);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_profit_report"("p_start_date" "date", "p_end_date" "date", "p_status" "text" DEFAULT 'all'::"text", "p_payment_method" "text" DEFAULT ''::"text", "p_product_keyword" "text" DEFAULT ''::"text", "p_customer_keyword" "text" DEFAULT ''::"text", "p_compare_mode" "text" DEFAULT 'prev'::"text") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_result JSON;
  v_span_days INT;
  v_compare_start DATE;
  v_compare_end DATE;
BEGIN
  v_span_days := (p_end_date - p_start_date) + 1;
  IF p_compare_mode = 'samePeriod' THEN
    v_compare_start := p_start_date - INTERVAL '1 year';
    v_compare_end := p_end_date - INTERVAL '1 year';
  ELSE
    v_compare_start := p_start_date - v_span_days;
    v_compare_end := p_start_date - 1;
  END IF;

  WITH filtered_orders AS (
    SELECT DISTINCT
      o.id,
      o.date,
      o.customer_id,
      o.customer_name,
      o.total_amount,
      COALESCE(o.total_returned_amount, 0) AS total_returned_amount,
      o.status,
      o.payment_method
    FROM orders o
    WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date
      AND (p_status = 'all' OR o.status = p_status)
      AND (p_payment_method = '' OR o.payment_method = p_payment_method)
      AND (
        p_customer_keyword = ''
        OR LOWER(o.customer_name) LIKE '%' || LOWER(p_customer_keyword) || '%'
      )
      AND (
        p_product_keyword = ''
        OR EXISTS (
          SELECT 1
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id
            AND LOWER(oi.product_name) LIKE '%' || LOWER(p_product_keyword) || '%'
        )
      )
  ),
  active_orders AS (
    SELECT * FROM filtered_orders WHERE status != 'cancelled'
  ),
  returned_items AS (
    SELECT
      ro.original_order_id AS order_id,
      roi.product_id,
      COALESCE(SUM(roi.quantity), 0) AS returned_qty
    FROM return_orders ro
    JOIN return_order_items roi ON roi.return_order_id = ro.id
    WHERE ro.status != 'cancelled'
    GROUP BY ro.original_order_id, roi.product_id
  ),
  all_items AS (
    SELECT
      o.id AS order_id,
      o.date,
      o.customer_id,
      o.customer_name,
      o.status,
      o.payment_method,
      oi.product_id,
      oi.product_name,
      oi.quantity,
      oi.price,
      COALESCE(oi.cost, COALESCE(p.cost, 0)) AS unit_cost,
      COALESCE(ri.returned_qty, 0) AS returned_qty,
      (oi.quantity - COALESCE(ri.returned_qty, 0)) AS net_qty,
      (oi.price * (oi.quantity - COALESCE(ri.returned_qty, 0))) AS item_revenue,
      (COALESCE(oi.cost, COALESCE(p.cost, 0)) * (oi.quantity - COALESCE(ri.returned_qty, 0))) AS item_cost
    FROM active_orders o
    JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN returned_items ri
      ON ri.order_id = o.id AND ri.product_id = oi.product_id
  ),
  compare_orders AS (
    SELECT DISTINCT
      o.id,
      o.date,
      o.total_amount,
      COALESCE(o.total_returned_amount, 0) AS total_returned_amount,
      o.status
    FROM orders o
    WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN v_compare_start AND v_compare_end
      AND o.status != 'cancelled'
  ),
  compare_returned_items AS (
    SELECT
      ro.original_order_id AS order_id,
      roi.product_id,
      COALESCE(SUM(roi.quantity), 0) AS returned_qty
    FROM return_orders ro
    JOIN return_order_items roi ON roi.return_order_id = ro.id
    WHERE ro.status != 'cancelled'
    GROUP BY ro.original_order_id, roi.product_id
  ),
  compare_items AS (
    SELECT
      o.id AS order_id,
      o.date,
      oi.product_id,
      oi.product_name,
      oi.quantity,
      oi.price,
      COALESCE(oi.cost, COALESCE(p.cost, 0)) AS unit_cost,
      COALESCE(cri.returned_qty, 0) AS returned_qty,
      (oi.price * (oi.quantity - COALESCE(cri.returned_qty, 0))) AS item_revenue,
      (COALESCE(oi.cost, COALESCE(p.cost, 0)) * (oi.quantity - COALESCE(cri.returned_qty, 0))) AS item_cost
    FROM compare_orders o
    JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN compare_returned_items cri
      ON cri.order_id = o.id AND cri.product_id = oi.product_id
  ),
  summary AS (
    SELECT json_build_object(
      'totalRevenue', COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM active_orders), 0),
      'totalCost', COALESCE((SELECT SUM(item_cost) FROM all_items), 0),
      'profit', COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM active_orders), 0)
              - COALESCE((SELECT SUM(item_cost) FROM all_items), 0),
      'margin', CASE WHEN COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM active_orders), 0) > 0
                     THEN ((COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM active_orders), 0)
                           - COALESCE((SELECT SUM(item_cost) FROM all_items), 0))
                           / COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM active_orders), 0)) * 100
                     ELSE 0 END,
      'prevRevenue', COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM compare_orders), 0),
      'prevCost', COALESCE((SELECT SUM(item_cost) FROM compare_items), 0),
      'prevProfit', COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM compare_orders), 0)
                  - COALESCE((SELECT SUM(item_cost) FROM compare_items), 0),
      'profitChange', CASE WHEN (COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM compare_orders), 0)
                              - COALESCE((SELECT SUM(item_cost) FROM compare_items), 0)) > 0
                         THEN ((COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM active_orders), 0)
                               - COALESCE((SELECT SUM(item_cost) FROM all_items), 0))
                               - (COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM compare_orders), 0)
                                 - COALESCE((SELECT SUM(item_cost) FROM compare_items), 0)))
                              / (COALESCE((SELECT SUM(total_amount - total_returned_amount) FROM compare_orders), 0)
                                - COALESCE((SELECT SUM(item_cost) FROM compare_items), 0)) * 100
                         ELSE 0 END
    ) AS result
  ),
  daily_profit AS (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date), '[]'::json) AS result
    FROM (
      SELECT
        d.date,
        COALESCE(o.revenue, 0) AS current_revenue,
        COALESCE(o.revenue, 0) - COALESCE(i.cost, 0) AS current_profit,
        COALESCE(po.revenue, 0) AS prev_revenue,
        COALESCE(po.revenue, 0) - COALESCE(pi.cost, 0) AS prev_profit
      FROM (
        SELECT DISTINCT to_char((dd.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date
        FROM (
          SELECT date FROM active_orders
          UNION
          SELECT date FROM all_items
          UNION
          SELECT date FROM compare_orders
          UNION
          SELECT date FROM compare_items
        ) dd
      ) d
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
          SUM(total_amount - total_returned_amount) AS revenue
        FROM active_orders
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) o ON o.date = d.date
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
          SUM(item_cost) AS cost
        FROM all_items
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) i ON i.date = d.date
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
          SUM(total_amount - total_returned_amount) AS revenue
        FROM compare_orders
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) po ON po.date = d.date
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
          SUM(item_cost) AS cost
        FROM compare_items
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) pi ON pi.date = d.date
    ) t
  ),
  profit_details AS (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date DESC), '[]'::json) AS result
    FROM (
      SELECT
        to_char((fi.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
        fi.order_id,
        COALESCE(fi.product_name, '') AS product_name,
        fi.item_revenue AS revenue,
        fi.item_cost AS cost,
        (fi.item_revenue - fi.item_cost) AS profit,
        CASE WHEN fi.item_revenue > 0
             THEN ((fi.item_revenue - fi.item_cost) / fi.item_revenue) * 100
             ELSE 0 END AS margin
      FROM all_items fi
    ) t
  ),
  grouped_by_product AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        COALESCE(fi.product_id, '') AS key,
        COALESCE(fi.product_name, 'Không xác định') AS label,
        COALESCE(SUM(fi.item_revenue), 0) AS revenue,
        COALESCE(SUM(fi.item_cost), 0) AS cost,
        COALESCE(SUM(fi.item_revenue - fi.item_cost), 0) AS profit,
        COALESCE(SUM(fi.net_qty), 0) AS count
      FROM all_items fi
      GROUP BY fi.product_id, fi.product_name
      ORDER BY SUM(fi.item_revenue - fi.item_cost) DESC
    ) t
  ),
  grouped_by_customer AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        COALESCE(cust.customer_id, 'guest') AS key,
        COALESCE(cust.customer_name, 'Khách lẻ') AS label,
        COALESCE(cust.revenue, 0) AS revenue,
        COALESCE(c.cost, 0) AS cost,
        COALESCE(cust.revenue - c.cost, 0) AS profit,
        cust.order_count AS count
      FROM (
        SELECT
          customer_id,
          customer_name,
          SUM(total_amount - total_returned_amount) AS revenue,
          COUNT(*) AS order_count
        FROM active_orders
        GROUP BY customer_id, customer_name
      ) cust
      LEFT JOIN (
        SELECT
          customer_id,
          SUM(item_cost) AS cost
        FROM all_items
        GROUP BY customer_id
      ) c ON c.customer_id = cust.customer_id
      ORDER BY (cust.revenue - COALESCE(c.cost, 0)) DESC
    ) t
  ),
  grouped_by_day AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        day.key AS key,
        day.key AS label,
        COALESCE(day.revenue, 0) AS revenue,
        COALESCE(c.cost, 0) AS cost,
        COALESCE(day.revenue - c.cost, 0) AS profit
      FROM (
        SELECT
          to_char((ao.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS key,
          SUM(total_amount - total_returned_amount) AS revenue
        FROM active_orders ao
        GROUP BY (ao.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) day
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS key,
          SUM(item_cost) AS cost
        FROM all_items
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) c ON c.key = day.key
      ORDER BY day.key DESC
    ) t
  )
  SELECT json_build_object(
    'summary', s.result,
    'dailyProfit', dp.result,
    'profitDetails', pd.result,
    'groupedByProduct', gbp.result,
    'groupedByCustomer', gbc.result,
    'groupedByDay', gbd.result
  )
  INTO v_result
  FROM summary s, daily_profit dp, profit_details pd,
       grouped_by_product gbp, grouped_by_customer gbc, grouped_by_day gbd;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_promo_code_usage_counts"("p_promo_code_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_total INTEGER;
  v_per_tenant JSONB;
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.promo_code_usages WHERE promo_code_id = p_promo_code_id;

  SELECT COALESCE(jsonb_object_agg(tenant_id::TEXT, cnt), '{}')
  INTO v_per_tenant
  FROM (
    SELECT tenant_id, COUNT(*) AS cnt
    FROM public.promo_code_usages
    WHERE promo_code_id = p_promo_code_id
    GROUP BY tenant_id
  ) t;

  RETURN jsonb_build_object(
    'total', v_total,
    'per_tenant', v_per_tenant
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_query_performance_metrics"() RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_total_calls BIGINT;
  v_total_time_ms DOUBLE PRECISION;
  v_weighted_mean DOUBLE PRECISION;
  v_weighted_variance DOUBLE PRECISION;
  v_p95 DOUBLE PRECISION;
  v_p99 DOUBLE PRECISION;
  v_rps DOUBLE PRECISION;
  v_reset_at TIMESTAMPTZ;
  v_elapsed_seconds DOUBLE PRECISION;
  v_top_queries JSON;
BEGIN
  SELECT COALESCE(stats_reset, now()) INTO v_reset_at FROM extensions.pg_stat_statements_info;

  SELECT COALESCE(SUM(calls), 0), COALESCE(SUM(total_exec_time), 0)
    INTO v_total_calls, v_total_time_ms
  FROM extensions.pg_stat_statements;

  IF v_total_calls > 0 THEN
    v_weighted_mean := v_total_time_ms / v_total_calls;

    SELECT COALESCE(SUM(calls * POWER(COALESCE(stddev_exec_time, 0), 2)), 0)
      INTO v_weighted_variance
    FROM extensions.pg_stat_statements
    WHERE stddev_exec_time IS NOT NULL;

    IF v_weighted_variance > 0 AND v_total_calls > 1 THEN
      v_weighted_variance := v_weighted_variance / (v_total_calls - 1);
    ELSE
      v_weighted_variance := 0;
    END IF;

    v_p95 := v_weighted_mean + 1.645 * SQRT(v_weighted_variance);
    v_p99 := v_weighted_mean + 2.326 * SQRT(v_weighted_variance);
  ELSE
    v_weighted_mean := 0;
    v_p95 := 0;
    v_p99 := 0;
  END IF;

  v_elapsed_seconds := GREATEST(EXTRACT(EPOCH FROM (now() - v_reset_at)), 1);
  v_rps := v_total_calls::DOUBLE PRECISION / v_elapsed_seconds;

  v_top_queries := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        LEFT(query, 120) AS query,
        calls,
        ROUND(mean_exec_time::numeric, 3) AS mean_ms,
        ROUND((mean_exec_time + 1.645 * COALESCE(stddev_exec_time, 0))::numeric, 3) AS p95_ms,
        ROUND((mean_exec_time + 2.326 * COALESCE(stddev_exec_time, 0))::numeric, 3) AS p99_ms,
        ROUND(total_exec_time::numeric, 3) AS total_ms
      FROM extensions.pg_stat_statements
      ORDER BY total_exec_time DESC
      LIMIT 10
    ) t
  );

  RETURN json_build_object(
    'totalQueries', COALESCE((SELECT COUNT(*) FROM extensions.pg_stat_statements), 0),
    'totalCalls', v_total_calls,
    'averageTimeMs', ROUND(COALESCE(v_weighted_mean, 0)::numeric, 3),
    'p95Ms', ROUND(COALESCE(v_p95, 0)::numeric, 3),
    'p99Ms', ROUND(COALESCE(v_p99, 0)::numeric, 3),
    'rps', ROUND(v_rps::numeric, 3),
    'resetAt', v_reset_at,
    'topQueries', COALESCE(v_top_queries, '[]'::json)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_rate_limit_logs"("p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_total INTEGER;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem rate limit logs' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total FROM public.rate_limit_logs;

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT *
      FROM public.rate_limit_logs
      ORDER BY created_at DESC, window_start DESC
      LIMIT COALESCE(p_limit, 50)
      OFFSET COALESCE(p_offset, 0)
    ) t
  );

  RETURN json_build_object(
    'data', v_result,
    'count', COALESCE(v_total, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_read_replica_status"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT jsonb_build_object(
    'enabled', EXISTS (
      SELECT 1 FROM public.tenants
      WHERE read_replica_url IS NOT NULL
      LIMIT 1
    ),
    'configured_tenants', (
      SELECT COUNT(*) FROM public.tenants WHERE read_replica_url IS NOT NULL
    ),
    'message', 'Read replica URL được cấu hình trên cột tenants.read_replica_url. Frontend dùng VITE_SUPABASE_READ_REPLICA_URL.'
  );
$$;

CREATE OR REPLACE FUNCTION "public"."get_return_order_auto_code"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN 'TH' || LPAD(nextval('return_order_code_seq')::TEXT, 7, '0');
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_revenue_metrics"("p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date") RETURNS json
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_start DATE;
  v_end DATE;
  v_mrr NUMERIC;
  v_arr NUMERIC;
  v_total_revenue NUMERIC;
  v_revenue_by_plan JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem revenue metrics' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Mặc định: từ đầu tháng đến hôm nay (Asia/Ho_Chi_Minh)
  v_start := COALESCE(p_start_date, date_trunc('month', CURRENT_DATE)::DATE);
  v_end := COALESCE(p_end_date, CURRENT_DATE);

  -- MRR = tổng giá tháng của tenant đang active/read_only trên gói trả phí
  SELECT COALESCE(SUM(pl.monthly_price), 0)
  INTO v_mrr
  FROM public.tenants t
  JOIN public.plans pl ON pl.key = t.plan
  WHERE t.status IN ('active', 'read_only')
    AND pl.monthly_price > 0;

  v_arr := v_mrr * 12;

  -- Revenue by plan = tổng payments confirmed trong khoảng ngày, group theo plan tenant
  SELECT
    COALESCE(json_agg(row_to_json(r) ORDER BY r.revenue DESC), '[]'::json),
    COALESCE(SUM(r.revenue), 0)
  INTO v_revenue_by_plan, v_total_revenue
  FROM (
    SELECT
      t.plan,
      pl.name AS plan_name,
      COALESCE(SUM(p.amount), 0) AS revenue,
      COUNT(p.id) AS payment_count
    FROM public.payments p
    JOIN public.tenants t ON t.id = p.tenant_id
    JOIN public.plans pl ON pl.key = t.plan
    WHERE p.status = 'confirmed'
      AND p.payment_date BETWEEN v_start AND v_end
    GROUP BY t.plan, pl.name
  ) r;

  RETURN json_build_object(
    'mrr', v_mrr,
    'arr', v_arr,
    'total_revenue', v_total_revenue,
    'revenue_by_plan', v_revenue_by_plan,
    'period_start', v_start,
    'period_end', v_end
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_sales_report"("p_start_date" "date", "p_end_date" "date", "p_status" "text" DEFAULT 'all'::"text", "p_payment_method" "text" DEFAULT ''::"text", "p_product_keyword" "text" DEFAULT ''::"text", "p_customer_keyword" "text" DEFAULT ''::"text") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_result JSON;
  v_span_days INT;
  v_prev_start DATE;
  v_prev_end DATE;
BEGIN
  v_span_days := (p_end_date - p_start_date) + 1;
  v_prev_start := p_start_date - v_span_days;
  v_prev_end := p_start_date - 1;

  WITH filtered_orders AS (
    SELECT DISTINCT
      o.id,
      o.date,
      o.customer_id,
      o.customer_name,
      o.total_amount,
      COALESCE(o.total_returned_amount, 0) AS total_returned_amount,
      o.status,
      o.payment_method
    FROM orders o
    WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date
      AND (p_status = 'all' OR o.status = p_status)
      AND (p_payment_method = '' OR o.payment_method = p_payment_method)
      AND (
        p_customer_keyword = ''
        OR LOWER(o.customer_name) LIKE '%' || LOWER(p_customer_keyword) || '%'
      )
      AND (
        p_product_keyword = ''
        OR EXISTS (
          SELECT 1
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id
            AND LOWER(oi.product_name) LIKE '%' || LOWER(p_product_keyword) || '%'
        )
      )
  ),
  active_orders AS (
    SELECT * FROM filtered_orders WHERE status != 'cancelled'
  ),
  cancelled_orders AS (
    SELECT * FROM filtered_orders WHERE status = 'cancelled'
  ),
  returned_items AS (
    SELECT
      ro.original_order_id AS order_id,
      roi.product_id,
      COALESCE(SUM(roi.quantity), 0) AS returned_qty
    FROM return_orders ro
    JOIN return_order_items roi ON roi.return_order_id = ro.id
    WHERE ro.status != 'cancelled'
    GROUP BY ro.original_order_id, roi.product_id
  ),
  all_items AS (
    SELECT
      o.id AS order_id,
      o.date,
      o.customer_id,
      o.customer_name,
      o.status,
      o.payment_method,
      oi.product_id,
      oi.product_name,
      oi.quantity,
      oi.price,
      COALESCE(ri.returned_qty, 0) AS returned_qty,
      (oi.price * (oi.quantity - COALESCE(ri.returned_qty, 0))) AS item_revenue
    FROM active_orders o
    JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN returned_items ri
      ON ri.order_id = o.id AND ri.product_id = oi.product_id
  ),
  prev_orders AS (
    SELECT DISTINCT o.id, o.total_amount
    FROM orders o
    WHERE (o.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN v_prev_start AND v_prev_end
      AND o.status != 'cancelled'
  ),
  summary AS (
    SELECT json_build_object(
      'totalRevenue', COALESCE(SUM(ao.total_amount - ao.total_returned_amount), 0),
      'totalOrders', COUNT(DISTINCT ao.id),
      'avgOrderValue', CASE WHEN COUNT(DISTINCT ao.id) > 0
                           THEN SUM(ao.total_amount - ao.total_returned_amount) / COUNT(DISTINCT ao.id)
                           ELSE 0 END,
      'uniqueCustomers', COUNT(DISTINCT ao.customer_id),
      'completedRevenue', COALESCE(SUM(fo.total_amount - fo.total_returned_amount) FILTER (WHERE fo.status = 'completed'), 0),
      'cancelledRevenue', COALESCE(SUM(co.total_amount), 0),
      'completedOrders', COUNT(DISTINCT fo.id) FILTER (WHERE fo.status = 'completed'),
      'cancelledOrders', COUNT(DISTINCT co.id),
      'prevRevenue', COALESCE((SELECT SUM(po.total_amount) FROM prev_orders po), 0),
      'prevOrdersCount', COALESCE((SELECT COUNT(*) FROM prev_orders po), 0)
    ) AS result
    FROM filtered_orders fo
    LEFT JOIN active_orders ao ON ao.id = fo.id
    LEFT JOIN cancelled_orders co ON co.id = fo.id
  ),
  daily_revenue AS (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date), '[]'::json) AS result
    FROM (
      SELECT
        d.date,
        COALESCE(o.revenue, 0) AS revenue,
        COALESCE(o.orders, 0) AS orders,
        COALESCE(o.revenue, 0) - COALESCE(i.cost, 0) AS profit
      FROM (
        SELECT DISTINCT to_char((dd.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date
        FROM (
          SELECT date FROM active_orders
          UNION
          SELECT date FROM all_items
        ) dd
      ) d
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
          SUM(total_amount - total_returned_amount) AS revenue,
          COUNT(*) AS orders
        FROM active_orders
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) o ON o.date = d.date
      LEFT JOIN (
        SELECT
          to_char((date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
          SUM(item_revenue) AS cost
        FROM all_items
        GROUP BY (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) i ON i.date = d.date
    ) t
  ),
  payment_data AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        COALESCE(ao.payment_method, 'Khác') AS name,
        COALESCE(SUM(ao.total_amount - ao.total_returned_amount), 0) AS value
      FROM active_orders ao
      GROUP BY ao.payment_method
    ) t
  ),
  grouped_by_product AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        COALESCE(fi.product_id, '') AS key,
        COALESCE(fi.product_name, 'Không xác định') AS label,
        COALESCE(SUM(fi.item_revenue), 0) AS revenue,
        0 AS orders,
        COALESCE(SUM(fi.quantity - fi.returned_qty), 0) AS count
      FROM all_items fi
      GROUP BY fi.product_id, fi.product_name
      ORDER BY SUM(fi.item_revenue) DESC
    ) t
  ),
  grouped_by_customer AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        COALESCE(ao.customer_id, 'guest') AS key,
        COALESCE(ao.customer_name, 'Khách lẻ') AS label,
        COALESCE(SUM(ao.total_amount - ao.total_returned_amount), 0) AS revenue,
        COUNT(DISTINCT ao.id) AS orders,
        0 AS count
      FROM active_orders ao
      GROUP BY ao.customer_id, ao.customer_name
      ORDER BY SUM(ao.total_amount - ao.total_returned_amount) DESC
    ) t
  ),
  grouped_by_day AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        to_char((ao.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS key,
        to_char((ao.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS label,
        COALESCE(SUM(ao.total_amount - ao.total_returned_amount), 0) AS revenue,
        COUNT(DISTINCT ao.id) AS orders,
        0 AS count
      FROM active_orders ao
      GROUP BY (ao.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ORDER BY (ao.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date DESC
    ) t
  ),
  grouped_by_order AS (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) AS result
    FROM (
      SELECT
        ao.id AS key,
        ('Đơn ' || ao.id) AS label,
        COALESCE(ao.total_amount - ao.total_returned_amount, 0) AS revenue,
        1 AS orders,
        0 AS count
      FROM active_orders ao
      ORDER BY (ao.total_amount - ao.total_returned_amount) DESC
    ) t
  ),
  detail_rows AS (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date DESC), '[]'::json) AS result
    FROM (
      SELECT
        to_char((fi.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
        fi.order_id AS order_id,
        COALESCE(fi.product_name, '') AS product_name,
        (fi.quantity - fi.returned_qty) AS quantity,
        fi.item_revenue AS revenue,
        COALESCE(fi.customer_name, '') AS customer_name,
        COALESCE(fi.payment_method, 'N/A') AS payment_method
      FROM all_items fi
    ) t
  )
  SELECT json_build_object(
    'summary', s.result,
    'dailyRevenue', dr.result,
    'paymentData', pd.result,
    'groupedByProduct', gbp.result,
    'groupedByCustomer', gbc.result,
    'groupedByDay', gbd.result,
    'groupedByOrder', gbo.result,
    'detailRows', dtr.result
  )
  INTO v_result
  FROM summary s, daily_revenue dr, payment_data pd,
       grouped_by_product gbp, grouped_by_customer gbc,
       grouped_by_day gbd, grouped_by_order gbo, detail_rows dtr;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_stock_balance"("p_product_id" "text", "p_at_date" timestamp with time zone DEFAULT "now"()) RETURNS TABLE("product_id" "text", "lot_id" "text", "quantity" numeric, "valuation_rate" numeric, "value" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (COALESCE(sm.lot_id, sm.product_id))
    sm.product_id,
    sm.lot_id,
    sm.qty_after_transaction AS quantity,
    sm.valuation_rate,
    sm.balance_value AS value
  FROM stock_movements sm
  WHERE sm.product_id = p_product_id
    AND sm.posting_date <= p_at_date
    AND (sm.is_cancelled = FALSE OR sm.is_cancelled IS NULL)
  ORDER BY COALESCE(sm.lot_id, sm.product_id), sm.posting_date DESC, sm.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_stock_ledger"("p_product_id" "text", "p_from_date" timestamp with time zone, "p_to_date" timestamp with time zone, "p_lot_id" "text" DEFAULT NULL::"text", "p_voucher_type" "text" DEFAULT NULL::"text", "p_is_cancelled" boolean DEFAULT NULL::boolean, "p_limit" integer DEFAULT 1000, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "posting_date" timestamp with time zone, "voucher_type" "text", "voucher_no" "text", "voucher_detail_no" "text", "product_id" "text", "product_name" "text", "lot_id" "text", "lot_code" "text", "warehouse" "text", "actual_qty" numeric, "qty_after_transaction" numeric, "valuation_rate" numeric, "incoming_rate" numeric, "outgoing_rate" numeric, "stock_value" numeric, "balance_value" numeric, "reason" "text", "is_cancelled" boolean, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$ BEGIN RETURN QUERY SELECT sm.id, sm.posting_date, sm.voucher_type, sm.voucher_no, sm.voucher_detail_no, sm.product_id, p.name AS product_name, sm.lot_id, pl.code AS lot_code, sm.warehouse, sm.actual_qty, sm.qty_after_transaction, sm.valuation_rate, sm.incoming_rate, sm.outgoing_rate, sm.stock_value, sm.balance_value, sm.reason, sm.is_cancelled, sm.created_at FROM stock_movements sm LEFT JOIN products p ON p.id = sm.product_id LEFT JOIN product_lots pl ON pl.id = sm.lot_id WHERE (p_product_id IS NULL OR sm.product_id = p_product_id) AND (p_from_date IS NULL OR sm.posting_date >= p_from_date) AND (p_to_date IS NULL OR sm.posting_date <= p_to_date) AND (p_lot_id IS NULL OR sm.lot_id = p_lot_id) AND (p_voucher_type IS NULL OR sm.voucher_type = p_voucher_type) AND (p_is_cancelled IS NULL OR sm.is_cancelled = p_is_cancelled) ORDER BY sm.posting_date ASC, sm.created_at ASC LIMIT p_limit OFFSET p_offset; END; $$;

CREATE OR REPLACE FUNCTION "public"."get_supplier_debt_ledger"("p_supplier_id" "text", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_rows JSON; v_total INT; v_balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_balance FROM public.supplier_payment_ledger WHERE supplier_id = p_supplier_id;
  SELECT COUNT(*) INTO v_total FROM public.supplier_payment_ledger WHERE supplier_id = p_supplier_id;
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY created_at DESC, id DESC), '[]'::json) INTO v_rows
  FROM (SELECT id, supplier_id, reference_type, reference_id, amount, balance_after, reason, created_by, created_at
        FROM public.supplier_payment_ledger WHERE supplier_id = p_supplier_id
        ORDER BY created_at DESC, id DESC LIMIT p_limit OFFSET p_offset) t;
  RETURN json_build_object('supplier_id', p_supplier_id, 'current_balance', v_balance,
    'total_entries', v_total, 'entries', v_rows);
END; $$;

CREATE OR REPLACE FUNCTION "public"."get_supplier_exchange_auto_code"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN 'DH' || LPAD(nextval('supplier_exchange_code_seq')::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_supplier_report"("p_start_date" "date", "p_end_date" "date") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_summary JSON;
  v_top_suppliers JSON;
  v_supplier_growth JSON;
  v_import_by_supplier JSON;
BEGIN
  SELECT json_build_object(
    'totalSuppliers', COALESCE((SELECT COUNT(*) FROM suppliers), 0),
    'totalDebt', COALESCE((SELECT SUM(debt) FROM suppliers), 0),
    'totalPaid', COALESCE((SELECT SUM(paid_amount) FROM import_receipts WHERE status = 'completed'), 0),
    'totalImportValue', COALESCE((SELECT SUM(total_cost) FROM import_receipts WHERE status = 'completed' AND (date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date), 0)
  ) INTO v_summary;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_top_suppliers
  FROM (
    SELECT
      s.id,
      s.code,
      s.name,
      COALESCE(SUM(ir.total_cost), 0) AS total_import_value,
      COALESCE(SUM(ir.paid_amount), 0) AS total_paid,
      COALESCE(s.debt, 0) AS debt,
      COUNT(DISTINCT ir.id)::int AS import_count
    FROM suppliers s
    LEFT JOIN import_receipts ir ON ir.supplier_id = s.id AND ir.status = 'completed'
    GROUP BY s.id, s.code, s.name, s.debt
    ORDER BY COALESCE(SUM(ir.total_cost), 0) DESC
    LIMIT 50
  ) t;

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date), '[]'::json) INTO v_supplier_growth
  FROM (
    SELECT
      to_char((s.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'DD/MM') AS date,
      COUNT(*)::int AS new_suppliers
    FROM suppliers s
    WHERE (s.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date
    GROUP BY (s.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
  ) t;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_import_by_supplier
  FROM (
    SELECT
      s.id,
      s.name,
      COALESCE(SUM(ir.total_cost), 0) AS value
    FROM suppliers s
    LEFT JOIN import_receipts ir ON ir.supplier_id = s.id AND ir.status = 'completed'
      AND (ir.date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN p_start_date AND p_end_date
    GROUP BY s.id, s.name
    ORDER BY COALESCE(SUM(ir.total_cost), 0) DESC
  ) t;

  RETURN json_build_object(
    'summary', v_summary,
    'topSuppliers', v_top_suppliers,
    'supplierGrowth', v_supplier_growth,
    'importBySupplier', v_import_by_supplier
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_supplier_stats"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_total INT;
  v_with_phone INT;
  v_with_debt INT;
  v_total_debt NUMERIC;
BEGIN
  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone <> '')::int,
    COUNT(*) FILTER (WHERE COALESCE(debt, 0) > 0)::int,
    COALESCE(SUM(debt), 0)
  INTO v_total, v_with_phone, v_with_debt, v_total_debt
  FROM suppliers;

  RETURN json_build_object(
    'total', COALESCE(v_total, 0),
    'withPhone', COALESCE(v_with_phone, 0),
    'withDebt', COALESCE(v_with_debt, 0),
    'totalDebt', COALESCE(v_total_debt, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_system_admins"() RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem danh sách system admin' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT sa.user_id, au.email, sa.created_at
      FROM public.system_admins sa
      JOIN auth.users au ON au.id = sa.user_id
      ORDER BY sa.created_at DESC
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_system_overview"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_total INTEGER;
  v_active INTEGER;
  v_trial INTEGER;
  v_vip INTEGER;
  v_expiring_soon INTEGER;
  v_near_limit INTEGER;
  v_new_this_month INTEGER;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem tổng quan hệ thống' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total FROM public.tenants;
  SELECT COUNT(*) INTO v_active FROM public.tenants WHERE status = 'active';
  SELECT COUNT(*) INTO v_trial FROM public.tenants WHERE status = 'trial';
  SELECT COUNT(*) INTO v_vip FROM public.tenants WHERE plan = 'vip';
  SELECT COUNT(*) INTO v_new_this_month FROM public.tenants WHERE created_at >= date_trunc('month', CURRENT_DATE);

  SELECT COUNT(*) INTO v_expiring_soon
  FROM public.tenant_subscriptions
  WHERE expires_at IS NOT NULL AND expires_at <= now() + INTERVAL '7 days';

  WITH usage AS (
    SELECT
      s.tenant_id,
      s.max_users,
      s.max_products,
      s.max_orders_per_month,
      s.current_month_orders,
      COALESCE(uc.count, 0) AS user_count,
      COALESCE(pc.count, 0) AS product_count
    FROM public.tenant_subscriptions s
    LEFT JOIN (SELECT tenant_id, COUNT(*) AS count FROM public.tenant_memberships GROUP BY tenant_id) uc
      ON uc.tenant_id = s.tenant_id
    LEFT JOIN (SELECT tenant_id, COUNT(*) AS count FROM public.products GROUP BY tenant_id) pc
      ON pc.tenant_id = s.tenant_id
  )
  SELECT COUNT(*) INTO v_near_limit
  FROM usage
  WHERE (max_users > 0 AND user_count::numeric / max_users >= 0.8)
     OR (max_products > 0 AND product_count::numeric / max_products >= 0.8)
     OR (max_orders_per_month > 0 AND current_month_orders::numeric / max_orders_per_month >= 0.8);

  v_result := json_build_object(
    'totalTenants', COALESCE(v_total, 0),
    'activeTenants', COALESCE(v_active, 0),
    'trialTenants', COALESCE(v_trial, 0),
    'vipTenants', COALESCE(v_vip, 0),
    'expiringSoon', COALESCE(v_expiring_soon, 0),
    'nearLimit', COALESCE(v_near_limit, 0),
    'newThisMonth', COALESCE(v_new_this_month, 0),
    'expiringTenants', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          ten.id,
          ten.name,
          ten.subdomain,
          s.expires_at,
          EXTRACT(DAY FROM (s.expires_at - now()))::int AS days_remaining
        FROM public.tenants ten
        JOIN public.tenant_subscriptions s ON s.tenant_id = ten.id
        WHERE s.expires_at IS NOT NULL
          AND s.expires_at <= now() + INTERVAL '7 days'
        ORDER BY s.expires_at ASC
        LIMIT 50
      ) t
    ),
    'nearLimitTenants', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          ten.id,
          ten.name,
          ten.subdomain,
          CASE WHEN s.max_users > 0 THEN ROUND((COALESCE(uc.count, 0)::numeric / s.max_users) * 100, 2) ELSE 0 END AS user_percent,
          CASE WHEN s.max_products > 0 THEN ROUND((COALESCE(pc.count, 0)::numeric / s.max_products) * 100, 2) ELSE 0 END AS product_percent,
          CASE WHEN s.max_orders_per_month > 0 THEN ROUND((s.current_month_orders::numeric / s.max_orders_per_month) * 100, 2) ELSE 0 END AS order_percent
        FROM public.tenant_subscriptions s
        JOIN public.tenants ten ON ten.id = s.tenant_id
        LEFT JOIN (SELECT tenant_id, COUNT(*) AS count FROM public.tenant_memberships GROUP BY tenant_id) uc
          ON uc.tenant_id = s.tenant_id
        LEFT JOIN (SELECT tenant_id, COUNT(*) AS count FROM public.products GROUP BY tenant_id) pc
          ON pc.tenant_id = s.tenant_id
        WHERE (s.max_users > 0 AND COALESCE(uc.count, 0)::numeric / s.max_users >= 0.8)
           OR (s.max_products > 0 AND COALESCE(pc.count, 0)::numeric / s.max_products >= 0.8)
           OR (s.max_orders_per_month > 0 AND s.current_month_orders::numeric / s.max_orders_per_month >= 0.8)
        ORDER BY GREATEST(
          CASE WHEN s.max_users > 0 THEN COALESCE(uc.count, 0)::numeric / s.max_users ELSE 0 END,
          CASE WHEN s.max_products > 0 THEN COALESCE(pc.count, 0)::numeric / s.max_products ELSE 0 END,
          CASE WHEN s.max_orders_per_month > 0 THEN s.current_month_orders::numeric / s.max_orders_per_month ELSE 0 END
        ) DESC
        LIMIT 50
      ) t
    )
  );

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_tenant_backup_tables"() RETURNS TABLE("table_name" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
BEGIN
  -- ponytail: lock this to service_role so only the Edge Function backend can enumerate tables.
  IF auth.role() NOT IN ('service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'Chỉ service role được liệt kê bảng backup' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT c.table_name::TEXT
  FROM information_schema.columns c
  JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
  WHERE c.table_schema = 'public'
    AND c.column_name = 'tenant_id'
    AND t.table_type = 'BASE TABLE'
  ORDER BY c.table_name;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_tenant_by_domain"("p_domain" "text") RETURNS "public"."tenants"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT * FROM public.tenants
  WHERE lower(custom_domain) = lower(p_domain)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION "public"."get_tenant_by_subdomain"("p_subdomain" "text") RETURNS "public"."tenants"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT * FROM public.tenants WHERE subdomain = p_subdomain LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION "public"."get_tenant_feature_flags"("p_tenant_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem feature flags' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN COALESCE(
    (SELECT settings->'features' FROM public.tenants WHERE id = p_tenant_id),
    '{}'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_tenant_growth"("p_months" integer DEFAULT 6) RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem tenant growth' USING ERRCODE = 'insufficient_privilege';
  END IF;

  WITH months AS (
    SELECT
      TO_CHAR(date_trunc('month', now()) - (n * INTERVAL '1 month'), 'YYYY-MM') AS month,
      date_trunc('month', now()) - (n * INTERVAL '1 month') AS month_start
    FROM generate_series(0, GREATEST(1, COALESCE(p_months, 6)) - 1) AS n
  ),
  counts AS (
    SELECT
      TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month,
      COUNT(*) AS count
    FROM public.tenants
    WHERE status <> 'archived'
      AND created_at >= (SELECT MIN(month_start) FROM months)
    GROUP BY date_trunc('month', created_at)
  )
  SELECT COALESCE(json_agg(
    json_build_object('month', m.month, 'count', COALESCE(c.count, 0))
    ORDER BY m.month
  ), '[]'::json)
  INTO v_result
  FROM months m
  LEFT JOIN counts c ON c.month = m.month;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_tenant_isolation"("p_tenant_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_tenant public.tenants;
BEGIN
  IF NOT public.is_system_admin() AND NOT public.is_tenant_member(p_tenant_id) THEN
    RAISE EXCEPTION 'Không có quyền xem thông tin cô lập tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  RETURN jsonb_build_object(
    'tenant_id', v_tenant.id,
    'plan', v_tenant.plan,
    'isolation_mode', COALESCE(v_tenant.isolation_mode, 'shared'),
    'isolation_schema', v_tenant.isolation_schema,
    'isolation_project_ref', v_tenant.isolation_project_ref
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_tenant_members_with_email"("p_tenant_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem danh sách thành viên tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        tm.id,
        tm.tenant_id,
        tm.user_id,
        u.email,
        tm.role,
        tm.invited_by,
        inviter.email AS invited_by_email,
        tm.created_at,
        tm.updated_at
      FROM public.tenant_memberships tm
      LEFT JOIN auth.users u ON u.id = tm.user_id
      LEFT JOIN auth.users inviter ON inviter.id = tm.invited_by
      WHERE tm.tenant_id = p_tenant_id
      ORDER BY tm.created_at DESC
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_tenant_restore_table_order"() RETURNS TABLE("table_name" "text", "depth" integer)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_tables TEXT[];
BEGIN
  SELECT array_agg(c.table_name::TEXT)
  INTO v_tables
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON c.table_schema = t.table_schema
   AND c.table_name = t.table_name
  WHERE c.table_schema = 'public'
    AND c.column_name = 'tenant_id'
    AND t.table_type = 'BASE TABLE';

  RETURN QUERY
  WITH RECURSIVE all_tables AS (
    SELECT unnest(v_tables) AS table_name
  ),
  deps AS (
    -- parent -> child FK relationships between tenant-scoped tables
    SELECT
      tc.table_name::TEXT AS parent_table,
      kcu.table_name::TEXT AS child_table
    FROM information_schema.referential_constraints rc
    JOIN information_schema.table_constraints tc
      ON rc.unique_constraint_schema = tc.constraint_schema
     AND rc.unique_constraint_name = tc.constraint_name
    JOIN information_schema.key_column_usage kcu
      ON rc.constraint_schema = kcu.constraint_schema
     AND rc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND kcu.table_schema = 'public'
  ),
  ordered AS (
    SELECT at.table_name, 0 AS depth, ARRAY[at.table_name] AS path
    FROM all_tables at
    WHERE at.table_name NOT IN (SELECT child_table FROM deps)

    UNION ALL

    SELECT d.child_table, o.depth + 1, o.path || d.child_table
    FROM deps d
    JOIN ordered o ON d.parent_table = o.table_name
    WHERE NOT d.child_table = ANY(o.path)
  )
  SELECT o.table_name, MAX(o.depth) AS depth
  FROM ordered o
  GROUP BY o.table_name
  ORDER BY MAX(o.depth), o.table_name;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_tenant_storage_usage"() RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_table RECORD;
  v_table_bytes BIGINT;
  v_total_rows BIGINT;
  v_sql TEXT;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem storage usage' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DROP TABLE IF EXISTS _tenant_storage;
  CREATE TEMP TABLE _tenant_storage (
    tenant_id UUID,
    table_name TEXT,
    row_count BIGINT,
    table_bytes BIGINT,
    estimated_bytes BIGINT
  ) ON COMMIT DROP;

  FOR v_table IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name
  LOOP
    BEGIN
      EXECUTE format(
        'SELECT pg_total_relation_size(%L::regclass), COALESCE(SUM(n_live_tup), 0) FROM pg_stat_user_tables WHERE schemaname = %L AND relname = %L',
        'public.' || quote_ident(v_table.table_name), 'public', v_table.table_name
      ) INTO v_table_bytes, v_total_rows;

      v_sql := format(
        'INSERT INTO _tenant_storage (tenant_id, table_name, row_count, table_bytes, estimated_bytes)
         SELECT tenant_id, %L, COUNT(*), %L::bigint,
           CASE WHEN %L::bigint > 0 THEN (%L::bigint * COUNT(*)) / %L::bigint ELSE 0 END
         FROM public.%I GROUP BY tenant_id',
        v_table.table_name, v_table_bytes, v_total_rows, v_table_bytes, v_total_rows, v_table.table_name
      );
      EXECUTE v_sql;
    EXCEPTION WHEN OTHERS THEN
      -- Skip tables we cannot inspect (e.g. locked or no stats yet).
      NULL;
    END;
  END LOOP;

  RETURN (
    SELECT json_build_object(
      'checkedAt', now(),
      'totalDatabaseBytes', pg_database_size(current_database()),
      'tenants', COALESCE(json_agg(row_to_json(t) ORDER BY t.total_bytes DESC), '[]'::json)
    )
    FROM (
      SELECT
        te.id,
        te.name,
        te.subdomain,
        COALESCE(SUM(ts.estimated_bytes), 0) AS total_bytes,
        COALESCE(json_agg(jsonb_build_object(
          'name', ts.table_name,
          'rowCount', ts.row_count,
          'bytes', ts.estimated_bytes
        ) ORDER BY ts.estimated_bytes DESC), '[]'::json) AS tables
      FROM public.tenants te
      LEFT JOIN _tenant_storage ts ON ts.tenant_id = te.id
      GROUP BY te.id, te.name, te.subdomain
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_tenant_usage_summary"("p_tenant_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_user_count INTEGER;
  v_product_count INTEGER;
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
  v_current_month_orders INTEGER;
  v_current_month_start DATE;
  v_today DATE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem usage tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', p_tenant_id;
  END IF;

  SELECT COUNT(*) INTO v_user_count FROM public.tenant_memberships WHERE tenant_id = p_tenant_id;
  SELECT COUNT(*) INTO v_product_count FROM public.products WHERE tenant_id = p_tenant_id;

  -- ponytail: nếu current_month_start khác tháng hiện tại, coi như counter đã reset về 0.
  v_today := date_trunc('month', CURRENT_DATE)::DATE;
  v_current_month_start := v_sub.current_month_start;
  IF v_current_month_start IS NULL OR v_current_month_start <> v_today THEN
    v_current_month_orders := 0;
    v_current_month_start := v_today;
  ELSE
    v_current_month_orders := v_sub.current_month_orders;
  END IF;

  RETURN json_build_object(
    'tenantId', v_sub.tenant_id,
    'plan', v_sub.plan,
    'billingStatus', v_sub.billing_status,
    'expiresAt', v_sub.expires_at,
    'users', json_build_object(
      'current', v_user_count,
      'max', v_sub.max_users,
      'percent', CASE WHEN v_sub.max_users > 0 THEN ROUND((v_user_count::NUMERIC / v_sub.max_users) * 100, 2) ELSE 0 END
    ),
    'products', json_build_object(
      'current', v_product_count,
      'max', v_sub.max_products,
      'percent', CASE WHEN v_sub.max_products > 0 THEN ROUND((v_product_count::NUMERIC / v_sub.max_products) * 100, 2) ELSE 0 END
    ),
    'orders', json_build_object(
      'current', v_current_month_orders,
      'max', v_sub.max_orders_per_month,
      'percent', CASE WHEN v_sub.max_orders_per_month > 0 THEN ROUND((v_current_month_orders::NUMERIC / v_sub.max_orders_per_month) * 100, 2) ELSE 0 END,
      'monthStart', v_current_month_start
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_terms_acceptances"("p_tenant_id" "uuid" DEFAULT NULL::"uuid", "p_terms_type" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS json
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_total INTEGER;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem terms acceptance log' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.terms_acceptance a
  WHERE (p_tenant_id IS NULL OR a.tenant_id = p_tenant_id)
    AND (p_terms_type IS NULL OR a.terms_type = p_terms_type);

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT a.id, a.user_id, a.tenant_id, a.terms_version, a.terms_type, a.accepted_at, a.ip_address::TEXT AS ip_address, a.user_agent, a.metadata, a.created_at
      FROM public.terms_acceptance a
      WHERE (p_tenant_id IS NULL OR a.tenant_id = p_tenant_id)
        AND (p_terms_type IS NULL OR a.terms_type = p_terms_type)
      ORDER BY a.accepted_at DESC
      LIMIT COALESCE(p_limit, 50)
      OFFSET COALESCE(p_offset, 0)
    ) t
  );

  RETURN json_build_object(
    'data', v_result,
    'count', COALESCE(v_total, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_top_tenants"(
  "p_limit" integer DEFAULT 10,
  "p_offset" integer DEFAULT 0
) RETURNS json
    LANGUAGE "plpgsql" STABLE
    SECURITY INVOKER
    SET search_path = public
    AS $$
DECLARE
  v_total INTEGER;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem top tenants' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.tenants
  WHERE status <> 'archived';

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        ten.id,
        ten.name,
        ten.subdomain,
        ten.status,
        ten.plan,
        ten.created_at,
        COALESCE(s.current_month_orders, 0) AS orders_this_month,
        COALESCE(uc.count, 0) AS user_count,
        COALESCE(pc.count, 0) AS product_count
      FROM public.tenants ten
      LEFT JOIN public.tenant_subscriptions s ON s.tenant_id = ten.id
      LEFT JOIN (SELECT tenant_id, COUNT(*) AS count FROM public.tenant_memberships GROUP BY tenant_id) uc
        ON uc.tenant_id = ten.id
      LEFT JOIN (SELECT tenant_id, COUNT(*) AS count FROM public.products GROUP BY tenant_id) pc
        ON pc.tenant_id = ten.id
      WHERE ten.status <> 'archived'
      ORDER BY s.current_month_orders DESC NULLS LAST, ten.created_at DESC
      LIMIT p_limit
      OFFSET p_offset
    ) t
  );

  RETURN json_build_object(
    'data', v_result,
    'count', COALESCE(v_total, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_unsynced_brands"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_result
  FROM (
    SELECT DISTINCT TRIM(p.brand) AS name
    FROM products p
    WHERE p.brand IS NOT NULL AND p.brand <> ''
      AND NOT EXISTS (
        SELECT 1 FROM brands b WHERE b.name = TRIM(p.brand)
      )
  ) t;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_unsynced_categories"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_result
  FROM (
    SELECT DISTINCT TRIM(p.category) AS name
    FROM products p
    WHERE p.category IS NOT NULL AND p.category <> ''
      AND NOT EXISTS (
        SELECT 1 FROM categories c WHERE c.name = TRIM(p.category)
      )
  ) t;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."has_tenant_role"("p_tenant_id" "uuid", "p_role" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = p_role
  );
$$;

CREATE OR REPLACE FUNCTION "public"."increment_monthly_order_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_sub public.tenant_subscriptions%ROWTYPE;
BEGIN
  -- ponytail: kiểm tra tenant active và subscription tồn tại trước khi tăng counter.
  SELECT * INTO v_tenant FROM public.tenants WHERE id = NEW.tenant_id;
  IF NOT FOUND OR v_tenant.status NOT IN ('active', 'trial') THEN
    RAISE EXCEPTION 'Tenant không hoạt động hoặc không tồn tại';
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = NEW.tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant';
  END IF;

  IF v_sub.current_month_start IS NULL OR v_sub.current_month_start <> date_trunc('month', CURRENT_DATE)::DATE THEN
    UPDATE public.tenant_subscriptions
    SET current_month_orders = 1,
        current_month_start = date_trunc('month', CURRENT_DATE)::DATE,
        updated_at = now()
    WHERE tenant_id = NEW.tenant_id;
  ELSE
    IF v_sub.current_month_orders >= v_sub.max_orders_per_month THEN
      RAISE EXCEPTION 'Đã đạt giới hạn số đơn hàng/tháng của gói dịch vụ';
    END IF;
    UPDATE public.tenant_subscriptions
    SET current_month_orders = current_month_orders + 1,
        updated_at = now()
    WHERE tenant_id = NEW.tenant_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."increment_product_quantity"("p_product_id" "text", "p_quantity" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE products
  SET quantity = COALESCE(quantity, 0) + p_quantity
  WHERE id = p_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."insert_customer_ledger_entry"("p_customer_id" "text", "p_reference_type" "text", "p_reference_id" "text" DEFAULT NULL::"text", "p_amount" numeric DEFAULT 0, "p_reason" "text" DEFAULT NULL::"text", "p_created_by" "text" DEFAULT 'system'::"text", "p_created_at" timestamp with time zone DEFAULT "now"()) RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_balance_after NUMERIC(15,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) + p_amount INTO v_balance_after
  FROM public.customer_payment_ledger WHERE customer_id = p_customer_id;
  INSERT INTO public.customer_payment_ledger
    (customer_id, reference_type, reference_id, amount, balance_after, reason, created_by, created_at)
  VALUES (p_customer_id, p_reference_type, p_reference_id, p_amount, v_balance_after, p_reason, p_created_by, p_created_at);
  RETURN v_balance_after;
END; $$;

CREATE OR REPLACE FUNCTION "public"."insert_customer_ledger_entry"("p_customer_id" "text", "p_reference_type" "text", "p_reference_id" "text" DEFAULT NULL::"text", "p_amount" numeric DEFAULT 0, "p_reason" "text" DEFAULT NULL::"text", "p_created_by" "text" DEFAULT 'system'::"text", "p_created_at" timestamp with time zone DEFAULT "now"(), "p_tenant_id" "uuid" DEFAULT NULL::"uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_balance_after NUMERIC(15,2);
  v_tenant_id UUID := COALESCE(p_tenant_id, public.current_tenant_id());
BEGIN
  SELECT COALESCE(SUM(amount), 0) + p_amount INTO v_balance_after
  FROM public.customer_payment_ledger
  WHERE customer_id = p_customer_id
    AND (v_tenant_id IS NULL OR tenant_id = v_tenant_id);

  INSERT INTO public.customer_payment_ledger
    (customer_id, reference_type, reference_id, amount, balance_after, reason, created_by, created_at, tenant_id)
  VALUES (p_customer_id, p_reference_type, p_reference_id, p_amount, v_balance_after, p_reason, p_created_by, p_created_at, v_tenant_id);

  RETURN v_balance_after;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."insert_stock_ledger_entry"("p_posting_date" timestamp with time zone, "p_voucher_type" "text", "p_voucher_no" "text", "p_voucher_detail_no" "text", "p_product_id" "text", "p_lot_id" "text", "p_warehouse" "text", "p_actual_qty" numeric, "p_qty_after_transaction" numeric, "p_valuation_rate" numeric, "p_incoming_rate" numeric, "p_outgoing_rate" numeric, "p_reason" "text", "p_is_cancelled" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_qty_after_transaction NUMERIC;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.stock_movements
    WHERE voucher_type = p_voucher_type
      AND voucher_detail_no = p_voucher_detail_no
      AND is_cancelled = p_is_cancelled
      AND lot_id IS NOT DISTINCT FROM p_lot_id
    LIMIT 1
  ) THEN
    RETURN;
  END IF;

  v_qty_after_transaction := public.calc_qty_after_transaction(p_product_id, p_lot_id, p_actual_qty);

  INSERT INTO public.stock_movements (
    posting_date, voucher_type, voucher_no, voucher_detail_no,
    product_id, lot_id, warehouse, actual_qty, qty_after_transaction,
    valuation_rate, incoming_rate, outgoing_rate, stock_value, balance_value,
    reason, is_cancelled
  ) VALUES (
    p_posting_date, p_voucher_type, p_voucher_no, p_voucher_detail_no,
    p_product_id, p_lot_id, COALESCE(p_warehouse, 'Kho Chính'),
    p_actual_qty, v_qty_after_transaction,
    COALESCE(p_valuation_rate, 0),
    COALESCE(p_incoming_rate, 0),
    COALESCE(p_outgoing_rate, 0),
    p_actual_qty * COALESCE(p_valuation_rate, 0),
    v_qty_after_transaction * COALESCE(p_valuation_rate, 0),
    p_reason,
    COALESCE(p_is_cancelled, FALSE)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."insert_stock_ledger_entry"("p_posting_date" timestamp with time zone, "p_voucher_type" "text", "p_voucher_no" "text", "p_voucher_detail_no" "text", "p_product_id" "text", "p_lot_id" "text", "p_warehouse" "text", "p_actual_qty" numeric, "p_qty_after_transaction" numeric, "p_valuation_rate" numeric, "p_incoming_rate" numeric, "p_outgoing_rate" numeric, "p_reason" "text", "p_is_cancelled" boolean DEFAULT false, "p_tenant_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_qty_after_transaction NUMERIC;
  v_tenant_id UUID := COALESCE(p_tenant_id, public.current_tenant_id());
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.stock_movements
    WHERE voucher_type = p_voucher_type
      AND voucher_detail_no = p_voucher_detail_no
      AND is_cancelled = p_is_cancelled
      AND lot_id IS NOT DISTINCT FROM p_lot_id
      AND (v_tenant_id IS NULL OR tenant_id = v_tenant_id)
    LIMIT 1
  ) THEN
    RETURN;
  END IF;

  v_qty_after_transaction := public.calc_qty_after_transaction(p_product_id, p_lot_id, p_actual_qty, v_tenant_id);

  INSERT INTO public.stock_movements (
    posting_date, voucher_type, voucher_no, voucher_detail_no,
    product_id, lot_id, warehouse, actual_qty, qty_after_transaction,
    valuation_rate, incoming_rate, outgoing_rate, stock_value, balance_value,
    reason, is_cancelled, tenant_id
  ) VALUES (
    p_posting_date, p_voucher_type, p_voucher_no, p_voucher_detail_no,
    p_product_id, p_lot_id, COALESCE(p_warehouse, 'Kho Ch??nh'),
    p_actual_qty, v_qty_after_transaction,
    COALESCE(p_valuation_rate, 0),
    COALESCE(p_incoming_rate, 0),
    COALESCE(p_outgoing_rate, 0),
    p_actual_qty * COALESCE(p_valuation_rate, 0),
    v_qty_after_transaction * COALESCE(p_valuation_rate, 0),
    p_reason,
    COALESCE(p_is_cancelled, FALSE),
    v_tenant_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."insert_supplier_ledger_entry"("p_supplier_id" "text", "p_reference_type" "text", "p_reference_id" "text" DEFAULT NULL::"text", "p_amount" numeric DEFAULT 0, "p_reason" "text" DEFAULT NULL::"text", "p_created_by" "text" DEFAULT 'system'::"text", "p_created_at" timestamp with time zone DEFAULT "now"()) RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_balance_after NUMERIC(15,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) + p_amount INTO v_balance_after
  FROM public.supplier_payment_ledger WHERE supplier_id = p_supplier_id;
  INSERT INTO public.supplier_payment_ledger
    (supplier_id, reference_type, reference_id, amount, balance_after, reason, created_by, created_at)
  VALUES (p_supplier_id, p_reference_type, p_reference_id, p_amount, v_balance_after, p_reason, p_created_by, p_created_at);
  RETURN v_balance_after;
END; $$;

CREATE OR REPLACE FUNCTION "public"."insert_tenant_registration_event"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT au.email INTO v_email
  FROM auth.users au
  WHERE au.id = NEW.owner_id;

  INSERT INTO public.tenant_registration_events (
    tenant_id, owner_user_id, email, creator_id
  ) VALUES (
    NEW.id,
    NEW.owner_id,
    v_email,
    auth.uid()
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."is_2fa_enabled"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.mfa_factors
    WHERE user_id = p_user_id
      AND status = 'verified'
      AND factor_type = 'totp'
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."is_system_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION "public"."is_tenant_admin"("p_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION "public"."is_tenant_member"("p_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships tm
    JOIN public.tenants t ON t.id = tm.tenant_id
    WHERE tm.tenant_id = p_tenant_id AND tm.user_id = auth.uid() AND t.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION "public"."is_tenant_writable"("p_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = p_tenant_id
      AND status IN ('active', 'trial')
  );
$$;

CREATE OR REPLACE FUNCTION "public"."is_valid_plan"("p_plan" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.plans WHERE key = p_plan AND is_active = true);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."list_2fa_backup_codes"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN '[]'::json;
  END IF;

  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Không được xem backup code của người khác' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT id, created_at AS createdAt
      FROM public.admin_2fa_backup_codes
      WHERE user_id = p_user_id AND used_at IS NULL
      ORDER BY created_at
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."list_integrations"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem danh sách integration' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        i.id,
        i.partner_id AS partnerId,
        i.name,
        i.slug,
        i.description,
        i.category,
        i.status,
        i.documentation_url AS documentationUrl,
        p.name AS partnerName,
        i.created_by AS createdBy,
        i.created_at AS createdAt,
        i.updated_at AS updatedAt
      FROM public.integrations i
      LEFT JOIN public.partners p ON p.id = i.partner_id
      ORDER BY i.created_at DESC
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."list_partners"() RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem danh sách partner' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        id,
        name,
        slug,
        description,
        website,
        contact_email AS contactEmail,
        logo_url AS logoUrl,
        status,
        created_by AS createdBy,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM public.partners
      ORDER BY created_at DESC
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."list_tenant_api_keys"("p_tenant_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem API key' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        id,
        tenant_id AS tenantId,
        name,
        api_key_preview AS apiKeyPreview,
        version,
        status,
        created_by AS createdBy,
        revoked_at AS revokedAt,
        revoked_by AS revokedBy,
        last_used_at AS lastUsedAt,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM public.tenant_api_keys
      WHERE tenant_id = p_tenant_id
      ORDER BY created_at DESC
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."list_tenant_webhooks"("p_tenant_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem webhook' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        id,
        tenant_id AS tenantId,
        name,
        url,
        events,
        status,
        created_by AS createdBy,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM public.tenant_webhooks
      WHERE tenant_id = p_tenant_id
      ORDER BY created_at DESC
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."list_webhook_deliveries"("p_webhook_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xem delivery log' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN (
    SELECT json_build_object(
      'data', COALESCE(json_agg(row_to_json(t)), '[]'::json),
      'count', (SELECT COUNT(*) FROM public.webhook_deliveries WHERE webhook_id = p_webhook_id)
    )
    FROM (
      SELECT
        id,
        webhook_id AS webhookId,
        tenant_id AS tenantId,
        event_type AS eventType,
        payload,
        idempotency_key AS idempotencyKey,
        status,
        http_status AS httpStatus,
        response_body AS responseBody,
        error_message AS errorMessage,
        attempt_count AS attemptCount,
        max_attempts AS maxAttempts,
        attempted_at AS attemptedAt,
        delivered_at AS deliveredAt,
        next_retry_at AS nextRetryAt,
        attempt_log AS attemptLog,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM public.webhook_deliveries
      WHERE webhook_id = p_webhook_id
      ORDER BY created_at DESC
      LIMIT p_limit OFFSET p_offset
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."log_billing_job"("p_job_name" "text", "p_status" "text", "p_duration_ms" integer DEFAULT NULL::integer, "p_records_affected" integer DEFAULT 0, "p_message" "text" DEFAULT NULL::"text", "p_details" "jsonb" DEFAULT NULL::"jsonb") RETURNS "public"."billing_job_logs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_log public.billing_job_logs;
BEGIN
  INSERT INTO public.billing_job_logs (
    job_name, status, run_at, duration_ms, records_affected, message, details
  ) VALUES (
    p_job_name, p_status, now(), p_duration_ms, COALESCE(p_records_affected, 0), p_message, p_details
  ) RETURNING * INTO v_log;
  RETURN v_log;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."mark_in_app_message_read"("p_log_id" "uuid", "p_tenant_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  v_tenant_id := COALESCE(p_tenant_id, public.current_tenant_id());
  IF v_tenant_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.notification_logs
  SET status = 'read',
      updated_at = now()
  WHERE id = p_log_id
    AND tenant_id = v_tenant_id
    AND channel = 'in_app'
    AND status <> 'read';

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."mark_webhook_delivery"("p_delivery_id" "uuid", "p_status" "text", "p_http_status" integer DEFAULT NULL::integer, "p_response_body" "text" DEFAULT NULL::"text", "p_error_message" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_row public.webhook_deliveries;
  v_next_retry TIMESTAMPTZ;
  v_attempt_log JSONB;
BEGIN
  IF p_status NOT IN ('delivered','failed','exhausted') THEN
    RAISE EXCEPTION 'status phải là delivered, failed hoặc exhausted';
  END IF;

  SELECT * INTO v_row FROM public.webhook_deliveries WHERE id = p_delivery_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy delivery: %', p_delivery_id;
  END IF;

  v_attempt_log := v_row.attempt_log || jsonb_build_object(
    'attempted_at', now(),
    'http_status', p_http_status,
    'error_message', p_error_message
  );

  IF p_status = 'delivered' THEN
    v_next_retry := NULL;
  ELSIF v_row.attempt_count >= v_row.max_attempts THEN
    p_status := 'exhausted';
    v_next_retry := NULL;
  ELSE
    v_next_retry := now() + public.webhook_retry_schedule(v_row.attempt_count + 1);
  END IF;

  UPDATE public.webhook_deliveries
  SET status = p_status,
      http_status = p_http_status,
      response_body = p_response_body,
      error_message = p_error_message,
      attempt_count = attempt_count + 1,
      attempted_at = now(),
      delivered_at = CASE WHEN p_status = 'delivered' THEN now() ELSE delivered_at END,
      next_retry_at = v_next_retry,
      attempt_log = v_attempt_log,
      updated_at = now()
  WHERE id = p_delivery_id
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id', v_row.id,
    'status', v_row.status,
    'attemptCount', v_row.attempt_count,
    'nextRetryAt', v_row.next_retry_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."migrate_tenant_data"("p_source_tenant_id" "uuid", "p_target_tenant_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $_$
DECLARE
  v_table TEXT;
  v_order TEXT[];
  v_rows JSONB;
  v_tables JSONB := '{}'::JSONB;
  v_result JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được migrate tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_source_tenant_id IS NULL OR p_target_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu source tenant_id hoặc target tenant_id';
  END IF;

  IF p_source_tenant_id = p_target_tenant_id THEN
    RAISE EXCEPTION 'Source và target tenant phải khác nhau';
  END IF;

  PERFORM id FROM public.tenants WHERE id = p_source_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy source tenant: %', p_source_tenant_id;
  END IF;

  PERFORM id FROM public.tenants WHERE id = p_target_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy target tenant: %', p_target_tenant_id;
  END IF;

  -- ponytail: copy in FK dependency order so child rows reference already-copied parents.
  SELECT array_agg(o.table_name ORDER BY o.depth, o.table_name)
  INTO v_order
  FROM public.get_tenant_restore_table_order() o;

  IF v_order IS NULL OR array_length(v_order, 1) IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy bảng tenant-scoped nào để migrate';
  END IF;

  FOREACH v_table IN ARRAY v_order LOOP
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) FROM public.%I t WHERE t.tenant_id = $1',
      v_table
    ) INTO v_rows USING p_source_tenant_id;

    v_tables := v_tables || jsonb_build_object(v_table, v_rows);
  END LOOP;

  SELECT public.restore_tenant_tables(p_target_tenant_id, v_tables) INTO v_result;

  RETURN jsonb_build_object(
    'source_tenant_id', p_source_tenant_id,
    'target_tenant_id', p_target_tenant_id,
    'result', v_result
  );
END;
$_$;


ALTER FUNCTION "public"."migrate_tenant_data"("p_source_tenant_id" "uuid", "p_target_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."orders_set_order_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
    NEW.order_code := NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."pay_order_debt"("p_order_id" "text", "p_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order RECORD; v_customer RECORD;
  v_remaining_debt NUMERIC; v_effective_amount NUMERIC;
  v_new_paid NUMERIC; v_new_order_debt NUMERIC; v_new_customer_debt NUMERIC; v_balance_after NUMERIC;
BEGIN
  IF p_order_id IS NULL OR p_order_id = '' THEN RAISE EXCEPTION 'order_id is required'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Số tiền thanh toán phải lớn hơn 0'; END IF;
  SELECT id, customer_id, total_amount, paid_amount, debt_recorded, status INTO v_order
  FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Đơn hàng % không tồn tại', p_order_id; END IF;
  IF v_order.status = 'cancelled' THEN RAISE EXCEPTION 'Đơn hàng % đã bị huỷ, không thể thanh toán công nợ', p_order_id USING ERRCODE = 'P0001'; END IF;
  v_remaining_debt := COALESCE(v_order.debt_recorded, 0);
  IF v_remaining_debt <= 0 THEN RAISE EXCEPTION 'Đơn hàng % đã thanh toán đủ, không còn công nợ', p_order_id USING ERRCODE = 'P0001'; END IF;
  v_effective_amount := LEAST(p_amount, v_remaining_debt);
  v_new_paid := COALESCE(v_order.paid_amount, 0) + v_effective_amount;
  v_new_order_debt := GREATEST(0, COALESCE(v_order.total_amount, 0) - v_new_paid);
  UPDATE orders SET paid_amount = v_new_paid, debt_recorded = v_new_order_debt WHERE id = p_order_id;
  v_new_customer_debt := NULL;
  IF v_order.customer_id IS NOT NULL AND v_order.customer_id != '' AND v_order.customer_id != 'guest' THEN
    SELECT id, debt INTO v_customer FROM customers WHERE id = v_order.customer_id FOR UPDATE;
    IF FOUND THEN
      v_new_customer_debt := GREATEST(0, COALESCE(v_customer.debt, 0) - v_effective_amount);
      UPDATE customers SET debt = v_new_customer_debt, updated_at = NOW() WHERE id = v_order.customer_id;
      v_balance_after := public.insert_customer_ledger_entry(
        p_customer_id := v_order.customer_id, p_reference_type := 'payment',
        p_reference_id := p_order_id, p_amount := -v_effective_amount,
        p_reason := 'Thanh toán công nợ đơn ' || p_order_id,
        p_created_by := current_setting('request.jwt.claim.sub', true));
    ELSE RAISE NOTICE 'Customer % không tồn tại', v_order.customer_id; END IF;
  END IF;
  RETURN jsonb_build_object('ok', true, 'order_id', p_order_id, 'requested_amount', p_amount,
    'effective_amount', v_effective_amount, 'change_amount', GREATEST(0, p_amount - v_effective_amount),
    'new_order_paid', v_new_paid, 'new_order_debt', v_new_order_debt,
    'new_customer_debt', v_new_customer_debt, 'ledger_balance_after', v_balance_after,
    'fully_paid', (v_new_order_debt = 0));
END; $$;

CREATE OR REPLACE FUNCTION "public"."pay_supplier_debt"("p_receipt_id" "text", "p_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_receipt RECORD; v_supplier RECORD;
  v_remaining_debt NUMERIC; v_effective_amount NUMERIC;
  v_new_paid NUMERIC; v_new_receipt_debt NUMERIC; v_new_supplier_debt NUMERIC; v_balance_after NUMERIC;
BEGIN
  IF p_receipt_id IS NULL OR p_receipt_id = '' THEN RAISE EXCEPTION 'receipt_id is required'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Số tiền thanh toán phải lớn hơn 0'; END IF;
  SELECT id, supplier_id, total_cost, paid_amount, debt_recorded, status INTO v_receipt
  FROM import_receipts WHERE id = p_receipt_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Phiếu nhập % không tồn tại', p_receipt_id; END IF;
  IF v_receipt.status != 'completed' THEN RAISE EXCEPTION 'Phiếu nhập % chưa hoàn thành', p_receipt_id USING ERRCODE = 'P0001'; END IF;
  v_remaining_debt := COALESCE(v_receipt.debt_recorded, 0);
  IF v_remaining_debt <= 0 THEN RAISE EXCEPTION 'Phiếu nhập % đã thanh toán đủ', p_receipt_id USING ERRCODE = 'P0001'; END IF;
  v_effective_amount := LEAST(p_amount, v_remaining_debt);
  v_new_paid := COALESCE(v_receipt.paid_amount, 0) + v_effective_amount;
  v_new_receipt_debt := GREATEST(0, COALESCE(v_receipt.total_cost, 0) - v_new_paid);
  UPDATE import_receipts SET paid_amount = v_new_paid, debt_recorded = v_new_receipt_debt WHERE id = p_receipt_id;
  v_new_supplier_debt := NULL;
  IF v_receipt.supplier_id IS NOT NULL AND v_receipt.supplier_id != '' THEN
    SELECT id, debt INTO v_supplier FROM suppliers WHERE id = v_receipt.supplier_id FOR UPDATE;
    IF FOUND THEN
      v_new_supplier_debt := GREATEST(0, COALESCE(v_supplier.debt, 0) - v_effective_amount);
      UPDATE suppliers SET debt = v_new_supplier_debt, updated_at = NOW() WHERE id = v_receipt.supplier_id;
      v_balance_after := public.insert_supplier_ledger_entry(
        p_supplier_id := v_receipt.supplier_id, p_reference_type := 'payment',
        p_reference_id := p_receipt_id, p_amount := -v_effective_amount,
        p_reason := 'Thanh toán công nợ phiếu nhập ' || p_receipt_id,
        p_created_by := current_setting('request.jwt.claim.sub', true));
    ELSE RAISE NOTICE 'Supplier % không tồn tại', v_receipt.supplier_id; END IF;
  END IF;
  RETURN jsonb_build_object('ok', true, 'receipt_id', p_receipt_id, 'requested_amount', p_amount,
    'effective_amount', v_effective_amount, 'change_amount', GREATEST(0, p_amount - v_effective_amount),
    'new_receipt_paid', v_new_paid, 'new_receipt_debt', v_new_receipt_debt,
    'new_supplier_debt', v_new_supplier_debt, 'ledger_balance_after', v_balance_after,
    'fully_paid', (v_new_receipt_debt = 0));
END; $$;

CREATE OR REPLACE FUNCTION "public"."process_checkout"("p_order" "jsonb", "p_items" "jsonb" DEFAULT '[]'::"jsonb", "p_deltas" "jsonb" DEFAULT '[]'::"jsonb", "p_reward_deltas" "jsonb" DEFAULT '[]'::"jsonb", "p_customer_update" "jsonb" DEFAULT NULL::"jsonb", "p_point_history" "jsonb" DEFAULT '[]'::"jsonb", "p_allow_negative" boolean DEFAULT false, "p_op_id" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_order_id        TEXT;
  v_customer_id     TEXT;
  v_item            JSONB;
  v_delta           JSONB;
  v_reward          JSONB;
  v_ph              JSONB;
  v_product         RECORD;
  v_reward_row      RECORD;
  v_lot             RECORD;
  v_lot_id          TEXT;
  v_deduct_qty      NUMERIC;
  v_new_qty         NUMERIC;
  v_new_stock       NUMERIC;
  v_add_spent       NUMERIC;
  v_add_debt        NUMERIC;
  v_add_points      NUMERIC;
  v_item_cost       NUMERIC;
  v_inserted_op     INTEGER;
  v_order_item_id   TEXT;
  v_idx             INTEGER;
  v_qty_after       NUMERIC;
  v_posting_date    TIMESTAMPTZ;
BEGIN
  IF NOT public.is_tenant_writable(public.current_tenant_id()) THEN
    RAISE EXCEPTION 'TENANT_READ_ONLY' USING ERRCODE = 'P0001';
  END IF;

  v_order_id := p_order->>'id';
  IF v_order_id IS NULL OR v_order_id = '' THEN
    RAISE EXCEPTION 'order.id is required';
  END IF;

  v_posting_date := COALESCE((p_order->>'date')::TIMESTAMPTZ, NOW());

  IF p_op_id IS NOT NULL AND p_op_id != '' THEN
    INSERT INTO public.processed_operations (op_id, op_type, ref_id, tenant_id)
    VALUES (p_op_id, 'checkout', v_order_id, public.current_tenant_id())
    ON CONFLICT (op_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted_op = ROW_COUNT;
    IF v_inserted_op = 0 THEN
      RETURN jsonb_build_object('ok', true, 'order_id', v_order_id, 'skipped', true, 'reason', 'op_id already processed');
    END IF;
  END IF;

  v_customer_id := p_order->>'customerId';
  IF v_customer_id IS NULL OR v_customer_id = '' OR v_customer_id = 'guest' THEN
    v_customer_id := NULL;
  END IF;

  IF p_op_id IS NOT NULL AND p_op_id != '' THEN
    INSERT INTO public.orders (
      id, date, customer_id, customer_name,
      total_amount, paid_amount, debt_recorded, payment_method,
      status, points_earned, points_redeemed, rewards_redeemed,
      applied_promotions, note, tenant_id
    ) VALUES (
      v_order_id, v_posting_date, v_customer_id, p_order->>'customerName',
      COALESCE((p_order->>'totalAmount')::NUMERIC, 0),
      COALESCE((p_order->>'paidAmount')::NUMERIC, 0),
      COALESCE((p_order->>'debtRecorded')::NUMERIC, 0),
      p_order->>'paymentMethod',
      COALESCE(p_order->>'status', 'completed'),
      COALESCE((p_order->>'pointsEarned')::NUMERIC, 0),
      COALESCE((p_order->>'pointsRedeemed')::NUMERIC, 0),
      COALESCE(p_order->'rewardsRedeemed', '[]'::jsonb),
      COALESCE(p_order->'appliedPromotions', '[]'::jsonb),
      p_order->>'note',
      public.current_tenant_id()
    );
  ELSE
    INSERT INTO public.orders (
      id, date, customer_id, customer_name,
      total_amount, paid_amount, debt_recorded, payment_method,
      status, points_earned, points_redeemed, rewards_redeemed,
      applied_promotions, note, tenant_id
    ) VALUES (
      v_order_id, v_posting_date, v_customer_id, p_order->>'customerName',
      COALESCE((p_order->>'totalAmount')::NUMERIC, 0),
      COALESCE((p_order->>'paidAmount')::NUMERIC, 0),
      COALESCE((p_order->>'debtRecorded')::NUMERIC, 0),
      p_order->>'paymentMethod',
      COALESCE(p_order->>'status', 'completed'),
      COALESCE((p_order->>'pointsEarned')::NUMERIC, 0),
      COALESCE((p_order->>'pointsRedeemed')::NUMERIC, 0),
      COALESCE(p_order->'rewardsRedeemed', '[]'::jsonb),
      COALESCE(p_order->'appliedPromotions', '[]'::jsonb),
      p_order->>'note',
      public.current_tenant_id()
    )
    ON CONFLICT (id) DO UPDATE SET
      date               = EXCLUDED.date,
      customer_id        = EXCLUDED.customer_id,
      customer_name      = EXCLUDED.customer_name,
      total_amount       = EXCLUDED.total_amount,
      paid_amount        = EXCLUDED.paid_amount,
      debt_recorded      = EXCLUDED.debt_recorded,
      payment_method     = EXCLUDED.payment_method,
      status             = EXCLUDED.status,
      points_earned      = EXCLUDED.points_earned,
      points_redeemed    = EXCLUDED.points_redeemed,
      rewards_redeemed   = EXCLUDED.rewards_redeemed,
      applied_promotions = EXCLUDED.applied_promotions,
      note               = EXCLUDED.note,
      tenant_id          = EXCLUDED.tenant_id;
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS tmp_phase7b_order_item_ids (
    idx INTEGER PRIMARY KEY,
    order_item_id TEXT
  ) ON COMMIT DROP;
  DELETE FROM tmp_phase7b_order_item_ids WHERE TRUE;

  DELETE FROM public.order_items WHERE order_id = v_order_id AND tenant_id = public.current_tenant_id();
  IF jsonb_typeof(p_items) = 'array' AND jsonb_array_length(p_items) > 0 THEN
    v_idx := 0;
    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
      v_idx := v_idx + 1;
      v_item_cost := COALESCE(
        (v_item->>'cost')::NUMERIC,
        CASE
          WHEN NULLIF(v_item->>'lotId', '') IS NOT NULL THEN
            (SELECT cost FROM public.product_lots WHERE id = v_item->>'lotId' AND tenant_id = public.current_tenant_id())
          ELSE
            (SELECT cost FROM public.products WHERE id = v_item->>'productId' AND tenant_id = public.current_tenant_id())
        END,
        0
      );
      INSERT INTO public.order_items (
        order_id, product_id, product_name, quantity, unit_name, price,
        lot_id, lot_code, cost, tenant_id
      ) VALUES (
        v_order_id, v_item->>'productId', v_item->>'productName',
        COALESCE((v_item->>'quantity')::NUMERIC, 0), v_item->>'unitName',
        COALESCE((v_item->>'price')::NUMERIC, 0),
        NULLIF(v_item->>'lotId', ''), NULLIF(v_item->>'lotCode', ''),
        v_item_cost, public.current_tenant_id()
      ) RETURNING id INTO v_order_item_id;
      INSERT INTO tmp_phase7b_order_item_ids (idx, order_item_id)
      VALUES (v_idx, v_order_item_id);
    END LOOP;
  END IF;

  IF jsonb_typeof(p_deltas) = 'array' AND jsonb_array_length(p_deltas) > 0 THEN
    FOR v_delta IN SELECT * FROM jsonb_array_elements(p_deltas) LOOP
      v_deduct_qty := COALESCE((v_delta->>'deductBaseQty')::NUMERIC, 0);
      v_lot_id     := NULLIF(v_delta->>'lotId', '');
      IF v_deduct_qty <= 0 THEN CONTINUE; END IF;
      SELECT id, name, quantity, has_lots INTO v_product
      FROM public.products WHERE id = v_delta->>'productId' AND tenant_id = public.current_tenant_id() FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Sản phẩm % không tồn tại trong hệ thống', v_delta->>'productId';
      END IF;
      IF v_product.has_lots THEN
        IF v_lot_id IS NULL THEN
          RAISE EXCEPTION 'Sản phẩm "%" có quản lý lô, phải chọn lô khi bán', v_product.name
            USING ERRCODE = 'P0001';
        END IF;
        SELECT id, code, quantity INTO v_lot
        FROM public.product_lots WHERE id = v_lot_id AND product_id = v_product.id AND tenant_id = public.current_tenant_id() FOR UPDATE;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Lô % không tồn tại cho sản phẩm "%"', v_lot_id, v_product.name;
        END IF;
        v_new_qty := COALESCE(v_lot.quantity, 0) - v_deduct_qty;
        IF v_new_qty < 0 AND NOT p_allow_negative THEN
          RAISE EXCEPTION 'Tồn lô "%" của "%" không đủ (còn %, cần %)',
            v_lot.code, v_product.name, v_lot.quantity, v_deduct_qty
            USING ERRCODE = 'P0001';
        END IF;
        UPDATE public.product_lots SET quantity = v_new_qty, updated_at = NOW() WHERE id = v_lot.id AND tenant_id = public.current_tenant_id();
      ELSE
        v_new_qty := COALESCE(v_product.quantity, 0) - v_deduct_qty;
        IF v_new_qty < 0 AND NOT p_allow_negative THEN
          RAISE EXCEPTION 'Tồn kho không đủ cho "%" (còn %, cần %)',
            v_product.name, v_product.quantity, v_deduct_qty
            USING ERRCODE = 'P0001';
        END IF;
        UPDATE public.products SET quantity = v_new_qty WHERE id = v_product.id AND tenant_id = public.current_tenant_id();
      END IF;

      v_new_stock := COALESCE((SELECT quantity FROM public.products WHERE id = v_product.id AND tenant_id = public.current_tenant_id()), 0);
      v_qty_after := public.calc_qty_after_transaction(v_product.id, v_lot_id, -v_deduct_qty, public.current_tenant_id());
      PERFORM public.insert_stock_ledger_entry(
        v_posting_date, 'Sales Invoice', v_order_id, COALESCE(v_lot_id, v_product.id),
        v_product.id, v_lot_id, 'Kho Chính', -v_deduct_qty, v_qty_after, v_item_cost, v_item_cost, v_item_cost,
        'Bán hàng', FALSE, public.current_tenant_id()
      );
    END LOOP;
  END IF;

  IF jsonb_typeof(p_reward_deltas) = 'array' AND jsonb_array_length(p_reward_deltas) > 0 THEN
    FOR v_reward IN SELECT * FROM jsonb_array_elements(p_reward_deltas) LOOP
      UPDATE public.rewards
      SET redeemed_count = redeemed_count + COALESCE((v_reward->>'delta')::INTEGER, 0),
          updated_at = NOW()
      WHERE id = v_reward->>'rewardId' AND tenant_id = public.current_tenant_id();
    END LOOP;
  END IF;

  IF v_customer_id IS NOT NULL THEN
    v_add_spent := COALESCE((p_customer_update->>'addSpent')::NUMERIC, 0);
    v_add_debt  := COALESCE((p_customer_update->>'addDebt')::NUMERIC, 0);
    v_add_points := COALESCE((p_customer_update->>'addPoints')::NUMERIC, 0);

    IF v_add_spent > 0 OR v_add_debt <> 0 OR v_add_points <> 0 THEN
      UPDATE public.customers
      SET total_spent = COALESCE(total_spent, 0) + v_add_spent,
          debt = COALESCE(debt, 0) + v_add_debt,
          points = COALESCE(points, 0) + v_add_points,
          updated_at = NOW()
      WHERE id = v_customer_id AND tenant_id = public.current_tenant_id();
    END IF;

    IF v_add_debt <> 0 THEN
      PERFORM public.insert_customer_ledger_entry(
        v_customer_id, 'order', v_order_id, v_add_debt, 'Nợ từ đơn hàng', 'system', v_posting_date, public.current_tenant_id()
      );
    END IF;
  END IF;

  IF jsonb_typeof(p_point_history) = 'array' AND jsonb_array_length(p_point_history) > 0 THEN
    FOR v_ph IN SELECT * FROM jsonb_array_elements(p_point_history) LOOP
      INSERT INTO public.point_history (
        customer_id, type, amount, description, order_id, created_at, tenant_id
      ) VALUES (
        v_ph->>'customerId',
        v_ph->>'type',
        COALESCE((v_ph->>'amount')::NUMERIC, 0),
        v_ph->>'description',
        v_ph->>'orderId',
        COALESCE((v_ph->>'date')::TIMESTAMPTZ, NOW()),
        public.current_tenant_id()
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', true, 'order_id', v_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."process_checkout_tenant"("p_tenant_id" "uuid", "p_order" "jsonb", "p_items" "jsonb" DEFAULT '[]'::"jsonb", "p_deltas" "jsonb" DEFAULT '[]'::"jsonb", "p_reward_deltas" "jsonb" DEFAULT '[]'::"jsonb", "p_customer_update" "jsonb" DEFAULT NULL::"jsonb", "p_point_history" "jsonb" DEFAULT '[]'::"jsonb", "p_allow_negative" boolean DEFAULT false, "p_op_id" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_tenant          public.tenants%ROWTYPE;
  v_order_id        TEXT;
  v_customer_id     TEXT;
  v_item            JSONB;
  v_delta           JSONB;
  v_reward          JSONB;
  v_ph              JSONB;
  v_product         RECORD;
  v_reward_row      RECORD;
  v_lot             RECORD;
  v_lot_id          TEXT;
  v_deduct_qty      NUMERIC;
  v_new_qty         NUMERIC;
  v_new_stock       NUMERIC;
  v_add_spent       NUMERIC;
  v_add_debt        NUMERIC;
  v_add_points      NUMERIC;
  v_item_cost       NUMERIC;
  v_inserted_op     INTEGER;
  v_order_item_id   TEXT;
  v_idx             INTEGER;
  v_qty_after       NUMERIC;
  v_posting_date    TIMESTAMPTZ;
BEGIN
  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id is required';
  END IF;

  IF NOT public.is_tenant_writable(p_tenant_id) THEN
    RAISE EXCEPTION 'TENANT_READ_ONLY' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND OR v_tenant.status NOT IN ('active', 'trial') THEN
    RAISE EXCEPTION 'Tenant không hoạt động hoặc không tồn tại';
  END IF;

  v_order_id := p_order->>'id';
  IF v_order_id IS NULL OR v_order_id = '' THEN
    RAISE EXCEPTION 'order.id is required';
  END IF;

  v_posting_date := COALESCE((p_order->>'date')::TIMESTAMPTZ, NOW());

  IF p_op_id IS NOT NULL AND p_op_id != '' THEN
    INSERT INTO public.processed_operations (op_id, op_type, ref_id, tenant_id)
    VALUES (p_op_id, 'checkout', v_order_id, p_tenant_id)
    ON CONFLICT (op_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted_op = ROW_COUNT;
    IF v_inserted_op = 0 THEN
      RETURN jsonb_build_object('ok', true, 'order_id', v_order_id, 'skipped', true, 'reason', 'op_id already processed');
    END IF;
  END IF;

  v_customer_id := p_order->>'customerId';
  IF v_customer_id IS NULL OR v_customer_id = '' OR v_customer_id = 'guest' THEN
    v_customer_id := NULL;
  END IF;

  IF v_customer_id IS NOT NULL THEN
    PERFORM 1 FROM public.customers WHERE id = v_customer_id AND tenant_id = p_tenant_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Khách hàng không thuộc tenant này';
    END IF;
  END IF;

  IF p_op_id IS NOT NULL AND p_op_id != '' THEN
    INSERT INTO public.orders (
      id, date, customer_id, customer_name,
      total_amount, paid_amount, debt_recorded, payment_method,
      status, points_earned, points_redeemed, rewards_redeemed,
      applied_promotions, note, tenant_id
    ) VALUES (
      v_order_id, v_posting_date, v_customer_id, p_order->>'customerName',
      COALESCE((p_order->>'totalAmount')::NUMERIC, 0),
      COALESCE((p_order->>'paidAmount')::NUMERIC, 0),
      COALESCE((p_order->>'debtRecorded')::NUMERIC, 0),
      p_order->>'paymentMethod',
      COALESCE(p_order->>'status', 'completed'),
      COALESCE((p_order->>'pointsEarned')::NUMERIC, 0),
      COALESCE((p_order->>'pointsRedeemed')::NUMERIC, 0),
      COALESCE(p_order->'rewardsRedeemed', '[]'::jsonb),
      COALESCE(p_order->'appliedPromotions', '[]'::jsonb),
      p_order->>'note',
      p_tenant_id
    );
  ELSE
    INSERT INTO public.orders (
      id, date, customer_id, customer_name,
      total_amount, paid_amount, debt_recorded, payment_method,
      status, points_earned, points_redeemed, rewards_redeemed,
      applied_promotions, note, tenant_id
    ) VALUES (
      v_order_id, v_posting_date, v_customer_id, p_order->>'customerName',
      COALESCE((p_order->>'totalAmount')::NUMERIC, 0),
      COALESCE((p_order->>'paidAmount')::NUMERIC, 0),
      COALESCE((p_order->>'debtRecorded')::NUMERIC, 0),
      p_order->>'paymentMethod',
      COALESCE(p_order->>'status', 'completed'),
      COALESCE((p_order->>'pointsEarned')::NUMERIC, 0),
      COALESCE((p_order->>'pointsRedeemed')::NUMERIC, 0),
      COALESCE(p_order->'rewardsRedeemed', '[]'::jsonb),
      COALESCE(p_order->'appliedPromotions', '[]'::jsonb),
      p_order->>'note',
      p_tenant_id
    )
    ON CONFLICT (id) DO UPDATE SET
      date               = EXCLUDED.date,
      customer_id        = EXCLUDED.customer_id,
      customer_name      = EXCLUDED.customer_name,
      total_amount       = EXCLUDED.total_amount,
      paid_amount        = EXCLUDED.paid_amount,
      debt_recorded      = EXCLUDED.debt_recorded,
      payment_method     = EXCLUDED.payment_method,
      status             = EXCLUDED.status,
      points_earned      = EXCLUDED.points_earned,
      points_redeemed    = EXCLUDED.points_redeemed,
      rewards_redeemed   = EXCLUDED.rewards_redeemed,
      applied_promotions = EXCLUDED.applied_promotions,
      note               = EXCLUDED.note,
      tenant_id          = EXCLUDED.tenant_id;
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS tmp_phase7b_order_item_ids (
    idx INTEGER PRIMARY KEY,
    order_item_id TEXT
  ) ON COMMIT DROP;
  DELETE FROM tmp_phase7b_order_item_ids WHERE TRUE;

  DELETE FROM public.order_items WHERE order_id = v_order_id AND tenant_id = p_tenant_id;
  IF jsonb_typeof(p_items) = 'array' AND jsonb_array_length(p_items) > 0 THEN
    v_idx := 0;
    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
      v_idx := v_idx + 1;
      v_item_cost := COALESCE(
        (v_item->>'cost')::NUMERIC,
        CASE
          WHEN NULLIF(v_item->>'lotId', '') IS NOT NULL THEN
            (SELECT cost FROM public.product_lots WHERE id = v_item->>'lotId' AND tenant_id = p_tenant_id)
          ELSE
            (SELECT cost FROM public.products WHERE id = v_item->>'productId' AND tenant_id = p_tenant_id)
        END,
        0
      );
      INSERT INTO public.order_items (
        order_id, product_id, product_name, quantity, unit_name, price,
        lot_id, lot_code, cost, tenant_id
      ) VALUES (
        v_order_id, v_item->>'productId', v_item->>'productName',
        COALESCE((v_item->>'quantity')::NUMERIC, 0), v_item->>'unitName',
        COALESCE((v_item->>'price')::NUMERIC, 0),
        NULLIF(v_item->>'lotId', ''), NULLIF(v_item->>'lotCode', ''),
        v_item_cost, p_tenant_id
      ) RETURNING id INTO v_order_item_id;
      INSERT INTO tmp_phase7b_order_item_ids (idx, order_item_id)
      VALUES (v_idx, v_order_item_id);
    END LOOP;
  END IF;

  IF jsonb_typeof(p_deltas) = 'array' AND jsonb_array_length(p_deltas) > 0 THEN
    FOR v_delta IN SELECT * FROM jsonb_array_elements(p_deltas) LOOP
      v_deduct_qty := COALESCE((v_delta->>'deductBaseQty')::NUMERIC, 0);
      v_lot_id     := NULLIF(v_delta->>'lotId', '');
      IF v_deduct_qty <= 0 THEN CONTINUE; END IF;
      SELECT id, name, quantity, has_lots INTO v_product
      FROM public.products WHERE id = v_delta->>'productId' AND tenant_id = p_tenant_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Sản phẩm % không tồn tại trong hệ thống', v_delta->>'productId';
      END IF;
      IF v_product.has_lots THEN
        IF v_lot_id IS NULL THEN
          RAISE EXCEPTION 'Sản phẩm "%" có quản lý lô, phải chọn lô khi bán', v_product.name
            USING ERRCODE = 'P0001';
        END IF;
        SELECT id, code, quantity INTO v_lot
        FROM public.product_lots WHERE id = v_lot_id AND product_id = v_product.id AND tenant_id = p_tenant_id FOR UPDATE;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Lô % không tồn tại cho sản phẩm "%"', v_lot_id, v_product.name;
        END IF;
        v_new_qty := COALESCE(v_lot.quantity, 0) - v_deduct_qty;
        IF v_new_qty < 0 AND NOT p_allow_negative THEN
          RAISE EXCEPTION 'Tồn lô "%" của "%" không đủ (còn %, cần %)',
            v_lot.code, v_product.name, v_lot.quantity, v_deduct_qty
            USING ERRCODE = 'P0001';
        END IF;
        UPDATE public.product_lots SET quantity = v_new_qty, updated_at = NOW() WHERE id = v_lot.id AND tenant_id = p_tenant_id;
      ELSE
        v_new_qty := COALESCE(v_product.quantity, 0) - v_deduct_qty;
        IF v_new_qty < 0 AND NOT p_allow_negative THEN
          RAISE EXCEPTION 'Tồn kho không đủ cho "%" (còn %, cần %)',
            v_product.name, v_product.quantity, v_deduct_qty
            USING ERRCODE = 'P0001';
        END IF;
        UPDATE public.products SET quantity = v_new_qty WHERE id = v_product.id AND tenant_id = p_tenant_id;
      END IF;

      v_new_stock := COALESCE((SELECT quantity FROM public.products WHERE id = v_product.id AND tenant_id = p_tenant_id), 0);
      v_qty_after := public.calc_qty_after_transaction(v_product.id, v_lot_id, -v_deduct_qty, p_tenant_id);
      PERFORM public.insert_stock_ledger_entry(
        v_posting_date, 'Sales Invoice', v_order_id, COALESCE(v_lot_id, v_product.id),
        v_product.id, v_lot_id, 'Kho Chính', -v_deduct_qty, v_qty_after, v_item_cost, v_item_cost, v_item_cost,
        'Bán hàng', FALSE, p_tenant_id
      );
    END LOOP;
  END IF;

  IF jsonb_typeof(p_reward_deltas) = 'array' AND jsonb_array_length(p_reward_deltas) > 0 THEN
    FOR v_reward IN SELECT * FROM jsonb_array_elements(p_reward_deltas) LOOP
      UPDATE public.rewards
      SET redeemed_count = redeemed_count + COALESCE((v_reward->>'delta')::INTEGER, 0),
          updated_at = NOW()
      WHERE id = v_reward->>'rewardId' AND tenant_id = p_tenant_id;
    END LOOP;
  END IF;

  IF v_customer_id IS NOT NULL THEN
    v_add_spent := COALESCE((p_customer_update->>'addSpent')::NUMERIC, 0);
    v_add_debt  := COALESCE((p_customer_update->>'addDebt')::NUMERIC, 0);
    v_add_points := COALESCE((p_customer_update->>'addPoints')::NUMERIC, 0);

    IF v_add_spent > 0 OR v_add_debt <> 0 OR v_add_points <> 0 THEN
      UPDATE public.customers
      SET total_spent = COALESCE(total_spent, 0) + v_add_spent,
          debt = COALESCE(debt, 0) + v_add_debt,
          points = COALESCE(points, 0) + v_add_points,
          updated_at = NOW()
      WHERE id = v_customer_id AND tenant_id = p_tenant_id;
    END IF;

    IF v_add_debt <> 0 THEN
      PERFORM public.insert_customer_ledger_entry(
        v_customer_id, 'order', v_order_id, v_add_debt, 'Nợ từ đơn hàng', 'system', v_posting_date, p_tenant_id
      );
    END IF;
  END IF;

  IF jsonb_typeof(p_point_history) = 'array' AND jsonb_array_length(p_point_history) > 0 THEN
    FOR v_ph IN SELECT * FROM jsonb_array_elements(p_point_history) LOOP
      INSERT INTO public.point_history (
        customer_id, type, amount, description, order_id, created_at, tenant_id
      ) VALUES (
        v_ph->>'customerId',
        v_ph->>'type',
        COALESCE((v_ph->>'amount')::NUMERIC, 0),
        v_ph->>'description',
        v_ph->>'orderId',
        COALESCE((v_ph->>'date')::TIMESTAMPTZ, NOW()),
        p_tenant_id
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', true, 'order_id', v_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."process_import_v2"("p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_receipt_id       TEXT;
  v_invoice_number   TEXT;
  v_date             TIMESTAMPTZ;
  v_supplier_id      TEXT;
  v_supplier_name    TEXT;
  v_total_cost       NUMERIC;
  v_shipping_cost    NUMERIC;
  v_discount_total   NUMERIC;
  v_paid_amount      NUMERIC;
  v_debt_recorded    NUMERIC;
  v_status           TEXT;
  v_note             TEXT;
  v_items            JSONB;

  v_item             RECORD;
  v_existing_qty     NUMERIC;
  v_existing_cost    NUMERIC;
  v_has_lots         BOOLEAN;
  v_discount         NUMERIC;
  v_line_net         NUMERIC;
  v_adjusted_cost    NUMERIC;
  v_new_qty          NUMERIC;
  v_new_cost         NUMERIC;
  v_total_value      NUMERIC := 0;
  v_shipping_factor  NUMERIC;
  v_clean_lot_code   TEXT;
  v_clean_expiry     DATE;
  v_lot_id           TEXT;
  v_existing_status  TEXT;

  v_existing_lot_qty  NUMERIC;
  v_existing_lot_cost NUMERIC;
  v_new_lot_qty       NUMERIC;
  v_new_lot_cost      NUMERIC;

  v_affected_products TEXT[] := ARRAY[]::TEXT[];
  v_total_added_qty   NUMERIC := 0;

  v_import_item_id    TEXT;
  v_ledger_lot_id    TEXT;
  v_qty_after         NUMERIC;
BEGIN
  v_receipt_id     := p_payload->>'id';
  v_invoice_number := p_payload->>'invoice_number';
  v_date           := COALESCE((p_payload->>'date')::TIMESTAMPTZ, NOW());
  v_supplier_id    := p_payload->>'supplier_id';
  v_supplier_name  := p_payload->>'supplier_name';
  v_total_cost     := COALESCE((p_payload->>'total_cost')::NUMERIC, 0);
  v_shipping_cost  := COALESCE((p_payload->>'shipping_cost')::NUMERIC, 0);
  v_discount_total := COALESCE((p_payload->>'discount_total')::NUMERIC, 0);
  v_paid_amount    := COALESCE((p_payload->>'paid_amount')::NUMERIC, 0);
  v_debt_recorded  := COALESCE((p_payload->>'debt_recorded')::NUMERIC, 0);
  v_status         := COALESCE(p_payload->>'status', 'completed');
  v_note           := p_payload->>'note';
  v_items          := p_payload->'items';

  IF v_receipt_id IS NULL OR v_receipt_id = '' THEN
    RAISE EXCEPTION 'Mã phiếu nhập hàng không được để trống';
  END IF;

  IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Danh sách sản phẩm nhập không được để trống';
  END IF;

  SELECT status INTO v_existing_status FROM import_receipts WHERE id = v_receipt_id FOR UPDATE;
  IF FOUND THEN
    IF v_existing_status = 'completed' THEN
      RAISE EXCEPTION 'Phiếu nhập % đã hoàn thành trước đó, không thể ghi đè.', v_receipt_id;
    ELSIF v_existing_status = 'draft' THEN
      DELETE FROM import_items WHERE receipt_id = v_receipt_id;
      DELETE FROM import_receipts WHERE id = v_receipt_id;
    END IF;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(v_items) AS x(
    product_id TEXT, quantity NUMERIC, cost NUMERIC, discount NUMERIC
  ) LOOP
    v_total_value := v_total_value + GREATEST(
      0,
      (COALESCE(v_item.quantity, 0) * COALESCE(v_item.cost, 0)) - COALESCE(v_item.discount, 0)
    );
  END LOOP;

  v_shipping_factor := CASE WHEN v_total_value > 0 THEN v_shipping_cost / v_total_value ELSE 0 END;

  INSERT INTO import_receipts (
    id, invoice_number, date, supplier_id, supplier_name,
    total_cost, shipping_cost, discount_total, paid_amount, debt_recorded, status, note
  ) VALUES (
    v_receipt_id, v_invoice_number, v_date, v_supplier_id, v_supplier_name,
    v_total_cost, v_shipping_cost, v_discount_total, v_paid_amount, v_debt_recorded, v_status, v_note
  );

  FOR v_item IN SELECT * FROM jsonb_to_recordset(v_items) AS x(
    product_id TEXT, product_name TEXT, quantity NUMERIC, cost NUMERIC, discount NUMERIC, lot_code TEXT, expiry_date TEXT
  ) LOOP
    v_discount := COALESCE(v_item.discount, 0);
    v_line_net := CASE
      WHEN COALESCE(v_item.quantity, 0) > 0 THEN
        GREATEST(0, (COALESCE(v_item.cost, 0) * v_item.quantity) - v_discount) / v_item.quantity
      ELSE 0
    END;
    v_adjusted_cost := ROUND(v_line_net * (1 + v_shipping_factor), 2);

    SELECT quantity, COALESCE(cost, 0), COALESCE(has_lots, FALSE)
    INTO v_existing_qty, v_existing_cost, v_has_lots
    FROM products WHERE id = v_item.product_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Sản phẩm % không tồn tại trong hệ thống', v_item.product_id;
    END IF;

    INSERT INTO import_items (
      id, receipt_id, product_id, product_name, quantity, cost, discount, adjusted_cost, lot_code, expiry_date
    ) VALUES (
      gen_random_uuid(), v_receipt_id, v_item.product_id, v_item.product_name, v_item.quantity, v_item.cost, v_discount,
      v_adjusted_cost, v_item.lot_code,
      CASE WHEN v_item.expiry_date IS NOT NULL AND v_item.expiry_date != '' THEN (v_item.expiry_date)::TIMESTAMPTZ ELSE NULL END
    ) RETURNING id INTO v_import_item_id;

    IF v_status = 'completed' THEN
      v_new_qty := v_existing_qty + v_item.quantity;

      v_new_cost := CASE
        WHEN v_new_qty > 0 THEN ROUND(((v_existing_qty * v_existing_cost) + (v_item.quantity * v_adjusted_cost)) / v_new_qty, 2)
        ELSE v_adjusted_cost
      END;

      UPDATE products
      SET quantity = v_new_qty, cost = v_new_cost
      WHERE id = v_item.product_id;

      v_ledger_lot_id := NULL;

      IF v_has_lots THEN
        IF v_item.lot_code IS NULL OR TRIM(v_item.lot_code) = '' THEN
          RAISE EXCEPTION '%', format('Sản phẩm % (ID: %) đang bật quản lý lô, bắt buộc phải nhập số lô', v_item.product_name, v_item.product_id);
        END IF;

        v_clean_lot_code := TRIM(v_item.lot_code);
        v_clean_expiry := CASE WHEN v_item.expiry_date IS NOT NULL AND v_item.expiry_date != '' THEN (v_item.expiry_date)::DATE ELSE NULL END;
        v_lot_id := 'lot_' || v_item.product_id || '_' || REGEXP_REPLACE(v_clean_lot_code, '[^a-zA-Z0-9]', '_', 'g') || '_' || FLOOR(EXTRACT(EPOCH FROM NOW()))::TEXT;

        SELECT COALESCE(quantity, 0), COALESCE(cost, 0)
        INTO v_existing_lot_qty, v_existing_lot_cost
        FROM product_lots
        WHERE product_id = v_item.product_id AND code = v_clean_lot_code
        FOR UPDATE;

        v_new_lot_qty := COALESCE(v_existing_lot_qty, 0) + v_item.quantity;
        v_new_lot_cost := CASE
          WHEN v_new_lot_qty > 0 THEN ROUND(
            ((COALESCE(v_existing_lot_qty, 0) * COALESCE(v_existing_lot_cost, 0)) + (v_item.quantity * v_adjusted_cost))
            / v_new_lot_qty,
            2
          )
          ELSE v_adjusted_cost
        END;

        INSERT INTO product_lots (
          id, product_id, code, expiry_date, quantity, original_quantity, cost, created_at, updated_at
        ) VALUES (
          v_lot_id, v_item.product_id, v_clean_lot_code, v_clean_expiry, v_item.quantity, v_item.quantity, v_new_lot_cost, NOW(), NOW()
        )
        ON CONFLICT (product_id, code)
        DO UPDATE SET
          quantity = product_lots.quantity + EXCLUDED.quantity,
          cost = v_new_lot_cost,
          updated_at = NOW();

        SELECT id INTO v_ledger_lot_id
        FROM product_lots
        WHERE product_id = v_item.product_id AND code = v_clean_lot_code
        LIMIT 1;

        PERFORM sync_product_quantity_from_lots(v_item.product_id);
      END IF;

      INSERT INTO inventory_movements (
        product_id, movement_type, reference_type, reference_id, qty_before, qty_change, qty_after, lot_code, created_at
      ) VALUES (
        v_item.product_id, 'IMPORT', 'RECEIPT', v_receipt_id, v_existing_qty, v_item.quantity, v_new_qty, v_item.lot_code, NOW()
      );

      v_qty_after := public.calc_qty_after_transaction(v_item.product_id, v_ledger_lot_id, v_item.quantity);
      PERFORM insert_stock_ledger_entry(
        v_date,
        'Purchase Receipt'::TEXT,
        v_receipt_id,
        v_import_item_id,
        v_item.product_id,
        v_ledger_lot_id,
        'Kho Chính'::TEXT,
        v_item.quantity,
        v_qty_after,
        v_adjusted_cost,
        v_adjusted_cost,
        0::NUMERIC,
        NULL,
        FALSE
      );

      v_affected_products := array_append(v_affected_products, v_item.product_id);
      v_total_added_qty := v_total_added_qty + v_item.quantity;
    END IF;
  END LOOP;

  IF v_status = 'completed' AND v_debt_recorded > 0 THEN
    UPDATE suppliers SET debt = debt + v_debt_recorded WHERE id = v_supplier_id;
  END IF;

  IF v_status = 'completed' THEN
    PERFORM check_inventory_consistency(v_affected_products);
  END IF;

  RETURN jsonb_build_object(
    'receipt_id', v_receipt_id,
    'affected_products', to_jsonb(v_affected_products),
    'total_qty_added', v_total_added_qty,
    'status', v_status
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."promotion_rule_matches"("p_rule_id" "uuid", "p_tenant_id" "uuid", "p_cycle_type" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_rule public.promotion_rules%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
  v_age_days INTEGER;
  v_plan TEXT;
  v_specific_tenant_id TEXT;
  v_rule_cycle_type TEXT;
BEGIN
  SELECT * INTO v_rule FROM public.promotion_rules WHERE id = p_rule_id;
  IF NOT FOUND THEN RETURN false; END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN RETURN false; END IF;

  IF v_rule.condition_type = 'always' THEN
    RETURN true;
  END IF;

  IF v_rule.condition_type = 'tenant_age_days' THEN
    v_age_days := COALESCE((v_rule.condition_value->>'age_days')::INTEGER, 0);
    RETURN (CURRENT_DATE - v_tenant.created_at::DATE) <= v_age_days;
  END IF;

  IF v_rule.condition_type = 'plan' THEN
    v_plan := v_rule.condition_value->>'plan';
    RETURN v_tenant.plan = v_plan;
  END IF;

  IF v_rule.condition_type = 'specific_tenant' THEN
    v_specific_tenant_id := v_rule.condition_value->>'tenant_id';
    RETURN v_specific_tenant_id = p_tenant_id::TEXT;
  END IF;

  IF v_rule.condition_type = 'cycle_type' THEN
    v_rule_cycle_type := v_rule.condition_value->>'cycle_type';
    RETURN COALESCE(p_cycle_type, '') = v_rule_cycle_type;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."publish_scheduled_announcements"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_published INTEGER := 0;
BEGIN
  UPDATE public.announcements
  SET status = 'active',
      published_at = now(),
      updated_at = now()
  WHERE status = 'scheduled'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= now();

  GET DIAGNOSTICS v_published = ROW_COUNT;
  RETURN v_published;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."reconcile_customer_debt"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_report JSON;
BEGIN
  WITH diff AS (
    SELECT c.id, c.name, COALESCE(c.debt, 0) AS old_debt,
      COALESCE((SELECT SUM(amount) FROM public.customer_payment_ledger WHERE customer_id = c.id), 0) AS ledger_sum
    FROM customers c WHERE COALESCE(c.debt, 0) != 0
      OR EXISTS (SELECT 1 FROM public.customer_payment_ledger WHERE customer_id = c.id)
  )
  SELECT COALESCE(json_agg(row_to_json(d) ORDER BY d.id), '[]'::json) INTO v_report
  FROM diff d WHERE d.old_debt != d.ledger_sum;
  UPDATE customers c SET debt = COALESCE((SELECT SUM(amount) FROM public.customer_payment_ledger WHERE customer_id = c.id), 0), updated_at = NOW()
  WHERE EXISTS (SELECT 1 FROM public.customer_payment_ledger WHERE customer_id = c.id);
  RETURN json_build_object('ok', true, 'message', 'Reconcile KH xong', 'mismatched_before', v_report);
END; $$;

CREATE OR REPLACE FUNCTION "public"."reconcile_supplier_debt"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_report JSON;
BEGIN
  WITH diff AS (
    SELECT s.id, s.name, COALESCE(s.debt, 0) AS old_debt,
      COALESCE((SELECT SUM(amount) FROM public.supplier_payment_ledger WHERE supplier_id = s.id), 0) AS ledger_sum
    FROM suppliers s WHERE COALESCE(s.debt, 0) != 0
      OR EXISTS (SELECT 1 FROM public.supplier_payment_ledger WHERE supplier_id = s.id)
  )
  SELECT COALESCE(json_agg(row_to_json(d) ORDER BY d.id), '[]'::json) INTO v_report
  FROM diff d WHERE d.old_debt != d.ledger_sum;
  UPDATE suppliers s SET debt = COALESCE((SELECT SUM(amount) FROM public.supplier_payment_ledger WHERE supplier_id = s.id), 0), updated_at = NOW()
  WHERE EXISTS (SELECT 1 FROM public.supplier_payment_ledger WHERE supplier_id = s.id);
  RETURN json_build_object('ok', true, 'message', 'Reconcile NCC xong', 'mismatched_before', v_report);
END; $$;

CREATE OR REPLACE FUNCTION "public"."record_admin_login"("p_user_id" "uuid", "p_email" "text" DEFAULT NULL::"text", "p_ip_address" "text" DEFAULT NULL::"text", "p_user_agent" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT 'success'::"text", "p_failure_reason" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID := p_user_id;
  v_email TEXT := NULLIF(LOWER(TRIM(p_email)), '');
  v_ip INET;
BEGIN
  IF p_status NOT IN ('success', 'failed') THEN
    RAISE EXCEPTION 'status phải là success hoặc failed';
  END IF;

  -- Thử parse IP; nếu không hợp lệ thì để NULL.
  BEGIN
    v_ip := NULLIF(TRIM(p_ip_address), '')::INET;
  EXCEPTION WHEN invalid_text_representation THEN
    v_ip := NULL;
  END;

  -- Với failed và có email nhưng chưa có user_id, tìm system admin qua email.
  IF p_status = 'failed' AND v_user_id IS NULL AND v_email IS NOT NULL THEN
    SELECT au.id INTO v_user_id
    FROM auth.users au
    JOIN public.system_admins sa ON sa.user_id = au.id
    WHERE au.email = v_email
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Với success, chỉ ghi nếu thực sự là system admin.
  IF p_status = 'success' AND NOT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = v_user_id) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.admin_login_history (user_id, email, ip_address, user_agent, status, failure_reason)
  VALUES (v_user_id, v_email, v_ip, NULLIF(TRIM(p_user_agent), ''), p_status, NULLIF(TRIM(p_failure_reason), ''))
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."record_terms_acceptance"("p_user_id" "uuid", "p_tenant_id" "uuid" DEFAULT NULL::"uuid", "p_terms_version" "text" DEFAULT '1.0'::"text", "p_terms_type" "text" DEFAULT 'tos'::"text", "p_ip_address" "text" DEFAULT NULL::"text", "p_user_agent" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_id UUID;
  v_ip INET;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu user_id';
  END IF;

  IF auth.uid() <> p_user_id AND NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Không được ghi nhận chấp thuận điều khoản cho người khác' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_terms_type IS NOT NULL AND p_terms_type NOT IN ('tos', 'privacy', 'gdpr', 'cookie', 'custom') THEN
    RAISE EXCEPTION 'terms_type không hợp lệ';
  END IF;

  BEGIN
    v_ip := NULLIF(TRIM(p_ip_address), '')::INET;
  EXCEPTION WHEN invalid_text_representation THEN
    v_ip := NULL;
  END;

  INSERT INTO public.terms_acceptance (
    user_id, tenant_id, terms_version, terms_type, ip_address, user_agent, metadata
  ) VALUES (
    p_user_id,
    p_tenant_id,
    COALESCE(NULLIF(TRIM(p_terms_version), ''), '1.0'),
    COALESCE(NULLIF(TRIM(p_terms_type), ''), 'tos'),
    v_ip,
    NULLIF(TRIM(p_user_agent), ''),
    COALESCE(p_metadata, '{}')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."remove_system_admin"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được xóa system admin' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Không thể tự xóa quyền system admin của chính mình';
  END IF;

  DELETE FROM public.system_admins WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy system admin: %', p_user_id;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."reset_demo_data"("p_tenant_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $_$
DECLARE
  v_table TEXT;
  v_order TEXT[];
  v_deleted INT;
  v_total INT := 0;
  v_cleared JSONB := '[]'::JSONB;
  v_protected TEXT[] := ARRAY['tenants', 'tenant_memberships', 'tenant_subscriptions', 'system_settings', 'app_audit_log', 'plans', 'system_admins'];
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được reset demo data' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu tenant_id';
  END IF;

  PERFORM id FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  -- ponytail: delete in reverse dependency order so FK constraints stay valid.
  SELECT array_agg(o.table_name ORDER BY o.depth DESC)
  INTO v_order
  FROM public.get_tenant_restore_table_order() o
  WHERE NOT (o.table_name = ANY(v_protected));

  IF v_order IS NOT NULL AND array_length(v_order, 1) IS NOT NULL THEN
    FOREACH v_table IN ARRAY v_order LOOP
      EXECUTE format('DELETE FROM public.%I WHERE tenant_id = $1', v_table)
        USING p_tenant_id;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      IF v_deleted > 0 THEN
        v_cleared := v_cleared || jsonb_build_array(jsonb_build_object('table', v_table, 'rows', v_deleted));
        v_total := v_total + v_deleted;
      END IF;
    END LOOP;
  END IF;

  -- Reset order counter so the tenant starts a fresh billing month.
  UPDATE public.tenant_subscriptions
  SET current_month_orders = 0,
      current_month_start = CURRENT_DATE,
      updated_at = now()
  WHERE tenant_id = p_tenant_id;

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'cleared', v_cleared,
    'total_rows', v_total
  );
END;
$_$;


ALTER FUNCTION "public"."reset_demo_data"("p_tenant_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_subscriptions" (
    "tenant_id" "uuid" NOT NULL,
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "max_users" integer DEFAULT 1 NOT NULL,
    "max_products" integer DEFAULT 50 NOT NULL,
    "max_orders_per_month" integer DEFAULT 300 NOT NULL,
    "current_month_orders" integer DEFAULT 0 NOT NULL,
    "current_month_start" "date" DEFAULT CURRENT_DATE NOT NULL,
    "billing_status" "text" DEFAULT 'ok'::"text",
    "expires_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tenant_subscriptions" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_monthly_order_counter"("p_tenant_id" "uuid") RETURNS "public"."tenant_subscriptions"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_sub public.tenant_subscriptions%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được reset counter' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.tenant_subscriptions
  SET current_month_orders = 0,
      current_month_start = date_trunc('month', CURRENT_DATE)::DATE,
      updated_at = now()
  WHERE tenant_id = p_tenant_id
  RETURNING * INTO v_sub;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', p_tenant_id;
  END IF;

  RETURN v_sub;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."restore_tenant_tables"("p_tenant_id" "uuid", "p_tables" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_table TEXT;
  v_order TEXT[];
  v_row JSONB;
  v_inserted INT;
  v_total_inserted INT := 0;
  v_restored JSONB := '[]'::JSONB;
  v_errors JSONB := '[]'::JSONB;
  v_backup_table_count INT;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được restore tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu tenant_id';
  END IF;

  IF p_tables IS NULL OR p_tables = '{}'::JSONB THEN
    RAISE EXCEPTION 'Dữ liệu backup trống';
  END IF;

  PERFORM id FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  SELECT COUNT(*) INTO v_backup_table_count
  FROM jsonb_object_keys(p_tables) t(table_name);

  IF v_backup_table_count = 0 THEN
    RAISE EXCEPTION 'Backup không chứa bảng nào';
  END IF;

  -- Resolve insert order; filter to tables actually present in backup.
  SELECT array_agg(o.table_name ORDER BY o.depth, o.table_name)
  INTO v_order
  FROM public.get_tenant_restore_table_order() o
  WHERE p_tables ? o.table_name;

  IF v_order IS NULL OR array_length(v_order, 1) IS NULL THEN
    RAISE EXCEPTION 'Backup không chứa bảng nào có thể restore';
  END IF;

  -- ponytail: delete existing tenant data in reverse dependency order so FK checks pass.
  FOR i IN REVERSE array_length(v_order, 1) .. 1 LOOP
    v_table := v_order[i];
    EXECUTE format('DELETE FROM public.%I WHERE tenant_id = $1', v_table)
      USING p_tenant_id;
  END LOOP;

  -- Insert backup rows in dependency order, overriding tenant_id to the target tenant.
  FOREACH v_table IN ARRAY v_order LOOP
    v_inserted := 0;

    FOR v_row IN SELECT jsonb_array_elements(p_tables -> v_table) LOOP
      v_row := jsonb_set(v_row, '{tenant_id}', to_jsonb(p_tenant_id::TEXT));

      BEGIN
        EXECUTE format(
          'INSERT INTO public.%I SELECT * FROM jsonb_populate_record(null::public.%I, $1)',
          v_table,
          v_table
        ) USING v_row;
        v_inserted := v_inserted + 1;
      EXCEPTION
        WHEN unique_violation THEN
          -- Duplicate id from a related row already inserted; skip.
          NULL;
        WHEN OTHERS THEN
          v_errors := v_errors || jsonb_build_array(jsonb_build_object(
            'table', v_table,
            'error', SQLERRM
          ));
          EXIT;
      END;
    END LOOP;

    IF v_inserted > 0 THEN
      v_restored := v_restored || jsonb_build_array(jsonb_build_object(
        'table', v_table,
        'rows', v_inserted
      ));
      v_total_inserted := v_total_inserted + v_inserted;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'restored', v_restored,
    'errors', v_errors,
    'total_rows', v_total_inserted
  );
END;
$_$;


ALTER FUNCTION "public"."restore_tenant_tables"("p_tenant_id" "uuid", "p_tables" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."retry_heavy_op_job"("p_job_id" "uuid") RETURNS "public"."heavy_ops_jobs"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_job public.heavy_ops_jobs;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Không có quyền retry job' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.heavy_ops_jobs
  SET status = 'pending', error_message = NULL, attempts = 0, updated_at = now()
  WHERE id = p_job_id AND status IN ('failed','cancelled')
  RETURNING * INTO v_job;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chỉ được retry job failed/cancelled: %', p_job_id;
  END IF;

  RETURN v_job;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."retry_webhook_delivery"("p_delivery_id" "uuid") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_row public.webhook_deliveries;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được retry webhook' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.webhook_deliveries
  SET status = 'pending',
      next_retry_at = now(),
      updated_at = now()
  WHERE id = p_delivery_id
    AND status IN ('failed','exhausted')
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy delivery có thể retry: %', p_delivery_id;
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'status', v_row.status,
    'attemptCount', v_row.attempt_count,
    'nextRetryAt', v_row.next_retry_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."revoke_tenant_api_key"("p_key_id" "uuid") RETURNS "public"."tenant_api_keys"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_row public.tenant_api_keys;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được thu hồi API key' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.tenant_api_keys
  SET status = 'revoked',
      revoked_at = now(),
      revoked_by = auth.uid(),
      updated_at = now()
  WHERE id = p_key_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy API key: %', p_key_id;
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."run_data_retention"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_config JSONB;
  v_orders_days INT;
  v_processed_days INT;
  v_rate_limit_days INT;
  v_fraud_queue_days INT;
  v_reg_events_days INT;
  v_partition_name TEXT;
  v_partition_year INT;
  v_partition_month INT;
  v_current_threshold INT;
  v_match TEXT[];
  v_archived_orders BIGINT;
  v_archived_items BIGINT;
  v_deleted_rate_limit BIGINT;
  v_deleted_processed BIGINT;
  v_deleted_fraud_queue BIGINT;
  v_deleted_reg_events BIGINT;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được chạy data retention' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT value INTO v_config FROM public.system_settings WHERE key = 'data_retention_config';

  v_orders_days := COALESCE((v_config->>'retention_days_orders')::INTEGER, 730);
  v_processed_days := COALESCE((v_config->>'retention_days_processed_operations')::INTEGER, 90);
  v_rate_limit_days := COALESCE((v_config->>'retention_days_rate_limit_logs')::INTEGER, 1);
  v_fraud_queue_days := COALESCE((v_config->>'retention_days_fraud_queue')::INTEGER, 90);
  v_reg_events_days := COALESCE((v_config->>'retention_days_registration_events')::INTEGER, 365);
  v_current_threshold := (EXTRACT(YEAR FROM now())::int - 2) * 12 + EXTRACT(MONTH FROM now())::int;

  INSERT INTO public.orders_archive
  SELECT * FROM public.orders
  WHERE created_at < now() - make_interval(days => v_orders_days)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_archived_orders = ROW_COUNT;

  INSERT INTO public.order_items_archive
  SELECT oi.* FROM public.order_items oi
  JOIN public.orders o ON oi.order_id = o.id
  WHERE o.created_at < now() - make_interval(days => v_orders_days)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_archived_items = ROW_COUNT;

  DELETE FROM public.order_items
  WHERE order_id IN (
    SELECT id FROM public.orders WHERE created_at < now() - make_interval(days => v_orders_days)
  );

  DELETE FROM public.orders
  WHERE created_at < now() - make_interval(days => v_orders_days);

  DELETE FROM public.processed_operations
  WHERE processed_at < now() - make_interval(days => v_processed_days);
  GET DIAGNOSTICS v_deleted_processed = ROW_COUNT;

  DELETE FROM public.rate_limit_logs
  WHERE created_at < now() - make_interval(days => v_rate_limit_days);
  GET DIAGNOSTICS v_deleted_rate_limit = ROW_COUNT;

  DELETE FROM public.fraud_queue
  WHERE created_at < now() - make_interval(days => v_fraud_queue_days);
  GET DIAGNOSTICS v_deleted_fraud_queue = ROW_COUNT;

  DELETE FROM public.tenant_registration_events
  WHERE created_at < now() - make_interval(days => v_reg_events_days);
  GET DIAGNOSTICS v_deleted_reg_events = ROW_COUNT;

  IF EXISTS (
    SELECT 1 FROM pg_class
    WHERE relname = 'app_audit_log_partitioned' AND relkind = 'p'
  ) THEN
    FOR v_partition_name IN
      SELECT inhrelid::regclass::text
      FROM pg_inherits
      WHERE inhparent = 'public.app_audit_log_partitioned'::regclass
    LOOP
      v_match := regexp_match(v_partition_name, '(\d{4})_(\d{2})$');
      IF v_match IS NOT NULL THEN
        v_partition_year := v_match[1]::int;
        v_partition_month := v_match[2]::int;
        IF (v_partition_year * 12 + v_partition_month) < v_current_threshold THEN
          EXECUTE format('DROP TABLE IF EXISTS %I', v_partition_name);
        END IF;
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.system_settings (key, value)
  VALUES ('data_retention_last_run', jsonb_build_object('run_at', now()))
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now(),
        updated_by = auth.uid();

  RETURN json_build_object(
    'archivedOrders', COALESCE(v_archived_orders, 0),
    'archivedItems', COALESCE(v_archived_items, 0),
    'deletedProcessedOperations', COALESCE(v_deleted_processed, 0),
    'deletedRateLimitLogs', COALESCE(v_deleted_rate_limit, 0),
    'deletedFraudQueue', COALESCE(v_deleted_fraud_queue, 0),
    'deletedRegistrationEvents', COALESCE(v_deleted_reg_events, 0)
  );
END;
$_$;


ALTER FUNCTION "public"."run_data_retention"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_fraud_detection"() RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_config JSONB;
  v_enabled BOOLEAN;
  v_ip_window_hours INT;
  v_ip_max INT;
  v_domain_window_hours INT;
  v_domain_max INT;
  v_owner_window_hours INT;
  v_owner_max INT;
  v_inserted INT := 0;
  v_updated INT := 0;
  v_rec RECORD;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được chạy fraud detection' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT value INTO v_config FROM public.system_settings WHERE key = 'fraud_detection_config';

  v_enabled := COALESCE((v_config->>'enabled')::BOOLEAN, true);
  v_ip_window_hours := COALESCE((v_config->>'ip_window_hours')::INTEGER, 24);
  v_ip_max := COALESCE((v_config->>'ip_max')::INTEGER, 5);
  v_domain_window_hours := COALESCE((v_config->>'email_domain_window_hours')::INTEGER, 24);
  v_domain_max := COALESCE((v_config->>'email_domain_max')::INTEGER, 10);
  v_owner_window_hours := COALESCE((v_config->>'owner_window_hours')::INTEGER, 24);
  v_owner_max := COALESCE((v_config->>'owner_max')::INTEGER, 20);

  IF NOT v_enabled THEN
    RETURN json_build_object('enabled', false, 'inserted', 0, 'updated', 0);
  END IF;

  -- Rule 1: nhiều tenant từ cùng IP trong khoảng thời gian.
  FOR v_rec IN
    SELECT
      e.ip_address AS target,
      COUNT(*) AS cnt,
      MIN(e.created_at) AS w_start,
      MAX(e.created_at) AS w_end
    FROM public.tenant_registration_events e
    WHERE e.created_at >= now() - make_interval(hours => v_ip_window_hours)
      AND e.ip_address IS NOT NULL
    GROUP BY e.ip_address
    HAVING COUNT(*) >= v_ip_max
  LOOP
    UPDATE public.fraud_queue
    SET event_count = v_rec.cnt,
        window_start = LEAST(window_start, v_rec.w_start),
        window_end = GREATEST(window_end, v_rec.w_end),
        details = jsonb_build_object(
          'ip_address', v_rec.target::TEXT,
          'event_count', v_rec.cnt,
          'window_hours', v_ip_window_hours
        ),
        updated_at = now()
    WHERE type = 'ip_burst'
      AND target_value = v_rec.target::TEXT
      AND status IN ('open', 'reviewing');

    IF NOT FOUND THEN
      INSERT INTO public.fraud_queue (
        type, severity, target_value, event_count, window_start, window_end, details
      ) VALUES (
        'ip_burst', 'high', v_rec.target::TEXT, v_rec.cnt, v_rec.w_start, v_rec.w_end,
        jsonb_build_object(
          'ip_address', v_rec.target::TEXT,
          'event_count', v_rec.cnt,
          'window_hours', v_ip_window_hours
        )
      );
      v_inserted := v_inserted + 1;
    ELSE
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  -- Rule 2: nhiều tenant dùng cùng email domain trong khoảng thời gian.
  FOR v_rec IN
    SELECT
      e.email_domain AS target,
      COUNT(*) AS cnt,
      MIN(e.created_at) AS w_start,
      MAX(e.created_at) AS w_end
    FROM public.tenant_registration_events e
    WHERE e.created_at >= now() - make_interval(hours => v_domain_window_hours)
      AND e.email_domain IS NOT NULL
      AND e.email_domain <> ''
    GROUP BY e.email_domain
    HAVING COUNT(*) >= v_domain_max
  LOOP
    UPDATE public.fraud_queue
    SET event_count = v_rec.cnt,
        window_start = LEAST(window_start, v_rec.w_start),
        window_end = GREATEST(window_end, v_rec.w_end),
        details = jsonb_build_object(
          'email_domain', v_rec.target,
          'event_count', v_rec.cnt,
          'window_hours', v_domain_window_hours
        ),
        updated_at = now()
    WHERE type = 'email_domain_burst'
      AND target_value = v_rec.target
      AND status IN ('open', 'reviewing');

    IF NOT FOUND THEN
      INSERT INTO public.fraud_queue (
        type, severity, target_value, event_count, window_start, window_end, details
      ) VALUES (
        'email_domain_burst', 'medium', v_rec.target, v_rec.cnt, v_rec.w_start, v_rec.w_end,
        jsonb_build_object(
          'email_domain', v_rec.target,
          'event_count', v_rec.cnt,
          'window_hours', v_domain_window_hours
        )
      );
      v_inserted := v_inserted + 1;
    ELSE
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  -- Rule 3: cùng owner_user_id tạo nhiều tenant trong khoảng thời gian.
  FOR v_rec IN
    SELECT
      e.owner_user_id::TEXT AS target,
      COUNT(*) AS cnt,
      MIN(e.created_at) AS w_start,
      MAX(e.created_at) AS w_end
    FROM public.tenant_registration_events e
    WHERE e.created_at >= now() - make_interval(hours => v_owner_window_hours)
      AND e.owner_user_id IS NOT NULL
    GROUP BY e.owner_user_id
    HAVING COUNT(*) >= v_owner_max
  LOOP
    UPDATE public.fraud_queue
    SET event_count = v_rec.cnt,
        window_start = LEAST(window_start, v_rec.w_start),
        window_end = GREATEST(window_end, v_rec.w_end),
        details = jsonb_build_object(
          'owner_user_id', v_rec.target,
          'event_count', v_rec.cnt,
          'window_hours', v_owner_window_hours
        ),
        updated_at = now()
    WHERE type = 'owner_burst'
      AND target_value = v_rec.target
      AND status IN ('open', 'reviewing');

    IF NOT FOUND THEN
      INSERT INTO public.fraud_queue (
        type, severity, target_value, event_count, window_start, window_end, details
      ) VALUES (
        'owner_burst', 'low', v_rec.target, v_rec.cnt, v_rec.w_start, v_rec.w_end,
        jsonb_build_object(
          'owner_user_id', v_rec.target,
          'event_count', v_rec.cnt,
          'window_hours', v_owner_window_hours
        )
      );
      v_inserted := v_inserted + 1;
    ELSE
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  RETURN json_build_object('enabled', true, 'inserted', v_inserted, 'updated', v_updated);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."search_customers_rpc"("search_term" "text") RETURNS SETOF "public"."customers"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT *
  FROM customers
  WHERE 
    f_unaccent(name) ILIKE f_unaccent('%' || search_term || '%') OR
    COALESCE(phone, '') ILIKE '%' || search_term || '%' OR
    f_unaccent(COALESCE(code, '')) ILIKE f_unaccent('%' || search_term || '%')
  ORDER BY name ASC
  LIMIT 500;
$$;

CREATE OR REPLACE FUNCTION "public"."search_orders_rpc"("p_search_term" "text", "p_limit" integer DEFAULT 100) RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_result
  FROM (
    SELECT DISTINCT o.*
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE (
      p_search_term IS NULL OR p_search_term = '' OR
      f_unaccent(o.id) ILIKE f_unaccent('%' || p_search_term || '%') OR
      f_unaccent(COALESCE(o.customer_name, '')) ILIKE f_unaccent('%' || p_search_term || '%') OR
      f_unaccent(COALESCE(c.phone, '')) ILIKE f_unaccent('%' || p_search_term || '%') OR
      f_unaccent(COALESCE(oi.product_name, '')) ILIKE f_unaccent('%' || p_search_term || '%')
    )
    ORDER BY o.date DESC
    LIMIT p_limit
  ) t;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."search_products_rpc"("p_search_term" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 100) RETURNS TABLE("id" "text", "name" "text", "display_name" "text", "code" "text", "barcode" "text", "price" numeric, "cost" numeric, "quantity" numeric, "unit" "text", "location" "text", "category" "text", "brand" "text", "image" "text", "min_stock" numeric, "max_stock" numeric, "safety_stock" numeric, "is_point_accumulation_enabled" boolean, "conversion_units" "jsonb", "created_at" timestamp with time zone, "has_lots" boolean, "category_id" "text", "brand_id" "text", "product_lots" "jsonb")
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    p.id,
    p.name,
    p.display_name,
    p.sku,
    p.barcode,
    p.price,
    p.cost,
    p.quantity,
    p.unit,
    p.location,
    p.category,
    p.brand,
    p.image,
    p.min_stock,
    p.max_stock,
    p.safety_stock,
    p.is_point_accumulation_enabled,
    p.conversion_units,
    p.created_at,
    p.has_lots,
    p.category_id,
    p.brand_id,
    COALESCE(
      jsonb_agg(to_jsonb(pl.*) ORDER BY pl.expiry_date ASC, pl.created_at ASC)
      FILTER (WHERE pl.id IS NOT NULL),
      '[]'::jsonb
    ) AS product_lots
  FROM products p
  LEFT JOIN product_lots pl ON pl.product_id = p.id
  WHERE (
    p_search_term IS NULL OR p_search_term = '' OR
    f_unaccent(p.name) ILIKE f_unaccent('%' || p_search_term || '%') OR
    f_unaccent(COALESCE(p.sku, '')) ILIKE f_unaccent('%' || p_search_term || '%') OR
    COALESCE(p.barcode, '') ILIKE '%' || p_search_term || '%'
  )
  GROUP BY p.id
  ORDER BY p.name ASC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION "public"."search_suppliers_rpc"("p_search_term" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 100) RETURNS SETOF "public"."suppliers"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT *
  FROM suppliers
  WHERE (
    p_search_term IS NULL OR p_search_term = '' OR
    f_unaccent(name) ILIKE f_unaccent('%' || p_search_term || '%') OR
    f_unaccent(COALESCE(code, '')) ILIKE f_unaccent('%' || p_search_term || '%') OR
    COALESCE(phone, '') ILIKE '%' || p_search_term || '%'
  )
  ORDER BY name ASC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION "public"."search_tenants"("p_search_term" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text", "p_plan" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20) RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_offset int;
  v_total int;
  v_active int;
  v_suspended int;
  v_trial int;
  v_pending int;
  v_archived int;
  v_free int;
  v_vip int;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được tìm kiếm tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_offset := (COALESCE(p_page, 1) - 1) * COALESCE(p_page_size, 20);

  SELECT COUNT(*) INTO v_total
  FROM public.tenants
  WHERE (p_status IS NULL OR status = p_status)
    AND (p_plan IS NULL OR plan = p_plan)
    AND (p_search_term IS NULL OR p_search_term = '' OR
         f_unaccent(name) ILIKE f_unaccent('%' || p_search_term || '%') OR
         subdomain ILIKE '%' || p_search_term || '%');

  SELECT
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status = 'suspended'),
    COUNT(*) FILTER (WHERE status = 'trial'),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'archived'),
    COUNT(*) FILTER (WHERE plan = 'free'),
    COUNT(*) FILTER (WHERE plan = 'vip')
  INTO v_active, v_suspended, v_trial, v_pending, v_archived, v_free, v_vip
  FROM public.tenants
  WHERE (p_search_term IS NULL OR p_search_term = '' OR
         f_unaccent(name) ILIKE f_unaccent('%' || p_search_term || '%') OR
         subdomain ILIKE '%' || p_search_term || '%');

  v_result := (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT *
      FROM public.tenants
      WHERE (p_status IS NULL OR status = p_status)
        AND (p_plan IS NULL OR plan = p_plan)
        AND (p_search_term IS NULL OR p_search_term = '' OR
             f_unaccent(name) ILIKE f_unaccent('%' || p_search_term || '%') OR
             subdomain ILIKE '%' || p_search_term || '%')
      ORDER BY created_at DESC
      LIMIT p_page_size
      OFFSET v_offset
    ) t
  );

  RETURN json_build_object(
    'tenants', v_result,
    'totalCount', v_total,
    'counts', json_build_object(
      'active', COALESCE(v_active, 0),
      'suspended', COALESCE(v_suspended, 0),
      'trial', COALESCE(v_trial, 0),
      'pending', COALESCE(v_pending, 0),
      'archived', COALESCE(v_archived, 0),
      'free', COALESCE(v_free, 0),
      'vip', COALESCE(v_vip, 0)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."send_billing_reminders"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_config JSONB;
  v_url TEXT;
  v_key TEXT;
  v_rec RECORD;
  v_body JSONB;
  v_sent INT := 0;
  v_skipped INT := 0;
  v_error TEXT;
BEGIN
  v_config := public.get_billing_reminder_config();
  v_url := COALESCE(v_config->>'function_url', '');
  v_key := COALESCE(v_config->>'reminder_secret', '');

  IF NOT (v_config->>'enabled')::BOOLEAN THEN
    RETURN jsonb_build_object('sent', 0, 'skipped', 0, 'error', 'reminder disabled');
  END IF;

  IF v_url = '' OR v_key = '' THEN
    RETURN jsonb_build_object('sent', 0, 'skipped', 0, 'error', 'function_url hoặc reminder_secret chưa được cấu hình');
  END IF;

  BEGIN
    FOR v_rec IN SELECT * FROM public.get_pending_billing_reminders()
    LOOP
      BEGIN
        INSERT INTO public.invoice_reminder_logs (invoice_id, milestone, due_date, status)
        VALUES (v_rec.invoice_id, v_rec.milestone, v_rec.due_date, 'pending');

        v_body := jsonb_build_object(
          'invoice_id', v_rec.invoice_id,
          'type', 'reminder',
          'milestone', v_rec.milestone
        );

        PERFORM net.http_post(
          url := v_url,
          body := v_body,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'X-Internal-Secret', v_key
          ),
          timeout_milliseconds := 10000
        );

        v_sent := v_sent + 1;
      EXCEPTION WHEN OTHERS THEN
        UPDATE public.invoice_reminder_logs
        SET status = 'failed', error = SQLERRM
        WHERE invoice_id = v_rec.invoice_id AND milestone = v_rec.milestone;
        v_skipped := v_skipped + 1;
      END;
    END LOOP;

    PERFORM public.log_billing_job(
      'send_billing_reminders',
      'success',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      v_sent,
      format('Đã lập lịch %s reminder, bỏ qua %s', v_sent, v_skipped),
      jsonb_build_object('sent', v_sent, 'skipped', v_skipped)
    );

    RETURN jsonb_build_object('sent', v_sent, 'skipped', v_skipped, 'error', NULL);
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    PERFORM public.log_billing_job(
      'send_billing_reminders',
      'failed',
      FLOOR(EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::INTEGER,
      0,
      v_error,
      jsonb_build_object('error', v_error)
    );
    RETURN jsonb_build_object('sent', v_sent, 'skipped', v_skipped, 'error', v_error);
  END;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."send_in_app_message"("p_tenant_id" "uuid", "p_title" "text", "p_content" "text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "public"."notification_logs"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_row public.notification_logs;
BEGIN
  INSERT INTO public.notification_logs (
    tenant_id,
    channel,
    title,
    content,
    status,
    metadata,
    sent_by
  ) VALUES (
    p_tenant_id,
    'in_app',
    p_title,
    p_content,
    'sent',
    p_metadata,
    auth.uid()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."set_billing_reminder_config"("p_enabled" boolean, "p_milestones" integer[], "p_send_time" "text" DEFAULT '09:00'::"text", "p_function_url" "text" DEFAULT ''::"text", "p_reminder_secret" "text" DEFAULT ''::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_value JSONB;
  v_milestones INT[];
BEGIN
  -- Validate milestones: positive days, deduplicate, sorted, non-empty.
  v_milestones := ARRAY(SELECT DISTINCT unnest(p_milestones) ORDER BY 1);
  IF array_length(v_milestones, 1) IS NULL OR array_length(v_milestones, 1) = 0 OR EXISTS (SELECT 1 FROM unnest(v_milestones) x WHERE x <= 0) THEN
    RAISE EXCEPTION 'milestones phải là mảng số nguyên dương không rỗng';
  END IF;

  v_value := jsonb_build_object(
    'enabled', p_enabled,
    'milestones', to_jsonb(v_milestones),
    'send_time', COALESCE(p_send_time, '09:00'),
    'function_url', COALESCE(p_function_url, ''),
    'reminder_secret', COALESCE(p_reminder_secret, '')
  );

  INSERT INTO public.system_settings (key, value)
  VALUES ('billing_reminder_config', v_value)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

  RETURN v_value;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."set_data_retention_config"("p_retention_days_orders" integer DEFAULT 730, "p_retention_days_processed_operations" integer DEFAULT 90, "p_retention_days_rate_limit_logs" integer DEFAULT 1, "p_retention_days_fraud_queue" integer DEFAULT 90, "p_retention_days_registration_events" integer DEFAULT 365, "p_cron_schedule" "text" DEFAULT '0 3 * * *'::"text") RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_config JSONB;
  v_cron_value JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật cấu hình data retention' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_retention_days_orders < 1
    OR p_retention_days_processed_operations < 1
    OR p_retention_days_rate_limit_logs < 1
    OR p_retention_days_fraud_queue < 1
    OR p_retention_days_registration_events < 1 THEN
    RAISE EXCEPTION 'Số ngày retention phải >= 1';
  END IF;

  IF p_cron_schedule IS NULL OR TRIM(p_cron_schedule) = '' THEN
    RAISE EXCEPTION 'Lịch cron không được để trống';
  END IF;

  v_config := jsonb_build_object(
    'retention_days_orders', p_retention_days_orders,
    'retention_days_processed_operations', p_retention_days_processed_operations,
    'retention_days_rate_limit_logs', p_retention_days_rate_limit_logs,
    'retention_days_fraud_queue', p_retention_days_fraud_queue,
    'retention_days_registration_events', p_retention_days_registration_events,
    'cron_schedule', TRIM(p_cron_schedule)
  );

  INSERT INTO public.system_settings (key, value)
  VALUES ('data_retention_config', v_config)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now(),
        updated_by = auth.uid()
  RETURNING value INTO v_config;

  -- Đồng bộ lịch cron sang setting cũ để dashboard hiện tại vẫn đọc đúng.
  v_cron_value := jsonb_build_object('schedule', TRIM(p_cron_schedule), 'description', 'Hàng ngày');
  INSERT INTO public.system_settings (key, value)
  VALUES ('data_retention_cron', v_cron_value)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now(),
        updated_by = auth.uid();

  -- ponytail: reschedule cron nếu extension có sẵn; nếu không thì bỏ qua.
  BEGIN
    PERFORM cron.schedule('data-retention-daily', TRIM(p_cron_schedule), 'SELECT public.run_data_retention();');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN public.get_data_retention_config();
END;
$$;

CREATE OR REPLACE FUNCTION "public"."set_default_plan_limits"("p_plan" "text", "p_max_users" integer, "p_max_products" integer, "p_max_orders_per_month" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_value JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật giới hạn mặc định' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT public.is_valid_plan(p_plan) THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', p_plan;
  END IF;

  IF p_max_users <= 0 OR p_max_products <= 0 OR p_max_orders_per_month <= 0 THEN
    RAISE EXCEPTION 'Giới hạn phải lớn hơn 0';
  END IF;

  UPDATE public.plans
  SET max_users = p_max_users,
      max_products = p_max_products,
      max_orders_per_month = p_max_orders_per_month,
      updated_at = now()
  WHERE key = p_plan
  RETURNING jsonb_build_object(
    'max_users', max_users,
    'max_products', max_products,
    'max_orders_per_month', max_orders_per_month
  ) INTO v_value;

  RETURN v_value;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."set_fraud_detection_config"("p_enabled" boolean DEFAULT true, "p_ip_window_hours" integer DEFAULT 24, "p_ip_max" integer DEFAULT 5, "p_email_domain_window_hours" integer DEFAULT 24, "p_email_domain_max" integer DEFAULT 10, "p_owner_window_hours" integer DEFAULT 24, "p_owner_max" integer DEFAULT 20) RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_config JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật cấu hình fraud detection' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_ip_window_hours <= 0 OR p_email_domain_window_hours <= 0 OR p_owner_window_hours <= 0 THEN
    RAISE EXCEPTION 'Khoảng thời gian phải lớn hơn 0';
  END IF;

  IF p_ip_max <= 0 OR p_email_domain_max <= 0 OR p_owner_max <= 0 THEN
    RAISE EXCEPTION 'Ngưỡng phải lớn hơn 0';
  END IF;

  v_config := jsonb_build_object(
    'enabled', COALESCE(p_enabled, true),
    'ip_window_hours', p_ip_window_hours,
    'ip_max', p_ip_max,
    'email_domain_window_hours', p_email_domain_window_hours,
    'email_domain_max', p_email_domain_max,
    'owner_window_hours', p_owner_window_hours,
    'owner_max', p_owner_max
  );

  INSERT INTO public.system_settings (key, value)
  VALUES ('fraud_detection_config', v_config)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now(),
        updated_by = auth.uid()
  RETURNING value INTO v_config;

  -- ponytail: reschedule cron nếu extension có sẵn; nếu không thì bỏ qua.
  BEGIN
    PERFORM cron.schedule('fraud-detection-hourly', '0 * * * *', 'SELECT public.run_fraud_detection();');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN public.get_fraud_detection_config();
END;
$$;

CREATE OR REPLACE FUNCTION "public"."set_maintenance_mode"("p_enabled" boolean, "p_message" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_value JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật maintenance mode' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_value := jsonb_build_object(
    'enabled', COALESCE(p_enabled, false),
    'message', COALESCE(p_message, '')
  );

  INSERT INTO public.system_settings (key, value)
  VALUES ('maintenance_mode', v_value)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now(),
        updated_by = auth.uid()
  RETURNING value INTO v_value;

  RETURN v_value;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."set_maintenance_windows_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."set_ticket_reply_tenant_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.support_tickets WHERE id = NEW.ticket_id;
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy ticket tương ứng' USING ERRCODE = 'foreign_key_violation';
  END IF;
  NEW.tenant_id := v_tenant_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."sync_product_quantity_from_lots"("p_product_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE products
  SET quantity = (
    SELECT COALESCE(SUM(quantity), 0)
    FROM product_lots
    WHERE product_id = p_product_id
  )
  WHERE id = p_product_id AND has_lots = TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."trg_auto_map_product_brand"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE products
  SET brand_id = NEW.id
  WHERE brand_id IS NULL
    AND brand IS NOT NULL
    AND LOWER(TRIM(brand)) = LOWER(TRIM(NEW.name));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."trg_auto_map_product_category"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE products
  SET category_id = NEW.id
  WHERE category_id IS NULL
    AND category IS NOT NULL
    AND LOWER(TRIM(category)) = LOWER(TRIM(NEW.name));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."trg_cascade_product_brand"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Nếu đổi tên thương hiệu chính, cập nhật lại chuỗi văn bản thương hiệu trên sản phẩm
    UPDATE products
    SET brand = NEW.name
    WHERE brand_id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Nếu xóa thương hiệu, gỡ liên kết khóa ngoại và chuỗi văn bản trên sản phẩm
    UPDATE products
    SET brand_id = NULL, brand = NULL
    WHERE brand_id = OLD.id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."trg_cascade_product_category"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Nếu đổi tên danh mục chính, cập nhật lại chuỗi văn bản danh mục trên sản phẩm
    UPDATE products
    SET category = NEW.name
    WHERE category_id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Nếu xóa danh mục, gỡ liên kết khóa ngoại và chuỗi văn bản trên sản phẩm
    UPDATE products
    SET category_id = NULL, category = NULL
    WHERE category_id = OLD.id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."trg_stock_movements_calc_qty_after"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  IF NEW.is_cancelled = FALSE THEN
    SELECT COALESCE(SUM(actual_qty), 0) INTO v_balance
    FROM public.stock_movements
    WHERE product_id = NEW.product_id
      AND lot_id IS NOT DISTINCT FROM NEW.lot_id
      AND is_cancelled = FALSE;
    NEW.qty_after_transaction := v_balance + NEW.actual_qty;
  ELSE
    NEW.qty_after_transaction := COALESCE(NEW.qty_after_transaction, 0);
  END IF;

  NEW.balance_value := NEW.qty_after_transaction * COALESCE(NEW.valuation_rate, 0);
  NEW.stock_value   := NEW.actual_qty * COALESCE(NEW.valuation_rate, 0);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."trigger_webhook_event"("p_tenant_id" "uuid", "p_event_type" "text", "p_payload" "jsonb" DEFAULT '{}'::"jsonb", "p_idempotency_key" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_webhooks JSONB;
  v_key TEXT;
  v_result JSON;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được trigger webhook event' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_tenant_id IS NULL OR p_event_type IS NULL THEN
    RAISE EXCEPTION 'Thiếu tenant_id hoặc event_type';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(w)), '[]'::jsonb)
  INTO v_webhooks
  FROM (
    SELECT id, tenant_id, name, url, events, secret, status
    FROM public.tenant_webhooks
    WHERE tenant_id = p_tenant_id
      AND status = 'active'
      AND (
        events @> ARRAY['*']::TEXT[]
        OR events @> ARRAY[p_event_type]::TEXT[]
      )
  ) w;

  IF v_webhooks = '[]'::jsonb THEN
    RETURN json_build_object('enqueued', 0, 'deliveries', '[]'::json);
  END IF;

  v_key := COALESCE(p_idempotency_key, p_tenant_id || ':' || p_event_type || ':' || extensions.gen_random_uuid()::TEXT);

  -- Insert one delivery per active webhook using the same idempotency root + webhook_id
  WITH inserted AS (
    INSERT INTO public.webhook_deliveries (
      webhook_id, tenant_id, event_type, payload, idempotency_key, status, next_retry_at
    )
    SELECT
      (w.value->>'id')::UUID,
      p_tenant_id,
      p_event_type,
      p_payload,
      v_key || ':' || (w.value->>'id'),
      'pending',
      now()
    FROM jsonb_array_elements(v_webhooks) AS w
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id, webhook_id, idempotency_key, status
  )
  SELECT json_build_object(
    'enqueued', COUNT(*),
    'deliveries', COALESCE(json_agg(row_to_json(inserted)), '[]'::json)
  )
  INTO v_result
  FROM inserted;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_announcement_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_einvoice_config_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_einvoice_orders_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_email_template_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_fraud_queue_status"("p_id" "uuid", "p_status" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_row public.fraud_queue%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật fraud queue' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('open', 'reviewing', 'resolved', 'dismissed') THEN
    RAISE EXCEPTION 'status không hợp lệ';
  END IF;

  UPDATE public.fraud_queue
  SET status = p_status,
      notes = COALESCE(NULLIF(TRIM(p_notes), ''), notes),
      resolver_id = CASE WHEN p_status IN ('resolved', 'dismissed') THEN auth.uid() ELSE resolver_id END,
      updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy fraud queue item: %', p_id;
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'status', v_row.status,
    'notes', v_row.notes,
    'updatedAt', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_import_v2"("p_receipt_id" "text", "p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_receipt_id IS NULL OR p_receipt_id = '' THEN
    RAISE EXCEPTION 'Mã phiếu nhập cần sửa không được để trống';
  END IF;

  p_payload := jsonb_set(p_payload, '{id}', to_jsonb(p_receipt_id));

  SELECT delete_import_v2(p_receipt_id) INTO v_result;

  RETURN process_import_v2(p_payload);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_integration"("p_integration_id" "uuid", "p_partner_id" "uuid" DEFAULT NULL::"uuid", "p_name" "text" DEFAULT NULL::"text", "p_slug" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_category" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text", "p_documentation_url" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_row public.integrations;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật integration' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.integrations
  SET partner_id = COALESCE(p_partner_id, partner_id),
      name = COALESCE(trim(p_name), name),
      slug = COALESCE(NULLIF(trim(p_slug), ''), slug),
      description = COALESCE(NULLIF(trim(p_description), ''), description),
      category = COALESCE(NULLIF(trim(p_category), ''), category),
      status = COALESCE(p_status, status),
      documentation_url = COALESCE(NULLIF(trim(p_documentation_url), ''), documentation_url),
      updated_at = now()
  WHERE id = p_integration_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy integration: %', p_integration_id;
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'partnerId', v_row.partner_id,
    'name', v_row.name,
    'slug', v_row.slug,
    'description', v_row.description,
    'category', v_row.category,
    'status', v_row.status,
    'documentationUrl', v_row.documentation_url,
    'createdBy', v_row.created_by,
    'createdAt', v_row.created_at,
    'updatedAt', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_maintenance_window"("p_id" "uuid", "p_title" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_starts_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_ends_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_status" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_window public.maintenance_windows%ROWTYPE;
  v_new_starts TIMESTAMPTZ;
  v_new_ends TIMESTAMPTZ;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật maintenance window' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_window FROM public.maintenance_windows WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy maintenance window: %', p_id;
  END IF;

  IF p_title IS NOT NULL AND TRIM(p_title) = '' THEN
    RAISE EXCEPTION 'Tiêu đề không được để trống';
  END IF;

  v_new_starts := COALESCE(p_starts_at, v_window.starts_at);
  v_new_ends := COALESCE(p_ends_at, v_window.ends_at);

  IF v_new_ends <= v_new_starts THEN
    RAISE EXCEPTION 'Thời gian bảo trì không hợp lệ: ends_at phải sau starts_at';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('scheduled', 'in_progress', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Trạng thái không hợp lệ: %', p_status;
  END IF;

  UPDATE public.maintenance_windows
  SET title = COALESCE(NULLIF(TRIM(p_title), ''), title),
      description = COALESCE(p_description, description),
      starts_at = v_new_starts,
      ends_at = v_new_ends,
      status = COALESCE(p_status, status)
  WHERE id = p_id
  RETURNING * INTO v_window;

  RETURN row_to_json(v_window);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_notification_log_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_partner"("p_partner_id" "uuid", "p_name" "text" DEFAULT NULL::"text", "p_slug" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_website" "text" DEFAULT NULL::"text", "p_contact_email" "text" DEFAULT NULL::"text", "p_logo_url" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_row public.partners;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật partner' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.partners
  SET name = COALESCE(trim(p_name), name),
      slug = COALESCE(NULLIF(trim(p_slug), ''), slug),
      description = COALESCE(NULLIF(trim(p_description), ''), description),
      website = COALESCE(NULLIF(trim(p_website), ''), website),
      contact_email = COALESCE(NULLIF(trim(p_contact_email), ''), contact_email),
      logo_url = COALESCE(NULLIF(trim(p_logo_url), ''), logo_url),
      status = COALESCE(p_status, status),
      updated_at = now()
  WHERE id = p_partner_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy partner: %', p_partner_id;
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'name', v_row.name,
    'slug', v_row.slug,
    'description', v_row.description,
    'website', v_row.website,
    'contactEmail', v_row.contact_email,
    'logoUrl', v_row.logo_url,
    'status', v_row.status,
    'createdBy', v_row.created_by,
    'createdAt', v_row.created_at,
    'updatedAt', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_plan"("p_key" "text", "p_name" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_max_users" integer DEFAULT NULL::integer, "p_max_products" integer DEFAULT NULL::integer, "p_max_orders_per_month" integer DEFAULT NULL::integer, "p_monthly_price" numeric DEFAULT NULL::numeric, "p_yearly_price" numeric DEFAULT NULL::numeric, "p_is_active" boolean DEFAULT NULL::boolean) RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_plan public.plans%ROWTYPE;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật gói' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE key = p_key;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy gói: %', p_key;
  END IF;

  IF p_max_users IS NOT NULL AND p_max_users <= 0 THEN
    RAISE EXCEPTION 'Giới hạn người dùng phải lớn hơn 0';
  END IF;
  IF p_max_products IS NOT NULL AND p_max_products <= 0 THEN
    RAISE EXCEPTION 'Giới hạn sản phẩm phải lớn hơn 0';
  END IF;
  IF p_max_orders_per_month IS NOT NULL AND p_max_orders_per_month <= 0 THEN
    RAISE EXCEPTION 'Giới hạn đơn hàng phải lớn hơn 0';
  END IF;

  UPDATE public.plans
  SET name = COALESCE(p_name, name),
      description = COALESCE(p_description, description),
      max_users = COALESCE(p_max_users, max_users),
      max_products = COALESCE(p_max_products, max_products),
      max_orders_per_month = COALESCE(p_max_orders_per_month, max_orders_per_month),
      monthly_price = COALESCE(p_monthly_price, monthly_price),
      yearly_price = COALESCE(p_yearly_price, yearly_price),
      is_active = COALESCE(p_is_active, is_active),
      updated_at = now()
  WHERE key = p_key
  RETURNING * INTO v_plan;

  RETURN json_build_object(
    'key', v_plan.key,
    'name', v_plan.name,
    'description', v_plan.description,
    'max_users', v_plan.max_users,
    'max_products', v_plan.max_products,
    'max_orders_per_month', v_plan.max_orders_per_month,
    'monthly_price', v_plan.monthly_price,
    'yearly_price', v_plan.yearly_price,
    'is_active', v_plan.is_active,
    'created_at', v_plan.created_at,
    'updated_at', v_plan.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_tenant"("p_tenant_id" "uuid", "p_name" "text" DEFAULT NULL::"text", "p_plan" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text", "p_isolation_mode" "text" DEFAULT NULL::"text", "p_isolation_schema" "text" DEFAULT NULL::"text", "p_isolation_project_ref" "text" DEFAULT NULL::"text", "p_custom_domain" "text" DEFAULT NULL::"text", "p_white_label" "jsonb" DEFAULT NULL::"jsonb", "p_read_replica_url" "text" DEFAULT NULL::"text", "p_connection_pool_config" "jsonb" DEFAULT NULL::"jsonb") RETURNS "public"."tenants"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  v_tenant public.tenants;
  v_new_isolation_mode TEXT;
  v_new_plan TEXT;
  v_domain TEXT;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  IF p_name IS NOT NULL AND TRIM(p_name) = '' THEN
    RAISE EXCEPTION 'Tên cửa hàng không được để trống';
  END IF;

  IF p_plan IS NOT NULL AND NOT public.is_valid_plan(p_plan) THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', p_plan;
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('active', 'suspended', 'trial', 'pending', 'archived', 'read_only') THEN
    RAISE EXCEPTION 'Trạng thái tenant không hợp lệ: %', p_status;
  END IF;

  v_new_isolation_mode := COALESCE(p_isolation_mode, v_tenant.isolation_mode);
  IF v_new_isolation_mode IS NOT NULL AND v_new_isolation_mode NOT IN ('shared', 'schema', 'project') THEN
    RAISE EXCEPTION 'Chế độ cô lập không hợp lệ: %', v_new_isolation_mode;
  END IF;

  v_new_plan := COALESCE(p_plan, v_tenant.plan);

  -- ponytail: chỉ cho phép cô lập schema/project khi tenant là VIP.
  IF v_new_isolation_mode <> 'shared' AND v_new_plan = 'free' THEN
    RAISE EXCEPTION 'Tenant gói Free không được phép cô lập schema/project. Hãy chuyển sang VIP hoặc để shared.';
  END IF;

  IF v_new_isolation_mode = 'schema' AND COALESCE(p_isolation_schema, v_tenant.isolation_schema) IS NULL THEN
    RAISE EXCEPTION 'Chế độ schema cô lập yêu cầu tên schema (isolation_schema).';
  END IF;

  IF v_new_isolation_mode = 'project' AND COALESCE(p_isolation_project_ref, v_tenant.isolation_project_ref) IS NULL THEN
    RAISE EXCEPTION 'Chế độ project cô lập yêu cầu project ref (isolation_project_ref).';
  END IF;

  -- Validate custom domain (VIP only)
  v_domain := NULLIF(TRIM(p_custom_domain), '');
  IF v_domain IS NOT NULL THEN
    IF v_new_plan = 'free' THEN
      RAISE EXCEPTION 'Custom domain chỉ khả dụng cho tenant VIP.' USING ERRCODE = 'check_violation';
    END IF;
    IF v_domain !~ '^[a-z0-9][-a-z0-9]*(\.[-a-z0-9]+)+$' THEN
      RAISE EXCEPTION 'Tên miền không hợp lệ: %', v_domain;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.tenants
      WHERE lower(custom_domain) = lower(v_domain)
        AND id <> p_tenant_id
    ) THEN
      RAISE EXCEPTION 'Tên miền đã được sử dụng bởi tenant khác: %', v_domain;
    END IF;
  END IF;

  -- ponytail: read replica / pool config chỉ lưu metadata, không tạo replica thật ở phase YAGNI.
  IF p_read_replica_url IS NOT NULL AND TRIM(p_read_replica_url) = '' THEN
    RAISE EXCEPTION 'read_replica_url không được để trống nếu được truyền';
  END IF;

  UPDATE public.tenants
  SET name = COALESCE(NULLIF(TRIM(p_name), ''), name),
      plan = v_new_plan,
      status = COALESCE(p_status, status),
      isolation_mode = v_new_isolation_mode,
      isolation_schema = CASE
        WHEN p_isolation_mode = 'shared' THEN NULL
        ELSE COALESCE(p_isolation_schema, isolation_schema)
      END,
      isolation_project_ref = CASE
        WHEN p_isolation_mode = 'shared' THEN NULL
        ELSE COALESCE(p_isolation_project_ref, isolation_project_ref)
      END,
      custom_domain = v_domain,
      white_label = CASE
        WHEN p_white_label IS NULL THEN white_label
        ELSE p_white_label
      END,
      read_replica_url = CASE
        WHEN p_read_replica_url IS NULL THEN read_replica_url
        ELSE NULLIF(TRIM(p_read_replica_url), '')
      END,
      connection_pool_config = CASE
        WHEN p_connection_pool_config IS NULL THEN connection_pool_config
        ELSE p_connection_pool_config
      END,
      updated_at = now()
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  RETURN v_tenant;
END;
$_$;


ALTER FUNCTION "public"."update_tenant"("p_tenant_id" "uuid", "p_name" "text", "p_plan" "text", "p_status" "text", "p_isolation_mode" "text", "p_isolation_schema" "text", "p_isolation_project_ref" "text", "p_custom_domain" "text", "p_white_label" "jsonb", "p_read_replica_url" "text", "p_connection_pool_config" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_tenant_feature_flags"("p_tenant_id" "uuid", "p_features" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_features JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật feature flags' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_features IS NULL THEN
    RAISE EXCEPTION 'Feature flags không được để null';
  END IF;

  UPDATE public.tenants
  SET settings = jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{features}',
        COALESCE(settings->'features', '{}'::jsonb) || p_features
      ),
      updated_at = now()
  WHERE id = p_tenant_id
  RETURNING settings->'features' INTO v_features;

  IF v_features IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  RETURN v_features;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_tenant_status"("p_tenant_id" "uuid", "p_status" "text") RETURNS "public"."tenants"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_tenant public.tenants;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật trạng thái tenant' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('active', 'suspended', 'trial', 'pending', 'archived', 'read_only') THEN
    RAISE EXCEPTION 'Trạng thái tenant không hợp lệ: %', p_status;
  END IF;

  UPDATE public.tenants
  SET status = p_status,
      updated_at = now(),
      archived_at = CASE WHEN p_status = 'archived' THEN now() ELSE NULL END
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  RETURN v_tenant;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_tenant_subscription"("p_tenant_id" "uuid", "p_plan" "text" DEFAULT NULL::"text", "p_max_users" integer DEFAULT NULL::integer, "p_max_products" integer DEFAULT NULL::integer, "p_max_orders_per_month" integer DEFAULT NULL::integer, "p_billing_status" "text" DEFAULT NULL::"text", "p_expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "public"."tenant_subscriptions"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_sub public.tenant_subscriptions%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
  v_new_plan TEXT;
  v_new_max_users INTEGER;
  v_new_max_products INTEGER;
  v_new_max_orders INTEGER;
  v_limits JSONB;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật subscription' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tenant: %', p_tenant_id;
  END IF;

  SELECT * INTO v_sub FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy subscription cho tenant: %', p_tenant_id;
  END IF;

  v_new_plan := COALESCE(p_plan, v_sub.plan);
  IF NOT public.is_valid_plan(v_new_plan) THEN
    RAISE EXCEPTION 'Gói dịch vụ không hợp lệ: %', v_new_plan;
  END IF;

  -- ponytail: nếu đổi gói và không truyền custom limits, áp giới hạn mặc định của gói mới.
  --          Giữ custom limits hiện tại nếu user đã tự nhập.
  IF p_plan IS NOT NULL THEN
    v_limits := public.get_default_plan_limit_values(v_new_plan);
  END IF;

  v_new_max_users := COALESCE(p_max_users, CASE WHEN p_plan IS NOT NULL THEN (v_limits->>'max_users')::INTEGER ELSE v_sub.max_users END);
  v_new_max_products := COALESCE(p_max_products, CASE WHEN p_plan IS NOT NULL THEN (v_limits->>'max_products')::INTEGER ELSE v_sub.max_products END);
  v_new_max_orders := COALESCE(p_max_orders_per_month, CASE WHEN p_plan IS NOT NULL THEN (v_limits->>'max_orders_per_month')::INTEGER ELSE v_sub.max_orders_per_month END);

  IF v_new_max_users <= 0 OR v_new_max_products <= 0 OR v_new_max_orders <= 0 THEN
    RAISE EXCEPTION 'Giới hạn phải lớn hơn 0';
  END IF;

  IF p_billing_status IS NOT NULL AND p_billing_status NOT IN ('ok', 'past_due', 'suspended', 'cancelled') THEN
    RAISE EXCEPTION 'Trạng thái thanh toán không hợp lệ: %', p_billing_status;
  END IF;

  UPDATE public.tenant_subscriptions
  SET plan = v_new_plan,
      max_users = v_new_max_users,
      max_products = v_new_max_products,
      max_orders_per_month = v_new_max_orders,
      billing_status = COALESCE(p_billing_status, billing_status),
      expires_at = p_expires_at,
      updated_at = now()
  WHERE tenant_id = p_tenant_id
  RETURNING * INTO v_sub;

  UPDATE public.tenants
  SET plan = v_new_plan, updated_at = now()
  WHERE id = p_tenant_id;

  RETURN v_sub;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_tenant_webhook"("p_webhook_id" "uuid", "p_name" "text" DEFAULT NULL::"text", "p_url" "text" DEFAULT NULL::"text", "p_events" "text"[] DEFAULT NULL::"text"[], "p_secret" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_row public.tenant_webhooks;
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Chỉ system admin mới được cập nhật webhook' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.tenant_webhooks
  SET name = COALESCE(trim(p_name), name),
      url = COALESCE(trim(p_url), url),
      events = COALESCE(p_events, events),
      secret = COALESCE(p_secret, secret),
      status = COALESCE(p_status, status),
      updated_at = now()
  WHERE id = p_webhook_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy webhook: %', p_webhook_id;
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'tenantId', v_row.tenant_id,
    'name', v_row.name,
    'url', v_row.url,
    'events', v_row.events,
    'status', v_row.status,
    'createdAt', v_row.created_at,
    'updatedAt', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_ticket_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."user_tenant_role"("p_tenant_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM public.tenant_memberships
  WHERE tenant_id = p_tenant_id AND user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION "public"."validate_promo_code"("p_code" "text", "p_tenant_id" "uuid", "p_invoice_subtotal" numeric DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    SET "TimeZone" TO 'Asia/Ho_Chi_Minh'
    AS $$
DECLARE
  v_promo public.promo_codes%ROWTYPE;
  v_tenant public.tenants%ROWTYPE;
  v_total_used INTEGER;
  v_tenant_used INTEGER;
  v_conditions JSONB;
  v_age_days INTEGER;
  v_target_plan TEXT;
  v_tenant_ids JSONB;
BEGIN
  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Không tìm thấy tenant');
  END IF;

  SELECT * INTO v_promo FROM public.promo_codes WHERE code = p_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Mã voucher không tồn tại');
  END IF;

  IF NOT v_promo.is_active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Mã voucher đã bị vô hiệu hóa');
  END IF;

  IF v_promo.valid_from > CURRENT_DATE THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Mã voucher chưa có hiệu lực');
  END IF;

  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < CURRENT_DATE THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Mã voucher đã hết hạn');
  END IF;

  IF v_promo.min_invoice_amount > 0 AND p_invoice_subtotal < v_promo.min_invoice_amount THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Hóa đơn chưa đạt giá trị tối thiểu');
  END IF;

  SELECT COUNT(*) INTO v_total_used FROM public.promo_code_usages WHERE promo_code_id = v_promo.id;
  IF v_promo.max_uses_total IS NOT NULL AND v_total_used >= v_promo.max_uses_total THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Mã voucher đã hết lượt sử dụng');
  END IF;

  SELECT COUNT(*) INTO v_tenant_used
  FROM public.promo_code_usages
  WHERE promo_code_id = v_promo.id AND tenant_id = p_tenant_id;
  IF v_promo.max_uses_per_tenant IS NOT NULL AND v_tenant_used >= v_promo.max_uses_per_tenant THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Tenant đã sử dụng hết lượt voucher');
  END IF;

  -- Điều kiện đối tượng (kết hợp AND)
  v_conditions := COALESCE(v_promo.target_conditions, '{}');

  IF v_conditions ? 'tenant_age_days' THEN
    v_age_days := COALESCE((v_conditions->>'tenant_age_days')::INTEGER, 0);
    IF (CURRENT_DATE - v_tenant.created_at::DATE) > v_age_days THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Tenant không đủ điều kiện độ tuổi');
    END IF;
  END IF;

  IF v_conditions ? 'plan' THEN
    v_target_plan := v_conditions->>'plan';
    IF v_tenant.plan <> v_target_plan THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Voucher không áp dụng cho gói hiện tại');
    END IF;
  END IF;

  IF v_conditions ? 'tenant_ids' THEN
    v_tenant_ids := v_conditions->'tenant_ids';
    IF jsonb_typeof(v_tenant_ids) = 'array' AND NOT (v_tenant_ids ? p_tenant_id::TEXT) THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Tenant không nằm trong danh sách áp dụng');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'promo_code_id', v_promo.id,
    'kind', v_promo.kind,
    'discount_value', v_promo.discount_value,
    'max_discount_amount', v_promo.max_discount_amount
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."verify_2fa_backup_code"("p_user_id" "uuid", "p_code" "text") RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_hash TEXT;
  v_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_code IS NULL THEN
    RETURN json_build_object('valid', false, 'code_id', NULL);
  END IF;

  v_hash := encode(extensions.digest(upper(p_code), 'sha256'), 'hex');

  SELECT id INTO v_id
  FROM public.admin_2fa_backup_codes
  WHERE user_id = p_user_id
    AND code_hash = v_hash
    AND used_at IS NULL
  FOR UPDATE;

  IF v_id IS NULL THEN
    RETURN json_build_object('valid', false, 'code_id', NULL);
  END IF;

  UPDATE public.admin_2fa_backup_codes
  SET used_at = now()
  WHERE id = v_id;

  RETURN json_build_object('valid', true, 'code_id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."webhook_retry_schedule"("p_attempt_count" integer) RETURNS interval
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Exponential-ish backoff: 0, 5min, 15min, 1h, 4h, 12h
  RETURN CASE
    WHEN p_attempt_count <= 0 THEN '0 seconds'::INTERVAL
    WHEN p_attempt_count = 1 THEN '5 minutes'::INTERVAL
    WHEN p_attempt_count = 2 THEN '15 minutes'::INTERVAL
    WHEN p_attempt_count = 3 THEN '1 hour'::INTERVAL
    WHEN p_attempt_count = 4 THEN '4 hours'::INTERVAL
    ELSE '12 hours'::INTERVAL
  END;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."write_audit_log"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_record_id TEXT;
  v_tenant_id UUID;
BEGIN
  v_record_id := COALESCE(NEW.id::TEXT, OLD.id::TEXT);
  v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);

  INSERT INTO public.app_audit_log (tenant_id, user_id, table_name, record_id, action, old_data, new_data)
  VALUES (
    v_tenant_id,
    auth.uid(),
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN NEW;
END;
$$;

-- Grants

GRANT USAGE ON SCHEMA "public" TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "anon";

GRANT USAGE ON SCHEMA "public" TO "authenticated";

GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON TABLE "public"."system_admins" TO "anon";

GRANT ALL ON TABLE "public"."system_admins" TO "authenticated";

GRANT ALL ON TABLE "public"."system_admins" TO "service_role";

GRANT ALL ON TABLE "public"."heavy_ops_jobs" TO "anon";

GRANT ALL ON TABLE "public"."heavy_ops_jobs" TO "authenticated";

GRANT ALL ON TABLE "public"."heavy_ops_jobs" TO "service_role";

GRANT ALL ON TABLE "public"."payments" TO "anon";

GRANT ALL ON TABLE "public"."payments" TO "authenticated";

GRANT ALL ON TABLE "public"."payments" TO "service_role";

GRANT ALL ON TABLE "public"."invoices" TO "anon";

GRANT ALL ON TABLE "public"."invoices" TO "authenticated";

GRANT ALL ON TABLE "public"."invoices" TO "service_role";

GRANT ALL ON TABLE "public"."tenants" TO "anon";

GRANT ALL ON TABLE "public"."tenants" TO "authenticated";

GRANT ALL ON TABLE "public"."tenants" TO "service_role";

GRANT ALL ON TABLE "public"."billing_job_logs" TO "anon";

GRANT ALL ON TABLE "public"."billing_job_logs" TO "authenticated";

GRANT ALL ON TABLE "public"."billing_job_logs" TO "service_role";

GRANT ALL ON TABLE "public"."tenant_subscriptions" TO "anon";

GRANT ALL ON TABLE "public"."tenant_subscriptions" TO "authenticated";

GRANT ALL ON TABLE "public"."tenant_subscriptions" TO "service_role";

GRANT ALL ON TABLE "public"."tenant_api_keys" TO "anon";

GRANT ALL ON TABLE "public"."tenant_api_keys" TO "authenticated";

GRANT ALL ON TABLE "public"."tenant_api_keys" TO "service_role";

GRANT ALL ON TABLE "public"."customers" TO "anon";

GRANT ALL ON TABLE "public"."customers" TO "authenticated";

GRANT ALL ON TABLE "public"."customers" TO "service_role";

GRANT ALL ON TABLE "public"."suppliers" TO "anon";

GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";

GRANT ALL ON TABLE "public"."suppliers" TO "service_role";

GRANT ALL ON TABLE "public"."notification_logs" TO "anon";

GRANT ALL ON TABLE "public"."notification_logs" TO "authenticated";

GRANT ALL ON TABLE "public"."notification_logs" TO "service_role";

GRANT ALL ON TABLE "public"."admin_2fa_backup_codes" TO "anon";

GRANT ALL ON TABLE "public"."admin_2fa_backup_codes" TO "authenticated";

GRANT ALL ON TABLE "public"."admin_2fa_backup_codes" TO "service_role";

GRANT ALL ON TABLE "public"."admin_login_history" TO "anon";

GRANT ALL ON TABLE "public"."admin_login_history" TO "authenticated";

GRANT ALL ON TABLE "public"."admin_login_history" TO "service_role";

GRANT ALL ON TABLE "public"."announcements" TO "anon";

GRANT ALL ON TABLE "public"."announcements" TO "authenticated";

GRANT ALL ON TABLE "public"."announcements" TO "service_role";

GRANT ALL ON TABLE "public"."app_audit_log" TO "anon";

GRANT ALL ON TABLE "public"."app_audit_log" TO "authenticated";

GRANT ALL ON TABLE "public"."app_audit_log" TO "service_role";

GRANT ALL ON TABLE "public"."app_audit_log_partitioned" TO "anon";

GRANT ALL ON TABLE "public"."app_audit_log_partitioned" TO "authenticated";

GRANT ALL ON TABLE "public"."app_audit_log_partitioned" TO "service_role";

GRANT ALL ON TABLE "public"."app_settings" TO "anon";

GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";

GRANT ALL ON TABLE "public"."app_settings" TO "service_role";

GRANT ALL ON TABLE "public"."bank_accounts" TO "anon";

GRANT ALL ON TABLE "public"."bank_accounts" TO "authenticated";

GRANT ALL ON TABLE "public"."bank_accounts" TO "service_role";

GRANT ALL ON TABLE "public"."billing_email_logs" TO "anon";

GRANT ALL ON TABLE "public"."billing_email_logs" TO "authenticated";

GRANT ALL ON TABLE "public"."billing_email_logs" TO "service_role";

GRANT ALL ON TABLE "public"."brands" TO "anon";

GRANT ALL ON TABLE "public"."brands" TO "authenticated";

GRANT ALL ON TABLE "public"."brands" TO "service_role";

GRANT ALL ON TABLE "public"."categories" TO "anon";

GRANT ALL ON TABLE "public"."categories" TO "authenticated";

GRANT ALL ON TABLE "public"."categories" TO "service_role";

GRANT ALL ON TABLE "public"."customer_payment_ledger" TO "anon";

GRANT ALL ON TABLE "public"."customer_payment_ledger" TO "authenticated";

GRANT ALL ON TABLE "public"."customer_payment_ledger" TO "service_role";

GRANT ALL ON TABLE "public"."disposal_items" TO "anon";

GRANT ALL ON TABLE "public"."disposal_items" TO "authenticated";

GRANT ALL ON TABLE "public"."disposal_items" TO "service_role";

GRANT ALL ON TABLE "public"."disposals" TO "anon";

GRANT ALL ON TABLE "public"."disposals" TO "authenticated";

GRANT ALL ON TABLE "public"."disposals" TO "service_role";

GRANT ALL ON TABLE "public"."einvoice_config" TO "anon";

GRANT ALL ON TABLE "public"."einvoice_config" TO "authenticated";

GRANT ALL ON TABLE "public"."einvoice_config" TO "service_role";

GRANT ALL ON TABLE "public"."einvoice_orders" TO "anon";

GRANT ALL ON TABLE "public"."einvoice_orders" TO "authenticated";

GRANT ALL ON TABLE "public"."einvoice_orders" TO "service_role";

GRANT ALL ON TABLE "public"."email_templates" TO "anon";

GRANT ALL ON TABLE "public"."email_templates" TO "authenticated";

GRANT ALL ON TABLE "public"."email_templates" TO "service_role";

GRANT ALL ON TABLE "public"."error_logs" TO "anon";

GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";

GRANT ALL ON TABLE "public"."error_logs" TO "service_role";

GRANT ALL ON TABLE "public"."fraud_queue" TO "anon";

GRANT ALL ON TABLE "public"."fraud_queue" TO "authenticated";

GRANT ALL ON TABLE "public"."fraud_queue" TO "service_role";

GRANT ALL ON TABLE "public"."import_items" TO "anon";

GRANT ALL ON TABLE "public"."import_items" TO "authenticated";

GRANT ALL ON TABLE "public"."import_items" TO "service_role";

GRANT ALL ON TABLE "public"."import_receipts" TO "anon";

GRANT ALL ON TABLE "public"."import_receipts" TO "authenticated";

GRANT ALL ON TABLE "public"."import_receipts" TO "service_role";

GRANT ALL ON TABLE "public"."integrations" TO "anon";

GRANT ALL ON TABLE "public"."integrations" TO "authenticated";

GRANT ALL ON TABLE "public"."integrations" TO "service_role";

GRANT ALL ON TABLE "public"."inventory_count_items" TO "anon";

GRANT ALL ON TABLE "public"."inventory_count_items" TO "authenticated";

GRANT ALL ON TABLE "public"."inventory_count_items" TO "service_role";

GRANT ALL ON TABLE "public"."inventory_counts" TO "anon";

GRANT ALL ON TABLE "public"."inventory_counts" TO "authenticated";

GRANT ALL ON TABLE "public"."inventory_counts" TO "service_role";

GRANT ALL ON TABLE "public"."inventory_movements" TO "anon";

GRANT ALL ON TABLE "public"."inventory_movements" TO "authenticated";

GRANT ALL ON TABLE "public"."inventory_movements" TO "service_role";

GRANT ALL ON TABLE "public"."invoice_items" TO "anon";

GRANT ALL ON TABLE "public"."invoice_items" TO "authenticated";

GRANT ALL ON TABLE "public"."invoice_items" TO "service_role";

GRANT ALL ON TABLE "public"."invoice_number_counters" TO "anon";

GRANT ALL ON TABLE "public"."invoice_number_counters" TO "authenticated";

GRANT ALL ON TABLE "public"."invoice_number_counters" TO "service_role";

GRANT ALL ON TABLE "public"."invoice_reminder_logs" TO "anon";

GRANT ALL ON TABLE "public"."invoice_reminder_logs" TO "authenticated";

GRANT ALL ON TABLE "public"."invoice_reminder_logs" TO "service_role";

GRANT ALL ON TABLE "public"."maintenance_windows" TO "anon";

GRANT ALL ON TABLE "public"."maintenance_windows" TO "authenticated";

GRANT ALL ON TABLE "public"."maintenance_windows" TO "service_role";

GRANT ALL ON TABLE "public"."order_items" TO "anon";

GRANT ALL ON TABLE "public"."order_items" TO "authenticated";

GRANT ALL ON TABLE "public"."order_items" TO "service_role";

GRANT ALL ON TABLE "public"."order_items_archive" TO "anon";

GRANT ALL ON TABLE "public"."order_items_archive" TO "authenticated";

GRANT ALL ON TABLE "public"."order_items_archive" TO "service_role";

GRANT ALL ON TABLE "public"."orders" TO "anon";

GRANT ALL ON TABLE "public"."orders" TO "authenticated";

GRANT ALL ON TABLE "public"."orders" TO "service_role";

GRANT ALL ON TABLE "public"."orders_archive" TO "anon";

GRANT ALL ON TABLE "public"."orders_archive" TO "authenticated";

GRANT ALL ON TABLE "public"."orders_archive" TO "service_role";

GRANT ALL ON TABLE "public"."partners" TO "anon";

GRANT ALL ON TABLE "public"."partners" TO "authenticated";

GRANT ALL ON TABLE "public"."partners" TO "service_role";

GRANT ALL ON TABLE "public"."plans" TO "anon";

GRANT ALL ON TABLE "public"."plans" TO "authenticated";

GRANT ALL ON TABLE "public"."plans" TO "service_role";

GRANT ALL ON TABLE "public"."point_history" TO "anon";

GRANT ALL ON TABLE "public"."point_history" TO "authenticated";

GRANT ALL ON TABLE "public"."point_history" TO "service_role";

GRANT ALL ON TABLE "public"."processed_operations" TO "anon";

GRANT ALL ON TABLE "public"."processed_operations" TO "authenticated";

GRANT ALL ON TABLE "public"."processed_operations" TO "service_role";

GRANT ALL ON TABLE "public"."product_lots" TO "anon";

GRANT ALL ON TABLE "public"."product_lots" TO "authenticated";

GRANT ALL ON TABLE "public"."product_lots" TO "service_role";

GRANT ALL ON TABLE "public"."products" TO "anon";

GRANT ALL ON TABLE "public"."products" TO "authenticated";

GRANT ALL ON TABLE "public"."products" TO "service_role";

GRANT ALL ON TABLE "public"."promo_code_usages" TO "anon";

GRANT ALL ON TABLE "public"."promo_code_usages" TO "authenticated";

GRANT ALL ON TABLE "public"."promo_code_usages" TO "service_role";

GRANT ALL ON TABLE "public"."promo_codes" TO "anon";

GRANT ALL ON TABLE "public"."promo_codes" TO "authenticated";

GRANT ALL ON TABLE "public"."promo_codes" TO "service_role";

GRANT ALL ON TABLE "public"."promotion_rules" TO "anon";

GRANT ALL ON TABLE "public"."promotion_rules" TO "authenticated";

GRANT ALL ON TABLE "public"."promotion_rules" TO "service_role";

GRANT ALL ON TABLE "public"."promotions" TO "anon";

GRANT ALL ON TABLE "public"."promotions" TO "authenticated";

GRANT ALL ON TABLE "public"."promotions" TO "service_role";

GRANT ALL ON TABLE "public"."rank_configs" TO "anon";

GRANT ALL ON TABLE "public"."rank_configs" TO "authenticated";

GRANT ALL ON TABLE "public"."rank_configs" TO "service_role";

GRANT ALL ON TABLE "public"."rank_history" TO "anon";

GRANT ALL ON TABLE "public"."rank_history" TO "authenticated";

GRANT ALL ON TABLE "public"."rank_history" TO "service_role";

GRANT ALL ON TABLE "public"."rate_limit_logs" TO "anon";

GRANT ALL ON TABLE "public"."rate_limit_logs" TO "authenticated";

GRANT ALL ON TABLE "public"."rate_limit_logs" TO "service_role";

GRANT ALL ON TABLE "public"."return_order_items" TO "anon";

GRANT ALL ON TABLE "public"."return_order_items" TO "authenticated";

GRANT ALL ON TABLE "public"."return_order_items" TO "service_role";

GRANT ALL ON TABLE "public"."return_orders" TO "anon";

GRANT ALL ON TABLE "public"."return_orders" TO "authenticated";

GRANT ALL ON TABLE "public"."return_orders" TO "service_role";

GRANT ALL ON TABLE "public"."rewards" TO "anon";

GRANT ALL ON TABLE "public"."rewards" TO "authenticated";

GRANT ALL ON TABLE "public"."rewards" TO "service_role";

GRANT ALL ON TABLE "public"."stock_movements" TO "anon";

GRANT ALL ON TABLE "public"."stock_movements" TO "authenticated";

GRANT ALL ON TABLE "public"."stock_movements" TO "service_role";

GRANT ALL ON TABLE "public"."supplier_exchange_received_items" TO "anon";

GRANT ALL ON TABLE "public"."supplier_exchange_received_items" TO "authenticated";

GRANT ALL ON TABLE "public"."supplier_exchange_received_items" TO "service_role";

GRANT ALL ON TABLE "public"."supplier_exchange_return_items" TO "anon";

GRANT ALL ON TABLE "public"."supplier_exchange_return_items" TO "authenticated";

GRANT ALL ON TABLE "public"."supplier_exchange_return_items" TO "service_role";

GRANT ALL ON TABLE "public"."supplier_exchanges" TO "anon";

GRANT ALL ON TABLE "public"."supplier_exchanges" TO "authenticated";

GRANT ALL ON TABLE "public"."supplier_exchanges" TO "service_role";

GRANT ALL ON TABLE "public"."supplier_payment_ledger" TO "anon";

GRANT ALL ON TABLE "public"."supplier_payment_ledger" TO "authenticated";

GRANT ALL ON TABLE "public"."supplier_payment_ledger" TO "service_role";

GRANT ALL ON TABLE "public"."support_tickets" TO "anon";

GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";

GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";

GRANT ALL ON TABLE "public"."system_settings" TO "anon";

GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";

GRANT ALL ON TABLE "public"."system_settings" TO "service_role";

GRANT ALL ON TABLE "public"."tenant_memberships" TO "anon";

GRANT ALL ON TABLE "public"."tenant_memberships" TO "authenticated";

GRANT ALL ON TABLE "public"."tenant_memberships" TO "service_role";

GRANT ALL ON TABLE "public"."tenant_registration_events" TO "anon";

GRANT ALL ON TABLE "public"."tenant_registration_events" TO "authenticated";

GRANT ALL ON TABLE "public"."tenant_registration_events" TO "service_role";

GRANT ALL ON TABLE "public"."tenant_webhooks" TO "anon";

GRANT ALL ON TABLE "public"."tenant_webhooks" TO "authenticated";

GRANT ALL ON TABLE "public"."tenant_webhooks" TO "service_role";

GRANT ALL ON TABLE "public"."terms_acceptance" TO "anon";

GRANT ALL ON TABLE "public"."terms_acceptance" TO "authenticated";

GRANT ALL ON TABLE "public"."terms_acceptance" TO "service_role";

GRANT ALL ON TABLE "public"."ticket_replies" TO "anon";

GRANT ALL ON TABLE "public"."ticket_replies" TO "authenticated";

GRANT ALL ON TABLE "public"."ticket_replies" TO "service_role";

GRANT ALL ON TABLE "public"."ticket_reply_templates" TO "anon";

GRANT ALL ON TABLE "public"."ticket_reply_templates" TO "authenticated";

GRANT ALL ON TABLE "public"."ticket_reply_templates" TO "service_role";

GRANT ALL ON TABLE "public"."webhook_deliveries" TO "anon";

GRANT ALL ON TABLE "public"."webhook_deliveries" TO "authenticated";

GRANT ALL ON TABLE "public"."webhook_deliveries" TO "service_role";
