# BeGift — Policy di rotazione dei segreti

**Gap di riferimento:** 16.5 della Relazione sulla Sicurezza.
**Versione:** 1.0 — 23 aprile 2026.
**Proprietario:** Titolare (Luca Galli).

Questa policy definisce frequenza, responsabile e procedura per la rotazione dei segreti di BeGift. La rotazione riduce la finestra di sfruttamento in caso di compromissione — anche silenziosa — di una credenziale.

---

## 1. Classificazione dei segreti

| Segreto | Classificazione | Se compromesso |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **Critica** | Accesso completo al DB bypass RLS |
| `ANTHROPIC_API_KEY` | Alta | Addebito economico + leak prompt |
| `VAPID_PRIVATE_KEY` | Media | Invio push malevoli a nome nostro |
| `STRIPE_SECRET_KEY` (futura) | **Critica** | Movimenti di denaro |
| `STRIPE_WEBHOOK_SECRET` (futura) | Alta | Iniezione eventi webhook falsi |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Bassa (per design pubblica) | Accesso limitato da RLS |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Bassa (per design pubblica) | Nessuno |
| `ADMIN_EMAILS` | Bassa | Divulgazione elenco admin |

---

## 2. Frequenza di rotazione programmata

| Segreto | Cadenza | Automatizzabile? |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Audit trimestrale (rotazione on-demand) | No — manuale Supabase Dashboard |
| `ANTHROPIC_API_KEY` | Trimestrale | Sì — script mensile + env update Vercel |
| `VAPID_PRIVATE_KEY` | Annuale (rotazione disruptive: invalida tutte le push subscriptions) | No |
| `STRIPE_SECRET_KEY` | Annuale | No |
| `STRIPE_WEBHOOK_SECRET` | Su aggiornamento endpoint | No |

**Cadenza minima aggiuntiva:** qualunque rotazione va eseguita immediatamente in caso di:
- sospetto di leak (repo pubblico, log condivisi, ecc.)
- abbandono di un collaboratore che aveva visibilità del segreto
- aggiornamento di un dipendente di Supabase/Anthropic se contrattualizzato
- incidente P0 o P1 (vedi INCIDENT_RESPONSE.md)

---

## 3. Procedura di rotazione generica

### 3.1 Preparazione
1. Annunciare la rotazione in `#ops` (futuro) o su calendario personale
2. Creare una issue su GitHub con label `security-rotation`
3. Verificare che un ambiente di staging sia disponibile per test

### 3.2 Supabase `SERVICE_ROLE_KEY`
1. Dashboard Supabase → Project Settings → API → "Generate new service_role key"
2. **Non invalidare subito la vecchia**: Supabase mantiene entrambe attive brevemente
3. Aggiornare `SUPABASE_SERVICE_ROLE_KEY` su Vercel (Production + Preview environments)
4. Trigger di un redeploy vuoto (commit banale o "redeploy" dalla dashboard Vercel)
5. Smoke test: `curl -H "Authorization: Bearer $(new_key)" https://begift.app/api/admin/health` (endpoint futuro)
6. Solo dopo verifica: revocare la vecchia key nel pannello Supabase
7. Registrare l'operazione in `/docs/compliance/rotation-log.md`

### 3.3 Anthropic `API_KEY`
1. https://console.anthropic.com → API keys → "Create key"
2. Aggiornare `ANTHROPIC_API_KEY` su Vercel
3. Redeploy
4. Test: chiamare /api/ai/ (endpoint interno AI) e verificare risposta
5. Revocare la vecchia key
6. Log in rotation-log.md

### 3.4 VAPID keys (disruptive)
**Attenzione:** la rotazione VAPID invalida TUTTE le subscription push esistenti. Gli utenti dovranno riautorizzare.

1. Generare nuova coppia: `npx web-push generate-vapid-keys`
2. Aggiornare `VAPID_PRIVATE_KEY` e `NEXT_PUBLIC_VAPID_PUBLIC_KEY` su Vercel
3. Deploy
4. Lo user agent rifiuterà le vecchie subscription al prossimo invio: il codice applicativo gia' pulisce automaticamente `push_subscriptions` su errori 410/404
5. Comunicazione utenti (banner in-app): "Le notifiche push sono state resettate per motivi di sicurezza. Riattivale in Impostazioni."

### 3.5 Stripe (futuro)
1. Dashboard Stripe → Developers → API keys → "Roll key"
2. Stripe ha grace period di 24h in cui la vecchia funziona
3. Aggiornare env e redeploy entro 24h
4. Log

---

## 4. Rotation log template

File: `/docs/compliance/rotation-log.md` (NON committare se contiene info sensibili dei provider).

```
| Data       | Segreto                   | Motivo             | Operatore   | Verificato |
|------------|---------------------------|--------------------|-------------|------------|
| 2026-05-01 | SUPABASE_SERVICE_ROLE_KEY | Lancio commerciale | Luca Galli  | Si         |
| ...        | ...                       | ...                | ...         | ...        |
```

---

## 5. Audit annuale

Una volta l'anno (data fissa: **1 maggio**):
- [ ] Rileggere la policy e aggiornarla se nuovi segreti sono stati introdotti
- [ ] Verificare che tutti i segreti in uso siano presenti in questa tabella
- [ ] `grep -r "sk_\|api_key\|secret" --include="*.ts" --include="*.tsx" --include="*.js"` per cercare hardcoded leftover
- [ ] Verificare che `.env.local` NON sia in git: `git log --all -- .env.local`
- [ ] Rivedere i log Supabase per accessi admin anomali
