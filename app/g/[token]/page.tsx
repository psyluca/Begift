/**
 * Pagina apertura cliente BeGift Business — /g/[token]
 *
 * Pubblica (no auth). NO topbar/bottomnav/footer globali (gating in
 * components/TopBarWrapper etc. su pathname.startsWith("/g/")).
 *
 * Layout pulito: animazione apertura + messaggio + coupon visibile +
 * bottone "Scarica il coupon" + reazioni emoji + footer minimo
 * "impacchettato da BeGift".
 *
 * Server component: prende token e renderizza il client component
 * che fa il fetch dei dati. Niente metadata pesanti — il pacco e'
 * privato, non indicizzabile.
 */

import { notFound } from "next/navigation";
import OpenPackClient from "./OpenPackClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hai ricevuto un regalo",
  robots: { index: false, follow: false },
};

export default function OpenPackPage({
  params,
}: {
  params: { token: string };
}) {
  if (!params.token || params.token.length < 10 || params.token.length > 32) {
    notFound();
  }
  return <OpenPackClient token={params.token} />;
}
