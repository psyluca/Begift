"use client";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "./BottomNav";

/**
 * Wrapper che nasconde la BottomNav sulla pagina di apertura regalo
 * per visitatori non loggati (esperienza immersiva, niente distrazioni
 * nav). In tutti gli altri casi mostra la BottomNav.
 *
 * Usa useAuth() (session sticky + refresh) invece di un client
 * Supabase ad-hoc con storageKey diverso — così loggedIn è coerente
 * con TopBar e il resto dell'app.
 */
export default function BottomNavWrapper() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading) return null;

  // Nascondi nav sulla pagina regalo solo se non loggato (immersiva)
  if (pathname.startsWith("/gift/") && !user) return null;

  return <BottomNav/>;
}
