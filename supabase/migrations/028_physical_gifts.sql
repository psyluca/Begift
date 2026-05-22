-- ============================================================
-- Migration 028: Physical gifts support (regali fisici)
-- ============================================================
-- Branch: feature/overnight-revamp
-- Data: 2026-05-21 (notte)
--
-- BeGift originariamente nasce per regali "digitali":
-- esperienze, biglietti, voucher. Tutto consegnato via mail al
-- destinatario senza spedizione fisica.
--
-- Con l'integrazione di 24 Bottles (e altri brand "regalo da casa"
-- in futuro), entra una nuova categoria: il regalo e' un OGGETTO
-- FISICO che viene spedito al destinatario nei giorni successivi
-- all'apertura del pacco digitale BeGift.
--
-- Flusso:
--   1. Sender sceglie bottiglia in BeGift → click "Regalalo"
--   2. Redirect a 24bottles.com (via TradeDoubler affiliate) per pagamento
--   3. Sender riceve mail conferma da 24Bottles
--   4. Sender inoltra mail a plans@plans.begift.app
--   5. Email parser estrae: nome bottiglia, immagine, data spedizione
--   6. BeGift prepara pacco digitale che mostra: immagine bottiglia +
--      data consegna stimata + messaggio sender
--   7. Destinatario apre BeGift, vede animazione + bottiglia + "ti arriva
--      a casa entro X giorni"
--   8. Nei giorni successivi riceve la bottiglia fisica per posta
--
-- Questa migration aggiunge 3 colonne a experiences per supportare
-- il pattern "regalo fisico":
--
-- 1. is_physical_gift (bool, default false): flag che distingue
--    esperienza digitale (voucher GYG/VVT) da prodotto fisico
--    (bottiglia, libro, gadget). Tutti i record esistenti restano
--    false. Filter facile in UI per separare le due categorie.
--
-- 2. shipping_estimated_days (int, nullable): giorni stimati tra
--    pagamento sul partner e consegna al destinatario. Solo per
--    is_physical_gift=true. Es. 24Bottles: 3-5 giorni in Italia.
--
-- 3. product_image_url (text, nullable): URL immagine prodotto
--    primario (es. la singola bottiglia con sfondo neutro). Distinto
--    da image_url (hero card) che puo' essere un'immagine ambientata.
--    Usata nel pacco digitale per mostrare ESATTAMENTE cosa arrivera'
--    a casa al destinatario.
--
-- Idempotente: ADD COLUMN IF NOT EXISTS.
-- ============================================================

BEGIN;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS is_physical_gift boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.experiences.is_physical_gift IS
'true se il regalo e'' un oggetto fisico spedito al destinatario (es. bottiglia 24Bottles), false per esperienze digitali (voucher GYG, biglietti VVT). Determina UI badge + flusso apertura pacco.';

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS shipping_estimated_days integer;

COMMENT ON COLUMN public.experiences.shipping_estimated_days IS
'Giorni stimati dal pagamento alla consegna al destinatario. Solo per is_physical_gift=true. Es. 24Bottles Italia = 3-5 giorni.';

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS product_image_url text;

COMMENT ON COLUMN public.experiences.product_image_url IS
'URL immagine del prodotto fisico (es. bottiglia singola su sfondo neutro). Distinto da image_url (hero card del catalogo). Usata nel pacco digitale aperto dal destinatario per mostrare esattamente cosa ricevera''.';

-- Index su is_physical_gift per filtri catalog rapidi
CREATE INDEX IF NOT EXISTS idx_experiences_physical
  ON public.experiences (is_physical_gift)
  WHERE is_physical_gift = true;

-- Aggiungiamo partner 'tradedoubler' se non esiste (e' il network
-- affiliate principale per 24Bottles)
INSERT INTO public.experience_partners
  (slug, display_name, base_affiliate_url, commission_rate, cookie_window_days, active, notes)
VALUES (
  'tradedoubler',
  'TradeDoubler Network',
  'https://tracker.tradedoubler.com',
  0.060,
  30,
  true,
  'Network affiliate principale per 24Bottles e altri brand di regalistica fisica IT. Onboarded 2026-05-21.'
)
ON CONFLICT (slug) DO UPDATE SET active = true,
                                 commission_rate = 0.060,
                                 notes = EXCLUDED.notes;

COMMIT;
