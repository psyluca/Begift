-- ============================================================
-- BeGift — Credit Wallet — scenari di test
-- Esegui in: Supabase Dashboard → SQL Editor (COPIA E INCOLLA)
-- ============================================================
--
-- Questo file NON va eseguito in produzione — è un playground per
-- verificare manualmente i 3 scenari tipici della sez. 11.5 del
-- MARKET_ROADMAP. Crea utenti di test, simula eventi gift, controlla
-- i saldi risultanti.
--
-- ⚠ ATTENZIONE:
-- - Gli utenti di test bypassano auth.users perché l'inserimento
--   diretto lì richiede permessi speciali. Usiamo profiles direttamente,
--   ma per farlo serve rimuovere temporaneamente la FK verso auth.users.
--   In alternativa (più sicuro): crea davvero 3 utenti reali via
--   signInWithOtp e sostituisci gli uuid qui sotto con quelli reali.
-- - Al termine, decommentata la CLEAN UP alla fine per rimuovere gli
--   utenti di test creati.
--
-- Istruzioni:
-- 1. Crea 3 utenti reali (Supabase Dashboard → Authentication → Users
--    → Add User → usa email come test-free@begift.app ecc.).
-- 2. Copia i loro UUID e incollali nei placeholder <TEST_FREE_UUID>,
--    <TEST_LOWCOST_UUID>, <TEST_PRO_UUID> in questo file.
-- 3. Esegui le query in ordine.
-- 4. Al termine elimina i 3 utenti di test da Authentication → Users.
-- ============================================================

-- Sostituisci questi placeholder con UUID reali prima di runnare:
-- (La migration 002_tiers mette tier='pro' di default per grandfathering —
-- quindi dopo aver creato gli utenti di test, aggiorna il loro tier
-- manualmente come sotto.)

-- ── SETUP: imposta i tier dei 3 utenti di test ─────────────────
-- update public.profiles set tier = 'free'    where id = '<TEST_FREE_UUID>';
-- update public.profiles set tier = 'lowcost' where id = '<TEST_LOWCOST_UUID>';
-- update public.profiles set tier = 'pro'     where id = '<TEST_PRO_UUID>';

-- ── SCENARIO A — Utente paid-once (free + ≥1 gift creato), moltiplicatore 0.5 ──
-- Stato iniziale: tier='free', nessun gift, nessun credit

