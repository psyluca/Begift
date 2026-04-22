"use client";

/**
 * PushPermissionCard
 *
 * Card discreta in dashboard che chiede all'utente loggato di abilitare
 * le notifiche OS (Web Push). Appare solo se:
 *  - L'utente è loggato
 *  - Il browser supporta Notification + ServiceWorker + PushManager
 *  - Il permesso è "default" (mai chiesto) — non spamma chi ha già
 *    negato; nascosta se granted (tutto a posto)
 *  - L'utente non l'ha dismissata manualmente (localStorage flag)
 *
 * Al click su "Attiva":
 *  1. Register del service worker /sw.js (idempotente)
 *  2. Notification.requestPermission() → user decide OS prompt
 *  3. Se granted: getSubscription + subscribe() con VAPID public key
 *  4. POST subscription a /api/push/subscribe
 *
 * iOS standalone PWA: la API Push è disponibile solo se installata
 * da Home (>= iOS 16.4). Se l'utente è su iOS Safari NON standalone,
 * il banner IOSInstallBanner copre quel caso (install first, poi
 * abilitare le push da installata).
 */

import { useEffect, useState } from "react";
import { createSupabaseClient, getSessionUser } from "@/lib/supabase/client";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const DISMISS_KEY = "begift_push_dismissed_at";
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 14; // 14 giorni

export function PushPermissionCard() {
  // "default" = mostra card di attivazione
  // "granted" = mostra mini-riga "notifiche attive + invia test"
  // "denied"  = nascosto
  // "hidden"  = dismissata, cooldown attivo
  const [mode, setMode] = useState<"default" | "granted" | "hidden">("hidden");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Supporto feature
      if (typeof window === "undefined") return;
      if (!("Notification" in window)) return;
      if (!("serviceWorker" in navigator)) return;
      if (!("PushManager" in window)) return;

      // Utente loggato (senza login niente sottoscrizione)
      const u = await getSessionUser();
      if (!u) return;
      setUserId(u.id);

      // Permesso denied → nascondi completamente
      if (Notification.permission === "denied") return;

      // Permesso granted → mini-riga con "invia test"
      if (Notification.permission === "granted") {
        setMode("granted");
        return;
      }

      // Permesso default: rispetta cooldown dismiss
      try {
        const raw = localStorage.getItem(DISMISS_KEY);
        if (raw) {
          const ts = parseInt(raw, 10);
          if (!isNaN(ts) && Date.now() - ts < DISMISS_COOLDOWN_MS) return;
        }
      } catch { /* ignore */ }
      setMode("default");
    })();
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch { /* ignore */ }
    setMode("hidden");
  };

  const sendTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const sb = createSupabaseClient();
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (res.ok && json.sent > 0) {
        setTestResult(`✓ Push inviata a ${json.sent} device — controlla le notifiche`);
      } else if (res.ok && json.sent === 0) {
        setTestResult("Nessun device trovato. Ricarica la pagina e riprova.");
      } else {
        setTestResult("Errore nell'invio. Riprova.");
      }
    } catch (e) {
      console.error("[PushPermissionCard] test push failed", e);
      setTestResult("Errore di rete. Riprova.");
    } finally {
      setTesting(false);
      // Auto-reset del messaggio dopo 5s
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const enable = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Register SW
      const registration = await navigator.serviceWorker.register("/sw.js");

      // 2. Chiedi permesso
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        if (perm === "denied") {
          setError("Permesso negato. Puoi abilitarlo nelle impostazioni del browser.");
        }
        setLoading(false);
        return;
      }

      // 3. Sottoscrivi al push service
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError("Configurazione push non completata.");
        setLoading(false);
        return;
      }
      // applicationServerKey accetta Uint8Array, ma i typings di
      // TypeScript lib.dom lo dichiarano come BufferSource — cast
      // necessario per evitare error sul tipo ArrayBufferLike.
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      // 4. Invia al server
      const sb = createSupabaseClient();
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        setError("Salvataggio fallito. Riprova più tardi.");
        setLoading(false);
        return;
      }

      // Successo: passa al mode granted (mostra mini-riga con test)
      setMode("granted");
    } catch (e) {
      console.error("[PushPermissionCard] enable failed", e);
      setError("Si è verificato un errore. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "hidden") return null;

  // Mode granted: mini-riga compatta con "Notifiche attive + Invia test"
  if (mode === "granted") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          background: "#fff",
          border: "1px solid #e0dbd5",
          borderRadius: 14,
          padding: "9px 14px",
          margin: "0 0 12px",
          fontSize: 12,
          color: MUTED,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>🔔</span>
          <span style={{ color: "#3B8C5A", fontWeight: 600 }}>Notifiche attive</span>
          {testResult && (
            <span style={{ color: testResult.startsWith("✓") ? "#3B8C5A" : "#B71C1C", fontSize: 11, marginLeft: 6 }}>
              — {testResult}
            </span>
          )}
        </span>
        <button
          onClick={sendTest}
          disabled={testing}
          style={{
            background: "transparent",
            color: ACCENT,
            border: `1px solid ${ACCENT}`,
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 11,
            fontWeight: 700,
            cursor: testing ? "wait" : "pointer",
            opacity: testing ? 0.6 : 1,
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          {testing ? "…" : "Invia test"}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #fff5f8, #ffeef4)",
        border: "1px solid #f9c8d9",
        borderRadius: 18,
        padding: "18px 20px",
        margin: "0 0 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>🔔</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ fontSize: 15, fontWeight: 800, color: DEEP, margin: "0 0 4px" }}>
          Attiva le notifiche
        </h4>
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.45, margin: "0 0 12px" }}>
          Ricevi un avviso quando qualcuno ti manda un regalo, anche ad app chiusa — come su WhatsApp.
        </p>
        {error && (
          <p style={{ fontSize: 12, color: "#B71C1C", margin: "0 0 10px", lineHeight: 1.4 }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={enable}
            disabled={loading}
            style={{
              background: ACCENT,
              color: "#fff",
              border: "none",
              borderRadius: 30,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {loading ? "Attendi…" : "Attiva"}
          </button>
          <button
            onClick={dismiss}
            style={{
              background: "transparent",
              color: MUTED,
              border: "none",
              padding: "9px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Non ora
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Converte la VAPID public key base64url in Uint8Array come
 * richiesto da PushManager.subscribe applicationServerKey.
 */
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
