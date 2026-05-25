-- ============================================================================
-- Fix link GYG "Lezione pasta + tour gastronomico Trastevere"
-- ============================================================================
-- Eseguire una volta su Supabase Studio (SQL Editor).
-- Forza l'URL corretto (t261067) e rimuove il prefisso /it-it/ che dava errore.
--
-- Allineato a:
--   - supabase/seed_experiences.sql riga 45-53
--   - supabase/update_catalog_26_real.sql riga 32-41
--
-- Da: pasta-cooking-class-t98432 (link morto)
--   o it-it/...-t261067/ (prefisso locale non funzionante)
-- A:  /roma-l33/roma-tour-gastronomico-dello-street-food-a-trastevere-t261067/
-- ============================================================================

UPDATE public.experiences SET
  title = 'Roma: lezione di preparazione della pasta a Trastevere con tour gastronomico',
  external_url = 'https://www.getyourguide.com/roma-l33/roma-tour-gastronomico-dello-street-food-a-trastevere-t261067/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/638f4522d732b.jpeg',
  price_min_cents = 8300,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/roma-l33/roma-tour-gastronomico-dello-street-food-a-trastevere-t261067/?partner_id=17&cmp={gift_id}',
  active = true,
  updated_at = NOW()
 WHERE external_id = 'gyg-rome-pasta-class';

-- Verifica
SELECT external_id, title, external_url, price_min_cents, active
  FROM public.experiences
 WHERE external_id = 'gyg-rome-pasta-class';
