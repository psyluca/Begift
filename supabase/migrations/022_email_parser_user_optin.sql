-- ============================================================
-- Migration 022: Email Parser — user opt-in flag
-- ============================================================
-- Branch: feature/email-parser-poc
-- Aggiunge campo email_parser_opted_in a profiles per gestire
-- consenso esplicito al parsing automatico delle mail (GDPR).
--
-- Default: false. L'utente deve attivare esplicitamente da /settings.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_parser_opted_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_parser_opted_in_at timestamptz;

COMMENT ON COLUMN public.profiles.email_parser_opted_in IS
  'Consenso esplicito al parsing automatico di mail forwardate (Tripit-style). GDPR opt-in.';
COMMENT ON COLUMN public.profiles.email_parser_opted_in_at IS
  'Timestamp del consenso (audit trail GDPR).';
