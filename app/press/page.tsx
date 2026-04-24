import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Press kit — BeGift",
  description:
    "Informazioni per stampa, blog, influencer e recensori. Descrizioni in 3 lunghezze, logo, screenshot, dati chiave, contatti. Uso libero con attribuzione.",
  alternates: { canonical: "/press" },
  openGraph: {
    title: "Press kit BeGift",
    description: "Logo, screenshot e descrizioni pronte all'uso.",
    url: "/press",
    type: "website",
    locale: "it_IT",
  },
};

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";
const LIGHT = "#f7f5f2";

export default function PressPage() {
  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: DEEP, letterSpacing: "-1.5px", margin: "0 0 12px" }}>
          Press kit
        </h1>
        <p style={{ fontSize: 17, color: MUTED, margin: "0 0 40px", lineHeight: 1.6 }}>
          Contenuti liberi da usare per articoli, recensioni, classifiche,
          video, podcast. Unica richiesta: attribuzione a BeGift con link a
          <a href="https://begift.app" style={{ color: ACCENT, textDecoration: "none" }}> begift.app</a>.
        </p>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: DEEP, margin: "0 0 16px" }}>Descrizioni pronte</h2>

          <div style={{ background: "#fff", border: "1px solid #eadfd5", borderRadius: 12, padding: "18px 22px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: ACCENT, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tagline (1 riga, max 80 caratteri)
            </div>
            <p style={{ fontSize: 15, color: DEEP, lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>
              &quot;Un regalo ogni volta che pensi a qualcuno — digitale, emozionale, gratis.&quot;
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #eadfd5", borderRadius: 12, padding: "18px 22px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: ACCENT, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Descrizione breve (~50 parole)
            </div>
            <p style={{ fontSize: 15, color: DEEP, lineHeight: 1.6, margin: 0 }}>
              BeGift è una web app italiana per creare regali digitali personalizzati:
              combini un contenuto (messaggio, foto, video, PDF, link, esperienze) con un
              packaging grafico a tua scelta e condividi via link. Il destinatario apre
              il pacco dal browser con un'animazione di scartatura e suono. Gratis,
              nessuna app da scaricare.
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #eadfd5", borderRadius: 12, padding: "18px 22px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: ACCENT, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Descrizione estesa (~200 parole)
            </div>
            <p style={{ fontSize: 15, color: DEEP, lineHeight: 1.65, margin: "0 0 10px" }}>
              BeGift è una Progressive Web App italiana, nata nel 2025 a opera di Luca Galli,
              indie developer, per risolvere un problema semplice: quando vogliamo dire a
              qualcuno che ci stiamo pensando — per un'occasione speciale o anche solo perché
              ci è venuto in mente oggi — un messaggio WhatsApp è troppo poco, un regalo
              fisico spesso impossibile (distanza, tempi, budget).
            </p>
            <p style={{ fontSize: 15, color: DEEP, lineHeight: 1.65, margin: "0 0 10px" }}>
              Con BeGift confezioni il tuo pensiero come un vero regalo: scegli un
              contenuto (una canzone, una foto, un messaggio, un biglietto per un concerto,
              un video-messaggio di famiglia), lo avvolgi in un packaging personalizzato
              (colore della carta, fiocco, animazione, suono), e lo mandi con un link.
              Il destinatario lo apre dal browser, vede il pacco scartarsi, accede
              al contenuto.
            </p>
            <p style={{ fontSize: 15, color: DEEP, lineHeight: 1.65, margin: 0 }}>
              Pensato per la distanza (parenti emigrati, partner in trasferta) e per
              la quotidianità (un pensiero senza occasione). Gratis, GDPR-compliant
              con dati in UE (Germania), nessuna pubblicità, nessun tracking di
              profilazione.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: DEEP, margin: "0 0 16px" }}>Dati chiave</h2>
          <div style={{ background: "#fff", border: "1px solid #eadfd5", borderRadius: 12, padding: "4px 0" }}>
            {[
              ["Nome", "BeGift"],
              ["Dominio", "begift.app"],
              ["Fondatore", "Luca Galli (Italia)"],
              ["Anno di fondazione", "2025"],
              ["Categoria", "Consumer web app — Lifestyle / Regali digitali"],
              ["Piattaforma", "Progressive Web App (iOS, Android, desktop)"],
              ["Lingue", "Italiano, Inglese, Giapponese, Cinese"],
              ["Prezzo", "Gratuito"],
              ["Hosting", "Vercel (edge network)"],
              ["Database", "Supabase — region Frankfurt (UE)"],
              ["Compliance", "GDPR, DSA art. 16, EU AI Act art. 50"],
              ["Contatto stampa", "info@begift.app"],
            ].map(([k, v], i) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderTop: i === 0 ? "none" : "1px solid #f0ece6",
                  gap: 16,
                }}
              >
                <div style={{ fontSize: 13, color: MUTED, fontWeight: 600, flex: "0 0 140px" }}>{k}</div>
                <div style={{ fontSize: 14, color: DEEP, flex: 1 }}>{v}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: DEEP, margin: "0 0 16px" }}>Logo</h2>
          <div style={{ background: "#fff", border: "1px solid #eadfd5", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
              <img
                src="/icon-512.png"
                alt="Logo BeGift"
                width={128}
                height={128}
                style={{ borderRadius: 16, background: "#fff", border: "1px solid #eadfd5" }}
              />
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: "0 0 10px" }}>
                  Usa il logo nelle proporzioni originali. Non modificare i colori
                  (nero #1a1a1a + fiocco rosa #D4537E) ne' deformare.
                </p>
                <a
                  href="/icon-512.png"
                  download="BeGift-logo.png"
                  style={{ color: ACCENT, fontSize: 13, fontWeight: 700, textDecoration: "none" }}
                >
                  Scarica logo PNG (512×512) →
                </a>
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: DEEP, margin: "0 0 16px" }}>Palette colori</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {[
              { name: "Accent", hex: "#D4537E" },
              { name: "Deep", hex: "#1a1a1a" },
              { name: "Muted", hex: "#6a6a6a" },
              { name: "Light bg", hex: "#f7f5f2" },
            ].map((c) => (
              <div key={c.name} style={{ background: "#fff", border: "1px solid #eadfd5", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ background: c.hex, height: 60 }} />
                <div style={{ padding: "10px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DEEP }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: MUTED, fontFamily: "ui-monospace,Menlo,monospace" }}>{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: DEEP, margin: "0 0 16px" }}>Contatti</h2>
          <ul style={{ fontSize: 15, color: DEEP, lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Press / informazioni:</strong> info@begift.app</li>
            <li><strong>Supporto utenti:</strong> support@begift.app</li>
            <li><strong>Privacy / dati:</strong> privacy@begift.app</li>
            <li><strong>Segnalazioni:</strong> abuse@begift.app</li>
          </ul>
        </section>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid #e0dbd5" }}>
          <Link href="/" style={{ color: ACCENT, fontSize: 14, textDecoration: "none" }}>
            ← Torna alla home
          </Link>
        </div>
      </div>
    </main>
  );
}
