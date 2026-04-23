"use client";

import { useEffect, useState } from "react";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const LIGHT = "#f7f5f2";
const BORDER = "#e8e4de";
const ERR_RED = "#B71C1C";
const OK_GREEN = "#3B8C5A";

interface ReportRow {
  id: string;
  gift_id: string;
  reporter_user_id: string | null;
  category: string;
  description: string | null;
  reporter_ip: string | null;
  reporter_ua: string | null;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  gifts: {
    id: string;
    recipient_name: string;
    sender_alias: string | null;
    content_type: string | null;
    creator_id: string;
    created_at: string;
  } | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  illegal: "⚠️ Illegale",
  disturbing: "😰 Disturbante",
  privacy: "🔒 Privacy",
  copyright: "©️ Copyright",
  spam: "🗑️ Spam",
  other: "❓ Altro",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#D4537E",
  reviewing: "#E8A020",
  resolved: OK_GREEN,
  dismissed: MUTED,
};

export default function AdminReportsClient() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "reviewing" | "resolved" | "dismissed">("pending");

  const load = async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/admin/reports" : `/api/admin/reports?status=${filter}`;
      const res = await fetchAuthed(url);
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (res.ok) setReports(await res.json());
    } catch (e) {
      console.error("[admin/reports] load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const updateReport = async (id: string, status: string, deleteGift = false, notes?: string) => {
    if (deleteGift && !confirm("Eliminare DEFINITIVAMENTE il regalo associato? L'azione non è reversibile.")) return;
    try {
      const res = await fetchAuthed("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, delete_gift: deleteGift, admin_notes: notes }),
      });
      if (res.ok) await load();
    } catch (e) {
      console.error("[admin/reports] update failed", e);
    }
  };

  if (forbidden) {
    return (
      <main style={{ padding: 40, textAlign: "center", fontFamily: "system-ui, sans-serif", color: MUTED }}>
        🔒 Accesso riservato agli admin
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 80px" }}>
        <a href="/admin/stats" style={{ color: MUTED, fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 12 }}>
          ← Admin
        </a>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: DEEP, margin: "0 0 6px" }}>
          ⚠️ Segnalazioni
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 22px" }}>
          Moderazione contenuti segnalati dagli utenti. DSA art. 16 notice-and-action.
        </p>

        {/* Filtri */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {(["pending", "reviewing", "resolved", "dismissed", "all"] as const).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: active ? ACCENT : "#fff",
                  color: active ? "#fff" : DEEP,
                  border: `1.5px solid ${active ? ACCENT : BORDER}`,
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {f === "all" ? "Tutte" : f}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ color: MUTED, fontSize: 14, textAlign: "center", padding: 40 }}>Caricamento…</div>
        ) : reports.length === 0 ? (
          <div style={{ color: MUTED, fontSize: 14, textAlign: "center", padding: 40 }}>
            Nessuna segnalazione {filter !== "all" && `"${filter}"`}. 🎉
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reports.map((r) => (
              <div
                key={r.id}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  border: `1px solid ${BORDER}`,
                  padding: "14px 16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: DEEP }}>
                        {CATEGORY_LABELS[r.category] || r.category}
                      </span>
                      <span style={{
                        background: STATUS_COLORS[r.status] + "22",
                        color: STATUS_COLORS[r.status],
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}>
                        {r.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: MUTED }}>
                      {new Date(r.created_at).toLocaleString("it-IT")}
                      {r.reporter_ip && <> · IP: <code style={{ fontSize: 10 }}>{r.reporter_ip}</code></>}
                      {!r.reporter_user_id && <> · <em>anonimo</em></>}
                    </div>
                  </div>
                  <a
                    href={`/gift/${r.gift_id}?preview=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "transparent",
                      color: ACCENT,
                      border: `1.5px solid ${ACCENT}`,
                      borderRadius: 18,
                      padding: "5px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Apri regalo ↗
                  </a>
                </div>

                {r.gifts && (
                  <div style={{ background: LIGHT, borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: MUTED }}>
                    <div><strong style={{ color: DEEP }}>Regalo:</strong> {r.gifts.content_type} · per {r.gifts.recipient_name}
                      {r.gifts.sender_alias && <> · da {r.gifts.sender_alias}</>}</div>
                    <div style={{ fontSize: 10, marginTop: 2 }}>
                      Creato il {new Date(r.gifts.created_at).toLocaleDateString("it-IT")} · creator: <code style={{ fontSize: 10 }}>{r.gifts.creator_id.slice(0, 8)}…</code>
                    </div>
                  </div>
                )}

                {r.description && (
                  <div style={{ background: "#fffae8", border: "1px solid #f4e5a8", borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 13, color: "#5a4a00", lineHeight: 1.45 }}>
                    <strong>Dettagli:</strong> {r.description}
                  </div>
                )}

                {r.admin_notes && (
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 10, fontStyle: "italic" }}>
                    <strong>Note admin:</strong> {r.admin_notes}
                  </div>
                )}

                {(r.status === "pending" || r.status === "reviewing") && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {r.status === "pending" && (
                      <button
                        onClick={() => updateReport(r.id, "reviewing")}
                        style={{ background: "#fff", border: `1.5px solid ${BORDER}`, borderRadius: 20, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: DEEP }}
                      >
                        Prendi in carico
                      </button>
                    )}
                    <button
                      onClick={() => updateReport(r.id, "resolved", true)}
                      style={{ background: ERR_RED, color: "#fff", border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Elimina regalo + resolve
                    </button>
                    <button
                      onClick={() => updateReport(r.id, "resolved")}
                      style={{ background: OK_GREEN, color: "#fff", border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Resolve (tieni regalo)
                    </button>
                    <button
                      onClick={() => updateReport(r.id, "dismissed")}
                      style={{ background: "transparent", color: MUTED, border: `1.5px solid ${BORDER}`, borderRadius: 20, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
