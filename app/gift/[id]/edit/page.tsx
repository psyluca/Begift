/**
 * /gift/[id]/edit
 *
 * Pagina di personalizzazione packaging per un gift gia' creato.
 * Pensata per il flusso post-draft-completion: l'utente crea il gift
 * dal parser email (packaging default) e poi atterra qui per scegliere
 * colori carta/fiocco/bow, tipo apertura e suono prima di condividere.
 *
 * Entry point server-thin. Tutto il lavoro reale e' in GiftEditClient.
 */

import GiftEditClient from "./GiftEditClient";

export const dynamic = "force-dynamic";

export default function GiftEditPage({
  params,
}: {
  params: { id: string };
}) {
  return <GiftEditClient giftId={params.id} />;
}
