# BeGift — Richiesta di revisione legale

**Versione:** 1.0
**Data:** 23 aprile 2026
**Autore:** Luca Galli + AI collaboratore (assistenza tecnica)
**Destinatario:** avvocato incaricato della revisione

---

## 1. Sintesi del servizio

BeGift è una web app (PWA installabile su iOS/Android) che consente agli utenti registrati di creare "regali digitali" — combinazioni di contenuto (foto, video, PDF, link, messaggi testuali) con packaging grafico personalizzato — da condividere con destinatari tramite link univoco. Il destinatario apre il link, vede un'animazione di scartatura con suono, accede al contenuto.

**Funzionalità accessorie:**
- Reazioni inviabili dal destinatario al mittente (emoji, testo, foto, video)
- Chat privata sul gift tra creator e destinatario
- Suggerimenti di messaggio generati da AI (Claude di Anthropic)
- Notifiche push (ricezione, apertura, reazione)
- Ricorrenze con promemoria giornaliero (cron Vercel)

**Stato:** pre-monetizzazione, utenza limitata (<10 utenti beta), nessun ricavo.

---

## 2. Stack tecnico e fornitori

- **Frontend:** Next.js 14 App Router, TypeScript, PWA (manifest)
- **Backend:** Next.js API routes + Supabase (PostgreSQL + Auth + Storage)
- **AI:** Anthropic Claude Haiku (API server-side, zero-retention tier)
- **Hosting:** Vercel (USA, edge)
- **Database:** Supabase (US o EU region — VERIFICARE)
- **Auth:** Supabase OTP via email (codice 6 cifre) + Google OAuth
- **Notifiche:** Web Push API (VAPID, service worker)
- **Pagamenti:** Stripe (non ancora attivato)

Tutti i fornitori sopra sono basati negli USA o IE. I trasferimenti dati extra-UE sono regolati da SCC + Data Privacy Framework.

---

## 3. Architettura dei dati personali

### 3.1 Tabelle database

| Tabella | Dati | Note |
|---|---|---|
| `profiles` | id (uuid), email, username, display_name, age_confirmed_at, notify_* | Estensione di auth.users Supabase |
| `gifts` | id, creator_id, recipient_name (testo libero), sender_alias, message, content_url, packaging | Contenuto del regalo |
| `gift_opens` | gift_id, user_id (nullable), device_id, opened_at | Traccia aperture |
| `reactions` | gift_id, reaction_type, emoji/text/media_url, sender_name | Risposte al regalo |
| `notifications` | user_id, gift_id, type | Toast + push triggers |
| `push_subscriptions` | user_id, endpoint, p256dh, auth, user_agent | Sottoscrizioni push per device |
| `reminders` | user_id, recipient_name, month, day, occasion_type | Ricorrenze utente |
| `user_blocks` | blocker_id, blocked_id | Blocchi anti-harassment (migr. 010) |
| `reports` | gift_id, reporter_user_id, category, description, status | Segnalazioni DSA (migr. 009) |

### 3.2 Trasferimenti dati esterni

- Supabase (USA/EU): tutti i dati utente
- Vercel (USA): edge cache temporanea
- Anthropic (USA): prompt AI (nome destinatario + tono + occasione + contesto libero) — tier zero-retention
- Google (USA): solo token OAuth in caso di accesso Google
- Browser push services (Apple/Google/Mozilla): payload notifiche

### 3.3 Retention

| Dato | Periodo | Motivazione |
|---|---|---|
| Account attivo | A tempo indeterminato | Finché l'utente lo tiene aperto |
| Gift creati | Finché il creator non li elimina | Rimossi in cascata se account cancellato |
| Log tecnici | 90 giorni | Sicurezza + diagnostica |
| Reports | Illimitato | Tracciabilità per indagini |
| Push subs | Fino a revoca o errore 410 | Auto-cleanup in webPush.ts |
| Fiscali | 10 anni (quando applicabile) | Obbligo di legge |

---

## 4. Basi giuridiche del trattamento (art. 6 GDPR)

| Finalità | Base giuridica |
|---|---|
| Erogare il servizio | Esecuzione contratto — 6(1)(b) |
| Autenticazione | Esecuzione contratto — 6(1)(b) |
| Notifiche push | Consenso — 6(1)(a) |
| Promemoria ricorrenze | Consenso — 6(1)(a) |
| AI Message Helper | Esecuzione contratto + consenso implicito |
| Anti-abuse, sicurezza | Legittimo interesse — 6(1)(f) |
| Fiscali (futuro) | Obbligo di legge — 6(1)(c) |

---

## 5. Documenti legali prodotti

Il codice sorgente contiene i seguenti documenti legali in bozza:

- **Privacy Policy** — `/app/privacy/page.tsx` (12 sezioni, ~200 righe di copy)
- **Terms of Service** — `/app/terms/page.tsx` (13 sezioni + sezione AI disclosure 6bis)
- **Cookie consent** — `/components/CookieBanner.tsx` (opt-in granulare 3 categorie)

**Si richiede revisione di:**
1. Accuratezza legale del testo Privacy Policy rispetto a GDPR, DSA, EU AI Act
2. Adeguatezza clausole limitation of liability nei Terms
3. Procedura takedown: oggi mailto:abuse@ + meccanismo in-app POST /api/reports. È sufficiente per DSA art. 16?
4. Clausola età minima: 16 anni (GDPR art. 8 UE). Confermare per Italia.
5. Clausola foro competente: "foro consumatore" o "foro del Titolare"?
6. Trattamento dati destinatari (persone che ricevono gift ma non sono utenti registrati): base giuridica?

