# Email Parser POC — Runtime guide

**Branch**: `feature/email-parser-poc`
**Stato**: Proof of Concept completo (sandbox), NON in produzione.

Tutto il codice di questa POC e' isolato: niente sul main, niente attivo finche' non setti i feature flag esplicitamente.

---

## Cosa hai trovato al ritorno

Quando rientri, esegui in console:

```bash
cd /percorso/begift-backend
git checkout feature/email-parser-poc
git log --oneline -10
```

Vedrai i commit POC. Sono tutti sotto questo branch, niente tocca `main`.

## File aggiunti

```
docs/email-parser-poc/
├── SPEC.md                          # Spec tecnica completa (decisioni architetturali)
└── README.md                        # Questo file (runtime guide)

supabase/migrations/
└── 021_email_parser_poc.sql         # Schema gift_drafts + GRANT + RLS

lib/email-parser/
├── parse.ts                         # Entry point: parseEmail()
├── prompts.ts                       # Prompt engineering Claude + detectMerchant()
├── types.ts                         # Type definitions
└── __fixtures__/
    ├── README.md
    ├── run-test.ts                  # Harness CLI per testare il parser
    ├── ticketone-vasco.txt          # Fixture TicketOne
    └── smartbox-weekend.txt         # Fixture Smartbox

app/api/email-inbox/
└── route.ts                         # Webhook SendGrid Inbound Parse (stub)

app/api/draft/[id]/complete/
└── route.ts                         # Endpoint completion draft → gift

app/draft/[id]/
├── page.tsx                         # Server component draft completion
└── DraftCompletionClient.tsx        # Client UI minimale
```

---

## Validazione del POC in 3 step

### Step 1: test del parser con fixture locale (5 min, no setup esterno richiesto)

Verifica che il parser LLM funziona end-to-end con le fixture incluse.

**Prerequisito**: avere `ANTHROPIC_API_KEY` configurata nel terminale (puoi copiarla da Vercel env vars).

```bash
# Dalla root del repo
export ANTHROPIC_API_KEY=sk-ant-...

# Test TicketOne
npx tsx lib/email-parser/__fixtures__/run-test.ts ticketone-vasco

# Test Smartbox
npx tsx lib/email-parser/__fixtures__/run-test.ts smartbox-weekend
```

**Output atteso** (per TicketOne):
- Status: `success`
- Confidence: `>= 0.85`
- Tutti i campi chiave compilati (title, event_date, location, tickets, total_paid_cents, booking_code)
- Costo stimato: `~$0.001`
- Durata: `~2-5 secondi`

**Se il test passa** → il parser funziona. Vai a Step 2.
**Se fallisce** → guarda l'errore. Cause comuni:
- API key mancante/scaduta
- Modello Claude non disponibile (cambia `EMAIL_PARSER_MODEL` env var)
- Rate limit (riprova dopo 1 minuto)

### Step 2: applica migration SQL (5 min)

La tabella `gift_drafts` deve essere creata su Supabase.

**Opzione A - Via Supabase Dashboard (consigliato per POC)**:
1. Vai su Supabase → SQL Editor → New query
2. Copia il contenuto di `supabase/migrations/021_email_parser_poc.sql`
3. Esegui
4. Verifica creation in Table Editor → cerca `gift_drafts`

**Opzione B - Via CLI Supabase** (se usi il flow migrations):
```bash
supabase db push
```

### Step 3: test end-to-end fittizio (10 min)

Simulazione del webhook SendGrid senza setup esterno reale.

1. **Abilita feature flag locale**: aggiungi al `.env.local`:
   ```
   EMAIL_PARSER_ENABLED=true
   NEXT_PUBLIC_FEATURE_EMAIL_PARSER=true
   ```

2. **Avvia il dev server**:
   ```bash
   npm run dev
   ```

3. **Simula chiamata webhook** con curl:
   ```bash
   # Sostituisci YOUR_EMAIL con la tua email registrata in BeGift
   YOUR_EMAIL=psyluca@gmail.com
   
   curl -X POST http://localhost:3000/api/email-inbox \
     -F "envelope={\"from\":\"$YOUR_EMAIL\",\"to\":[\"plans@begift.app\"]}" \
     -F "from=noreply@ticketone.it" \
     -F "subject=Conferma ordine #87234567 - Vasco Rossi" \
     -F "text=$(cat lib/email-parser/__fixtures__/ticketone-vasco.txt | tail -n +5)"
   ```

4. **Output atteso**: `{"ok":true,"draft_id":"<uuid>"}`

5. **Verifica il draft** (loggato come admin):
   ```bash
   open http://localhost:3000/draft/<uuid>
   ```
   
   Dovresti vedere la UI di completion con:
   - Title: "Vasco Rossi - Stadi 2026"
   - Data: 15 luglio 2026
   - Location: Stadio San Siro, Milano
   - Booking code: 87234567
   - Messaggio suggerito: pre-compilato

6. **Completa il flusso**: scrivi un destinatario + personalizza messaggio → click "Completa e invia". Dovresti essere reindirizzato a `/gift/<id>/manage`.

---

## Setup esterno per produzione (Sprint 3, post-validazione)

