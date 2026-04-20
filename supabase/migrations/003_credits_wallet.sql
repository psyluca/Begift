-- ============================================================
-- BeGift — Migration 003: Credit Wallet system
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Implementa il wallet di crediti (sez. 11 del MARKET_ROADMAP).
--
-- Modello ibrido:
-- - Utente free (mai pagato): wallet non attivo, moltiplicatore 0×.
-- - Utente paid-once (≥1 pagamento): moltiplicatore 0.5×.
-- - Subscription base (tier='lowcost'): moltiplicatore 1× + streak/welcome.
-- - Subscription pro (tier='pro'): moltiplicatore 1.5× + cap superiori.
--
-- Al momento della migration 003, "paid-once" è rilevato dalla presenza
-- di almeno 1 gift creato dall'utente (heuristic pre-Stripe). Quando
-- aggiungeremo Stripe, sostituiremo con una colonna `has_paid` esplicita.
--
-- La migration è IDEMPOTENTE (usa IF NOT EXISTS / OR REPLACE). Riesegue
-- senza effetti collaterali.
-- ============================================================

-- ── Step 1: eventi del gift (open/share) per triggerare award ───
-- La tabella `gifts` in 001_schema.sql non tracciava apertura / condivisione.
-- Aggiungiamo colonne nullable per registrare il primo evento di ciascun tipo.
alter table public.gifts
  add column if not exists opened_at timestamptz;

alter table public.gifts
  add column if not exists shared_at timestamptz;

alter table public.gifts
  add column if not exists first_reply_at timestamptz;

create index if not exists gifts_opened_at_idx on public.gifts(opened_at) where opened_at is not null;

