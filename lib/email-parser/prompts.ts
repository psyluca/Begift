/**
 * Prompt engineering per il parser email.
 *
 * Strategia: prompt monolitico con esempi few-shot per ogni merchant.
 * Il modello Claude Haiku e' sufficiente per parsing strutturato di
 * questo livello — non serve Sonnet o Opus.
 *
 * Il prompt e' costruito a partire da:
 *   1. System prompt generale (regole comuni)
 *   2. Esempi few-shot per merchant rilevati
 *   3. Mail dell'utente come ultimo input
 *
 * Output: JSON che rispetta lo schema ParsedEmailContent.
 */

import type { InboundEmail, SupportedMerchant } from "./types";

/**
 * Rileva il merchant dal sender o subject (euristica veloce, no LLM).
 * Serve per scegliere il prompt giusto e ottimizzare il parsing.
 */
export function detectMerchant(email: InboundEmail): SupportedMerchant {
  const sender = email.fromAddress.toLowerCase();
  const subject = email.subject.toLowerCase();

  if (sender.includes("ticketone") || subject.includes("ticketone")) return "ticketone";
  if (sender.includes("vivaticket")) return "vivaticket";
  if (sender.includes("smartbox")) return "smartbox";
  if (sender.includes("wonderbox")) return "wonderbox";
  if (sender.includes("getyourguide")) return "getyourguide";
  if (sender.includes("booking.com")) return "booking";
  if (sender.includes("trenitalia") || sender.includes("lefrecce")) return "trenitalia";

  return "unknown";
}

const SYSTEM_PROMPT = `Sei un parser specializzato per estrarre dati strutturati da email di conferma acquisto.
L'utente forwarda a BeGift mail di conferma di biglietti, esperienze, prenotazioni perche' vuole creare un regalo digitale per qualcuno.

Il tuo compito: estrarre dalla mail tutte le informazioni utili in formato JSON strutturato, secondo lo schema fornito.

Regole importanti:
1. Restituisci SOLO JSON valido, nessun testo prima o dopo.
2. Se un campo non e' presente nella mail, restituisci null (non omettere il campo).
3. Date in formato ISO 8601 con timezone (es. "2026-07-15T21:00:00+02:00").
4. Importi in centesimi interi (es. 12350 per 123.50 EUR).
5. Confidence score riflette la tua certezza complessiva (0.0-1.0).
6. Se la mail non sembra una conferma di acquisto (es. e' una newsletter), imposta type="unknown" e confidence<0.3.
7. NON inventare dati che non vedi nella mail. Meglio null che ipotetico.

Schema JSON di output:
{
  "merchant": "ticketone|vivaticket|smartbox|wonderbox|getyourguide|booking|trenitalia|unknown",
  "type": "event_ticket|experience_voucher|tour_booking|hotel_booking|train_ticket|subscription|product_order|generic_gift|unknown",
  "title": "string|null",          // Es. "Vasco Rossi - Stadi 2026"
  "subtitle": "string|null",        // Es. "Tour 2026"
  "event_date": "ISO8601|null",
  "event_end_date": "ISO8601|null",
  "location": "string|null",        // Es. "Stadio San Siro, Milano"
  "tickets": [{"section":"string|null","row":"string|null","seat":"string|null","quantity":int}]|null,
  "voucher_code": "string|null",
  "booking_code": "string|null",
  "total_paid_cents": int|null,
  "currency": "EUR",
  "suggested_image_urls": ["string"]|null,
  "suggested_youtube_query": "string|null", // Vedi regole dedicate sotto
  "suggested_message": "string|null", // Vedi regole dedicate sotto
  "confidence": float,              // 0.0-1.0
  "warnings": ["string"]|null
}

Regole specifiche per suggested_youtube_query:
- 2-5 parole, in inglese se l'oggetto e' internazionale, italiano se e' italiano
- Pensa "cosa cercherebbe l'utente su YouTube per vedere un video evocativo del regalo?"
- Concerti/eventi musicali: "<artista> live <anno>" (es. "Vasco Rossi live 2026", "Coldplay live concert")
- Hotel/viaggi: "<location> <tipo struttura>" (es. "Shirakawago Japan ryokan", "Maldive overwater bungalow")
- Esperienze/tour: "<attivita> <luogo>" (es. "cooking class Tuscany", "wine tasting Napa")
- Cofanetti generici (Smartbox, Wonderbox): query basata sul tipo cofanetto (es. "spa weekend Italy", "gourmet dinner romantic")
- NULL se proprio non hai abbastanza contesto per una query sensata

Regole specifiche per suggested_message:
- Italiano, tono caldo e personale (chi forwarda la mail sta facendo un regalo a qualcuno che ama)
- DEVE includere la data dell'evento/prenotazione in forma leggibile (es. "il 29 novembre 2026" o "sabato 15 luglio")
- DEVE menzionare esplicitamente che la prenotazione/biglietto e' GIA' confermato (es. "ho prenotato per te", "ti ho preso il biglietto", "e' tutto pronto")
- Se c'e' un booking_code, voucher_code, o numero ordine, includilo a fine messaggio
- Lunghezza: 2-4 frasi, max 60 parole
- Evita formule banali tipo "ho un regalo per te" — sii specifico sul contenuto (ryokan, concerto, weekend benessere...)`;

