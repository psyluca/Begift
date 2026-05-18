-- ============================================================
-- PATCH: 2 esperienze Lucca con URL GYG reali
-- ============================================================
-- Le righe gyg-lucca-wine-villa e gyg-puccini-festival erano state
-- aggiunte al DB il 2026-05-15 con URL placeholder (t77002/t77003,
-- inventati durante il seed Lucca) — partner_id=17 era presente ma i
-- product ID non esistono su GYG, quindi i link erano rotti.
--
-- Trovati prodotti GYG reali via WebSearch 2026-05-18:
--   - gyg-lucca-wine-villa  → t49379 "From Pisa or Lucca: Half-Day
--     Tuscany Chianti Wine Tasting" (tour vero dalla zona Lucca)
--   - gyg-puccini-festival  → t262952 "Lucca: Puccini Festival Opera
--     Recitals and Concerts" — sono i concerti settimanali al
--     Centro Studi Pucciniani di Lucca (non l'opera estiva di Torre
--     del Lago, che NON ha un prodotto GYG diretto). Più gift-friendly
--     perche' attivo tutto l'anno (la versione Torre del Lago era
--     stagionale luglio-agosto).
--
-- TODO Luca: image_url lasciato NULL — quando hai 30s, prendi un
-- 'tour_img/<hash>.jpg' dal CDN dalla pagina dei due prodotti.
-- ============================================================

BEGIN;

-- gyg-lucca-wine-villa → tour vino reale Tuscany Hills da Lucca/Pisa
UPDATE public.experiences SET
  title = 'Da Pisa o Lucca: tour di mezza giornata sulle colline toscane con degustazione',
  external_url = 'https://www.getyourguide.com/it-it/pisa-l157/tuscan-hills-half-day-wine-tour-from-pisa-or-lucca-t49379/',
  price_min_cents = 9000,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/pisa-l157/tuscan-hills-half-day-wine-tour-from-pisa-or-lucca-t49379/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-lucca-wine-villa';

-- gyg-puccini-festival → concerti Puccini settimanali a Lucca (anno round)
UPDATE public.experiences SET
  title = 'Lucca: concerti e recital del Festival Puccini',
  description = 'Concerti pucciniani all''Oratorio di San Giuseppe al Museo della Cattedrale di Lucca (dietro la chiesa di San Giovanni). Repertori diversi ogni sera della settimana: arie di Puccini, opera italiana, brani napoletani. 1 ora circa.',
  city = 'Lucca',
  external_url = 'https://www.getyourguide.com/it-it/lucca-l1517/lucca-puccini-festival-opera-recitals-and-concerts-t262952/',
  price_min_cents = 3300,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/lucca-l1517/lucca-puccini-festival-opera-recitals-and-concerts-t262952/?partner_id=17&cmp={gift_id}',
  curator_notes = 'Sostituito 2026-05-18 dal prodotto stagionale Torre del Lago (t77003 placeholder) al prodotto annuale Lucca t262952. Più gift-friendly perche'' attivo tutto l''anno.',
  active = true
 WHERE external_id = 'gyg-puccini-festival';

-- ── Verifica ──
SELECT external_id, title, city, price_min_cents, active,
       CASE WHEN affiliate_url_template LIKE '%partner_id=17%' AND affiliate_url_template NOT LIKE '%t77002%' AND affiliate_url_template NOT LIKE '%t77003%' THEN 'OK' ELSE 'CHECK' END AS pid_check,
       CASE WHEN image_url IS NULL THEN 'TODO_IMG' WHEN image_url LIKE 'https://cdn.getyourguide.com/%' THEN 'OK' ELSE 'CHECK' END AS img_check
  FROM public.experiences
 WHERE external_id IN ('gyg-lucca-wine-villa', 'gyg-puccini-festival');

COMMIT;
