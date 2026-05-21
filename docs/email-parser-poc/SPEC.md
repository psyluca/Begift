# Email Parser POC — Spec tecnica

**Branch**: `feature/email-parser-poc`
**Stato**: Proof of Concept (NON in produzione, NON mergiato)
**Iniziato**: 2026-05-14
**Owner sviluppo**: Luca + Claude

---

## Cosa

Funzionalità ispirata a Tripit: l'utente forwarda mail di conferma acquisto (biglietti TicketOne, cofanetti Smartbox, esperienze GetYourGuide, hotel Booking, ecc.) a un indirizzo BeGift dedicato, e BeGift estrae automaticamente i dati strutturati creando una **bozza di gift pre-popolata**. L'utente apre BeGift, trova il pacco già 80% pronto, aggiunge solo il messaggio emozionale e invia.

## Perché

**Riduzione friction drammatica** nel "momento di high intent":
- Flusso attuale BeGift: 5-10 min di compilazione manuale
- Con email parsing: 1-2 min (solo personalizzazione emozionale)

**Cattura il momento giusto**: il sender è in mindset "voglio fare un regalo" subito dopo l'acquisto, non un'ora dopo quando si dimentica.

**Differenziazione vs competitors** (Amoore, agift, ecc.): nessuno ha parsing intelligente. Moat 6-12 mesi.

**Sinergia Pattern B affiliate**: risolve elegantemente il cookie 1gg Smartbox — il sender compra Smartbox via affiliate, conferma arriva via mail, forwarda a BeGift, gift pre-popolato senza incollare codici manualmente.

## Use case prioritari per il POC

POC focalizzato su **1 merchant**: TicketOne (alto valore, formato mail stabile).

Espansione futura post-validazione:
- Smartbox / Wonderbox (cofanetti esperienza)
- Vivaticket (biglietti sport/eventi)
- GetYourGuide (esperienze locali)
- Booking.com (hotel)
- Trenitalia (treni — già richiesto da molti utenti)
- Cinema (UCI, The Space, MyMovies)

## Architettura tecnica

```
┌─────────────────────┐
│ Sender's email      │
│ (Gmail, Outlook…)   │
└─────────┬───────────┘
          │
          │ forward a plans@begift.app
          │ (o forward@begift.app)
          ▼
┌─────────────────────┐
│ SendGrid Inbound    │
│ Parse webhook       │
└─────────┬───────────┘
          │ POST con body+attachments
          ▼
┌─────────────────────┐
│ /api/email-inbox    │ Next.js endpoint
│ - Auth sender       │ verifica email in profiles
│ - Estrai body       │
│ - Salva attachments │ Supabase Storage
│ - Call LLM parser   │ Claude API
└─────────┬───────────┘
          │ structured JSON
          ▼
┌─────────────────────┐
│ gift_drafts table   │ Supabase Postgres
│ pre-populated data  │
└─────────┬───────────┘
          │
          │ notifica utente (push + email)
          ▼
┌─────────────────────┐
│ UI completion       │ /draft/[id]
│ - Mostra dati       │
│ - Aggiungi messaggio│
│ - Invia gift        │
└─────────────────────┘
```

## Componenti del POC

### 1. Schema DB — `gift_drafts` table

Tabella separata da `gifts` perché è uno stato intermedio "pre-completion". Schema con GRANT espliciti (futuro-proof Supabase post 2026-10-30).

Vedi: `supabase/migrations/021_email_parser_poc.sql`

### 2. LLM parser module

Module Python-like ma in TypeScript: prende il body raw di una mail + eventuali allegati (PDF/img), restituisce JSON strutturato.

Prompt engineering specifico per merchant (TicketOne nel POC, estensibile).

Vedi: `lib/email-parser/parse.ts`

### 3. Inbound webhook endpoint

Endpoint Next.js che riceve i POST da SendGrid Inbound Parse, autentica il sender (verifica email esista in `profiles`), salva allegati su Supabase Storage, chiama il parser, inserisce in `gift_drafts`.

Vedi: `app/api/email-inbox/route.ts`

### 4. UI completion

Pagina protetta dietro feature flag `NEXT_PUBLIC_FEATURE_EMAIL_PARSER` che mostra il draft pre-popolato e permette di completarlo come fosse un gift normale.

Vedi: `app/(email-parser-poc)/draft/[id]/page.tsx`

### 5. Test fixtures + harness

Mail di esempio (anonimizzate) per testare il parser senza richiedere configurazione SendGrid reale.

Vedi: `lib/email-parser/__fixtures__/`

## Setup esterno richiesto (azione di Luca, post-POC)

1. **Configurazione DNS** del dominio `begift.app`:
   - Aggiungere MX record per sotto-dominio `plans.begift.app` puntante a SendGrid Inbound
   - Configurare SPF/DKIM per email outbound (già fatto per Resend, potrebbe richiedere update)

