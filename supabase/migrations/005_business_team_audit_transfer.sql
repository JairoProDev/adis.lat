-- Team audit trail + safe owner transfer (bypasses role-guard via session setting)

-- 1) Audit log (inserts via triggers / RPC only; read for owner/admin)
CREATE TABLE IF NOT EXISTS business_team_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_audit_business_created
  ON business_team_audit_log (business_profile_id, created_at DESC);

ALTER TABLE business_team_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners and admins read team audit" ON business_team_audit_log;
CREATE POLICY "Owners and admins read team audit"
  ON business_team_audit_log FOR SELECT
  USING (
    public.business_member_role(business_profile_id, auth.uid()) IN ('owner'::business_member_role, 'admin'::business_member_role)
  );

COMMENT ON TABLE business_team_audit_log IS 'Append-only team RBAC events; do not grant INSERT to authenticated.';

-- 2) Allow owner role swap only inside transfer RPC
CREATE OR REPLACE FUNCTION public.trg_protect_owner_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(current_setting('app.business_owner_transfer', true), '') = 'on' THEN
    RETURN NEW;
  END IF;
  IF OLD.role = 'owner'::business_member_role AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change owner role via this path';
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Audit: business_members
CREATE OR REPLACE FUNCTION public.trg_audit_business_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO business_team_audit_log (business_profile_id, actor_user_id, action, target_user_id, metadata)
    VALUES (
      NEW.business_profile_id,
      v_actor,
      'member_added',
      NEW.user_id,
      jsonb_build_object('role', NEW.role::text, 'status', NEW.status)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      INSERT INTO business_team_audit_log (business_profile_id, actor_user_id, action, target_user_id, metadata)
      VALUES (
        NEW.business_profile_id,
        v_actor,
        'role_changed',
        NEW.user_id,
        jsonb_build_object('from', OLD.role::text, 'to', NEW.role::text)
      );
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO business_team_audit_log (business_profile_id, actor_user_id, action, target_user_id, metadata)
      VALUES (
        NEW.business_profile_id,
        v_actor,
        'member_status_changed',
        NEW.user_id,
        jsonb_build_object('from', OLD.status, 'to', NEW.status)
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO business_team_audit_log (business_profile_id, actor_user_id, action, target_user_id, metadata)
    VALUES (
      OLD.business_profile_id,
      v_actor,
      'member_removed',
      OLD.user_id,
      jsonb_build_object('role', OLD.role::text)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_business_members ON business_members;
CREATE TRIGGER trg_audit_business_members
  AFTER INSERT OR UPDATE OR DELETE ON business_members
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_audit_business_members();

-- 4) Audit: invitations
CREATE OR REPLACE FUNCTION public.trg_audit_business_invitations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO business_team_audit_log (business_profile_id, actor_user_id, action, target_user_id, metadata)
    VALUES (
      NEW.business_profile_id,
      v_actor,
      'invite_created',
      NULL,
      jsonb_build_object('email', lower(btrim(NEW.email)), 'role', NEW.role::text, 'invitation_id', NEW.id)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO business_team_audit_log (business_profile_id, actor_user_id, action, target_user_id, metadata)
      VALUES (
        NEW.business_profile_id,
        v_actor,
        'invite_status_changed',
        NEW.accepted_by_user_id,
        jsonb_build_object('from', OLD.status, 'to', NEW.status, 'email', lower(btrim(NEW.email)))
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO business_team_audit_log (business_profile_id, actor_user_id, action, target_user_id, metadata)
    VALUES (
      OLD.business_profile_id,
      v_actor,
      'invite_deleted',
      NULL,
      jsonb_build_object('email', lower(btrim(OLD.email)), 'role', OLD.role::text)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_business_invitations ON business_invitations;
CREATE TRIGGER trg_audit_business_invitations
  AFTER INSERT OR UPDATE OR DELETE ON business_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_audit_business_invitations();

-- 5) Transfer ownership (caller must be current owner; new user must already be an active member)
CREATE OR REPLACE FUNCTION public.transfer_business_owner(p_business_id uuid, p_new_owner_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_old_owner uuid;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF public.business_member_role(p_business_id, v_actor) <> 'owner'::business_member_role THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  IF v_actor = p_new_owner_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'same_user');
  END IF;

  IF NOT public.is_business_member(p_business_id, p_new_owner_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'new_owner_not_member');
  END IF;

  SELECT m.user_id INTO v_old_owner
  FROM business_members m
  WHERE m.business_profile_id = p_business_id
    AND m.role = 'owner'::business_member_role
    AND m.status = 'active'
  LIMIT 1;

  IF v_old_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_owner_row');
  END IF;

  PERFORM set_config('app.business_owner_transfer', 'on', true);

  UPDATE business_members
  SET role = 'admin'::business_member_role, updated_at = now()
  WHERE business_profile_id = p_business_id AND user_id = v_old_owner;

  UPDATE business_members
  SET role = 'owner'::business_member_role, updated_at = now()
  WHERE business_profile_id = p_business_id AND user_id = p_new_owner_user_id;

  PERFORM set_config('app.business_owner_transfer', '', true);

  UPDATE business_profiles
  SET user_id = p_new_owner_user_id, updated_at = now()
  WHERE id = p_business_id;

  INSERT INTO business_team_audit_log (business_profile_id, actor_user_id, action, target_user_id, metadata)
  VALUES (
    p_business_id,
    v_actor,
    'owner_transferred',
    p_new_owner_user_id,
    jsonb_build_object('previous_owner_id', v_old_owner)
  );

  RETURN jsonb_build_object('ok', true, 'new_owner_user_id', p_new_owner_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_business_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_business_owner(uuid, uuid) TO authenticated;
