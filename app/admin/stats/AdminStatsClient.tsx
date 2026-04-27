"use client";

import { useEffect, useState } from "react";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const LIGHT = "#f7f5f2";
const OK_GREEN = "#3B8C5A";

interface StatsData {
  totals: {
    gifts_created: number;
    gifts_opened: number;
    opening_rate: number;
    users_total: number;
    reactions_total: number;
    push_subs: number;
    scheduled_future: number;
  };
  activity_7d: {
    users_active: number;
    gifts_created: number;
    gifts_opened: number;
  };
  activity_24h?: {
    gifts_created: number;
    gifts_opened: number;
    new_users: number;
    gifts_created_vs_yesterday_pct: number | null;
  };
  health?: {
    reports_open: number;
    reports_24h: number;
    funnel_signup_to_first_gift_7d: {
      new_users: number;
      with_first_gift: number;
      rate: number;
    };
  };
  trend_30d: { date: string; created: number; opened: number; new_users: number }[];
  content_types: { type: string; count: number }[];
  tiers: { tier: string; count: number }[];
  top_creators: { id: string; email: string | null; username: string | null; count: number }[];
}

export default function AdminStatsClient() {
  const [data, setData] = useState<StatsData | null>(null);
  const [state, setState] = useState<"loading" | "forbidden" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuthed("/api/admin/stats");
        if (res.status === 403) {
          setState("forbidden");
          return;
        }
        if (!res.ok) {
          setState("error");
          setErrorMsg(`Errore ${res.status} nel caricamento`);
          return;
        }
        setData(await res.json());
        setState("loading"); // sta per passare a dashboard via data
      } catch (e) {
        console.error("[admin/stats] fetch failed", e);
        setState("error");
        setErrorMsg("Errore di rete");
      }
    })();
  }, []);

  // Forbidden → diagnostica (non sei admin o non sei loggato)
  if (state === "forbidden") {
    return <ForbiddenDiagnostic />;
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
        Caricamento statistiche…
      </main>
    );
  }

  const openingPct = (data.totals.opening_rate * 100).toFixed(1);

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
        <a href="/dashboard" style={{ color: MUTED, fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 12 }}>
          ← Dashboard
        </a>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: DEEP, margin: "0 0 4px" }}>
          📊 Admin stats
        </h1>
        <p style={{ fontSize: 13, color: MUTED, margin: "0 0 28px" }}>
          Numeri chiave del prodotto — aggiornati real-time.
        </p>

        {/* ── Pannello Salute lancio (post 2026-04-27) ──────────── */}
        {(data.health || data.activity_24h) && (
          <LaunchHealthPanel data={data} />
        )}

        {/* ── Big number cards — totali ────────────────────────── */}
        <SectionTitle>Totali</SectionTitle>
        <Grid>
          <StatCard label="Regali creati" value={data.totals.gifts_created} emoji="🎁"/>
          <StatCard label="Regali aperti" value={data.totals.gifts_opened} emoji="📬"/>
          <StatCard label="Tasso apertura" value={`${openingPct}%`} emoji="📈"
            color={data.totals.opening_rate >= 0.5 ? OK_GREEN : ACCENT}/>
          <StatCard label="Utenti totali" value={data.totals.users_total} emoji="👥"/>
          <StatCard label="Reazioni" value={data.totals.reactions_total} emoji="💌"/>
          <StatCard label="Push attive" value={data.totals.push_subs} emoji="🔔"/>
          <StatCard label="Programmati" value={data.totals.scheduled_future} emoji="⏰"/>
        </Grid>

        {/* ── Activity ultimi 7 giorni ────────────────────────── */}
        <SectionTitle>Ultimi 7 giorni</SectionTitle>
        <Grid>
          <StatCard label="Utenti attivi" value={data.activity_7d.users_active} emoji="👤" subtitle="creator o opener unici"/>
          <StatCard label="Regali creati" value={data.activity_7d.gifts_created} emoji="✨"/>
          <StatCard label="Regali aperti" value={data.activity_7d.gifts_opened} emoji="📭"/>
        </Grid>

        {/* ── Trend 30 giorni ──────────────────────────────────── */}
        <SectionTitle>Trend 30 giorni</SectionTitle>
        <TrendChart data={data.trend_30d}/>

        {/* ── Distribuzioni ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
          <div>
            <SectionTitle>Tipi di contenuto</SectionTitle>
            <DistributionList items={data.content_types} labelKey="type"/>
          </div>
          {data.tiers.length > 0 && (
            <div>
              <SectionTitle>Tier utenti</SectionTitle>
              <DistributionList items={data.tiers} labelKey="tier"/>
            </div>
          )}
        </div>

        {/* ── Top 10 creator ───────────────────────────────────── */}
        <SectionTitle>Top 10 creator</SectionTitle>
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #e8e4de" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fafaf7", color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>
                <th style={{ textAlign: "left", padding: "10px 14px" }}>#</th>
                <th style={{ textAlign: "left", padding: "10px 14px" }}>User</th>
                <th style={{ textAlign: "left", padding: "10px 14px" }}>Email</th>
                <th style={{ textAlign: "right", padding: "10px 14px" }}>Regali</th>
              </tr>
            </thead>
            <tbody>
              {data.top_creators.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 16, textAlign: "center", color: MUTED }}>Nessun dato</td></tr>
              ) : data.top_creators.map((c, i) => (
                <tr key={c.id} style={{ borderTop: "1px solid #f0ece8" }}>
                  <td style={{ padding: "10px 14px", color: MUTED, fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: "10px 14px", color: DEEP, fontWeight: 600 }}>
                    {c.username ? `@${c.username}` : <span style={{ color: MUTED }}>—</span>}
                  </td>
                  <td style={{ padding: "10px 14px", color: MUTED, fontSize: 12 }}>{c.email ?? "—"}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: ACCENT }}>{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

// ─── Small helpers ─────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 13, fontWeight: 800, color: DEEP, margin: "26px 0 12px", textTransform: "uppercase", letterSpacing: ".07em" }}>
      {children}
    </h2>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, emoji, subtitle, color = DEEP }: {
  label: string;
  value: number | string;
  emoji: string;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4de", borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.1, marginBottom: 2 }}>
        {typeof value === "number" ? value.toLocaleString("it-IT") : value}
      </div>
      <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, lineHeight: 1.3 }}>
        {label}
      </div>
      {subtitle && (
        <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>{subtitle}</div>
      )}
    </div>
  );
}

