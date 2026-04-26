import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Regalo Festa del Papà — la Lettera che cresce | BeGift",
  description:
    "Un regalo digitale per la Festa del Papà che non sia il solito biglietto: rispondi a 5 domande emotive, BeGift le confeziona in una pagina con foto, dedica e canzone vostra. Pronto in 3 minuti, gratis.",
  alternates: { canonical: "/festa-papa" },
  openGraph: {
    title: "Regalo Festa del Papà — la Lettera che cresce",
    description:
      "5 domande emotive, una foto, una canzone. BeGift le confeziona in un regalo che papà aprirà il 19 giugno. Gratis.",
    url: "/festa-papa",
    type: "website",
    locale: "it_IT",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "BeGift Festa del Papà" }],
  },
};

const PAPER = "#E8DCC4";
const ACCENT_DAD = "#5C7A4A";
const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://begift.app/festa-papa#webpage",
      url: "https://begift.app/festa-papa",
      name: "Regalo Festa del Papà — BeGift",
      inLanguage: "it-IT",
      description:
        "Crea un regalo digitale emozionale per la Festa del Papà in 3 minuti. Foto, dedica, canzone e voucher opzionale, confezionati in una lettera animata che papà apre dal browser.",
    },
    {
      "@type": "HowTo",
      name: "Come creare un regalo per la Festa del Papà con BeGift",
      totalTime: "PT3M",
      step: [
        { "@type": "HowToStep", name: "Una parola per descrivere papà", text: "Roccia, riferimento, silenzioso, capitano. Una sola. Diventa il titolo del regalo aperto." },
        { "@type": "HowToStep", name: "Il tuo ricordo più nitido con lui", text: "Anche solo un gesto, un viaggio in macchina, una mattina silenziosa." },
        { "@type": "HowToStep", name: "Una foto vostra", text: "Diventa una polaroid leggermente ruotata nel regalo aperto." },
        { "@type": "HowToStep", name: "Cosa ti ha insegnato senza dirtelo", text: "Una frase che racchiude un'eredità silenziosa." },
        { "@type": "HowToStep", name: "Una canzone che vi unisce", text: "Incolla un link Spotify o YouTube della vostra canzone." },
        { "@type": "HowToStep", name: "Voucher opzionale", text: "Vuoi aggiungere un buono per cena, vino o un libro? Carica PDF o link." },
      ],
    },
  ],
};

export default function FestaPapaPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section style={{
        padding: "60px 24px 50px",
        background: `linear-gradient(135deg, ${PAPER} 0%, #FFFFFF 100%)`,
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 42, marginBottom: 16 }} aria-hidden>🌳</div>
          <h1 style={{
            fontSize: "clamp(32px, 6vw, 48px)",
            fontWeight: 900, color: DEEP, letterSpacing: "-1.5px",
            margin: "0 0 16px", lineHeight: 1.1,
          }}>
            Un regalo per papà<br/>
            <span style={{ color: ACCENT_DAD, fontStyle: "italic", fontWeight: 700 }}>che si apre come una lettera</span>
          </h1>
          <p style={{
            fontSize: 18, color: MUTED, lineHeight: 1.6,
            margin: "0 auto 32px", maxWidth: 560,
          }}>
            Cinque domande emotive, una foto, una canzone vostra. BeGift le confeziona in un regalo
            che papà apre dal telefono, il 19 giugno.
          </p>
          <Link
            href="/festa-papa/crea"
            style={{
              display: "inline-block",
              background: ACCENT, color: "#fff", borderRadius: 50,
              padding: "18px 44px", fontSize: 17, fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 10px 32px rgba(212,83,126,.35)",
            }}
          >
            Crea il regalo — è gratis
          </Link>
          <p style={{ fontSize: 13, color: MUTED, margin: "16px 0 0" }}>
            ⏱ Pronto in 3 minuti · 🆓 Gratis · 💌 Nessuna app da installare per papà
          </p>
        </div>
      </section>

      <section style={{ padding: "60px 24px", maxWidth: 760, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: DEEP, margin: "0 0 16px", textAlign: "center", letterSpacing: "-.5px" }}>
          Cosa metti dentro
        </h2>
        <p style={{ fontSize: 15, color: MUTED, textAlign: "center", margin: "0 0 36px", lineHeight: 1.6 }}>
          Non un biglietto generico. Un ritratto di papà attraverso ciò che ti ha dato.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { n: "1", t: "Una parola per descrivere papà", d: "Roccia, riferimento, silenzioso, capitano. Una sola. Diventa il titolo grande del regalo aperto." },
            { n: "2", t: "Il tuo ricordo più nitido con lui", d: "Anche solo un gesto, un viaggio in macchina, una mattina silenziosa." },
            { n: "3", t: "Una foto vostra che ami", d: "Diventa una polaroid leggermente ruotata, con scotch carta. Effetto foto vintage." },
            { n: "4", t: "Cosa ti ha insegnato senza dirtelo", d: "Una frase che racchiude un'eredità silenziosa." },
            { n: "5", t: "Una canzone che vi unisce", d: "Link Spotify o YouTube. Diventa un player dentro il regalo che papà può ascoltare." },
            { n: "+", t: "Voucher opzionale", d: "Cena, vino, libro, biglietti per uno spettacolo. Carica PDF o incolla il link." },
          ].map((item) => (
            <div key={item.n} style={{
              display: "flex", gap: 16,
              padding: "18px 20px",
              background: "#fafaf7",
              border: "1px solid #eadfd5", borderRadius: 14,
              alignItems: "flex-start",
            }}>
              <div style={{
                flexShrink: 0, width: 36, height: 36, borderRadius: "50%",
                background: ACCENT_DAD, color: "#fff", fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>{item.n}</div>
              <div>
                <div style={{ fontWeight: 700, color: DEEP, fontSize: 16, marginBottom: 4 }}>{item.t}</div>
                <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.55 }}>{item.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "60px 24px", textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: DEEP, margin: "0 0 12px", letterSpacing: "-.5px" }}>
          Papà non chiede mai niente. Tu però puoi pensarci.
        </h2>
        <p style={{ fontSize: 15, color: MUTED, margin: "0 0 28px", lineHeight: 1.6 }}>
          Ti prendiamo per mano: cinque domande, lui riceve un regalo che si ricorderà.
        </p>
        <Link
          href="/festa-papa/crea"
          style={{
            display: "inline-block",
            background: ACCENT, color: "#fff", borderRadius: 50,
            padding: "18px 46px", fontSize: 17, fontWeight: 800,
            textDecoration: "none",
            boxShadow: "0 10px 32px rgba(212,83,126,.35)",
          }}
        >
          Inizia ora — gratis
        </Link>
      </section>

      <div style={{ padding: "0 24px 40px", textAlign: "center" }}>
        <Link href="/" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>
          ← Torna a BeGift
        </Link>
      </div>
    </main>
  );
}
