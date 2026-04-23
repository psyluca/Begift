# BeGift — Incident Response Runbook

**Gap di riferimento:** 16.10 della Relazione sulla Sicurezza.
**Versione:** 1.0 — 23 aprile 2026.
**Owner:** Luca Galli (Titolare).
**Stampa questo documento e tienine una copia cartacea offline.**

Questo runbook descrive cosa fare quando si sospetta o si conferma un incidente di sicurezza, dalla classificazione iniziale alla comunicazione legale. È redatto in modo da poter essere applicato anche sotto stress — passi semplici, decisioni binarie, template pronti.

---

## 0. Riflesso immediato (primi 5 minuti)

Prima di qualsiasi analisi, **STOP → PENSA → SOLO DOPO AGISCI**. Evita azioni distruttive (es. cancellare log) che possano compromettere l'indagine forense.

Tre azioni iniziali, in ordine:
1. Annota l'ora di rilevamento e il canale da cui è arrivata la segnalazione (alert Sentry, email utente, Garante, media, ecc.)
2. Apri una nota privata (Notion / Apple Notes / foglio carta) con la timeline
3. Non parlare pubblicamente dell'incidente fino a classificazione completa

---

## 1. Classificazione

| Priorità | Definizione | Esempi | Time-to-acknowledge | Time-to-resolve target |
|---|---|---|---|---|
| **P0** | Data breach confermato o altamente probabile. Accesso non autorizzato a dati personali di più di 1 utente. | Dump DB trapelato, RLS bypass sfruttato, credenziali admin esfiltrate | 15 min | 72 ore (notifica Garante) |
| **P1** | Downtime prolungato (>1h) o perdita integrità dati senza accesso non autorizzato. | Crash Postgres, corruzione migrazione, cron che cancella gift a caso | 30 min | 4 ore |
| **P2** | Vulnerabilità rilevata ma non sfruttata (da pentester, researcher, automated scan). | CVE nuova su Next.js, XSS segnalata da bug bounty | 24 ore | 7 giorni (critical) / 30 giorni (medium) |
| **P3** | Bug minore, abuso puntuale, richiesta supporto con connotazione sicurezza. | Singolo account che tenta bruteforce, segnalazione DSA di un utente | 72 ore | 30 giorni |

---

## 2. Procedura P0 — Data breach

### 2.1 Contenimento (ora 0 → +60 min)

Obiettivo: **fermare l'emorragia prima di capire cosa è successo**.

- [ ] Se sospettato leak di `SUPABASE_SERVICE_ROLE_KEY`: ruotare immediatamente (vedi `SECRET_ROTATION.md` § 3.2). Il redeploy Vercel richiede 1-2 minuti.
- [ ] Se sospettato account admin compromesso: revocare sessioni admin: `Supabase Dashboard → Auth → Users → [admin email] → Logout all sessions`.
- [ ] Se sospettato codice malevolo in produzione: `git log main -20`, identificare commit sospetto, `git revert` + push immediato.
- [ ] Se sospettato endpoint exploitato: disabilitare l'endpoint aggiungendo `return NextResponse.json({error:"unavailable"},{status:503})` in cima, push, deploy.
- [ ] Screenshot tutto (dashboard Supabase users, log Vercel, Sentry events, eventuale email del segnalatore). Conservare in cartella offline `/incidents/YYYY-MM-DD/`.

### 2.2 Indagine (ora +1 → +6 ore)

Obiettivo: **rispondere a 4 domande chiave** per la notifica Garante.

1. **Cosa** è stato compromesso? (quale dato: email? UGC? contenuto chat?)
2. **Quanti** utenti coinvolti? (numero esatto o stima motivata)
3. **Quando** è iniziato? (data inizio esposizione)
4. **Come** è avvenuto? (vettore di attacco)

Strumenti:
- `Supabase Dashboard → Logs → Postgres` — query filtri sospetti
- `Vercel Dashboard → Logs` — request pattern anomali
- `Sentry` — eventi di errore correlati
- `git log` — cambiamenti recenti al codice

Se non è possibile determinare il numero esatto di interessati, documentare il ragionamento e assumere il worst case per la notifica (es. "tutti gli utenti attivi negli ultimi X giorni").

### 2.3 Notifica Garante (entro 72 ore dalla conoscenza)

**Obbligo legale:** GDPR art. 33.

- [ ] Accedere al portale https://servizi.gpdp.it → "Notifica di violazione"
- [ ] Compilare modulo con:
  - Descrizione della violazione
  - Categorie di interessati (utenti registrati)
  - Categorie di dati (vedi matrice in `/privacy`)
  - Numero approssimativo di interessati
  - Conseguenze probabili
  - Misure adottate per contenimento
  - Misure per attenuare effetti

**Template pronto (copiare e adattare):**
```
Data rilevamento: [YYYY-MM-DD HH:MM CET]
Categorie di interessati: utenti registrati su begift.app (n = [X])
Categorie di dati: [email, handle, contenuto UGC: testo/foto/video/PDF caricati]
Natura violazione: [accesso non autorizzato / divulgazione / perdita di integrità]
Conseguenze probabili: [spam, phishing mirato, esposizione di contenuti privati]
Misure adottate:
 - Rotazione credenziali service_role Supabase ore [X]
 - Invalidazione sessioni admin
 - [...]
Misure attenuazione:
 - Comunicazione utenti tramite email e banner in-app
 - Supporto reset password
 - [...]
DPO/Referente: Luca Galli, privacy@begift.app, +39 [nr]
```

