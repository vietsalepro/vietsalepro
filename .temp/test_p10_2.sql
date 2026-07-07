-- P10.2 self-check on remote DB: voucher 10% + yearly bonus 1 month.
-- ponytail: single transaction, hard-coded UUIDs to avoid collisions, cleans up after itself.

DO $$
DECLARE
  v_admin_id UUID := '11111111-1111-1111-1111-111111111111';
  v_tenant_id UUID := '22222222-2222-2222-2222-222222222222';
  v_invoice_id UUID;
  v_promo_id UUID;
  v_rule_id UUID;
  v_result JSONB;
  v_item public.invoice_items%ROWTYPE;
BEGIN
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_admin_id, 'role', 'authenticated')::TEXT,
    true
  );

  -- Admin
  INSERT INTO auth.users (id, email) VALUES (v_admin_id, 'test_admin_p10_2@example.com')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.system_admins (user_id) VALUES (v_admin_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Tenant + subscription
  INSERT INTO public.tenants (id, name, subdomain, plan, status)
  VALUES (v_tenant_id, 'P10.2 Test Tenant', 'p10-2-test', 'vip', 'active')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.tenant_subscriptions (tenant_id, plan, expires_at)
  VALUES (v_tenant_id, 'vip', CURRENT_DATE)
  ON CONFLICT (tenant_id) DO NOTHING;

  -- Invoice: 1 year VIP => 12 * 59000 = 708000
  v_invoice_id := gen_random_uuid();
  INSERT INTO public.invoices (
    id, tenant_id, invoice_no, status, issue_date, due_date,
    period_start, period_end, subtotal, discount, tax, total, amount_paid, notes
  ) VALUES (
    v_invoice_id, v_tenant_id,
    public.get_next_invoice_number(EXTRACT(YEAR FROM CURRENT_DATE)::INT),
    'pending', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE, (CURRENT_DATE + INTERVAL '12 months')::DATE,
    708000, 0, 0, 708000, 0, 'P10.2 test invoice'
  );
  INSERT INTO public.invoice_items (invoice_id, tenant_id, description, quantity, unit_price)
  VALUES (v_invoice_id, v_tenant_id, 'Gói VIP - Năm', 12, 59000);

  RAISE NOTICE 'Invoice subtotal: %', (SELECT subtotal FROM public.invoices WHERE id = v_invoice_id);

  -- Voucher 10%
  INSERT INTO public.promo_codes (id, code, kind, discount_value, max_uses_total, max_uses_per_tenant, is_active)
  VALUES (gen_random_uuid(), 'P10TEST10', 'percentage', 10, 10, 2, true)
  RETURNING id INTO v_promo_id;

  -- Promotion: mua năm tặng 1 tháng
  INSERT INTO public.promotion_rules (id, name, condition_type, condition_value, benefit_type, benefit_value, is_active, priority)
  VALUES (gen_random_uuid(), 'P10.2 test yearly bonus', 'cycle_type', '{"cycle_type":"yearly"}', 'bonus_months', 1, true, 10)
  RETURNING id INTO v_rule_id;

  -- Apply voucher
  v_result := public.apply_voucher_to_invoice(v_invoice_id, 'P10TEST10');
  RAISE NOTICE 'Apply result: %', v_result;

  IF NOT (v_result->>'success')::BOOLEAN THEN
    RAISE EXCEPTION 'Apply voucher failed: %', v_result->>'error';
  END IF;

  IF (v_result->>'discount')::NUMERIC <> 70800 THEN
    RAISE EXCEPTION 'Expected discount 70800, got %', v_result->>'discount';
  END IF;

  IF (v_result->>'bonus_months')::INT <> 1 THEN
    RAISE EXCEPTION 'Expected bonus_months 1, got %', v_result->>'bonus_months';
  END IF;

  IF (v_result->>'total')::NUMERIC <> 637200 THEN
    RAISE EXCEPTION 'Expected total 637200, got %', v_result->>'total';
  END IF;

  -- Verify bonus line item added
  SELECT * INTO v_item
  FROM public.invoice_items
  WHERE invoice_id = v_invoice_id AND description = 'Tháng tặng (promotion)';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Missing bonus month line item';
  END IF;

  -- Second apply must be blocked
  v_result := public.apply_voucher_to_invoice(v_invoice_id, 'P10TEST10');
  IF (v_result->>'success')::BOOLEAN THEN
    RAISE EXCEPTION 'Second apply should fail';
  END IF;
  RAISE NOTICE 'Second apply correctly blocked: %', v_result->>'error';

  -- Cleanup
  DELETE FROM public.promo_code_usages WHERE invoice_id = v_invoice_id;
  DELETE FROM public.invoice_items WHERE invoice_id = v_invoice_id;
  DELETE FROM public.payments WHERE invoice_id = v_invoice_id;
  DELETE FROM public.invoices WHERE id = v_invoice_id;
  DELETE FROM public.promo_codes WHERE id = v_promo_id;
  DELETE FROM public.promotion_rules WHERE id = v_rule_id;
  DELETE FROM public.tenant_subscriptions WHERE tenant_id = v_tenant_id;
  DELETE FROM public.tenants WHERE id = v_tenant_id;
  DELETE FROM public.system_admins WHERE user_id = v_admin_id;
  DELETE FROM auth.users WHERE id = v_admin_id;

  RAISE NOTICE 'P10.2 test passed';
END $$;

SELECT 'P10.2 test passed' AS result;