function DistributionList({ items, labelKey }: { items: { count: number; [k: string]: string | number }[]; labelKey: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: "1px solid #e8e4de" }}>
      {items.length === 0 ? (
        <div style={{ color: MUTED, fontSize: 13 }}>Nessun dato</div>
      ) : items.map((it) => {
        const label = String(it[labelKey] ?? "—");
        const pct = (it.count / max) * 100;
        return (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: DEEP, fontWeight: 600 }}>{label}</span>
              <span style={{ color: MUTED }}>{it.count}</span>
            </div>
            <div style={{ height: 6, background: "#f0ece8", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: ACCENT, transition: "width .3s" }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendChart({ data }: { data: StatsData["trend_30d"] }) {
  // SVG minimale con 3 serie (created, opened, new_users) come bar
  // group affiancate. Niente dipendenze esterne.
  const width = 1050;
  const height = 220;
  const padding = { top: 20, right: 10, bottom: 30, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const n = data.length;
  const groupW = innerW / n;

  const maxVal = Math.max(
    1,
    ...data.map((d) => Math.max(d.created, d.opened, d.new_users))
  );

  // Tick Y a ~4 step
  const yTicks = 4;
  const yStep = Math.max(1, Math.ceil(maxVal / yTicks));
  const yMax = yStep * yTicks;

  const x = (i: number) => padding.left + i * groupW;
  const y = (v: number) => padding.top + innerH - (v / yMax) * innerH;

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #e8e4de", overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12, flexWrap: "wrap" }}>
        <Legend color={ACCENT} label="Creati"/>
        <Legend color={OK_GREEN} label="Aperti (gift distinti)"/>
        <Legend color="#4A6ECC" label="Nuovi utenti"/>
      </div>
      <svg width={width} height={height} style={{ maxWidth: "100%", display: "block" }}>
        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const val = yStep * i;
          const yy = y(val);
          return (
            <g key={i}>
              <line x1={padding.left} x2={width - padding.right} y1={yy} y2={yy} stroke="#f0ece8"/>
              <text x={padding.left - 6} y={yy + 3} textAnchor="end" fontSize={10} fill={MUTED}>
                {val}
              </text>
            </g>
          );
        })}

        {/* Bar groups */}
        {data.map((d, i) => {
          const barW = Math.max(1, groupW / 4);
          const gx = x(i);
          return (
            <g key={d.date}>
              <rect x={gx + barW * 0.3} y={y(d.created)} width={barW} height={padding.top + innerH - y(d.created)} fill={ACCENT}/>
              <rect x={gx + barW * 1.4} y={y(d.opened)} width={barW} height={padding.top + innerH - y(d.opened)} fill={OK_GREEN}/>
              <rect x={gx + barW * 2.5} y={y(d.new_users)} width={barW} height={padding.top + innerH - y(d.new_users)} fill="#4A6ECC"/>
            </g>
          );
        })}

        {/* Ticks X: ogni 5 giorni */}
        {data.map((d, i) => {
          if (i % 5 !== 0) return null;
          const day = d.date.slice(8, 10);
          const mon = d.date.slice(5, 7);
          return (
            <text key={d.date} x={x(i) + groupW / 2} y={height - padding.bottom + 14} textAnchor="middle" fontSize={10} fill={MUTED}>
              {day}/{mon}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: DEEP, fontSize: 12 }}>
      <span style={{ width: 10, height: 10, background: color, borderRadius: 2, display: "inline-block" }}/>
      {label}
    </span>
  );
}

/**
 * Mostrata al client quando /api/admin/stats ritorna 403.
 * Recupera l'email dal profile/me per dare feedback diagnostico
 * utile (simile al vecchio server-side gate, ma client-side così
 * funziona anche quando il cookie SSR auth fallisce).
 */
function ForbiddenDiagnostic() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuthed("/api/profile/me");
        if (res.ok) {
          const p = await res.json();
          setEmail(p?.email ?? null);
        }
      } catch { /* ignore */ }
      finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      background: LIGHT,
      fontFamily: "system-ui, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "28px 28px",
        maxWidth: 480,
        width: "100%",
        boxShadow: "0 4px 16px rgba(0,0,0,.05)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: DEEP, margin: "0 0 8px" }}>
          Area riservata
        </h1>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.5, margin: "0 0 20px" }}>
          Questa pagina è visibile solo agli admin di BeGift.
        </p>

        <div style={{
          background: "#fafaf7",
          border: "1px solid #e8e4de",
          borderRadius: 10,
          padding: "12px 14px",
          fontSize: 12,
          color: "#555",
          textAlign: "left",
          fontFamily: "ui-monospace, monospace",
          marginBottom: 16,
          wordBreak: "break-all",
        }}>
          {loading ? (
            <div>Verifica in corso…</div>
          ) : (
            <>
              <div>email client: <strong>{email ?? "(non loggato)"}</strong></div>
              <div>risultato check: <strong>non admin</strong></div>
            </>
          )}
        </div>

        {!loading && !email && (
          <p style={{ fontSize: 12, color: MUTED, margin: "0 0 16px" }}>
            Fai login prima.
          </p>
        )}
        {!loading && email && (
          <p style={{ fontSize: 12, color: "#B71C1C", margin: "0 0 16px", lineHeight: 1.5 }}>
            La tua email (<code>{email}</code>) non è nella lista ADMIN_EMAILS sul server. Aggiungila su Vercel e redeploy.
          </p>
        )}

        <a href="/dashboard" style={{
          display: "inline-block",
          background: ACCENT,
          color: "#fff",
          borderRadius: 40,
          padding: "10px 24px",
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
        }}>
          Torna alla dashboard
        </a>
      </div>
    </main>
  );
}


