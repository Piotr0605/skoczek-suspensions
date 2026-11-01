-- =============================================================================
-- CONTACT DETAILS — Oddaj Amora / skoczek-suspensions
-- =============================================================================
-- Run this script in the Supabase SQL Editor after 001_security_rls.sql.
-- Panel: Supabase → SQL Editor → New query → paste and Run
--
-- Service requests keep working without email. New requests store the
-- session email. Contact form messages land in contact_inquiries.
-- =============================================================================

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS client_email text;

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_inquiries_name_len CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT contact_inquiries_email_len CHECK (char_length(email) BETWEEN 3 AND 200),
  CONSTRAINT contact_inquiries_subject_len CHECK (char_length(subject) BETWEEN 1 AND 200),
  CONSTRAINT contact_inquiries_message_len CHECK (char_length(message) BETWEEN 1 AND 2000)
);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone insert inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Admins read inquiries" ON public.contact_inquiries;

CREATE POLICY "Anyone insert inquiries"
ON public.contact_inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 200
  AND char_length(subject) BETWEEN 1 AND 200
  AND char_length(message) BETWEEN 1 AND 2000
);

CREATE POLICY "Admins read inquiries"
ON public.contact_inquiries
FOR SELECT
TO authenticated
USING (public.is_admin());

GRANT INSERT ON public.contact_inquiries TO anon, authenticated;
GRANT SELECT ON public.contact_inquiries TO authenticated;
