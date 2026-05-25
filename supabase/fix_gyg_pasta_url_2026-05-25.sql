-- ============================================================================
-- Fix link GYG "Lezione pasta + tour street food Trastevere"
-- ============================================================================
-- Eseguire una volta su Supabase Studio (SQL Editor).
--
-- Tour ID univoco GYG: t261067
-- Cosa NON funziona:
--   - https://www.getyourguide.com/roma-l33/roma-tour-gastronomico-dello-
--     street-food-a-trastevere-t261067/
--     (slug ITALIANO su .com — e' uno slug dinamico che funziona solo se
--     hai il ?ranking_uuid= della tua sessione. In condivisione esterna
--     porta a redirect strani / 404).
--
-- Cosa FUNZIONA (URL canonico stabile su .com):
--   https://www.getyourguide.com/rome-l33/rome-trastevere-street-food-tour-t261067/
--
-- Allineato a:
--   - supabase/seed_experiences.sql
--   - supabase/update_catalog_26_real.sql
-- ============================================================================

UPDATE public.experiences SET
  title = 'Roma: lezione di pasta a Trastevere con tour street food',
  external_url = 'https://www.getyourguide.com/rome-l33/rome-trastevere-street-food-tour-t261067/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/638f4522d732b.jpeg',
  price_min_cents = 8300,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/rome-l33/rome-trastevere-street-food-tour-t261067/?partner_id=17&cmp={gift_id}',
  active = true,
  updated_at = NOW()
 WHERE external_id = 'gyg-rome-pasta-class';

-- Verifica
SELECT external_id, title, external_url, price_min_cents, active
  FROM public.experiences
 WHERE external_id = 'gyg-rome-pasta-class';