/**
 * LaunchHealthPanel — pannello in cima alla dashboard pensato per
 * monitorare la prima settimana di lancio. Tre cose a colpo d'occhio:
 *
 *  1. **Reports DSA pendenti** — se > 0, banner rosso. Devono essere
 *     gestiti: un destinatario ha segnalato un contenuto e va valutato.
 *  2. **Attività 24h** — gift creati oggi vs ieri (con delta %),
 *     nuovi utenti, gift aperti. Indicatore di trend giornaliero.
 *  3. **Funnel signup → primo gift (7gg)** — % di nuovi utenti che
 *     ha creato almeno un gift. Misura l'onboarding: sotto 30% =
 *     l'utente arriva ma non capisce cosa fare. Sopra 60% = ottimo.
 */
function LaunchHealthPanel({ data }: { data: StatsData }) {
  const a24 = data.activity_24h;
  const h = data.health;
  const reportsAlert = (h?.reports_open ?? 0) > 0;
  const funnel = h?.funnel_signup_to_first_gift_7d;
  const funnelPct = funnel ? Math.round(funnel.rate * 100) : 0;
  const funnelColor = funnelPct >= 60 ? OK_GREEN : funnelPct >= 30 ? "#D08F2A" : "#B71C1C";
  const deltaPct = a24?.gifts_created_vs_yesterday_pct ?? null;
  const deltaText = deltaPct === null
    ? "—"
    : deltaPct === 999
    ? "🆕"
    : `${deltaPct >= 0 ? "+" : ""}${deltaPct}%`;
  const deltaColor = deltaPct === null ? MUTED : deltaPct >= 0 ? OK_GREEN : "#B71C1C";

  return (
    <div style={{ marginBottom: 32 }}>
      <SectionTitle>🚀 Salute lancio</SectionTitle>

      {/* Banner reports DSA pendenti — molto visibile se > 0 */}
      {reportsAlert && (
        <div style={{
          background: "#FFEDED",
          border: "1.5px solid #B71C1C",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 12,
          color: "#5D0000",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong>{h?.reports_open} segnalazion{h?.reports_open === 1 ? "e" : "i"} aperta{h?.reports_open === 1 ? "" : "/e"}</strong>
            {" "}da gestire — clicca per andare al pannello reports.
          </div>
          <a href="/admin/reports" style={{ color: "#B71C1C", fontWeight: 700, textDecoration: "underline", fontSize: 13 }}>
            Apri →
          </a>
        </div>
      )}

      <Grid>
        {a24 && (
          <>
            <StatCard
              label="Regali oggi"
              value={a24.gifts_created}
              emoji="🎁"
              subtitle={`vs ieri ${deltaText}`}
              color={deltaColor}
            />
            <StatCard label="Aperture oggi" value={a24.gifts_opened} emoji="📬"/>
            <StatCard label="Nuovi utenti oggi" value={a24.new_users} emoji="👋"/>
          </>
        )}
        {!reportsAlert && h && (
          <StatCard
            label="Reports aperti"
            value={h.reports_open}
            emoji="✅"
            color={OK_GREEN}
            subtitle="nessuna segnalazione pendente"
          />
        )}
        {h?.reports_24h !== undefined && (
          <StatCard
            label="Reports oggi"
            value={h.reports_24h}
            emoji="📨"
            subtitle="ricevuti nelle ultime 24h"
          />
        )}
        {funnel && funnel.new_users > 0 && (
          <StatCard
            label="Conversione 7gg"
            value={`${funnelPct}%`}
            emoji="🎯"
            color={funnelColor}
            subtitle={`${funnel.with_first_gift}/${funnel.new_users} nuovi → primo gift`}
          />
        )}
      </Grid>
    </div>
  );
}
