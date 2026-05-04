import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "Chi sono — Luca Galli, founder di BeGift",
  description:
    "BeGift è un servizio italiano gratuito per regali digitali emozionali, costruito da Luca Galli, psicoterapeuta a Lucca. Nessun pagamento, nessuna app. Se hai dubbi, scrivimi direttamente.",
  alternates: { canonical: "/chi-siamo" },
  openGraph: {
    title: "Chi sono — BeGift",
    description: "BeGift è un servizio italiano gratuito di Luca Galli, psicoterapeuta a Lucca.",
    url: "/chi-siamo",
    type: "website",
    locale: "it_IT",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
