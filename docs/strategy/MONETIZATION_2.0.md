# BeGift — Monetization 2.0

**Data**: 2026-05-16 (notte autonoma)
**Status**: Brainstorm strategico, da validare con Luca
**Contesto**: Target 200-500€/mese entro 2027 (memoria monetization_path). Canale affiliate GYG/Awin/TradeDoubler già aperto, ma serve diversificare per resilienza e crescita.

---

## TL;DR — Ranking di realismo

Ho mappato 8 modelli di revenue alternativi/complementari, valutati su 4 dimensioni:

- **Time-to-revenue** (mesi prima di vedere €)
- **Effort** (ore di sviluppo + manutenzione)
- **Revenue cap** (potenziale massimo realistico a 12-18 mesi)
- **Fit con BeGift** (allineamento col brand emozionale gifting)

| # | Modello | TTR | Effort | Cap 12m | Fit |
|---|---|---|---|---|---|
| 1 | **Affiliate scaling** (già fatto) | Subito | Basso (manutenz.) | €500-2000/mese | ⭐⭐⭐⭐⭐ |
| 2 | **B2B / Corporate gifting** | 3-6 mesi | Medio | €2000-8000/mese | ⭐⭐⭐⭐ |
| 3 | **BeGift Plus** (premium) | 6-12 mesi | Alto | €500-3000/mese | ⭐⭐⭐⭐ |
| 4 | **Marketplace verticale curato** | 6-9 mesi | Alto | €1000-5000/mese | ⭐⭐⭐⭐ |
| 5 | **White-label "wrapping as a service"** | 6 mesi | Alto | €500-2000/mese | ⭐⭐⭐ |
| 6 | **Brand integrations** (sponsorizzati) | 6-12 mesi | Medio | €300-1500/mese | ⭐⭐ |
| 7 | **Wedding / event registry** | 9-12 mesi | Alto | €500-2500/mese | ⭐⭐⭐ |
| 8 | **NFT / token gifts** | Indef. | Molto alto | Variabile | ⭐ |

**Mia raccomandazione operativa per i prossimi 6 mesi:**
1. Continuare a investire su (1) affiliate scaling. Si scala con poco.
2. Iniziare a posizionarsi su (2) B2B in parallelo, perché ha il revenue cap più alto e BeGift è perfetto per gifting aziendale.
3. Tutto il resto: parking lot, da rivalutare a 6 mesi quando avrai dati d'uso reali.

---

## 1. Affiliate scaling (consolidamento)

**Cosa**: Continuare il modello attuale (commissione su esperienze regalate via parser email o catalogo /discover), ma estendere copertura.

**Cosa serve da fare:**
- Aggiungere 50+ esperienze al catalogo (ora ce ne sono 18) coprendo:
  - Tutte le città capoluogo IT (Bologna, Verona, Palermo, Bari, Genova...)
  - Categorie sotto-rappresentate (kids/family, sport adrenalinico, kayak/SUP)
  - Esperienze internazionali per chi viaggia (Tokyo, NY, Barcellona)
- Attivare Awin merchant: Smartbox, Booking, Decathlon, IKEA per coprire categorie diverse da GYG
- A/B test su `/start` per capire quale categoria converte di più
- Email automation: dopo apertura gift, mail al destinatario con "Hai amato questo? Guarda esperienze simili" (re-engagement)

**Stime:**
- AOV €50-80, commissione media 6-8%
- Conversion click→buy 8-12% (industria)
- 30 gift/giorno con esperienza × 6% × €60 × 10% = **~€30/giorno = €900/mese** se scali correttamente

**Rischi:**
- Dipendenza da policy partner (vedi Rakuten + TradeDoubler/TicketOne denied)
- Conversion crolla se le esperienze del catalogo non sono "wow"

**Effort tuo**: 2-3h/settimana per curation continua.

---

## 2. B2B / Corporate gifting ⭐ TOP PICK

**Cosa**: Vendere BeGift alle aziende per:
- Regali di Natale ai dipendenti (storicamente cesti orribili da €30/persona)
- Welcome kit nuovi assunti
- Celebrazioni anniversari aziendali, promotion, milestone progetti
- Customer retention (regali ai clienti fedeli)

**Perché BeGift è perfetto:**
- L'azienda non sa cosa regalare → tu hai catalogo curato
- HR vuole qualcosa "personalizzato" → BeGift ha messaggi AI ottimo per scrivere bulk con nome
- Volumi medi: 20-200 dipendenti per azienda × €40-80/regalo = **€800-16k per cliente B2B**
- Buyer cycle: 1-2 incontri, basso friction (no consenso GDPR pesante perché è B2B)

**Cosa serve da costruire:**
- Pagina `/business` o `/aziende` con caso d'uso + form contatto
- Dashboard B2B: l'HR carica un CSV (`nome, email, occasione`) → BeGift genera 100 gift in un click
- API/integrazione per provisioning automatico
- Pricing per fascia: €5/regalo (50-200), €4/regalo (>200), €3/regalo (>500)
- Co-branding (logo aziendale nel pacchetto)

