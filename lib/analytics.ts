/**
 * Wrapper per Plausible Analytics.
 *
 * Scelta di Plausible:
 *  - Cookie-less by design → niente consent banner richiesto per
 *    l'analytics (art. 122 Codice Privacy italiano non si applica
 *    perche' non ci sono cookie o storage tecnici "di profilazione")
 *  - GDPR-compliant nativamente, server in UE (Germania)
 *  - 9 EUR/mese piano Growth, sufficiente fino a ~100k pageview/mese
 *
 * Attivazione: impostare NEXT_PUBLIC_PLAUSIBLE_DOMAIN su Vercel
 * (es. "begift.app"). Senza env var lo script non viene caricato.
 *
 * Uso:
 *   import { track } from "@/lib/analytics";
 *   track("gift_created", { occasion: "birthday", content: "video" });
 *
 * Eventi custom disponibili:
 *   - signup_completed: utente completa onboarding
 *   - gift_created: nuovo gift {occasion, content_type}
 *   - gift_opened: apertura regalo (device anonimo)
 *   - reaction_sent: reazione al regalo {reaction_type}
 *   - share_clicked: tap bottone Condividi post-create
 *   - referral_landing: arrivo con ?ref=@handle
 *   - reminder_added: nuova ricorrenza aggiunta
 */

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

/**
 * Invia un evento custom a Plausible. Silenzioso se Plausible non
 * caricato (es. env var non settata, ad-block attivo). Non lanciamo
 * mai errori — l'analytics non deve MAI rompere l'UX.
 */
export function track(eventName: string, props?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.plausible === "function") {
      window.plausible(eventName, props ? { props } : undefined);
    }
  } catch {
    /* noop */
  }
}

/**
 * Pageview manuale. Plausible traccia automaticamente le pageview
 * via pushState/replaceState, ma in alcuni edge case (es. Next.js
 * App Router con transizioni veloci) puo' essere utile forzarla.
 */
export function trackPageview(url?: string): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.plausible === "function") {
      window.plausible("pageview", url ? { props: { url } } : undefined);
    }
  } catch {
    /* noop */
  }
}
