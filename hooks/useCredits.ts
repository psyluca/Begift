"use client";

/**
 * useCredits — React hook per il Credit Wallet.
 *
 * Espone:
 *   - balance: saldo corrente
 *   - lifetimeEarned / lifetimeSpent: totali
 *   - transactions: ultime N righe del ledger
 *   - rules: elenco regole "Come guadagnare" (per la UI modale)
 *   - multiplier: moltiplicatore tier corrente (0 | 0.5 | 1 | 1.5)
 *   - loading / error
 *   - refresh(): forza un reload
 *   - spend({ amount, reason, metadata }): chiama API /api/credits/spend
 *
 * Usa Supabase realtime per ricevere nuove righe ledger in tempo reale
 * — il componente WalletToast (file separato) si sottoscrive allo
 * stesso event per mostrare "+N crediti".
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

export interface CreditRule {
  reason: string;
  base_value: number;
  description: string | null;
  cooldown_hours: number;
  once_per_pair: boolean;
  once_per_user: boolean;
  active: boolean;
}

export interface CreditLedgerRow {
  id: number;
  user_id: string;
  delta: number;
  reason: string;
  metadata: Record<string, unknown>;
  expires_at: string | null;
  created_at: string;
}

export interface UseCreditsResult {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  transactions: CreditLedgerRow[];
  rules: CreditRule[];
  multiplier: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  spend: (args: { amount: number; reason: string; metadata?: Record<string, unknown> }) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export function useCredits(userId: string | null, historyLimit = 20): UseCreditsResult {
  const [balance, setBalance] = useState(0);
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [lifetimeSpent, setLifetimeSpent] = useState(0);
  const [transactions, setTransactions] = useState<CreditLedgerRow[]>([]);
  const [rules, setRules] = useState<CreditRule[]>([]);
  const [multiplier, setMultiplier] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sb = createSupabaseClient();

      // Esegui in parallelo le 3 query. Promise.all per minimizzare round-trip.
      const [balanceRes, historyRes, rulesRes, multRes] = await Promise.all([
        sb.from("credit_balances").select("balance, lifetime_earned, lifetime_spent").eq("user_id", userId).maybeSingle(),
        sb.from("credit_ledger").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(historyLimit),
        sb.from("credit_rules").select("*").eq("active", true).order("base_value", { ascending: false }),
        sb.rpc("credit_multiplier", { p_user_id: userId }),
      ]);

      if (balanceRes.error) throw balanceRes.error;
      if (historyRes.error) throw historyRes.error;
      if (rulesRes.error)   throw rulesRes.error;
      if (multRes.error)    throw multRes.error;

      setBalance(balanceRes.data?.balance ?? 0);
      setLifetimeEarned(balanceRes.data?.lifetime_earned ?? 0);
      setLifetimeSpent(balanceRes.data?.lifetime_spent ?? 0);
      setTransactions((historyRes.data as CreditLedgerRow[]) ?? []);
      setRules((rulesRes.data as CreditRule[]) ?? []);
      setMultiplier(Number(multRes.data ?? 0));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId, historyLimit]);

  // Initial load + reload on user change
  useEffect(() => { load(); }, [load]);

  // Realtime subscription: quando arriva una nuova riga ledger per
  // l'utente corrente, ricarica. Usiamo reload (non merge locale) per
  // assicurare coerenza con balance view + multiplier.
  useEffect(() => {
    if (!userId) return;
    const sb = createSupabaseClient();
    const channel = sb
      .channel(`credit_ledger:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "credit_ledger",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Ricarica in background — non impostiamo loading a true per
          // evitare flash UI.
          load();
        }
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [userId, load]);

  const spend = useCallback<UseCreditsResult["spend"]>(async ({ amount, reason, metadata }) => {
    if (!userId) return { ok: false, error: "not_authenticated" };
    try {
      const res = await fetch("/api/credits/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason, metadata: metadata ?? {} }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error ?? `http_${res.status}` };
      }
      // Forza reload del balance (il realtime probabilmente arriverà
      // comunque ma meglio non affidarsi all'ordine degli eventi).
      await load();
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }, [userId, load]);

  return {
    balance,
    lifetimeEarned,
    lifetimeSpent,
    transactions,
    rules,
    multiplier,
    loading,
    error,
    refresh: load,
    spend,
  };
}
