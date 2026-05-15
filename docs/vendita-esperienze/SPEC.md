# Vendita Esperienze — SPEC

**Status**: Draft v0.1 — scritto durante lo sprint di Luca a pranzo, 2026-05-15
**Owner**: Luca + Claude
**Stato implementazione**: 0% (solo SPEC + scaffold) — branch `feature/email-parser-poc`, da spostare su `feature/vendita-esperienze` dopo validazione

---

## TL;DR

Trasformare BeGift da "wrapper emozionale di gift che hai già comprato altrove" (modello attuale) a **anche** "discovery + purchase platform di esperienze giftabili". Modello revenue: commissioni affiliate via partner che hai già attivi (Awin, TradeDoubler, GetYourGuide).

**Due flussi complementari, non sostitutivi:**

| Flusso | Quando si usa | Origine esperienza | Revenue per BeGift |
|---|---|---|---|
| **Inbound** (email parser, già fatto in POC) | "Ho già comprato la cena, voglio impacchettarla" | User l'ha pre-acquistata altrove e forwarda mail | €0 (servizio gratuito, costo Anthropic ~€0.001 per parsing) |
| **Outbound** (vendita esperienze, questa SPEC) | "Cerco un regalo per la mamma, suggeriscimi qualcosa" | BeGift mostra catalogo curato, user clicca "regala" → redirect affiliate | **5-12% commissione** sul venduto (varia per partner/categoria) |

Il flusso Outbound chiude l'esperienza utente: scoprire → personalizzare → inviare → ricevere → riscattare. Tutto dentro BeGift, con monetizzazione "invisibile" dal punto di vista del destinatario.

---

## Vision

> "Non solo impacchetti regali che hai già comprato. BeGift ti aiuta anche a **trovare** il regalo giusto, partendo dalla persona a cui pensi."

**Differenziatore vs Amoore/agift/ababy** (competitor diretti memorizzati): loro vendono cataloghi predefiniti. BeGift fa **discovery personalizzata + storytelling emozionale**.

Esempio user journey ideale:

> Anna apre BeGift. È il compleanno della mamma fra 10 giorni. Anna scrive: "Mia mamma, 68 anni, ama camminare, abita a Firenze, è la prima volta che le faccio un regalo da sola dopo il divorzio."
>
> BeGift mostra:
> - 🚶 Tour guidato Oltrarno + degustazione vini (€45, GetYourGuide, 4.8★)
> - 🍕 Lezione di cucina toscana 3 ore (€89, GetYourGuide, 4.9★)
> - 🧘 Day spa Adler Cavalieri (€120, Booking)
>
> Anna clicca su "Tour Oltrarno". BeGift confeziona un pacco con: foto del tour, descrizione, **storia emozionale generata su misura** ("Mamma, so che ami camminare e che Firenze ti riporta a quando..."), e bottone "Apri e prenota" per la destinataria.
>
> La mamma apre il pacco il giorno del compleanno → vede il messaggio + foto + dettagli → click "Prenota su GetYourGuide" → completa l'acquisto. **BeGift riceve €3-5 di commissione**, Anna ha fatto un regalo memorabile a costo €0 di servizio.

---

## Modello revenue dettagliato

### Tariffe affiliate per partner

| Partner | Commissione tipica | Cookie window | Note |
|---|---|---|---|
| **GetYourGuide** | 8% | 31gg | Best per esperienze internazionali; widget+link API; partner Luca già iscritto |
| **Awin** (Booking incluso) | 4-6% | 30gg | Booking tramite Awin: ~4%. Smartbox via Awin: ~7% |
| **TradeDoubler** | Variabile per advertiser | 30-60gg | Backup per merchant non su Awin |

### Stima revenue conservativa

Assumendo target Luca **200-500€/mese entro 2027** (vedi memoria monetization_path):

- AOV (Average Order Value) esperienza: €60
- Commissione media: 6%
- Revenue per click→buy: €60 × 6% = **€3.60**
- Conversion rate click→buy: 8-15% (industria)
- **Per arrivare a €300/mese**: ~85 acquisti/mese = ~85 click che convertono = **~700-1000 click affiliate/mese** = ~25-35 click/giorno
- A 1 gift inviato = 1 destinatario potenziale click = serve **~30 gift/giorno** che includono un'esperienza per arrivare al target