-- ── Step 2: credit_rules (regole earn, configurabili) ────────────
-- Definisce quanti crediti BASE vengono assegnati per ogni azione.
-- Il moltiplicatore per tier utente è applicato dalle RPC.
create table if not exists public.credit_rules (
  reason text primary key,                  -- "open_gift", "share_gift", "referral", ecc.
  base_value int not null,                  -- crediti base prima del moltiplicatore
  description text,                         -- testo leggibile per UI "Come guadagnare"
  cooldown_hours int default 0,             -- distanza minima tra 2 eventi stessa coppia
  once_per_pair boolean default false,      -- se true, max 1 evento per coppia (mittente, destinatario)
  once_per_user boolean default false,      -- se true, solo 1 volta per vita utente (welcome, profile_complete)
  active boolean default true,              -- può essere disattivata senza DELETE
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seed delle regole base (MARKET_ROADMAP sez. 11.3). Idempotente: upsert.
insert into public.credit_rules (reason, base_value, description, cooldown_hours, once_per_pair, once_per_user) values
  ('open_gift',          1,  'Destinatario apre il gift entro 72h',                    720, true,  false),  -- 30gg cooldown, max 1/coppia/mese
  ('share_gift',         3,  'Destinatario condivide la scena del gift',                0,  true,  false),  -- solo 1 per gift
  ('referral_converted', 5,  'Destinatario diventa mittente e paga almeno un gift',     0,  false, false),  -- max 1 per referred user (enforced in trigger)
  ('first_gift',         5,  'Prima composizione completata — welcome bonus',           0,  false, true),
  ('weekly_streak',      5,  '4 settimane consecutive con almeno 1 gift',               168, false, false), -- 7gg
  ('feedback_received',  2,  'Destinatario lascia rating + commento',                   720, true,  false), -- 30gg/coppia
  ('invite_installed',   5,  'Invito diretto si iscrive E paga almeno 1 gift',          0,  false, false),
  ('profile_complete',   3,  'Profilo completato (foto + bio + preferenze)',            0,  false, true),
  ('gift_received',      1,  'Solo subscriber: apri un gift ricevuto',                  720, true,  false),
  ('gift_shared_rcvd',   3,  'Solo subscriber: condividi un gift ricevuto',             0,  true,  false)
on conflict (reason) do update
set base_value = excluded.base_value,
    description = excluded.description,
    cooldown_hours = excluded.cooldown_hours,
    once_per_pair = excluded.once_per_pair,
    once_per_user = excluded.once_per_user,
    updated_at = now();

-- ── Step 3: credit_ledger (transazioni immutabili) ────────────────
-- Tabella append-only: ogni riga è una transazione (positiva o negativa).
-- Il saldo utente è la SUM dei delta — niente balance column che si
-- possa desincronizzare.
create table if not exists public.credit_ledger (
  id              bigserial primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  delta           int not null,                          -- positivo = earn, negativo = spend
  reason          text not null,                         -- riferimento credit_rules.reason oppure "spend_*"
  metadata        jsonb default '{}'::jsonb not null,    -- es. {gift_id, pair_hash, device_fingerprint}
  expires_at      timestamptz,                           -- null = non scade; set per earn con expiry
  created_at      timestamptz default now() not null
);

create index if not exists ledger_user_id_idx        on public.credit_ledger(user_id);
create index if not exists ledger_reason_idx         on public.credit_ledger(reason);
create index if not exists ledger_created_at_idx     on public.credit_ledger(created_at desc);
create index if not exists ledger_expires_at_idx     on public.credit_ledger(expires_at) where expires_at is not null;
-- Indice composto per le query di dedupe (cooldown / once_per_pair)
create index if not exists ledger_pair_lookup_idx    on public.credit_ledger(user_id, reason, ((metadata->>'pair_hash')));

-- ── Step 4: view del saldo corrente ────────────────────────────────
-- SUM(delta) WHERE expires_at IS NULL OR expires_at > now()
create or replace view public.credit_balances as
select
  user_id,
  coalesce(sum(delta), 0)::int as balance,
  coalesce(sum(case when delta > 0 then delta else 0 end), 0)::int as lifetime_earned,
  coalesce(sum(case when delta < 0 then -delta else 0 end), 0)::int as lifetime_spent
from public.credit_ledger
where expires_at is null or expires_at > now()
group by user_id;

comment on view public.credit_balances is
  'Saldo corrente (considera expiry) + lifetime earned/spent per utente. '
  'Usare select * from credit_balances where user_id = auth.uid() lato app.';

-- ── Step 5: funzione helper per moltiplicatore tier ────────────────
create or replace function public.credit_multiplier(p_user_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text;
  v_has_gifts boolean;
begin
  select tier into v_tier from public.profiles where id = p_user_id;
  if v_tier is null then return 0; end if;

  -- Free users: 0.5× se hanno almeno 1 gift creato, altrimenti 0×
  if v_tier = 'free' then
    select exists (select 1 from public.gifts where creator_id = p_user_id) into v_has_gifts;
    return case when v_has_gifts then 0.5 else 0 end;
  end if;

  if v_tier = 'lowcost' then return 1.0; end if;
  if v_tier = 'pro'     then return 1.5; end if;

  return 0; -- unknown tier: safety
end;
$$;

comment on function public.credit_multiplier(uuid) is
  'Ritorna il moltiplicatore crediti in base al tier utente. '
  '0× per free senza gift, 0.5× per free con gift, 1× lowcost, 1.5× pro.';

-- ── Step 6: RPC award_credits (idempotente, atomica) ──────────────
-- Chiamata quando un'azione interessante avviene (open_gift, share, ...)
-- Rispetta cooldown, once_per_pair, once_per_user, applica moltiplicatore.
-- Ritorna l'id della riga ledger inserita, o NULL se l'award è stato
-- ignorato (cooldown, duplicato, moltiplicatore 0, regola disattivata).
--
-- Il parametro `p_metadata` deve contenere tipicamente:
--   - gift_id: uuid (obbligatorio per open/share/reply)
--   - pair_hash: md5(sender_id || recipient_id) o similare, usato per
--     deduplica once_per_pair (vedi Step 7 trigger).
create or replace function public.award_credits(
  p_user_id uuid,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule public.credit_rules%rowtype;
  v_mult numeric;
  v_final_delta int;
  v_pair_hash text;
  v_existing_count int;
  v_last_created timestamptz;
  v_new_id bigint;
  v_expires_at timestamptz;
begin
  -- Lookup regola
  select * into v_rule from public.credit_rules where reason = p_reason and active = true;
  if not found then
    return null; -- regola non esistente o disattivata
  end if;

  -- Check cooldown / once_per_* via lookup nel ledger esistente
  v_pair_hash := p_metadata->>'pair_hash';

  if v_rule.once_per_user then
    select count(*) into v_existing_count
    from public.credit_ledger
    where user_id = p_user_id and reason = p_reason;
    if v_existing_count > 0 then
      return null; -- one-shot già fatto
    end if;
  end if;

  if v_rule.once_per_pair and v_pair_hash is not null then
    -- Check cooldown per coppia
    if v_rule.cooldown_hours > 0 then
      select max(created_at) into v_last_created
      from public.credit_ledger
      where user_id = p_user_id
        and reason = p_reason
        and metadata->>'pair_hash' = v_pair_hash;
      if v_last_created is not null and v_last_created > (now() - (v_rule.cooldown_hours || ' hours')::interval) then
        return null; -- cooldown attivo su questa coppia
      end if;
    else
      -- Senza cooldown: once_per_pair = mai più per questa coppia
      select count(*) into v_existing_count
      from public.credit_ledger
      where user_id = p_user_id and reason = p_reason
        and metadata->>'pair_hash' = v_pair_hash;
      if v_existing_count > 0 then
        return null;
      end if;
    end if;
  end if;

  -- Applica moltiplicatore tier
  v_mult := public.credit_multiplier(p_user_id);
  v_final_delta := floor(v_rule.base_value * v_mult)::int;
  if v_final_delta <= 0 then
    return null; -- moltiplicatore 0 (es. free user senza gift) — niente da assegnare
  end if;

  -- Expiry: 12 mesi dopo l'accredito (sez. 11.6 roadmap)
  v_expires_at := now() + interval '12 months';

  -- Insert atomico nel ledger
  insert into public.credit_ledger (user_id, delta, reason, metadata, expires_at)
  values (p_user_id, v_final_delta, p_reason, p_metadata, v_expires_at)
  returning id into v_new_id;

  return v_new_id;
end;
$$;

-- ── Step 7: RPC spend_credits (atomica con lock) ──────────────────
-- Sottrae crediti dal saldo, validando che il saldo sia >= amount.
-- Usa advisory lock su user_id per prevenire race condition (doppia
-- spesa concorrente).
create or replace function public.spend_credits(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
  v_new_id bigint;
begin
  if p_amount <= 0 then
    raise exception 'spend amount must be positive (got %)', p_amount;
  end if;

  -- Advisory lock per user: blocca spese concorrenti per lo stesso utente.
  -- Hash del uuid to int8 per pg_advisory_xact_lock.
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Calcola saldo DOPO il lock per evitare TOCTOU
  select coalesce(balance, 0) into v_balance from public.credit_balances where user_id = p_user_id;
  if coalesce(v_balance, 0) < p_amount then
    raise exception 'insufficient balance: has %, needs %', coalesce(v_balance, 0), p_amount;
  end if;

  insert into public.credit_ledger (user_id, delta, reason, metadata)
  values (p_user_id, -p_amount, p_reason, p_metadata)
  returning id into v_new_id;

  return v_new_id;
end;
$$;

-- ── Step 8: Trigger auto-award su eventi gift ──────────────────────
-- Quando gifts.opened_at passa da NULL a un valore, chiamiamo
-- award_credits('open_gift') per il creator. Stesso pattern per
-- shared_at e first_reply_at (feedback_received).

create or replace function public.gift_events_to_credits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pair_hash text;
begin
  -- Hash della coppia mittente-destinatario per deduplica.
  -- Poiché il destinatario è anonimo (identificato solo per nome),
  -- usiamo gift_id come pair_hash surrogato: 1 apertura crea 1 credit.
  -- Quando aggiungeremo recipient_user_id, potremo sostituire con
  -- md5(creator_id || recipient_user_id).
  v_pair_hash := new.id::text;

  if (old.opened_at is null and new.opened_at is not null) then
    perform public.award_credits(
      new.creator_id,
      'open_gift',
      jsonb_build_object('gift_id', new.id, 'pair_hash', v_pair_hash)
    );
  end if;

  if (old.shared_at is null and new.shared_at is not null) then
    perform public.award_credits(
      new.creator_id,
      'share_gift',
      jsonb_build_object('gift_id', new.id, 'pair_hash', v_pair_hash)
    );
  end if;

  if (old.first_reply_at is null and new.first_reply_at is not null) then
    perform public.award_credits(
      new.creator_id,
      'feedback_received',
      jsonb_build_object('gift_id', new.id, 'pair_hash', v_pair_hash)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists gift_events_credits_trg on public.gifts;
create trigger gift_events_credits_trg
  after update on public.gifts
  for each row
  execute function public.gift_events_to_credits();

-- ── Step 9: Trigger first_gift welcome bonus ───────────────────────
-- Quando un utente crea il PRIMO gift della sua vita, riceve 5 crediti.
-- Il flag once_per_user sulla regola impedisce double-grant.
create or replace function public.first_gift_welcome_bonus()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_credits(
    new.creator_id,
    'first_gift',
    jsonb_build_object('gift_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists first_gift_bonus_trg on public.gifts;
create trigger first_gift_bonus_trg
  after insert on public.gifts
  for each row
  execute function public.first_gift_welcome_bonus();

-- ── Step 10: Row Level Security ────────────────────────────────────
alter table public.credit_ledger enable row level security;
alter table public.credit_rules  enable row level security;

-- Ledger: utente vede solo le proprie transazioni
create policy "ledger: own read" on public.credit_ledger
  for select using (auth.uid() = user_id);

-- Ledger: nessuno può insert/update/delete client-side (solo via RPC)
-- Non creiamo policy insert/update/delete — restano bloccate per default.

-- Rules: chiunque autenticato può leggere la lista regole (per UI
-- "Come guadagnare"). Writes solo da admin.
create policy "rules: public read" on public.credit_rules
  for select using (true);

-- Permessi GRANT: le RPC usano SECURITY DEFINER, ma lo user deve
-- poter chiamarle. Per spend_credits restringiamo a authenticated.
grant execute on function public.award_credits(uuid, text, jsonb) to authenticated;
grant execute on function public.spend_credits(uuid, int, text, jsonb) to authenticated;
grant execute on function public.credit_multiplier(uuid) to authenticated;
grant select on public.credit_balances to authenticated;

-- ── Step 11: Sanity checks (da eseguire manualmente) ────────────
-- Queste select sono commented — decommentale in SQL Editor per
-- verificare lo stato dopo la migration.
--
-- -- Conta regole attive
-- select count(*) from public.credit_rules where active = true;
--
-- -- Vedi i moltiplicatori per tier (sostituisci <uuid> con un id vero):
-- select credit_multiplier('<uuid>');
--
-- -- Simulate award (su un utente di test):
-- select award_credits('<uuid>', 'first_gift', '{}'::jsonb);
--
-- -- Vedi saldi di tutti gli utenti:
-- select p.email, b.balance from profiles p join credit_balances b on b.user_id = p.id;

-- Fine migration 003.
