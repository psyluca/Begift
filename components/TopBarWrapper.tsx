"use client";
import { usePathname } from "next/navigation";
import TopBar from "./TopBar";

export default function TopBarWrapper() {
  const pathname = usePathname();
  // Nascondi su auth pages
  if (pathname.startsWith("/auth/")) return null;
  return <TopBar/>;
}
