-- ============================================================
-- BeGift — Migration 004: Scheduled gifts
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Permette al mittente di programmare l'invio di un gift a una
-- data/ora futura. Il gift rimane "in attesa" (waiting page lato
-- destinatario) fino al raggiungimento di `scheduled_at`, poi
-- diventa apribile normalmente.
--
-- La logica "è pronto per l'apertura?" è un semplice confronto
-- `scheduled_at IS NULL OR scheduled_at <= now()` — niente cron,
-- niente scheduling esterno. Lo check avviene lato applicazione
-- ogni volta che il gift viene richiesto.
--
-- IDEMPOTENTE: riesecuzioni multiple non fanno male.
-- ============================================================

-- Aggiunge la colonna nullable. NULL = gift immediato (comportamento
-- attuale, retrocompatibile). Valore valorizzato = gift programmato.
alter table public.gifts
  add column if not exists scheduled_at timestamptz;

-- Indice per query del dashboard ("mostrami i miei gift programmati")
create index if not exists gifts_scheduled_at_idx
  on public.gifts(creator_id, scheduled_at)
  where scheduled_at is not null;

-- Nessun cambio RLS: la policy "gifts: public read" gestisce già
-- la lettura pubblica. La logica di blocco pre-tempo è app-level
-- (la waiting page verifica scheduled_at e mostra countdown).

-- Sanity check (decommentare per eseguire):
-- select id, recipient_name, scheduled_at from public.gifts
-- where scheduled_at is not null order by scheduled_at;
