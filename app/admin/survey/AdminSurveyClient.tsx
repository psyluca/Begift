"use client";

/**
 * AdminSurveyClient — pagina admin per consultare le risposte del
 * sondaggio post-gift.
 *
 * Layout:
 *  1. Header con back-link + titolo + count totale
 *  2. Big stat cards (avg rating, NPS, % "pagheresti", # voucher
 *     interest yes)
 *  3. Van Westendorp medie (4 punti chiave per pricing)
 *  4. Breakdown distribuzioni: would_pay, voucher_interest, top
 *     recipient types, top occasions
 *  5. Tabella risposte recenti (data, creator, recipient, rating,
 *     NPS, would_pay) — click su riga apre modale con tutto il
 *     payload risposta per riga
 *  6. Bottone "Export CSV" in cima per scaricare tutto e analizzare
 *     in Excel/Sheets
 */

import { useEffect, useState, useMemo } from "react";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const LIGHT = "#f7f5f2";
const BORDER = "#e8e4de";
const OK_GREEN = "#3B8C5A";
const WARN = "#D08F2A";

interface AnswersShape {
  recipient_type?: string;
  occasion?: string;
  experience_rating?: number;
  liked_most?: string;
  frustrated?: string;
  would_add?: string;
  recipient_feedback?: string;
  would_pay?: string;
  price_too_expensive?: number;
  price_expensive_but_worth?: number;
  price_good_deal?: number;
  price_too_cheap?: number;
  preferred_pricing?: string[];
  voucher_interest?: string;
  online_purchase_sites?: string[];
  reuse?: string;
  nps_score?: number;
  nps_reason?: string;
  age_range?: string;
  gender?: string;
  willing_to_call?: string;
  contact_email?: string;
}

interface ResponseRow {
  id: string;
  created_at: string;
  source: string | null;
  payload: { answers?: AnswersShape; formId?: string } | null;
  creator: { id: string; display_name: string | null; username: string | null; email: string | null } | null;
  gift: { id: string; recipient_name: string | null; template_type: string | null } | null;
}

interface SurveyData {
  stats: {
    total: number;
    avg_experience_rating: number;
    avg_nps: number;
    nps_score: number;
    would_pay_breakdown: Record<string, number>;
    voucher_interest_breakdown: Record<string, number>;
    van_westendorp: {
      n: number;
      too_expensive: number;
      expensive_but_worth: number;
      good_deal: number;
      too_cheap: number;
    };
    top_recipients: { type: string; count: number }[];
    top_occasions: { occasion: string; count: number }[];
  };
  responses: ResponseRow[];
}

const WOULD_PAY_LABELS: Record<string, string> = {
  yes_worth_it: "Sì, vale il prezzo",
  yes_low: "Sì, ma basso",
  maybe: "Forse",
  no_free: "Vorrei sempre gratis",
};

const VOUCHER_LABELS: Record<string, string> = {
  very_useful: "Sarebbe utilissimo",
  would_try: "Mi piacerebbe provarlo",
  not_for_me: "Non mi serve",
  never_thought: "Non avevo pensato",
};

