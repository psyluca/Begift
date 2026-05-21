import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/featureFlags";
import NewPackClient from "./NewPackClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nuovo pacco coupon",
  robots: { index: false, follow: false },
};

export default function NewPackPage() {
  if (!isFeatureEnabled("FEATURE_BUSINESS_DASHBOARD")) {
    notFound();
  }
  return <NewPackClient />;
}
