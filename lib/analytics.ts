/**
 * Wrapper analytics — dual-write Plausible + PostHog.
 *
 * Stato 2026-06-04: in transizione. Per 5-7 giorni manteniamo
 * entrambi i tracker attivi:
 *  - PLAUSIBLE: tracker storico (€11/mese piano Monthly fino al 22 giu)
 *  - POSTHOG: tracker di destinazione (Cloud EU, free tier 1M events/mese)
 *
 * Quando i numeri tornano (PostHog ≈ Plausible ±5%) cancelliamo
 * Plausible: rimuoviamo la window.plausible() qui sotto, eliminiamo
 * lo <Script> Plausible da app/layout.tsx, e togliamo plausible.io
 * dal CSP in next.config.mjs.
 *
 * --- Why PostHog ---
 *  - Free tier generoso: 1M events/mese (BeGift ~5k events/mese ora)
 *  - Cloud EU (Frankfurt) → GDPR-compliant nativo
 *  - Funnels nativi (Plausible richiede "Goals" + è più scarno)
 *  - Costo €0/anno vs €110/anno Plausible (IVA non scaricabile per Luca)
 *  - Vedi memoria project_begift_analytics_migration.md
 *
 * --- Uso (invariato per il chiamante) ---
 *   import { track } from "@/lib/analytics";
 *   track("gift_created", { occasion: "birthday", content: "video" });
 *
 * Eventi custom disponibili:
 *   - signup_completed
 *   - gift_created: {occasion, content_type}
 *   - gift_opened
 *   - reaction_sent: {reaction_type}
 *   - share_clicked
 *   - referral_landing
 *   - reminder_added
 *   - home_start_cta_clicked
 *   - start_step1_completed
 *   - start_intent_picked: {intent}
 *   - start_ready_subtype_picked: {subtype}
 *   - draft_completed: {merchant}
 *   - packaging_saved: {bowType, sound}
 *   - concierge_opened, concierge_message_sent, concierge_quick_reply_clicked: {reply}
 *   - concierge_escalated
 *   - occasion_page_view: {slug}
 *   - occasion_idea_clicked: {slug, idea}
 *   - occasion_page_to_catalog_click: {slug, idea, href}
 */

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
    posthog?: {
      capture: (event: string, props?: Record<string, string | number | boolean>) => void;
      identify: (id: string, props?: Record<string, string | number | boolean>) => void;
      reset: () => void;
    };
  }
}

/**
 * Invia un evento custom ai due tracker attivi (Plausible + PostHog).
 * Silenzioso se uno dei due non è caricato (env var assente, ad-block,
 * race condition di caricamento). Non lanciamo mai errori — l'analytics
 * non deve MAI rompere l'UX.
 */
export function track(eventName: string, props?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;

  // Plausible (legacy, fino al 22 giu 2026)
  try {
    if (typeof window.plausible === "function") {
      window.plausible(eventName, props ? { props } : undefined);
    }
  } catch {
    /* noop */
  }

  // PostHog (target, Cloud EU)
  try {
    if (window.posthog && typeof window.posthog.capture === "function") {
      window.posthog.capture(eventName, props);
    }
  } catch {
    /* noop */
  }
}

/**
 * Pageview manuale. Sia Plausible che PostHog tracciano automaticamente
 * le pageview via pushState/replaceState, ma in alcuni edge case (es.
 * Next.js App Router con transizioni veloci) può essere utile forzarla.
 *
 * PostHog: chiamiamo posthog.capture('$pageview', { $current_url }) —
 * è il convention name che PostHog riconosce come pageview nelle dashboard.
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

  try {
    if (window.posthog && typeof window.posthog.capture === "function") {
      const finalUrl = url ?? window.location.href;
      window.posthog.capture("$pageview", { $current_url: finalUrl });
    }
  } catch {
    /* noop */
  }
}
