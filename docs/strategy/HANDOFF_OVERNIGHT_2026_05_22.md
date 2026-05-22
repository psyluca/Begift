# Handoff overnight 2026-05-21 → 2026-05-22

> Ciao Luca, buongiorno. Questo è il resoconto del lavoro fatto nella notte.

Branch: `feature/overnight-revamp` (parte da `main`, 4 commit).

## TL;DR — cosa è stato fatto

Tre macro-aree, tutte completate:

1. **24 Bottles** — architettura completa per regali fisici (migration + seed + tipi + UI + docs)
2. **Piano growth 100k visit/mese** — documento operativo con calendario 12 mesi
3. **UX revamp** — audit completo + design tokens + 7 implementazioni puntate (Skeleton, Toast, 404, focus ring, ecc.)

Tutto su branch dedicato `feature/overnight-revamp` per tua review prima del merge. Nessuna modifica diretta a `main` — il sito attuale è inalterato.

## Cosa fare al risveglio (in ordine)

### 1. Review del branch (15 min)

Sul Mac:
```bash
git fetch origin
git checkout feature/overnight-revamp 2>/dev/null || git checkout -b feature/overnight-revamp origin/feature/overnight-revamp
git log --oneline main..HEAD
```

Vedrai 4 commit:
- `28f442d` 24 Bottles scaffold
- `c98a6c8` Growth plan doc
- `70e577d` UX audit doc
- `cf850b5` UX iterations (design tokens, skeleton, toast, 404)

Push del branch:
```bash
git push -u origin feature/overnight-revamp
```

Vercel creerà un **preview deploy** del branch — vedrai l'URL sul commit (es. `https://begift-git-feature-overnight-revamp-...vercel.app`). Aprilo in incognito e verifica:

