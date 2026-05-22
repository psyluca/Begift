# BeGift — Piano Growth verso 100k visitor/mese

> Data: 2026-05-21
> Branch: feature/overnight-revamp
> Autore: scritto durante overnight session per Luca
> Stato: piano operativo iniziale, da iterare con dati reali una volta partito

## Premessa

100k visit/mese (≈3.300 visitor unici/giorno) è la **soglia tecnica** per sbloccare la GetYourGuide Partner API ([requirements ufficiali](https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements)). È anche la soglia che fa di BeGift un'**alternativa credibile** ai concorrenti italiani diretti (Amoore, Sneaky.it, Reginplum) — sotto i 30k il prodotto resta "side project", sopra i 100k diventa una piattaforma con leverage.

**Stato attuale (stima conservativa 2026-05-21):** sotto i 5k visit/mese, traffico prevalentemente diretto (amici, beta tester, Luca stesso). Nessun canale di acquisizione scalabile attivo.

**Target:** 100k visit/mese **entro Q2 2027** (12 mesi). Stretch goal: 100k entro Festa della Mamma 2027 (10 maggio 2027 = 11.5 mesi).

**Vincoli reali da memoria:**
- Side project, 5-7h/settimana (Luca ha lavoro principale)
- Budget marketing limitato (target side-income €200-500/mese entro 2027, quindi reinvestire prudentemente)
- Mercato primario: Italia (lingua + occasioni gifting locali)
- No exit, no investitori, no VC pressure — crescita organica sostenibile

Sotto questi vincoli, la strategia è **massimizzare ROI orario**: ogni ora di Luca deve produrre traffico ripetibile, non lavoro one-shot.

## La matematica essenziale

| Canale | Visit medio/post | Frequenza realistica | Visit/mese stimato |
|---|---|---|---|
| SEO occasion-pages (cluster 30 pagine) | 200-2k/mese stabile | One-shot per pagina | 6k-60k (cresce nel tempo) |
| Instagram organico (reel virali) | 5k-50k/reel virale | 1 viral/mese su 8 reel | 5k-50k |
| Partnership con creator IT (gifting niche) | 2k-20k/post | 2 partnership/trimestre | 4k-40k/mese annualizzato |
| Quora/Reddit answer (slow burn) | 100-500/mese stabile | 5 risposte ottimizzate | 2k-5k |
| Newsletter referral (chain effect) | dipende user base | passive | 1k-10k (cresce con base) |
| Press/PR (un articolo Repubblica/Vanity) | 5k-50k spike | 1-2/anno | spike one-shot |

**Strategia portfolio**: combinare 4-5 canali di volume diverso. Nessun canale single-point-of-failure. La SEO è il pilastro (passivo, scalabile), tutto il resto è amplification.

## Pilastro 1 — SEO occasion-driven (60% dell'effort)

L'asset più sottovalutato di BeGift è il **dominio gifting in italiano**: il mercato italiano è meno competitivo del US, con keyword long-tail ad alto intent commerciale e poca concorrenza tecnica.

### Strategia editoriale

Costruire un cluster di **30 landing page occasion-driven** entro 12 mesi. Ogni pagina:

- Target: una keyword specifica (es. "regalo per la festa della mamma 2027", "cosa regalare a un ragazzo che ama lo sport", "regalo originale ultimo minuto online")
- Lunghezza: 1500-2500 parole
- Struttura: H1 — H2 contesto → H2 lista regali concreti BeGift → H2 FAQ → CTA
- Internal linking: ogni landing linka 3-5 occasion correlate
- Schema.org: HowTo o Article markup per featured snippet

**Pagine prioritarie da costruire (in ordine di lancio):**

