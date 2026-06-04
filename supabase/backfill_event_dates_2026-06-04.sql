-- ============================================================
-- Backfill event_date dalle curator_notes esistenti
-- ============================================================
-- 2026-06-04
--
-- Da eseguire UNA VOLTA su Supabase Studio dopo aver applicato
-- la migration 030_event_date.sql.
--
-- Cosa fa:
-- I vecchi import (import_catalog_2026-05-29.sql, 2026-06-03.sql)
-- salvavano la data evento VVT come stringa nelle curator_notes,
-- nel formato "Data evento: dd/mm/aaaa — Importato dal catalogo
-- curato YYYY-MM-DD". Esempio:
--   curator_notes = 'Data evento: 26/06/2026 — Importato dal catalogo curato 2026-06-03'
--
-- Questo script estrae la data dalla stringa e la popola nel campo
-- event_date strutturato.
--
-- Idempotente: aggiorna SOLO righe con event_date IS NULL E che
-- hanno "Data evento: dd/mm/aaaa" nelle note. Rilanciabile senza
-- effetti collaterali.
-- ============================================================

BEGIN;

-- Verifica preliminare: quante righe hanno una data nelle note?
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
    FROM public.experiences
   WHERE event_date IS NULL
     AND curator_notes ~ 'Data evento: \d{2}/\d{2}/\d{4}';
  RAISE NOTICE 'Righe candidate al backfill: %', v_count;
END $$;

-- Estrazione data e UPDATE
UPDATE public.experiences
   SET event_date = TO_DATE(
       SUBSTRING(curator_notes FROM 'Data evento: (\d{2}/\d{2}/\d{4})'),
       'DD/MM/YYYY'
     )
 WHERE event_date IS NULL
   AND curator_notes ~ 'Data evento: \d{2}/\d{2}/\d{4}';

-- Conteggio post-backfill
DO $$
DECLARE
  v_filled integer;
  v_passed integer;
  v_future integer;
BEGIN
  SELECT count(*) INTO v_filled
    FROM public.experiences WHERE event_date IS NOT NULL;
  SELECT count(*) INTO v_passed
    FROM public.experiences
   WHERE event_date IS NOT NULL AND event_date < CURRENT_DATE;
  SELECT count(*) INTO v_future
    FROM public.experiences
   WHERE event_date IS NOT NULL AND event_date >= CURRENT_DATE;
  RAISE NOTICE 'Righe con event_date popolata: %', v_filled;
  RAISE NOTICE '  → eventi gia'' passati (saranno auto-nascosti): %', v_passed;
  RAISE NOTICE '  → eventi futuri (visibili): %', v_future;
END $$;

COMMIT;

-- Verifica veloce: vedi le prime 20 righe con event_date popolata
SELECT external_id, title, city, event_date,
       (event_date < CURRENT_DATE) AS scaduto
  FROM public.experiences
 WHERE event_date IS NOT NULL
 ORDER BY event_date
 LIMIT 20;
