-- ============================================================
-- Migration 021: Email Parser POC — gift_drafts table
-- ============================================================
-- Branch: feature/email-parser-poc
-- Aggiunge tabella per gestire "draft di gift" pre-popolati da
-- parsing automatico di mail forwardate (modello Tripit).
--
-- NOTA Supabase post 2026-10-30: nuove tabelle nello schema public
-- richiedono GRANT espliciti per essere esposte alla Data API.
-- Questa migration include i GRANT necessari per future-proofing.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gift_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner: l'utente che ha forwardato la mail (verificato via from address)
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,

  -- Stato del draft:
  --   'pending'   = appena ricevuto, parsing in corso
  --   'ready'     = parsing OK, draft pronto per completion
  --   'completed' = utente ha completato il draft e creato un gift (vedi gift_id)
  --   'failed'    = parsing fallito, utente puo' compilare manualmente
  --   'expired'   = >30 giorni senza completion, soft delete
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'completed', 'failed', 'expired')),

  -- Source mail metadata
  source_email_from text NOT NULL,       -- mittente originale (es. noreply@ticketone.it)
  source_email_subject text,
  source_email_received_at timestamptz NOT NULL DEFAULT now(),

  -- Merchant identificato dal parser ('ticketone', 'smartbox', 'unknown')
  detected_merchant text,

  -- Output strutturato del parser LLM (JSON)
  -- Schema variabile per merchant, vedi docs/email-parser-poc/SPEC.md
  parsed_content jsonb,

  -- Confidence score 0-1 del parser
  parser_confidence numeric(3, 2),

  -- Eventuali allegati salvati su Supabase Storage (PDF biglietti, ricevute)
  attachment_urls text[] DEFAULT ARRAY[]::text[],

  -- Raw body (testo) per debug e re-parsing futuro
  raw_body text,

  -- Quando il draft viene completato, link al gift creato
  gift_id uuid REFERENCES gifts(id) ON DELETE SET NULL,

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

-- Index per query ricorrenti
CREATE INDEX IF NOT EXISTS idx_gift_drafts_user_id_status
  ON public.gift_drafts (user_id, status);
CREATE INDEX IF NOT EXISTS idx_gift_drafts_expires_at
  ON public.gift_drafts (expires_at)
  WHERE status NOT IN ('completed', 'expired');

-- ============================================================
-- GRANT espliciti (richiesti da Supabase dal 2026-10-30 per
-- esporre tabelle alla Data API)
-- ============================================================

-- anon: nessun accesso (drafts sono privati)
-- authenticated: l'utente puo' gestire i propri drafts (con RLS)
-- service_role: il backend (parser) ha pieno accesso

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_drafts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_drafts TO service_role;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.gift_drafts ENABLE ROW LEVEL SECURITY;

-- Policy 1: l'utente proprietario puo' fare tutto sui suoi drafts
CREATE POLICY "user can manage own drafts"
  ON public.gift_drafts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 2: service_role (parser backend) bypassa RLS naturalmente
-- (nessuna policy necessaria, service_role ha BYPASSRLS implicito)

-- ============================================================
-- Trigger: cleanup automatico drafts scaduti (>30gg, non completati)
-- ============================================================
-- Soluzione semplice: cron job esterno chiamera' /api/cron/cleanup-drafts
-- che fa UPDATE status='expired' WHERE expires_at < now() AND status NOT IN ('completed','expired')
-- Niente trigger pesante in DB per ora.

-- ============================================================
-- Storage bucket per allegati
-- ============================================================
-- Da creare manualmente su Supabase dashboard:
--   bucket name: gift-draft-attachments
--   public: false
--   file size limit: 5MB
--   allowed mime types: application/pdf, image/jpeg, image/png

-- Policy storage (da inserire via dashboard o separato SQL):
-- INSERT INTO storage.policies (...) VALUES (...);

-- ============================================================
-- Comment finale
-- ============================================================
COMMENT ON TABLE public.gift_drafts IS
  'Bozze di gift pre-popolate dal parsing automatico di mail forwardate. Pattern Tripit-style. Vedi docs/email-parser-poc/SPEC.md';
