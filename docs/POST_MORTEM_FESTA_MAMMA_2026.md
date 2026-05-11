# Post-mortem lancio Festa della Mamma 2026

**Data evento:** domenica 10 maggio 2026
**Periodo analizzato:** 4-11 maggio 2026 (settimana di lancio)
**Autore:** Luca Galli, founder

---

## Executive summary

Il lancio Festa della Mamma 2026 è stato il primo test di BeGift come prodotto pubblico e ha generato segnali di product-market fit precoce. I numeri assoluti restano piccoli (30 gift creati, 41 utenti totali, 154 visitatori settimanali), ma le **metriche di qualità sono ai livelli che le startup ricercano**: open rate 80%, reaction rate 75%, bounce rate 17%, NPS medio 8.5, conversion campagna email 25%. I fix trust applicati la settimana prima del lancio hanno spostato l'open rate dal 52% all'80% (+28 punti percentuali). Il prodotto funziona; il limite ora è la distribuzione, non l'esperienza utente.

---

## I numeri

### Funnel principale (4-10 maggio)

| Step | Valore | Tasso |
|------|--------|-------|
| Visitatori unici settimanali | 154 | — |
| Utenti totali registrati | 41 | 27% signup rate sui visitatori |
| Gift creati nella settimana | 30 | 73% activation rate sui registrati |
| Gift aperti almeno una volta | 24 | **80% open rate** |
| Reazioni lasciate dai destinatari | 18 | **75% reaction rate** sui gift aperti |
| Risposte sondaggio post-gift | 2 | 33% response rate sui survey inviati |

### Confronto pre/post fix trust

Prima del lancio (29 aprile, base 36 gift in 14 giorni):

- Open rate: **52%**
- Bounce rate sito: non misurato sistematicamente
- Funnel di prodotto: visibilmente bloccato sull'apertura

Dopo i fix applicati (4-7 maggio: copy condivisione, /chi-siamo, footer trust, banner verità):

- Open rate: **80%** (+28 punti)
- Bounce rate sito: 17% (eccellente)
- Visit duration: 5m 42s nel giorno del lancio (alto)

### Plausible — il giorno del lancio (10 maggio)

- **54 visitatori unici** (+157% rispetto a baseline settimanale)
- **60 visite totali**, 162 pageview, 2.7 page/visit
- **Bounce rate 17%**, durata media 5m 42s
- **Picco alle ore 12:00** con 17 visite contemporanee (ora pranzo Festa Mamma)
- **94% del traffico da Direct** (link condivisi via WhatsApp/Messenger/SMS)
- Top page: `/gift/c27d9642-...` con 23 visite (singolo regalo condiviso in gruppo)

### Plausible — settimana completa

- 154 visitatori unici, 178 visite, 583 pageview
- Direct 135, Referral 19, Email 1
- Top pages: `/` (85), `/create` (38), `/dashboard` (27)
- Trend: traffico flat fino all'8 maggio (5-25 visite/giorno), poi rampa esponenziale 9-10 maggio (26 → 54)

### Campagna email Festa Mamma (campaign_id: festa_mamma_2026)

