# Sessione autonoma Credit Wallet — 20 aprile 2026

Ciao Luca. Questo è il riepilogo del lavoro che ho fatto mentre eri altrove, sulla base del tuo via libera a implementare il Credit Wallet MVP (sez. 11 del `MARKET_ROADMAP`) in autonomia.

## Cosa ho consegnato

Tutto sul branch **`feature/wallet`** (partito da main, 2 commit). Non mergeato: decidi tu quando portarlo in produzione.

### Backend Postgres (migration 003)

- Tabelle: `credit_rules` (10 regole earn seedate) + `credit_ledger` (log append-only)
- View: `credit_balances` (saldo con expiry filter a 12 mesi)
- 3 RPC atomiche: `award_credits`, `spend_credits` (con advisory lock), `credit_multiplier`
- 2 trigger automatici:
  - `first_gift_bonus_trg` → welcome +5 crediti al primo regalo
  - `gift_events_credits_trg` → +1 crediti su `opened_at`, +3 su `shared_at`, +2 su `first_reply_at`
- Moltiplicatori tier: 0× (free no gifts) / 0.5× (free paid-once) / 1× (lowcost) / 1.5× (pro)
- RLS: ledger read-only per utente, writes bloccati client-side

### Frontend

- Hook `useCredits()` con realtime subscription (nuovi earns aggiornano la UI senza refresh)
- Componente `<CreditWallet />` nel dashboard (saldo + moltiplicatore chip + movimenti recenti + modale "Come guadagnare")
- Componente globale `<CreditToast />` in layout.tsx (notifica "+N crediti" con animazione quando arriva un earn)
- API `/api/credits/spend` per redeem (auth check, whitelist reasons, mappa insufficient balance a HTTP 402)

### Feedback loop app → wallet (cose che ho wirato)

Senza questo pezzo il wallet restava tecnicamente installato ma zero in pratica. Ora:

- Quando un destinatario apre un gift → `/api/gift-opens` aggiorna `gifts.opened_at` → trigger SQL accredita il creator (cooldown 30gg per coppia)
- Ho aggiunto un bottone **"🔗 Condividi questo regalo"** nel GiftOpeningClient dopo l'apertura. Usa Web Share API nativa + fallback clipboard. Chiama `/api/gifts/:id/share` che aggiorna `shared_at` → trigger accredita 3 crediti al creator.

### Documentazione

- `docs/CREDITS_IMPLEMENTATION.md` con architettura, deploy step-by-step, tabelle earn/spend, monitoring queries, rollback
- `supabase/tests/credits_wallet_scenarios.sql` playground SQL per testare 3 scenari utente (free/lowcost/pro) prima di aprire al pubblico

## Per andare live (quando decidi)

Tre step:

1. **Esegui SQL 003** in Supabase Dashboard → SQL Editor (copia-incolla `supabase/migrations/003_credits_wallet.sql`). Verifica: `select count(*) from credit_rules;` deve dire 10.

2. **Abilita Supabase Realtime** sulla tabella `credit_ledger` (Dashboard → Database → Replication → toggle su credit_ledger). Questo fa funzionare il toast realtime. Se non lo attivi, il toast non appare ma tutto il resto funziona.

3. **Set env var Vercel**: `NEXT_PUBLIC_ENABLE_CREDITS_WALLET=true` (Production o Preview), poi redeploy senza cache.

Finché non fai i 3 step, il wallet è invisibile — nessun utente esistente è impattato.

## Cosa manca (roadmap futura)

Nel doc completo (`CREDITS_IMPLEMENTATION.md`) ci sono i TODO dettagliati. I più importanti:

- **Spend UI** — bottoni "Sblocca Pro gift con 10 crediti" nel `/create` o `/lab/3d`. Non l'ho fatto perché senza il 3D in produzione gli sblocchi Pro non hanno feature reali da sbloccare. Quando merghi il 3D in prod, ci torniamo.
- **Referral detection** — richiede una colonna `recipient_user_id` in `gifts` per collegare destinatario → account. Oggi destinatari sono anonimi (solo nome).
- **Streak settimanale** — serve un cron job / Supabase edge function che calcola la continuità ogni lunedì.
- **Profile complete** — va definito cosa significa "profilo completo" e triggerare l'award.
- **Self-gifting detection** — heuristic device fingerprint (stesso IP + UA tra sender/recipient).
- **Admin panel** per modificare `credit_rules` senza SQL diretto.

## Osservazioni strategiche

Qualche pensiero che è emerso mentre lavoravo:

1. **I valori earn vanno calibrati con dati reali**. La sez. 11.5 simula 21 crediti/mese per un subscriber base: in pratica dipende dal traffico. Metti in prod con flag attivo solo per te per 2-4 settimane, poi rilegge le query di monitoring in `CREDITS_IMPLEMENTATION.md` e aggiusta.

2. **Cooldown 30gg per open_gift è stretto** se un utente regala spesso alla stessa persona. Ma è necessario per evitare abuso. Alternativa: ridurre base_value a 0 e compensare con più peso su `share` / `referral_converted` che sono segnali più difficili da falsificare.

3. **Il referral_converted è stato ridotto da 10 a 5** come hai richiesto, è conservativo. Se vedi che il tasso di referral è basso, aumenta a 8-10 per incentivare di più.

4. **Abilitare Realtime su credit_ledger** ha un costo Supabase (conta come "concurrent connections"). Per traffico basso irrilevante, per scala va monitorato dal dashboard.

5. **Il `spend_credits` ha un advisory lock** — sicuro contro race ma serializza le spese per utente. Nessun impatto pratico (un utente non spende 10 volte al secondo), ma noto.

## Cosa NON ho fatto

- Fix dell'hydration error della homepage. Non riesco a riprodurlo senza accesso al browser live, e senza riproduzione rischio di introdurre un bug peggiore. Lo lascio come task standalone quando me lo segnalerai di nuovo.
- Porting del 3D (`feature/gift-experience-v2`) in produzione. Richiede una tua decisione sul feature flag + un test device reale. Lo vedremo insieme quando vuoi.
- Nessun push a GitHub. Il branch `feature/wallet` esiste solo localmente finché non fai tu `git push origin feature/wallet`.

## Totale lavoro sessione

- 2 commit su `feature/wallet`
- 10 file nuovi (~1800 righe totali)
- Type-check pulito (`tsc --noEmit` passa sui file toccati)
- 0 modifiche sul branch main — zero rischio produzione

Stato task: #30 completato.

Ci sentiamo al tuo ritorno.
