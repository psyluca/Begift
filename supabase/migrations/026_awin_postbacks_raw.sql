-- ============================================================
-- Migration 026: Awin postbacks raw — audit table per debug
-- ============================================================
-- Branch: feature/email-parser-poc
--
-- Awin manda postback POST JSON ad ogni conversione VivaTicket (e
-- altri merchant Awin futuri). Prima di parsare strutturato, vogliamo
-- LOGGARE TUTTO il payload reale per:
--   1. Vedere il formato esatto del JSON Awin
--   2. Audit fiscale: ogni conversione ha un record canonico in DB
--   3. Anti-fraud: header IP + user agent + timestamp
--   4. Debug: se l'endpoint parsing strutturato fallisce, ho sempre
--      il raw da rielaborare
--
-- L'endpoint /api/awin/postback inserisce qui SEMPRE prima di tutto.
-- Poi processing strutturato (commit successivo) leggera' da qui o
-- riceverà direttamente il body in parallelo.
--
-- Privacy: niente PII utente esposto (Awin manda solo clickref =
-- gift_id pseudo-anonimo). Headers possono contenere IP — accettato
-- come legitimate interest per anti-fraud GDPR art. 6.1(f).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.awin_postbacks_raw (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at         timestamptz NOT NULL DEFAULT now(),

  -- Raw payload
  body                jsonb NOT NULL,
  headers             jsonb,
  method              text NOT NULL DEFAULT 'POST',
  content_type        text,
  client_ip           text,            -- da X-Forwarded-For o REMOTE_ADDR
  user_agent          text,

  -- Quick-access fields (estratti dal body per facilitare query)
  -- NB: nullable perche' non sappiamo ancora la struttura esatta.
  -- Una volta visti i primi postback reali, possiamo backfilare e
  -- aggiungere NOT NULL.
  merchant_id         text,            -- es. '32283' (VivaTicket)
  transaction_id      text,            -- ID univoco Awin per la conversione
  click_ref           text,            -- = gift_draft.id che avevamo settato
  amount_cents        integer,         -- importo lordo in cents
  commission_cents    integer,         -- commissione BeGift
  currency            text,            -- 'EUR' nella maggior parte
  awin_status         text,            -- 'pending' / 'approved' / 'declined'

  -- Stato processing (per il consumatore strutturato)
  processed           boolean NOT NULL DEFAULT false,
  processed_at        timestamptz,
  processing_error    text,

  created_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.awin_postbacks_raw IS
'Audit log raw di tutti i postback Awin ricevuti. Prima di parsing strutturato.';

-- Indici per query principali
CREATE INDEX IF NOT EXISTS idx_awin_postbacks_received_at
  ON public.awin_postbacks_raw (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_awin_postbacks_transaction
  ON public.awin_postbacks_raw (transaction_id)
  WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_awin_postbacks_click_ref
  ON public.awin_postbacks_raw (click_ref)
  WHERE click_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_awin_postbacks_unprocessed
  ON public.awin_postbacks_raw (received_at)
  WHERE processed = false;

-- RLS: solo service_role accede (postback contains business data)
ALTER TABLE public.awin_postbacks_raw ENABLE ROW LEVEL SECURITY;
-- Nessuna policy public: solo service_role tramite admin client.

-- GRANT espliciti per Supabase post-2026-10-30 (solo service_role implicito)
-- Niente GRANT per anon/authenticated.

-- Idempotency hint: in futuro aggiungeremo
--   CONSTRAINT unique_transaction_id UNIQUE (transaction_id)
-- per garantire che Awin retry dello stesso postback non duplichi.
-- Per ora niente UNIQUE perche' transaction_id potrebbe essere NULL
-- nei primi postback di test.
