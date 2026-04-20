# Credit Wallet — implementation guide

MVP del sistema di crediti BeGift (sez. 11 del `MARKET_ROADMAP`). Implementazione del modello ibrido: il wallet si sblocca con qualunque pagamento (anche 1 gift), la subscription dà moltiplicatori. Tutto gated dietro feature flag, zero impatto produzione finché non lo attivi.

## Architettura

```
┌──────────────────────────────────────────────────────────────────┐
│  CLIENT (Next.js)                                                │
│                                                                  │
│  /dashboard (server page)                                        │
│   └─ DashboardClient (client)                                    │
│       └─ <CreditWallet userId={...} />                           │
│            uses useCredits() → live data + spend()               │
│                                                                  │
│  app/layout.tsx                                                  │
│   └─ <CreditToast/> (globale, notifica realtime su nuove earn)   │
│                                                                  │
│  fetch('/api/credits/spend')  ◄── chiamato da useCredits.spend() │
└──────────────────────────────────────────────────────────────────┘
                         │ Supabase JS + fetch
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  SERVER (Next.js API route)                                      │
│   /api/credits/spend → supabase.rpc('spend_credits', ...)        │
└──────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  SUPABASE (Postgres)                                             │
│                                                                  │
│  Tabelle:                                                        │
│   - credit_rules (regole earn, configurabili)                    │
│   - credit_ledger (transazioni immutabili append-only)           │
│                                                                  │
│  View:                                                           │
│   - credit_balances (SUM(delta) con expiry filter)               │
│                                                                  │
│  RPC (security definer, atomiche):                               │
│   - award_credits(user_id, reason, metadata) → bigint            │
│   - spend_credits(user_id, amount, reason, metadata) → bigint    │
│   - credit_multiplier(user_id) → numeric                         │
│                                                                  │
│  Trigger:                                                        │
│   - first_gift_bonus_trg su INSERT gifts → welcome bonus         │
│   - gift_events_credits_trg su UPDATE gifts → open/share awards  │
│                                                                  │
│  RLS:                                                            │
│   - ledger: SELECT own only                                      │
│   - rules:  SELECT public                                        │
│   - ledger INSERT/UPDATE/DELETE: bloccati (solo via RPC)         │
└──────────────────────────────────────────────────────────────────┘
```

## File aggiunti in questa implementazione

```
supabase/
├── migrations/003_credits_wallet.sql           (~280 righe SQL)
└── tests/credits_wallet_scenarios.sql          (playground SQL di test)

hooks/
└── useCredits.ts                               (hook React con realtime)

components/
└── wallet/
    ├── CreditWallet.tsx                        (UI dashboard + modale rules)
    └── CreditToast.tsx                         (notifica globale earn)

app/
├── api/credits/spend/route.ts                  (API server-side spend)
├── dashboard/DashboardClient.tsx               (+2 righe: import + render)
└── layout.tsx                                  (+2 righe: <CreditToast/>)

docs/
└── CREDITS_IMPLEMENTATION.md                   (questo file)
```

## Deploy — step-by-step

### 1. Esegui la SQL migration 003

Supabase Dashboard → **SQL Editor** → **New Query** → incolla il contenuto di `supabase/migrations/003_credits_wallet.sql` → **Run**.

Deve finire con "Success. No rows returned". La migration è **idempotente**: rieseguibile senza effetti collaterali.

**Verifica immediata**:

```sql
-- Conta regole seedate
select count(*) from credit_rules where active = true;
-- Atteso: 10

-- Verifica che i trigger siano attivi
select tgname from pg_trigger where tgrelid = 'public.gifts'::regclass;
-- Atteso: first_gift_bonus_trg, gift_events_credits_trg, + eventuali triggers esistenti
```

### 2. Attiva il feature flag su Vercel

Vercel Dashboard → Settings → **Environment Variables** → aggiungi:

- Key: `NEXT_PUBLIC_ENABLE_CREDITS_WALLET`
- Value: `true`
- Environments: Preview (per test) + Production (quando vuoi andare live)

Redeploy (Deployments → ⋯ → Redeploy, **senza build cache**).

### 3. Verifica UI

Apri `/dashboard` in un account con tier='pro' (grandfathered). Dovresti vedere:
- Box wallet col saldo (inizialmente 0)
- Chip "1.5× Pro"
- CTA "Come guadagnare crediti"

Crea un nuovo gift → il trigger `first_gift_bonus` scatta → saldo diventa 7 (5 × 1.5, arrotondato floor). Il toast "+7 crediti — primo regalo!" deve apparire in alto.