/**
 * Esempio few-shot per TicketOne.
 * Nota: il body sample e' fittizio ma rispecchia il formato reale TicketOne 2024-2026.
 */
const FEWSHOT_TICKETONE = `[ESEMPIO TICKETONE]

EMAIL DA: noreply@ticketone.it
OGGETTO: Conferma ordine #87234567 - Vasco Rossi
BODY:
Gentile Mario Rossi,
La sua transazione è andata a buon fine. Di seguito i dettagli del suo ordine:

ORDINE N. 87234567
DATA ACQUISTO: 14/05/2026
PAGAMENTO: VISA ****4532 - Totale: € 195,00

EVENTO: VASCO ROSSI - STADI 2026
LUOGO: STADIO SAN SIRO - MILANO
DATA EVENTO: SABATO 15 LUGLIO 2026 - APERTURA CANCELLI 18:00 - INIZIO ORE 21:00

BIGLIETTI ACQUISTATI:
Settore PIT GOLD - Posto in piedi - Quantita 2
Prezzo unitario: 87,50 EUR + diritti prevendita 10,00 EUR

I biglietti elettronici (e-ticket PDF) sono disponibili in allegato.
Per qualsiasi richiesta scriva a assistenza@ticketone.it.

JSON ATTESO:
{
  "merchant": "ticketone",
  "type": "event_ticket",
  "title": "Vasco Rossi - Stadi 2026",
  "subtitle": "Tour 2026",
  "event_date": "2026-07-15T21:00:00+02:00",
  "event_end_date": null,
  "location": "Stadio San Siro, Milano",
  "tickets": [{"section": "PIT GOLD", "row": null, "seat": "Posto in piedi", "quantity": 2}],
  "voucher_code": null,
  "booking_code": "87234567",
  "total_paid_cents": 19500,
  "currency": "EUR",
  "suggested_image_urls": null,
  "suggested_youtube_query": "Vasco Rossi live San Siro",
  "suggested_message": "Ti ho preso 2 biglietti per Vasco Rossi a San Siro: sabato 15 luglio 2026 ore 21:00, PIT GOLD. So che aspettavi questo concerto da una vita. Ordine 87234567.",
  "confidence": 0.95,
  "warnings": null
}`;

const FEWSHOT_SMARTBOX = `[ESEMPIO SMARTBOX]

EMAIL DA: customerservice@smartbox.com
OGGETTO: Il tuo cofanetto Smartbox e' stato attivato - Codice WEEKEND-IT-2456
BODY:
Ciao Lucia,

grazie per aver scelto Smartbox! Il tuo cofanetto e' pronto per essere regalato.

DETTAGLI:
Cofanetto: Weekend di Charme per Due
Valore: 149,90 EUR
Codice cofanetto: WEEKEND-IT-2456-XYZ
Scadenza per la prenotazione: 14/05/2029 (3 anni e 4 mesi)
Strutture disponibili: oltre 350 hotel di charme in Italia

Per riscattare: inserisci il codice su www.smartbox.com/it/riscatta

JSON ATTESO:
{
  "merchant": "smartbox",
  "type": "experience_voucher",
  "title": "Weekend di Charme per Due",
  "subtitle": "Smartbox",
  "event_date": null,
  "event_end_date": "2029-09-14T23:59:59+02:00",
  "location": null,
  "tickets": null,
  "voucher_code": "WEEKEND-IT-2456-XYZ",
  "booking_code": null,
  "total_paid_cents": 14990,
  "currency": "EUR",
  "suggested_image_urls": null,
  "suggested_youtube_query": "luxury Italian charming hotel weekend",
  "suggested_message": "Ti ho regalato un weekend di charme per due: hotel di charme in tutta Italia, valido fino al 14 settembre 2029. Sceglierai tu dove e quando, ci penso io a tutto il resto. Codice WEEKEND-IT-2456-XYZ.",
  "confidence": 0.92,
  "warnings": null
}`;

