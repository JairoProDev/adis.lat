-- Invitations, acceptance RPC, owner safeguards, trigger syntax for PG14+

-- 1) Trigger: prefer EXECUTE FUNCTION (PostgreSQL 14+; Supabase)
DROP TRIGGER IF EXISTS trg_business_profiles_after_insert ON business_profiles;
CREATE TRIGGER trg_business_profiles_after_insert
  AFTER INSERT ON business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_business_profiles_after_insert();

-- 2) At most one owner per business (dedupe if legacy duplicates exist)
DELETE FROM business_members a
USING business_members b
WHERE a.business_profile_id = b.business_profile_id
  AND a.role = 'owner'::business_member_role
  AND b.role = 'owner'::business_member_role
  AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_members_one_owner
  ON business_members (business_profile_id)
  WHERE role = 'owner'::business_member_role;

-- 3) Protect owner row
CREATE OR REPLACE FUNCTION public.trg_prevent_delete_business_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'owner'::business_member_role THEN
    RAISE EXCEPTION 'Cannot remove the business owner';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_delete_business_owner ON business_members;
CREATE TRIGGER trg_prevent_delete_business_owner
  BEFORE DELETE ON business_members
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_prevent_delete_business_owner();

CREATE OR REPLACE FUNCTION public.trg_protect_owner_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'owner'::business_member_role AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change owner role via this path';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_owner_role_change ON business_members;
CREATE TRIGGER trg_protect_owner_role_change
  BEFORE UPDATE ON business_members
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_protect_owner_role_change();

-- 4) Invitations (cannot invite as owner; transfer is separate)
CREATE TABLE IF NOT EXISTS business_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role business_member_role NOT NULL,
  token TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  accepted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT business_invitations_role_not_owner CHECK (role <> 'owner'::business_member_role)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_invitations_token ON business_invitations(token);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invite_pending_email
  ON business_invitations (business_profile_id, lower(btrim(email)))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_business_invitations_business ON business_invitations(business_profile_id);

ALTER TABLE business_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team admins read invitations" ON business_invitations;
CREATE POLICY "Team admins read invitations"
  ON business_invitations FOR SELECT
  USING (
    public.business_member_role(business_profile_id, auth.uid()) IN ('owner'::business_member_role, 'admin'::business_member_role)
  );

DROP POLICY IF EXISTS "Team admins insert invitations" ON business_invitations;
CREATE POLICY "Team admins insert invitations"
  ON business_invitations FOR INSERT
  WITH CHECK (
    public.business_member_role(business_profile_id, auth.uid()) IN ('owner'::business_member_role, 'admin'::business_member_role)
    AND invited_by = auth.uid()
  );

DROP POLICY IF EXISTS "Team admins update invitations" ON business_invitations;
CREATE POLICY "Team admins update invitations"
  ON business_invitations FOR UPDATE
  USING (
    public.business_member_role(business_profile_id, auth.uid()) IN ('owner'::business_member_role, 'admin'::business_member_role)
  )
  WITH CHECK (
    public.business_member_role(business_profile_id, auth.uid()) IN ('owner'::business_member_role, 'admin'::business_member_role)
  );

DROP POLICY IF EXISTS "Team admins delete invitations" ON business_invitations;
CREATE POLICY "Team admins delete invitations"
  ON business_invitations FOR DELETE
  USING (
    public.business_member_role(business_profile_id, auth.uid()) IN ('owner'::business_member_role, 'admin'::business_member_role)
  );

COMMENT ON TABLE business_invitations IS 'Pending email invites; accept via accept_business_invitation()';

-- 5) Accept invitation (email must match auth.users)
CREATE OR REPLACE FUNCTION public.accept_business_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  inv business_invitations%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_uid;
  IF v_email IS NULL OR length(btrim(v_email)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_email');
  END IF;

  SELECT * INTO inv FROM business_invitations WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_used');
  END IF;

  IF inv.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_pending', 'status', inv.status);
  END IF;

  IF inv.expires_at < now() THEN
    UPDATE business_invitations SET status = 'expired' WHERE id = inv.id;
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  IF lower(btrim(inv.email)) <> lower(btrim(v_email)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'email_mismatch');
  END IF;

  INSERT INTO business_members (business_profile_id, user_id, role, status, invited_by)
  VALUES (inv.business_profile_id, v_uid, inv.role, 'active', inv.invited_by)
  ON CONFLICT (business_profile_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        status = 'active',
        updated_at = now();

  UPDATE business_invitations
  SET status = 'accepted', accepted_at = now(), accepted_by_user_id = v_uid
  WHERE id = inv.id;

  RETURN jsonb_build_object('ok', true, 'business_profile_id', inv.business_profile_id);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_business_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_business_invitation(text) TO authenticated;