## Tier e moltiplicatori

Definiti in `credit_multiplier()`:

| Tier utente                     | Moltiplicatore |
|---------------------------------|----------------|
| `free` senza gift creati        | **0×** (wallet locked — teaser)   |
| `free` con ≥1 gift creato       | **0.5×** (paid-once heuristic)    |
| `lowcost` (subscription base)   | **1×**                           |
| `pro` (subscription + grandfathered) | **1.5×**                    |

**Attenzione**: fino a quando Stripe non è integrato, "paid-once" è euristicamente "ha creato almeno un gift". Quando aggiungeremo Stripe (o un altro provider), sostituire la heuristic con una colonna `has_paid boolean` in profiles + aggiornare `credit_multiplier`.

## Tabelle earn configurabili (credit_rules)

Seed iniziale:

| reason                | base | cooldown | once_per_pair | once_per_user | descrizione |
|-----------------------|------|----------|---------------|---------------|-------------|
| `first_gift`          | 5    | 0h       | -             | ✓             | Welcome bonus |
| `open_gift`           | 1    | 720h (30gg) | ✓          | -             | Dest apre |
| `share_gift`          | 3    | 0h       | ✓             | -             | Dest condivide |
| `referral_converted`  | 5    | 0h       | -             | -             | Referral paga 1 gift (ridotto da 10 v1) |
| `weekly_streak`       | 5    | 168h (7gg) | -           | -             | 4 settimane attive |
| `feedback_received`   | 2    | 720h     | ✓             | -             | Feedback ricevuto |
| `invite_installed`    | 5    | 0h       | -             | -             | Invito → account pagante |
| `profile_complete`    | 3    | 0h       | -             | ✓             | Profilo pieno |
| `gift_received`       | 1    | 720h     | ✓             | -             | Solo subscriber: apertura gift ricevuto |
| `gift_shared_rcvd`    | 3    | 0h       | ✓             | -             | Solo subscriber: condivisione gift ricevuto |

Modifica i valori:

```sql
update credit_rules set base_value = 6, updated_at = now() where reason = 'share_gift';
```

Disabilita una regola:

```sql
update credit_rules set active = false, updated_at = now() where reason = 'weekly_streak';
```

## Spend — cosa è consentito

Whitelist delle `reason` accettate dall'API `/api/credits/spend` (definita in `app/api/credits/spend/route.ts`):

- `spend_pro_gift` — 1 gift pro singolo (costo consigliato: 10)
- `spend_custom_paper` — carta caricata (3)
- `spend_custom_song` — canzone caricata (5)
- `spend_ai_pattern` — pattern AI-generated (8)
- `spend_24h_pro` — 24h Pro illimitato (50)
- `spend_month_pro` — 1 mese Pro (200)
- `spend_skin_preview` — skin anteprima (15)
- `spend_cosmetic` — badge/cornice (20-50)

I costi effettivi sono decisi dal caller (es. Lab3DClient quando un utente usa una feature Pro gratuitamente). La whitelist server-side previene che un client compiled malizioso passi reason arbitrari.

## Trigger automatici

Scattano senza codice applicativo:

### `first_gift_bonus_trg` (AFTER INSERT su gifts)
Il primo insert di un gift per un utente genera 5 crediti (welcome). `once_per_user=true` impedisce double-grant.

### `gift_events_credits_trg` (AFTER UPDATE su gifts)
Quando `opened_at` passa da NULL a valore → chiama `award_credits(creator, 'open_gift')`.
Stesso per `shared_at` → `'share_gift'`, e `first_reply_at` → `'feedback_received'`.

**Per far scattare questi trigger lato app**, quando un destinatario apre un gift vuoi:

```ts
await supabase
  .from('gifts')
  .update({ opened_at: new Date().toISOString() })
  .eq('id', giftId)
  .is('opened_at', null);  // idempotente: prima sola apertura conta
```

Oggi nessun flusso nel codice app aggiorna questi campi — serve integrare questa update chiamata nel flow `/gift/[id]` (vedi TODO in fondo a questo doc).

## Anti-abuse misure implementate

