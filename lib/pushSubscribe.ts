/**
 * pushSubscribe — helper riusabile per (ri)sottoscrivere il device
 * corrente alle web push e salvarlo in DB.
 *
 * Estratto da PushPermissionCard per essere chiamato anche da:
 *  - /settings/notifiche-test (recovery quando permesso=granted ma
 *    DB non ha subscription, classico drift dopo update iOS)
 *  - automatismi di self-healing al mount dell'app
 *
 * Comportamento:
 *  1. Se Notification.permission != "granted": non chiede di nuovo,
 *     ritorna { ok: false, reason: "permission" }. Il caller deve
 *     gestire il prompt esplicito.
 *  2. Registra/usa il service worker /sw.js
 *  3. Se esiste gia' una subscription PushManager attiva, la riusa
 *     (POST sempre per essere sicuri che il DB sia in sync)
 *  4. Altrimenti chiama subscribe() con la VAPID public key
 *  5. POST a /api/push/subscribe (idempotente lato server)
 *
 * Auth: usa il token Bearer dalla session Supabase corrente.
 */

import { createSupabaseClient } from "@/lib/supabase/client";

export type SubscribeResult =
  | { ok: true; created: boolean }
  | { ok: false; reason: "unsupported" | "permission" | "vapid" | "save_failed" | "subscribe_failed" | "auth"; detail?: string };

export async function ensurePushSubscription(): Promise<SubscribeResult> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "unsupported" };
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" };
  }
  if (Notification.permission !== "granted") {
    return { ok: false, reason: "permission" };
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    return { ok: false, reason: "vapid" };
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    // Aspetta che il SW sia "ready" — su iOS standalone PWA puo'
    // essere in fase install/activate al primo mount.
    await navigator.serviceWorker.ready;

    let sub = await registration.pushManager.getSubscription();
    let created = false;
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
      created = true;
    }

    // POST al backend (idempotente: l'endpoint fa upsert per endpoint).
    const sb = createSupabaseClient();
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      return { ok: false, reason: "auth" };
    }
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sub.toJSON()),
    });
    if (!res.ok) {
      return { ok: false, reason: "save_failed", detail: `HTTP ${res.status}` };
    }
    return { ok: true, created };
  } catch (e) {
    console.error("[pushSubscribe] failed", e);
    return { ok: false, reason: "subscribe_failed", detail: (e as Error)?.message };
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
