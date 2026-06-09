-- ============================================================
-- Audit manuale event_date per VVT esistenti
-- ============================================================
-- 2026-06-04
--
-- Lo script generate_catalog_import.py popola event_date solo se il
-- file Excel ha la colonna H "Data evento" compilata. Per i 50 VVT
-- importati il 29 mag + 3 giu, la colonna era vuota — quindi tutti
-- hanno event_date NULL.
--
-- Questo file è uno "scratchpad" per popolare a mano le date dei
-- ~25 VVT con data fissa riconoscibile (concerti, partite, mostre
-- con date precise). Per i ~25 evergreen (parchi divertimento,
-- mostre lunghe, abbazie, biglietti open) LASCIA NULL.
--
-- Workflow per ogni evento:
-- 1. Cerca il record nella tabella experiences con la query SELECT
--    in fondo a questo file
-- 2. Apri il link esterno (external_url) sul sito VVT per leggere
--    la data evento
-- 3. Esegui l'UPDATE corrispondente sostituendo la data ISO
--
-- Formato data ISO: YYYY-MM-DD (es. '2026-06-22' per 22 giugno 2026)
-- ============================================================

-- ============================================================
-- STEP 1: VEDI tutti i VVT con possibili indizi di data nel titolo
-- ============================================================
-- Filtra i VVT che probabilmente sono eventi singoli (escludi
-- parchi divertimento + mostre evergreen + biglietti open).
SELECT external_id, title, city, external_url, event_date
  FROM public.experiences
 WHERE external_id LIKE 'vt-%'
   AND event_date IS NULL
   AND title NOT ILIKE '%CINECITT%'      -- parco
   AND title NOT ILIKE '%ZOOMARINE%'     -- parco
   AND title NOT ILIKE '%ACQUAPARK%'     -- parco
   AND title NOT ILIKE '%AQUANEVA%'      -- parco
   AND title NOT ILIKE '%ALPYLAND%'      -- parco
   AND title NOT ILIKE '%BIOPARCO%'      -- zoo
   AND title NOT ILIKE '%STADIO OLIMP%'  -- tour stadio evergreen
   AND title NOT ILIKE '%ABBAZIA%'       -- visita evergreen
   AND title NOT ILIKE '%PRINCESS BOUTIQUE%' -- show evergreen
   AND title NOT ILIKE '%MUSEO%'         -- mostra evergreen
   AND title NOT ILIKE '%BIGLIETTO OPEN%' -- open ticket
   AND title NOT ILIKE '%VAJONT%'        -- visita evergreen
 ORDER BY external_id;

-- ============================================================
-- STEP 2: UPDATE template — sostituisci la data dopo aver
-- verificato sul sito VVT (link in external_url)
-- ============================================================
-- COPIA-INCOLLA UNA RIGA PER VOLTA, modifica la data, lancia.
-- L'external_id non cambia mai, modifichi SOLO la data ISO.

-- Esempi (sostituisci 'YYYY-MM-DD' con la data reale):

-- Festival Puccini 2026
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-festival-puccini-2026';

-- Roberto Bolle and Friends 2026
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-roberto-bolle-and-friends-2026';

-- Vincenzo Salemme
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-vincenzo-salemme-lo-spettacolo';

-- Tiziano Ferro - Stadi26 Tour
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-tiziano-ferro-stadi26-tour';

-- Madame
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-madame';

-- Deep Purple
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-deep-purple';

-- KPOP Mania
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-kpop-mania';

-- Massimo Lopez Show
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-massimo-lopez-show';

-- Roberta Bruzzone
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-roberta-bruzzone-l-epoca-della';

-- Noemi - Live 2026
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-noemi-live-2026';

-- Iron Maiden
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-iron-maiden-run-for-your-lives';

-- Tedua San Siro
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-san-siro-tedua';

-- Gabry Ponte San Siro Dance
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-gabry-ponte-san-siro-dance';

-- LP
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-lp';

-- Paolo Cevoli Show
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-paolo-cevoli-show';

-- Cenerentola Balletto
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-cenerentola-il-balletto-per';

-- Champagne Experience 2026
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-champagne-experience-2026';

-- World Ducati Week 2026
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-world-ducati-week-2026';

-- Ducati Riding Experience (più date possibili — verificare)
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-ducati-riding-experience';

-- Gran Premio MotoCross
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-gran-premio-d-italia-motocross';

-- LBA Supercoppa 2026
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-lba-supercoppa-2026';

-- Fiorentina All Stars
-- UPDATE public.experiences SET event_date = 'YYYY-MM-DD' WHERE external_id = 'vt-fiorentina-all-stars-operazione';

-- ============================================================
-- STEP 3: Verifica finale
-- ============================================================
-- Dopo aver popolato, verifica quante righe hanno event_date e
-- quante saranno auto-nascoste dal catalogo.

SELECT
  count(*) FILTER (WHERE event_date IS NOT NULL) AS con_data,
  count(*) FILTER (WHERE event_date IS NULL) AS senza_data_evergreen,
  count(*) FILTER (WHERE event_date < CURRENT_DATE) AS gia_passati_nascosti,
  count(*) FILTER (WHERE event_date >= CURRENT_DATE) AS futuri_visibili
FROM public.experiences
WHERE external_id LIKE 'vt-%';

-- Vedi anche quali eventi sono in vista nel catalogo
SELECT external_id, title, event_date,
       (event_date < CURRENT_DATE OR event_date IS NULL) AS visibile
  FROM public.experiences
 WHERE external_id LIKE 'vt-%'
 ORDER BY event_date NULLS LAST, external_id;
