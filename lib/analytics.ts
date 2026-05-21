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
 *
 * Eventi nuovi flow (aggiunti 2026-05-16 notte):
 *   - home_start_cta_clicked: tap "accompagniamo passo passo" sulla home
 *   - start_step1_completed: nome destinatario inserito in /start
 *   - start_intent_picked: scelta categoria step 2 in /start {intent}
 *   - start_ready_subtype_picked: scelta mail/file step 3 in /start {subtype}
 *   - draft_completed: 'Completa e invia' su /draft/[id] {merchant}
 *   - packaging_saved: 'Salva e condividi' su /gift/[id]/edit {bowType, sound}
 *
 * Eventi Support Concierge (aggiunti 2026-05-17):
 *   - concierge_opened: utente apre il FAB chat
 *   - concierge_message_sent: utente invia un messaggio
 *   - concierge_quick_reply_clicked: tap su una delle 3 quick replies {reply}
 *   - concierge_escalated: l'AI ha escalato a Luca via email
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
