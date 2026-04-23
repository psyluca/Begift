# BeGift — Checklist firma DPA sub-processori

**Gap di riferimento:** 16.4 della Relazione sulla Sicurezza.
**Azione richiesta:** Luca (Titolare).
**Tempo stimato:** 30-45 minuti totali.
**Scadenza:** prima del lancio commerciale.

Questa checklist elenca le Data Processing Agreement (DPA) da firmare con i sub-processori che trattano dati personali per conto di BeGift. Tutte sono click-through nelle dashboard dei rispettivi provider — nessun DPA richiede firma manuale o negoziazione preventiva per il piano che stiamo usando.

Conserva le conferme di firma (email o screenshot) in una cartella `/docs/compliance/dpa/` privata (non committata su git se contiene PDF personalizzati).

---

## 1. Supabase Inc. ✅ GIA' FIRMATA

**Status:** la DPA Supabase e' a livello di **organization**, non di singolo progetto. Luca l'ha gia' firmata in passato per un'altra app sulla stessa organization Supabase — copre automaticamente anche BeGift (stesso Titolare, stessa org).

**Azione residua:** archiviare una copia/screenshot della DPA firmata in `/docs/compliance/dpa/supabase-dpa-org-YYYYMMDD.pdf` da mostrare all'avvocato.

---

### (Istruzioni originali, conservate per riferimento)

**Ruolo:** Responsabile del trattamento per database Postgres, Auth, Storage.

**Dove si firma:** Dashboard Supabase → Settings → Billing → "Data Processing Agreement" (tab o sezione dedicata). URL diretto tipico: `https://supabase.com/dashboard/org/{org_id}/billing` oppure direttamente `https://supabase.com/dashboard/account/dpa`.

**Documenti di riferimento pubblici:**
- DPA standard: https://supabase.com/legal/dpa
- Sub-processori Supabase: https://supabase.com/legal/subprocessors
- Security overview: https://supabase.com/security

**Cosa verificare prima di firmare:**
- [ ] Nella DPA compaiono SCC (Standard Contractual Clauses) 2021/914 UE → USA
- [ ] La region del progetto è `eu-central-1` o `eu-west-*` (vedi gap 16.11)
- [ ] Elenco sub-processori include AWS (infrastruttura) e CloudFlare (edge)

**Dopo la firma:**
- [ ] Salva conferma email in `/docs/compliance/dpa/supabase-YYYYMMDD.pdf`
- [ ] Aggiorna `/privacy` sezione 4 inserendo la data di firma

---

## 2. Vercel Inc. ⏳ DA FIRMARE AL PASSAGGIO A PRO

**Status attuale (23 aprile 2026):** BeGift e' su piano **Hobby** (free tier). Su Hobby Vercel non permette di firmare una DPA custom: il trattamento e' regolato dai Terms of Service accettati all'iscrizione, che a loro volta rimandano alla DPA standard di Vercel (https://vercel.com/legal/dpa) e alle Standard Contractual Clauses UE.

**Pianificazione:** upgrade a piano **Pro** (20 USD/mese) 1-2 settimane prima del lancio commerciale, contestualmente alla firma formale della DPA. L'upgrade porta anche:
- DPA firmabile self-service
- Log retention 120 gg (vs 30)
- Priority support
- Spending limits configurabili

Per la fase beta pre-lancio (utenti &lt; 10, nessun ricavo), la DPA implicita via ToS e' considerata sufficiente. Confermare con l'avvocato.

---

### (Istruzioni originali per quando si fara' l'upgrade)

**Ruolo:** Responsabile del trattamento per hosting, edge network, log HTTP, functions serverless.

**Dove si firma:** Dashboard Vercel → Team Settings → Privacy → "Data Processing Agreement". URL diretto: `https://vercel.com/account/privacy` o `https://vercel.com/teams/{team}/settings/privacy`.

**Documenti di riferimento pubblici:**
- DPA Vercel: https://vercel.com/legal/dpa
- Sub-processori: https://vercel.com/legal/subprocessors
- Privacy: https://vercel.com/legal/privacy-policy

**Cosa verificare prima di firmare:**
- [ ] DPA include SCC 2021/914
- [ ] Sub-processori dichiarati: AWS, GCP (se edge regions attivate)
- [ ] Log retention dichiarata (default 30gg, upgrade 120gg opzionale)

**Dopo la firma:**
- [ ] Salva conferma in `/docs/compliance/dpa/vercel-YYYYMMDD.pdf`
- [ ] Verifica in Dashboard → Settings che "Data Cache" sia impostato su EU region se disponibile

---

## 3. Anthropic PBC ✉️ RICHIESTA INVIATA VIA EMAIL

**Status attuale (23 aprile 2026):** BeGift usa Anthropic API server-side (endpoint `app/api/ai/suggest-message`, modello `claude-3-5-haiku-latest`). Piano: **Build (pay-as-you-go)**, account `psyluca@gmail.com`.

**Policy Anthropic di default su piano Build:**
- No training su API data
- Retention prompt 30 giorni per trust & safety, poi cancellazione
- SCC per trasferimento EU→US inclusa nei ToS

**Azione intrapresa:** email inviata a `privacy@anthropic.com` per richiesta DPA controfirmata + conferma scritta della retention policy. Attesa risposta (2-7 gg lavorativi).

