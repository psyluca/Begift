import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Regalo Festa della Mamma — la Lettera che cresce | BeGift",
  description:
    "Un regalo digitale per la Festa della Mamma diverso da una cartolina: rispondi a 5 domande emotive, BeGift le confeziona in una pagina con foto, dedica e canzone vostra. Pronto in 3 minuti, gratis.",
  alternates: { canonical: "/festa-mamma" },
  openGraph: {
    title: "Regalo Festa della Mamma — la Lettera che cresce",
    description:
      "5 domande emotive, una foto, una canzone. BeGift le confeziona in un regalo che mamma aprirà l'11 maggio. Gratis.",
    url: "/festa-mamma",
    type: "website",
    locale: "it_IT",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "BeGift Festa della Mamma",
      },
    ],
  },
};

const ROSE = "#F4DCD8";
const GOLD = "#D4A340";
const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";

// JSON-LD: WebPage + HowTo per featured snippet su "regalo festa mamma".
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://begift.app/festa-mamma#webpage",
      url: "https://begift.app/festa-mamma",
      name: "Regalo Festa della Mamma — BeGift",
      inLanguage: "it-IT",
      description:
        "Crea un regalo digitale emozionale per la Festa della Mamma in 3 minuti. Foto, dedica, canzone e voucher opzionale, confezionati in una lettera animata che mamma apre dal browser.",
    },
    {
      "@type": "HowTo",
      name: "Come creare un regalo per la Festa della Mamma con BeGift",
      totalTime: "PT3M",
      step: [
        { "@type": "HowToStep", name: "Una parola per descrivere mamma", text: "Scegli una sola parola — forte, dolce, ironica, paziente. Diventa il titolo del regalo aperto." },
        { "@type": "HowToStep", name: "Il tuo ricordo più nitido con lei", text: "Scrivi 2-3 righe su un ricordo che hai. Anche solo un odore, una frase, un pomeriggio." },
        { "@type": "HowToStep", name: "Una foto vostra", text: "Carica una foto che ami. Diventa una polaroid leggermente ruotata nel regalo aperto." },
        { "@type": "HowToStep", name: "Cosa ti ha insegnato senza dirtelo", text: "Una frase che racchiude qualcosa che hai imparato da lei in modo silenzioso." },
        { "@type": "HowToStep", name: "Una canzone che vi unisce", text: "Incolla un link Spotify o YouTube della vostra canzone." },
        { "@type": "HowToStep", name: "Voucher opzionale", text: "Vuoi aggiungere un buono per cena, spa o un libro? Carica PDF o link." },
      ],
    },
  ],
};

