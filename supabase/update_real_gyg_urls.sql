-- ============================================================
-- Update affiliate_url_template con URL GYG REALI
-- ============================================================
-- Generato 2026-05-16 notte da ricerca pubblica WebSearch sui top
-- risultati GetYourGuide per ognuna delle 5 esperienze principali del
-- catalogo. I product ID (t-XXXXXX) sono quelli reali presenti
-- attualmente su getyourguide.com.
--
-- Da eseguire MANUALMENTE su Supabase SQL Editor.
-- Tutti i template hanno partner_id=17 (il tuo) + cmp={gift_id}
-- placeholder che viene sostituito runtime dal redirect.
--
-- NOTA: il partner_id=17 e' un placeholder che ho usato perche' Luca
-- lo aveva confermato come suo ID GYG affiliate. Se i link affiliate
-- ufficiali generati dal pannello GYG usano un parametro diverso
-- (es. 'aid=', 'aff=', ...), verificare e adeguare.
--
-- Verifica con:
--   SELECT external_id, affiliate_url_template
--   FROM experiences
--   WHERE external_id IN (
--     'gyg-rome-colosseum', 'gyg-rome-pasta-class',
--     'gyg-florence-uffizi', 'gyg-florence-chianti-wine',
--     'gyg-naples-pompeii'
--   );
-- ============================================================

-- 1. Colosseo Roma — tour Foro + Palatino + Colosseo
UPDATE public.experiences
SET affiliate_url_template = 'https://www.getyourguide.com/rome-l33/rome-skip-the-line-group-tour-colosseum-forum-palatine-hill-t405524/?partner_id=17&cmp={gift_id}'
WHERE external_id = 'gyg-rome-colosseum';

-- 2. Pasta class Roma Trastevere — cooking in real Roman home
UPDATE public.experiences
SET affiliate_url_template = 'https://www.getyourguide.com/rome-l33/rome-pasta-class-cooking-experience-in-a-roman-family-t539633/?partner_id=17&cmp={gift_id}'
WHERE external_id = 'gyg-rome-pasta-class';

-- 3. Uffizi Firenze — skip-the-line small group guided
UPDATE public.experiences
SET affiliate_url_template = 'https://www.getyourguide.com/florence-l32/uffizi-gallery-skip-the-line-guided-tour-for-small-groups-t145986/?partner_id=17&cmp={gift_id}'
WHERE external_id = 'gyg-florence-uffizi';

-- 4. Chianti Firenze — wineries tour + tasting
UPDATE public.experiences
SET affiliate_url_template = 'https://www.getyourguide.com/florence-l32/florence-chianti-wineries-tour-with-wine-tasting-t400983/?partner_id=17&cmp={gift_id}'
WHERE external_id = 'gyg-florence-chianti-wine';

-- 5. Pompei Napoli — guided walking tour skip-the-line
UPDATE public.experiences
SET affiliate_url_template = 'https://www.getyourguide.com/naples-l162/from-naples-2-hour-walking-tour-of-pompeii-ruins-t258877/?partner_id=17&cmp={gift_id}'
WHERE external_id = 'gyg-naples-pompeii';

-- Verifica risultati
SELECT
  external_id,
  title,
  LEFT(affiliate_url_template, 100) AS url_preview
FROM public.experiences
WHERE external_id IN (
  'gyg-rome-colosseum',
  'gyg-rome-pasta-class',
  'gyg-florence-uffizi',
  'gyg-florence-chianti-wine',
  'gyg-naples-pompeii'
)
ORDER BY external_id;
