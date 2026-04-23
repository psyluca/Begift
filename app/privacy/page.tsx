"use client";
import Link from "next/link";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

/**
 * Privacy Policy GDPR-completa per BeGift.
 *
 * Include:
 * - Titolare del trattamento + contatti
 * - Categorie di dati raccolti (esaustivo)
 * - Finalità + base giuridica per ciascuna (art. 6 GDPR)
 * - Processori / fornitori terzi con sede
 * - Trasferimenti extra-UE + garanzie (SCC)
 * - Periodi di conservazione per categoria
 * - Diritti dell'interessato (tutti quelli ex GDPR)
 * - Disclosure AI (art. 22 + EU AI Act)
 * - Trattamento minori + età minima
 * - Sicurezza
 * - Modifiche
 *
 * Questa versione è draft da sottoporre a revisione legale.
 * L'avvocato deve verificare:
 * - Identità titolare (sarà persona fisica o azienda?)
 * - Riferimento DPO (probabilmente non obbligatorio sotto certa scala)
 * - Adeguatezza trasferimenti USA post-Privacy Shield (Data Privacy Framework)
 * - Specificità sul trattamento dei dati del DESTINATARIO del regalo
 *   (caso complesso: l'utente registrato carica dati di una persona
 *   che non ha dato consenso direttamente a BeGift)
 */