export default function FestaMammaPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section style={{
        padding: "60px 24px 50px",
        background: `linear-gradient(135deg, ${ROSE} 0%, #FFFFFF 100%)`,
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 42, marginBottom: 16 }} aria-hidden>💐</div>
          <h1 style={{
            fontSize: "clamp(32px, 6vw, 48px)",
            fontWeight: 900,
            color: DEEP,
            letterSpacing: "-1.5px",
            margin: "0 0 16px",
            lineHeight: 1.1,
          }}>
            Un regalo per mamma<br/>
            <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 700 }}>che si apre come una lettera</span>
          </h1>
          <p style={{
            fontSize: 18,
            color: MUTED,
            lineHeight: 1.6,
            margin: "0 auto 32px",
            maxWidth: 560,
          }}>
            Cinque domande emotive, una foto, una canzone vostra. BeGift le confeziona in un regalo
            che mamma apre dal telefono, l'11 maggio.
          </p>
          <Link
            href="/festa-mamma/crea"
            style={{
              display: "inline-block",
              background: ACCENT,
              color: "#fff",
              borderRadius: 50,
              padding: "18px 44px",
              fontSize: 17,
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 10px 32px rgba(212,83,126,.35)",
            }}
          >
            Crea il regalo — è gratis
          </Link>
          <p style={{ fontSize: 13, color: MUTED, margin: "16px 0 0" }}>
            ⏱ Pronto in 3 minuti · 🆓 Gratis · 💌 Nessuna app da installare per mamma
          </p>
        </div>
      </section>

      {/* Cosa contiene */}
      <section style={{ padding: "60px 24px", maxWidth: 760, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: DEEP, margin: "0 0 16px", textAlign: "center", letterSpacing: "-.5px" }}>
          Cosa metti dentro
        </h2>
        <p style={{ fontSize: 15, color: MUTED, textAlign: "center", margin: "0 0 36px", lineHeight: 1.6 }}>
          Non un biglietto generico. Un ritratto di mamma attraverso ciò che ti ha dato.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { n: "1", t: "Una parola per descrivere mamma", d: "Forte, dolce, paziente, ironica, casa. Una sola. Diventa il titolo grande del regalo aperto." },
            { n: "2", t: "Il tuo ricordo più nitido con lei", d: "Non serve sia importante. Anche solo un odore, una frase, un pomeriggio." },
            { n: "3", t: "Una foto vostra che ami", d: "Diventa una polaroid leggermente ruotata, con scotch carta. Effetto foto vintage." },
            { n: "4", t: "Cosa ti ha insegnato senza dirtelo", d: "Una frase. Tipo \"che le persone si misurano da come trattano i camerieri\"." },
            { n: "5", t: "Una canzone che vi unisce", d: "Link Spotify o YouTube. Diventa un player dentro il regalo che mamma può ascoltare." },
            { n: "+", t: "Voucher opzionale", d: "Cena, spa, libro, biglietti per uno spettacolo. Carica PDF o incolla il link. Trasforma il regalo in qualcosa anche di pratico." },
          ].map((item) => (
            <div
              key={item.n}
              style={{
                display: "flex",
                gap: 16,
                padding: "18px 20px",
                background: "#fafaf7",
                border: "1px solid #eadfd5",
                borderRadius: 14,
                alignItems: "flex-start",
              }}
            >
              <div style={{
                flexShrink: 0,
                width: 36, height: 36,
                borderRadius: "50%",
                background: GOLD,
                color: "#fff",
                fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>{item.n}</div>
              <div>
                <div style={{ fontWeight: 700, color: DEEP, fontSize: 16, marginBottom: 4 }}>
                  {item.t}
                </div>
                <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
                  {item.d}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Anteprima visiva */}
      <section style={{ padding: "40px 24px 60px", background: ROSE }}>
        <div style={{ maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: DEEP, margin: "0 0 12px" }}>
            Cosa vede mamma
          </h2>
          <p style={{ fontSize: 14, color: MUTED, margin: "0 0 24px", lineHeight: 1.6 }}>
            Apre il link dal telefono. Il pacco rosa si scarta lentamente con musica. Poi vede la tua parola, la polaroid, le tue frasi, la vostra canzone.
          </p>

          {/* Mock pacco */}
          <div style={{
            background: "#fff",
            borderRadius: 24,
            padding: "36px 28px",
            boxShadow: "0 16px 48px rgba(0,0,0,.08)",
            margin: "0 auto",
            maxWidth: 360,
          }}>
            <div style={{
              fontSize: "clamp(34px, 8vw, 48px)",
              color: GOLD,
              fontWeight: 700,
              fontStyle: "italic",
              fontFamily: "Georgia, serif",
              margin: "0 0 16px",
              lineHeight: 1,
            }}>
              "Forte"
            </div>
            <div style={{
              width: 140, height: 140,
              background: "#f0e8e0",
              margin: "0 auto 16px",
              transform: "rotate(-3deg)",
              boxShadow: "0 6px 16px rgba(0,0,0,.1)",
              padding: 8,
              border: "8px solid #fff",
            }}>
              <div style={{ width: "100%", height: "100%", background: "#d8c8c0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }} aria-hidden>👩‍👧</div>
            </div>
            <p style={{ fontSize: 14, color: DEEP, fontStyle: "italic", lineHeight: 1.5, margin: "0 0 12px" }}>
              "Il mio ricordo più nitido con te è quel pomeriggio d'agosto sul terrazzo, le pesche tagliate nel piatto azzurro."
            </p>
            <div style={{ fontSize: 13, color: MUTED, fontStyle: "italic" }}>
              ♪ La nostra canzone ♪
            </div>
          </div>
        </div>
      </section>

      {/* CTA finale */}
      <section style={{ padding: "60px 24px", textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: DEEP, margin: "0 0 12px", letterSpacing: "-.5px" }}>
          Mamma merita più di un messaggio
        </h2>
        <p style={{ fontSize: 15, color: MUTED, margin: "0 0 28px", lineHeight: 1.6 }}>
          Ti prendiamo per mano: cinque domande, lei riceve un regalo che si ricorderà.
        </p>
        <Link
          href="/festa-mamma/crea"
          style={{
            display: "inline-block",
            background: ACCENT,
            color: "#fff",
            borderRadius: 50,
            padding: "18px 46px",
            fontSize: 17,
            fontWeight: 800,
            textDecoration: "none",
            boxShadow: "0 10px 32px rgba(212,83,126,.35)",
          }}
        >
          Inizia ora — gratis
        </Link>
      </section>

      {/* Footer attribution leggera */}
      <div style={{ padding: "0 24px 40px", textAlign: "center" }}>
        <Link href="/" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>
          ← Torna a BeGift
        </Link>
      </div>
    </main>
  );
}
