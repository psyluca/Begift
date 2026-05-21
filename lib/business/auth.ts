/**
 * Helper di auth per il modulo BeGift Business.
 *
 * Resolve il business_account dell'utente loggato. Restituisce null se:
 *   - utente non loggato
 *   - utente loggato senza business_account
 *   - business_account in stato 'pending' | 'suspended' | 'archived'
 *
 * Usa il pattern Bearer + cookie fallback già consolidato nel resto degli
 * endpoint (vedi /api/drafts, /api/settings/*).
 */

import { NextRequest } from "next/server";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import type { BusinessAccount } from "@/types";

export interface BusinessSessionInfo {
  userId: string;
  business: BusinessAccount;
}

/** Risolve user_id da Bearer token o cookies di sessione. */
export async function resolveUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data } = await admin.auth.getUser(token);
    if (data.user) return data.user.id;
  }
  try {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    if (data.user) return data.user.id;
  } catch {
    /* niente cookies, OK procediamo */
  }
  return null;
}

/**
 * Risolve il business_account attivo dell'utente.
 * Ritorna null se l'utente non e' loggato, non ha business_account, o il
 * suo business_account non e' in stato 'active'.
 */
export async function getBusinessForRequest(
  req: NextRequest
): Promise<BusinessSessionInfo | null> {
  const userId = await resolveUserId(req);
  if (!userId) return null;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("business_accounts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.status !== "active") return null;

  return {
    userId,
    business: data as BusinessAccount,
  };
}

/**
 * Genera un token URL-safe per la pagina di apertura /g/[token].
 *  - 20 char base32 (no I/O/0/1 per evitare confusione), spazio ~10^28
 *  - non-enumerable: ogni gift ne ha uno unico, non si puo' guessing
 *  - separato dall'UUID interno (i pacchi business hanno entrambi:
 *    gifts.id per uso server, gifts.open_token per uso pubblico)
 */
export function generateOpenToken(): string {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
  const bytes = new Uint8Array(20);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 20; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let token = "";
  for (let i = 0; i < 20; i++) {
    token += alphabet[bytes[i] % alphabet.length];
  }
  return token;
}
