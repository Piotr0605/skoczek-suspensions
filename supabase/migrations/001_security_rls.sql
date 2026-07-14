-- =============================================================================
-- SECURITY MIGRATION — Oddaj Amora / skoczek-suspensions
-- =============================================================================
-- IMPORTANT: Run this script in the Supabase SQL Editor BEFORE deploying new code.
-- Order: 1) This SQL  2) Deploy frontend to Vercel
--
-- Panel: Supabase → SQL Editor → New query → paste and Run
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Move ADMIN role to app_metadata (only the server can set it)
-- -----------------------------------------------------------------------------
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'ADMIN')
WHERE COALESCE(raw_user_meta_data->>'role', '') = 'ADMIN'
  AND COALESCE(raw_app_meta_data->>'role', '') IS DISTINCT FROM 'ADMIN';

-- Remove role from user_metadata so users cannot override it themselves
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE raw_user_meta_data ? 'role';

-- -----------------------------------------------------------------------------
-- STEP 2: Helper function — check admin role (app_metadata only)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN',
    false
  );
$$;

-- -----------------------------------------------------------------------------
-- STEP 3: Enable Row Level Security on service_requests table
-- -----------------------------------------------------------------------------
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Drop old policies (safe to re-run)
DROP POLICY IF EXISTS "Users read own requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins read all requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users insert own requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins update requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins delete requests" ON public.service_requests;

-- -----------------------------------------------------------------------------
-- STEP 4: RLS policies
-- -----------------------------------------------------------------------------

-- Clients can only see their own requests
CREATE POLICY "Users read own requests"
ON public.service_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Administrators can see all requests
CREATE POLICY "Admins read all requests"
ON public.service_requests
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Clients can only create requests for their own account
CREATE POLICY "Users insert own requests"
ON public.service_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only administrators can update requests
CREATE POLICY "Admins update requests"
ON public.service_requests
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Optional: only admins can delete (if needed in the future)
CREATE POLICY "Admins delete requests"
ON public.service_requests
FOR DELETE
TO authenticated
USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- STEP 5: Grant ADMIN role to a new administrator (manually, when needed)
-- -----------------------------------------------------------------------------
-- Replace 'admin@example.com' with the administrator's email:
--
-- UPDATE auth.users
-- SET raw_app_meta_data =
--   COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'ADMIN')
-- WHERE email = 'admin@example.com';
