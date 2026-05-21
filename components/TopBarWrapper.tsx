"use client";
import { usePathname } from "next/navigation";
import TopBar from "./TopBar";

export default function TopBarWrapper() {
  const pathname = usePathname();
  // Nascondi su auth pages
  if (pathname.startsWith("/auth/")) return null;
  // Nascondi sulla pagina apertura cliente BeGift Business: deve essere
  // pulita, senza branding/navigation dell'app principale.
  if (pathname.startsWith("/g/")) return null;
  // Nascondi anche sulla dashboard business: l'area B2B ha il suo header
  // interno (BeGift Business / nome attivita') e non vogliamo che la
  // navigation del flusso personale (drafts, dashboard, settings)
  // sovrapponga al contesto business.
  if (pathname.startsWith("/business")) return null;
  return <TopBar/>;
}
