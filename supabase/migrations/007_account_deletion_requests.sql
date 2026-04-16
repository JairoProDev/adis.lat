-- Account/data deletion requests for Play Console compliance and user rights.

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('account_and_data', 'data_only')),
  full_name text,
  details text,
  user_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'completed', 'rejected')),
  source text NOT NULL DEFAULT 'play_console_form',
  requester_ip text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_created_at
  ON public.account_deletion_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_email
  ON public.account_deletion_requests (email);

CREATE OR REPLACE FUNCTION public.trg_account_deletion_requests_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_account_deletion_requests_updated
  ON public.account_deletion_requests;
CREATE TRIGGER trg_account_deletion_requests_updated
  BEFORE UPDATE ON public.account_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_account_deletion_requests_set_updated_at();

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.account_deletion_requests IS 'User requests to delete account and/or personal data from Buscadis.';