| Lancio | Pagina | Keyword target | Volume mensile IT (stima) |
|---|---|---|---|
| Settimana 22 (Giu 2026) | /regalo-per-festa-papa | regalo festa del papà | 50k |
| Settimana 24 | /regali-anniversario-online | regali anniversario | 30k |
| Settimana 28 | /regalo-laurea-originale | regalo laurea | 22k |
| Settimana 32 | /regali-compleanno-amica | regali compleanno amica | 60k |
| Settimana 35 | /halloween-regali-bambini | (occasione specifica) | 12k |
| Settimana 40 | /natale-regali-originali-2026 | regali natale originali | 200k (pic dicembre) |
| Settimana 43 | /regali-natale-fidanzato | regali natale fidanzato | 40k |
| Settimana 44 | /regali-natale-genitori | regali natale genitori | 30k |
| Settimana 45 | /regalo-natale-cognata | (long-tail bassa concorrenza) | 5k |
| Settimana 48 | /regali-ultimo-minuto-online | regali ultimo minuto | 70k |
| Settimana 50 | /regali-befana-originali | regali befana | 35k |
| Settimana 2 (Gen 2027) | /regali-san-valentino-2027 | regali san valentino | 180k (pic febbraio) |
| Settimana 5 | /regalo-san-valentino-distanza | regalo distanza | 8k |
| Settimana 8 | /regali-festa-donna | regali festa della donna | 60k |
| Settimana 10 | /regali-festa-papa-2027 | (refresh annuale) | 50k |
| Settimana 14 | /regalo-pasqua-originale | regalo pasqua | 25k |
| Settimana 18 | /regali-festa-mamma-2027 | regali festa della mamma | 200k (pic maggio) |

**17 pagine in 12 mesi = ~2/mese**: realistico con 3-4h dedicate ogni 2 settimane.

### Pattern di pagina ottimale

Ogni occasion-page deve fare 3 cose:

1. **Catturare la SERP**: header + intro densi di intent ("Cerchi un regalo per la festa della mamma 2027? Ecco N idee testate, dalle classiche alle originali, con consegna in tempo."). Lista numerata (Google ama le liste).

2. **Convertire visit in regalo**: ogni "idea regalo" è una card cliccabile che apre BeGift `/regalo/catalogo?tipo=X&citta=Y` precompilato con i filtri giusti. Riduci scelta dell'utente.

3. **Recall via brand**: i visitor che non comprano oggi devono ricordarsi del nome "BeGift" per quando ne avranno bisogno. Tagline coerente, CTA secondario "Salva per dopo" (email capture light).

### Tools tecnici da implementare

- Una pagina riusabile `/regalo-per/[occasion]` con MDX o data-driven (basata su seed `occasion_templates`)
- Sitemap.xml dinamico che include le 30 occasion-pages
- robots.txt corretto + structured data (Schema.org)
- Open Graph image dinamica per ogni pagina (Vercel @vercel/og)
- Pagespeed > 90 (Vercel image optimization, fonts preconnect, no JS inutile)
- Analytics evento "occasion_page_view" + "occasion_page_to_catalog_click"

### Quanto traffico SEO realistico tra 12 mesi

Con 17 pagine ben fatte, traffico organico stabile dopo 6 mesi di indexing:
- 17 pagine × media 1.500 visit/mese = **25.500 visit/mese da SEO**
- Pagine "evergreen" (compleanno amica, anniversario) tendono a crescere; pagine "stagionali" (Natale) spike-and-die ma con peak elevato
- Realistic 12-month SEO total: 25-40k/mese

**Da soli SEO non bastano**: servono altri 60k/mese da altri canali.

## Pilastro 2 — Instagram organico (20% dell'effort)

Instagram è il canale numero 1 dove le persone italiane scoprono brand di gifting (osservazione mercato 2025-2026).

### Format e cadenza

- **Reel verticali 9:16** (Reel è quello che Instagram spinge nel feed).
- **Cadenza: 3 reel/settimana** (lunedì/mercoledì/venerdì sera, picchi di engagement).
- **Durata: 8-15 secondi** (sweet spot per replay rate).
- **Audio: trending sounds italiani** + voiceover Luca brevissimo.

### Format vincenti per BeGift

