-- ============================================================
-- CLEANUP: rimuovi partner non-GYG dal catalogo live
-- ============================================================
-- 2026-05-18: GetYourGuide e' l'unico partner commerciale
-- autorizzato per BeGift. Awin e TradeDoubler erano stati seedati
-- in migrazione 023 ma nessuna esperienza attiva ci punta piu'
-- (smartbox-spa-couples era l'unica e l'avevamo gia' messa
-- active=false in update_catalog_26_real.sql).
--
-- Questo script:
--   1. DELETE delle esperienze (anche disattivate) che usano
--      partner != GYG. Sicuro: experience_clicks ha ON DELETE
--      CASCADE quindi i click associati vengono puliti.
--   2. DELETE dei record partner Awin + TradeDoubler dalla
--      tabella experience_partners. Sicuro: ON DELETE RESTRICT
--      sulle FK, quindi se per errore ci fosse ancora qualche
--      experience che ci punta, il DELETE fallisce e la
--      transazione fa rollback.
--
-- Da eseguire MANUALMENTE su Supabase SQL Editor.
-- ============================================================

BEGIN;

-- Step 1: log di quello che cancelliamo (per audit)
SELECT 'EXPERIENCES da cancellare' AS step, e.external_id, e.title, ep.slug AS partner_slug
  FROM public.experiences e
  JOIN public.experience_partners ep ON ep.id = e.partner_id
 WHERE ep.slug <> 'getyourguide';

SELECT 'PARTNER da cancellare' AS step, slug, display_name
  FROM public.experience_partners
 WHERE slug <> 'getyourguide';

-- Step 2: DELETE esperienze non-GYG
DELETE FROM public.experiences
 WHERE partner_id IN (
   SELECT id FROM public.experience_partners WHERE slug <> 'getyourguide'
 );

-- Step 3: DELETE partner non-GYG
DELETE FROM public.experience_partners
 WHERE slug <> 'getyourguide';

-- Step 4: verifica finale
SELECT 'PARTNER rimasti' AS step, slug, display_name, active
  FROM public.experience_partners;

SELECT 'EXPERIENCES per partner' AS step,
       ep.slug,
       count(*) FILTER (WHERE e.active) AS attive,
       count(*) AS totali
  FROM public.experience_partners ep
  LEFT JOIN public.experiences e ON e.partner_id = ep.id
 GROUP BY ep.slug;

COMMIT;
