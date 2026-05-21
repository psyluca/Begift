# Catalog Import — GetYourGuide Partner API

> **Stato 2026-05-21**: branch `feature/catalog-import`. Sandbox dietro feature flag, NON ancora attivo in produzione.

## Cosa fa

Importa automaticamente migliaia di tour ed esperienze GYG nel catalogo BeGift (`experiences`). Il catalogo unificato `/regalo/catalogo` continua a funzionare con le esperienze manuali curate (Vasco Live, Milan-Juventus, ecc.); a queste si aggiungono le importate quando il feature flag è attivo.

## Architettura — colpo d'occhio

```
              ┌──────────────────────────────┐
              │  Vercel cron 0 2 * * *       │
              │  GET /api/cron/catalog-sync  │
              │  + Authorization: Bearer SECRET
              └────────────────┬─────────────┘
                               │
              ┌────────────────▼──────────────┐
              │  runImportWithAudit("cron")    │
              │  lib/catalog/gyg_importer.ts   │
              └────────────────┬───────────────┘
                               │
              ┌────────────────▼───────────────┐
              │  GYG Partner API               │
              │  X-ACCESS-TOKEN: $GYG_PARTNER_API_KEY
              │  paginazione offset=0,100,200…  │
              └────────────────┬────────────────┘
                               │
              ┌────────────────▼───────────────┐
              │  Filter rating>=4.0, rev>=50    │
              │  Map category, infer tags       │
              │  Compute import_hash (SHA-256)  │
              └────────────────┬────────────────┘
                               │
              ┌────────────────▼───────────────┐
              │  Upsert experiences             │
              │  WHERE external_id=...          │
              │  Skip se hash invariato         │
              │  Mai sovrascrive source=manual  │
              └────────────────┬────────────────┘
                               │
              ┌────────────────▼───────────────┐
              │  catalog_sync_runs audit row    │
              │  status=success|partial|error   │
              └─────────────────────────────────┘
```

## Setup produzione (3 step)

### 1. Lanciare la migration 027

Su Supabase SQL Editor:

```bash
# Copia/incolla il contenuto di:
supabase/migrations/027_experiences_import_meta.sql
```

Aggiunge: `experiences.source`, `experiences.import_hash`, tabella `catalog_sync_runs`, indici. Idempotente.

### 2. Configurare le env vars su Vercel

| Variabile | Valore | Note |
|-----------|--------|------|
| `GYG_PARTNER_API_KEY` | (da GYG) | Senza questa, l'importer gira in **mock mode**. Vedi sotto come ottenerla. |
| `NEXT_PUBLIC_FEATURE_CATALOG_IMPORT` | `true` | Senza, gli endpoint rispondono 503. |
| `CRON_SECRET` | (già presente) | Riusato dal pattern esistente. |
| `GYG_API_BASE` | (opzionale, default `https://api.getyourguide.com`) | Override per sandbox/staging GYG. |

### 3. Verificare in produzione

```bash
# Dry run dal proprio terminale (no DB write)
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  "https://begift.com/api/admin/catalog/sync?dryRun=1"

# Real run
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  "https://begift.com/api/admin/catalog/sync"
```

Oppure dal browser: vai su `/admin/catalog` (devi essere in `ADMIN_EMAILS`), clicca "Sync ora" o "Dry run".

## Come ottenere la GYG Partner API key

GetYourGuide ha due programmi separati che vengono spesso confusi:

- **Affiliate Program** (via Awin) — link di referral, commissioni. È quello a cui sei iscritto oggi. **Non** dà accesso alla Partner API.
- **Connectivity Partner Program** — accesso API alla ricerca + dettagli tour. Onboarding manuale, richiede una richiesta a GYG.

Per richiedere accesso al Connectivity Partner Program:

1. Vai su https://supplier.getyourguide.com (richiede account partner) → sezione "Connectivity" → "Partner API". Se la voce non c'è, vai allo step 2.
2. Scrivi a **partner-api@getyourguide.com** con questo template:

   > **Subject**: Partner API access request — BeGift
   >
   > Hi GetYourGuide team,
   >
   > I'm Luca, founder of BeGift (begift.com), an Italian digital gift-wrapping platform that lets users package experiences (tickets, tours, vouchers) as animated digital gifts for someone special.
   >
   > We currently surface GYG inventory via Awin affiliate links. We'd like to integrate the GYG Partner API to offer our users a much broader catalog (filtered for popularity, italian + EU cities) and improve discovery quality. Affiliate redirect remains GYG-hosted; we don't replicate checkout.
   >
   > Could you grant API access or point me to the right onboarding flow? Happy to share usage estimates and our existing Awin publisher ID for cross-reference.
   >
   > Thanks,
   > Luca — psyluca@gmail.com

