import { createSupabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GiftShareClient from "./GiftShareClient";

/**
 * /gift/[id]/share — schermata di condivisione del regalo appena creato.
 *
 * Storia (2026-05-23): prima di questa route, dopo "Salva e condividi"
 * in /gift/[id]/edit (flusso parsing email) il mittente veniva
 * rediretto a /gift/[id] — cioe' direttamente alla pagina di apertura
 * regalo per il destinatario. Risultato: il mittente apriva il proprio
 * gift, vedeva l'animazione, ma non aveva accesso immediato ne' al link
 * copyable ne' al share-sheet WhatsApp/iMessage/etc.
 *
 * Questa pagina mostra:
 *  - URL completo del regalo (copy-to-clipboard)
 *  - Share button universale (Web Share API + fallback WhatsApp)
 *  - Link di anteprima ("vedi come lo riceve {nome}")
 *  - Shortcut per modificare il pacchetto, creare un altro regalo
 *
 * Stesso ruolo dello "step 6 result" di /create, ma per il flusso
 * parsing che non passa per /create.
 */
interface Props {
  params: { id: string };
}

export const metadata: Metadata = {
  title: "Condividi il regalo — BeGift",
  // Robots: la schermata e' privata (solo creator) — non indicizzabile.
  robots: { index: false, follow: false },
};

export default async function GiftSharePage({ params }: Props) {
  const supabase = createSupabaseServer();
  const { data: gift, error } = await supabase
    .from("gifts")
    .select("id, recipient_name, creator_id")
    .eq("id", params.id)
    .single();

  if (error || !gift) notFound();

  return (
    <GiftShareClient
      giftId={gift.id}
      recipientName={gift.recipient_name}
      creatorId={gift.creator_id}
    />
  );
}
