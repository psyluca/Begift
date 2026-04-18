"use client";
import { useI18n } from "@/lib/i18n";

const ACCENT = "#D4537E", MUTED = "#888";

const LANGS = [
  { code: "it", label: "IT", flag: "🇮🇹" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "ja", label: "JA", flag: "🇯🇵" },
  { code: "zh", label: "ZH", flag: "🇨🇳" },
];

export default function LangSwitcher({ style }: { style?: React.CSSProperties }) {
  const { locale, setLocale } = useI18n();
  return (
    <div style={{ display: "flex", ...style }}>
      {LANGS.map((l, i) => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          style={{
            background: locale === l.code ? ACCENT : "#fff",
            color: locale === l.code ? "#fff" : MUTED,
            border: "1.5px solid #e0dbd5",
            borderRadius:
              i === 0
                ? "20px 0 0 20px"
                : i === LANGS.length - 1
                ? "0 20px 20px 0"
                : "0",
            padding: "5px 10px",
            fontSize: 11,
            cursor: "pointer",
            fontWeight: 700,
            marginLeft: i > 0 ? "-1.5px" : 0,
          }}
        >
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, lineHeight: 1 }}>
            <span style={{ fontSize: 13 }}>{l.flag}</span>
            <span style={{ fontSize: 9 }}>{l.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
