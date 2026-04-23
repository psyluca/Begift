"use client";
import Link from "next/link";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

/**
 * /terms — Terms of Service / Condizioni d'uso.
 *
 * Bozza conforme a DSA (Reg. UE 2022/2065) art. 14 + E-commerce
 * Directive + Codice del Consumo italiano. DEVE essere rivista da
 * un avvocato specializzato prima del launch commerciale.
 *
 * Cose incluse:
 * - Identità del service provider
 * - Descrizione servizio
 * - Accettazione delle condizioni
 * - Uso accettabile (divieti espliciti: CSAM, violenza, etc)
 * - Responsabilità degli utenti per i contenuti caricati
 * - Diritto di rimozione contenuti e sospensione account
 * - Property rights
 * - Disclaimer e limitazione di responsabilità
 * - Notice-and-action mechanism (DSA art. 16)
 * - Legge applicabile e foro competente
 * - Modifiche ai termini
 * - Dati di contatto
 */

export default function TermsPage() {
  return (
    <main style={{ minHeight:"100vh", background:LIGHT, fontFamily:"system-ui,sans-serif", paddingBottom:100 }}>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"32px 24px" }}>
        <Link href="/" style={{ fontSize:13, color:MUTED, textDecoration:"none" }}>← Torna alla home</Link>

        <h1 style={{ fontSize:28, fontWeight:800, color:DEEP, margin:"24px 0 8px" }}>Condizioni d&apos;uso</h1>
        <p style={{ fontSize:13, color:MUTED, marginBottom:32 }}>Ultimo aggiornamento: aprile 2026</p>

        <Section title="1. Il servizio BeGift">
          <p>BeGift (di seguito &quot;il Servizio&quot;) è una piattaforma digitale che consente agli utenti registrati di creare regali digitali personalizzati — composti da foto, video, PDF, link o messaggi — e di condividerli tramite un link univoco con il destinatario scelto.</p>
          <p>Il Servizio è fornito da una persona fisica (di seguito &quot;Fornitore&quot;), contattabile all&apos;indirizzo <a href="mailto:legal@begift.app" style={{color:ACCENT}}>legal@begift.app</a>.</p>
        </Section>

        <Section title="2. Accettazione delle condizioni">
          <p>Utilizzando il Servizio, l&apos;utente dichiara di aver letto, compreso e accettato le presenti Condizioni d&apos;uso e la <Link href="/privacy" style={{color:ACCENT}}>Privacy Policy</Link>. Se l&apos;utente non accetta tali condizioni, è tenuto a non utilizzare il Servizio.</p>
          <p>Il Servizio è riservato a persone di età pari o superiore a 14 anni (o all&apos;età minima prevista dalla legge del paese di residenza per accettare termini contrattuali online senza consenso genitoriale).</p>
        </Section>

        <Section title="3. Registrazione e account">
          <p>Per creare regali, è necessario registrare un account tramite autenticazione via email (OTP) o provider OAuth (es. Google). L&apos;utente è responsabile della custodia delle proprie credenziali e di ogni attività svolta con il proprio account.</p>
        </Section>

        <Section title="4. Contenuti caricati e responsabilità dell'utente">
          <p>L&apos;utente che crea un regalo (&quot;Autore&quot;) è l&apos;unico responsabile dei contenuti che inserisce nel regalo, inclusi foto, video, PDF, link, testi e messaggi (di seguito &quot;Contenuti&quot;).</p>
          <p>L&apos;Autore garantisce di:</p>
          <ul>
            <li>essere titolare dei diritti su tutti i Contenuti caricati, o di averne acquisito le necessarie autorizzazioni;</li>
            <li>non caricare contenuti illegali, osceni, diffamatori, minacciosi, razzisti, sessisti, che incitino alla violenza o all&apos;odio, né contenuti che violino diritti di proprietà intellettuale o privacy di terzi;</li>
            <li>aver ottenuto il consenso di eventuali persone ritratte in foto o video caricati;</li>
            <li>non utilizzare il Servizio per diffondere spam, phishing, malware o qualsiasi altra forma di comunicazione ingannevole o illecita.</li>
          </ul>
          <p><strong>L&apos;Autore manleva il Fornitore</strong> da qualsiasi responsabilità, richiesta o rivendicazione di terzi derivante dai Contenuti caricati, incluse le spese legali.</p>
        </Section>

        <Section title="5. Contenuti vietati (zero tolerance)">
          <p>È severamente vietato utilizzare il Servizio per caricare, diffondere o facilitare i seguenti contenuti:</p>
          <ul>
            <li><strong>Materiale pedopornografico</strong> (CSAM) — art. 600-ter e seguenti del Codice Penale italiano;</li>
            <li><strong>Contenuti di terrorismo o apologia di atti di terrorismo;</strong></li>
            <li>Contenuti che promuovano violenza contro persone o gruppi, discriminazione su base razziale, etnica, religiosa, di genere o orientamento sessuale;</li>
            <li>Materiale che inciti all&apos;autolesionismo o al suicidio;</li>
            <li>Informazioni finalizzate alla commissione di reati (istigazione, coordinamento, occultamento);</li>
            <li>Diffusione di dati personali di terzi senza loro consenso (doxing), materiale intimo non consensuale (revenge porn);</li>
            <li>Contenuti che violino copyright, marchi o altri diritti di proprietà intellettuale.</li>
          </ul>
          <p>Il Fornitore si riserva il diritto — senza preavviso e senza obbligo di rimborso — di <strong>rimuovere qualsiasi contenuto</strong> ritenuto non conforme alle presenti condizioni e di <strong>sospendere o chiudere l&apos;account</strong> degli utenti responsabili. Nei casi previsti dalla legge, il Fornitore provvederà alla segnalazione alle autorità competenti (Polizia Postale, NCMEC o altre).</p>
        </Section>

        <Section title="6. Segnalazione di contenuti inappropriati">
          <p>Ogni regalo condiviso attraverso BeGift contiene, nella pagina di visualizzazione, un meccanismo di segnalazione (&quot;Segnala contenuto inappropriato&quot;) accessibile anche a visitatori non registrati.</p>
          <p>Le segnalazioni sono esaminate dal Fornitore nel più breve tempo possibile, generalmente entro 72 ore. Le categorie di segnalazione includono: contenuto illegale, disturbante, violazione privacy, copyright, spam, altro.</p>
          <p>In caso di segnalazione di contenuti manifestamente illegali, la rimozione avviene con priorità e, se necessario, viene disposta la segnalazione alle autorità competenti.</p>
          <p>Per segnalazioni particolarmente gravi (es. materiale pedopornografico), invitiamo inoltre a contattare direttamente la Polizia Postale italiana all&apos;indirizzo <a href="https://www.commissariatodips.it/" target="_blank" rel="noopener noreferrer" style={{color:ACCENT}}>commissariatodips.it</a>.</p>
        </Section>

        <Section title="6bis. Contenuti generati da intelligenza artificiale">
          <p>Il Servizio integra uno strumento di generazione assistita di messaggi basato su intelligenza artificiale (&quot;AI Message Helper&quot;, alimentato dal modello Claude di Anthropic). I suggerimenti prodotti dall&apos;IA sono chiaramente segnalati come tali nell&apos;interfaccia.</p>
          <p>L&apos;Utente è libero di utilizzare, modificare o ignorare tali suggerimenti; resta comunque l&apos;unico responsabile del contenuto finale del regalo inviato. Il Fornitore non garantisce la correttezza, l&apos;appropriatezza o l&apos;originalità dei suggerimenti generati dall&apos;IA e non assume responsabilità per eventuali errori, inesattezze o contenuti sensibili presenti negli output.</p>
          <p>Non viene effettuato alcun processo decisionale interamente automatizzato che produca effetti giuridici sull&apos;Utente (art. 22 GDPR).</p>
        </Section>

        <Section title="7. Proprietà intellettuale">
          <p>L&apos;Autore mantiene la piena proprietà intellettuale dei Contenuti caricati. Caricandoli su BeGift, concede al Fornitore una licenza gratuita, non esclusiva, limitata allo scopo di fornire il Servizio: archiviazione, trasmissione al destinatario, visualizzazione tramite il link univoco.</p>
          <p>Il marchio &quot;BeGift&quot;, il logo, i design, i template e i codici sono di proprietà del Fornitore e non possono essere utilizzati senza autorizzazione scritta.</p>
        </Section>

        <Section title="8. Disponibilità e limitazioni del servizio">
          <p>Il Servizio è fornito &quot;così com&apos;è&quot;, senza garanzie di disponibilità continuativa. Il Fornitore non è responsabile per interruzioni temporanee, perdita di dati, errori tecnici o malfunzionamenti, salvo i casi di dolo o colpa grave.</p>
          <p>Il Fornitore può introdurre modifiche o sospendere funzionalità del Servizio senza preavviso. Contenuti caricati possono essere conservati per un periodo limitato (attualmente indefinito, ma soggetto a policy futura di retention).</p>
        </Section>

        <Section title="9. Limitazione di responsabilità">
          <p>Fatti salvi i diritti inderogabili dell&apos;utente-consumatore ai sensi del Codice del Consumo (D.Lgs. 206/2005), il Fornitore non è responsabile per danni indiretti, perdita di profitti, perdita di dati o danni consequenziali derivanti dall&apos;uso o dall&apos;impossibilità di uso del Servizio.</p>
          <p>La responsabilità complessiva del Fornitore nei confronti dell&apos;utente, in ogni caso, non potrà superare il valore totale dei corrispettivi effettivamente versati dall&apos;utente nei 12 mesi precedenti l&apos;evento dannoso (attualmente €0 trattandosi di servizio gratuito).</p>
        </Section>

        <Section title="10. Dati personali">
          <p>Il trattamento dei dati personali è regolato dalla <Link href="/privacy" style={{color:ACCENT}}>Privacy Policy</Link>, che costituisce parte integrante delle presenti condizioni.</p>
        </Section>

        <Section title="11. Modifiche ai termini">
          <p>Il Fornitore si riserva il diritto di modificare le presenti Condizioni in qualsiasi momento. Le modifiche verranno comunicate tramite pubblicazione sulla presente pagina e, in caso di variazioni sostanziali, tramite email registrata o notifica in-app.</p>
          <p>L&apos;uso continuativo del Servizio dopo la pubblicazione delle modifiche costituisce accettazione delle nuove condizioni. Se l&apos;utente non accetta le modifiche, può smettere di usare il Servizio e richiedere la cancellazione dell&apos;account.</p>
        </Section>

        <Section title="12. Legge applicabile e foro competente">
          <p>Le presenti Condizioni sono regolate dalla legge italiana. Per qualsiasi controversia relativa all&apos;interpretazione, validità o esecuzione delle presenti Condizioni, sarà competente in via esclusiva il Foro del luogo di residenza del consumatore, ove la normativa di consumo lo preveda; in tutti gli altri casi, il Foro del luogo di domicilio del Fornitore.</p>
        </Section>

        <Section title="13. Contatti">
          <p>Per domande, segnalazioni o richieste legali: <a href="mailto:legal@begift.app" style={{color:ACCENT}}>legal@begift.app</a>.</p>
          <p>Per segnalazione di contenuti inappropriati (risposta entro 48h): <a href="mailto:abuse@begift.app" style={{color:ACCENT}}>abuse@begift.app</a>.</p>
          <p>Per richieste relative alla privacy: <a href="mailto:privacy@begift.app" style={{color:ACCENT}}>privacy@begift.app</a>.</p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: DEEP, margin: "0 0 10px" }}>{title}</h2>
      <div style={{ fontSize: 14, color: "#3a3a3a", lineHeight: 1.65 }}>
        {children}
      </div>
    </section>
  );
}
