"use client";
import Link from "next/link";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight:"100vh", background:LIGHT, fontFamily:"system-ui,sans-serif", paddingBottom:100 }}>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"32px 24px" }}>
        <Link href="/" style={{ fontSize:13, color:MUTED, textDecoration:"none" }}>← Torna alla home</Link>

        <h1 style={{ fontSize:28, fontWeight:800, color:DEEP, margin:"24px 0 8px" }}>Privacy Policy</h1>
        <p style={{ fontSize:13, color:MUTED, marginBottom:32 }}>Ultimo aggiornamento: aprile 2025</p>

        <Section title="1. Titolare del trattamento">
          <p>Il titolare del trattamento dei dati personali è una persona fisica che gestisce il servizio BeGift, raggiungibile all'indirizzo email: <a href="mailto:privacy@begift.app" style={{color:ACCENT}}>privacy@begift.app</a></p>
        </Section>

        <Section title="2. Dati raccolti">
          <p>BeGift raccoglie i seguenti dati personali:</p>
          <ul>
            <li><strong>Indirizzo email</strong> — fornito volontariamente al momento della registrazione, utilizzato esclusivamente per l'autenticazione tramite magic link.</li>
            <li><strong>Contenuti dei regali</strong> — foto, video, PDF, messaggi e link caricati dall'utente per creare regali digitali.</li>
            <li><strong>Dati di utilizzo</strong> — informazioni tecniche come l'identificativo del dispositivo (device ID), utilizzato per tracciare l'apertura dei regali.</li>
          </ul>
        </Section>

        <Section title="3. Finalità del trattamento">
          <p>I dati vengono trattati per le seguenti finalità:</p>
          <ul>
            <li>Fornire il servizio di creazione e condivisione di regali digitali.</li>
            <li>Autenticare gli utenti registrati tramite magic link via email.</li>
            <li>Consentire al mittente di vedere quando il destinatario ha aperto il regalo.</li>
            <li>Inviare comunicazioni di servizio (es. notifiche di reazione a un regalo).</li>
          </ul>
          <p>I dati non vengono mai utilizzati per finalità di marketing o profilazione pubblicitaria.</p>
        </Section>

        <Section title="4. Base giuridica">
          <p>Il trattamento si basa sul consenso dell'interessato (art. 6, par. 1, lett. a GDPR) e sull'esecuzione del contratto di servizio (art. 6, par. 1, lett. b GDPR).</p>
        </Section>

        <Section title="5. Conservazione dei dati">
          <p>I dati vengono conservati per il tempo strettamente necessario all'erogazione del servizio. L'utente può richiedere la cancellazione del proprio account e di tutti i dati associati in qualsiasi momento scrivendo a <a href="mailto:privacy@begift.app" style={{color:ACCENT}}>privacy@begift.app</a>.</p>
        </Section>

        <Section title="6. Condivisione dei dati">
          <p>I dati non vengono venduti né ceduti a terzi. Vengono condivisi esclusivamente con i seguenti fornitori di servizi tecnici, necessari per il funzionamento della piattaforma:</p>
          <ul>
            <li><strong>Supabase Inc.</strong> (USA) — database, autenticazione e archiviazione file. Trattamento regolato da accordo DPA conforme al GDPR.</li>
            <li><strong>Vercel Inc.</strong> (USA) — hosting e distribuzione dell'applicazione web.</li>
            <li><strong>Resend Inc.</strong> — invio delle email di autenticazione.</li>
          </ul>
        </Section>

        <Section title="7. Cookie e tecnologie simili">
          <p>BeGift utilizza esclusivamente cookie tecnici e funzionali, necessari per il corretto funzionamento del servizio:</p>
          <ul>
            <li><strong>Cookie di sessione</strong> — mantengono l'utente autenticato durante la navigazione.</li>
            <li><strong>Device ID</strong> — identificativo anonimo salvato nel localStorage del browser, utilizzato per tracciare l'apertura dei regali.</li>
          </ul>
          <p>Non vengono utilizzati cookie di profilazione, tracking o marketing di terze parti.</p>
        </Section>

        <Section title="8. Diritti dell'interessato">
          <p>In conformità al GDPR, l'utente ha diritto di:</p>
          <ul>
            <li>Accedere ai propri dati personali.</li>
            <li>Rettificare i dati inesatti.</li>
            <li>Richiedere la cancellazione ("diritto all'oblio").</li>
            <li>Limitare o opporsi al trattamento.</li>
            <li>Ricevere i propri dati in formato portabile.</li>
            <li>Proporre reclamo all'Autorità Garante per la protezione dei dati personali (www.garanteprivacy.it).</li>
          </ul>
          <p>Per esercitare questi diritti scrivere a: <a href="mailto:privacy@begift.app" style={{color:ACCENT}}>privacy@begift.app</a></p>
        </Section>

        <Section title="9. Modifiche alla privacy policy">
          <p>Questa privacy policy può essere aggiornata periodicamente. Le modifiche sostanziali saranno comunicate tramite email o mediante avviso nell'applicazione.</p>
        </Section>

        <div style={{ marginTop:40, padding:"20px 0", borderTop:"1px solid #e0dbd5", textAlign:"center" }}>
          <p style={{ fontSize:12, color:MUTED }}>BeGift — <a href="mailto:privacy@begift.app" style={{color:ACCENT}}>privacy@begift.app</a></p>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:28 }}>
      <h2 style={{ fontSize:16, fontWeight:700, color:"#1a1a1a", margin:"0 0 10px" }}>{title}</h2>
      <div style={{ fontSize:14, color:"#444", lineHeight:1.75 }}>{children}</div>
    </div>
  );
}
