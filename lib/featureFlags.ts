/**
 * Feature flag system per BeGift.
 *
 * Principi:
 * 1. Flags sono booleani controllati da env var `NEXT_PUBLIC_ENABLE_<NAME>`.
 * 2. Default sempre `false` — una feature nuova NON è visibile finché non la attivi
 *    esplicitamente. Questo protegge la produzione da rollout accidentali.
 * 3. `NEXT_PUBLIC_` prefix significa che il valore viene esposto al client (lo
 *    serve Next.js a build time). Quindi sia componenti server che client
 *    possono leggere gli stessi flag senza duplicazione.
 * 4. Il mapping env→boolean riconosce `"true"` / `"1"` / `"yes"` come true;
 *    qualsiasi altro valore (inclusi `undefined`) è false. Tolleranza a
 *    errori di battitura.
 *
 * Uso lato client:
 *   const enabled = useFeatureFlag("ENABLE_SOCIAL_LOGIN");
 *   if (enabled) return <GoogleButton />;
 *
 * Uso lato server / Route Handler:
 *   import { isFeatureEnabled } from "@/lib/featureFlags";
 *   if (!isFeatureEnabled("ENABLE_SOCIAL_LOGIN")) return notFound();
 */

export type FeatureFlagName =
  | "ENABLE_SOCIAL_LOGIN"       // Bottoni Google (+ eventuali altri provider) sulla login page
  | "ENABLE_3D_EXPERIENCE"      // Scena 3D in produzione (fallback automatico a 2D se off o device non supportato)
  | "ENABLE_TIERS"              // UI + backend per Free/LowCost/Pro tier
  | "ENABLE_CREDITS_WALLET"     // Wallet di crediti (sezione 11 del MARKET_ROADMAP)
  | "ENABLE_GIFT_CHAIN";        // CTA "ringrazia con un regalo" dopo l'apertura

/**
 * Reads a flag synchronously. Works in both client and server components
 * because `NEXT_PUBLIC_` env vars are inlined at build time.
 *
 * Returns `false` when the env var is missing, malformed, or explicitly
 * set to a non-truthy value. Never throws.
 */
export function isFeatureEnabled(name: FeatureFlagName): boolean {
  const raw = process.env[`NEXT_PUBLIC_${name}`];
  if (!raw) return false;
  const normalised = raw.trim().toLowerCase();
  return normalised === "true" || normalised === "1" || normalised === "yes";
}

/**
 * Hook React per client components — semplice wrapper di isFeatureEnabled
 * che espone un'API conforme alle convenzioni hook (future-proof se
 * volessimo aggiungere logica dinamica tipo feature toggle lato utente).
 *
 * Al momento è stateless (i flag sono build-time) ma la forma è già
 * pronta per evolvere a un useState + subscribe quando serviranno
 * override runtime (es. admin che attiva una feature per sé senza redeploy).
 */
export function useFeatureFlag(name: FeatureFlagName): boolean {
  return isFeatureEnabled(name);
}

/**
 * Leggi tutti i flag in un colpo (utile per pagine di debug / status).
 * Non chiamarlo in produzione in hot paths — itera su una lista costante
 * ma è una micro-ottimizzazione evitabile.
 */
export function getAllFlags(): Record<FeatureFlagName, boolean> {
  const names: FeatureFlagName[] = [
    "ENABLE_SOCIAL_LOGIN",
    "ENABLE_3D_EXPERIENCE",
    "ENABLE_TIERS",
    "ENABLE_CREDITS_WALLET",
    "ENABLE_GIFT_CHAIN",
  ];
  const out = {} as Record<FeatureFlagName, boolean>;
  names.forEach((n) => { out[n] = isFeatureEnabled(n); });
  return out;
}