### 2.4 Notifica agli utenti (entro 24 ore da conferma)

**Obbligo legale:** GDPR art. 34 (se rischio elevato per i diritti e le libertà).

Canali:
- Email a tutti gli utenti potenzialmente coinvolti
- Banner in-app su `/dashboard`
- Comunicazione sui social (Instagram) se pubblicati

**Template email (italiano):**
```
Oggetto: Comunicazione importante sulla sicurezza del tuo account BeGift

Ciao,

ti scriviamo per informarti che abbiamo rilevato [descrizione breve
non tecnica della violazione] che potrebbe aver interessato i tuoi dati
personali registrati su BeGift.

Cosa è successo: [2-3 frasi]
Quali dati sono coinvolti: [elenco preciso]
Quando: [finestra temporale]
Cosa abbiamo fatto: [contenimento]

Cosa ti chiediamo di fare:
 - [Azione utente: cambia password / controlla accessi]
 - Fai attenzione a eventuali email sospette
 - Contattaci a privacy@begift.app per qualsiasi domanda

Abbiamo notificato il Garante per la Protezione dei Dati Personali come
richiesto dal GDPR. Ci dispiace per l'accaduto.

Il team BeGift
```

### 2.5 Post-mortem (entro 14 giorni)

- [ ] Redigere post-mortem tecnico (blameless): cosa, come, quando, perché, cosa è andato bene, cosa migliorare
- [ ] Identificare 3-5 azioni correttive con owner e scadenza
- [ ] Pubblicare versione sanitizzata su blog/status page (trasparenza rafforza fiducia)

---

## 3. Procedura P1 — Downtime / integrità

- [ ] Pubblicare banner "manutenzione in corso" su home (feature flag)
- [ ] Identificare root cause tramite log
- [ ] Rollback dell'ultima deploy se correlato (`Vercel → Deployments → Promote previous`)
- [ ] Ripristino backup se corruzione dati (`Supabase → Database → Backups → Restore` — vedi `BACKUP_DRILL.md`)
- [ ] Aggiornamento stato su status page (es. status.begift.app futuro)
- [ ] Post-mortem entro 7 giorni

---

## 4. Procedura P2 — Vulnerabilità non sfruttata

Origini tipiche: `/security` disclosure, pentester, `npm audit`.

- [ ] Triage: valutare severità CVSS
- [ ] Creare issue privata GitHub
- [ ] Fix su branch feature + merge + deploy entro SLA (7gg critical, 30gg medium)
- [ ] Retest con researcher
- [ ] Aggiungere regression test se applicabile
- [ ] Ringraziamento pubblico se researcher lo desidera

---

## 5. Contatti di emergenza

Conservare questa lista anche in formato cartaceo e offline.

| Ruolo | Nome | Contatto |
|---|---|---|
| Titolare / responsabile incidenti | Luca Galli | luca@begift.app, +39 [nr privato] |
| Avvocato | [NOME QUANDO INDIVIDUATO] | [email] |
| DPO esterno (se incaricato) | [OPZIONALE] | [email] |
| Supabase Security | — | security@supabase.io |
| Vercel Security | — | security@vercel.com |
| Anthropic Security | — | security@anthropic.com |
| Garante Privacy Italia | Portale GPDP | https://servizi.gpdp.it |
| CSIRT Italia | — | https://csirt.gov.it / +39 06 45437000 |
| Hosting CDN (Cloudflare) | — | https://www.cloudflare.com/abuse/ |

---

## 6. Kit di primo intervento

File da tenere a portata di mano (stampati + su USB offline):
- Questo runbook
- `SECRET_ROTATION.md`
- `BACKUP_DRILL.md`
- Elenco delle variabili d'ambiente attualmente attive (nomi, NON valori)
- Copia del portale GPDP bookmark
- Template email comunicazione utenti
- Checklist pronta di "cose NON fare" (es. NON cancellare log, NON parlare pubblicamente prima di classificazione)

---

## 7. Esercitazione semestrale

Ogni 6 mesi (date fisse: 1 maggio, 1 novembre) eseguire un'esercitazione di simulazione:
- [ ] Scenario scelto (es. "SUPABASE_SERVICE_ROLE_KEY pubblicata per errore su repo pubblico")
- [ ] Eseguire procedura fino al punto 2.3 (senza inviare realmente al Garante)
- [ ] Tempo totale speso
- [ ] Lezioni apprese aggiornate in questo runbook

---

## 8. Note per l'avvocato

Questo documento è una bozza tecnica. Chiediamo all'avvocato di rivedere:
- Tempistiche (72h Garante, 24h utenti): confermare coerenza con interpretazioni del Garante italiano
- Template comunicazione: verificare formulazione legalmente corretta
- Eventuale inserimento di un DPO formale (probabilmente non obbligatorio sotto soglia)
- Modalità di conservazione delle evidenze (quanto tempo? dove?)
- Se opportuno pubblicare post-mortem sanitizzato (reputation vs. obblighi)
