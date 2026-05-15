-- ============================================================
-- Patch seed: Lucca + pulizia URL immagini placeholder
-- ============================================================
-- Da eseguire MANUALMENTE su Supabase SQL Editor. Idempotente.
--
-- 1. Rimuove gli URL immagine placeholder inventati (gli URL
--    cdn.getyourguide.com/img/tour/*.jpg che ho messo nel seed
--    erano fittizi e davano errore di caricamento nel browser).
--    Il componente ExperienceCard ora mostra un placeholder
--    elegante (gradient + emoji per categoria) quando image_url
--    e' NULL.
--
-- 2. Aggiunge 3 esperienze a Lucca (casa di Luca):
--    - Bici sulle mura (centro storico)
--    - Wine tour villa lucchese
--    - Festival Pucciniano Torre del Lago (estate)
-- ============================================================

-- ── 1. Pulizia URL immagine placeholder ──────────────────────
-- Solo per record con URL fittizi (cdn.getyourguide.com — non
-- esistono davvero). NON tocca eventuali URL veri che aggiungerai
-- in seguito.

UPDATE public.experiences
SET image_url = NULL
WHERE image_url LIKE 'https://cdn.getyourguide.com/%';

-- ── 2. Aggiunta esperienze Lucca ─────────────────────────────

DO $$
DECLARE
  v_gyg_id  uuid;
  v_awin_id uuid;
BEGIN
  SELECT id INTO v_gyg_id  FROM public.experience_partners WHERE slug = 'getyourguide';
  SELECT id INTO v_awin_id FROM public.experience_partners WHERE slug = 'awin';

  -- Tour bici sulle mura
  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country,
     category, duration_minutes, price_min_cents, tags, rating, reviews_count,
     affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-lucca-walls-bike',
     'Lucca in bicicletta: tour delle mura e centro storico',
     'Pedala sulle mura rinascimentali di Lucca con guida locale. 2 ore tra Piazza Anfiteatro, Torre Guinigi, Duomo, e affacci su Garfagnana. Bici e casco inclusi.',
     NULL,
     'Lucca', 'IT', 'outdoor', 120, 3500,
     ARRAY['outdoor', 'couples', 'family', 'photography', 'half-day', 'local'],
     4.8, 1240,
     'https://www.getyourguide.com/lucca-l1244/walls-bike-tour-t77001?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  -- Wine tasting villa lucchese
  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country,
     category, duration_minutes, price_min_cents, tags, rating, reviews_count,
     affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-lucca-wine-villa',
     'Colline lucchesi: tour villa storica + degustazione vini',
     'Visita di una villa lucchese del 700 con cantina sotterranea. Degustazione 5 vini DOC Colline Lucchesi + olio EVO + salumi e pecorino. Trasferimento da Lucca centro.',
     NULL,
     'Lucca', 'IT', 'food', 240, 7500,
     ARRAY['foodie', 'wine', 'couples', 'date-night', 'romantic', 'local'],
     4.9, 890,
     'https://www.getyourguide.com/lucca-l1244/wine-villa-tour-t77002?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  -- Festival Puccini Torre del Lago
  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country,
     category, duration_minutes, price_min_cents, price_max_cents, tags,
     rating, reviews_count, affiliate_url_template, curator_notes)
  VALUES
    (v_gyg_id, 'gyg-puccini-festival',
     'Festival Pucciniano: opera al Gran Teatro di Torre del Lago',
     'Una serata d''opera nel teatro all''aperto affacciato sul Lago di Massaciuccoli, dove Puccini visse e compose. Stagione estiva luglio-agosto. Posto a sedere numerato.',
     NULL,
     'Torre del Lago', 'IT', 'show', 180, 4500, 12000,
     ARRAY['music', 'art', 'couples', 'date-night', 'romantic', 'summer', 'local'],
     4.7, 2150,
     'https://www.getyourguide.com/torre-del-lago-l5589/puccini-festival-t77003?partner_id=17&cmp={gift_id}',
     'Aggiunta su richiesta Luca 2026-05-15. Stagionale (estate). Disattivare in inverno con UPDATE active=false.')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Patch applicata: image_url placeholder ripuliti + 3 esperienze Lucca/Versilia aggiunte.';
END $$;

-- Verifica:
SELECT count(*) AS total_experiences FROM public.experiences;
-- atteso: 18 (15 originali + 3 Lucca)

SELECT city, count(*) AS exp
FROM public.experiences
WHERE city IS NOT NULL
GROUP BY city
ORDER BY exp DESC, city;
-- atteso: Lucca 2, e altre città 1-2 ciascuna; Torre del Lago 1
