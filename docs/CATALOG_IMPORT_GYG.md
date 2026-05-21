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

### Soglia di accesso GYG Partner API (importante)

GYG ha pubblicato i requirements ufficiali su https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements :

| Access Level | Cosa permette | Soglia minima |
|---|---|---|
| **Basic (Teaser)** | descrizioni generiche, immagini, rating, prezzi | 100,000 monthly visits (web) o downloads (app) |
| **Reading** | descrizioni complete, prezzi, opzioni, availability | 1M visits + 300 monthly bookings |
| **Masterbill** | come Reading + merchant of record | partner manager review |

**Implicazione per BeGift (stato 2026-05-21):** finche' non supera 100k visits/mese, la Partner API GYG e' bloccata. Lo scaffold dell'importer resta pronto in mock mode + e' funzionante a livello tecnico — semplicemente non si potra' attivare con una chiave reale finche' il traffico non cresce.

Alternativa immediata: provare **Awin Product Feed per GetYourGuide (advertiser 18715)** che non ha soglie di traffico (vedi sezione VivaTicket sopra per il pattern Create-a-Feed).

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
- **Image hosting proxy**: alcune immagini GYG potrebbero bloccare hotlinking. Valutare cache via Vercel image optimization o un mirror su Supabase Storage.
- **Quality scoring**: oltre a rating + reviews, aggiungere "freshness" (last_updated) per ordinare il catalogo `/regalo/catalogo`.

---

# VivaTicket — Awin Product Feed

VivaTicket NON ha una Partner API pubblica. L'unico canale automatizzato per importarne il catalogo è il **Product Feed Awin** (CSV/XML giornaliero per merchant ID 32283).

## Architettura simmetrica a GYG

```
              ┌──────────────────────────────────┐
              │  Vercel cron 30 2 * * *           │
              │  GET /api/cron/catalog-sync-vvt   │
              │  + Authorization: Bearer SECRET    │
              └────────────────┬──────────────────┘
                               │
              ┌────────────────▼───────────────────┐
              │  runAwinImportWithAudit(            │
              │    "cron", "vivaticket")            │
              │  lib/catalog/awin_feed_importer.ts  │
              └────────────────┬───────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │  HTTP GET ${AWIN_VVT_FEED_URL}  │
              │  CSV con header standard Awin   │
              └────────────────┬────────────────┘
                               │
              ┌────────────────▼─────────────────┐
              │  Filter in_stock + min_price      │
              │  Infer category (concerti/sport/  │
              │    opera/cultura) da titolo+desc  │
              │  Extract city (whitelist IT)      │
              │  Compute import_hash              │
              └────────────────┬─────────────────┘
                               │
              ┌────────────────▼──────────────────┐
              │  Upsert experiences                │
              │  source='imported_vvt_awin_feed'   │
              │  Mai sovrascrive 'manual'          │
              └────────────────────────────────────┘
```

## Setup VVT in produzione

### 1. Ottieni l'URL del Product Feed Awin

Loggati su https://ui.awin.com → menu **Toolbox → Create-a-Feed** (o **Product Feeds**).

1. Filtra per **Advertiser ID = 32283** (VivaTicket Italia).
2. Seleziona le colonne minime richieste dal parser (tutte case-insensitive):
   - `aw_deep_link`
   - `aw_product_id`
   - `merchant_product_id`
   - `product_name`
   - `description`
   - `aw_image_url`
   - `search_price`
   - `currency`
   - `merchant_category`
   - `delivery_country`
   - `in_stock`
3. Format: **CSV**, delimiter virgola, NO compressione (più semplice da parsare lato server senza dipendenze).
4. Genera l'URL feed → copia.

### 2. Configura su Vercel

| Variabile | Valore |
|-----------|--------|
| `AWIN_VVT_FEED_URL` | l'URL CSV di step 1 |

Stesse env già richieste per GYG: `NEXT_PUBLIC_FEATURE_CATALOG_IMPORT=true`, `CRON_SECRET`.

### 3. Verifica

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  "https://begift.com/api/admin/catalog/sync?dryRun=1&merchant=vvt"
```

Oppure da browser: `/admin/catalog` → "Sync VVT ora".

## Mock mode VVT (senza URL feed)

Se `AWIN_VVT_FEED_URL` non è settata, l'importer ritorna 3 eventi finti:
- Coldplay Music of the Spheres — Milano
- Aida — Arena di Verona
- Bologna FC — partite casa

Stessa logica del mock GYG: utile per validare la pipeline E2E prima di avere il feed reale.

## Troubleshooting VVT

### "Awin feed HTTP 401" o "Awin feed HTTP 403"
URL feed con API key sbagliata o publisher non autorizzato a quell'advertiser. Verifica nel pannello Awin che il programma VivaTicket sia in stato "Joined" e che la API key in URL sia valida.

### Feed scaricato ma 0 record filtrati
Probabile: parser non trova le colonne attese. Apri `/admin/catalog` → ultima run VVT → `notes.log` → cerca "Prima riga del feed (debug shape)" → confronta i nomi colonna con quelli che il parser cerca (vedi commenti in `awin_feed_importer.ts`). Se sono diversi (es. `productName` invece di `product_name`), modifica `AWIN_MERCHANTS` o estendi il fallback nel parser.

### Tour importati con città NULL
La heuristica di city extraction cerca solo nomi di città italiane note (whitelist in `extractCity()`). Per concerti tipo "Coldplay Music of the Spheres" senza città esplicita, la city sarà NULL. Per il catalogo `/regalo/catalogo` la riga compare comunque ma senza il subtext città. Si può estendere la whitelist o passare a un'inferenza più sofisticata (geocoding partial).

## Aggiungere altri merchant Awin

Il codice è progettato per scalare oltre VivaTicket. Per importare un altro advertiser Awin (es. un programma food/wine):

1. In `lib/catalog/awin_feed_importer.ts` aggiungi una entry a `AWIN_MERCHANTS`:
   ```typescript
   foodwine: {
     partnerSlug: "awin",
     awinmid: 12345,
     feedUrlEnv: "AWIN_FOODWINE_FEED_URL",
     displayName: "Food & Wine Italia",
     defaultCategory: "food",
     defaultCountry: "IT",
     sourceTag: "imported_foodwine_awin_feed",
   },
   ```
2. Crea `/api/cron/catalog-sync-foodwine/route.ts` (copia da `catalog-sync-vvt`).
3. Aggiungi entry a `vercel.json`.
4. (Opzionale) Estendi il bottone in `AdminCatalogClient.tsx`.