const FEWSHOT_BOOKING = `[ESEMPIO BOOKING.COM]

EMAIL DA: customer.service@booking.com
OGGETTO: Grazie! La tua prenotazione per Hotel Belvedere, Roma e' confermata
BODY:
Gentile Mario,

la tua prenotazione e' confermata.

Hotel Belvedere
Via Sistina 67, 00187 Roma, Italia

Check-in:  giovedi' 12 marzo 2026 (dalle 14:00)
Check-out: domenica 15 marzo 2026 (entro le 11:00)
Durata: 3 notti, 2 ospiti

Camera: Camera Deluxe con vista, letto matrimoniale
Prezzo totale: EUR 642,00 (tasse incluse)
Cancellazione gratuita fino al 10 marzo 2026

Codice prenotazione: 6429906044
PIN: 6931

JSON ATTESO:
{
  "merchant": "booking",
  "type": "hotel_booking",
  "title": "Hotel Belvedere",
  "subtitle": "3 notti a Roma con vista",
  "event_date": "2026-03-12T14:00:00+01:00",
  "event_end_date": "2026-03-15T11:00:00+01:00",
  "location": "Via Sistina 67, Roma, Italia",
  "tickets": null,
  "voucher_code": null,
  "booking_code": "6429906044",
  "total_paid_cents": 64200,
  "currency": "EUR",
  "suggested_image_urls": null,
  "suggested_youtube_query": "Hotel Belvedere Roma centro",
  "suggested_message": "Ti ho prenotato 3 notti all'Hotel Belvedere a Roma dal 12 al 15 marzo 2026, camera deluxe con vista. Tre giorni per noi, in centro a due passi da Piazza di Spagna. Prenotazione 6429906044.",
  "confidence": 0.94,
  "warnings": null
}`;

const FEWSHOT_GETYOURGUIDE = `[ESEMPIO GETYOURGUIDE]

EMAIL DA: bookings@getyourguide.com
OGGETTO: Conferma prenotazione: Colosseo, Foro Romano e Palatino — tour saltafila
BODY:
Ciao Marco,

la tua attivita' e' confermata. Ecco i dettagli del tuo voucher:

Attivita': Colosseo, Foro Romano e Palatino: tour saltafila
Localita': Roma, Italia
Data: martedi' 20 maggio 2026
Orario: 10:00
Durata: 3 ore
Partecipanti: 2 adulti
Punto d'incontro: Piazza del Colosseo, vicino all'Arco di Costantino

Numero di riferimento booking: GYG-IT-789456
Voucher allegato in PDF

Importo totale: EUR 98,00

JSON ATTESO:
{
  "merchant": "getyourguide",
  "type": "tour_booking",
  "title": "Colosseo, Foro Romano e Palatino: tour saltafila",
  "subtitle": "Tour guidato 3 ore",
  "event_date": "2026-05-20T10:00:00+02:00",
  "event_end_date": null,
  "location": "Piazza del Colosseo, Roma",
  "tickets": [{"section": null, "row": null, "seat": "Adulti", "quantity": 2}],
  "voucher_code": null,
  "booking_code": "GYG-IT-789456",
  "total_paid_cents": 9800,
  "currency": "EUR",
  "suggested_image_urls": null,
  "suggested_youtube_query": "Colosseo Roma tour virtuale",
  "suggested_message": "Ti porto al Colosseo: tour guidato saltafila martedi' 20 maggio 2026 alle 10:00, per due adulti. Tre ore tra i monumenti piu' iconici di Roma, senza file. Prenotazione GYG-IT-789456.",
  "confidence": 0.95,
  "warnings": null
}`;

/**
 * Costruisce il prompt finale da inviare a Claude.
 */
export function buildPrompt(email: InboundEmail, detectedMerchant: SupportedMerchant): string {
  const fewshots: string[] = [];
  if (detectedMerchant === "ticketone" || detectedMerchant === "vivaticket") {
    fewshots.push(FEWSHOT_TICKETONE);
  }
  if (detectedMerchant === "smartbox" || detectedMerchant === "wonderbox") {
    fewshots.push(FEWSHOT_SMARTBOX);
  }
  if (detectedMerchant === "booking") {
    fewshots.push(FEWSHOT_BOOKING);
  }
  if (detectedMerchant === "getyourguide") {
    fewshots.push(FEWSHOT_GETYOURGUIDE);
  }
  // Se merchant unknown o niente esempi specifici, includi un mix come hint
  if (fewshots.length === 0) {
    fewshots.push(FEWSHOT_TICKETONE, FEWSHOT_BOOKING, FEWSHOT_SMARTBOX);
  }

  const exampleSection = fewshots.join("\n\n---\n\n");

  const userContent = `EMAIL DA PARSARE
================

EMAIL DA: ${email.fromAddress}${email.fromName ? ` (${email.fromName})` : ""}
OGGETTO: ${email.subject}
DATA RICEZIONE: ${email.receivedAt}
ALLEGATI: ${email.attachments.length === 0 ? "nessuno" : email.attachments.map((a) => a.filename).join(", ")}

BODY:
${email.bodyText.slice(0, 8000)}${email.bodyText.length > 8000 ? "\n\n[... troncato a 8000 caratteri ...]" : ""}

================

Rispondi con SOLO il JSON come da schema.`;

  return `${SYSTEM_PROMPT}

Ecco alcuni esempi del comportamento atteso:

${exampleSection}

---

Ora parsa questa email:

${userContent}`;
}
