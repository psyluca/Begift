# BeGift — Setup alerting e monitoring

**Gap di riferimento:** 16.9 della Relazione sulla Sicurezza.
**Stato:** scaffolding pronto, integrazione Sentry da completare (richiede DSN esterno).

Senza alerting, un incidente rumoroso (errori 500 a cascata, spike di 429, errori push >10%) può passare inosservato per ore. Questa pagina descrive la configurazione minima raccomandata prima del lancio.

---

## 1. Scelta dello stack

**Raccomandato: Sentry** (free tier: 5k eventi/mese, sufficiente per pre-lancio).

Alternativa: **Better Stack (Logtail + Uptime)** se si preferisce un'unica dashboard per log+uptime.

Alternativa budget-zero: **Vercel Log Drains** → Slack webhook (zero costo, ma meno funzionalità).

---

## 2. Setup Sentry — step by step

### 2.1 Creare il progetto
1. https://sentry.io → Sign up (email Luca)
2. Create Project → `Next.js` → `begift` (org: `begift-app`)
3. Copiare il **DSN** (stringa tipo `https://abc@o123.ingest.sentry.io/456`)

### 2.2 Installare
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
Il wizard crea:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts`
- aggiorna `next.config.mjs` wrappando con `withSentryConfig`

### 2.3 Variabili d'ambiente (Vercel)
| Chiave | Dove | Valore |
|---|---|---|
| `SENTRY_DSN` | Production + Preview | DSN da 2.1 |
| `NEXT_PUBLIC_SENTRY_DSN` | Production + Preview | stesso DSN (client usage) |
| `SENTRY_AUTH_TOKEN` | Production + Preview | da Sentry → Settings → Auth Tokens |
| `SENTRY_ORG` | Production + Preview | `begift-app` |
| `SENTRY_PROJECT` | Production + Preview | `begift` |

### 2.4 Filtering (privacy)
Nel client config, attivare scrubbing:
```ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,     // 10% tracing per non saturare quota
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,  // niente session replay default (privacy)
  sendDefaultPii: false,
  beforeSend(event) {
    // Rimuovi email/IP/user data dagli eventi
    if (event.user) { delete event.user.email; delete event.user.ip_address; }
    return event;
  },
  integrations: [
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
});
```

### 2.5 Test
Dopo deploy, triggerare un errore test: visitare `/api/_sentry-test` (endpoint opzionale che esegue `throw new Error("test")`).

---

## 3. Alert rules da configurare

Nella dashboard Sentry → Alerts → Create Alert:

| Alert | Condizione | Priorità | Notifica |
|---|---|---|---|
| Error spike | `events > 50 in 5min` | High | email + push |
| New issue | `first seen` su release corrente | Medium | email |
| Regression | issue già risolta riappare | High | email + push |
| 4xx spike | `http.status:4xx > 200/10min` (solo non-401) | Medium | email |
| Push send failure rate | `tag:push-send failure-rate > 20%` | Medium | email |
| Performance regression | p95 apdex < 0.7 | Low | email (settimanale) |

---

## 4. Uptime monitoring

### Better Stack Uptime (free 10 monitors)

1. https://betterstack.com → Sign up → Uptime
2. Creare monitor:
   - `https://begift.app` (GET, every 3min, expect 200)
   - `https://begift.app/api/cron/healthz` (se implementato, every 5min)
   - `https://begift.app/compleanno` (uno delle landing SEO, every 10min)

3. Notification channels:
   - Email Luca
   - Push app Better Stack su mobile
   - (opzionale) SMS — costa ~1 EUR/mese

### Alternativa: Uptime Robot
Free tier 50 monitors, 5min interval. Più limitato ma sufficiente.

---

## 5. Log drain (opzionale, budget-zero)

Vercel Dashboard → Settings → Logs → Drains → Add drain.
Destinazione: Slack webhook o Discord webhook.
Filter: `level: error OR status: 500`.

---

## 6. Runbook correlato

Quando un alert scatta, consultare `INCIDENT_RESPONSE.md` per la classificazione e la procedura.

Principio guida: **MTTA &lt; 15 min** (mean time to acknowledge), **MTTR &lt; 4h** per P0 e &lt; 24h per P1.

---

## 7. Checklist pre-lancio

- [ ] Sentry project creato
- [ ] DSN configurato in Vercel env (Production + Preview)
- [ ] Wizard `@sentry/wizard` eseguito e file committati
- [ ] Almeno 1 errore test visibile in Sentry
- [ ] 5 alert rules base configurate con notifica email Luca
- [ ] Better Stack: almeno `begift.app` home come uptime monitor
- [ ] Log drain Vercel → Slack/Discord (se disponibile canale)
- [ ] Mobile Sentry app installata sullo smartphone di Luca
- [ ] Test di un incidente simulato (triggerare 500) e verifica che l'alert arrivi
