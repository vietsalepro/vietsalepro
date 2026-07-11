-- Add soft-delete columns for tenants
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS hard_delete_approved_by UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hard_delete_requested_at TIMESTAMPTZ;