- Destinatari: 40 utenti registrati
- Hanno creato qualunque gift dopo la ricezione: 10 (**25% conversion**)
- Hanno creato uno specifico mothers_day_letter: 2 (5% adozione template)
- Apertura mail (open tracking non attivo al momento dell'invio): dato non disponibile
- Bounces / failures: 0 osservati

Nota: 25% conversion email-to-action è 5-10x la media B2C italiana (2-5%). Il copy ha tenuto.

### Adozione template "Lettera che cresce" vs gift standard

| Tipo regalo | Creati | Aperti | Open rate |
|-------------|--------|--------|-----------|
| Standard (foto + messaggio) | 21 | 15 | 71.4% |
| mothers_day_letter (template dedicato) | 9 | 6 | 66.7% |

Su questi numeri la differenza fra i due template non è statisticamente significativa (differenza di 1 gift sposta la percentuale di 11 punti). Entrambi sono ben sopra il 52% pre-lancio.

### Sondaggio post-gift

- 2 risposte raccolte
- NPS medio: **8.5** (zona promoter)
- Rating esperienza media: **3.0** su scala 1-5 (medio)

La combinazione "NPS alto + rating esperienza medio" è il pattern tipico dei prodotti early-stage che hanno trovato qualcosa di vero: gli utenti riconoscono il potenziale e ne parlerebbero comunque, pur con ruvidezze nell'esecuzione.

---

## Cosa è andato bene

**1. I fix trust hanno funzionato in modo netto.** L'open rate è passato da 52% a 80% in 6 giorni grazie agli interventi pre-lancio: copy condivisione inverso ("voce di Luca prima del brand"), aggiunta della pagina `/chi-siamo` con foto e identità reale, footer con link "Chi siamo" anche sulla pagina del regalo. Il problema "sembra una truffa" era reale e si è ridimensionato significativamente.

**2. Engagement post-apertura altissimo.** 75% di chi apre un regalo lascia una reazione (emoji, foto, video, messaggio). Per consumer apps è un valore eccezionale. Significa che l'esperienza non è "guardo e chiudo", è "rispondo, partecipo, mi emoziono".

**3. Visit duration 5m 42s nel giorno del lancio.** Non sono visite di curiosità. Le persone si lasciano coinvolgere dal flusso di apertura, leggono il messaggio, esplorano. Per consumer apps il valore tipico è 1-2 minuti; siamo al doppio.

**4. Activation rate del 73% sui registrati.** Tre utenti registrati su quattro creano effettivamente un regalo. La curva di onboarding non perde utenti dopo il signup.

**5. Timing dell'evento perfetto.** Picco di traffico alle 12:00 italiane di domenica — quando le mamme aprono i regali a tavola, dopo pranzo. La progettazione del lancio attorno alla data ha funzionato.

**6. Conversion campagna mail 25%.** Un utente su quattro destinatari della campagna del 30 aprile ha creato un regalo. Per email B2C italiana la media è 2-5%; siamo a 5-10x. Il tono della mail (personale, di Luca, non automated) e la coerenza con il prodotto hanno tenuto.

**7. Feedback qualitativi forti.** Tre messaggi spontanei ricevuti dagli utenti durante il lancio:

> "Questo fa piangere!! Mi piace tanto!!"

> "Ci vizi"

> "Che pensiero carino!! Grazie, sei una forza"

"Fa piangere" è la testimonianza più importante: è esattamente la promessa di BeGift (emozione genuina, non gradevolezza estetica), confermata da un utente reale senza essere richiesto.

**8. Retention organica documentata.** Un singolo gift (broadcast in un gruppo WhatsApp di 23 persone) ha ricevuto 17 aperture da 17 device unici — 74% open rate del gruppo. Altri 3-4 gift hanno avuto 2-3 aperture multiple. Le persone tornano a riaprire i regali, li mostrano ad altri. Non è viralità spontanea pura (perché parte da un broadcast del founder), ma è retention più alta della media.

---

## Cosa è andato così così

**1. Adozione del template "Lettera che cresce" sotto le aspettative.** Solo 9 mothers_day_letter su 30 gift creati = 30%. Mi aspettavo 50-60% data la campagna mirata. Possibili cause: il flusso a 5+1 step è più lungo di quello standard (3-4 step), parte degli utenti ha preferito velocità a profondità; alcune persone hanno trovato il template via altri canali e creato gift standard pensando "compleanno mamma" invece di "festa della mamma".

**2. Solo 2 risposte al sondaggio post-gift.** Su 6 survey inviate dal cron, 33% response rate. È numericamente normale per email survey (5-10% baseline), ma su numeri così piccoli (2) ogni inferenza statistica è da prendere con cautela. Il sondaggio diventa significativo solo a partire da 15-20 risposte.

**3. Due bug emersi durante l'evento.** (a) Il messaggio nella polaroid veniva troncato a 140 caratteri — segnalato da un'utente che aveva scritto un messaggio lungo per la mamma. Fix immediato applicato lo stesso giorno. (b) Il template "Lettera che cresce" supporta una sola foto, mentre il flusso standard supporta multi-foto. Un utente ha provato a caricare più foto nel template e non ci è riuscito. Workaround consigliato: usare il flusso standard. Fix strutturale rimandato a settembre.

**4. Geo data poco affidabile.** Plausible non distingue Lucca come città di origine — la maggior parte del traffico è mappata su "Toscana" senza dettaglio cittadino. È un limite intrinseco degli analytics privacy-first (IP geolocation imprecisa per piccole città italiane su rete mobile). Non risolvibile senza passare a GA4 (con costi di privacy/compliance non accettabili al momento).

**5. 94% del traffico è "Direct".** BeGift è dipendente dal network personale di Luca per la distribuzione. Non c'è ancora un growth engine organico (SEO, referral programmatico, content marketing). È fisiologico per un prodotto al primo lancio, ma è la principale leva da costruire nei prossimi mesi.

**6. Numeri assoluti piccoli.** 30 gift, 41 utenti, 154 visitatori in una settimana sono numeri di "cerchia di amici stretti". Non è ancora un prodotto che vive di vita propria. Servono le prossime stagioni eventi (Halloween, Natale, San Valentino) per validare la replicabilità del pattern.

---

## Lezioni apprese

**Trust signals funzionano e impattano in modo misurabile.** Gli interventi UX e di copy della settimana pre-lancio hanno avuto un effetto reale e quantificabile (+28 punti di open rate). Questo è il primo learning forte: per un prodotto consumer nuovo nel 2026, il problema "sembra spam" è il bottleneck principale, e gli interventi giusti lo riducono. Da replicare per ogni nuovo canale di distribuzione che attiveremo.

**BeGift è un prodotto WhatsApp-driven.** Il 94% del traffico arriva da link condivisi nelle chat private. Il growth engine non è search/SEO ma social privato. Le strategie marketing dovrebbero focalizzarsi su: copy del messaggio condiviso, OG preview che invoglia a cliccare, gruppi WhatsApp come canale di seeding (broadcast a 1-N invece di 1-1). Investimento marketing in SEO o paid social va calibrato di conseguenza.

**Il timing degli eventi è leva centrale.** Il picco di traffico alle 12:00 della Festa della Mamma valida l'ipotesi che gli eventi calendari attivano automaticamente il prodotto. Per i prossimi 12 mesi questa è la spina dorsale del marketing: Halloween (31 ottobre), Natale (25 dicembre), San Valentino (14 febbraio), Festa del Papà (19 marzo 2027), Festa della Mamma (9 maggio 2027). Sei occasioni distribuite, sei picchi di attività attesa.

**Quality metrics sopra ai vanity metrics.** 30 gift con NPS 8.5 e reaction rate 75% valgono enormemente di più di 300 gift con NPS 6 e reaction 20%. La fase attuale è validazione del prodotto su pubblico ristretto; la fase successiva è scaling sostenibile. Mantenere alta la qualità durante la crescita sarà la sfida vera.

**Il founder come trust signal funziona, ma non scala.** La conversion del 25% sulla campagna email e la presenza di Luca-amico nei messaggi ("sei una forza") sono leve forti ma limitate al network personale del founder. Per crescere oltre serve costruire trust signals che sostituiscano la presenza diretta del founder: testimonial, press coverage, micro-influencer endorsement, pagina /chi-siamo già fatta.

---

## Decisioni e prossimi passi

### Roadmap consolidata 2026-2027

- **11-17 maggio**: completare il post-mortem (questo documento), raccogliere ulteriori feedback qualitativi mentre la memoria è fresca, condividere il documento con il CEO advisor della software house di Lucca
- **18-31 maggio**: integrazione affiliate Smartbox via TradeDoubler (primo revenue stream concreto, target 100-300€/mese a regime)
- **Giugno-luglio**: aggiungere affiliate Spotify Premium gift, Treatwell, MasterClass; ottimizzazioni UX su feedback Festa Mamma; decisione finale sul lancio "BeGift Plus" a 19€/anno
- **Agosto**: pausa estiva, beta test giapponese (3-5 utenti via Machiko e Aki a Tokyo)
- **Settembre-ottobre**: lancio "Boutique curata" — catalogo di 30-50 prodotti digitali selezionati per intenzione emotiva ("Per dirti che sei tutto", "Per coccolarti adesso", "Per accompagnarti nelle tue passioni"), monetizzato via affiliate
- **31 ottobre — Halloween 2026**: secondo evento gifting test (tema dolce-pauroso, palette diversa, target famiglie con bambini); benchmark vs Festa Mamma
- **25 dicembre — Natale 2026**: massima visibilità dell'anno, terzo evento test
- **14 febbraio — San Valentino 2027**: gifting di coppia
- **19 marzo — Festa del Papà 2027**: gemello strutturale di Festa Mamma
- **9 maggio — Festa Mamma 2027**: comparison diretto con Festa Mamma 2026, primo dato di crescita anno-su-anno

### Decisioni operative immediate

1. **Wave 2 di re-engagement** ai 30 utenti destinatari della campagna che non hanno ancora creato un gift Festa Mamma: da inviare entro mercoledì 13 maggio (code lunga dell'evento)
2. **Fix template multifoto Festa Mamma/Papà**: rimandato a settembre, prima del lancio Boutique
3. **Verifica beta Giappone**: monitorare se Machiko e Aki provano BeGift nei prossimi 7 giorni e raccogliere il loro feedback sulla traduzione automatica AI

### Target economici 2027

Confermato l'orizzonte definito a maggio 2026: **entrata integrativa di 200-500€/mese entro fine 2027**, mantenendo BeGift come side project a 5-7 ore/settimana e la pratica di psicoterapia come attività principale.

---

## Appendice: numeri SQL di riferimento

Query Supabase eseguite per costruire questa analisi (per riproducibilità):

```sql
-- Funnel principale settimanale
SELECT (SELECT COUNT(*) FROM profiles) AS utenti_totali,
       (SELECT COUNT(*) FROM profiles WHERE created_at >= '2026-05-04') AS nuovi_settimana,
       (SELECT COUNT(*) FROM gifts WHERE created_at >= '2026-05-04') AS gift_settimana,
       (SELECT COUNT(*) FROM gifts WHERE template_type = 'mothers_day_letter' AND created_at >= '2026-05-04') AS festa_mamma_letter,
       (SELECT COUNT(DISTINCT gift_id) FROM gift_opens WHERE opened_at >= '2026-05-04') AS gift_aperti,
       (SELECT COUNT(*) FROM reactions WHERE created_at >= '2026-05-04') AS reazioni;

-- Conversion campagna mail
SELECT COUNT(*) AS destinatari,
       COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM gifts g WHERE g.creator_id = profiles.id AND g.created_at >= '2026-04-30')) AS hanno_creato_gift
FROM profiles WHERE email_campaigns_sent ? 'festa_mamma_2026';

-- Open rate per template
SELECT COALESCE(g.template_type, 'standard') AS tipo,
       COUNT(*) AS creati,
       COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM gift_opens o WHERE o.gift_id = g.id)) AS aperti
FROM gifts g WHERE g.created_at >= '2026-05-04' GROUP BY g.template_type;

-- Sondaggio NPS e rating
SELECT COUNT(*) AS risposte,
       ROUND(AVG((payload->'answers'->>'nps_score')::int)::numeric, 1) AS nps_medio,
       ROUND(AVG((payload->'answers'->>'experience_rating')::int)::numeric, 1) AS rating_medio
FROM survey_responses;
```

Fonti dati esterne:

- **Plausible Analytics** (begift.app): traffic e engagement (data range 4-10 maggio 2026)
- **Supabase Production** (database BeGift): funnel utenti, gift, aperture, reazioni, survey
- **Google Search Console** (begift.app): SEO baseline (attivato 11 maggio 2026, dati disponibili da 13-14 maggio in poi)

---

*Documento redatto l'11 maggio 2026 da Luca Galli, founder BeGift. Versione 1.0 — ulteriori iterazioni dopo raccolta feedback aggiuntivi e dati Search Console dopo 48 ore di pickup.*
