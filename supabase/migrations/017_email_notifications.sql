-- ============================================================
-- BeGift — Migration 017: Email notifications via Resend
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Aggiunge supporto a notifiche email come fallback alle push.
-- Le email sono inviate via Resend (lib/email.ts) per gli stessi
-- 3 eventi gia' coperti dalle push (gift_opened, reaction) piu' un
-- evento NUOVO (welcome al primo login).
--
-- Colonne aggiunte:
--
--   notify_email           — opt-in globale email (default true).
--                            Se false, NESSUNA email transazionale
--                            viene mai inviata. L'utente la disattiva
--                            da /settings.
--   welcome_email_sent_at  — timestamp dell'invio benvenuto. NULL se
--                            non ancora inviato. Usato per evitare
--                            duplicati: l'endpoint /api/profile/me
--                            invia welcome solo se NULL e setta poi
--                            il timestamp con UPDATE atomico.
--
-- Le preferenze granulari (notify_gift_opened, notify_reaction)
-- esistenti dalla migration 008 vengono RIUSATE: se notify_email=true
-- e notify_gift_opened=true → email gift aperto. Stesso pattern di
-- webPush.ts. Cosi' l'utente non ha 6 toggle (3 push + 3 email): ne
-- ha 4 (3 categorie + canale email on/off globale).
--
-- IDEMPOTENTE.
-- ============================================================

alter table public.profiles
  add column if not exists notify_email          boolean     not null default true,
  add column if not exists welcome_email_sent_at timestamptz null;

-- Index parziale per ricavare velocemente "utenti che non hanno
-- ancora ricevuto la welcome" (es. per re-engagement futuro o
-- backfill se la welcome fallisce). Piccolo, low-overhead.
create index if not exists idx_profiles_welcome_pending
  on public.profiles (created_at)
  where welcome_email_sent_at is null;

-- Sanity check post-migration:
-- select count(*) filter (where notify_email)         as opted_in_email,
--        count(*) filter (where not notify_email)     as opted_out_email,
--        count(*) filter (where welcome_email_sent_at is null) as welcome_pending,
--        count(*) filter (where welcome_email_sent_at is not null) as welcome_sent
--   from public.profiles;