-- Crea primo gift → trigger welcome bonus (first_gift, +5 * 0 = 0 crediti
-- perché moltiplicatore è 0 finché non c'è almeno 1 gift... ma il trigger
-- SI scatena DOPO l'insert, quindi il moltiplicatore diventa 0.5 e arrivano
-- crediti. Edge case: il first_gift trigger si invoca nella stessa
-- transaction dell'insert — il subquery di credit_multiplier vedrà il
-- nuovo gift? Sì, perché trigger AFTER INSERT esegue dopo l'insert
-- della row ma prima del commit, in una visibilità tale che il gift
-- E' visto.

-- insert into public.gifts (creator_id, recipient_name, message, content_type)
-- values ('<TEST_FREE_UUID>', 'Test Dest', 'ciao', 'message');
-- -- Atteso: 1 riga credit_ledger, reason='first_gift', delta=floor(5 * 0.5) = 2

-- Simula apertura del gift (update opened_at → triggera open_gift credit)
-- update public.gifts set opened_at = now()
-- where creator_id = '<TEST_FREE_UUID>'
-- order by created_at desc limit 1;
-- -- Atteso: +1 riga credit_ledger, reason='open_gift', delta=floor(1 * 0.5) = 0
-- -- (0.5 * 1 = 0.5, floor = 0 → RPC ritorna null, niente riga!)
-- -- Nota: azioni di valore 1 non rendono per utenti 0.5×.
-- -- La sez 11.3 deve essere calibrata con questo in mente: i free-paid
-- -- guadagnano principalmente share (3 * 0.5 = 1) e referral (5 * 0.5 = 2).

-- -- Controlla il saldo finale:
-- select balance, lifetime_earned, lifetime_spent
-- from public.credit_balances where user_id = '<TEST_FREE_UUID>';


-- ── SCENARIO B — Subscription base (lowcost, moltiplicatore 1×) ──
-- Atteso ~21 crediti/mese secondo sez. 11.5.

-- insert into public.gifts (creator_id, recipient_name, content_type)
-- values ('<TEST_LOWCOST_UUID>', 'Test1', 'message');
-- -- +5 (first_gift) * 1 = 5 crediti

-- insert into public.gifts (creator_id, recipient_name, content_type)
-- values ('<TEST_LOWCOST_UUID>', 'Test2', 'message'),
--        ('<TEST_LOWCOST_UUID>', 'Test3', 'message');
-- -- 0 crediti (first_gift once_per_user)

-- update public.gifts set opened_at = now(), shared_at = now()
-- where creator_id = '<TEST_LOWCOST_UUID>';
-- -- +1 (open) * 1 = 1 crediti per ogni gift (ma cooldown 30gg/coppia,
-- --   qui ogni gift ha pair_hash = gift_id, quindi 3 crediti)
-- -- +3 (share) * 1 = 3 crediti per ogni gift (9 crediti)

-- -- Atteso saldo: 5 (welcome) + 3 (opens) + 9 (shares) = 17 crediti


-- ── SCENARIO C — Subscription Pro (moltiplicatore 1.5×) ──
-- Atteso ~62 crediti/mese secondo sez. 11.5.

-- insert into public.gifts (creator_id, recipient_name, content_type)
-- values ('<TEST_PRO_UUID>', 'A', 'message'),
--        ('<TEST_PRO_UUID>', 'B', 'message'),
--        ('<TEST_PRO_UUID>', 'C', 'message'),
--        ('<TEST_PRO_UUID>', 'D', 'message'),
--        ('<TEST_PRO_UUID>', 'E', 'message');
-- -- +5 * 1.5 = 7 crediti (welcome, solo primo gift per once_per_user)

-- update public.gifts set opened_at = now() where creator_id = '<TEST_PRO_UUID>';
-- -- +1 * 1.5 = 1 credito per gift × 5 gift = 5 crediti

-- update public.gifts set shared_at = now() where creator_id = '<TEST_PRO_UUID>';
-- -- +3 * 1.5 = 4 crediti per gift × 5 gift = 20 crediti

-- -- Atteso: 7 + 5 + 20 = 32 crediti (manca streak + feedback + gift_received)


-- ── VERIFICA FINALE ─────────────────────────────────────────────
-- Mostra saldo di tutti e 3 gli utenti test:
-- select p.email, p.tier, b.balance, b.lifetime_earned, b.lifetime_spent
-- from public.profiles p
-- left join public.credit_balances b on b.user_id = p.id
-- where p.email like 'test-%@begift.app';

-- Mostra tutto il ledger dei test:
-- select cl.user_id, cl.delta, cl.reason, cl.metadata->>'gift_id' as gift_id, cl.created_at
-- from public.credit_ledger cl
-- join public.profiles p on p.id = cl.user_id
-- where p.email like 'test-%@begift.app'
-- order by cl.created_at;


-- ── CLEAN UP (decommenta per rimuovere dati test) ──────────────
-- delete from public.credit_ledger where user_id in (select id from public.profiles where email like 'test-%@begift.app');
-- delete from public.gifts where creator_id in (select id from public.profiles where email like 'test-%@begift.app');
-- -- Gli utenti stessi vanno eliminati da Authentication → Users in dashboard.


-- ── TEST: spend atomico ─────────────────────────────────────────
-- Verifica che spend_credits fallisca se saldo insufficiente:
-- select spend_credits('<TEST_FREE_UUID>', 999, 'spend_pro_gift');
-- -- Atteso: ERROR:  insufficient balance: has N, needs 999

-- Verifica spesa valida:
-- select spend_credits('<TEST_PRO_UUID>', 10, 'spend_pro_gift', '{"gift_id": "dummy"}'::jsonb);
-- -- Atteso: ritorna un ledger_id, balance decrementa di 10


-- ── TEST: double-award non raddoppia ───────────────────────────
-- Chiama 2 volte first_gift sullo stesso utente — la seconda deve ritornare null:
-- select award_credits('<TEST_PRO_UUID>', 'first_gift', '{}'::jsonb);
-- -- Atteso: null (once_per_user già consumato)
