"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { fetchAuthed } from "@/lib/clientAuth";
import { normalizeHandle, validateUsername } from "@/lib/username";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const LIGHT = "#f7f5f2";
const OK_GREEN = "#3B8C5A";
const ERR_RED = "#B71C1C";

type CheckState =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "unavailable"; reason: "taken" | "invalid" | "reserved" };

export default function SettingsProfileClient() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [currentHandle, setCurrentHandle] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [check, setCheck] = useState<CheckState>({ state: "idle" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkTimerRef = useRef<number | null>(null);
  const checkAbortRef = useRef<AbortController | null>(null);

  // Load profile
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuthed("/api/profile/me");
        if (res.ok) {
          const p = await res.json();
          if (p?.username) {
            setCurrentHandle(p.username);
            setHandle(p.username);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Debounce validity check
  useEffect(() => {
    if (loading) return;
    if (handle === currentHandle) {
      setCheck({ state: "idle" });
      return;
    }
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
  }, [handle, currentHandle, loading]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHandle(normalizeHandle(e.target.value));
    setError(null);
    setSaved(false);
  };

  const save = async () => {
    if (check.state !== "available") return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetchAuthed("/api/profile/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error === "taken" ? t("settings_profile.err_taken") : t("settings_profile.err_save_failed"));
        return;
      }
      setCurrentHandle(handle);
      setSaved(true);
      window.dispatchEvent(new CustomEvent("begift:username-set", { detail: { username: handle } }));
    } catch (e) {
      console.error("[settings/profile] save failed", e);
      setError(t("settings_profile.err_net"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: LIGHT, padding: 24, textAlign: "center", color: MUTED, fontFamily: "system-ui, sans-serif" }}>
        {t("settings_profile.loading")}
      </main>
    );
  }

  const hint = (() => {
    if (handle === currentHandle) return { color: MUTED, text: "" };
    if (check.state === "checking") return { color: MUTED, text: t("username_onboarding.hint_checking") };
    if (check.state === "available") return { color: OK_GREEN, text: t("username_onboarding.hint_available", { handle }) };
    if (check.state === "unavailable") {
      if (check.reason === "taken") return { color: ERR_RED, text: t("username_onboarding.hint_taken", { handle }) };
      if (check.reason === "reserved") return { color: ERR_RED, text: t("username_onboarding.hint_reserved") };
      const v = validateUsername(handle);
      if (v.ok) return { color: ERR_RED, text: "" };
      const keyMap: Record<string, string> = {
        empty: "username_onboarding.val_empty",
        too_short: "username_onboarding.val_too_short",
        too_long: "username_onboarding.val_too_long",
        invalid_chars: "username_onboarding.val_invalid_chars",
        reserved: "username_onboarding.val_reserved",
      };
      return { color: ERR_RED, text: t(keyMap[v.reason]) };
    }
    return { color: MUTED, text: "" };
  })();

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "32px 24px" }}>
        <a href="/dashboard" style={{ color: MUTED, fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
          {t("settings_profile.back_dashboard")}
        </a>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: DEEP, margin: "0 0 8px" }}>{t("settings_profile.title")}</h1>
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 24px", lineHeight: 1.5 }}>
          {t("settings_profile.desc_before_code")} <code style={{ background: "#fff", padding: "1px 5px", borderRadius: 4, border: "1px solid #e0dbd5" }}>_</code>.
        </p>

        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
          <label style={{ fontSize: 12, color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 8 }}>
            {t("settings_profile.username_label")}
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "2px solid #e0dbd5",
              borderRadius: 12,
              padding: "11px 14px",
              background: "#fafaf7",
            }}
          >
            <span style={{ color: ACCENT, fontWeight: 800, fontSize: 16, marginRight: 4 }}>@</span>
            <input
              type="text"
              value={handle}
              onChange={onChange}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              maxLength={20}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 16,
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

          <div style={{ minHeight: 20, fontSize: 13, color: hint.color, fontWeight: 500, marginTop: 8 }}>
            {hint.text}
          </div>

          {error && (
            <div style={{ fontSize: 12, color: ERR_RED, marginTop: 6, lineHeight: 1.4 }}>
              {error}
            </div>
          )}
          {saved && (
            <div style={{ fontSize: 13, color: OK_GREEN, marginTop: 6, fontWeight: 600 }}>
              {t("settings_profile.saved")}
            </div>
          )}

          <button
            onClick={save}
            disabled={check.state !== "available" || saving || handle === currentHandle}
            style={{
              marginTop: 16,
              width: "100%",
              background: check.state === "available" && !saving && handle !== currentHandle ? ACCENT : "#e0dbd5",
              color: "#fff",
              border: "none",
              borderRadius: 40,
              padding: "13px",
              fontSize: 14,
              fontWeight: 800,
              cursor: check.state === "available" && !saving && handle !== currentHandle ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}
          >
            {saving ? t("settings_profile.saving") : handle === currentHandle ? t("settings_profile.no_changes") : t("settings_profile.save")}
          </button>

          {currentHandle && handle !== currentHandle && (
            <p style={{ fontSize: 11, color: MUTED, textAlign: "center", margin: "12px 0 0", lineHeight: 1.5 }}>
              {t("settings_profile.change_warning_before")} <strong>@{currentHandle}</strong> {t("settings_profile.change_warning_after")}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