**Stime conservative:**
- 5 aziende clienti al primo anno × media €1500/azienda/anno = **€7500/anno** = **€625/mese**
- 20 aziende clienti al secondo anno = **€2500/mese**

**Effort iniziale**: 60-80h per build dashboard B2B + landing + 1 cliente pilota.
**Effort manutenzione**: 5-10h/settimana (sales + onboarding clienti).

**Come iniziare**:
1. Identifica 5 aziende vicine a te (Lucca/Toscana) che fanno regali ai dipendenti
2. Offri pilot gratis a 1 → ti dà case study + testimonial
3. Pricing solo dopo aver visto cosa funziona

**Risk minore**: la stagione è concentrata su Natale (~50% del fatturato). Smussare con Festa Mamma corporate, ricorrenze anniversari aziendali.

---

## 3. BeGift Plus (modello freemium)

**Cosa**: Tier premium €4.99-9.99/mese o one-time €19.99 per gift.

**Cosa ottiene chi paga:**
- Packaging "cinematici" esclusivi (animazioni 3D, scene custom)
- AI message in stili diversi (poetico, divertente, formale, drammatico) con generazione illimitata
- Voice cloning del sender (la tua voce nel messaggio audio)
- Multi-recipient gift (10+ destinatari con un click)
- Custom domain (begift.app/da/lucagalli/maria/compleanno)
- Statistiche dettagliate apertura (orario, dispositivo, reazione)
- Nessun branding BeGift sul gift (white-label per uso pro)

**Stime:**
- 1% conversion free→paid (industria SaaS B2C)
- Su 1000 utenti free attivi → 10 paganti × €7 = **€70/mese**
- Cresce con base utenti: 10k attivi → 100 paganti = €700/mese

**Effort:**
- 40-60h per implementare 1-2 feature premium killer + Stripe checkout
- Manutenzione: 2-4h/mese

**Rischi:**
- Se base utenti free non cresce → nessun conversion da convertire
- "Premium che fa cinematic" facile da copiare quando avrai successo
- Pricing wars con altri gift app

**Quando attivarlo**: solo se hai >1000 utenti free attivi/mese (avresti dati per validare). Pre-quel-threshold è prematuro.

---

## 4. Marketplace verticale curato (no affiliate, vendita diretta)

**Cosa**: Tu (o partner) vendi direttamente esperienze esclusive sulla piattaforma BeGift. Commissione 15-25% (vs 5-8% affiliate).

**Esempi**:
- "Cena privata con chef stellato a Lucca" — partnership con 2-3 chef locali, BeGift è esclusivista
- "Esperienza Vespa tour Toscana 1 giorno" — partnership con noleggio locale
- "Weekend in cantina Brunello" — partnership con cantina, no intermediario

**Pro**:
- Margini 3-5x più alti di affiliate
- Differenziazione brand: "esperienze che trovi solo su BeGift"
- Tu controlli prezzo, foto, customer experience

**Contro**:
- Devi negoziare contratto con ogni partner
- Customer service: rimborsi, no-show, problemi → resta in carico a BeGift
- Inventory management se ci sono slot limitati

**Stime**:
- 5-10 esperienze esclusive, AOV €120, commissione 20%
- 30 vendite/mese × €24 commission = **€720/mese**

**Effort**:
- 30-40h per portare a contratto i primi 3 partner + integrare booking
- Customer service 3-5h/sett

**Quando**: a 6 mesi dal rollout pubblico, quando avrai brand recognition.

---

## 5. White-label "Wrapping as a Service"

**Cosa**: API/widget che e-commerce italiani integrano per offrire "wrap emozionale" a checkout.

**Esempio user journey:**
- User compra borsa su sito moda IT, al checkout vede "🎁 Vuoi regalarla con un messaggio video?" (powered by BeGift)
- Paga +€2 extra, il merchant ti gira €1 commissione

**Pro:**
- Revenue stream B2B2C, scala con i merchant partner
- Tu non gestisci utenti finali (lo fa il merchant)
- Marchio "powered by BeGift" → traffico indiretto

**Contro:**
- Vendita B2B con cicli lunghi (3-6 mesi per chiudere primo contratto)
- Devi costruire SDK/widget mantenibile per N integrazioni
- Brand recognition iniziale bassa → fatica a chiudere

**Quando**: solo se B2B (modello 2) funziona, perché è una specializzazione di quello.

---

## 6. Brand integrations (sponsorizzazioni catalogo)

**Cosa**: Brand pagano per essere "preferred" nel catalogo BeGift.

**Esempi**:
- Smartbox paga €500/mese per essere mostrato in cima ai risultati "wellness"
- Booking paga €200/mese per banner discreto in pagina /regali-a/Roma

