-- ============================================================
-- BeGift — Migration 007: Reminders (ricorrenze)
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Permette all'utente di salvare ricorrenze (compleanni,
-- anniversari, ecc) per ricevere una push notification N giorni
-- prima della data, con CTA che porta al flusso /create
-- pre-compilato col nome del destinatario.
--
-- Scelte di design:
-- - Salviamo solo mese+giorno per i compleanni tipici (ricorrenza
--   annuale), non l'anno di nascita (la persona non ha bisogno di
--   sapere quanti anni compie il destinatario per creare un regalo
--   — resta opzionale il campo year per chi vuole tracciare età)
-- - notify_days_before è per-reminder, default 3 (→ compromesso
--   tra "in tempo per pensarci" e "non troppo anticipato")
-- - occasion_type: "birthday" (default) | "anniversary" | "name_day"
--   | "other" — usato per routing del template preselezionato in
--   /create (es birthday → template compleanno automatico)
-- - RLS stretta: ogni utente legge/modifica solo le proprie
--
-- IDEMPOTENTE.
-- ============================================================

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Nome del destinatario (es. "Marta", "Mamma", "Luca il coinquilino")
  recipient_name text not null,
  -- Mese (1-12) e giorno (1-31) della ricorrenza. Annuale.
  month int not null check (month >= 1 and month <= 12),
  day int not null check (day >= 1 and day <= 31),
  -- Anno opzionale (solo per calcolare "compie N anni" nei template)
  year int,
  -- Tipo di ricorrenza → mappa al template di /create
  occasion_type text not null default 'birthday'
    check (occasion_type in ('birthday', 'anniversary', 'name_day', 'graduation', 'other')),
  -- Giorni di anticipo per la notifica (1-30, default 3)
  notify_days_before int not null default 3
    check (notify_days_before >= 0 and notify_days_before <= 30),
  -- Timestamp dell'ultima push inviata per questa ricorrenza
  -- (usato dal cron per evitare duplicati: se last_notified_at nello
  -- stesso anno >= target_date, skip)
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indice per query del cron: "reminders che matchano oggi+N giorni"
create index if not exists reminders_month_day_idx
  on public.reminders (month, day);

-- Indice per query dashboard "mie ricorrenze"
create index if not exists reminders_user_id_idx
  on public.reminders (user_id);

-- RLS
alter table public.reminders enable row level security;

drop policy if exists "reminders: user read own" on public.reminders;
drop policy if exists "reminders: user insert own" on public.reminders;
drop policy if exists "reminders: user update own" on public.reminders;
drop policy if exists "reminders: user delete own" on public.reminders;

create policy "reminders: user read own"
  on public.reminders for select
  using (user_id = auth.uid());

create policy "reminders: user insert own"
  on public.reminders for insert
  with check (user_id = auth.uid());

create policy "reminders: user update own"
  on public.reminders for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "reminders: user delete own"
  on public.reminders for delete
  using (user_id = auth.uid());

-- Service_role bypassa RLS per il cron job che manda le push.

-- Sanity check (decommentare):
-- select count(*), occasion_type from public.reminders group by occasion_type;