Plausibile se BeGift cresce in stagione gift (Festa Mamma maggio, Natale, San Valentino, Festa Papà marzo 2027) — vedi memoria calendar gifting IT.

---

## Architettura tecnica

### Componenti

```
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js App)                         │
│                                                                  │
│  /create flow                       /experiences (new)           │
│  ├─ Picker occasione                ├─ Discovery page            │
│  ├─ Profilo destinatario            ├─ Filter: city/budget/type  │
│  │  (età, città, interessi)         └─ Card grid                 │
│  ├─ NEW: "Suggerisci esperienze"    /experiences/[id] (new)      │
│  │  → mostra ExperiencePicker       └─ Detail + "Regala" CTA     │
│  └─ Continue with packaging                                      │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Next.js API routes)                   │
│                                                                  │
│  /api/experiences (GET)            /api/experiences/[id]/regalo  │
│  └─ list + filter                  └─ POST: create gift wrap     │
│                                                                  │
│  /api/experiences/[id]/track-click /api/experiences/sync         │
│  └─ POST: log click + redirect     └─ admin: pulls da partner    │
│     a URL affiliate                  APIs (cron weekly)          │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE (Supabase)                        │
│                                                                  │
│  experiences            experience_partners    experience_clicks │
│  ├─ id                  ├─ id                  ├─ id             │
│  ├─ partner_id          ├─ slug (getyourguide) ├─ experience_id  │
│  ├─ external_id         ├─ name                ├─ gift_id        │
│  ├─ title               ├─ commission_rate     ├─ user_id        │
│  ├─ description         ├─ tracking_pattern    ├─ source         │
│  ├─ image_url           └─ active              ├─ ip_hash        │
│  ├─ price_min/max                              └─ clicked_at     │
│  ├─ currency                                                     │
│  ├─ city, country                                                │
│  ├─ duration_minutes                                             │
│  ├─ category (enum)                                              │
│  ├─ tags (text[])                                                │
│  ├─ rating, reviews_count                                        │
│  ├─ affiliate_url_template                                       │
│  ├─ last_synced_at                                               │
│  └─ active                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Schema DB dettagliato

Vedi `supabase/migrations/023_experiences_catalog.sql` (incluso nello scaffold).

Decisioni di design:
- **`affiliate_url_template`** ha placeholder `{tracking_id}` e `{gift_id}` che vengono sostituiti runtime al click → ogni link è univoco per gift e tracciabile
- **`tags`** come `text[]` Postgres invece di tabella join — query più semplici per il filtering "regalo per chi ama..." (es. `WHERE 'foodie' = ANY(tags)`)
- **`experience_clicks`** logga ogni redirect: serve per (a) attribuire commissione quando il partner notifica, (b) BI futura su quali esperienze convertono di più
- **GRANT espliciti** post Supabase 2026-10-30 policy (vedi memoria supabase_grants_oct2026)

### Catalogo: come si popola?

Fase 1 (POC, manuale): seed di 15-20 esperienze italiane top-tier curate a mano, mix dei 3 partner. Vedi `supabase/seed-experiences.sql`.

Fase 2 (semi-automatic): script che pull periodicamente dalle API partner:
- **GetYourGuide Partner API**: richiede registrazione partner avanzata (non solo affiliate), endpoint `https://www.getyourguide.com/api/v1/...` con OAuth2
- **Awin**: Datafeed FTP/HTTP giornaliero, CSV con tutti i prodotti merchant attivi
- **TradeDoubler**: Product Feed API

Per il POC, suggerisco **manuale + sync settimanale** via cron `vercel.json`.

### Catalogo: come si presenta?

Dentro il flusso `/create`:

1. Dopo che user ha scelto occasione e descritto destinatario, BeGift chiede: **"Vuoi un'idea per il contenuto?"**
2. Se sì → modal/sezione `ExperiencePicker`
3. Card grid filtrabile per **città / budget / tipo / interessi**
4. Click su card → modal preview con: foto, titolo, prezzo, rating, descrizione breve, bottone **"Regala questa esperienza"**
5. Click → API `POST /api/experiences/[id]/regalo` → ritorna `tracking_url` da inserire nel gift come content_url (content_type=link)
6. Quando il destinatario apre il gift e clicca → API `POST /api/experiences/[id]/track-click` registra → redirect 302 a affiliate URL → conversione presso partner → commissione a BeGift

### Tracking dei click — perché server-side