export default function AdminSurveyClient() {
  const [data, setData] = useState<SurveyData | null>(null);
  const [state, setState] = useState<"loading" | "forbidden" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<ResponseRow | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuthed("/api/admin/survey");
        if (res.status === 403) { setState("forbidden"); return; }
        if (!res.ok) { setState("error"); setErrorMsg(`Errore ${res.status}`); return; }
        setData(await res.json());
      } catch (e) {
        console.error("[admin/survey] fetch failed", e);
        setState("error");
        setErrorMsg("Errore di rete");
      }
    })();
  }, []);

  const exportCsv = useMemo(() => () => {
    if (!data) return;
    const headers = [
      "id", "created_at", "source", "creator_username", "creator_email",
      "gift_recipient", "gift_template_type",
      "recipient_type", "occasion", "experience_rating", "liked_most", "frustrated",
      "would_add", "recipient_feedback", "would_pay",
      "price_too_expensive", "price_expensive_but_worth", "price_good_deal", "price_too_cheap",
      "preferred_pricing", "voucher_interest", "online_purchase_sites",
      "reuse", "nps_score", "nps_reason",
      "age_range", "gender", "willing_to_call", "contact_email",
    ];
    const escape = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = Array.isArray(v) ? v.join("; ") : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const rows = data.responses.map((r) => {
      const a = r.payload?.answers || {};
      return [
        r.id, r.created_at, r.source ?? "",
        r.creator?.username ?? "", r.creator?.email ?? "",
        r.gift?.recipient_name ?? "", r.gift?.template_type ?? "",
        a.recipient_type ?? "", a.occasion ?? "", a.experience_rating ?? "",
        a.liked_most ?? "", a.frustrated ?? "", a.would_add ?? "", a.recipient_feedback ?? "",
        a.would_pay ?? "",
        a.price_too_expensive ?? "", a.price_expensive_but_worth ?? "",
        a.price_good_deal ?? "", a.price_too_cheap ?? "",
        a.preferred_pricing ?? "", a.voucher_interest ?? "", a.online_purchase_sites ?? "",
        a.reuse ?? "", a.nps_score ?? "", a.nps_reason ?? "",
        a.age_range ?? "", a.gender ?? "", a.willing_to_call ?? "", a.contact_email ?? "",
      ].map(escape).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `begift-survey-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  if (state === "forbidden") {
    return (
      <main style={{ padding: 40, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 22, color: DEEP, marginBottom: 8 }}>Accesso negato</h1>
        <p style={{ color: MUTED, fontSize: 14 }}>Solo gli admin (ADMIN_EMAILS) possono vedere questa pagina.</p>
      </main>
    );
  }
  if (state === "error") {
    return (
      <main style={{ padding: 40, textAlign: "center", fontFamily: "system-ui, sans-serif", color: MUTED }}>
        {errorMsg ?? "Errore"}
      </main>
    );
  }
  if (!data) {
    return (
      <main style={{ padding: 40, textAlign: "center", fontFamily: "system-ui, sans-serif", color: MUTED }}>
        Caricamento risposte sondaggio…
      </main>
    );
  }

  const { stats, responses } = data;

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
        <a href="/admin/stats" style={{ color: MUTED, fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 12 }}>
          ← Admin
        </a>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: DEEP, margin: "0 0 4px" }}>
              📋 Risposte sondaggio
            </h1>
            <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
              {stats.total} risposte raccolte · post_gift_v1
            </p>
          </div>
          <button
            onClick={exportCsv}
            disabled={stats.total === 0}
            style={{
              background: stats.total === 0 ? "#e0dbd5" : DEEP,
              color: "#fff", border: "none", borderRadius: 30,
              padding: "9px 18px", fontSize: 13, fontWeight: 700,
              cursor: stats.total === 0 ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            ⬇ Export CSV
          </button>
        </div>

        {stats.total === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Stats card grandi ──────────────────────────── */}
            <SectionTitle>Numeri chiave</SectionTitle>
            <Grid>
              <StatCard label="Risposte totali" value={stats.total} emoji="📋"/>
              <StatCard
                label="Esperienza media"
                value={`${stats.avg_experience_rating.toFixed(1)}/5`}
                emoji="⭐"
                color={stats.avg_experience_rating >= 4 ? OK_GREEN : stats.avg_experience_rating >= 3 ? WARN : ACCENT}
              />
              <StatCard
                label="NPS score"
                value={`${stats.nps_score}`}
                emoji="📊"
                color={stats.nps_score >= 50 ? OK_GREEN : stats.nps_score >= 30 ? WARN : ACCENT}
                subtitle={`avg ${stats.avg_nps.toFixed(1)}/10`}
              />
              <StatCard
                label="Pagherebbero"
                value={`${pctWouldPay(stats.would_pay_breakdown)}%`}
                emoji="💰"
                color={pctWouldPay(stats.would_pay_breakdown) >= 50 ? OK_GREEN : WARN}
                subtitle="esclude 'sempre gratis'"
              />
            </Grid>

            {/* ── Van Westendorp ──────────────────────────────── */}
            {stats.van_westendorp.n > 0 && (
              <>
                <SectionTitle>Van Westendorp — Pricing (n={stats.van_westendorp.n})</SectionTitle>
                <Grid>
                  <StatCard label="Troppo caro" value={`${stats.van_westendorp.too_expensive.toFixed(1)} €`} emoji="🔴" subtitle="non lo userei"/>
                  <StatCard label="Caro ma vale" value={`${stats.van_westendorp.expensive_but_worth.toFixed(1)} €`} emoji="🟡"/>
                  <StatCard label="Buon affare" value={`${stats.van_westendorp.good_deal.toFixed(1)} €`} emoji="🟢"/>
                  <StatCard label="Troppo economico" value={`${stats.van_westendorp.too_cheap.toFixed(1)} €`} emoji="🔵" subtitle="dubito qualità"/>
                </Grid>
                <p style={{ fontSize: 12, color: MUTED, margin: "8px 0 0", lineHeight: 1.6 }}>
                  💡 <strong>Range pricing accettabile</strong>: tra "troppo economico" ({stats.van_westendorp.too_cheap.toFixed(1)} €) e "troppo caro" ({stats.van_westendorp.too_expensive.toFixed(1)} €). <strong>Pricing ottimale</strong>: vicino al "buon affare" ({stats.van_westendorp.good_deal.toFixed(1)} €).
                </p>
              </>
            )}

            {/* ── Distribuzioni ──────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 22 }}>
              <Distribution title="Would pay" items={stats.would_pay_breakdown} labels={WOULD_PAY_LABELS}/>
              <Distribution title="Voucher interest" items={stats.voucher_interest_breakdown} labels={VOUCHER_LABELS}/>
              <Distribution title="Top recipient" items={Object.fromEntries(stats.top_recipients.map((r) => [r.type, r.count]))}/>
              <Distribution title="Top occasions" items={Object.fromEntries(stats.top_occasions.map((o) => [o.occasion, o.count]))}/>
            </div>

            {/* ── Lista risposte ────────────────────────────── */}
            <SectionTitle>Risposte recenti</SectionTitle>
            <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: `1px solid ${BORDER}` }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#fafaf7", color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>
                    <th style={th}>Data</th>
                    <th style={th}>Creator</th>
                    <th style={th}>Per</th>
                    <th style={th}>Rating</th>
                    <th style={th}>NPS</th>
                    <th style={th}>Would pay</th>
                    <th style={th}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r) => {
                    const a = r.payload?.answers || {};
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setOpenRow(r)}
                        style={{ borderTop: `1px solid ${BORDER}`, cursor: "pointer" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#fafaf7"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                      >
                        <td style={td}>{formatDate(r.created_at)}</td>
                        <td style={td}>
                          {r.creator?.display_name || r.creator?.username || r.creator?.email || <span style={{ color: MUTED }}>anonimo</span>}
                        </td>
                        <td style={td}>{r.gift?.recipient_name ?? "—"}</td>
                        <td style={td}>{a.experience_rating ? `${a.experience_rating}/5` : "—"}</td>
                        <td style={td}>{typeof a.nps_score === "number" ? `${a.nps_score}/10` : "—"}</td>
                        <td style={td}>{a.would_pay ? (WOULD_PAY_LABELS[a.would_pay] || a.would_pay) : "—"}</td>
                        <td style={{ ...td, color: MUTED, fontSize: 11 }}>{r.source}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Modal dettaglio */}
        {openRow && <DetailModal row={openRow} onClose={() => setOpenRow(null)}/>}
      </div>
    </main>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function pctWouldPay(breakdown: Record<string, number>): number {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const yes = (breakdown.yes_worth_it ?? 0) + (breakdown.yes_low ?? 0) + (breakdown.maybe ?? 0);
  return Math.round((yes / total) * 100);
}

function formatDate(s: string): string {
  try {
    const d = new Date(s);
    return d.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return s; }
}

const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontWeight: 700 };
const td: React.CSSProperties = { padding: "10px 12px", color: DEEP };

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 13, fontWeight: 800, color: DEEP, margin: "26px 0 12px", textTransform: "uppercase", letterSpacing: ".07em" }}>
      {children}
    </h2>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>{children}</div>;
}

function StatCard({ label, value, emoji, subtitle, color = DEEP }: {
  label: string; value: number | string; emoji: string;
  subtitle?: string; color?: string;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: `1px solid ${BORDER}` }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginTop: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
      {subtitle && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function Distribution({ title, items, labels }: { title: string; items: Record<string, number>; labels?: Record<string, string> }) {
  const entries = Object.entries(items).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: `1px solid ${BORDER}` }}>
      <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>{title}</div>
      {entries.length === 0 ? (
        <div style={{ color: MUTED, fontSize: 13 }}>Nessuna risposta</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {entries.map(([key, count]) => {
            const label = labels?.[key] ?? key;
            const pct = (count / max) * 100;
            return (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: DEEP, marginBottom: 3 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{label}</span>
                  <span style={{ color: MUTED, fontWeight: 700 }}>{count}</span>
                </div>
                <div style={{ height: 6, background: "#f0ece8", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: ACCENT }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "40px 24px", textAlign: "center", border: `1px solid ${BORDER}` }}>
      <div style={{ fontSize: 44, marginBottom: 10 }} aria-hidden>📭</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: DEEP, margin: "0 0 6px" }}>Ancora nessuna risposta</h3>
      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: 0 }}>
        Il cron <code style={{ background: LIGHT, padding: "1px 5px", borderRadius: 4 }}>survey-invites</code> manda gli inviti 24-48h dopo che un destinatario apre un regalo.
        <br/>Aspetta che il primo creator compili il sondaggio — qui apparirà a colpo d'occhio.
      </p>
    </div>
  );
}

function DetailModal({ row, onClose }: { row: ResponseRow; onClose: () => void }) {
  const a = row.payload?.answers || {};
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16, padding: 24,
        maxWidth: 600, width: "100%", maxHeight: "85vh", overflowY: "auto",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: DEEP, margin: 0 }}>Risposta dettagliata</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 24, color: MUTED, cursor: "pointer", padding: 4, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>
          {formatDate(row.created_at)} · {row.source} · {row.creator?.email ?? "anonimo"}
        </div>

        <Field label="Per chi?" value={a.recipient_type}/>
        <Field label="Occasione" value={a.occasion}/>
        <Field label="Esperienza (1-5)" value={a.experience_rating}/>
        <Field label="Cos'è piaciuto" value={a.liked_most}/>
        <Field label="Cos'è frustrato" value={a.frustrated}/>
        <Field label="Cosa aggiungerebbe" value={a.would_add}/>
        <Field label="Cosa ha detto il destinatario" value={a.recipient_feedback}/>
        <Field label="Pagherebbe?" value={a.would_pay ? (WOULD_PAY_LABELS[a.would_pay] || a.would_pay) : null}/>
        {(a.price_too_expensive !== undefined || a.price_good_deal !== undefined) && (
          <div style={{ background: "#fff8ec", border: "1px solid #f0e0c0", borderRadius: 8, padding: "10px 12px", margin: "8px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 6, textTransform: "uppercase" }}>Van Westendorp</div>
            <div style={{ fontSize: 12, color: DEEP, lineHeight: 1.7 }}>
              Troppo caro: <strong>{a.price_too_expensive ?? "—"} €</strong> · Caro ma vale: <strong>{a.price_expensive_but_worth ?? "—"} €</strong> · Buon affare: <strong>{a.price_good_deal ?? "—"} €</strong> · Troppo economico: <strong>{a.price_too_cheap ?? "—"} €</strong>
            </div>
          </div>
        )}
        <Field label="Formula preferita" value={(a.preferred_pricing ?? []).join(", ")}/>
        <Field label="Voucher interest" value={a.voucher_interest ? (VOUCHER_LABELS[a.voucher_interest] || a.voucher_interest) : null}/>
        <Field label="Siti acquisto" value={(a.online_purchase_sites ?? []).join(", ")}/>
        <Field label="Riuserà?" value={a.reuse}/>
        <Field label="NPS (0-10)" value={a.nps_score}/>
        <Field label="Perché NPS" value={a.nps_reason}/>
        <Field label="Età" value={a.age_range}/>
        <Field label="Genere" value={a.gender}/>
        <Field label="Vuole colloquio?" value={a.willing_to_call}/>
        <Field label="Email contatto" value={a.contact_email}/>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: DEEP, lineHeight: 1.5 }}>{String(value)}</div>
    </div>
  );
}