- `/regalo/catalogo` — durante caricamento vedi skeleton (provo a fare F5 più volte per cogliere il flash)
- `/regalo/catalogo?tipo=physical` (se vuoi vedere i nuovi 24Bottles in catalogo, esegui prima il seed — vedi #4)
- `/` (home) — più o meno uguale a oggi
- `/drafts` — testa la cancellazione: il vecchio `alert()` ora è un toast in basso
- Apri una URL inesistente (es. `/foo-bar`) → vedi nuova 404 con emoji float + 3 link suggeriti
- Naviga con Tab → vedi focus ring rosa visibile su ogni elemento interattivo

### 2. Leggi i 3 documenti strategici (45 min)

Sono dove tutto il pensiero è documentato:

- **`docs/strategy/GROWTH_PLAN_100K.md`** (15 min lettura) — Piano operativo 12 mesi con calendario settimanale, canali prioritizzati, budget, metriche. Decidi se le priorità coincidono con la tua disponibilità reale (5-7h/settimana).

- **`docs/strategy/UX_REVAMP_AUDIT.md`** (15 min lettura) — Audit completo di tutte le pagine, problemi P1/P2/P3 prioritizzati per ROI. Le 7 implementate in questa notte sono solo i P1. I P2 (refactor opening pack, ridisegno create flow, mobile FAB) richiedono effort più alti — quando vuoi affrontarli mi dici quale.

- **`docs/architecture/PHYSICAL_GIFTS.md`** (10 min lettura) — Spiegazione tecnica completa dell'integrazione 24Bottles. Contiene anche la sezione "TODO post-overnight" con i 4 punti che servono perché tutto funzioni davvero in prod.

### 3. Decisione su merge (5 min)

Se i documenti convincono e la preview deploy del branch è OK:
- Merge `feature/overnight-revamp` in `main` (come hai già fatto con `feature/catalog-import`)
- Push di main → Vercel ridepoyya production
- Tutto live

Se vuoi rivedere/scartare qualche parte:
- Resta sul branch
- Cherry-pick solo i commit che ti convincono
- Oppure mi dici cosa cambiare e itero domani

### 4. Lanciare i 2 nuovi SQL su Supabase (10 min)

**Migration 028 (obbligatoria per attivare regali fisici)**:

Vai su Supabase SQL Editor → copia/incolla il contenuto di `supabase/migrations/028_physical_gifts.sql` → Run. Aggiunge 3 colonne a `experiences` + partner `tradedoubler`. Idempotente.

**Seed 24Bottles (opzionale, popola 8 prodotti esempio)**:

Lancia poi `supabase/seed_24bottles_products.sql`. Inserisce 8 SKU 24Bottles con `is_physical_gift=true` e shipping 4 giorni. **Hanno URL affiliate placeholder `{td_program_id}`** — quando metterai le credenziali TradeDoubler reali, sostituisci con il vero program_id 24Bottles (SQL pronta in PHYSICAL_GIFTS.md).

### 5. Quando arrivi a feedback massaggiatrice / 24Bottles vivente

Se la massaggiatrice è pronta per il test (B2B), procedi con `supabase/onboard_business_account.sql` come da istruzioni di ieri.

Se vuoi attivare 24Bottles davvero:
1. Vai su tradedoubler.com → trova il program_id 24Bottles dal tuo publisher account
2. Aggiungi env var `TRADEDOUBLER_PUBLISHER_ID` su Vercel
3. SQL UPDATE su `experiences` per sostituire `{td_program_id}` nei template
4. Aggiungi immagini prodotto via SQL UPDATE (`image_url` + `product_image_url`)

Se vuoi anche l'animazione di apertura mostri immagine bottiglia + data consegna: è P2 (4-6h refactor `OpenPackClient.tsx`). Te lo posso fare dopo se decidi di prioritizzarlo.

## Statistiche notte

| Metric | Valore |
|---|---|
| Commit creati | 4 |
| File nuovi | 11 |
| Righe codice/docs aggiunte | ~1850 |
| Tempo dedicato | ~5h (di 6 a budget) |
| Typecheck | ✓ pulito |
| Test eseguiti | typecheck + visual review codice |
| Vercel deploy testato | (no, push richiede te dal Mac) |

## File creati / modificati

```
A docs/architecture/PHYSICAL_GIFTS.md            — doc 24Bottles
A docs/strategy/GROWTH_PLAN_100K.md              — piano growth
A docs/strategy/UX_REVAMP_AUDIT.md               — audit UX completo
A docs/strategy/HANDOFF_OVERNIGHT_2026_05_22.md  — questo file

A supabase/migrations/028_physical_gifts.sql     — schema regali fisici
A supabase/seed_24bottles_products.sql           — 8 SKU 24Bottles

A components/EmptyState.tsx                      — riusabile
A components/Skeleton.tsx                        — loading states
A components/ToastProvider.tsx                   — toast system

A app/regalo/catalogo/loading.tsx                — skeleton catalog

M app/globals.css                                — design tokens
M app/layout.tsx                                 — ToastProvider mount
M app/not-found.tsx                              — 404 rifatta
M app/experiences/[id]/page.tsx                  — banner regalo fisico
M app/regalo/catalogo/page.tsx                   — badge "a casa"
M app/api/img-proxy/route.ts                     — whitelist 24bottles.com
M app/drafts/DraftsClient.tsx                    — toast invece di alert
M types/experiences.ts                           — PartnerSlug+physical fields
M lib/experiences/partners.ts                    — tradedoubler config
```

## Cose che NON ho fatto (per chiarezza)

- ❌ Refactor opening pack `/g/[token]` per regali fisici — è P2 nell'audit, 4-6h
- ❌ Email parser hook 24Bottles — serve sample mail conferma
- ❌ Activation massaggiatrice — l'hai detto che lo facevi tu
- ❌ Push del branch su origin — il sandbox non ha SSH GitHub, devi fare tu dal Mac
- ❌ Test E2E di flusso completo regali fisici — manca DB live con migration 028

## Ipotesi che ho preso (verifica se le condividi)

1. 24Bottles flusso = affiliate + mail forward (confermato da te ieri)
2. TradeDoubler come network principale per 24Bottles (memoria + tua conferma)
3. Design tokens migration progressiva (CSS vars), non rewrite con Tailwind
4. Growth plan ottimistico ma sostenibile per side-project 5-7h/settimana
5. Tutti i commit su branch separato (richiesto)
6. Approccio "doc first + code top P1": preferito a "tutto codice no spiegazioni"

Se uno di questi non ti convince, ne riparliamo domani e adatto.

## Domande aperte per te

1. **24Bottles program ID su TradeDoubler** — quando vuoi attivarlo davvero, mi serve quello + le credenziali
2. **Sample mail conferma 24Bottles** — quando l'avrai (es. fai un ordine tuo), inoltralo a me così scrivo il parser
3. **Priorità P2** — dopo il merge, quale dei P2 vuoi che affronti? Refactor opening pack? Create flow? Mobile bottom-nav?
4. **Massaggiatrice** — è andata l'onboarding? Se hai bisogno di una mano col SQL `onboard_business_account.sql` me lo dici
5. **Test catalogo VVT/GYG dopo merge** — quando tutto sarà live, fai un giro completo del catalogo. Se trovi altri link rotti, lavoriamo come ieri.

## Mood

Le 5h passate bene. Niente errori bloccanti, typecheck verde, tutto su branch isolato. Il codice rispetta lo stack esistente (no nuove dipendenze npm — solo CSS vars + componenti React vanilla). Il design system tokens è il vero pezzo che permetterà polish progressivo nei prossimi mesi senza dover ogni volta cercare quale rosa usare.

Spero abbia dormito bene. A domani.

— Claude
