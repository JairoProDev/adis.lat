-- Multi-tenant business pages: many businesses per user, many admins per business.
-- Run after business_profiles exists.

-- 1) Role enum
DO $$ BEGIN
  CREATE TYPE business_member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Members table
CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role business_member_role NOT NULL DEFAULT 'editor',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_profile_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_business_members_role ON business_members(role);

-- 3) Creator column (who created the row; usually same as user_id for legacy)
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE business_profiles SET created_by = user_id WHERE created_by IS NULL;

-- 4) Remove 1:1 constraint so one user can own many businesses
ALTER TABLE business_profiles DROP CONSTRAINT IF EXISTS unique_user_business;

-- 5) Backfill owners from legacy user_id
INSERT INTO business_members (business_profile_id, user_id, role, status)
SELECT id, user_id, 'owner'::business_member_role, 'active'
FROM business_profiles
WHERE user_id IS NOT NULL
ON CONFLICT (business_profile_id, user_id) DO NOTHING;

-- 6) Helper functions for RLS (SECURITY DEFINER, minimal surface)
CREATE OR REPLACE FUNCTION public.is_business_member(p_business_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM business_members m
    WHERE m.business_profile_id = p_business_id
      AND m.user_id = p_user_id
      AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.business_member_role(p_business_id uuid, p_user_id uuid)
RETURNS business_member_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT m.role
  FROM business_members m
  WHERE m.business_profile_id = p_business_id
    AND m.user_id = p_user_id
    AND m.status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_edit_business_profile(p_business_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_members m
    WHERE m.business_profile_id = p_business_id
      AND m.user_id = p_user_id
      AND m.status = 'active'
      AND m.role IN ('owner'::business_member_role, 'admin'::business_member_role, 'editor'::business_member_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_owner(p_business_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT public.business_member_role(p_business_id, p_user_id) = 'owner'::business_member_role;
$$;

-- 7) Auto-create owner membership on new business_profiles
CREATE OR REPLACE FUNCTION public.trg_business_profiles_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO business_members (business_profile_id, user_id, role, status)
    VALUES (NEW.id, NEW.user_id, 'owner', 'active')
    ON CONFLICT (business_profile_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_business_profiles_after_insert ON business_profiles;
CREATE TRIGGER trg_business_profiles_after_insert
  AFTER INSERT ON business_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_business_profiles_after_insert();

-- 8) RLS business_members
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read own rows" ON business_members;
CREATE POLICY "Members can read own rows"
  ON business_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.business_member_role(business_profile_id, auth.uid()) IN ('owner'::business_member_role, 'admin'::business_member_role)
  );

DROP POLICY IF EXISTS "Owners and admins manage members" ON business_members;
CREATE POLICY "Owners and admins manage members"
  ON business_members FOR ALL
  USING (
    public.business_member_role(business_profile_id, auth.uid()) IN ('owner'::business_member_role, 'admin'::business_member_role)
  )
  WITH CHECK (
    public.business_member_role(business_profile_id, auth.uid()) IN ('owner'::business_member_role, 'admin'::business_member_role)
  );

-- 9) Replace business_profiles policies
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Perfiles publicados son visibles para todos" ON business_profiles;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil de negocio" ON business_profiles;
DROP POLICY IF EXISTS "Usuarios pueden crear su perfil de negocio" ON business_profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su perfil de negocio" ON business_profiles;
DROP POLICY IF EXISTS "Usuarios pueden eliminar su perfil de negocio" ON business_profiles;

CREATE POLICY "Public read published businesses"
  ON business_profiles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Members read draft businesses"
  ON business_profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND public.is_business_member(id, auth.uid())
  );

CREATE POLICY "Authenticated users create own business row"
  ON business_profiles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

CREATE POLICY "Editors update business"
  ON business_profiles FOR UPDATE
  USING (public.can_edit_business_profile(id, auth.uid()))
  WITH CHECK (public.can_edit_business_profile(id, auth.uid()));

CREATE POLICY "Owners delete business"
  ON business_profiles FOR DELETE
  USING (public.is_business_owner(id, auth.uid()));

COMMENT ON TABLE business_members IS 'Team access: many users per business with RBAC roles.';
COMMENT ON COLUMN business_profiles.user_id IS 'Legacy creator/primary account; membership is source of truth in business_members.';
