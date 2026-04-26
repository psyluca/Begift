-- ============================================================
-- BeGift — Migration 015: notifications.read_at + indici
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- La tabella public.notifications era schema drift (creata
-- manualmente). Aggiungiamo colonna read_at per il notification
-- center in-app (/notifiche), in modo da poter distinguere
-- letto/non-letto e mostrare il badge contatore solo per i nuovi.
--
-- IDEMPOTENTE.
-- ============================================================

alter table public.notifications
  add column if not exists read_at timestamptz;

-- Indice per query "le mie notifiche non lette".
create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, created_at desc)
  where read_at is null;

-- Indice generale per query "tutte le mie notifiche ordinate".
create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);

-- Sanity check post-migration:
-- select count(*) filter (where read_at is null) as unread,
--        count(*) as total
-- from public.notifications
-- where user_id = auth.uid();
