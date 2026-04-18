"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import BottomNav from "./BottomNav";

export default function BottomNavWrapper() {
  const pathname  = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [checked,  setChecked]  = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "begift-session",
        },
      }
    );
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user);
      setChecked(true);
    });
  }, []);

  if (!checked) return null;

  // Nascondi nav sulla pagina regalo solo se non loggato
  if (pathname.startsWith("/gift/") && !loggedIn) return null;
  // Nascondi nav sulla route sandbox /lab (esperienza immersiva in sviluppo)
  if (pathname.startsWith("/lab")) return null;

  return <BottomNav/>;
}
