# BeGift — Setup Plausible Analytics

**Stato:** scaffolding integrato nel codice (commit 2026-04-24, loader v2).
**Attivazione richiesta:** impostare `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID` su Vercel.
**Costo:** 9 EUR/mese (piano Growth, fino a 100k pageview) o trial 30gg gratis.

---

## Perche' Plausible e non GA4

- **Cookie-less:** niente consent banner richiesto (no art. 122 Codice Privacy)
- **GDPR-compliant nativamente:** server in UE (Germania, Hetzner)
- **Dashboard pubbliche opzionali:** possiamo rendere le metriche pubbliche per trasparenza (opzione)
- **Lightweight:** script 1 KB vs. ~45 KB di GA4
- **UI semplice:** 5 metriche che contano, no 200 dashboard inutili

Alternative scartate: Umami (self-host richiesto), Fathom (USA), PostHog (overkill oggi).

---

## Step 1 — Account Plausible

1. https://plausible.io/register → Sign up con email Luca
2. Plan: **Growth** 9 EUR/mese (oppure trial 30 gg gratuito)
3. Add site: `begift.app`
4. Timezone: Europe/Rome
5. Copia il "Domain" (solitamente `begift.app`)

---

## Step 2 — Variabile d'ambiente Vercel

Plausible dopo la registrazione ti mostra uno snippet con un'URL del tipo
`https://plausible.io/js/pa-XXXXXXXXXXXXXXXXXXXX.js`. La parte `pa-XXXXXXXXXXXXXXXXXXXX`
e' lo **Script ID** del tuo sito (univoco).

Dashboard Vercel → Project `begift` → Settings → Environment Variables → Add:

| Key | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID` | `pa-XXXXXXXXXXXXXXXXXXXX` (quello del tuo sito) | Production, Preview |

Trigger un redeploy (Vercel → Deployments → "…" → Redeploy) per caricare l'env var.

Nota: senza env var, lo script NON viene caricato nel layout. Zero overhead per chi sviluppa localmente.

---

## Step 3 — Verifica

Dopo il redeploy:

1. Apri `https://begift.app` in una tab
2. Nel dashboard Plausible dovresti vedere "Current visitors: 1"
3. Crea un gift di test → appare custom event `gift_created` in Dashboard → Goal Conversions

---

## Eventi custom tracciati

Gia' instrumentati nel codice tramite `lib/analytics.ts`:

| Evento | Trigger | Props |
|---|---|---|
| `signup_completed` | submit riuscito del modal UsernameOnboarding | `has_referrer` |
| `gift_created` | gift creato con successo dal /create | `occasion`, `content_type`, `scheduled` |
| `gift_opened` | apertura regalo lato destinatario (escluso preview + creator) | `occasion` |
| `share_clicked` | tap su ShareButton | `method` (web_share_api / wa_fallback) |
| `referral_landing` | arrivo sulla home con `?ref=@handle` | `ref` |

Eventi che si aggiungeranno con Fase B (reminders):

| Evento | Trigger |
|---|---|
| `reminder_added` | nuova ricorrenza salvata |
| `reminder_fired` | cron che manda notifica ricorrenza |

---

## Step 4 — Configurare Goals in Plausible

Dashboard Plausible → Site Settings → Goals → Add Goal.

Goal consigliati (Custom Event):

1. **Signup completed** → event name: `signup_completed`
2. **Gift created** → event name: `gift_created`
3. **Gift opened** → event name: `gift_opened`
4. **Share clicked** → event name: `share_clicked`
5. **Referral landing** → event name: `referral_landing`

Con i goals configurati, la dashboard Plausible mostra il funnel: visitor → signup → gift_created → gift_opened → share → viral loop.

---

## Step 5 — Metriche chiave per i gate di fase

| Fase | Metrica gate | Target |
|---|---|---|
| Fase 3 (Revenue) | MAU unici | >= 200-500 |
| Fase 4 (App nativa) | MAU unici + retention 7d | >= 200 + retention > 30% |
| Fase 5 (Scaling) | MAU unici | >= 1000 |

Dashboard Plausible da controllare settimanalmente:
- **Unique visitors** (proxy MAU)
- **Tasso gift_created / signup_completed** (attivazione)
- **Tasso gift_opened / gift_created** (delivery successo)
- **Tasso share_clicked / gift_created** (viralita')
- **K-factor:** (referral_landing / gift_opened) × (signup_completed / referral_landing)

---

## Step 6 — Privacy Policy

La privacy policy `/privacy` gia' menziona "Analytics aggregate anonime" nella tabella finalita'. Se attivi Plausible, aggiorna la sezione processori aggiungendo:

> Plausible Insights OU (Tallinn, Estonia / Frankfurt, Germania)
> Ruolo: Responsabile del trattamento
> Dati trattati: URL visitati, referrer, user agent, paese (derivato da IP ma NON loggato)
> Base giuridica: legittimo interesse (analytics aggregate, no profilazione)
> Retention: pageview fino a 12 mesi, poi aggregazione

Plausible NON usa cookie ne' fingerprinting: nessun consent banner richiesto.

---

## Costi progressivi

| MAU | Piano Plausible | Costo/mese |
|---|---|---|
| 0-10k pageview | Growth | 9 EUR |
| 10k-100k pageview | Growth | 9 EUR |
| 100k-200k pageview | Business | 19 EUR |
| 200k-1M pageview | Business | 49 EUR |

Per il range MAU della Fase 3 (200-500), il piano Growth e' piu' che sufficiente.

---

## Quando rimuovere Plausible

Mai. Anche a scala alta Plausible e' economico e l'investimento in codice e' zero-dipendenza (se un giorno volessimo migrare a PostHog self-hosted, basta rimpiazzare `lib/analytics.ts` senza toccare i call-site).
