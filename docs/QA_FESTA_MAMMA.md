# QA Report — Flow Festa della Mamma

**Data:** 2026-04-27 (T-14 dal lancio Festa Mamma 11 maggio)
**Autore:** Claude (audit code-review, no end-to-end test runtime)
**Scope:** `/festa-mamma` (landing) → `/festa-mamma/crea` (questionario 8 step) → `/gift/{id}` (rendering del regalo aperto)

Questo documento elenca tutte le issue trovate analizzando il codice del flow, ordinate per priorità. Le **A** sono da fixare prima del lancio (rovinano l'esperienza). Le **B** sono nice-to-have. Le **C** possono attendere post-lancio.

---

## ✅ Già fixate in questo passaggio

### A1 — Bottone "Avanti" non comunicava lo skip negli step opzionali

**File:** `components/ParentLetterCreateClient.tsx`

**Bug:** agli step 3 (foto), 4 (lezione), 5 (canzone), 6 (voucher), il bottone diceva sempre "Avanti →" anche quando il campo era vuoto. La logica per "Salta →" esisteva ma non si attivava mai (`canAdvance` ritornava sempre `true` per gli step ≥3, quindi il branch `!canAdvance && step >= 3` era irraggiungibile).

**Fix:** introdotto `stepIsEmpty` che check se il valore corrente del campo opzionale è vuoto. Se sì, label = "Salta →".

**Impatto:** risolve un dei punti di confusione più comuni — utenti che pensano di "dover riempire tutto" e si bloccano. Ora capiscono che possono saltare.

---

## 🟥 Priority A — Da fixare prima del lancio

### A2 — Salvataggio progress in caso di reload pagina

**File:** `components/ParentLetterCreateClient.tsx`

**Issue:** se l'utente è allo step 5/8 e ricarica accidentalmente la pagina (pull-down su iPhone, tab close, Service Worker update), perde TUTTO il lavoro. Niente persistenza in localStorage.

**Per Festa Mamma** (caso d'uso emotivo, l'utente ha messo il cuore in un ricordo lungo), questo è devastante. L'utente riprova 1 volta, alla seconda perdita molla.

**Fix proposto:** salvare `{ step, recipientName, word, memory, photoUrl, lesson, songUrl, voucherUrl }` in localStorage con key `mothers_day_letter_draft` ogni volta che cambia step. All'init, se c'è un draft, mostrare un piccolo banner "Riprendi da dove avevi lasciato? [Riprendi] [Ricomincia]". Pulire al submit success.

**Stima:** 30 min.

### A3 — Step 7 "Tutto pronto" non mostra che canzone è stata scelta

**File:** `components/ParentLetterCreateClient.tsx` riga 496

**Issue:** la Preview mostra solo "♪ Una canzone allegata" come testo grigio, senza nome canzone né cover. Nello step finale "conferma e invia", l'utente non riesce a verificare visivamente quale canzone ha scelto. Se ha cambiato idea o ha scelto la canzone sbagliata, non se ne accorge.

**Fix proposto:** parsare l'URL Spotify (regex `/track/([a-zA-Z0-9]+)`) e mostrare nome + artista nel preview. Stato passato dal SongPicker tramite un nuovo state `songMeta?: {name, artists, imageUrl}`. Alternativa più semplice: salvare anche `songName` (`Title — Artist`) come state e mostrarlo come stringa.

**Stima:** 30 min.

---

## 🟨 Priority B — Nice to have

### B1 — Step 3 (foto) nessun progress bar durante upload

**File:** `components/ParentLetterCreateClient.tsx` riga 273

**Issue:** durante upload (specialmente per foto pesanti da iPhone, 5-10MB), l'utente vede solo "Caricamento…" stato testuale. Nessun feedback su quanto manca. Su connessioni lente sembra bloccato.

**Fix proposto:** integrare progress event di `useUpload` (se l'hook lo supporta) e mostrare percentuale o spinner animato.

**Stima:** 20 min se `useUpload` già fornisce progress, altrimenti 1h.

### B2 — Step 1 (parola) suggestion rotation troppo veloce

**File:** `components/ParentLetterCreateClient.tsx` riga 51

**Issue:** il placeholder rotates ogni 2.2 secondi. Per chi legge lentamente o è in indecisione, le parole cambiano sotto agli occhi. Un po' fastidioso.

**Fix proposto:** rallentare a 4-5 secondi, oppure stop rotation appena l'utente clicca/focus sul campo (gia? verifica). La rotation è utile come "ispirazione" quando l'utente è fermo, non quando sta pensando.

**Stima:** 10 min.

### B3 — Validation step 2 (memoria) troppo permissiva

**File:** `components/ParentLetterCreateClient.tsx` riga 64

**Issue:** `memory.trim().length >= 5` permette di proseguire scrivendo "ciaoo". Risultato: regalo con un ricordo vuoto/banale di basso valore emotivo. Spec del template è "una lettera che cresce" — serve sostanza.

**Fix proposto:** alzare a `>= 25` caratteri minimi. Aggiungere hint contestuale "Almeno 1-2 frasi reali" se l'utente è sotto. Non blocking ma preventivo.

**Stima:** 15 min.

### B4 — Errore generico "Errore di rete. Riprova" su submit fallito

**File:** `components/ParentLetterCreateClient.tsx` riga 136

**Issue:** se l'API ritorna 500 con `{ error: "extra_media column missing" }` o simili messaggi specifici, l'utente vede solo "Errore di rete. Riprova." Non capisce che è un problema server, prova 3 volte, si arrende.

**Fix proposto:** auto-retry come gia' fatto in `CreateGiftClient` (commit aa8ce79) con detection per colonne mancanti, e fallback retry senza il campo problematico. Stesso pattern.

**Stima:** 30 min.

---

## ⬜ Priority C — Post-lancio

### C1 — Animazioni di transizione tra step

**Issue:** click "Avanti →" cambia istantaneamente lo step. Niente animation. Per un flow "emotivo" (la natura del template Festa Mamma), una transizione slide/fade renderebbe il tutto più "rituale" e meno "form".

**Stima:** 1-2 ore (CSS transitions o Framer Motion).

### C2 — Import dati dal regalo precedente per ri-uso

**Issue:** se l'utente ha già creato un regalo per la mamma in passato, deve riscriversi tutto da capo. La foto di mamma resta su Supabase Storage ma deve riuploadarla.

**Fix proposto:** all'init, fetchare i regali precedenti dell'utente con stesso template. Se trovati, banner "Riusa la foto/info dell'anno scorso?".

**Stima:** 1.5 ore.

### C3 — A/B test ordine step

**Hypothesis:** lo step 1 ("una parola per descrivere mamma") è creativo e potenzialmente bloccante per gli utenti meno introspettivi. Spostarlo dopo "memoria" potrebbe ridurre drop-off (l'utente entra dalla parte del "raccontare" che è più facile, e arriva alla "parola" già scaldato).

**Fix proposto:** test A/B con 50/50 split, misura completion rate.

**Stima:** post-lancio, dopo 100+ utenti.

### C4 — Voucher upload PDF

**Issue:** lo step 6 voucher accetta solo URL, non l'upload di un file PDF (es. biglietto teatro acquistato). Il template parla di "Cena, esperienza, biglietti" — un PDF è la forma più frequente di voucher reale.

**Fix proposto:** aggiungere fallback "📎 carica PDF" sotto al campo URL, riutilizzando il pattern `useUpload` con `accept="application/pdf"`.

**Stima:** 30 min.

---

## 🟢 Punti di forza riscontrati

Cose **già ben fatte** che mantengo:

- Progress bar in cima molto chiaro (8 step, color-coded)
- Recovery del prev step (bottone "← Indietro")
- Validation graceful (non blocca con errori a video se l'utente non riempie)
- Fallback se l'API gift fails con 401 (redirect login con `?next=`)
- Tracking analytics `gift_created` con properties dettagliate
- Mobile-first layout (max-width 540px, padding generoso)
- Skip-able tutti gli step opzionali (foto, lezione, canzone, voucher)
- SongPicker integrato (commit recente) — promessa "nome → la cerchiamo noi" mantenuta

---

## Suggerimento priorità prossime 2 ore

Se hai 2 ore prima del lancio, fai in ordine:

1. **A2 — Persistenza draft localStorage** (30 min) — il più impattante. Senza, perdere progress = utente che molla.
2. **A3 — Mostra canzone scelta nel preview** (30 min) — chiarezza pre-submit.
3. **B4 — Auto-retry su submit fail** (30 min) — copia il pattern di `CreateGiftClient`, robust.
4. **B1 — Progress upload foto** (20-30 min) — affidabilità percepita.

Le **B2/B3/C** possono attendere 1-2 settimane post-lancio quando avremo dati su drop-off reali.
