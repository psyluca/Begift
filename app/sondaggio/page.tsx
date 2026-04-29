/**
 * /sondaggio
 *
 * Sondaggio post-gift nativo BeGift. Sostituisce la dipendenza da
 * Tally (che richiedeva piano Pro o Zapier intermediario per il
 * webhook). Tutto interno: UI Next.js + submit diretto a
 * /api/survey/submit + storage in tabella `survey_responses`.
 *
 * Query params accettati:
 *  - gift={uuid}   → ID del gift che ha originato l'invito (passato
 *                    dal cron survey-invites nell'email link)
 *  - userId={uuid} → ID del creator (passato dal cron). Se assente,
 *                    proveremo a leggerlo dalla session loggata.
 *
 * No auth richiesta: l'utente puo' aprire dal link email senza essere
 * loggato sulla PWA. Se loggato, lo userId della session prevale.
 */

import SondaggioClient from "./SondaggioClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sondaggio post-gift — BeGift",
  description: "3 minuti per dirmi com'è andata. Le tue risposte vanno direttamente a Luca, founder di BeGift.",
  robots: { index: false, follow: false },
};

export default function SondaggioPage({
  searchParams,
}: {
  searchParams: { gift?: string; userId?: string };
}) {
  return (
    <SondaggioClient
      giftIdFromQuery={searchParams.gift ?? null}
      userIdFromQuery={searchParams.userId ?? null}
    />
  );
}
