"use client";

import { useEffect, useState } from "react";

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
  trend_30d: { date: string; created: number; opened: number; new_users: number }[];
  content_types: { type: string; count: number }[];
  tiers: { tier: string; count: number }[];
  top_creators: { id: string; email: string | null; username: string | null; count: number }[];
}

export default function AdminStatsClient() {
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) {
          setError(res.status === 403 ? "Accesso non autorizzato" : "Errore nel caricamento");
          return;
        }
        setData(await res.json());
      } catch (e) {
        console.error("[admin/stats] fetch failed", e);
        setError("Errore di rete");
      }
    })();
  }, []);

  if (error) {
    return (
      <main style={{ padding: 40, textAlign: "center", fontFamily: "system-ui, sans-serif", color: MUTED }}>
        {error}
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