Importante: il click DEVE passare da un endpoint BeGift, non andare diretto al partner. Motivi:

1. **Attribuzione**: ogni click → log con `gift_id` → quando il partner notifica una vendita, possiamo verificare la sorgente
2. **Cookie-less tracking**: anche se il browser blocca cookies di terze parti, il redirect server-side conserva il `tracking_id`
3. **A/B testing**: possiamo cambiare il partner per stessa esperienza senza toccare i gift già inviati (es. testare Booking via Awin vs Booking diretto)
4. **Anti-fraud**: limitare click per IP/giorno, prevenire click farm

URL flow:
```
https://begift.app/r/{experience_id}?gift={gift_id}&t={short_token}
   → server-side: log click, generate tracking_id, redirect 302
   → https://www.getyourguide.com/...?partner_id=BEGIFT&cmp={tracking_id}
```

---

## Integrazione con flusso esistente

### Con il Create Gift attuale

Aggiungo un **opzionale** step "Suggerisci contenuto" dentro `CreateGiftClient.tsx`. Disabilitato per default, attivato se feature flag `NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP=true`.

Non ROMPO niente del flusso attuale: i regali tradizionali (foto, video, messaggio, link manuale) continuano a funzionare. Aggiungere il picker esperienze è additivo.

### Con il flusso Email Parser POC (appena built)

Sinergia naturale:
- User forwarda mail Booking del ryokan → BeGift crea draft Tripit-style (DONE)
- Sul draft, BeGift mostra anche **"Altre esperienze simili giapponesi"** prese dal catalogo → user può aggiungere come "extra" al pacco regalo
- Cross-sell senza essere invasivo

Concretamente: nel `DraftCompletionClient`, sotto il form recipient/message, aggiungo una sezione "Aggiungi un extra?" con 2-3 esperienze correlate per location (`parsed.location` → query `experiences WHERE city ILIKE ...`).

### Con i partner

| Partner | Onboarding richiesto | Effort |
|---|---|---|
| **GetYourGuide** | Già iscritto. Serve solo richiedere upgrade da "publisher base" a "content publisher" per accesso Partner API. Email di onboarding sopra. | 1h Luca |
| **Awin** | Già iscritto. Setup MerchantSelector per merchant rilevanti (Booking, Smartbox, IKEA experience, Decathlon experiences). Generare deep link templates. | 2-3h Luca |
| **TradeDoubler** | Già iscritto. Backup per merchant non su Awin. Stesso pattern. | 2h Luca, opzionale |

---

## User stories (per design)

### US-1: Discovery anonima
> Come utente non loggato, voglio esplorare le esperienze giftabili per occasione (Compleanno, Anniversario, Festa Mamma) e budget, così posso valutare BeGift come strumento prima di registrarmi.

### US-2: Suggerimenti contestuali
> Come utente loggato che sta creando un gift per "mamma 68 anni Firenze ama camminare", voglio vedere 3-5 esperienze suggerite dal sistema che matchano il profilo, così non devo cercarle da solo.

### US-3: Click → riscatto pulito
> Come destinatario di un gift "esperienza", voglio vedere subito di cosa si tratta (foto + dettagli) e poi cliccare un singolo bottone per riscattarla sul sito del partner, così la prenoto in pochi step.

### US-4: Tracking trasparente al sender
> Come sender, voglio sapere se il destinatario ha effettivamente "riscattato" il regalo (cliccato per prenotare), così posso sapere se l'esperienza è stata gradita.

### US-5: Multi-experience gift
> Come sender, voglio poter wrappare 2-3 esperienze diverse in un singolo gift ("scegli tu quale ti piace di più"), così il destinatario sceglie il giorno della fruizione.

---

## Open questions per Luca

Quando torni da pranzo, decidiamo insieme:

1. **Catalogo iniziale**: parto da quale categoria/città? Suggerisco:
   - **Top 5 città IT**: Roma, Milano, Firenze, Venezia, Napoli (alto turismo, alta domanda gift)
   - **3 categorie**: Food & wine, Adventure/outdoor, Cultura & arte
   - Totale POC: ~20-30 esperienze curate manualmente

2. **Tipi di esperienza prioritari**:
   - 🍷 Wine tasting / cooking class (alta marginalità, alta riscattabilità)
   - 🚣 Tour outdoor (kayak, trekking, hiking)
   - 🎨 Tour musei / arte
   - 🧖 Wellness / spa
   - ✈️ Viaggi brevi (1-2 notti)
   - Quali categorie escludere a priori (es. nightlife)?