**Pro**: revenue predictable mensile, low effort post-setup.

**Contro**:
- **Etico**: tradisce la "curation onesta" di BeGift. Gli utenti vedranno meno l'esperienza migliore, più quella pagata
- Difficile chiudere senza traction iniziale
- Conflitto con (4) marketplace curato

**Mia opinione**: **evitare a lungo termine**. Soldi facili che bruciano la fiducia utente. Se vuoi sponsorizzare, fallo solo per Festa Mamma/Natale come placement temporaneo evidente ("In collaborazione con X"), non come ranking nascosto.

---

## 7. Wedding / event registry

**Cosa**: Pivot a "lista nozze 2.0" - coppia crea registry di esperienze invece di oggetti, invitati comprano "fette" via BeGift.

**Pro**:
- AOV altissimo (matrimoni: €100-1000+ per regalo)
- Stagionalità chiara (aprile-settembre +90%)
- Word-of-mouth potentissimo (ogni matrimonio = 50-200 invitati esposti a BeGift)

**Contro**:
- Mercato competitivo (Zankyou, Wedding Wonderland, Honeyfund)
- Richiede UI completamente nuova (registry, split payment, RSVP)
- Buyer (sposi) usano UNA volta → no recurring revenue
- Effort sviluppo: 80-120h per MVP solido

**Quando**: post-validazione email parser POC + B2B funziona. Stagione target: Q1 2027 per primavera/estate 2027.

---

## 8. NFT / token gifts

**Cosa**: Gift collezionabili come NFT, ownership on-chain.

**Mia opinione netta**: **NO**. Per BeGift:
- Mercato NFT in fase calante post-2022 hype
- Target BeGift (gente normale che fa regali emozionali) NON è cripto-native
- Gas fee + complexity → friction enorme
- Brand BeGift si associa a "qualcosa di sospetto"

**Skip definitivo** salvo non emerga un caso d'uso ovvio (non lo vedo).

---

## Roadmap pragmatica 12 mesi

**Mesi 1-3 (giu-ago 2026)**
- Consolidare (1) affiliate: catalogo a 50 esperienze, real product ID, sync regolare
- Iniziare branding (2) B2B: landing `/aziende`, 1-2 incontri test con HR locali Lucca
- User test BeGift POC con 5-10 persone, iterare UX

**Mesi 4-6 (set-nov 2026)**
- Lanciare pilot (2) B2B con 1 cliente (Festa Natale 2026 = stagione perfetta)
- Caso study + testimonial → outreach commerciale ad altre 10 aziende
- Decidere se attivare (3) BeGift Plus su base dati utenti free

**Mesi 7-9 (dic 2026 - feb 2027)**
- Eseguire stagione Natale: scaling (1) + B2B (2) a regime
- Se (1) e (2) funzionano: explorare (4) marketplace verticale con 2-3 partner esclusivi
- Tirare bilancio Q4: quale modello scalare nel 2027

**Mesi 10-12 (mar-mag 2027)**
- Festa Mamma 2027 (10 maggio) = secondo grande momento revenue
- Bilancio finale: il modello che ha dato più €/h investito → focus 12 mesi successivi
- Decidere se altro pilot: (5) white-label, (7) wedding, o doubling-down su (2)

---

## Numeri target conservativi

| Periodo | Affiliate | B2B | Plus | Altri | **Totale/mese** |
|---|---|---|---|---|---|
| Q3 2026 | €100 | €0 | €0 | €0 | **€100** |
| Q4 2026 | €300 | €500 (1 cliente) | €0 | €0 | **€800** |
| Q1 2027 | €400 | €1000 (3 clienti) | €100 | €0 | **€1500** |
| Q2 2027 | €600 | €2000 (5 clienti) | €200 | €0 | **€2800** |

**Target memoria** (200-500€/mese 2027) → **superato di 4-5x** se modello B2B funziona.

Se B2B NON funziona (es. mercato non riceve), restare su affiliate-only stima ~€500-1000/mese a fine 2027 = comunque target raggiunto, solo più lentamente.

---

## La cosa che farei IO domani mattina al posto tuo

Una sola cosa, prima di tutto: scrivi 3 mail a 3 conoscenti HR di aziende lucchesi/fiorentine (50-200 dipendenti, settori non hi-tech):

> "Ciao [nome], ho fatto un POC di una soluzione per regali aziendali emozionali alle persone (Festa Mamma, Natale, anniversari). Ti farei vedere un demo di 15 min via Zoom — niente impegno, voglio solo capire se risolverei un vostro mal di pancia reale. Disponibile la settimana prossima?"

Se 1 dice sì → hai validato il segnale di mercato B2B.
Se 0 dicono sì → il segnale è chiaro: non perdere mesi a build dashboard B2B, focalizza su affiliate.

Costo: 30 minuti per scrivere le 3 mail. Valore: orientare 6 mesi di lavoro.
