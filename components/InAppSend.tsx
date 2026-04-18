"use client";
import { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888";

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
}

export default function InAppSend({ giftId }: { giftId: string }) {
  const { t } = useI18n();
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [sent,    setSent]    = useState<string[]>([]);
  const [sentProfiles, setSentProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const search = (q: string) => {
    setQuery(q);
    clearTimeout(timer.current);
    if (q.length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      const res  = await fetch(`/api/users?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setLoading(false);
    }, 350);
  };

  const sendTo = async (profile: Profile) => {
    setSending(profile.id);
    await fetch("/api/gifts/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giftId, recipientId: profile.id }),
    });
    setSent(prev => [...prev, profile.id]);
    setSentProfiles(prev => [...prev, profile]);
    setSending(null);
    setResults([]);
    setQuery("");
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 8px" }}>
        {t("share.send_inapp_title")}
      </p>

      {sent.length > 0 && (
        <div style={{ background: "#f0faf5", border: "1px solid #b2dfce", borderRadius: 12, padding: "10px 14px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: sentProfiles.length > 0 ? 10 : 0 }}>
            <span style={{ fontSize: 18 }}>🎉</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a7a4a" }}>
              {t("share.send_inapp_sent_to", { count: String(sent.length), label: sent.length === 1 ? t("share.send_inapp_person") : t("share.send_inapp_people") })}
            </span>
          </div>
          {sentProfiles.map(p => {
            const name = p.display_name || p.email.split("@")[0];
            const giftUrl = `${typeof window !== "undefined" ? window.location.origin : "https://begift.app"}/gift/${giftId}`;
            const msg = encodeURIComponent(t("share.whatsapp_notify", { name, url: giftUrl }));
            return (
              <a key={p.id} href={`https://wa.me/?text=${msg}`} target="_blank" style={{ display: "flex", alignItems: "center", gap: 8, background: "#25D366", color: "#fff", borderRadius: 20, padding: "8px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none", marginTop: 6 }}>
                {t("share.whatsapp_notify_btn", { name })}
              </a>
            );
          })}
        </div>
      )}

      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder={t("share.send_inapp_search")}
          value={query}
          onChange={e => search(e.target.value)}
          style={{
            width: "100%", padding: "12px 15px", fontSize: 14,
            border: "1.5px solid #e0dbd5", borderRadius: 12,
            outline: "none", boxSizing: "border-box",
            background: "#fff", color: DEEP, fontFamily: "inherit",
          }}
        />
        {loading && (
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: MUTED, fontSize: 12 }}>
            …
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e0dbd5", borderRadius: 12, marginTop: 4, overflow: "hidden", boxShadow: "0 4px 16px #0000000a" }}>
          {results.map(p => {
            const wasSent = sent.includes(p.id);
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: "1px solid #f0ece8" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                  {(p.display_name || p.email)[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: DEEP, fontSize: 14 }}>{p.display_name || p.email}</div>
                  {p.display_name && <div style={{ fontSize: 12, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email}</div>}
                </div>
                <button
                  onClick={() => sendTo(p)}
                  disabled={!!sending || wasSent}
                  style={{
                    background: wasSent ? "#3CB371" : ACCENT,
                    color: "#fff", border: "none", borderRadius: 20,
                    padding: "7px 16px", fontSize: 12, fontWeight: 700,
                    cursor: wasSent || sending ? "default" : "pointer",
                    flexShrink: 0, transition: "background .2s",
                  }}
                >
                  {wasSent ? t("share.send_inapp_sent") : sending === p.id ? "…" : t("share.send_inapp_send")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !loading && (
        <p style={{ fontSize: 13, color: MUTED, margin: "8px 0 0", textAlign: "center" }}>
          {t("share.send_inapp_no_results", { query })}
        </p>
      )}
    </div>
  );
}
