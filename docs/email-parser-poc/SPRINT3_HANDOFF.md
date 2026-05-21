
# Sprint 3 — Handoff

**Branch**: `feature/email-parser-poc`
**Sub-sprint 3.1 (Frontend MVP)**: ✅ completato in autonomia (2026-05-14)
**Sub-sprint 3.2 (Setup esterno)**: ⏳ richiede te
**Sub-sprint 3.3 (Privacy + cron)**: ⏳ piccoli interventi

---

## Cosa è stato fatto in autonomia (Sub-sprint 3.1)

### Database
- `supabase/migrations/022_email_parser_user_optin.sql` — aggiunge `email_parser_opted_in` e `email_parser_opted_in_at` a `profiles`. Default false (opt-in GDPR).

### Backend API
- `app/api/drafts/route.ts` — GET lista drafts utente loggato
- `app/api/settings/email-parser-optin/route.ts` — POST toggle opt-in con audit timestamp
- `app/api/cron/cleanup-drafts/route.ts` — cron giornaliero soft-expire + hard-delete >60gg
- `app/api/email-inbox/route.ts` — **aggiornato**: verifica opt-in prima di processare + invia notifica draft ready

### Frontend
- `app/forward-mail/page.tsx` — landing page pubblica "Come funziona"
- `app/drafts/page.tsx` — lista drafts utente con badge status
- `app/draft/[id]/page.tsx` + `DraftCompletionClient.tsx` — già presenti dal POC, OK
- `components/EmailParserSettings.tsx` — sezione opt-in per /settings (da integrare manualmente, vedi sotto)

### Libreria
- `lib/email-parser/notify.ts` — invio email transazionale "draft pronto" via Resend (riusa setup esistente)

---

## Cosa devi fare TU (Sub-sprint 3.2 + 3.3)

### 1. Integra `EmailParserSettings` in /settings (5 min)

Apri `app/settings/SettingsHubClient.tsx`. In cima, aggiungi import:

```typescript
import EmailParserSettings from "@/components/EmailParserSettings";
```

Poi cerca un punto tra le sezioni esistenti (es. dopo "Notifiche" e prima "Ricorrenze") e inserisci:

```tsx
<EmailParserSettings />
```

Il componente è auto-contenuto: si nasconde da solo se `NEXT_PUBLIC_FEATURE_EMAIL_PARSER` non è true.

### 2. Applica migration SQL 022 su Supabase (2 min)

Supabase Dashboard → SQL Editor → New query → copia contenuto di `supabase/migrations/022_email_parser_user_optin.sql` → Run.

Verifica nella tabella `profiles` che ci siano le 2 nuove colonne.

### 3. Aggiungi sezione Privacy Policy (10 min)

Apri il template `docs/email-parser-poc/PRIVACY_POLICY_ADDENDUM.md`. Copia il contenuto della sezione "8. Parsing automatico" in `app/privacy/page.tsx` come nuova sezione.

### 4. Setup SendGrid Inbound Parse (30 min)

#### 4.1 Account SendGrid
1. Vai su https://signup.sendgrid.com/ → crea account (free tier: 100 mail/giorno)
2. Verifica email
3. Completa profilo (Country, Company name = "BeGift", Industry = "Other / Software")

#### 4.2 DNS — aggiungi MX record per sotto-dominio
1. Vai su Google Cloud Console → Cloud DNS → zone `begift.it` (o `begift.app` se hai entrambi)
2. Aggiungi MX record:
   - **Host**: `plans` (subdominio)
   - **Type**: `MX`
   - **TTL**: 3600
   - **Priority**: 10
   - **Mail server**: `mx.sendgrid.net.` (con punto finale)
3. Salva. Aspetta 5-10 minuti per propagazione.

#### 4.3 Configura SendGrid Inbound Parse
1. SendGrid Dashboard → Settings → Inbound Parse → Add Host & URL
2. **Subdomain**: `plans`
3. **Domain**: `begift.app`
4. **Destination URL**: `https://begift.app/api/email-inbox`
5. Spunta "Check incoming emails for spam"
6. Save

#### 4.4 Test deliverability
Dal tuo Gmail forwarda manualmente una mail di conferma TicketOne (o usa il fixture) a `plans@begift.app`. Vai su Vercel → Logs e cerca chiamate a `/api/email-inbox` — dovresti vedere il POST in entrata.

### 5. Env vars Vercel (3 min)

Vercel → progetto `begift-backend` → Settings → Environment Variables → aggiungi:

