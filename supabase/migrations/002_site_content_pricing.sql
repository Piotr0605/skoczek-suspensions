-- =============================================================================
-- SITE CONTENT (editable pricing) — Oddaj Amora / skoczek-suspensions
-- =============================================================================
-- Run in the Supabase SQL Editor BEFORE deploying the frontend that uses it.
-- Panel: Supabase → SQL Editor → New query → paste and Run
--
-- Adds a small key/value store for content the administrator edits from the
-- "Panel Mechanika" (currently: the public price list under the key 'pricing').
-- Readable by everyone (the price list is public), writable by admins only.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.site_content (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

COMMENT ON TABLE public.site_content IS
  'Key/value store for admin-editable site content (e.g. key = pricing).';

-- Keep updated_at fresh on every write.
CREATE OR REPLACE FUNCTION public.site_content_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS site_content_updated_at ON public.site_content;
CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.site_content_set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site content"   ON public.site_content;
DROP POLICY IF EXISTS "Admins insert site content" ON public.site_content;
DROP POLICY IF EXISTS "Admins update site content" ON public.site_content;
DROP POLICY IF EXISTS "Admins delete site content" ON public.site_content;

-- The price list is public content: anyone (also logged-out visitors) may read it.
CREATE POLICY "Public read site content"
ON public.site_content
FOR SELECT
TO anon, authenticated
USING (true);

-- Only administrators may write. public.is_admin() comes from 001_security_rls.sql
-- and reads the role from app_metadata, which the client cannot modify.
CREATE POLICY "Admins insert site content"
ON public.site_content
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins update site content"
ON public.site_content
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete site content"
ON public.site_content
FOR DELETE
TO authenticated
USING (public.is_admin());

GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;

-- -----------------------------------------------------------------------------
-- Note on seeding
-- -----------------------------------------------------------------------------
-- No seed row is needed. Until an administrator saves the price list for the
-- first time, the site falls back to the built-in list in src/constants.ts.
-- The first save in "Panel Mechanika → Cennik" creates the row:
--   key = 'pricing', value = [ { id, title, brands | services }, ... ]
