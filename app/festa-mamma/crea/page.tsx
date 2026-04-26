import type { Metadata } from "next";
import FestaMammaCreateClient from "./FestaMammaCreateClient";

export const metadata: Metadata = {
  title: "Crea il regalo Festa della Mamma — BeGift",
  description: "5 domande emotive per costruire la tua Lettera che cresce. Pronta in 3 minuti, gratis.",
  alternates: { canonical: "/festa-mamma/crea" },
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default function FestaMammaCreatePage() {
  return <FestaMammaCreateClient />;
}