| Format | Esempio concreto | Frequenza |
|---|---|---|
| "Apertura pacco POV" | Camera che mostra qualcuno che apre BeGift su iPhone, reazione genuina | 1/settimana |
| "5 idee regalo per X" | Carousel + reel rapidi su 5 occasioni | 1/settimana |
| "Behind the scenes founder" | Luca che mostra come è nata l'idea, dietro le quinte | 1/2 settimane |
| "Story time" | Storia vera di un regalo BeGift particolare ricevuto da utente | 1/2 settimane |
| "Confronto: regalo classico vs BeGift" | Pacco fisico anonimo vs animazione BeGift | 1/mese |

### Cosa NON fare

- ❌ Foto statiche del logo (zero engagement)
- ❌ "Annunci" prodotto come banner (alg ti penalizza)
- ❌ Stitch/duetti generici virali (nessun connect col brand)

### Obiettivo realistico

Crescita IG da 0 a 5k follower in 12 mesi (4 reel/settimana con 10-15% di reel che fanno 5-20k view). Traffico verso begift.app: 5-8k/mese stabile dopo 6 mesi.

## Pilastro 3 — Partnership creator IT (10%)

Identificare 10-15 creator italiani nicchia "gifting/lifestyle" con 5k-50k follower (sweet spot engagement/costo).

### Selection criteria

- Audience prevalentemente italiana
- Engagement rate > 4% (filtro fake follower)
- Contenuto coerente con gift-emotional (NO finance, fitness estremo, polemiche politiche)
- Disposti a fare partnership in cambio di prodotto/feature gratuita (BeGift Premium gratis 12 mesi) + €50-150 cash

### Format partnership

- "Story regalo reale": creator usa BeGift per un regalo vero (es. al partner), screen recording, ne parla in story serie 4-5 frame
- "Reel dimostrativo": creator mostra il flusso completo in 30 secondi, CTA in caption + bio
- Non chiedere mai "review" del prodotto (vibe falsa): chiedere uso reale

### Tracking

- Codice referral per creator (es. `?ref=@silvietta`)
- 30% del compenso a deliverable, 70% basato su conversion entro 30gg (incentivo qualità)

### Budget mensile

€200-300/mese in cash + 2-3h/mese di coordinamento. Realistico: 2 partnership/mese, ognuna porta 2-5k visit.

## Pilastro 4 — Slow burn channels (10%)

### Quora IT

Rispondere a 5 domande/mese con risposte molto curate (500-800 parole). Esempi:
- "Quali sono le migliori app per regali a distanza?"
- "Come fare un regalo originale senza budget?"
- "Cosa regalare a una persona che ha già tutto?"