export default function PrivacyPage() {
  return (
    <main style={{ minHeight:"100vh", background:LIGHT, fontFamily:"system-ui,sans-serif", paddingBottom:100 }}>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"32px 24px" }}>
        <Link href="/" style={{ fontSize:13, color:MUTED, textDecoration:"none" }}>← Torna alla home</Link>

        <h1 style={{ fontSize:28, fontWeight:800, color:DEEP, margin:"24px 0 6px" }}>Informativa sulla privacy</h1>
        <p style={{ fontSize:13, color:MUTED, marginBottom:8 }}>Ultimo aggiornamento: 23 aprile 2026</p>
        <p style={{ fontSize:12, color:MUTED, marginBottom:32, fontStyle:"italic" }}>
          La presente informativa è resa ai sensi dell&apos;art. 13 del Regolamento (UE) 2016/679 (&ldquo;GDPR&rdquo;) a tutti gli utenti che interagiscono con il servizio BeGift.
        </p>

        <Section title="1. Titolare del trattamento">
          <p>
            Il titolare del trattamento dei dati personali è <strong>Luca Galli</strong>, raggiungibile all&apos;indirizzo email <a href="mailto:privacy@begift.app" style={{color:ACCENT}}>privacy@begift.app</a>.
          </p>
          <p>
            Per segnalazioni relative a contenuti pubblicati da altri utenti (abusi, violazioni diritti d&apos;autore, contenuti illeciti) è disponibile l&apos;indirizzo dedicato <a href="mailto:abuse@begift.app" style={{color:ACCENT}}>abuse@begift.app</a>, con impegno di risposta entro 48 ore.
          </p>
        </Section>

        <Section title="2. Dati personali trattati">
          <p>BeGift tratta le seguenti categorie di dati personali:</p>
          <ul>
            <li><strong>Dati di registrazione:</strong> indirizzo email (o identificativo Google in caso di accesso con Google OAuth) e nome utente univoco (&ldquo;@handle&rdquo;) scelto in fase di onboarding.</li>
            <li><strong>Dati di profilo:</strong> nome visualizzato, preferenze linguistiche, preferenze sulle notifiche (ricezione regali, apertura, reazioni).</li>
            <li><strong>Contenuti creati:</strong> foto, video, file PDF, messaggi testuali, link URL caricati dall&apos;utente al fine di comporre un regalo digitale. Nome del destinatario (testo libero scelto dal mittente).</li>
            <li><strong>Metadati di utilizzo:</strong> timestamp creazione e apertura regali, identificativo device generato casualmente (salvato in localStorage), user agent del browser, pagina di provenienza.</li>
            <li><strong>Ricorrenze:</strong> date di compleanno/anniversario di terzi inserite volontariamente dall&apos;utente per ricevere promemoria (mese, giorno, nome destinatario).</li>
            <li><strong>Dati push notification:</strong> endpoint del servizio push del browser e chiavi crittografiche associate, user agent del device.</li>
            <li><strong>Log tecnici:</strong> indirizzo IP, log di errore, informazioni sessione; conservati per ragioni di sicurezza e diagnostica.</li>
          </ul>
          <p style={{marginTop:10}}>
            <strong>Nota sui dati dei destinatari.</strong> Quando un utente crea un regalo, inserisce un nome di destinatario e può caricare contenuti che riguardano la persona destinataria (foto, messaggi). Tali dati sono forniti volontariamente dal mittente sotto la propria responsabilità. Il destinatario può richiedere in qualsiasi momento la rimozione dei contenuti scrivendo a <a href="mailto:privacy@begift.app" style={{color:ACCENT}}>privacy@begift.app</a>.
          </p>
        </Section>

        <Section title="3. Finalità e base giuridica del trattamento">
          <p>I dati vengono trattati per le seguenti finalità, ciascuna con la sua specifica base giuridica ai sensi dell&apos;art. 6 GDPR:</p>
          <table style={{width:"100%", fontSize:13, borderCollapse:"collapse", marginTop:8}}>
            <thead>
              <tr style={{background:"#f0ece8"}}>
                <th style={{padding:"8px 10px", textAlign:"left", border:"1px solid #e0dbd5"}}>Finalità</th>
                <th style={{padding:"8px 10px", textAlign:"left", border:"1px solid #e0dbd5"}}>Base giuridica</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Erogare il servizio (creazione/condivisione/apertura regali)</td>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Esecuzione del contratto — art. 6(1)(b)</td>
              </tr>
              <tr>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Autenticazione utenti (magic link, Google OAuth)</td>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Esecuzione del contratto — art. 6(1)(b)</td>
              </tr>
              <tr>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Notifiche push (gift ricevuto, aperto, reazione)</td>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Consenso — art. 6(1)(a)</td>
              </tr>
              <tr>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Promemoria ricorrenze</td>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Consenso — art. 6(1)(a)</td>
              </tr>
              <tr>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Generazione suggerimenti messaggi tramite IA</td>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Esecuzione del contratto + consenso implicito all&apos;uso della funzione</td>
              </tr>
              <tr>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Rilevamento abusi, sicurezza, anti-spam</td>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Legittimo interesse — art. 6(1)(f)</td>
              </tr>
              <tr>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Adempimenti fiscali (quando sarà attiva la monetizzazione)</td>
                <td style={{padding:"8px 10px", border:"1px solid #e0dbd5"}}>Obbligo di legge — art. 6(1)(c)</td>
              </tr>
            </tbody>
          </table>
          <p style={{marginTop:10}}>
            I dati <strong>non</strong> vengono mai utilizzati per profilazione pubblicitaria o venduti a terzi per finalità di marketing.
          </p>
        </Section>

        <Section title="4. Processori e fornitori terzi">
          <p>
            Per erogare il servizio BeGift si avvale dei seguenti fornitori tecnici, tutti nominati responsabili del trattamento (art. 28 GDPR) o con cui è in vigore un accordo di protezione dati (Data Processing Agreement):
          </p>
          <ul>
            <li><strong>Supabase Inc.</strong> (USA, data center in Francoforte, Germania) — database, autenticazione e archiviazione file. Trasferimento extra-UE garantito da Standard Contractual Clauses (SCC) e dalla Data Privacy Framework (DPF) certification.</li>
            <li><strong>Vercel Inc.</strong> (USA) — hosting edge dell&apos;applicazione web. SCC + DPF.</li>
            <li><strong>Anthropic PBC</strong> (USA) — fornitore del modello di intelligenza artificiale Claude utilizzato per generare i suggerimenti di messaggi. I prompt inviati (nome destinatario, tono, occasione, contesto libero) sono trasmessi per l&apos;esecuzione della richiesta e non vengono usati per addestrare modelli (&ldquo;zero-retention&rdquo; API tier).</li>
            <li><strong>Google LLC</strong> (USA) — servizio di autenticazione OAuth (solo se l&apos;utente sceglie &ldquo;Accedi con Google&rdquo;).</li>
            <li><strong>Apple Inc. / Google LLC / Mozilla Foundation</strong> — servizi di push notification forniti dai browser/sistemi operativi per il recapito delle notifiche.</li>
          </ul>
          <p style={{marginTop:8}}>
            Nessun dato viene ceduto a terzi per finalità diverse dall&apos;erogazione del servizio.
          </p>
        </Section>

        <Section title="5. Trasferimenti extra-UE">
          <p>
            Alcuni dei fornitori tecnici sopra elencati hanno sede negli Stati Uniti. I trasferimenti di dati verso paesi extra-UE avvengono esclusivamente sulla base di garanzie adeguate (Standard Contractual Clauses, Data Privacy Framework) e limitatamente ai dati strettamente necessari all&apos;erogazione del servizio.
          </p>
        </Section>

        <Section title="6. Periodo di conservazione">
          <p>I dati vengono conservati per il tempo strettamente necessario alle finalità sopra descritte:</p>
          <ul>
            <li><strong>Account utente:</strong> finché l&apos;account è attivo. Cancellabile in qualsiasi momento dall&apos;utente.</li>
            <li><strong>Regali creati:</strong> finché il creatore non li elimina o cancella l&apos;account. In caso di cancellazione account, i regali correlati vengono automaticamente rimossi.</li>
            <li><strong>Log tecnici:</strong> 90 giorni massimo, salvo obbligo di conservazione per fini di accertamento abusi o richieste delle autorità.</li>
            <li><strong>Ricorrenze:</strong> finché l&apos;utente non le elimina.</li>
            <li><strong>Push subscription:</strong> fino alla revoca del permesso dal browser o fino al fallimento persistente (410/404 dal servizio push).</li>
            <li><strong>Dati fiscali:</strong> 10 anni come previsto dalla normativa fiscale italiana (quando applicabile).</li>
          </ul>
        </Section>

        <Section title="7. Intelligenza artificiale e processi decisionali automatizzati">
          <p>
            BeGift offre una funzionalità (&ldquo;AI Message Helper&rdquo;) che utilizza un modello di intelligenza artificiale (Claude di Anthropic) per generare suggerimenti di messaggi personalizzati. Questa funzionalità è sempre facoltativa: l&apos;utente può usare le proposte, modificarle o ignorarle.
          </p>
          <p>
            I contenuti generati dall&apos;IA sono chiaramente segnalati come tali all&apos;interno dell&apos;applicazione. Non viene effettuato alcun processo decisionale interamente automatizzato che produca effetti giuridici o incida significativamente sulla persona (art. 22 GDPR).
          </p>
        </Section>

        <Section title="8. Trattamento dei dati di minori">
          <p>
            BeGift è destinato a un pubblico di almeno <strong>16 anni</strong>, in conformità all&apos;art. 8 GDPR. L&apos;età viene richiesta al momento della registrazione. Non sono previsti trattamenti di dati di minori di 16 anni senza il consenso esercitato o autorizzato dal titolare della responsabilità genitoriale.
          </p>
          <p>
            Qualora si venga a conoscenza di un account riconducibile a un minore di 16 anni senza adeguato consenso, l&apos;account e i dati associati verranno rimossi prontamente. Segnalazioni in merito possono essere inviate a <a href="mailto:privacy@begift.app" style={{color:ACCENT}}>privacy@begift.app</a>.
          </p>
        </Section>

        <Section title="9. Diritti dell'interessato">
          <p>In conformità agli artt. 15-22 del GDPR, ogni interessato ha diritto di:</p>
          <ul>
            <li><strong>Accedere</strong> ai propri dati personali e ottenerne copia.</li>
            <li><strong>Rettificare</strong> dati inesatti o incompleti.</li>
            <li><strong>Richiedere la cancellazione</strong> (&ldquo;diritto all&apos;oblio&rdquo;).</li>
            <li><strong>Limitare</strong> il trattamento in specifici casi.</li>
            <li><strong>Opporsi</strong> al trattamento fondato su legittimo interesse.</li>
            <li><strong>Ricevere</strong> i propri dati in un formato strutturato, di uso comune e leggibile da dispositivo automatico (portabilità).</li>
            <li><strong>Revocare il consenso</strong> in qualsiasi momento, senza pregiudicare la liceità del trattamento precedente.</li>
            <li><strong>Proporre reclamo</strong> all&apos;Autorità Garante per la protezione dei dati personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener" style={{color:ACCENT}}>www.garanteprivacy.it</a>).</li>
          </ul>
          <p style={{marginTop:10}}>
            Per esercitare questi diritti scrivere a <a href="mailto:privacy@begift.app" style={{color:ACCENT}}>privacy@begift.app</a>. La risposta avverrà senza ingiustificato ritardo e comunque entro 30 giorni.
          </p>
        </Section>

        <Section title="10. Cookie e tecnologie simili">
          <p>
            BeGift utilizza principalmente <strong>cookie tecnici</strong>, necessari al funzionamento del servizio (sessione, autenticazione, preferenze linguistiche) e non soggetti a consenso preventivo ai sensi del Provvedimento del Garante sulle linee guida cookie.
          </p>
          <p>
            L&apos;applicazione non utilizza cookie di profilazione pubblicitaria o di tracciamento cross-site. Il dettaglio delle categorie e la gestione del consenso sono disponibili nel banner cookie.
          </p>
        </Section>

        <Section title="11. Sicurezza">
          <p>
            I dati sono protetti da misure tecniche e organizzative adeguate, tra cui: cifratura in transito (TLS 1.3) e a riposo (AES-256 sui provider cloud), autenticazione multi-fattore per gli accessi amministrativi, controllo accessi Row-Level Security (RLS) a livello database, backup periodici, monitoring di sicurezza. Eventuali violazioni di dati saranno notificate al Garante e agli interessati coinvolti entro 72 ore, ai sensi degli artt. 33-34 GDPR.
          </p>
        </Section>

        <Section title="12. Modifiche alla presente informativa">
          <p>
            Questa informativa può essere aggiornata per motivi normativi o evolutivi del servizio. Le modifiche sostanziali saranno comunicate via email agli utenti registrati o mediante avviso nell&apos;applicazione almeno 7 giorni prima della loro entrata in vigore. La versione vigente è sempre consultabile all&apos;indirizzo <a href="/privacy" style={{color:ACCENT}}>/privacy</a>.
          </p>
        </Section>

        <div style={{ marginTop:40, padding:"20px 0", borderTop:"1px solid #e0dbd5", textAlign:"center" }}>
          <p style={{ fontSize:12, color:MUTED }}>BeGift — <a href="mailto:privacy@begift.app" style={{color:ACCENT}}>privacy@begift.app</a> · <a href="mailto:abuse@begift.app" style={{color:ACCENT}}>abuse@begift.app</a></p>
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