| Nome | Valore | Note |
|------|--------|------|
| `NEXT_PUBLIC_FEATURE_EMAIL_PARSER` | `true` | feature flag client |
| `EMAIL_PARSER_ENABLED` | `true` | feature flag server |
| `NEXT_PUBLIC_EMAIL_PARSER_ADDRESS` | `plans@begift.app` | mostrato nella UI |
| `EMAIL_PARSER_WEBHOOK_SECRET` | (genera 32 char random) | per webhook verification |
| `EMAIL_PARSER_MODEL` | `claude-haiku-4-5-20251001` | opzionale, default OK |

Dopo aver aggiunto, **redeploy** del progetto su Vercel (env vars richiedono nuovo deploy).

### 6. Cron job cleanup (Vercel) (5 min)

Aggiungi (o aggiorna) `vercel.json` nella root del repo:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-drafts",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Schedule: ogni notte alle 03:00 UTC. Vercel chiamerà l'endpoint automaticamente.

L'endpoint usa `Bearer ${CRON_SECRET}` per auth, assicurati che la env var `CRON_SECRET` sia configurata su Vercel (probabilmente già presente per altri cron).

### 7. Push del branch su GitHub (1 min)

```bash
git push origin feature/email-parser-poc
```

Da Vercel verrà creato automaticamente un deploy preview del branch. URL preview ti permette di testare in cloud senza mergiare a main.

### 8. Test end-to-end produzione preview (10 min)

1. Apri URL preview Vercel (es. `feature-email-parser-poc-...vercel.app`)
2. Login con il tuo account
3. Vai su `/settings` → attiva toggle "Inoltro mail"
4. Forwarda una mail TicketOne reale a `plans@begift.app`
5. Aspetta ~10 secondi
6. Vai su `/drafts` → dovresti vedere il pacco pre-popolato
7. Cliccalo → completa con messaggio + destinatario → invia

Se funziona end-to-end → **merge sicuro a main**.

---

## Test plan locale (puoi farlo subito senza setup esterno)

Per testare l'UI senza SendGrid:

1. Sul tuo Mac, applica migration 022 manualmente su Supabase
2. Imposta env vars in `.env.local`:
   ```
   NEXT_PUBLIC_FEATURE_EMAIL_PARSER=true
   EMAIL_PARSER_ENABLED=true
   NEXT_PUBLIC_EMAIL_PARSER_ADDRESS=plans@begift.app
   ```
3. Riavvia dev server
4. Attiva opt-in dal tuo profilo via SQL diretto (workaround login locale):
   ```sql
   UPDATE profiles SET email_parser_opted_in = true 
   WHERE email = 'psyluca@gmail.com';
   ```
5. Simula webhook con curl (come nel test POC precedente)
6. Apri `/forward-mail` per vedere la landing page
7. Apri `/drafts` (richiede login locale, se non funziona usa query SQL diretta)

---

## File modificati / creati su questo branch

```
NEW  app/forward-mail/page.tsx
NEW  app/drafts/page.tsx
NEW  app/api/drafts/route.ts
NEW  app/api/settings/email-parser-optin/route.ts
NEW  app/api/cron/cleanup-drafts/route.ts
NEW  components/EmailParserSettings.tsx
NEW  lib/email-parser/notify.ts
NEW  supabase/migrations/022_email_parser_user_optin.sql
NEW  docs/email-parser-poc/PRIVACY_POLICY_ADDENDUM.md
NEW  docs/email-parser-poc/SPRINT3_HANDOFF.md  (questo file)
MOD  app/api/email-inbox/route.ts  (opt-in check + notify)
```

---

## Checklist GO LIVE finale

Prima di mergiare a main:

- [ ] Migration 022 applicata su Supabase
- [ ] Privacy policy aggiornata in `/privacy`
- [ ] `EmailParserSettings` integrato in `SettingsHubClient`
- [ ] Env vars Vercel configurate
- [ ] SendGrid Inbound Parse configurato + DNS propagato
- [ ] Cron `vercel.json` aggiornato
- [ ] Test end-to-end preview deploy passato
- [ ] (Opzionale) feature flag rollout 50% utenti per 1 settimana prima del 100%

---

## Note finali

**Sub-sprint 3.1 chiuso al 100% di quello che si poteva fare in autonomia.** Tutto il codice è scritto, testato dove possibile, e documentato. Il bottleneck successivo è solo setup esterno (SendGrid + DNS) e privacy policy, che richiedono te ai pannelli di controllo.

**Stima per il restante**: 1 ora del tuo tempo per setup + ~30 min di test = **1.5 ore di lavoro tuo** prima che la feature sia live.

Domande quando torni: leggi questo handoff in ordine, fai i 7 step, e siamo pronti per il rollout.