Tempo medio di risposta: 1-3 settimane in base agli aneddoti di altri partner.

## Mock mode (per sviluppare senza API key)

Se `GYG_PARTNER_API_KEY` non è settata, l'importer ritorna 3 tour finti (Colosseo, Tuscany Wine, Venezia Gondola). Utile per:

- Testare il flusso completo (cron → fetch → filter → upsert → audit) prima di avere le credenziali.
- Verificare UI admin (`/admin/catalog`) e dashboard counters.
- QA del catalogo unificato dopo aver flippato il flag.

Le righe in mock mode sono comunque scritte nel DB con `source='imported_gyg_api'`. Per pulirle:

```sql
DELETE FROM public.experiences
 WHERE source = 'imported_gyg_api'
   AND external_id IN ('12345','23456','34567'); -- ID dei mock
```

## Troubleshooting

### "GYG API HTTP 401"

Chiave sbagliata o scaduta. Controlla `GYG_PARTNER_API_KEY` su Vercel.

### "GYG API HTTP 429"

Rate limit. L'importer scarica 100 record/pagina, 30 pagine max → 3000 record per run. GYG di solito accetta questo volume. Se persiste, abbassa `maxPages` via query string: `?maxPages=10`.

### "Partner 'getyourguide' non trovato"

La riga `getyourguide` non c'è in `experience_partners`. È seedata dalla migration 023; se il DB è stato pulito, rinsériscila:

```sql
INSERT INTO public.experience_partners
  (slug, display_name, base_affiliate_url, commission_rate, cookie_window_days, active)
VALUES
  ('getyourguide', 'GetYourGuide', 'https://www.getyourguide.com', 0.080, 31, true)
ON CONFLICT (slug) DO NOTHING;
```

### Tour importati con prezzo NULL o categoria sbagliata

Apri `/admin/catalog` → click sull'ultima run → guarda `notes.log` per il primo record GYG. Il parser è difensivo (campi opzionali) ma il mapping categoria potrebbe avere bisogno di aggiunte in `GYG_CATEGORY_MAP` (vedi `lib/catalog/gyg_importer.ts`).

### Catalog page mostra ancora pochi item dopo sync OK

Il catalogo legge `experiences.active=true`. Se le righe importate sono marked active=true (default sì), dovrebbero apparire. Verifica via SQL:

```sql
SELECT source, count(*)
  FROM public.experiences
 WHERE active = true
 GROUP BY source;
```

## Sicurezza

- L'endpoint `/api/cron/catalog-sync` e `/api/admin/catalog/sync` accettano **solo** `Authorization: Bearer $CRON_SECRET`. Senza, 401.
- `/api/admin/catalog/runs` (UI admin) accetta **solo** sessione utente in whitelist `ADMIN_EMAILS`. Senza, 403.
- `catalog_sync_runs` è RLS-protetta: nessun accesso anon/authenticated.
- L'importer mai sovrascrive righe con `source='manual'`: le esperienze curate (Vasco, Milan-Juventus, ecc.) sono al sicuro anche se hanno collisione di external_id.

## Roadmap (post v1)

- **Cap geo**: filtri client-side per countries via query param (`?countries=IT,FR,ES`).
- **Backfill iniziale**: prima run completa in modalità reale potrebbe importare 2-5k record. Considerare batch insert (chunked) per ridurre round-trip.
- **Awin Product Feed fallback**: se GYG Partner API non si sblocca in tempi ragionevoli, esiste un Awin XML feed con il catalogo GYG (più povero ma accessibile subito). Si aggiunge come `lib/catalog/awin_feed_importer.ts`.
- **Image hosting proxy**: alcune immagini GYG potrebbero bloccare hotlinking. Valutare cache via Vercel image optimization o un mirror su Supabase Storage.
- **Quality scoring**: oltre a rating + reviews, aggiungere "freshness" (last_updated) per ordinare il catalogo `/regalo/catalogo`.