Ogni risposta ben fatta porta 100-500 visit/mese stabili (l'algo di Quora favorisce risposte longeve).

### Reddit (r/italia, r/Italia, r/AskItalia)

Più delicato (anti-spam policy). Strategia: rispondere a thread spontanei dove qualcuno chiede consigli regalo. Non shillare. Costruire karma del proprio account per 3 mesi prima di menzionare BeGift.

### Email newsletter

Tutti i sender che fanno 1+ regalo entrano in una newsletter mensile "1 idea regalo per i prossimi 30 giorni". CTR atteso 5-10%, retention loop.

### Press hook periodico

Pitch ai media italiani in momenti opportuni:
- Marzo: Festa Donna + Pasqua "regali ultimo minuto digitali"
- Maggio: Festa Mamma "tecnologia + emozione"  
- Dicembre: "regalare in tempi di inflazione"

Outlet target: Wired Italia, Repubblica Tech, Esquire Italia, Vanity Fair, Cosmopolitan. Pitch via email diretta ai redattori (non via PR agency, troppa friction).

## Pilastro 5 — Virality intrinseca (continua)

Le features già in BeGift hanno tutte un meccanismo virale latente. Da rinforzare:

### Gift Chain (esistente)

Quando un utente APRE un regalo BeGift, in fondo c'è CTA "Vuoi fare un regalo anche tu?". Già implementato (memoria onda2). Da ottimizzare:
- A/B test del wording: "Anche tu hai qualcuno a cui vuoi pensare?" vs "Continua la catena: il prossimo a chi lo fai?"
- Misurare gift_chain_conversion (% di chi apre → crea)

### WhatsApp deeplink (esistente)

Share su WhatsApp con preview ricca (OG image). Già live. Iterazione: testare 3 varianti di copy per il messaggio precompilato (sobrio, emotivo, divertente).

### Open Graph dinamico

Quando un regalo viene condiviso, il preview OG deve catturare. Già pensato. Iterazione: includere nome destinatario e occasione nella OG image generata (es. "Un regalo per Sara, da Marco").

### Reazioni emoji al regalo

Memoria onda2: già implementato. La reaction → notifica al sender → potenzialmente lo riengage a fare un altro regalo.

## Calendario delle iniziative — prossimi 12 mesi

### Q3 2026 (giugno-agosto) — foundation

**Obiettivo trimestre: 5k → 15k visit/mese**

- Settimane 22-26: 4 occasion-pages SEO (festa papà 2026, anniversario, laurea, compleanno amica)
- Setup Instagram account brand + prime 12 reel
- Setup Quora account + prime 5 risposte
- Audit completo SEO tecnico (sitemap, robots.txt, schema.org, pagespeed)
- Lancio newsletter mensile

### Q4 2026 (sett-nov) — pre-Christmas warm-up

**Obiettivo trimestre: 15k → 40k visit/mese**

- Settimane 35-42: 5 occasion-pages (Halloween, primi Christmas, Black Friday gift guide)
- Instagram cadenza piena (3 reel/settimana)
- Prima partnership creator (target: nicchia coppie)
- Pitch press novembre per articoli "regali natale 2026"

### Q4 2026 dicembre — peak Christmas

**Obiettivo dicembre: 40k → 80k visit/mese** (spike Natale)

- 3 occasion-pages Natale ad alto volume keyword
- Push aggressivo Instagram (3 reel/settimana + 5 carousel)
- 3 partnership creator nicchia diverse (coppie / amiche / genitori)
- Newsletter retention loop attiva

### Q1 2027 (gen-mar) — momentum

**Obiettivo trimestre: 70k → 90k visit/mese**

- Settimane 1-12: 5 occasion-pages (Befana, San Valentino, Festa Donna, Festa Papà 2027)
- San Valentino e Festa Papà 2027 sono i picchi del trimestre — massimo push paid + organic
- 2-3 partnership creator
- Pitch press febbraio per "San Valentino tech-emotional"

### Q2 2027 (apr-mag) — target reached

**Obiettivo: 100k+ visit/mese entro Festa Mamma 2027 (10 maggio)**

- Occasion-page Pasqua + Festa Mamma 2027 (la più importante dell'anno)
- Pitch press aprile su "regali festa mamma originali 2027"
- SEO matura (tutte le 17 pagine indicizzate da 6+ mesi)
- Instagram a 5k+ follower
- Newsletter a 2-3k iscritti

A questo punto: **sblocco GYG Partner API**, catalogo passa a 3k+ esperienze automatico, value proposition di BeGift fa salto di qualità.

## Metriche chiave da tracciare

Ogni settimana, riportare in un singolo dashboard:

| Metrica | Target Q3 2026 | Target Q4 2026 | Target Q2 2027 |
|---|---|---|---|
| Visit unici/mese | 15k | 40k | 100k+ |
| Sessioni totali/mese | 25k | 70k | 180k+ |
| Tasso bounce home | <60% | <55% | <50% |
| Conversion visit → regalo creato | 1.5% | 2% | 3% |
| Regali creati/mese | 200 | 700 | 2.500+ |
| Tasso open destinatario | >80% | >82% | >85% |
| Tasso apertura → reazione | >30% | >35% | >40% |
| Gift chain conversion | 5% | 7% | 10% |
| Newsletter iscritti | 200 | 800 | 2.500+ |
| IG follower | 500 | 1.500 | 5.000 |
| Posizione SERP "festa mamma regali" | top 100 | top 30 | top 10 |

## Iniziative settimanali ricorrenti

Ogni settimana, blocchi di 5-7h totali distribuiti:

| Lunedì 1h | Martedì 30m | Mercoledì 1h | Giovedì 30m | Venerdì 1h | Sabato 30m | Domenica 2h |
|---|---|---|---|---|---|---|
| 1 reel IG | check metrics | Q&A Quora | community DM | 1 reel IG | newsletter draft | SEO occasion page |

5.5h/settimana stabili. Tutto il resto (partnership, press pitch, audit, ecc.) è "bonus" su sprint dedicati.

## Budget mensile realistico

| Voce | Spesa mensile | Note |
|---|---|---|
| Tool SEO (Ahrefs Lite o SEMrush base) | €30 | Solo da Q4 2026 |
| Partnership creator | €200-300 | Da Q4 in poi |
| Ads boost reel Instagram (sperimentale) | €0-100 | Solo per reel già organicamente promettenti |
| Vercel/Supabase upgrade tier (se serve) | €0-50 | Solo a 50k+ visit/mese |
| **Totale** | **€230-480/mese** | A regime |

Cash positive da Q1 2027 con 700+ regali/mese e commissioni affiliate medie €1.50/gift = €1k+/mese revenue. ROI marketing > 2x.

## Rischi e mitigations

| Rischio | Probabilità | Mitigation |
|---|---|---|
| Burnout Luca con cadenza IG | Alta | Batch produzione (1 sabato/mese = 12 reel del mese) |
| Algoritmo IG cambia | Media | Diversify: TikTok come backup parallelo |
| Concorrente (Amoore) prende posizioni SEO | Alta | Velocità: 2 pagine/mese da subito, prima loro |
| Penalty Google su content "thin" | Media | Ogni occasion-page minimo 1500 parole + valore vero |
| GYG cambia threshold API | Bassa | Plan B: continuare con Awin feed |

## Cosa NON fare

Tentazioni da evitare:

- ❌ **Paid ads Google/Meta su larga scala**: CAC troppo alto per side-project budget. Solo retargeting micro.
- ❌ **App nativa iOS/Android prima dei 100k**: distribuzione costosa, PWA basta.
- ❌ **Inseguire feature richieste da power user**: 80/20, focus su acquisizione casual user.
- ❌ **Pivoting verso B2B prima di lock B2C**: il tema massaggiatrice è esperimento, non priorità.
- ❌ **Aprire a internazionale prima di dominare IT**: ogni paese richiede landing pages localizzate, content team, partnership locali.

## Iniziative "guerrilla" opportunistiche

Cose da tenere d'occhio per surge una-tantum:

- **BTS Italia tour announcement**: pre-built occasion template "Regala biglietto BTS", ready in 24h dall'annuncio (vedi memoria BTS opportunity). Potenziale 50-100k visit nelle ore successive.
- **Eventi tipo Sanremo, Eurovision, finali Champions**: occasion-page "Regala biglietto finale X" pubblicata 7 giorni prima.
- **Notizie su difficoltà del gifting "tradizionale"**: es. articolo "i regali brutti del Natale fanno male all'ambiente" → BeGift come alternativa.
- **Conoscenze relazionali Luca**: CEO VivaTicket, CEO TicketOne — partnership editoriali (BeGift = unico gift-tool ufficiale per il loro evento del mese).

## Conclusione

100k visit/mese in 12 mesi è raggiungibile con disciplina, non con genialità.

Il fattore decisivo è la **costanza settimanale dei 5-7h dedicati**: una settimana saltata su SEO è una pagina occasion che esce 2 settimane dopo, è la finestra Festa Mamma persa, è il momentum spezzato.

Il piano è prudente sui canali (4 pilastri diversificati), ambizioso sul tempo (target end Q2 2027 ma con stretch a maggio 2027). Lasciare spazio per opportunità (BTS, press, partnership inattese) senza dipenderci.

> "100k è una soglia. La vera fine non è quella, ma far diventare BeGift l'app che gli italiani aprono ogni volta che devono fare un regalo. La soglia è il segnale che la macchina funziona da sola."

---

**Prossimo step concreto questa settimana**: avviare la prima occasion-page (`/regalo-festa-papa-2026`). Vedi `docs/strategy/SEO_OCCASION_PAGE_TEMPLATE.md` (TODO post-overnight) per il template.

Aggiornare questo doc trimestralmente con i numeri reali.