1. **Cooldown per coppia** via `cooldown_hours` + `metadata.pair_hash`. Es. `open_gift` ha 30gg cooldown per la stessa coppia mittente-destinatario.
2. **Once-per-user**: regole come `first_gift` e `profile_complete` sono one-shot per account.
3. **Once-per-pair senza cooldown**: `share_gift` è 1 sola volta per gift (pair_hash = gift_id).
4. **Advisory lock su spend**: `pg_advisory_xact_lock(hashtext(user_id))` dentro `spend_credits()` previene race condition (double spend concorrente).
5. **RLS**: il ledger è read-only per l'utente, write solo via RPC. Impossible per client-side.
6. **Whitelist reason spend**: solo valori pre-approvati accettati da `/api/credits/spend`.
7. **Expiry 12 mesi**: `expires_at` set su ogni award. `credit_balances` view filtra le righe scadute.
8. **Amount cap API**: max 10.000 crediti per singola chiamata spend (previene bug di overflow).

## Manca / follow-up (non v1)

Voci note del roadmap che NON sono implementate in questa iterazione:

- [ ] Chiamata `UPDATE gifts.opened_at` dal flusso `/gift/[id]` per far scattare il trigger (oggi il trigger esiste ma nessuno chiama).
- [ ] Detection "share": serve un bottone "Condividi" nella scena post-apertura che chiami `UPDATE gifts.shared_at`.
- [ ] Detection referral: trigger su INSERT di un gift dove creator è un utente che in precedenza era destinatario. Richiede `recipient_user_id` in gifts (oggi abbiamo solo `recipient_name`).
- [ ] Streak settimanale: cron job o edge function che verifica 4 settimane consecutive.
- [ ] Profile complete: definire cosa significa "profilo completo" (avatar_url + display_name + ? ) e triggerare l'award.
- [ ] Device fingerprint per self-gifting detection. Heuristic v2: stesso IP + stesso User-Agent tra sender e recipient → flag.
- [ ] Toast realtime richiede Supabase Realtime abilitato sulla tabella `credit_ledger`. Verifica: Supabase Dashboard → Database → Replication → abilita su credit_ledger (insert event).
- [ ] Sezione "Spendi i crediti" nella UI Pro (Lab3DClient, CreateGiftClient): bottoni "Sblocca con 10 crediti" quando l'utente sceglie una feature Pro senza subscription.
- [ ] Amministrazione: pannello per modificare `credit_rules` senza SQL diretto.

## Monitoring / analytics queries

```sql
-- Distribuzione saldi utenti (P50, P90, P99)
select
  percentile_disc(0.5)  within group (order by balance) as p50,
  percentile_disc(0.9)  within group (order by balance) as p90,
  percentile_disc(0.99) within group (order by balance) as p99,
  max(balance) as max
from credit_balances;

-- Top 10 utenti per saldo
select p.email, p.tier, b.balance, b.lifetime_earned
from credit_balances b
join profiles p on p.id = b.user_id
order by b.balance desc
limit 10;

-- Distribuzione earn per reason (ultimi 30gg)
select reason, count(*), sum(delta) as total_awarded
from credit_ledger
where delta > 0 and created_at > now() - interval '30 days'
group by reason
order by total_awarded desc;

-- % crediti scaduti non spesi (indicatore "troppo duro da spendere")
select
  100.0 * count(*) filter (where expires_at < now() and delta > 0) / nullif(count(*) filter (where delta > 0), 0) as pct_expired
from credit_ledger;

-- Utenti "aspettano 10 crediti per 1 Pro" — potenziale audience per email push
select p.email, b.balance
from credit_balances b
join profiles p on p.id = b.user_id
where b.balance between 7 and 9  -- quasi pronti per spend_pro_gift (10)
  and p.tier != 'pro';
```

## Rollback

Se serve disattivare il wallet in emergenza:

1. Metti `NEXT_PUBLIC_ENABLE_CREDITS_WALLET=false` su Vercel → redeploy. UI sparisce istantaneamente. I trigger SQL continuano a registrare transazioni nel ledger ma nessuno le vede.

2. Rollback totale (molto raro):
   ```sql
   drop trigger gift_events_credits_trg on public.gifts;
   drop trigger first_gift_bonus_trg on public.gifts;
   drop function public.gift_events_to_credits();
   drop function public.first_gift_welcome_bonus();
   drop function public.spend_credits(uuid, int, text, jsonb);
   drop function public.award_credits(uuid, text, jsonb);
   drop function public.credit_multiplier(uuid);
   drop view public.credit_balances;
   drop table public.credit_ledger;
   drop table public.credit_rules;
   alter table public.gifts
     drop column opened_at,
     drop column shared_at,
     drop column first_reply_at;
   ```
   Attenzione: distrugge tutte le transazioni crediti. Usa solo in caso di dati corrotti.

Fine.
