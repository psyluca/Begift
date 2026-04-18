"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Reaction } from "@/types";

/**
 * Ascolta in realtime le nuove reazioni ai regali del creatore.
 * onNew viene chiamata ogni volta che arriva una nuova reazione.
 */
export function useRealtimeReactions(onNew: (r: Reaction) => void) {
  useEffect(() => {
    const channel = supabase
      .channel("reactions-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions" },
        (payload: any) => onNew(payload.new as Reaction)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNew]);
}
