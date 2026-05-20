-- ============================================================
-- SEED 10 eventi VivaTicket — riattivazione Awin partner
-- ============================================================
-- Eseguire MANUALMENTE su Supabase SQL Editor.
-- Idempotente (ON CONFLICT DO NOTHING su external_id).
--
-- Background:
--   2026-05-20: Awin approva la partnership VivaTicket IT.
--   Conversion rate 6.69%, approval 98.29%, EPC 0.10 EUR, payment 105 days.
--
-- PRIMA di eseguire questo SQL: sostituisci {AWINMID_VVT} con il MID
-- numerico di VivaTicket (lo trovi cliccando 'Promuovi' nel pannello Awin
-- e ispezionando l'URL generato).
--
-- Il placeholder {affiliate_id} resta cosi' com'e' — viene sostituito
-- runtime dal codice usando la env var AWIN_AFFILIATE_ID.
-- ============================================================

BEGIN;

-- Step 1: reinserisci awin in experience_partners (era stato cancellato
-- dal cleanup_non_gyg_partners.sql del 2026-05-18, ma ora e' attivo).
INSERT INTO public.experience_partners
  (slug, display_name, base_affiliate_url, commission_rate, cookie_window_days, active, notes)
VALUES (
  'awin', 'Awin Network', 'https://www.awin1.com', 0.067, 30, true,
  'Riattivato 2026-05-20 dopo approvazione VivaTicket IT. Conversion rate 6.69%, approval 98.29%, payment 105d.'
)
ON CONFLICT (slug) DO UPDATE SET active = true, commission_rate = 0.067,
                                  notes = EXCLUDED.notes;

-- Step 2: seed 10 eventi VivaTicket
DO $$
DECLARE
  v_awin_id uuid;
BEGIN
  SELECT id INTO v_awin_id FROM public.experience_partners WHERE slug = 'awin';

  IF v_awin_id IS NULL THEN
    RAISE EXCEPTION 'awin partner non trovato. Step 1 fallito.';
  END IF;

  -- vt-vasco-live-2026: Vasco Live 2026
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url,
    city, country, category, duration_minutes, price_min_cents,
    tags, affiliate_url_template, curator_notes, external_url
  ) VALUES (
    v_awin_id, 'vt-vasco-live-2026', 'Vasco Live 2026',
    'Il tour estivo 2026 di Vasco Rossi. Date negli stadi italiani: Milano, Roma, Bari, Salerno. Esperienza concerto rock italiano per eccellenza.',
    NULL,  -- image_url: TODO Luca prende screenshot dal sito
    NULL, 'IT', 'music', 180, 6500,
    ARRAY['music', 'must-see', 'couples', 'friends', 'summer'],
    'https://www.awin1.com/cread.php?awinmid={AWINMID_VVT}&awinaffid={affiliate_id}&clickref={gift_id}&ued=https%3A%2F%2Fwww.vivaticket.com%2Fit%2Fticket%2Fvasco-live-2026%2F270804',
    'VivaTicket evento, seedato 2026-05-20. TODO Luca: image_url + verifica prezzo medio dopo prima conversione.',
    'https://www.vivaticket.com/it/ticket/vasco-live-2026/270804'
  ) ON CONFLICT (external_id) DO NOTHING;

  -- vt-arena-opera-festival-2026: Arena Opera Festival 2026
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url,
    city, country, category, duration_minutes, price_min_cents,
    tags, affiliate_url_template, curator_notes, external_url
  ) VALUES (
    v_awin_id, 'vt-arena-opera-festival-2026', 'Arena Opera Festival 2026',
    '103a edizione del Festival lirico all''Arena di Verona, 12 giugno - 12 settembre 2026. Aida, Carmen, Nabucco e altri capolavori sotto le stelle.',
    NULL,  -- image_url: TODO Luca prende screenshot dal sito
    'Verona', 'IT', 'show', 240, 4500,
    ARRAY['art', 'culture', 'couples', 'date-night', 'romantic', 'must-see', 'summer'],
    'https://www.awin1.com/cread.php?awinmid={AWINMID_VVT}&awinaffid={affiliate_id}&clickref={gift_id}&ued=https%3A%2F%2Fwww.vivaticket.com%2Fit%2Fticket%2Farena-opera-festival-2026%2F265345',
    'VivaTicket evento, seedato 2026-05-20. TODO Luca: image_url + verifica prezzo medio dopo prima conversione.',
    'https://www.vivaticket.com/it/ticket/arena-opera-festival-2026/265345'
  ) ON CONFLICT (external_id) DO NOTHING;

  -- vt-aida-arena-2026: Aida — Arena di Verona 2026
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url,
    city, country, category, duration_minutes, price_min_cents,
    tags, affiliate_url_template, curator_notes, external_url
  ) VALUES (
    v_awin_id, 'vt-aida-arena-2026', 'Aida — Arena di Verona 2026',
    'Aida di Verdi all''Arena di Verona. Produzione iconica del Festival lirico, regia tradizionale con sfilata egizia. Stagione estiva 2026.',
    NULL,  -- image_url: TODO Luca prende screenshot dal sito
    'Verona', 'IT', 'show', 240, 5500,
    ARRAY['art', 'couples', 'date-night', 'romantic', 'must-see'],
    'https://www.awin1.com/cread.php?awinmid={AWINMID_VVT}&awinaffid={affiliate_id}&clickref={gift_id}&ued=https%3A%2F%2Fwww.vivaticket.com%2Fit%2Fticket%2Faida%2F265238',
    'VivaTicket evento, seedato 2026-05-20. TODO Luca: image_url + verifica prezzo medio dopo prima conversione.',
    'https://www.vivaticket.com/it/ticket/aida/265238'
  ) ON CONFLICT (external_id) DO NOTHING;

  -- vt-coldplay-2026: Coldplay — Music of the Spheres World Tour
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url,
    city, country, category, duration_minutes, price_min_cents,
    tags, affiliate_url_template, curator_notes, external_url
  ) VALUES (
    v_awin_id, 'vt-coldplay-2026', 'Coldplay — Music of the Spheres World Tour',
    'Tour mondiale Coldplay con luci e bracciali LED sincronizzati. Date europee 2026 (Italia da confermare). Esperienza concerto pop internazionale.',
    NULL,  -- image_url: TODO Luca prende screenshot dal sito
    NULL, 'IT', 'music', 180, 8500,
    ARRAY['music', 'international', 'couples', 'friends', 'must-see'],
    'https://www.awin1.com/cread.php?awinmid={AWINMID_VVT}&awinaffid={affiliate_id}&clickref={gift_id}&ued=https%3A%2F%2Fwww.vivaticket.com%2Fit%2Ftour%2Fcoldplay-music-of-the-spheres%2F3134',
    'VivaTicket evento, seedato 2026-05-20. TODO Luca: image_url + verifica prezzo medio dopo prima conversione.',
    'https://www.vivaticket.com/it/tour/coldplay-music-of-the-spheres/3134'
  ) ON CONFLICT (external_id) DO NOTHING;

  -- vt-notre-dame-de-paris: Notre Dame de Paris — il musical
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url,
    city, country, category, duration_minutes, price_min_cents,
    tags, affiliate_url_template, curator_notes, external_url
  ) VALUES (
    v_awin_id, 'vt-notre-dame-de-paris', 'Notre Dame de Paris — il musical',
    'Il musical iconico di Riccardo Cocciante e Pasquale Panella torna in tournée italiana. Una storia d''amore e cattedrale che ha emozionato milioni.',
    NULL,  -- image_url: TODO Luca prende screenshot dal sito
    NULL, 'IT', 'show', 150, 4500,
    ARRAY['music', 'couples', 'date-night', 'romantic', 'culture'],
    'https://www.awin1.com/cread.php?awinmid={AWINMID_VVT}&awinaffid={affiliate_id}&clickref={gift_id}&ued=https%3A%2F%2Fwww.vivaticket.com%2Fit%2Fticket%2Fnotre-dame-de-paris%2F263241',
    'VivaTicket evento, seedato 2026-05-20. TODO Luca: image_url + verifica prezzo medio dopo prima conversione.',
    'https://www.vivaticket.com/it/ticket/notre-dame-de-paris/263241'
  ) ON CONFLICT (external_id) DO NOTHING;

  -- vt-mamma-mia: Mamma Mia! — il musical degli ABBA
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url,
    city, country, category, duration_minutes, price_min_cents,
    tags, affiliate_url_template, curator_notes, external_url
  ) VALUES (
    v_awin_id, 'vt-mamma-mia', 'Mamma Mia! — il musical degli ABBA',
    'Il musical dei successi ABBA: Dancing Queen, Mamma Mia, Waterloo. In tournée per teatri italiani. Per chi vuole due ore di puro divertimento.',
    NULL,  -- image_url: TODO Luca prende screenshot dal sito
    NULL, 'IT', 'show', 150, 4000,
    ARRAY['music', 'friends', 'family', 'couples', 'international'],
    'https://www.awin1.com/cread.php?awinmid={AWINMID_VVT}&awinaffid={affiliate_id}&clickref={gift_id}&ued=https%3A%2F%2Fwww.vivaticket.com%2Fit%2FTicket%2Fmamma-mia%2F230132',
    'VivaTicket evento, seedato 2026-05-20. TODO Luca: image_url + verifica prezzo medio dopo prima conversione.',
    'https://www.vivaticket.com/it/Ticket/mamma-mia/230132'
  ) ON CONFLICT (external_id) DO NOTHING;

  -- vt-cinecitta-world: Cinecittà World
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url,
    city, country, category, duration_minutes, price_min_cents,
    tags, affiliate_url_template, curator_notes, external_url
  ) VALUES (
    v_awin_id, 'vt-cinecitta-world', 'Cinecittà World',
    'Il parco divertimenti del cinema italiano. Roma sud, 30 attrazioni a tema film, eventi notturni in stagione. Per famiglie e amici.',
    NULL,  -- image_url: TODO Luca prende screenshot dal sito
    'Roma', 'IT', 'outdoor', 480, 3500,
    ARRAY['family', 'friends', 'hands-on', 'full-day'],
    'https://www.awin1.com/cread.php?awinmid={AWINMID_VVT}&awinaffid={affiliate_id}&clickref={gift_id}&ued=https%3A%2F%2Fwww.vivaticket.com%2Fit%2Fticket%2Fcinecitta-world%2F238364',
    'VivaTicket evento, seedato 2026-05-20. TODO Luca: image_url + verifica prezzo medio dopo prima conversione.',
    'https://www.vivaticket.com/it/ticket/cinecitta-world/238364'
  ) ON CONFLICT (external_id) DO NOTHING;

  -- vt-milan-juventus: Milan-Juventus — Serie A 2025/26
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url,
    city, country, category, duration_minutes, price_min_cents,
    tags, affiliate_url_template, curator_notes, external_url
  ) VALUES (
    v_awin_id, 'vt-milan-juventus', 'Milan-Juventus — Serie A 2025/26',
    'Una delle partite più sentite della Serie A. Stadio San Siro, atmosfera unica. Per tifosi rossoneri e bianconeri (o appassionati di calcio classico).',
    NULL,  -- image_url: TODO Luca prende screenshot dal sito
    'Milano', 'IT', 'sport', 120, 6000,
    ARRAY['sport', 'friends', 'must-see', 'international'],
    'https://www.awin1.com/cread.php?awinmid={AWINMID_VVT}&awinaffid={affiliate_id}&clickref={gift_id}&ued=https%3A%2F%2Fwww.vivaticket.com%2Fit%2Fticket%2Fserie-a-enilive-2025-26-ac-milan-juventus-fc%2F298479',
    'VivaTicket evento, seedato 2026-05-20. TODO Luca: image_url + verifica prezzo medio dopo prima conversione.',
    'https://www.vivaticket.com/it/ticket/serie-a-enilive-2025-26-ac-milan-juventus-fc/298479'
  ) ON CONFLICT (external_id) DO NOTHING;

  -- vt-bologna-fc: Bologna FC — biglietti partite
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url,
    city, country, category, duration_minutes, price_min_cents,
    tags, affiliate_url_template, curator_notes, external_url
  ) VALUES (
    v_awin_id, 'vt-bologna-fc', 'Bologna FC — biglietti partite',
    'Le partite del Bologna allo Stadio Dall''Ara. Selezione di match casalinghi della stagione 2025/26. Tifo storico, settori per famiglie e curva.',
    NULL,  -- image_url: TODO Luca prende screenshot dal sito
    'Bologna', 'IT', 'sport', 120, 2500,
    ARRAY['sport', 'friends', 'family'],
    'https://www.awin1.com/cread.php?awinmid={AWINMID_VVT}&awinaffid={affiliate_id}&clickref={gift_id}&ued=https%3A%2F%2Fwww.vivaticket.com%2Fit%2Fticket%2Fbologna-fc-biglietti%2F213608',
    'VivaTicket evento, seedato 2026-05-20. TODO Luca: image_url + verifica prezzo medio dopo prima conversione.',
    'https://www.vivaticket.com/it/ticket/bologna-fc-biglietti/213608'
  ) ON CONFLICT (external_id) DO NOTHING;

  -- vt-lucca-comics-2026: Lucca Comics & Games 2026
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url,
    city, country, category, duration_minutes, price_min_cents,
    tags, affiliate_url_template, curator_notes, external_url
  ) VALUES (
    v_awin_id, 'vt-lucca-comics-2026', 'Lucca Comics & Games 2026',
    'Il più grande festival europeo di fumetto, gioco e cultura pop. Lucca ottobre/novembre 2026. Pass giornalieri o full festival.',
    NULL,  -- image_url: TODO Luca prende screenshot dal sito
    'Lucca', 'IT', 'outdoor', 540, 3500,
    ARRAY['family', 'friends', 'art', 'hands-on', 'full-day', 'local'],
    'https://www.awin1.com/cread.php?awinmid={AWINMID_VVT}&awinaffid={affiliate_id}&clickref={gift_id}&ued=https%3A%2F%2Fwww.vivaticket.com%2F%3Fop%3Dluccacomics',
    'VivaTicket evento, seedato 2026-05-20. TODO Luca: image_url + verifica prezzo medio dopo prima conversione.',
    'https://www.vivaticket.com/?op=luccacomics'
  ) ON CONFLICT (external_id) DO NOTHING;

END $$;

-- Step 3: verifica
SELECT external_id, title, city, price_min_cents,
       CASE WHEN affiliate_url_template LIKE '%{AWINMID_VVT}%' THEN 'MID_TODO'
            WHEN affiliate_url_template LIKE '%awinmid=%' THEN 'OK' ELSE 'CHECK' END AS mid_status
FROM public.experiences
WHERE external_id LIKE 'vt-%'
ORDER BY category, external_id;

COMMIT;

-- ============================================================
-- DOPO L'INSERT: sostituisci {AWINMID_VVT} con il valore reale
-- ============================================================
--
-- Una volta che hai il awinmid di VivaTicket (lo trovi cliccando
-- 'Promuovi' sul pannello Awin, accanto a VivaTicket IT, e
-- copiando il MID dall'URL generato), esegui questo UPDATE:
--
--   UPDATE public.experiences
--     SET affiliate_url_template = REPLACE(affiliate_url_template, '{AWINMID_VVT}', 'IL_NUMERO_VERO')
--    WHERE external_id LIKE 'vt-%';
--
-- (sostituisci IL_NUMERO_VERO con il MID effettivo, es. '12345')