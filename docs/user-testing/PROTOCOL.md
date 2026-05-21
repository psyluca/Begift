# Protocollo User Test BeGift — v1

**Quando:** maggio 2026
**Target:** 3-5 persone, mix di età/competenza tech, NON utenti BeGift attuali
**Durata:** 20-25 min per persona
**Output:** prioritized issue list per i prossimi 2 sprint UX

---

## Setup tecnico

1. **Registra lo schermo + audio** (con consenso del tester). Su Mac: QuickTime → New Screen Recording. Sul telefono del tester: registrazione schermo iOS/Android nativa.
2. Apri `https://begift.app/start` (NON la home attuale — vogliamo testare il nuovo picker)
3. Stai zitto. Davvero. Anche quando si bloccano. Conta fino a 30 secondi prima di intervenire.
4. Prendi appunti su: dove esita, cosa clicca per sbaglio, cosa dice ad alta voce ("ah, devo cliccare lì?"), espressioni facciali.

---

## Domande pre-test (5 min)

- Chi sei? Età, lavoro, città
- Quante app usi sul telefono in una giornata media?
- Quando hai fatto l'ultimo regalo? Cosa hai regalato? A chi?
- Hai mai mandato un regalo digitale (carta regalo, link Spotify, voucher)?
- Conosci BeGift? (Se no, **non dire ancora cos'è**)

---

## Task scenari

Dai uno scenario per volta. **Non dire MAI quale flusso usare.** Lascia che decidano loro. Se non sanno cosa fare, attendi 30 sec prima di aiutare.

### Task 1 — "Concerto per amico"

> "Tuo migliore amico/amica compie 30 anni la settimana prossima. Sai che ama X (un artista che tu sai gli/le piace davvero). Hai sentito che fa un concerto a Milano fra 2 mesi. **Usa BeGift per regalargli questo concerto.** Pensa ad alta voce mentre fai."

**Cosa misuriamo:**
- Trova /discover senza che gli/le dica?
- Capisce che deve andare su GetYourGuide a pagare?
- Si confonde tra "io regalo" e "lui apre"?
- Tempo totale per arrivare al gift inviato

### Task 2 — "Cena per il partner"

> "È il tuo anniversario. **Vuoi regalare al tuo partner una cena romantica a Firenze**, da fare insieme in un weekend di tua scelta. Trova un'esperienza su BeGift e impacchettala."

**Cosa misuriamo:**
- Usa il filtro città/categoria di /discover?
- Trova il Chianti wine tour o la Pasta class?
- Si chiede "ma è per noi due o solo per lui/lei?"

### Task 3 — "Mail da gestire"

> "Hai appena comprato un cofanetto Smartbox 'Weekend per due' e hai ricevuto la mail di conferma. Vuoi mandarlo a tua sorella per il suo compleanno la settimana prossima, ma in modo emozionale, non solo inoltrandole la mail piatta. **Usa BeGift per fare un pacco emozionale dal contenuto della mail.**"

(Per il test: usa il fixture `lib/email-parser/__fixtures__/smartbox-weekend.txt` come fonte. Puoi mostrarglielo come "ecco la mail che hai ricevuto", chiedendogli di forwardarla a `plans@plans.begift.app`.)

**Cosa misuriamo:**
- Trova come attivare il parser? (Settings → opt-in → copy address)
- Capisce che deve forwardare la mail vera?
- Si rende conto che il draft compare in /drafts?
- Cosa fa quando arriva il draft "pending" che ci mette ~10s?

---

## Domande post-test (5 min)

- **Cosa ti è piaciuto?** (Apre con positivo, abbassa difese)
- **Cosa ti ha confuso o frustrato?**
- **C'è qualcosa che ti sarebbe piaciuto fare ma non hai capito come?**
- **Su una scala 1-10, quanto è stato facile?**
- **Lo rifaresti per un regalo vero domani?** Perché sì o perché no?
- **A chi pensi che potrebbe servire BeGift?**
- **Una persona ipotetica: tua mamma riuscirebbe a usarlo?** (Sviluppa: chi nella tua famiglia faticarebbe?)

---

## Cosa cercare nei dati raccolti (analisi post)

### Pattern di confusione frequenti
- "Aspetto a chi devo regalarlo prima o dopo?"
- "Ma sto pagando io o sta pagando lui?"
- "Dove trovo i regali che ho creato?"
- "Come faccio a mandarglielo? WhatsApp? Mail?"

### Friction points misurabili
- Tempo da `/start` → primo gift creato e inviato
- Numero di backtrack (click `←` o `back browser`)
- Numero di mouse-hover su elementi NON cliccabili (intento mal interpretato)
- Numero di volte che il tester dice "ah" / "ok" / "perché ora..."

### Domande critiche di mental model
- Capiscono che possono RIUSARE BeGift per più gift? (vs one-shot)
- Capiscono la differenza tra "io creo" e "lui apre"?
- Vedono il valore aggiunto vs mandare un link WhatsApp diretto?

---

## Output atteso

Alla fine dei 3-5 test, scrivi un doc con:

1. **Top 3 friction points** ranked per gravità (quanti tester hanno bloccato + quanto era critico)
2. **Top 3 quick wins** (cose facili da fixare con grande impatto)
3. **Top 3 quote testuali** dei tester (mantieni l'italiano vero)
4. **Decisioni di prodotto** che dovresti prendere prima di scrivere altro codice

---

## NON fare durante il test

- ❌ Non spiegare cosa fa BeGift prima del test
- ❌ Non dire "clicca lì" quando si bloccano
- ❌ Non difendere il design se criticano ("sì ma in realtà...")
- ❌ Non scegliere parenti compiacenti che ti dicono "bellissimo"
- ❌ Non saltare il post-interview (l'oro è lì)

---

## Calendario suggerito

- **Giorno 1**: 2 test, scrivi appunti la sera stessa
- **Giorno 2 (dopo 24h)**: 1-2 test, includi feedback grezzo dei primi 2
- **Giorno 3**: 1 test finale + scrittura analisi
- **Giorno 4**: decisioni di prodotto, no codice
- **Giorno 5**: inizia a implementare i 3 quick wins

Sono 5 giorni di osservazione che valgono 2 mesi di codice "a sentimento".
