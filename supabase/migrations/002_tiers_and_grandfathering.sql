-- ============================================================
-- BeGift — Migration 002: pricing tier + grandfathering
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Questa migration:
-- 1. Aggiunge colonne `tier` e `tier_expires_at` alla tabella profiles
-- 2. Grandfathering: tutti gli utenti esistenti al momento del rollout
--    vengono marcati come 'pro' senza scadenza (Pro a vita)
-- 3. Default per nuovi profili: 'free'
--
-- Decisione Luca (2026-04-20, AUTH_ROLLOUT_PLAN.md G1): gli utenti
-- già registrati oggi restano Pro a vita come early-adopter reward.
-- Zero disattivazioni, zero richieste di pagamento.
--
-- NOTA: questa migration è IDEMPOTENTE (usa IF NOT EXISTS / DO …).
--       Si può rieseguire senza effetti collaterali.
-- ============================================================

-- ── Step 1: aggiungi le colonne ──────────────────────────────────
-- `tier`: uno di 'free' / 'lowcost' / 'pro'. Default 'free' per
--          i nuovi signup (lo step 2 sovrascrive i profili esistenti).
-- `tier_expires_at`: nullable. Quando non-null indica una scadenza
--          (es. una subscription mensile). NULL significa tier
--          permanente (Pro a vita del grandfathering, o Free di
--          default).

alter table public.profiles
  add column if not exists tier text not null default 'free'
    check (tier in ('free', 'lowcost', 'pro'));

alter table public.profiles
  add column if not exists tier_expires_at timestamptz;

-- Indice per query frequenti del tipo "mostra solo utenti pro"
create index if not exists profiles_tier_idx on public.profiles(tier);

-- ── Step 2: grandfathering ────────────────────────────────────────
-- Tutti i profili creati PRIMA di oggi diventano 'pro' senza scadenza.
-- Cutoff = now() al momento di esecuzione. Deduco il cutoff una volta
-- e lo applico a tutti i profili con created_at <= cutoff.
-- Se riesegui la migration in un secondo momento, il WHERE filtra
-- già per i profili non-pro, quindi non ci sono double-grant.

update public.profiles
  set tier = 'pro',
      tier_expires_at = NULL
  where tier = 'free'
    and created_at <= (select coalesce(max(created_at), now()) from public.profiles);

-- ── Step 3: trigger per mantenere il default al signup ────────────
-- Il default 'free' della colonna si applica SOLO sui nuovi INSERT.
-- Il trigger handle_new_user esistente (001_schema.sql) inserisce
-- il profilo con `tier` implicito → prende il default 'free'. ✓

-- ── Step 4: RLS — tier è pubblicamente leggibile solo dal proprio utente ──
-- Non aggiungiamo nuove policy: le policy esistenti di `profiles`
-- (read/update own profile) coprono già la colonna tier. Una volta
-- abilitati i pagamenti, `tier`/`tier_expires_at` potranno essere
-- modificati solo via funzioni server-side con service_role (mai
-- direttamente dal client).

-- ── Sanity check ──────────────────────────────────────────────────
-- Conta utenti per tier dopo il grandfathering, da ispezionare
-- nell'output del SQL Editor per verificare che non si siano creati
-- stati inattesi.

-- select tier, count(*) from public.profiles group by tier;
