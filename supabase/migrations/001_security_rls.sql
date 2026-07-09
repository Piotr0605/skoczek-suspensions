-- =============================================================================
-- MIGRACJA BEZPIECZEŃSTWA — Oddaj Amora / skoczek-suspensions
-- =============================================================================
-- WAŻNE: Uruchom ten skrypt w Supabase SQL Editor PRZED wdrożeniem nowego kodu.
-- Kolejność: 1) Ten SQL  2) Deploy frontendu na Vercel
--
-- Panel: Supabase → SQL Editor → New query → wklej i Run
-- =============================================================================

-- -----------------------------------------------------------------------------
-- KROK 1: Przenieś rolę ADMIN do app_metadata (tylko serwer może to ustawić)
-- -----------------------------------------------------------------------------
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'ADMIN')
WHERE COALESCE(raw_user_meta_data->>'role', '') = 'ADMIN'
  AND COALESCE(raw_app_meta_data->>'role', '') IS DISTINCT FROM 'ADMIN';

-- Usuń rolę z user_metadata, żeby użytkownik nie mógł jej sam nadpisać
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE raw_user_meta_data ? 'role';

-- -----------------------------------------------------------------------------
-- KROK 2: Funkcja pomocnicza — sprawdzenie roli admina (tylko app_metadata)
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
-- KROK 3: Włącz Row Level Security na tabeli service_requests
-- -----------------------------------------------------------------------------
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Usuń stare polityki (bezpieczne ponowne uruchomienie)
DROP POLICY IF EXISTS "Users read own requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins read all requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users insert own requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins update requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins delete requests" ON public.service_requests;

-- -----------------------------------------------------------------------------
-- KROK 4: Polityki RLS
-- -----------------------------------------------------------------------------

-- Klient widzi tylko swoje zgłoszenia
CREATE POLICY "Users read own requests"
ON public.service_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Administrator widzi wszystkie zgłoszenia
CREATE POLICY "Admins read all requests"
ON public.service_requests
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Klient może tworzyć zgłoszenia tylko na swoje konto
CREATE POLICY "Users insert own requests"
ON public.service_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Tylko administrator może aktualizować zgłoszenia
CREATE POLICY "Admins update requests"
ON public.service_requests
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Opcjonalnie: tylko admin może usuwać (jeśli potrzebne w przyszłości)
CREATE POLICY "Admins delete requests"
ON public.service_requests
FOR DELETE
TO authenticated
USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- KROK 5: Nadanie roli ADMIN nowemu administratorowi (ręcznie, gdy potrzeba)
-- -----------------------------------------------------------------------------
-- Zamień 'admin@example.com' na email administratora:
--
-- UPDATE auth.users
-- SET raw_app_meta_data =
--   COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'ADMIN')
-- WHERE email = 'admin@example.com';
