-- ============================================================
-- SEED 24Bottles — 8 prodotti flagship come "regalo fisico"
-- ============================================================
-- Da eseguire MANUALMENTE su Supabase SQL Editor dopo migration 028.
-- Idempotente (ON CONFLICT DO NOTHING su external_id).
--
-- Background 2026-05-21:
--   24Bottles e' il primo merchant "regalo fisico" integrato in BeGift.
--   Brand italiano di borracce in acciaio, partner Awin/TradeDoubler.
--   Modello affiliate: redirect a 24bottles.com per pagamento, mail
--   conferma forwardata a BeGift, pacco digitale mostra immagine
--   bottiglia + data consegna stimata.
--
-- TODO Luca quando setta credenziali TradeDoubler:
--   - Sostituire {td_program_id} in affiliate_url_template con
--     l'effettivo program_id 24Bottles su TradeDoubler.
--   - Aggiungere image_url e product_image_url per ogni bottiglia
--     (screenshot da 24bottles.com).
--   - Aggiungere cdn.24bottles.com (o dominio CDN reale) alla whitelist
--     in app/api/img-proxy/route.ts.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_td_id uuid;
BEGIN
  SELECT id INTO v_td_id FROM public.experience_partners WHERE slug = 'tradedoubler';

  IF v_td_id IS NULL THEN
    RAISE EXCEPTION 'Partner tradedoubler non trovato. Lanciare prima migration 028.';
  END IF;

  -- ─── Urban Bottle 500ml — Lagoon Matte ─────────────────────
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url, product_image_url,
    city, country, category, tags, price_min_cents, currency,
    affiliate_url_template, external_url,
    is_physical_gift, shipping_estimated_days,
    source, active, curator_notes
  ) VALUES (
    v_td_id, '24b-urban-500-lagoon',
    '24Bottles Urban 500ml — Lagoon Matte',
    'La borraccia classica 24Bottles in acciaio inox. Capacita 500ml, colore lagoon matte. Leggera, durevole, plastic-free.',
    NULL, NULL,
    NULL, 'IT', 'gear',
    ARRAY['friends', 'must-see']::text[],
    2000, 'EUR',
    'https://clk.tradedoubler.com/click?p={td_program_id}&a={affiliate_id}&epi={gift_id}&url=https%3A%2F%2Fwww.24bottles.com%2Furban-500-lagoon-matte%2F',
    'https://www.24bottles.com/urban-500-lagoon-matte/',
    true, 4,
    'manual', true,
    '2026-05-21: seed 24Bottles. TODO image_url + product_image_url da popolare.'
  )
  ON CONFLICT (external_id) DO NOTHING;

  -- ─── Urban Bottle 500ml — Rose Quartz ──────────────────────
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url, product_image_url,
    city, country, category, tags, price_min_cents, currency,
    affiliate_url_template, external_url,
    is_physical_gift, shipping_estimated_days,
    source, active, curator_notes
  ) VALUES (
    v_td_id, '24b-urban-500-rose',
    '24Bottles Urban 500ml — Rose Quartz',
    'La classica Urban in tonalita rosa quarzo. Capacita 500ml, acciaio inox, plastic-free. Regalo perfetto per chi cerca uno stile delicato.',
    NULL, NULL,
    NULL, 'IT', 'gear',
    ARRAY['romantic', 'couples']::text[],
    2000, 'EUR',
    'https://clk.tradedoubler.com/click?p={td_program_id}&a={affiliate_id}&epi={gift_id}&url=https%3A%2F%2Fwww.24bottles.com%2Furban-500-rose-quartz%2F',
    'https://www.24bottles.com/urban-500-rose-quartz/',
    true, 4,
    'manual', true,
    '2026-05-21: seed 24Bottles.'
  )
  ON CONFLICT (external_id) DO NOTHING;

  -- ─── Clima Bottle 500ml — Black Stone (isotermica) ─────────
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url, product_image_url,
    city, country, category, tags, price_min_cents, currency,
    affiliate_url_template, external_url,
    is_physical_gift, shipping_estimated_days,
    source, active, curator_notes
  ) VALUES (
    v_td_id, '24b-clima-500-black',
    '24Bottles Clima 500ml — Black Stone (isotermica)',
    'Borraccia termica 24Bottles. Mantiene fredde le bevande 24 ore, calde 12 ore. Capacita 500ml, acciaio inox doppia parete, colore black stone.',
    NULL, NULL,
    NULL, 'IT', 'gear',
    ARRAY['must-see', 'hiking', 'adventure']::text[],
    3200, 'EUR',
    'https://clk.tradedoubler.com/click?p={td_program_id}&a={affiliate_id}&epi={gift_id}&url=https%3A%2F%2Fwww.24bottles.com%2Fclima-500-black-stone%2F',
    'https://www.24bottles.com/clima-500-black-stone/',
    true, 4,
    'manual', true,
    '2026-05-21: seed 24Bottles.'
  )
  ON CONFLICT (external_id) DO NOTHING;

  -- ─── Clima Bottle 500ml — Whale Blue ───────────────────────
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url, product_image_url,
    city, country, category, tags, price_min_cents, currency,
    affiliate_url_template, external_url,
    is_physical_gift, shipping_estimated_days,
    source, active, curator_notes
  ) VALUES (
    v_td_id, '24b-clima-500-whale',
    '24Bottles Clima 500ml — Whale Blue (isotermica)',
    'Borraccia termica Clima, capacita 500ml, colore whale blue. Stessa qualita Clima in una tonalita oceanica vivida.',
    NULL, NULL,
    NULL, 'IT', 'gear',
    ARRAY['sea', 'must-see', 'adventure']::text[],
    3200, 'EUR',
    'https://clk.tradedoubler.com/click?p={td_program_id}&a={affiliate_id}&epi={gift_id}&url=https%3A%2F%2Fwww.24bottles.com%2Fclima-500-whale-blue%2F',
    'https://www.24bottles.com/clima-500-whale-blue/',
    true, 4,
    'manual', true,
    '2026-05-21: seed 24Bottles.'
  )
  ON CONFLICT (external_id) DO NOTHING;

  -- ─── Travel Tumbler 350ml — Cappuccino Brown ───────────────
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url, product_image_url,
    city, country, category, tags, price_min_cents, currency,
    affiliate_url_template, external_url,
    is_physical_gift, shipping_estimated_days,
    source, active, curator_notes
  ) VALUES (
    v_td_id, '24b-travel-tumbler-350',
    '24Bottles Travel Tumbler 350ml — Cappuccino Brown',
    'Tumbler portatile per caffe e bevande calde, capacita 350ml. Tappo a tenuta, perfetto per il commuter mattutino. Colore cappuccino brown.',
    NULL, NULL,
    NULL, 'IT', 'gear',
    ARRAY['foodie', 'friends']::text[],
    2500, 'EUR',
    'https://clk.tradedoubler.com/click?p={td_program_id}&a={affiliate_id}&epi={gift_id}&url=https%3A%2F%2Fwww.24bottles.com%2Ftravel-tumbler-350-cappuccino-brown%2F',
    'https://www.24bottles.com/travel-tumbler-350-cappuccino-brown/',
    true, 4,
    'manual', true,
    '2026-05-21: seed 24Bottles.'
  )
  ON CONFLICT (external_id) DO NOTHING;

  -- ─── Light Bottle 500ml — Dolomia ──────────────────────────
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url, product_image_url,
    city, country, category, tags, price_min_cents, currency,
    affiliate_url_template, external_url,
    is_physical_gift, shipping_estimated_days,
    source, active, curator_notes
  ) VALUES (
    v_td_id, '24b-light-500-dolomia',
    '24Bottles Light 500ml — Dolomia',
    'La piu leggera della linea: acciaio inox sottile, 60g in meno della Urban. Capacita 500ml, colore dolomia. Per chi viaggia leggero.',
    NULL, NULL,
    NULL, 'IT', 'gear',
    ARRAY['mountains', 'hiking', 'adventure']::text[],
    1800, 'EUR',
    'https://clk.tradedoubler.com/click?p={td_program_id}&a={affiliate_id}&epi={gift_id}&url=https%3A%2F%2Fwww.24bottles.com%2Flight-500-dolomia%2F',
    'https://www.24bottles.com/light-500-dolomia/',
    true, 4,
    'manual', true,
    '2026-05-21: seed 24Bottles.'
  )
  ON CONFLICT (external_id) DO NOTHING;

  -- ─── Big Bottle 1L — Mountain ──────────────────────────────
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url, product_image_url,
    city, country, category, tags, price_min_cents, currency,
    affiliate_url_template, external_url,
    is_physical_gift, shipping_estimated_days,
    source, active, curator_notes
  ) VALUES (
    v_td_id, '24b-big-1000-mountain',
    '24Bottles Big 1L — Mountain',
    'Borraccia capacita 1 litro per chi beve molto: sport, palestra, lunghe giornate fuori. Acciaio inox, colore mountain.',
    NULL, NULL,
    NULL, 'IT', 'gear',
    ARRAY['adventure', 'hiking', 'mountains']::text[],
    3000, 'EUR',
    'https://clk.tradedoubler.com/click?p={td_program_id}&a={affiliate_id}&epi={gift_id}&url=https%3A%2F%2Fwww.24bottles.com%2Fbig-1000-mountain%2F',
    'https://www.24bottles.com/big-1000-mountain/',
    true, 4,
    'manual', true,
    '2026-05-21: seed 24Bottles.'
  )
  ON CONFLICT (external_id) DO NOTHING;

  -- ─── Tea/Coffee Cup 300ml — Wonderland ─────────────────────
  INSERT INTO public.experiences (
    partner_id, external_id, title, description, image_url, product_image_url,
    city, country, category, tags, price_min_cents, currency,
    affiliate_url_template, external_url,
    is_physical_gift, shipping_estimated_days,
    source, active, curator_notes
  ) VALUES (
    v_td_id, '24b-coffee-300-wonderland',
    '24Bottles Tea/Coffee Cup 300ml — Wonderland',
    'Bicchiere riutilizzabile per caffe e tea da asporto, capacita 300ml. Adatto a tutte le macchine self-service. Colore wonderland.',
    NULL, NULL,
    NULL, 'IT', 'gear',
    ARRAY['foodie', 'friends']::text[],
    2200, 'EUR',
    'https://clk.tradedoubler.com/click?p={td_program_id}&a={affiliate_id}&epi={gift_id}&url=https%3A%2F%2Fwww.24bottles.com%2Ftea-coffee-cup-300-wonderland%2F',
    'https://www.24bottles.com/tea-coffee-cup-300-wonderland/',
    true, 4,
    'manual', true,
    '2026-05-21: seed 24Bottles.'
  )
  ON CONFLICT (external_id) DO NOTHING;

END $$;

COMMIT;

-- Verifica
SELECT external_id, title, price_min_cents, is_physical_gift, shipping_estimated_days, active
  FROM public.experiences
 WHERE external_id LIKE '24b-%'
 ORDER BY external_id;
