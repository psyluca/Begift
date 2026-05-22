-- ============================================================
-- Migration 029: Newsletter subscribers
-- ============================================================
-- Branch: feature/ux-p2
-- Data: 2026-05-22
--
-- P2 #13 UX audit: aggiungere iscrizione newsletter come canale di
-- retention. Newsletter mensile "1 idea regalo per le prossime
-- ricorrenze". Crescita stimata 200/mese a regime con conversion 5-10%
-- = traffico ricorrente al sito.
--
-- Tabella minimale: email + opt-in timestamp + source (footer,
-- post-gift, dashboard) + unsubscribe token per double-opt-out
-- compliance GDPR. Niente PII oltre la mail (no nome, no telefono).
--
-- RLS: nessun accesso anon/authenticated. Solo service_role (insert
-- via endpoint /api/newsletter/subscribe lato server). Garantisce
-- che il bot non possa enumerare i subscriber.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text NOT NULL UNIQUE,
  source            text NOT NULL DEFAULT 'unknown',
  opted_in_at       timestamptz NOT NULL DEFAULT now(),
  opted_out_at      timestamptz,
  unsubscribe_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  last_sent_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.newsletter_subscribers IS
'Iscritti alla newsletter mensile BeGift. Source distingue il punto di iscrizione (footer, post-gift, dashboard). unsubscribe_token consente opt-out senza login.';

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_optin
  ON public.newsletter_subscribers (opted_in_at DESC)
  WHERE opted_out_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_newsletter_unsubscribe_token
  ON public.newsletter_subscribers (unsubscribe_token);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.newsletter_subscribers_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_newsletter_subscribers_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER trg_newsletter_subscribers_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.newsletter_subscribers_set_updated_at();

-- RLS: tabella riservata, niente policy → nessun accesso pubblico
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- Nessuna policy = solo service_role via admin client server-side

-- NO GRANT a anon/authenticated. Solo service_role (Supabase admin
-- client) puo' insert/update.

COMMIT;
