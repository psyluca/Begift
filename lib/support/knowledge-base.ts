/**
 * BeGift Knowledge Base — fatti strutturati sull'app che vengono iniettati
 * nel system prompt del Support Concierge.
 *
 * Aggiornare quando:
 *  - aggiungi/togli feature
 *  - cambi i path delle pagine
 *  - cambi merchant supportati dal parser email
 *  - cambi pricing/business model
 *
 * Convenzione: tenere SECCO. Ogni stringa < 200 char. Il LLM legge meglio
 * staccato che lungo.
 */

export const KB_VERSION = "2026-05-17";

export const KB_PRODUCT = {
  name: "BeGift",
  description:
    "PWA per creare regali emozionali digitali in 60 secondi. Pacco virtuale che si apre con animazione, messaggio e contenuto multimediale.",
  pricing: "Gratis durante il lancio. Nessun freemium attualmente attivo.",
  pwa_install: "L'app si installa da iPhone/Android tramite 'Aggiungi a Home'. Non c'e' versione App Store/Play Store.",
};

export const KB_FLOWS = {
  intent_picker: {
    path: "/start",
    description:
      "Picker guidato 2-3 step. Step 1: nome destinatario. Step 2: cosa regalare. Step 3 (solo per 'ho gia' qualcosa'): mail o file.",
  },
  manual_create: {
    path: "/create",
    description:
      "Flusso completo manuale. Scegli occasione, contenuto (foto/video/audio/link), packaging, messaggio. Per chi sa gia' cosa vuole regalare.",
  },
  email_parser: {
    path: "/forward-mail",
    description:
      "Inoltri una mail di conferma acquisto (TicketOne, Booking, Smartbox, GetYourGuide) a un indirizzo BeGift, ti prepariamo un pacco regalo pre-popolato.",
    address: "inbox@plans.begift.app",
    activation: "Settings > toggle 'Inoltro mail → regalo automatico'. Senza attivazione le mail vengono droppate per privacy.",
    delay: "Il parsing dura 10-15 secondi. La bozza appare in /drafts.",
    supported_merchants: "TicketOne, Booking, Smartbox, GetYourGuide, Vivaticket, Wonderbox.",
  },
  experiences_shop: {
    path: "/discover",
    description:
      "Catalogo curato di esperienze giftabili (tour, cene, weekend). Click esperienza → pagina dettaglio → 'Acquista su <partner>' → vai a partner per pagare. Dopo acquisto, mail di conferma da inoltrare per creare il pacco.",
    partners: "Principalmente GetYourGuide. Awin per Booking/Smartbox in fase di setup.",
  },
  drafts: {
    path: "/drafts",
    description:
      "Lista delle bozze create dal parser email. Click su bozza → pagina draft per nominare destinatario + scrivere messaggio.",
  },
  draft_completion: {
    path: "/draft/[id]",
    description:
      "Form per completare la bozza: nome destinatario + messaggio. 'Completa e invia' crea il gift vero, redirect a /gift/[id]/edit per packaging.",
  },
  gift_edit: {
    path: "/gift/[id]/edit",
    description:
      "Personalizzazione packaging. 6 preset rapidi (Classico/Festoso/Romantico/Elegante/Kawaii/Natura) + colori carta/nastro/fiocco, tipo fiocco, animazione apertura, suono. Anteprima live.",
  },
  gift_share: {
    path: "/gift/[id]",
    description:
      "Pagina del gift creato. Per il sender mostra il link da copiare e condividere via WhatsApp/email. Per il destinatario e' l'apertura emozionale del pacco.",
  },
};

