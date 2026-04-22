"use client";

/**
 * UsernameOnboarding
 *
 * Modal non-dismissable che appare al primo login di un utente
 * senza username impostato. Obbliga a scegliere uno handle univoco
 * prima di continuare ad usare l'app.
 *
 * Flow:
 *  1. Al mount: GET /api/profile/me → se username è NULL, mostra modal
 *  2. L'utente scrive → debounced (400ms) POST /api/profile/check-username
 *     → feedback verde/rosso inline
 *  3. Se disponibile e valido, il bottone "Conferma" si abilita
 *  4. Al submit: POST /api/profile/username → successo = nasconde modal
 *     + salva in window per riuso immediato dalla TopBar
 *
 * UX notes:
 *  - Suggerisce uno handle iniziale basato sull'email (es.
 *    marta.rossi@gmail.com → "marta_rossi"). L'utente può accettarlo
 *    o cambiarlo.
 *  - Disabilitato il click sul backdrop per chiudere — deve scegliere.
 *  - Mostra chiaramente le regole (3-20 char, solo lettere minuscole
 *    e numeri e _)
 *  - Emit 'begift:username-set' event al successo così altri
 *    componenti (TopBar) possono aggiornarsi senza reload
 */

import { useEffect, useRef, useState } from "react";
import { getSessionUser } from "@/lib/supabase/client";
import { fetchAuthed } from "@/lib/clientAuth";
import { normalizeHandle, validateUsername, validationMessageIt } from "@/lib/username";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const OK_GREEN = "#3B8C5A";
const ERR_RED = "#B71C1C";

type CheckState =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "unavailable"; reason: "taken" | "invalid" | "reserved" };