2. **Account SendGrid**:
   - Iscriversi (free tier: 100 mail/giorno gratis)
   - Configurare Inbound Parse webhook puntante a `https://begift.app/api/email-inbox`
   - Salvare `SENDGRID_INBOUND_KEY` (hash di verifica) come env var Vercel

3. **Env vars Vercel da aggiungere**:
   - `SENDGRID_INBOUND_KEY` (per verifica webhook)
   - `EMAIL_PARSER_ENABLED=true` (feature flag server)
   - `NEXT_PUBLIC_FEATURE_EMAIL_PARSER=true` (feature flag client)
   - `EMAIL_PARSER_INBOUND_ADDRESS=plans@begift.app` (mostrato nelle istruzioni utente)

4. **Privacy policy update**:
   - Aggiungere sezione "Parsing automatico di mail forwardate"
   - Spiegare trattamento dati, retention, diritti utente

## Cost analysis

**Per email processata:**
- SendGrid Inbound Parse: gratis (free tier 100/giorno = ~3000/mese)
- Claude API (Haiku, ~2000 token in input + 500 token output): ~$0.001
- Supabase Storage (allegato medio 500KB): ~$0.00001
- **Totale per email: ~€0.001**

**A regime 200 email parsate/mese:** ~€0.20/mese di costi variabili. Trascurabile.

## Risk register

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| LLM parsing inaccurato | Media | Alto | Fallback a "draft con dati grezzi", utente verifica manualmente |
| User forwarda mail spam/phishing | Bassa | Medio | Whitelist domini merchant + rate limit + verifica DKIM |
| Costo Claude API esplode | Bassa | Basso | Rate limit per utente (10 mail/giorno) + monitor mensile |
| GDPR compliance | Media | Alto | Privacy policy esplicita + consenso opt-in dedicato + cancellazione automatica draft non completati dopo 30gg |
| SendGrid downtime | Bassa | Medio | Fallback queue: mail bounceranno con retry, utente può rifworwardare |

## Roadmap di sviluppo POC

**Sprint 1 — Foundation (oggi, 2 ore)**: ✅ in corso
- [x] Branch + spec
- [x] Schema SQL + migration
- [x] LLM parser module
- [x] Stub endpoint inbound
- [x] Test fixtures
- [x] UI completion mockup
- [x] README runtime

**Sprint 2 — Validazione (1-2 giorni quando Luca riprende)**:
- [ ] Run test del parser su fixture reale (mail TicketOne anonimizzata di esempio)
- [ ] Iterare prompt per qualità parsing
- [ ] Decisione GO/NO-GO per produzione

**Sprint 3 — Setup esterno (3-5 giorni se GO)**:
- [ ] Account SendGrid + DNS config
- [ ] Test end-to-end con mail forwardata reale
- [ ] Privacy policy update
- [ ] Feature flag rollout (50% utenti, poi 100%)

**Sprint 4 — Espansione merchant (2-4 settimane)**:
- [ ] Smartbox parser
- [ ] Wonderbox parser
- [ ] GetYourGuide parser
- [ ] Booking parser
- [ ] Trenitalia parser

## Esempio output parser (atteso da TicketOne)

Input: mail conferma biglietti concerto TicketOne

Output JSON atteso:
```json
{
  "merchant": "ticketone",
  "type": "event_ticket",
  "event_title": "Vasco Rossi - Stadi 2026",
  "event_date": "2026-07-15T21:00:00+02:00",
  "event_venue": "Stadio San Siro, Milano",
  "tickets": [
    { "section": "Pit Standing", "row": null, "seat": null, "quantity": 2 }
  ],
  "total_paid_eur": 200.00,
  "booking_code": "TCT-XXXXXX",
  "attachment_pdf_url": "https://supabase-storage.../ticket.pdf",
  "confidence": 0.95
}
```

L'oggetto viene poi mappato in `gift_drafts.parsed_content`, e il template BeGift pre-popola con:
- Tipo regalo: "Biglietto concerto"
- Data evento (per il countdown emozionale)
- Foto venue (auto-recuperata o cercata)
- Suggerimento messaggio: "So che lo aspettavi da una vita, ti accompagnerò al concerto di Vasco!"

## Successo del POC

Il POC è considerato un successo se:

1. ✅ Il parser estrae correttamente almeno **8 su 10 campi chiave** da una mail TicketOne reale
2. ✅ Il tempo end-to-end (forward email → draft pronto in BeGift) è **<30 secondi**
3. ✅ Il sender, vedendo il draft pre-popolato, lo percepisce come "magico" (test qualitativo con 3-5 utenti pilota)
4. ✅ Il costo per email è **<€0.01** confermato in produzione
5. ✅ Zero GDPR concerns sollevati dal commercialista/eventuale legale

Se 3 su 5 → vale la pena passare a Sprint 3.
Se <3 su 5 → archiviamo, niente investimento ulteriore.
