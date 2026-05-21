/**
 * Dashboard BeGift Business — gated da feature flag + business_account active.
 *
 * Server component minimale: controlla feature flag, lascia che il
 * client component fetchi i dati con fetchAuthed (Bearer auth).
 *
 * Path: /business
 */

import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/featureFlags";
import BusinessDashboardClient from "./BusinessDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Business",
  description: "Gestisci i pacchi coupon per i tuoi clienti.",
  robots: { index: false, follow: false },
};

export default function BusinessDashboardPage() {
  if (!isFeatureEnabled("FEATURE_BUSINESS_DASHBOARD")) {
    notFound();
  }
  return <BusinessDashboardClient />;
}