export function UsernameOnboarding() {
  const [show, setShow] = useState(false);
  const [handle, setHandle] = useState("");
  const [check, setCheck] = useState<CheckState>({ state: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const checkTimerRef = useRef<number | null>(null);
  const checkAbortRef = useRef<AbortController | null>(null);

  // 1. Mount: verifica se l'utente ha già uno username
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await getSessionUser();
      if (!u) return; // non loggato, niente modal
      try {
        const res = await fetchAuthed("/api/profile/me");
        if (!res.ok) return;
        const profile = await res.json();
        if (cancelled) return;
        if (!profile?.username) {
          // Suggerisci uno handle iniziale dall'email
          if (u.email) {
            const suggested = normalizeHandle(u.email.split("@")[0]);
            if (suggested.length >= 3) setHandle(suggested);
          }
          setShow(true);
        }
      } catch (e) {
        console.error("[UsernameOnboarding] profile fetch failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 2. Debounce check availability al cambio input
  useEffect(() => {
    if (!show) return;
    if (checkTimerRef.current) window.clearTimeout(checkTimerRef.current);
    if (checkAbortRef.current) checkAbortRef.current.abort();

    const v = validateUsername(handle);
    if (!v.ok) {
      setCheck({
        state: "unavailable",
        reason: v.reason === "reserved" ? "reserved" : "invalid",
      });
      return;
    }

    setCheck({ state: "checking" });
    const ac = new AbortController();
    checkAbortRef.current = ac;
    checkTimerRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/profile/check-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle }),
          signal: ac.signal,
        });
        const json = await res.json();
        if (json.available) {
          setCheck({ state: "available" });
        } else {
          setCheck({
            state: "unavailable",
            reason: (json.reason as "taken" | "invalid" | "reserved") ?? "invalid",
          });
        }
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        setCheck({ state: "idle" });
      }
    }, 400);
    return () => {
      if (checkTimerRef.current) window.clearTimeout(checkTimerRef.current);
      ac.abort();
    };
  }, [handle, show]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Forza normalizzazione immediata (rimuove spazi, maiuscole, ecc)
    const normalized = normalizeHandle(e.target.value);
    setHandle(normalized);
    setSubmitError(null);
  };

  const submit = async () => {
    if (check.state !== "available") return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetchAuthed("/api/profile/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "taken") {
          setSubmitError("Questo nome è stato appena preso. Prova un altro.");
          setCheck({ state: "unavailable", reason: "taken" });
        } else {
          setSubmitError("Errore nel salvataggio. Riprova.");
        }
        return;
      }
      // Successo: emetti evento + chiudi modal
      window.dispatchEvent(new CustomEvent("begift:username-set", { detail: { username: handle } }));
      setShow(false);
    } catch (e) {
      console.error("[UsernameOnboarding] submit failed", e);
      setSubmitError("Errore di rete. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  const hint = (() => {
    if (check.state === "checking") return { color: MUTED, text: "Controllo disponibilità…" };
    if (check.state === "available") return { color: OK_GREEN, text: `✓ @${handle} è libero!` };
    if (check.state === "unavailable") {
      if (check.reason === "taken") return { color: ERR_RED, text: `✗ @${handle} è già preso` };
      if (check.reason === "reserved") return { color: ERR_RED, text: "Questo nome è riservato" };
      return { color: ERR_RED, text: validationMessageIt(validateUsername(handle)) };
    }
    return { color: MUTED, text: "" };
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="username-onboarding-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10_000,
        background: "rgba(20, 10, 20, 0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 22,
          padding: "28px 24px",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          animation: "usernameOnboardIn .45s cubic-bezier(.34,1.56,.64,1) both",
        }}
      >
        <style>{`
          @keyframes usernameOnboardIn {
            from { opacity: 0; transform: translateY(24px) scale(.94); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 42, marginBottom: 8, lineHeight: 1 }}>👋</div>
          <h2 id="username-onboarding-title" style={{ fontSize: 22, fontWeight: 800, color: DEEP, margin: "0 0 6px" }}>
            Scegli il tuo nome utente
          </h2>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, margin: 0 }}>
            Sarà come ti identificano gli altri in BeGift.<br/>
            Solo lettere minuscole, numeri e <code style={{ background: "#f5f2ed", padding: "1px 5px", borderRadius: 4 }}>_</code>.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "2px solid #e0dbd5",
            borderRadius: 14,
            padding: "12px 14px",
            background: "#fafaf7",
            marginBottom: 8,
          }}
        >
          <span style={{ color: ACCENT, fontWeight: 800, fontSize: 17, marginRight: 4 }}>@</span>
          <input
            type="text"
            value={handle}
            onChange={onChange}
            placeholder="il_tuo_nome"
            autoFocus
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            maxLength={20}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 17,
              fontWeight: 700,
              color: DEEP,
              fontFamily: "inherit",
              minWidth: 0,
            }}
          />
          <span style={{ fontSize: 11, color: MUTED, marginLeft: 8, flexShrink: 0 }}>
            {handle.length}/20
          </span>
        </div>

        <div style={{ minHeight: 20, fontSize: 13, color: hint.color, fontWeight: 500, marginBottom: 16 }}>
          {hint.text}
        </div>

        {submitError && (
          <div style={{ fontSize: 12, color: ERR_RED, marginBottom: 12, lineHeight: 1.4 }}>
            {submitError}
          </div>
        )}

        <button
          onClick={submit}
          disabled={check.state !== "available" || submitting}
          style={{
            width: "100%",
            background: check.state === "available" && !submitting ? ACCENT : "#e0dbd5",
            color: "#fff",
            border: "none",
            borderRadius: 40,
            padding: "14px",
            fontSize: 15,
            fontWeight: 800,
            cursor: check.state === "available" && !submitting ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            transition: "background .15s",
          }}
        >
          {submitting ? "Salvataggio…" : "Conferma"}
        </button>

        <p style={{ fontSize: 11, color: "#bbb", textAlign: "center", margin: "14px 0 0", lineHeight: 1.5 }}>
          Potrai cambiarlo in qualsiasi momento<br/>dalle impostazioni del profilo.
        </p>
      </div>
    </div>
  );
}