---

## 6. Protezione UGC implementata

- **Age gate 16+** obbligatorio al primo login (modal non-dismissabile con checkbox + accettazione Privacy/Terms)
- **Blocco utente** (tabella `user_blocks`): il destinatario di un regalo può bloccare il creator
- **Segnalazione contenuto** (tabella `reports`): anche anonimi possono segnalare, rate limit 5 per IP / 15 min
- **Rate limit creazione**: max 20 gift/giorno/utente (anti-spam)
- **Delete account**: endpoint `POST /api/profile/delete` con cascade automatico
- **Log auditabile**: ogni gift ha `creator_id` e timestamp, Supabase log automatico accessi
- **Informativa destinatario** (`components/RecipientNotice.tsx`): banner persistente al primo apri-regalo che richiama trasparenza GDPR sul trattamento dati di terzi e segnala canale `mailto:abuse@begift.app` + `mailto:privacy@begift.app`. Dismissabile per gift_id, non blocking.
- **Kill switch operativo**: env var `BEGIFT_DISABLE_CREATE=on` blocca con 503 la creazione di nuovi gift entro pochi secondi (no deploy richiesto). Pensato per pausa rapida del founder in caso di incidente (CSAM, abuso massivo, problema costi). Documentato in `INCIDENT_RESPONSE.md`.
- **Posizionamento Beta pubblica**: badge in homepage + disclaimer "servizio in evoluzione". Riduce aspettative implicite di stabilità/durabilità del servizio rispetto a una v1.0.
- **User search sospesa** (`app/api/users/route.ts`, 2026-04-28): la versione precedente esponeva email + display_name di qualsiasi profilo registrato senza auth check, via `ilike %q%`. Decisione: sospendere finché non c'è un sistema di "cerchia / connessioni" per restringere la search ai soli contatti dell'utente. Endpoint ora ritorna sempre array vuoto; componente `InAppSend` nascosto da `CreateGiftClient`. Minimizzazione attiva. **Riabilitazione futura prevista** con architettura "search nella cerchia provata": l'utente può cercare solo tra persone con cui ha già scambiato gift/reazioni (relazione documentata), e nei risultati MAI viene esposta l'email — solo `display_name` + `username` pubblico. Vedi `docs/USER_SEARCH_REENABLE_PLAN.md` per dettagli tecnici.

---

## 7. Punti aperti per revisione legale

### 7.1 Dati personali di terzi nei gift
Quando un utente carica una foto che ritrae un'altra persona (il destinatario) senza avere il suo consenso esplicito, BeGift sta trattando dati personali di un terzo. Il mittente dichiara nei Terms di avere il consenso, ma c'è un'area grigia GDPR. Domanda: serve informativa al destinatario al momento dell'apertura? Checkbox?

### 7.2 Segnalazione a autorità
In caso di segnalazione di CSAM o materiale illegale grave, qual è l'obbligo di notifica (Polizia Postale? NCMEC? Autorità italiana?). Tempistica?

### 7.3 DPO
Allo stato attuale (<100 utenti) la nomina di un DPO non è obbligatoria. Confermare soglia oltre la quale diventa obbligatorio (probabilmente 250 dipendenti, non applicabile; o 5000 utenti regolari, da verificare).

### 7.4 Registro trattamenti art. 30 GDPR
Va preparato anche in assenza di dipendenti? Formato?

### 7.5 Consenso uso AI
La funzione AI Message Helper invia testo libero (che può contenere dati personali del destinatario) a Claude/Anthropic. Servono disclosure aggiuntive? Checkbox dedicato?

### 7.6 Privacy e notifiche push
Il nome del mittente (sender_alias o handle) appare nella notifica push sul device del destinatario, visibile da chiunque abbia accesso al device. Questo è problema?

### 7.7 Monetizzazione futura (Stripe)
Quando attiveremo pagamenti, che clausole ToS specifiche servono (rimborsi, chargeback, IVA, diritto recesso 14gg)? Il commercialista gestisce la parte fiscale; l'avvocato cosa aggiunge lato ToS?

### 7.8 Foro competente
L'utente consumatore italiano ha diritto al foro del proprio luogo di residenza. Se Luca è in Milano ma l'utente in Sicilia, foro Sicilia. Confermare formulazione corretta nei Terms.

### 7.9 Responsabilità dell'hosting provider
BeGift è hosting provider ex art. 14 e-commerce directive / art. 6 DSA. Quale diligenza minima dobbiamo mostrare per non perdere il safe harbor?

---

## 8. Next steps attesi dall'avvocato

1. **Red-line** della Privacy Policy e dei Terms (modifiche suggerite)
2. **Verifica compliance** DSA, GDPR, AI Act
3. **Parere scritto** sui 9 punti aperti della sezione 7
4. **Timbro/approvazione** della versione finale dei documenti
5. **Eventuale contratto** di consulenza continuativa per futuri aggiornamenti (Stripe, app nativa, scaling)

---

## 9. Contatti per la revisione

- **Luca Galli** — titolare — privacy@begift.app
- **Repository codice** — [privato, credenziali su richiesta]
- **Ambiente staging** — https://begift.app

Documento generato il 23 aprile 2026. Versione vigente nel repo: `docs/LEGAL_REVIEW.md`.
