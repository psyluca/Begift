-- ============================================================
-- SEED — 20 esperienze italiane curate per il POC vendita esperienze
-- ============================================================
-- NON e' una migration ufficiale: questo file lo esegui MANUALMENTE
-- su Supabase Dashboard → SQL Editor → New query → paste + Run.
-- Ripetibile (ON CONFLICT DO NOTHING su external_id).
--
-- Coverage:
--   - 5 città top IT: Roma, Milano, Firenze, Venezia, Napoli
--   - 5 categorie: food, outdoor, culture, wellness, travel
--   - Mix partner: GetYourGuide (premium tours), Awin (Booking/Smartbox)
--
-- NOTA: i prezzi e i product ID sono PLACEHOLDER realistici.
-- Sostituire con valori veri prima di andare in produzione (vedi
-- TODO Luca in docs/vendita-esperienze/PARTNER_INTEGRATION.md).
-- ============================================================

DO $$
DECLARE
  v_gyg_id   uuid;
  v_awin_id  uuid;
  v_td_id    uuid;
BEGIN
  SELECT id INTO v_gyg_id  FROM public.experience_partners WHERE slug = 'getyourguide';
  SELECT id INTO v_awin_id FROM public.experience_partners WHERE slug = 'awin';
  SELECT id INTO v_td_id   FROM public.experience_partners WHERE slug = 'tradedoubler';

  IF v_gyg_id IS NULL OR v_awin_id IS NULL THEN
    RAISE EXCEPTION 'Run migration 023 first to create experience_partners.';
  END IF;

  -- ===== ROMA =====
  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, price_max_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-rome-colosseum',
     'Colosseo, Foro Romano e Palatino: tour saltafila',
     'Tour guidato di 3 ore con accesso prioritario al Colosseo, Foro Romano e Palatino. Audioguida inclusa, gruppi piccoli.',
     'https://cdn.getyourguide.com/img/tour/colosseum-skip-line.jpg',
     'Roma', 'IT', 'culture', 180, 4900, 6500,
     ARRAY['couples', 'family', 'history', 'must-see'],
     4.7, 28430,
     'https://www.getyourguide.com/rome-l33/colosseum-skip-the-line-tour-t44519?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-rome-pasta-class',
     'Lezione di pasta fatta a mano a Trastevere',
     'Impara a fare carbonara, cacio e pepe e tiramisu in una cucina romana storica. Cena inclusa, vino abbondante.',
     'https://cdn.getyourguide.com/img/tour/rome-pasta-cooking-class.jpg',
     'Roma', 'IT', 'food', 240, 8500,
     ARRAY['foodie', 'couples', 'date-night', 'romantic'],
     4.9, 5640,
     'https://www.getyourguide.com/rome-l33/pasta-cooking-class-t98432?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  -- ===== MILANO =====
  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-milan-cenacolo',
     'Ultima Cena di Leonardo: tour con biglietti saltafila',
     'Tour di 75 minuti del Cenacolo Vinciano con guida esperta. I biglietti sono ESAURITISSIMI senza prenotazione anticipata.',
     'https://cdn.getyourguide.com/img/tour/milan-last-supper.jpg',
     'Milano', 'IT', 'culture', 75, 6900,
     ARRAY['art', 'must-see', 'couples', 'culture'],
     4.6, 8920,
     'https://www.getyourguide.com/milan-l30/last-supper-skip-the-line-tour-t12345?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-milan-aperitivo-cruise',
     'Aperitivo sui Navigli in barca privata',
     'Cocktail sui Navigli con aperitivo gourmet e DJ set al tramonto. Barca privata fino a 8 persone.',
     'https://cdn.getyourguide.com/img/tour/milan-navigli-aperitivo.jpg',
     'Milano', 'IT', 'food', 120, 5500, ARRAY['foodie', 'friends', 'date-night', 'aperitivo'],
     4.8, 1240,
     'https://www.getyourguide.com/milan-l30/aperitivo-navigli-cruise-t67890?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  -- ===== FIRENZE =====
  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-florence-uffizi',
     'Uffizi: tour saltafila con guida specializzata',
     'I capolavori di Botticelli, Leonardo, Michelangelo in 2.5 ore. Auricolare incluso, gruppi max 15.',
     'https://cdn.getyourguide.com/img/tour/florence-uffizi.jpg',
     'Firenze', 'IT', 'culture', 150, 5900,
     ARRAY['art', 'must-see', 'culture', 'couples'],
     4.7, 14200,
     'https://www.getyourguide.com/florence-l59/uffizi-skip-line-t11223?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-florence-chianti-wine',
     'Chianti: tour vigneti + degustazione 3 cantine',
     'Giornata intera nel cuore del Chianti: 3 cantine, degustazione di 8 vini, pranzo toscano in fattoria. Trasferimenti inclusi da Firenze.',
     'https://cdn.getyourguide.com/img/tour/chianti-wine-tour.jpg',
     'Firenze', 'IT', 'food', 480, 9500, ARRAY['foodie', 'wine', 'couples', 'date-night', 'romantic'],
     4.9, 4730,
     'https://www.getyourguide.com/florence-l59/chianti-wine-tour-t33445?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  -- ===== VENEZIA =====
  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-venice-gondola',
     'Tour in gondola al tramonto con serenata',
     'Giro in gondola di 30 minuti con musicista live a bordo. Canzoni veneziane e Vivaldi. Max 6 passeggeri per gondola.',
     'https://cdn.getyourguide.com/img/tour/venice-gondola-serenade.jpg',
     'Venezia', 'IT', 'culture', 30, 4500, ARRAY['romantic', 'couples', 'date-night', 'sunset'],
     4.5, 6890,
     'https://www.getyourguide.com/venice-l35/gondola-serenade-t55667?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-venice-burano-murano',
     'Murano, Burano e Torcello: tour delle isole in barca',
     'Giornata intera tra le isole della laguna: soffieria del vetro a Murano, case colorate di Burano, mosaici di Torcello. Pranzo libero.',
     'https://cdn.getyourguide.com/img/tour/venice-islands-tour.jpg',
     'Venezia', 'IT', 'travel', 360, 3500,
     ARRAY['family', 'culture', 'photography', 'half-day'],
     4.6, 9120,
     'https://www.getyourguide.com/venice-l35/islands-tour-t77889?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  -- ===== NAPOLI =====
  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-naples-pompeii',
     'Pompei: tour archeologico saltafila',
     'Tour di 2 ore della città sepolta nel 79 d.C. Guida esperta in storia romana. Auricolare incluso.',
     'https://cdn.getyourguide.com/img/tour/pompeii-skip-line.jpg',
     'Napoli', 'IT', 'culture', 120, 5900,
     ARRAY['history', 'must-see', 'culture', 'couples', 'family'],
     4.8, 11340,
     'https://www.getyourguide.com/pompeii-l2780/skip-the-line-tour-t99001?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-naples-pizza-class',
     'Lezione di pizza napoletana con pizzaiolo verace',
     'Impara a fare la VERA pizza napoletana con un maestro AVPN. 3 ore, cena inclusa con pizza fatta da te + birra/vino.',
     'https://cdn.getyourguide.com/img/tour/naples-pizza-class.jpg',
     'Napoli', 'IT', 'food', 180, 7500,
     ARRAY['foodie', 'family', 'couples', 'hands-on'],
     4.9, 3210,
     'https://www.getyourguide.com/naples-l769/pizza-class-t22334?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  -- ===== WELLNESS (Awin via Smartbox o programmi diretti) =====
  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, price_max_cents, tags, rating, reviews_count, affiliate_url_template, curator_notes)
  VALUES
    (v_awin_id, 'smartbox-spa-couples',
     'Smartbox "Spa per due": 1 percorso benessere',
     'Cofanetto Smartbox riscattabile in oltre 200 centri benessere in Italia. Validita 3 anni dalla data di attivazione.',
     NULL,
     NULL, 'IT', 'wellness', NULL, 5990, 9990,
     ARRAY['couples', 'wellness', 'romantic', 'flexible', 'voucher'],
     4.3, 8900,
     'https://www.awin1.com/cread.php?awinmid=PLACEHOLDER&awinaffid=PLACEHOLDER&clickref={gift_id}&p=https%3A%2F%2Fwww.smartbox.com%2Fit%2Fspa-per-due',
     'Awin/Smartbox: aggiornare awinmid + affiliate_id dopo setup partner_id Luca')
  ON CONFLICT DO NOTHING;

  -- ===== OUTDOOR =====
  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-cinque-terre-boat',
     'Cinque Terre: tour in barca con bagno in mare',
     'Giornata intera in barca lungo le Cinque Terre, snorkeling nelle calette, pranzo libero a Vernazza. Partenza La Spezia.',
     'https://cdn.getyourguide.com/img/tour/cinque-terre-boat.jpg',
     'La Spezia', 'IT', 'outdoor', 480, 8900,
     ARRAY['outdoor', 'couples', 'friends', 'sea', 'summer'],
     4.8, 5440,
     'https://www.getyourguide.com/la-spezia-l1071/cinque-terre-boat-tour-t44556?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-dolomites-trek',
     'Dolomiti: trekking guidato Tre Cime di Lavaredo',
     'Trekking di 6 ore con guida alpina certificata. Difficoltà media. Vista mozzafiato sulle Tre Cime. Trasferimenti inclusi da Cortina.',
     'https://cdn.getyourguide.com/img/tour/dolomites-tre-cime.jpg',
     'Cortina', 'IT', 'outdoor', 360, 6500,
     ARRAY['outdoor', 'hiking', 'adventure', 'mountains', 'couples', 'friends'],
     4.9, 1830,
     'https://www.getyourguide.com/cortina-l1234/dolomites-trek-t66778?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  -- ===== INTERNATIONAL (per espandere oltre IT eventualmente) =====
  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-paris-louvre',
     'Louvre: tour saltafila con focus su Monna Lisa',
     '2.5 ore guidate ai capolavori del Louvre, accesso prioritario, gruppi piccoli.',
     'https://cdn.getyourguide.com/img/tour/louvre-skip-line.jpg',
     'Paris', 'FR', 'culture', 150, 7900,
     ARRAY['art', 'must-see', 'couples', 'culture', 'international'],
     4.6, 22100,
     'https://www.getyourguide.com/paris-l16/louvre-skip-line-t88990?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.experiences
    (partner_id, external_id, title, description, image_url, city, country, category, duration_minutes, price_min_cents, tags, rating, reviews_count, affiliate_url_template)
  VALUES
    (v_gyg_id, 'gyg-london-eye-cruise',
     'London Eye + crociera Tamigi: combo',
     'Combinato 4D experience London Eye + crociera turistica sul Tamigi.',
     'https://cdn.getyourguide.com/img/tour/london-eye-thames.jpg',
     'London', 'GB', 'culture', 90, 4500,
     ARRAY['family', 'must-see', 'international', 'couples'],
     4.4, 18700,
     'https://www.getyourguide.com/london-l57/london-eye-thames-cruise-t11445?partner_id=17&cmp={gift_id}')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed completed: 15 esperienze inserite (o ON CONFLICT skip se ripetuto).';
END $$;
