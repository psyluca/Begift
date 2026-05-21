# Vendita Esperienze — Quickstart

Stato al 2026-05-15: **scaffold completo, NON attivato in produzione.**

Tutto dietro feature flag `NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP=false`. Le pagine pubbliche (`/discover`, `/experiences/[id]`) ritornano 404 finché il flag non è `true`. Gli endpoint API tornano 503.

---

## Cosa c'è qui

| File | Cosa fa |
|---|---|
| [SPEC.md](./SPEC.md) | Strategy, architettura, user journey, roadmap, 7 open questions per Luca |
| [PARTNER_INTEGRATION.md](./PARTNER_INTEGRATION.md) | Setup operativo GetYourGuide / Awin / TradeDoubler |
| README.md (questo file) | Riassunto + come attivare |

---

## File codice prodotti

### DB
- `supabase/migrations/023_experiences_catalog.sql` — 3 tabelle + RLS + GRANT + indici
- `supabase/seed_experiences.sql` — 15 esperienze IT/EU curate per il POC

### Backend
- `app/api/experiences/route.ts` — GET lista con filtri (city, category, tags, price)
- `app/api/experiences/[id]/route.ts` — GET dettaglio
- `app/api/experiences/[id]/regalo/route.ts` — POST: crea gift da esperienza
- `app/r/[token]/route.ts` — GET: log click + 302 redirect a partner

### Library
- `lib/experiences/partners.ts` — config 3 partner + resolver affiliate URL
- `lib/experiences/tracking.ts` — hash IP/UA GDPR-safe, tracking_id gen, anti-fraud
- `types/experiences.ts` — TypeScript interfaces

### Frontend
- `app/discover/page.tsx` — discovery page pubblica con filtri
- `app/experiences/[id]/page.tsx` — dettaglio + form regala
- `app/experiences/[id]/GiftFromExperienceForm.tsx` — form client wrap
- `components/ExperienceCard.tsx` — card riusabile
- `components/ExperiencesCrossSell.tsx` — sezione cross-sell sotto draft email parser

### Integration esistente
- `app/draft/[id]/DraftCompletionClient.tsx` — aggiunge `<ExperiencesCrossSell>` sotto il form

---

## Come attivare (quando Luca decide)

### Step 1 — Applica migration su Supabase

Supabase Dashboard → SQL Editor → New query → paste contenuto di `supabase/migrations/023_experiences_catalog.sql` → Run.

Verifica che esistano:
- `experience_partners` (con 3 righe seed)
- `experiences` (vuota)
- `experience_clicks` (vuota)

### Step 2 — Seed catalogo

Stesso SQL Editor → paste `supabase/seed_experiences.sql` → Run.

Verifica:
```sql
SELECT count(*) FROM experiences;  -- dovrebbe essere 15
```

### Step 3 — Env vars su Vercel

| Key | Value | Note |
|---|---|---|
| `NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP` | `true` | Attiva il flag (Production + Preview) |
| `GETYOURGUIDE_PARTNER_ID` | (dashboard GYG) | Partner ID Luca su GetYourGuide |
| `AWIN_AFFILIATE_ID` | (dashboard Awin) | Affiliate ID Luca su Awin |
| `TRADEDOUBLER_AFFILIATE_ID` | (dashboard TD) | Affiliate ID Luca su TradeDoubler |
| `EXPERIENCE_TRACKING_SALT` | (random 32+ char) | Secret per hash IP/UA. Genera una volta, MAI cambiare in prod |

`EXPERIENCE_TRACKING_SALT` puoi generarlo da terminale:
```bash
openssl rand -hex 32
```

### Step 4 — Redeploy

Vercel → Deployments → ultimo deploy → ⋯ → Redeploy senza build cache.

### Step 5 — Test

1. `https://begift.app/discover` — vedi 15 cards
2. Filtra per "Roma" + "food" → 1 risultato (Pasta class Trastevere)
3. Click su una card → pagina dettaglio
4. Form "Regalala" → crea gift
5. Apri il gift come destinatario → click bottone → redirect partner (Tracking_id passato in cmp)

### Step 6 — Verifica tracking

Dopo qualche click, esegui su Supabase SQL:
```sql
SELECT 
  ec.tracking_id, e.title, p.slug AS partner, ec.source, ec.clicked_at
FROM experience_clicks ec
JOIN experiences e ON e.id = ec.experience_id
JOIN experience_partners p ON p.id = ec.partner_id
ORDER BY ec.clicked_at DESC
LIMIT 20;
```

Devi vedere righe con tracking_id, no IP raw, source corretto.

---

## Aggiornare i prezzi reali / esterni IDs

Il seed usa placeholder per ID GYG e Awin merchant. Quando Luca avrà i veri:

1. Recupera dal dashboard partner gli ID prodotto reali
2. UPDATE diretto su Supabase:
   ```sql
   UPDATE experiences
   SET affiliate_url_template = '<URL REALE>',
       external_id = '<ID REALE>',
       price_min_cents = <PREZZO * 100>
   WHERE id = '<UUID>';
   ```

Per scalare oltre il POC: scrivere uno script `scripts/sync-experiences.ts` che pull periodicamente da API partner (1 volta a settimana via cron `vercel.json`).

---

## Roadmap dopo POC validato

Vedi `SPEC.md` sezione "Roadmap suggerita":

- **Sprint 1**: scaffold (FATTO)
- **Sprint 2**: integrazione `CreateGiftClient` + cross-sell email parser (parzialmente fatto)
- **Sprint 3**: A/B test e analytics dashboard
- **Sprint 4+**: sync automatico catalogo, ML ranking, multi-experience bundle

---

## Open questions per Luca

Da `SPEC.md`:

1. Top città iniziali? (suggerito: Roma/MI/FI/VE/NA)
2. Tipi esperienza prioritari? (cooking, outdoor, cultura, wellness, viaggi)
3. Pricing display: esatto vs range?
4. Multi-partner stessa esperienza: best price vs best commission?
5. UI: discovery integrata nel /create o pagina separata?
6. Personalization: random vs ML?
7. Disclosure FTC: copy + posizionamento?

Decidiamo in 30 min insieme, poi setup esterno (2-3h Luca) e siamo live.
