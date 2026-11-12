-- =============================================================================
-- MIGRATION 002 — Editable price list + service_requests hardening
-- =============================================================================
-- Run in Supabase → SQL Editor AFTER 001_security_rls.sql. Safe to re-run.
-- Until this script is run, the website keeps showing the built-in price list
-- (src/constants.ts) and saving in the admin "Cennik" tab returns an error.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Price list table (one row, id = 'main', categories stored as JSON)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing (
  id text PRIMARY KEY DEFAULT 'main',
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT pricing_single_row CHECK (id = 'main'),
  CONSTRAINT pricing_data_is_array CHECK (jsonb_typeof(data) = 'array'),
  CONSTRAINT pricing_data_size CHECK (pg_column_size(data) < 200000)
);

CREATE OR REPLACE FUNCTION public.pricing_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pricing_touch ON public.pricing;
CREATE TRIGGER pricing_touch
BEFORE INSERT OR UPDATE ON public.pricing
FOR EACH ROW EXECUTE FUNCTION public.pricing_touch();

ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads pricing" ON public.pricing;
DROP POLICY IF EXISTS "Admins insert pricing" ON public.pricing;
DROP POLICY IF EXISTS "Admins update pricing" ON public.pricing;

CREATE POLICY "Anyone reads pricing"
ON public.pricing
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins insert pricing"
ON public.pricing
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins update pricing"
ON public.pricing
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

GRANT SELECT ON public.pricing TO anon, authenticated;
GRANT INSERT, UPDATE ON public.pricing TO authenticated;

-- -----------------------------------------------------------------------------
-- STEP 2: Clients may only create new requests in the initial state
-- (previously a client could insert a request with any status / quote)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own requests" ON public.service_requests;

CREATE POLICY "Users insert own requests"
ON public.service_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.is_admin()
    OR (status = 'Oczekuje na przyjęcie' AND estimated_cost IS NULL)
  )
);

-- -----------------------------------------------------------------------------
-- STEP 3: Server-side length limits (mirror src/utils/validation.ts).
-- NOT VALID = existing rows are not checked, only new / updated ones.
-- -----------------------------------------------------------------------------
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_component_model_len;
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_problem_description_len;
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_client_name_len;
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_client_phone_len;

ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_component_model_len CHECK (char_length(component_model) <= 200) NOT VALID,
  ADD CONSTRAINT service_requests_problem_description_len CHECK (char_length(problem_description) <= 2000) NOT VALID,
  ADD CONSTRAINT service_requests_client_name_len CHECK (char_length(client_name) <= 100) NOT VALID,
  ADD CONSTRAINT service_requests_client_phone_len CHECK (char_length(client_phone) <= 30) NOT VALID;
