import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sicurezza e vulnerability disclosure — BeGift",
  description: "Come segnalare una vulnerabilità di sicurezza a BeGift. Policy di responsible disclosure conforme RFC 9116.",
  alternates: { canonical: "/security" },
  robots: { index: true, follow: true },
};

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

export default function SecurityPage() {
  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: DEEP, margin: "0 0 8px" }}>
          Sicurezza
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 32px" }}>
          Vulnerability disclosure policy — ultima revisione 23 aprile 2026
        </p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: DEEP, marginBottom: 10 }}>
            1. Come segnalare una vulnerabilità
          </h2>
          <p style={{ fontSize: 15, color: DEEP, lineHeight: 1.7, marginBottom: 10 }}>
            Se hai individuato una vulnerabilità di sicurezza in BeGift, ti chiediamo
            di segnalarla privatamente prima di renderla pubblica. Ci impegniamo a
            rispondere entro <strong>72 ore</strong> dalla ricezione.
          </p>
          <div style={{
            background: "#fff", border: "1.5px solid #e0dbd5", borderRadius: 12,
            padding: 16, margin: "14px 0",
          }}>
            <p style={{ fontSize: 14, color: DEEP, margin: 0, lineHeight: 1.7 }}>
              <strong>Email:</strong>{" "}
              <a href="mailto:security@begift.app" style={{ color: ACCENT }}>
                security@begift.app
              </a>
            </p>
            <p style={{ fontSize: 13, color: MUTED, margin: "6px 0 0" }}>
              Per comunicazioni particolarmente sensibili, indicacelo nel primo
              messaggio: ti forniremo una chiave PGP dedicata.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: DEEP, marginBottom: 10 }}>
            2. Cosa includere nella segnalazione
          </h2>
          <ul style={{ fontSize: 15, color: DEEP, lineHeight: 1.8, paddingLeft: 22 }}>
            <li>Descrizione della vulnerabilità</li>
            <li>Passi per riprodurla (Proof of Concept)</li>
            <li>Impatto stimato (cosa potrebbe fare un attaccante)</li>
            <li>Il tuo contatto per eventuali domande (facoltativo se vuoi restare anonimo)</li>
            <li>Se vuoi essere nominato nel nostro hall of fame, indicalo</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: DEEP, marginBottom: 10 }}>
            3. Safe harbor — impegni verso chi segnala
          </h2>
          <p style={{ fontSize: 15, color: DEEP, lineHeight: 1.7 }}>
            A condizione che il ricercatore operi in buona fede, rispetti le regole
            sotto ed eviti danni agli utenti, BeGift:
          </p>
          <ul style={{ fontSize: 15, color: DEEP, lineHeight: 1.8, paddingLeft: 22 }}>
            <li>Non persegue azioni legali per l'attività di ricerca</li>
            <li>Non richiede risarcimenti per eventuali interruzioni accidentali lievi</li>
            <li>Accetta segnalazioni anonime</li>
            <li>Risponde entro 72 ore e fornisce aggiornamenti periodici</li>
            <li>Può riconoscere pubblicamente il ricercatore nell'hall of fame</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: DEEP, marginBottom: 10 }}>
            4. Regole per il ricercatore
          </h2>
          <p style={{ fontSize: 15, color: DEEP, lineHeight: 1.7, marginBottom: 10 }}>
            Per poter beneficiare del safe harbor, ti chiediamo di:
          </p>
          <ul style={{ fontSize: 15, color: DEEP, lineHeight: 1.8, paddingLeft: 22 }}>
            <li>Non accedere a dati personali di altri utenti oltre il minimo
                necessario a dimostrare la vulnerabilità</li>
            <li>Non modificare né cancellare dati di altri utenti</li>
            <li>Non eseguire attacchi DoS volumetrici o social engineering</li>
            <li>Non divulgare la vulnerabilità pubblicamente prima della nostra
                conferma di fix o di 90 giorni dalla segnalazione
                (coordinated disclosure)</li>
            <li>Segnalare tempestivamente e smettere i test appena la vulnerabilità
                è confermata</li>
            <li>Non combinare con phishing, spamming o altre attività illegali</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: DEEP, marginBottom: 10 }}>
            5. In scope / out of scope
          </h2>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: DEEP, margin: "14px 0 6px" }}>In scope</h3>
          <ul style={{ fontSize: 15, color: DEEP, lineHeight: 1.8, paddingLeft: 22 }}>
            <li>begift.app e tutti i sottodomini</li>
            <li>API BeGift (/api/*)</li>
            <li>Service Worker e flow Web Push</li>
            <li>Flusso di autenticazione</li>
            <li>Logica di autorizzazione e isolamento tra utenti</li>
          </ul>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: DEEP, margin: "14px 0 6px" }}>Out of scope</h3>
          <ul style={{ fontSize: 15, color: DEEP, lineHeight: 1.8, paddingLeft: 22 }}>
            <li>Infrastruttura dei nostri fornitori (Supabase, Vercel, Anthropic)</li>
            <li>Vulnerabilità che richiedono controllo fisico del device della vittima</li>
            <li>Self-XSS senza escalation</li>
            <li>Missing security headers senza PoC di impatto</li>
            <li>Bug puramente funzionali senza implicazioni di sicurezza</li>
            <li>Rate limit su endpoint già con rate limit applicativo documentato</li>
            <li>Clickjacking su pagine non-sensitive</li>
            <li>Email spoofing senza PoC che aggira SPF/DKIM/DMARC</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: DEEP, marginBottom: 10 }}>
            6. Premi
          </h2>
          <p style={{ fontSize: 15, color: DEEP, lineHeight: 1.7 }}>
            Al momento BeGift non offre un programma formale di bug bounty con
            ricompense monetarie. Riconosciamo con un ringraziamento pubblico nella
            sezione hall of fame (se il ricercatore lo desidera) e forniamo swag
            simbolici. Un programma retribuito potrà essere introdotto dopo il
            lancio commerciale.
          </p>
        </section>

        <section style={{ marginBottom: 32 }} id="hall-of-fame">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: DEEP, marginBottom: 10 }}>
            7. Hall of fame
          </h2>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, fontStyle: "italic" }}>
            Nessuna segnalazione ancora. Questa sezione elencherà i ricercatori che
            hanno contribuito alla sicurezza di BeGift (solo con loro consenso).
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: DEEP, marginBottom: 10 }}>
            8. Contatti
          </h2>
          <ul style={{ fontSize: 15, color: DEEP, lineHeight: 1.8, paddingLeft: 22 }}>
            <li><strong>Segnalazioni di sicurezza:</strong> security@begift.app</li>
            <li><strong>Privacy e protezione dati:</strong> privacy@begift.app</li>
            <li><strong>Segnalazioni di contenuti (DSA):</strong> abuse@begift.app</li>
            <li><strong>security.txt:</strong>{" "}
              <a href="/.well-known/security.txt" style={{ color: ACCENT }}>
                /.well-known/security.txt
              </a>
            </li>
          </ul>
        </section>

        <div style={{ borderTop: "1px solid #e0dbd5", paddingTop: 20, marginTop: 40 }}>
          <Link href="/" style={{ color: ACCENT, fontSize: 14, textDecoration: "none" }}>
            ← Torna alla home
          </Link>
        </div>
      </div>
    </main>
  );
}
