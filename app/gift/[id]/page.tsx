import { createSupabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GiftOpeningClient from "./GiftOpeningClient";
import type { Gift } from "@/types";

interface Props {
  params: { id: string };
}

/**
 * Metadata dinamici per la pagina del singolo regalo. Quando il link
 * `begift.app/gift/{id}` viene condiviso su WhatsApp / Telegram /
 * Messenger / iMessage / Slack / Twitter / Facebook / LinkedIn, questi
 * tag vengono letti dai crawler e mostrati come "link preview" ricco.
 *
 * Struttura del titolo:
 *   "Un regalo per {recipient} 🎁" (se solo recipient)
 *   "Un regalo per {recipient} da {sender} 🎁" (se anche sender_alias)
 *
 * L'immagine preview viene generata dinamicamente dal file
 * `opengraph-image.tsx` accanto a questo (convenzione Next 14 App
 * Router) — mostra emoji + nomi su sfondo brand, così ogni regalo ha
 * la sua card di preview personalizzata senza asset statici.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createSupabaseServer();
  const { data: gift } = await supabase
    .from("gifts")
    .select("recipient_name, sender_alias, packaging")
    .eq("id", params.id)
    .single();

  const recipient = gift?.recipient_name ?? "te";
  const sender = (gift as { sender_alias?: string } | null)?.sender_alias;

  // Titolo: se abbiamo anche il sender, mostra "per X da Y"
  const title = sender
    ? `Un regalo per ${recipient} da ${sender} 🎁`
    : `Un regalo per ${recipient} 🎁`;

  const description = sender
    ? `${sender} ti ha mandato un regalo su BeGift. Aprilo ora!`
    : "Hai ricevuto un regalo digitale su BeGift. Aprilo ora!";

  const url = `/gift/${params.id}`;

  return {
    title: `${title} — BeGift`,
    description,
    // Open Graph: usato da Facebook, WhatsApp, Telegram, LinkedIn,
    // Messenger, iMessage, Slack, Discord, ecc.
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "BeGift",
      locale: "it_IT",
      // L'immagine è generata da opengraph-image.tsx (stesso folder),
      // Next la collega automaticamente alla route. Non serve URL esplicito.
    },
    // Twitter Card: usato da Twitter/X + alcuni client che non leggono OG
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    // Robots: non indicizzabile, i link sono privati
    robots: { index: false, follow: false },
  };
}

export default async function GiftPage({ params }: Props) {
  const supabase = createSupabaseServer();

  const { data: gift, error } = await supabase
    .from("gifts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !gift) notFound();

  return <GiftOpeningClient gift={gift as Gift} />;
}
