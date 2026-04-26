import type { Metadata } from "next";
import { ParentLetterCreateClient } from "@/components/ParentLetterCreateClient";
import { FATHER_TEMPLATE } from "@/lib/parent-templates";

export const metadata: Metadata = {
  title: "Crea il regalo Festa del Papà — BeGift",
  description: "5 domande emotive per costruire la tua Lettera che cresce. Pronta in 3 minuti, gratis.",
  alternates: { canonical: "/festa-papa/crea" },
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default function FestaPapaCreatePage() {
  return <ParentLetterCreateClient config={FATHER_TEMPLATE} />;
}
