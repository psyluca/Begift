-- ============================================================
-- ONBOARDING manuale di un account BeGift Business
-- ============================================================
-- Da eseguire UNA VOLTA PER CLIENTE da Supabase Dashboard → SQL Editor.
--
-- Prerequisiti:
--   1. La cliente deve essere registrata su BeGift come utente normale
--      (mail + OTP). Cosi' esiste una riga in profiles con il suo
--      auth.users.id.
--   2. Sostituisci i placeholder qui sotto.
--
-- Cosa fa:
--   - INSERT una riga in business_accounts collegata al profilo
--   - Trigger DB setta automaticamente profiles.is_business = true
--
-- Dopo l'esecuzione:
--   - La cliente puo' loggarsi normalmente, andare su /business e
--     usare la dashboard.
--   - Comunica alla cliente: la mail collegata + il link /business
-- ============================================================

-- ───── STEP 1: Trova l'user_id della cliente (eseguilo per controllare) ─────

SELECT id, email, display_name
  FROM public.profiles
 WHERE email = 'CLIENTE_EMAIL_QUI@example.com'
 LIMIT 1;

-- Se la cliente non e' nei profili → chiedile di registrarsi su begift.app
-- usando la mail dell'attivita', POI ri-esegui questa query.

-- ───── STEP 2: Crea il business account ─────

INSERT INTO public.business_accounts (
  user_id,
  business_name,
  contact_email,
  contact_phone,
  brand_color,
  status,
  pilot_started_at,
  pilot_ends_at,
  internal_notes
)
VALUES (
  -- Sostituisci con l'user_id dello STEP 1
  'UUID_DELLA_CLIENTE_QUI'::uuid,

  'Centro Massaggi Aurora',                      -- business_name
  'aurora@example.com',                          -- contact_email visibile ai clienti
  '+39 333 1234567',                              -- contact_phone (opzionale, NULL ok)
  '#D4537E',                                      -- brand_color: hex accent della pagina apertura
                                                  -- (NULL = usa pink BeGift default)

  'active',                                       -- status: 'active' per attivare subito
  now(),                                          -- pilot_started_at
  now() + interval '6 months',                    -- pilot_ends_at (pilot gratis 6 mesi)

  -- Note interne (visibili solo a Luca)
  'Prima cliente B2B 2026-05-18. Pilot gratis 6 mesi in cambio di feedback + caso studio.'
);

-- ───── STEP 3: Verifica ─────

SELECT
  ba.id AS business_id,
  ba.business_name,
  ba.status,
  ba.pilot_started_at,
  ba.pilot_ends_at,
  p.email AS owner_email,
  p.is_business AS profile_is_business_flag
FROM public.business_accounts ba
JOIN public.profiles p ON p.id = ba.user_id
WHERE ba.contact_email = 'aurora@example.com';

-- Atteso: 1 riga, status = active, profile_is_business_flag = true
-- Se profile_is_business_flag e' false, il trigger non ha funzionato
-- (raro, controlla che migration 025 sia stata applicata).
