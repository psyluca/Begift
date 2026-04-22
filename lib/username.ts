/**
 * Helper condivisi per validazione e normalizzazione degli handle/username.
 * Usati sia client-side (UI feedback in tempo reale) che server-side
 * (API check + update). Stessa logica = UX consistente.
 */

/** Regex di validazione handle: lowercase, cifre, underscore, 3-20 char. */
export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export type UsernameValidation =
  | { ok: true }
  | { ok: false; reason: "too_short" | "too_long" | "invalid_chars" | "reserved" | "empty" };

/**
 * Lista di handle riservati (nomi di route, parole sensibili).
 * Evita @admin, @api, @login che creerebbero collisioni di routing
 * se un giorno implementassimo /{handle} come pagina pubblica.
 */
export const RESERVED_HANDLES = new Set([
  "admin", "administrator", "api", "app", "auth", "login", "logout", "signin", "signup",
  "signout", "settings", "profile", "dashboard", "create", "gift", "gifts", "reactions",
  "chat", "notification", "notifications", "push", "user", "users", "me", "you",
  "help", "support", "privacy", "terms", "about", "contact", "home", "index",
  "begift", "root", "system", "public", "private", "undefined", "null", "true", "false",
]);

/**
 * Normalizza un input utente per tentare di renderlo un handle valido.
 * Minuscolo, rimuove spazi, accenti e caratteri non ammessi.
 * Utile come helper lato UI per auto-suggerire da input "libero".
 */
export function normalizeHandle(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // rimuovi accenti
    .replace(/[^a-z0-9_]/g, "")       // tutto il resto out
    .slice(0, 20);
}

/** Valida un handle candidato. */
export function validateUsername(handle: string): UsernameValidation {
  if (!handle) return { ok: false, reason: "empty" };
  if (handle.length < 3) return { ok: false, reason: "too_short" };
  if (handle.length > 20) return { ok: false, reason: "too_long" };
  if (!USERNAME_REGEX.test(handle)) return { ok: false, reason: "invalid_chars" };
  if (RESERVED_HANDLES.has(handle)) return { ok: false, reason: "reserved" };
  return { ok: true };
}

/** Traduce il reason code in copy IT user-friendly. */
export function validationMessageIt(v: UsernameValidation): string {
  if (v.ok) return "";
  switch (v.reason) {
    case "empty":         return "Scegli uno username";
    case "too_short":     return "Minimo 3 caratteri";
    case "too_long":      return "Massimo 20 caratteri";
    case "invalid_chars": return "Solo lettere minuscole, numeri, _";
    case "reserved":      return "Questo nome è riservato, scegline un altro";
  }
}
