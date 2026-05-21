# Privacy Policy — Addendum Email Parser

Testo da aggiungere alla pagina `/privacy` (sezione dedicata) prima del rollout della feature.

---

## 8. Parsing automatico di mail forwardate (opzionale)

BeGift offre un servizio **opzionale e opt-in** di lettura automatica di email forwardate dall'utente. Il servizio consente all'utente di inoltrare a un indirizzo BeGift dedicato le proprie mail di conferma acquisto (concerti, esperienze, viaggi, ecc.) per ottenere un pacco regalo digitale pre-popolato.

### 8.1 Base giuridica del trattamento

Art. 6(1)(a) GDPR — **consenso esplicito** dell'interessato. L'utente attiva il servizio dalla pagina Impostazioni del proprio account. Senza consenso esplicito, le mail inoltrate vengono scartate immediatamente senza essere processate.

### 8.2 Dati raccolti

- **Corpo della mail forwardata** (testo e/o HTML)
- **Mittente originale** dell'email (es. noreply@ticketone.it)
- **Oggetto** dell'email
- **Allegati** (PDF biglietti, ricevute) — opzionale
- **Timestamp** di ricezione del forward

### 8.3 Finalità

- Estrazione automatica di dati strutturati (data evento, location, codice prenotazione, ecc.) per pre-popolare un "draft" di gift digitale.
- L'utente conserva il pieno controllo: il draft non viene mai inviato automaticamente, deve essere esplicitamente completato e inviato dall'utente.

### 8.4 Modalità di trattamento

Il contenuto della mail viene processato da un sistema di intelligenza artificiale di terze parti (**Anthropic Claude API**, con sede negli Stati Uniti) sotto contratto di trattamento dati (DPA + Standard Contractual Clauses) ai fini di estrarre dati strutturati. La chiamata API è effettuata in tempo reale e nessun dato viene utilizzato da Anthropic per addestrare i propri modelli (zero data retention policy).

### 8.5 Sub-processors

| Sub-processor | Ruolo | Sede | Garanzie |
|---------------|-------|------|----------|
| Anthropic PBC | AI parsing | USA | DPA + SCC + Zero data retention |
| SendGrid (Twilio) | Inbound email | USA | DPA + SCC |
| Supabase | Database + Storage | EU (Francoforte) | DPA + EU region |

### 8.6 Conservazione

- **Draft non completati**: cancellazione automatica dopo **30 giorni** (status='expired') + hard delete completo dopo ulteriori 60 giorni (totale ritenzione max: 90 giorni dalla ricezione).
- **Draft completati**: i dati vengono migrati nella tabella `gifts` regolare e seguono la stessa policy di ritenzione dei gift normali.
- **Allegati su Supabase Storage**: cancellati insieme al draft.

### 8.7 Diritti dell'interessato

Hai diritto in qualsiasi momento di:

- **Disattivare** il servizio dalla pagina Impostazioni → "Inoltro mail → regalo automatico" → toggle off. Disattivazione immediata: le mail inoltrate successivamente verranno rifiutate.
- **Accedere** ai propri draft visitando la pagina `/drafts`.
- **Cancellare** manualmente un singolo draft tramite l'apposito comando.
- **Richiedere cancellazione completa** dei propri draft scrivendo a privacy@begift.app (risposta entro 30 giorni).
- **Esportare** i propri dati (data portability) scrivendo a privacy@begift.app.

### 8.8 Trasferimento extra-UE

Il trattamento da parte di Anthropic e SendGrid comporta trasferimento di dati al di fuori dell'Unione Europea (Stati Uniti). Il trasferimento è regolato da:

- **Standard Contractual Clauses (SCC)** della Commissione Europea (decisione 2021/914)
- **Adequacy decision** EU-U.S. Data Privacy Framework (laddove i fornitori siano certificati)
- **Misure tecniche addizionali**: TLS 1.3 in transito, encryption at-rest, accesso limitato per scopo

### 8.9 Sicurezza

- Trasporto: TLS 1.3 obbligatorio per tutte le chiamate
- Storage: Supabase con encryption at-rest
- Verifica mittente: SendGrid Inbound Parse verifica SPF/DKIM
- Accesso: solo l'utente proprietario può vedere i propri draft (RLS Postgres)
- Audit: timestamp di consenso conservato per audit trail (art. 7 GDPR)

### 8.10 Contatto

Per qualsiasi domanda sul trattamento di dati relativi a questa feature, contattare:

**Titolare del trattamento**: Luca Galli (BeGift)
**Email privacy**: privacy@begift.app

---

## Da fare nel codice quando si pubblica

1. Aggiungere il blocco sopra in `app/privacy/page.tsx` come sezione 8
2. Aggiungere link a questa sezione dal toggle in `EmailParserSettings.tsx`
3. Verificare che il cookie banner abbia categoria distinta "marketing/affiliate" → già presente
4. Aggiornare data ultima revisione privacy policy in fondo pagina
