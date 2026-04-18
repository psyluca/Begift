import { createSupabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GiftOpeningClient from "./GiftOpeningClient";
import type { Gift } from "@/types";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createSupabaseServer();
  const { data: gift } = await supabase
    .from("gifts")
    .select("recipient_name")
    .eq("id", params.id)
    .single();

  const name = gift?.recipient_name ?? "te";
  return {
    title: `Un regalo per ${name} 🎁 — BeGift`,
    description: "Hai ricevuto un regalo digitale. Aprilo ora!",
    openGraph: {
      title: `Un regalo per ${name} 🎁`,
      description: "Clicca per aprire il tuo regalo su BeGift",
      images: ["/og-gift.png"],
    },
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