**Azione residua:** al ricevimento della risposta, firmare il PDF DPA e archiviare copia + conferma retention in `/docs/compliance/dpa/anthropic-dpa-YYYYMMDD.pdf`.

---

### (Istruzioni originali, conservate per riferimento)

**Ruolo:** Responsabile del trattamento per elaborazione testo tramite API Claude (suggerimenti messaggio).

**Dove si firma:**
- Per API access: https://console.anthropic.com/settings/data-processing-addendum
- In alternativa, contattare `privacy@anthropic.com` per richiesta esplicita.

**Documenti di riferimento pubblici:**
- Commercial Terms: https://www.anthropic.com/legal/commercial-terms
- Privacy Policy: https://www.anthropic.com/legal/privacy
- Trust Center: https://trust.anthropic.com

**Cosa verificare:**
- [ ] Zero-retention tier attivo (i prompt non vengono conservati oltre 30 giorni e non sono usati per training)
- [ ] DPA firmata include SCC
- [ ] Uso commerciale permesso nel piano corrente

**Dopo la firma:**
- [ ] Salva conferma in `/docs/compliance/dpa/anthropic-YYYYMMDD.pdf`
- [ ] Verifica header `anthropic-version` nelle chiamate API lato server

---

## 4. Google LLC (Google OAuth) ✅ VERIFICATO E PUBBLICATO

**Status attuale (23 aprile 2026):**
- Publishing status: **In production** (pubblicato il 23 aprile 2026)
- User Type: **External**
- App name: `BeGift` con logo, homepage `https://begift.app`, privacy `/privacy`, terms `/terms`
- Scope espliciti configurati: **zero** (si usano solo default: `email`, `profile`, `openid`) → minimizzazione perfetta
- Nessuna review manuale di Google richiesta (solo scope non-sensitive)
- DPA: coperta dai Google Cloud Terms accettati all'iscrizione della Cloud Console + certificazione Data Privacy Framework

**Azione residua pre-launch commerciale:** valutare se completare la **Brand Verification** (opzionale). Senza verification gli utenti nuovi vedono un warning "Google hasn't verified this app" che puo' ridurre i signup del 10-30%. La verification richiede 2-3 gg lavorativi + video demo di 30-60 sec + giustificazione logo. Non bloccante per il lancio ma raccomandata per conversion.

Confermare con l'avvocato che per servizi OAuth consumer la DPA Google Cloud Terms + DPF sono sufficienti.

---

### (Istruzioni originali, conservate per riferimento)

**Ruolo:** Autenticazione OAuth. Non trasmettiamo dati utente a Google oltre a quanto necessario per il login (Google riceve comunque il fatto che un utente BeGift stia accedendo).

**Stato DPA:** Google Workspace / Cloud Console ha una DPA standard accettata implicitamente all'utilizzo del servizio. Per servizi OAuth consumer (login "Continua con Google"), la DPA è coperta dai termini della Google Cloud Console se il progetto OAuth è creato lì.

**Verifica:**
- [ ] Progetto Google Cloud Console di BeGift è attivo e ha OAuth consent screen configurato
- [ ] La consent screen dichiara i soli scope `email` e `profile` (minimizzazione)
- [ ] L'accettazione dei termini Google Cloud ha data successiva alla creazione del progetto

**Documenti:**
- Google Cloud DPA: https://cloud.google.com/terms/data-processing-addendum
- Google Data Privacy Framework certification: https://www.dataprivacyframework.gov

---

## 5. Stripe Inc. (futuro, da attivare al lancio monetizzazione)

**Ruolo:** Responsabile del trattamento per pagamenti. Al momento NON attivo.

**Quando attivarlo:** Fase 3 del master plan (post 200-500 MAU).

**DPA:** firmata automaticamente all'accettazione dei Stripe Services Agreement durante onboarding account.

**Checklist pre-attivazione:**
- [ ] PCI-DSS: nessun PAN mai sui server BeGift (usiamo Stripe Checkout / Elements con tokenizzazione)
- [ ] Webhook signing secret configurato come variabile d'ambiente server-only
- [ ] SCA / 3DS abilitato di default

---

## 6. Provider Push (Apple APNs / Google FCM)

**Ruolo:** Consegna notifiche push ai device degli utenti. Il flusso è generico (W3C Web Push con VAPID) e il provider non riceve né il contenuto né il destinatario in chiaro — solo un endpoint opaco.

**DPA:** non applicabile in senso stretto perché non viene trasmesso alcun dato personale riconducibile all'utente. L'unica informazione conservata da noi è l'endpoint opaco del browser (vedi tabella trattamenti in `/privacy`).

**Verifica:**
- [ ] Payload push NON contiene dati sensibili in chiaro (attualmente: ID gift + titolo "Hai ricevuto un regalo", senza email né nome mittente completo)

---

## 7. Checklist finale prima del lancio

- [ ] DPA Supabase firmata e salvata
- [ ] DPA Vercel firmata e salvata
- [ ] DPA Anthropic firmata e salvata
- [ ] OAuth Google: consent screen pubblicata e scope ridotti verificati
- [ ] Privacy Policy `/privacy` aggiornata con date di firma DPA
- [ ] Email `privacy@begift.app` attiva e monitorata quotidianamente
- [ ] Avvocato notificato del completamento
