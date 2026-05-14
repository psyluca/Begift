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
  "suggested_message": "string|null", // Genera un messaggio italiano emozionale di 1-2 frasi adatto al gift
  "confidence": float,              // 0.0-1.0
  "warnings": ["string"]|null
}`;

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
  "suggested_message": "So che aspettavi questo concerto da una vita. Tieniti pronto: il 15 luglio andiamo a vedere Vasco insieme.",
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
  "suggested_message": "Tu e quella persona speciale meritate un weekend solo per voi. Scegli quando e dove, ci penso io a tutto il resto.",
  "confidence": 0.92,
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
  // Se merchant unknown o niente esempi specifici, includi entrambi come hint
  if (fewshots.length === 0) {
    fewshots.push(FEWSHOT_TICKETONE, FEWSHOT_SMARTBOX);
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
