"use client";
import { usePathname } from "next/navigation";
import TopBar from "./TopBar";

export default function TopBarWrapper() {
  const pathname = usePathname();
  // Nascondi su auth pages e sulla route sandbox /lab (esperienza immersiva in sviluppo)
  if (pathname.startsWith("/auth/")) return null;
  if (pathname.startsWith("/lab")) return null;
  return <TopBar/>;
}
