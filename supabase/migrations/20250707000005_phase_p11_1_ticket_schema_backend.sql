-- P11.1: Admin dashboard — Support ticket schema + backend
-- Tạo bảng support_tickets, ticket_replies, ticket_reply_templates + RLS.
-- ponytail: migration idempotent; chỉ system admin quản lý template; tenant member chỉ thấy
-- ticket của tenant mình; admin gán người phụ trách và cập nhật status.

-- ============================================================
-- 1. support_tickets
-- ============================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'support'
    CHECK (category IN ('bug', 'billing', 'support', 'feature_request')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_tenant_id_idx ON public.support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_category_idx ON public.support_tickets(category);
CREATE INDEX IF NOT EXISTS support_tickets_assigned_to_idx ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS support_tickets_created_at_idx ON public.support_tickets(created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_tickets' AND policyname = 'support_tickets_select'
  ) THEN
    CREATE POLICY "support_tickets_select" ON public.support_tickets FOR SELECT TO authenticated
      USING (
        public.is_system_admin()
        OR (
          tenant_id = public.current_tenant_id()
          AND public.is_tenant_member(tenant_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_tickets' AND policyname = 'support_tickets_insert'
  ) THEN
    CREATE POLICY "support_tickets_insert" ON public.support_tickets FOR INSERT TO authenticated
      WITH CHECK (
        public.is_system_admin()
        OR (
          tenant_id = public.current_tenant_id()
          AND public.is_tenant_member(tenant_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_tickets' AND policyname = 'support_tickets_update'
  ) THEN
    CREATE POLICY "support_tickets_update" ON public.support_tickets FOR UPDATE TO authenticated
      USING (
        public.is_system_admin()
        OR (
          tenant_id = public.current_tenant_id()
          AND public.is_tenant_member(tenant_id)
          AND created_by = auth.uid()
        )
      )
      WITH CHECK (
        public.is_system_admin()
        OR (
          tenant_id = public.current_tenant_id()
          AND public.is_tenant_member(tenant_id)
          AND created_by = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_tickets' AND policyname = 'support_tickets_delete'
  ) THEN
    CREATE POLICY "support_tickets_delete" ON public.support_tickets FOR DELETE TO authenticated
      USING (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 2. ticket_replies
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_replies_ticket_id_idx ON public.ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS ticket_replies_tenant_id_idx ON public.ticket_replies(tenant_id);
CREATE INDEX IF NOT EXISTS ticket_replies_created_at_idx ON public.ticket_replies(created_at ASC);

ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ticket_replies' AND policyname = 'ticket_replies_select'
  ) THEN
    CREATE POLICY "ticket_replies_select" ON public.ticket_replies FOR SELECT TO authenticated
      USING (
        public.is_system_admin()
        OR (
          NOT is_internal_note
          AND tenant_id = public.current_tenant_id()
          AND public.is_tenant_member(tenant_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ticket_replies' AND policyname = 'ticket_replies_insert'
  ) THEN
    CREATE POLICY "ticket_replies_insert" ON public.ticket_replies FOR INSERT TO authenticated
      WITH CHECK (
        public.is_system_admin()
        OR (
          NOT is_internal_note
          AND tenant_id = public.current_tenant_id()
          AND public.is_tenant_member(tenant_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ticket_replies' AND policyname = 'ticket_replies_update'
  ) THEN
    CREATE POLICY "ticket_replies_update" ON public.ticket_replies FOR UPDATE TO authenticated
      USING (
        public.is_system_admin()
        OR (
          NOT is_internal_note
          AND tenant_id = public.current_tenant_id()
          AND public.is_tenant_member(tenant_id)
          AND created_by = auth.uid()
        )
      )
      WITH CHECK (
        public.is_system_admin()
        OR (
          NOT is_internal_note
          AND tenant_id = public.current_tenant_id()
          AND public.is_tenant_member(tenant_id)
          AND created_by = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ticket_replies' AND policyname = 'ticket_replies_delete'
  ) THEN
    CREATE POLICY "ticket_replies_delete" ON public.ticket_replies FOR DELETE TO authenticated
      USING (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 3. ticket_reply_templates
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ticket_reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT
    CHECK (category IS NULL OR category IN ('bug', 'billing', 'support', 'feature_request')),
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_reply_templates_category_idx ON public.ticket_reply_templates(category)
  WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS ticket_reply_templates_active_idx ON public.ticket_reply_templates(is_active)
  WHERE is_active = true;

ALTER TABLE public.ticket_reply_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ticket_reply_templates' AND policyname = 'ticket_reply_templates_all'
  ) THEN
    CREATE POLICY "ticket_reply_templates_all" ON public.ticket_reply_templates TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 4. Trigger: đồng bộ tenant_id từ support_tickets sang ticket_replies
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_ticket_reply_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_ticket_reply_tenant_id' AND tgrelid = 'public.ticket_replies'::regclass
  ) THEN
    CREATE TRIGGER set_ticket_reply_tenant_id
      BEFORE INSERT OR UPDATE ON public.ticket_replies
      FOR EACH ROW
      EXECUTE FUNCTION public.set_ticket_reply_tenant_id();
  END IF;
END $$;

-- ============================================================
-- 5. Trigger: tự động cập nhật updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_ticket_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_support_tickets_updated_at' AND tgrelid = 'public.support_tickets'::regclass
  ) THEN
    CREATE TRIGGER update_support_tickets_updated_at
      BEFORE UPDATE ON public.support_tickets
      FOR EACH ROW
      EXECUTE FUNCTION public.update_ticket_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_ticket_replies_updated_at' AND tgrelid = 'public.ticket_replies'::regclass
  ) THEN
    CREATE TRIGGER update_ticket_replies_updated_at
      BEFORE UPDATE ON public.ticket_replies
      FOR EACH ROW
      EXECUTE FUNCTION public.update_ticket_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_ticket_reply_templates_updated_at' AND tgrelid = 'public.ticket_reply_templates'::regclass
  ) THEN
    CREATE TRIGGER update_ticket_reply_templates_updated_at
      BEFORE UPDATE ON public.ticket_reply_templates
      FOR EACH ROW
      EXECUTE FUNCTION public.update_ticket_updated_at();
  END IF;
END $$;
