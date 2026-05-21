/**
 * Type definitions per il modulo email parser.
 *
 * Schema generale del risultato strutturato dopo parsing LLM.
 * Lo schema varia per merchant ma ha un nucleo comune.
 */

export type SupportedMerchant =
  | "ticketone"
  | "vivaticket"
  | "smartbox"
  | "wonderbox"
  | "getyourguide"
  | "booking"
  | "trenitalia"
  | "unknown";

export type GiftType =
  | "event_ticket"          // concerto, sport, teatro
  | "experience_voucher"    // cofanetto Smartbox/Wonderbox
  | "tour_booking"          // esperienza GetYourGuide
  | "hotel_booking"         // soggiorno Booking
  | "train_ticket"          // Trenitalia
  | "subscription"          // abbonamento Audible/MyBeautyBox
  | "product_order"         // ordine fisico (es. PhotoSì)
  | "generic_gift"          // fallback
  | "unknown";

/**
 * Output unificato del parser.
 *
 * I campi sono "best effort": il parser tenta di estrarli, ma puo'
 * lasciarli null se non trovati. Il caller deve gestire la mancanza
 * di dati senza assumere presenza.
 */
export interface ParsedEmailContent {
  // Identificazione
  merchant: SupportedMerchant;
  type: GiftType;

  // Titolo principale (es. nome evento, nome esperienza, hotel)
  title: string | null;

  // Sottotitolo (es. artista, descrizione esperienza)
  subtitle?: string | null;

  // Data principale (ISO 8601 con timezone)
  // Per eventi: data/ora inizio
  // Per booking: data check-in
  // Per voucher: data validità (potrebbe essere null)
  event_date: string | null;

  // Data fine (per booking multi-giorno, voucher con scadenza)
  event_end_date?: string | null;

  // Location (luogo evento, citta hotel, ecc.)
  location?: string | null;

  // Per biglietti eventi: dettagli posto
  tickets?: Array<{
    section?: string | null;
    row?: string | null;
    seat?: string | null;
    quantity: number;
  }>;

  // Per voucher: codice da riscattare
  voucher_code?: string | null;

  // Per booking: codice prenotazione
  booking_code?: string | null;

  // Importo totale pagato (in centesimi per evitare float)
  total_paid_cents?: number | null;
  currency?: string; // default "EUR"

  // Foto/immagini suggerite per il pacco (es. URL della cover evento)
  suggested_image_urls?: string[];

  // Messaggio emozionale suggerito (LLM-generated)
  suggested_message?: string | null;

  // Confidence score complessivo (0-1)
  confidence: number;

  // Eventuali warning del parser
  warnings?: string[];
}

/**
 * Input al parser: email raw dal webhook SendGrid Inbound Parse.
 */
export interface InboundEmail {
  // Sender effettivo della mail forwardata (potrebbe essere noreply@merchant.com)
  fromAddress: string;
  fromName?: string;

  // Sender che ha forwardato (cioe' l'utente BeGift) — estratto da X-Forwarded-For
  // o dai metadati SendGrid
  forwardedByEmail: string;

  // Subject originale
  subject: string;

  // Body in formato testuale (preferito)
  bodyText: string;

  // Body HTML (se solo HTML disponibile)
  bodyHtml?: string;

  // Allegati salvati su Storage
  attachments: Array<{
    filename: string;
    contentType: string;
    storageUrl: string;
    sizeBytes: number;
  }>;

  // Timestamp di ricezione
  receivedAt: string;
}

/**
 * Risultato completo del parsing (con audit info).
 */
export interface ParseResult {
  // Il contenuto parsed (se successo)
  content: ParsedEmailContent | null;

  // Status del parsing
  status: "success" | "low_confidence" | "failed";

  // Errore se status='failed'
  error?: string;

  // Telemetry
  llm_model_used?: string;
  tokens_input?: number;
  tokens_output?: number;
  duration_ms?: number;
}
