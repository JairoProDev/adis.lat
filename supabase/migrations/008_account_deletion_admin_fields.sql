-- Adds operational fields to track processing of deletion requests.

ALTER TABLE public.account_deletion_requests
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status
  ON public.account_deletion_requests (status);
