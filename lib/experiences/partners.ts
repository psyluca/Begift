/**
 * Configurazione affiliate partner per BeGift.
 *
 * Single source of truth per tracking URL pattern, commission rate,
 * cookie window. Riusato da:
 *   - /api/experiences/[id]/regalo (genera tracking URL al create)
 *   - /api/r/[token] (redirect endpoint con sostituzione placeholder)
 *   - lib/experiences/tracking.ts (analytics + attribution)
 *
 * Vedi anche docs/vendita-esperienze/PARTNER_INTEGRATION.md.
 */

import type { PartnerSlug } from "@/types/experiences";

export interface PartnerConfig {
  slug: PartnerSlug;
  displayName: string;
  /**
   * Env var che contiene l'affiliate ID di Luca su quel network.
   * Letto a runtime; null = non configurato → bloccare uso.
   */
  affiliateIdEnvVar: string;
  /**
   * Pattern URL affiliate. Placeholder supportati:
   *   - {affiliate_id} → da env var
   *   - {gift_id}      → tracking_id univoco per gift
   *   - {target_url}   → URL target encoded
   * Nota: per GetYourGuide il pattern e' incluso direttamente nel
   * affiliate_url_template del DB (per esperienza), perche' include
   * lo slug-tID specifico. Awin/TD usano deep link generici.
   */
  trackingPattern: "in-row" | "wrapper";
  /**
   * Wrapper template (solo se trackingPattern === "wrapper").
   * Usato da Awin/TradeDoubler che hanno un URL "redirect" generico.
   */
  wrapperUrlTemplate?: string;
  /** Commission rate default (override possibile per experience) */
  defaultCommissionRate: number;
  /** Giorni cookie window (per attribuzione manuale eventuale) */
  cookieWindowDays: number;
  /** Disclosure compliance breve mostrato a destinatario */
  disclosureLabel: string;
}

export const PARTNERS: Record<PartnerSlug, PartnerConfig> = {
  getyourguide: {
    slug: "getyourguide",
    displayName: "GetYourGuide",
    affiliateIdEnvVar: "GETYOURGUIDE_PARTNER_ID",
    // affiliate_url_template nel DB ha gia' partner_id e {gift_id}.
    // Esempio: https://www.getyourguide.com/rome-l33/colosseum-t44519?partner_id=BEGIFT&cmp={gift_id}
    trackingPattern: "in-row",
    defaultCommissionRate: 0.08,
    cookieWindowDays: 31,
    disclosureLabel: "Esperienza offerta tramite GetYourGuide.",
  },
  awin: {
    slug: "awin",
    displayName: "Awin Network",
    affiliateIdEnvVar: "AWIN_AFFILIATE_ID",
    // Awin deep link wrapper. {awinmid} viene dal record experience
    // (varia per merchant). {affiliate_id} dalla env var.
    // Nota: il template include gia' clickref={gift_id}, qui restiamo
    // simbolici. Vedi PARTNER_INTEGRATION.md per merchant attivi.
    trackingPattern: "wrapper",
    wrapperUrlTemplate:
      "https://www.awin1.com/cread.php?awinaffid={affiliate_id}&clickref={gift_id}",
    defaultCommissionRate: 0.05,
    cookieWindowDays: 30,
    disclosureLabel: "Esperienza offerta tramite Awin Network.",
  },
  tradedoubler: {
    slug: "tradedoubler",
    displayName: "TradeDoubler",
    affiliateIdEnvVar: "TRADEDOUBLER_AFFILIATE_ID",
    trackingPattern: "wrapper",
    wrapperUrlTemplate:
      "https://clk.tradedoubler.com/click?a={affiliate_id}&epi={gift_id}",
    defaultCommissionRate: 0.05,
    cookieWindowDays: 30,
    disclosureLabel: "Esperienza offerta tramite TradeDoubler.",
  },
};

/**
 * Sostituisce i placeholder nell'affiliate URL template con valori reali.
 * Restituisce null se la env var dell'affiliate_id non e' configurata.
 *
 * Placeholder supportati:
 *   {gift_id}      → required, tracking unico per il regalo
 *   {affiliate_id} → da env var del partner
 *   {target_url}   → URL target (caso wrapper) urlencoded
 */
export function resolveAffiliateUrl(
  template: string,
  partner: PartnerSlug,
  ctx: { gift_id: string; target_url?: string }
): string | null {
  const cfg = PARTNERS[partner];
  if (!cfg) return null;

  // env var richiesta SOLO se il template usa il placeholder {affiliate_id}.
  // Alcuni template (es. GetYourGuide nel seed) hanno il partner_id
  // hardcoded direttamente nell'URL (es. "?partner_id=BEGIFT&..."), nel
  // qual caso la env var non e' necessaria e il link funziona comunque.
  const needsAffiliateId = template.includes("{affiliate_id}");
  const affiliateId = process.env[cfg.affiliateIdEnvVar];
  if (needsAffiliateId && !affiliateId) {
    console.warn(
      `[experiences/partners] template requires {affiliate_id} but ${cfg.affiliateIdEnvVar} is not set; returning null`
    );
    return null;
  }

  let url = template;
  if (affiliateId) {
    url = url.split("{affiliate_id}").join(encodeURIComponent(affiliateId));
  }
  url = url.split("{gift_id}").join(encodeURIComponent(ctx.gift_id));
  if (ctx.target_url) {
    url = url.split("{target_url}").join(encodeURIComponent(ctx.target_url));
  }
  return url;
}