export const KB_FAQ_ENTRIES: Array<{ q: string; a: string }> = [
  {
    q: "Quanto costa BeGift?",
    a: "Gratis durante il lancio. Niente abbonamenti, niente carte di credito richieste per creare regali.",
  },
  {
    q: "Devo creare un account?",
    a: "Per CREARE un regalo si', serve un account (basta email, codice OTP, niente password). Per RICEVERE un regalo no — chi riceve apre solo un link.",
  },
  {
    q: "Come funziona il parser email?",
    a: "Vai in Settings, attiva 'Inoltro mail', copi l'indirizzo inbox@plans.begift.app. Inoltri lì una mail di conferma (TicketOne, Booking, Smartbox...). In 10-15 secondi appare una bozza in /drafts.",
  },
  {
    q: "La mia mail inoltrata non e' arrivata in /drafts. Cosa faccio?",
    a: "Controlla 3 cose: (1) hai attivato l'opt-in in Settings? (2) hai inoltrato dall'email del tuo profilo BeGift? (3) ha passato 15 secondi? Se tutte sì, dimmelo che alzo una nota a Luca.",
  },
  {
    q: "Quali tipi di mail il parser sa leggere?",
    a: "TicketOne, Booking, Smartbox, GetYourGuide, Vivaticket, Wonderbox. Per altre prove a inoltrarla, spesso BeGift le capisce comunque.",
  },
  {
    q: "Come trovo il regalo che ho creato?",
    a: "Vai in /dashboard, vedi tutti i regali che hai inviato e quelli che hai ricevuto.",
  },
  {
    q: "Come condivido il regalo con chi lo deve aprire?",
    a: "Dopo aver completato il pacco, ti diamo un link tipo https://begift.app/gift/abc-123. Copialo e mandalo via WhatsApp, mail, ovunque. Chi lo apre vede il pacco emozionale.",
  },
  {
    q: "Posso modificare un regalo dopo averlo creato?",
    a: "Sì se chi riceve non l'ha ancora aperto. Vai in /dashboard, click sul regalo, modifica.",
  },
  {
    q: "Posso vedere se il destinatario ha aperto il regalo?",
    a: "Sì, in /dashboard accanto a ogni regalo vedi data e ora di apertura.",
  },
  {
    q: "Come funziona la personalizzazione del pacco?",
    a: "In /gift/[id]/edit scegli tra 6 preset rapidi oppure customizzi colori, tipo di fiocco, animazione di apertura, suono. C'e' anteprima live.",
  },
  {
    q: "BeGift e' privato? I miei dati sono al sicuro?",
    a: "Sì. Zero cookie tracking, zero pubblicita', zero condivisione dati. Le mail inoltrate vengono processate da Claude AI e poi cancellate. Vedi /privacy per dettagli.",
  },
  {
    q: "Posso usare BeGift per regali aziendali?",
    a: "Sì, BeGift e' perfetto per gifting aziendale (Festa Natale, anniversari, welcome kit). Apro una nota a Luca che ti contatta — lascia anche il tuo nome se non sei loggato.",
  },
  {
    q: "Il regalo costa qualcosa al destinatario?",
    a: "No, mai. BeGift e' gratis per chi crea E per chi riceve. Se il regalo include un'esperienza con costo (es. cena, biglietto), quella la paghi tu prima sul sito del partner.",
  },
  {
    q: "Come faccio a installare BeGift come app?",
    a: "Su iPhone: apri Safari, vai su begift.app, tocca Condividi → 'Aggiungi a Home'. Su Android: Chrome → menu → 'Aggiungi alla schermata Home'. Funziona come app nativa, anche offline.",
  },
];

export const KB_PROBLEMI_COMUNI = [
  {
    sintomo: "Foto del cantante mancante sul draft TicketOne",
    causa: "Il fallback YouTube richiede ~5 secondi. Se la bozza e' molto recente, riprova fra poco.",
  },
  {
    sintomo: "Pagina settings mi butta su login anche se sono loggato",
    causa: "Bug fixato il 2026-05-16. Hard refresh (Cmd+Shift+R o Ctrl+Shift+R) risolve.",
  },
  {
    sintomo: "Click 'Acquista su GetYourGuide' va a 404 GYG",
    causa: "Alcuni link del catalogo hanno ancora product ID placeholder. Luca li sta sostituendo con quelli veri. Riprova fra qualche giorno o usa un'altra esperienza.",
  },
  {
    sintomo: "Drafts pagina vuota anche dopo aver inoltrato",
    causa: "Hai attivato 'Inoltro mail' in Settings? Hai inoltrato dall'email del tuo profilo BeGift (non da Hotmail se sei loggato con Gmail)? Aspetta 15 sec.",
  },
];

export const KB_ESCALATION_TRIGGERS = [
  "richieste B2B / aziendali / partnership",
  "lamentele su contenuto inappropriato (CSAM, abuso, spam)",
  "domande legali / privacy specifiche (rimborso, GDPR diritti, ecc.)",
  "bug specifici riproducibili che non posso diagnosticare",
  "richieste di rimborso pagamento (BeGift e' gratis, pero' i pagamenti GYG/Booking sono col partner)",
  "utente scrive 'non funziona' o 'broken' 2 volte di seguito senza dettaglio risolvibile",
  "utente chiede esplicitamente di parlare con un umano",
];