3. **Pricing display**: Mostriamo prezzo esatto in card? O range ("da €40")?
   - Pro esatto: trasparenza
   - Contro esatto: prezzo cambia spesso → sync frequente

4. **Multi-partner per stessa esperienza**: se "Tour Colosseo" è venduto da GetYourGuide a €45 e da Awin/Booking a €42, mostriamo entrambi? O scegliamo automatic best price? (Suggerisco: best commission, non best price, per il POC)

5. **UI**: discovery come sezione separata `/discover` o integrata nel `/create` flow?
   - Integrato: friction più bassa
   - Separato: SEO playground per Google ranking

6. **Personalization engine**: per ora "suggerimenti random per categoria/città". Quando vale la pena investire in vero ranking ML (es. LLM-based che legge profilo destinatario e raccomanda)?

7. **Compliance affiliate**: come gestiamo la disclosure obbligatoria FTC/EU? Banner sul gift "Questa esperienza viene proposta tramite il nostro partner GetYourGuide. BeGift può ricevere una piccola commissione se il regalo viene utilizzato."?

---

## Roadmap suggerita

### Sprint 1 (1-2 settimane, dopo email parser merge)
- [x] SPEC (questo documento)
- [ ] DB migration 023 + GRANT
- [ ] Seed 20 esperienze manuali
- [ ] API: GET /api/experiences, GET /api/experiences/[id]
- [ ] UI: `/discover` page (lista + filter base)
- [ ] Tracking click + redirect endpoint `/r/[id]`
- [ ] Feature flag `NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP`

### Sprint 2 (1 settimana)
- [ ] Integration nel `CreateGiftClient` (step opzionale)
- [ ] ExperiencePicker componente reusable
- [ ] Cross-sell nel `DraftCompletionClient` (email parser → experiences correlate)
- [ ] Bottom-of-funnel: bottone "Regala via partner X" sul gift opened

### Sprint 3 (validazione)
- [ ] A/B test: con/senza picker esperienze → impatto su gift creation rate
- [ ] Tracking dashboard interno: top esperienze cliccate, conversion rate
- [ ] Iterazione su prompt LLM per "suggerimento personalizzato"

### Sprint 4+ (scaling)
- [ ] Sync automatico catalogo via API/feed partner (cron weekly)
- [ ] Personalization engine basato su recipient profile
- [ ] Multi-experience bundle ("scegli tu")
- [ ] Notifiche follow-up al sender ("Il tuo regalo è stato riscattato!")

---

## File scaffold prodotti in questo sprint

Tutti in branch `feature/email-parser-poc` (da migrare a `feature/vendita-esperienze` quando Luca decide):

```
docs/vendita-esperienze/
├── SPEC.md                          (questo file)
└── PARTNER_INTEGRATION.md           (dettaglio integrazione per partner)

supabase/migrations/
└── 023_experiences_catalog.sql      (tables + RLS + GRANT)

supabase/
└── seed_experiences.sql             (20 esperienze IT curate)

types/
└── experiences.ts                   (TypeScript interfaces)

lib/experiences/
├── partners.ts                      (config partner: tracking pattern, commission)
└── tracking.ts                      (helper per generare tracking URL)

app/api/experiences/
├── route.ts                         (GET list with filters)
├── [id]/route.ts                    (GET detail)
└── [id]/track-click/route.ts        (POST log + redirect)

app/r/[token]/route.ts               (short-link redirect endpoint)

components/
└── ExperienceCard.tsx               (UI card reusable, mostrato in picker e su /discover)

app/discover/
└── page.tsx                         (discovery page, behind feature flag)
```

**Stato**: scaffold = file creati con struttura minima compilabile. NON funzionano end-to-end finché Luca non valida lo SPEC e attiva la feature.

---

## Conclusione

Questo è il deliverable che ti lascio per il pranzo: **una direzione tecnica chiara, scelte architetturali motivate, e scaffold pronto a essere riempito**. Niente di prodotto pushato in main, niente che rompa il parser email che stavamo finalizzando. Quando torni leggiamo insieme, scegli le risposte alle 7 open questions, e da quella seduta esce il primo MVP della monetizzazione di BeGift.
