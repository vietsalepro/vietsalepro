-- SP-6.3: Admin dashboard — Support ticket SLA column
-- ponytail: adds a single sla_target_at column so the inbox can show/highlight SLA status.
-- Computed on create/update from priority via application logic; DB just stores the target.

ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS sla_target_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS support_tickets_sla_target_at_idx
  ON public.support_tickets(sla_target_at)
  WHERE sla_target_at IS NOT NULL;