Quando confermerai che il POC funziona e vuoi rolloutare:

### A. SendGrid Inbound Parse (~30 min setup)

1. Iscriviti a SendGrid (free tier 100 mail/giorno gratis)
2. Configura **Inbound Parse**:
   - Hostname: `plans.begift.app` (sub-dominio dedicato)
   - URL: `https://begift.app/api/email-inbox`
   - Spam check: enable
   - Send Raw: optional
3. Configura DNS su Google Cloud DNS (gestore attuale begift.app):
   - MX record per `plans.begift.app` → `mx.sendgrid.net` priority 10
4. Test deliverability: invia mail di prova a `test@plans.begift.app`, verifica nei log Vercel

### B. Env vars Vercel

Aggiungi:
- `EMAIL_PARSER_ENABLED=true`
- `NEXT_PUBLIC_FEATURE_EMAIL_PARSER=true`
- `EMAIL_PARSER_WEBHOOK_SECRET=<random-32-chars>` (e configura lo stesso su SendGrid se supporta header)
- `EMAIL_PARSER_INBOUND_ADDRESS=plans@begift.app`

### C. Privacy policy

Aggiorna `/privacy` o `/cookie-policy` con sezione dedicata. Template:

```
Parsing automatico di mail forwardate

BeGift offre un servizio opzionale di lettura automatica di email
forwardate dall'utente (es. conferme acquisto da TicketOne, Smartbox,
GetYourGuide). Il contenuto della mail viene processato da un sistema
di intelligenza artificiale (Anthropic Claude API) per estrarre dati
strutturati. Trattamento:

- Base giuridica: consenso esplicito (opt-in nelle impostazioni)
- Dati raccolti: testo body email, allegati (PDF biglietti), mittente, oggetto
- Conservazione: draft cancellati automaticamente dopo 30 giorni se
  non completati
- Diritti utente: revoca consenso in qualsiasi momento, accesso ai
  dati, cancellazione su richiesta
- Sub-processor: Anthropic PBC (USA, Data Processing Addendum firmato),
  SendGrid (USA, Twilio company)
- Transfer extra-UE: SCC (Standard Contractual Clauses) per Anthropic
```

### D. Cron job cleanup drafts scaduti

Aggiungi `app/api/cron/cleanup-drafts/route.ts`:
```typescript
// Marca come 'expired' i draft >30gg non completati
UPDATE gift_drafts SET status='expired' 
WHERE expires_at < now() 
AND status NOT IN ('completed', 'expired');
```

Schedule via Vercel Cron o pg_cron Supabase.

---

## Costi a regime

**Per email processata:**
- SendGrid: gratis (fino a 100/giorno)
- Claude Haiku API: ~€0.001 (1500 token input + 400 output medio)
- Supabase Storage allegati: ~€0.00001
- **Totale: ~€0.001 per email**

**A regime 200 email/mese**: **€0.20/mese** di costi variabili.

---

## Cosa NON ho fatto (e tu devi decidere)

1. **Upload reale allegati su Supabase Storage**: l'endpoint webhook accetta gli allegati ma non li carica ancora. Implementabile in ~30 minuti quando deciderai di andare in produzione.

2. **Mapping completo `gift_drafts.parsed_content` → schema `gifts`**: il POC crea un gift "base" alla completion ma non riempie tutti i campi del template BeGift (template_type, content blocks, ecc.). Da estendere quando avrai Pattern B affiliate per gestire `gift_addons`.

3. **Notifica push/email all'utente** quando arriva un nuovo draft pronto: stub presente, da collegare al sistema Push/Resend esistente.

4. **Setup feature flag UI lato utente**: oggi `/draft/[id]` esiste solo se il feature flag e' on. Manca pagina informativa "Come funziona il forward" + indirizzo email a cui forwardare.

5. **Verifica firma webhook SendGrid**: implementato pattern shared secret, ma firma DKIM/HMAC reale richiede config SendGrid post-iscrizione.

6. **Privacy policy esplicita**: template pronto sopra, da inserire in `/privacy` page.

---

## Decisione GO/NO-GO

Dopo Step 1-3 di validazione, valuta:

| Criterio | OK |
|----------|-----|
| Parser estrae correttamente ≥8 campi da TicketOne fixture | ⬜ |
| Parser estrae correttamente ≥6 campi da Smartbox fixture | ⬜ |
| End-to-end (curl webhook → draft UI) funziona | ⬜ |
| Tempo totale processing <30 secondi | ⬜ |
| Costo confermato <€0.005/mail | ⬜ |

**Se ≥4/5** → procedi a Sprint 3 (setup SendGrid + privacy + rollout 50%).
**Se <4/5** → archiviamo, niente investimento ulteriore. Nessun rischio sul main.

---

## Rollback / Cleanup se decidi NO

```bash
# Torna a main
git checkout main

# Elimina branch POC (locale)
git branch -D feature/email-parser-poc

# La tabella gift_drafts su Supabase resta innocua finche' nessuno la usa.
# Per eliminarla:
#   DROP TABLE public.gift_drafts;
```

Zero impatto su produzione, zero costi maturati (nessuna chiamata API se non hai testato).
