-- =============================================================================
-- CRITICAL SECURITY FIX — remove legacy RLS policies on service_requests
-- =============================================================================
-- Run this in the Supabase SQL Editor: Supabase → SQL Editor → New query → Run.
--
-- WHY THIS IS URGENT
-- The 001_security_rls.sql migration added secure policies and dropped the
-- policy names it knew about, but the database still contains OLDER policies
-- created under different names:
--
--   "Admins can view all requests"  (SELECT, role public)
--   "Admins can update requests"    (UPDATE, role public)
--
-- Both test the role like this:
--   ((auth.jwt() -> 'user_metadata') ->> 'role') = 'ADMIN'
--
-- `user_metadata` is writable by the end user (supabase.auth.updateUser), and
-- PostgreSQL combines RLS policies with OR. Any logged-in client could
-- therefore set role = ADMIN on themselves and read or modify EVERY service
-- request — including other customers' names, phone numbers and descriptions.
--
-- The secure replacements based on public.is_admin() (which reads app_metadata,
-- settable only with the service role) already exist, so dropping these
-- policies does not take anything away from real administrators:
--
--   "Admins read all requests"   (SELECT, authenticated, is_admin())
--   "Admins update requests"     (UPDATE, authenticated, is_admin())
--   "Admins delete requests"     (DELETE, authenticated, is_admin())
--   "Users read own requests"    (SELECT, authenticated, auth.uid() = user_id)
--   "Users insert own requests"  (INSERT, authenticated, auth.uid() = user_id)
-- =============================================================================

-- 1) Insecure: role read from user_metadata (editable by the user).
DROP POLICY IF EXISTS "Admins can view all requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins can update requests"   ON public.service_requests;

-- 2) Redundant duplicates of the current policies (same condition, role "public").
DROP POLICY IF EXISTS "Users can view own requests"   ON public.service_requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON public.service_requests;

-- -----------------------------------------------------------------------------
-- Verification — after running, only is_admin()/auth.uid() policies should remain
-- and no `qual` may contain the text `user_metadata`.
-- -----------------------------------------------------------------------------
-- SELECT policyname, cmd, roles::text, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'service_requests'
-- ORDER BY cmd, policyname;
