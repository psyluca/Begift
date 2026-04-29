-- ============================================================
-- BeGift — Migration 019: Survey responses + flag invite
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Crea l'infrastruttura per il sondaggio post-gift:
--
--  - Tabella `survey_responses` per salvare le risposte raccolte
--    via webhook (Tally → /api/survey/submit). Ogni risposta ha
--    payload jsonb (struttura libera, evolverà nel tempo) + link
--    al user_id e gift_id che ha originato l'invito.
--
--  - Colonna `profiles.survey_invite_sent_at` per idempotenza:
--    evita di mandare la survey piu' volte allo stesso utente.
--    Lock atomico via UPDATE WHERE IS NULL (stesso pattern della
--    welcome email).
--
-- Survey ID: stringa che identifica la versione del sondaggio
-- ('post_gift_v1' inizialmente). Se in futuro cambiamo le domande,
-- incrementiamo a v2 e i due dataset restano separati per analisi.
--
-- IDEMPOTENTE.
-- ============================================================

-- Tabella delle risposte
create table if not exists public.survey_responses (
  id          uuid          primary key default gen_random_uuid(),
  user_id     uuid          references public.profiles(id) on delete set null,
  gift_id     uuid          references public.gifts(id)    on delete set null,
  survey_id   text          not null default 'post_gift_v1',
  source      text          default 'tally',
  payload     jsonb         not null,
  created_at  timestamptz   not null default now()
);

create index if not exists idx_survey_responses_user
  on public.survey_responses(user_id);

create index if not exists idx_survey_responses_created
  on public.survey_responses(created_at);

create index if not exists idx_survey_responses_survey
  on public.survey_responses(survey_id);

-- RLS: lettura solo admin via service_role. Niente public read.
alter table public.survey_responses enable row level security;

-- Flag idempotenza invito su profiles
alter table public.profiles
  add column if not exists survey_invite_sent_at timestamptz;

-- Sanity check post-migration:
-- select count(*) filter (where survey_invite_sent_at is null) as pending,
--        count(*) filter (where survey_invite_sent_at is not null) as sent
-- from public.profiles;
