# BeGift app nativa — Guida operativa Luca

Documento operativo che ti accompagna passo passo nella creazione dell'app iOS e Android di BeGift via Capacitor. Ogni fase ha indicazione precisa di cosa fai TU e cosa fa Claude.

**Strategia scelta:** Capacitor "hosted web app" — l'app è un wrapper nativo che apre begift.app, con feature device aggiuntive per giustificare Apple Rule 4.2.

**Calendario obiettivo:**
- **Fine luglio 2026** — app submittate ad Apple/Google
- **Metà agosto 2026** — review completata, app LIVE in store
- **Fine settembre** — refinement basato su feedback utenti reali
- **Ottobre-dicembre** — promozione su social, picco Natale

---

## FASE 0 — Pre-requisiti che devi avere PRIMA di partire

### 0.1 Mac con macOS recente
Verifica versione: Menu Apple → "Informazioni su questo Mac". Serve almeno **macOS 13 (Ventura)**, meglio macOS 14+ (Sonoma) o 15 (Sequoia).

### 0.2 Xcode installato (~10 GB)
- Apri **App Store** sul Mac
- Cerca "Xcode" → Installa
- Tempo download: 15-60 min

Verifica installazione, in Terminale:
```bash
xcodebuild -version
```
Deve rispondere `Xcode 16.0` o simile. Se errore, apri Xcode una volta e accetta le licenze.

### 0.3 Apple Developer Program ($99/anno) — partire ADESSO
È approvazione che richiede 24-48h, partilo subito.

1. Vai su [developer.apple.com/programs/enroll/](https://developer.apple.com/programs/enroll/)
2. "Start your enrollment"
3. Sign in col tuo Apple ID personale
4. Tipo: "Individual / Sole Proprietor"
5. Compila dati anagrafici + indirizzo
6. Aggiungi carta di credito $99
7. Conferma → aspetta email di Apple

**Stato:** [ ] In corso  [ ] Approvato

### 0.4 Google Play Console ($25 una tantum) — opzionale per ora
Lo facciamo a luglio quando passiamo ad Android. Per ora skip.

### 0.5 Android Studio — opzionale per ora
Stesso discorso. Lo installiamo a luglio.

---

## FASE 1 — Setup Capacitor nel progetto

Cosa ho fatto io:
- Branch `feature/native-app-capacitor` creato
- `capacitor.config.ts` con config "hosted web app"
- Questo documento

Cosa fai TU sul Mac (~30 minuti):

### 1.1 Pull del branch
```bash
cd ~/path/to/begift-backend
git fetch
git checkout feature/native-app-capacitor
```

### 1.2 Installa Capacitor
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
```

### 1.3 Verifica config (non serve init, già fatto)
```bash
cat capacitor.config.ts
```
Devi vedere il file con `appId: 'app.begift.mobile'`.

### 1.4 Aggiungi piattaforma iOS
```bash
npx cap add ios
```

Crea la cartella `ios/` col progetto Xcode dentro.

### 1.5 Apri progetto in Xcode
```bash
npx cap open ios
```

Aspetta che Xcode finisca l'indicizzazione (barra di progresso).

### 1.6 Configura Team in Xcode
- Click sul progetto "App" nel pannello sinistro
- Tab "Signing & Capabilities"
- Sezione "Signing":
  - **Team**: seleziona il tuo Apple ID (Apple Developer enrollment già fatto)
  - Spunta "Automatically manage signing"
- Verifica **Bundle Identifier** = `app.begift.mobile`

### 1.7 Primo test su simulatore iOS
- Destination in alto: scegli "iPhone 15 Pro" (o simile)
- Premi Play ▶
- Build time: 1-3 minuti la prima volta

**Cosa devi vedere:** simulatore iOS, splash screen rosa BeGift per 2.5s, poi appare begift.app dentro l'app. Naviga, deve funzionare come il sito web.

**Se errore o pagina bianca:** screenshot Xcode + log console (View → Debug Area → Show Debug Area) → mandami e debugghiamo.

### 1.8 Commit + push
```bash
git add ios/ package.json package-lock.json
git commit -m "feat(native): setup Capacitor iOS"
git push
```

**Fase 1 completata** ✅ quando vedi BeGift girare nel simulatore iOS.

---

## FASE 2 — Plugin device essenziali (settimana 2)

Plugin che giustificano Apple Rule 4.2 (feature che il web non può fare).

### 2.1 Install plugin
```bash
npm install @capacitor/camera @capacitor/push-notifications @capacitor/share @capacitor/app
npx cap sync ios
```

### 2.2 Permessi iOS (Info.plist)
Te li scriverò io quando saremo a questa fase. Sono ~5 righe XML da aggiungere a `ios/App/App/Info.plist`.

### 2.3 Setup APNs (push iOS)
- In Apple Developer portal → Certificates → crea APNs key
- Carica config in Capacitor

Dettagli operativi: te li do quando arriviamo a questa fase.

---

## FASE 3 — Test su iPhone reale (settimana 3)

### 3.1 Connetti iPhone via cavo
- Sblocca iPhone, fidati del Mac quando appare il prompt
- In Xcode: destination → seleziona il tuo iPhone

### 3.2 Build
- Premi Play ▶
- iPhone: Impostazioni → Generali → Gestione VPN e Dispositivi → fidati di [tuo nome]

### 3.3 Test funzionalità
- Naviga, crea regalo, condividi, ricevi push test
- Annota ogni bug

---

## FASE 4 — Asset App Store (settimana 4)

Cosa faccio io:
- Icon master 1024x1024 PNG + tutti i derived iOS (~13 size)
- Splash screen multi-resolution
- 5-8 screenshot App Store per device class
- Descrizione App Store SEO-friendly (Title 30 char, Subtitle 30, Description 4000, Keywords 100)

Cosa fai tu:
- Vai su [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
- "My Apps" → "+" → "New App"
- Compila: nome, bundle ID `app.begift.mobile`, lingua principale italiano, paese vendita Italia
- Carica icon, screenshot, descrizione che ti avrò preparato

---

## FASE 5 — Submit Apple Review (settimana 5-6)

### 5.1 Upload build via Xcode
- In Xcode: Product → Archive → aspetta (15-30 min)
- Window → Organizer → Distribute App → App Store Connect → Upload
- Aspetta 10-30 min che Apple processi

### 5.2 TestFlight (beta, raccomandato)
- App Store Connect → TestFlight
- Aggiungi te stesso come Tester
- Provi l'app come la vedranno gli utenti reali

### 5.3 Submit per Review
- App Store Connect → versione 1.0 → "Submit for Review"
- Apple Review: 24-72h media

### 5.4 In caso di rejection (di solito Rule 4.2)
- Mi mandi screenshot motivazione
- Aggiungiamo feature device mancanti
- Re-submit

---

## FASE 6 — Android in parallelo (settimana 7-8)

Stessa logica iOS ma con Android Studio. Te la dettaglio quando arriviamo lì.

---

## FASE 7 — Pubblicazione + marketing (settembre 2026)

- Annuncio Instagram con screenshot
- Email a early adopters con link App Store
- Banner sito web "Scarica l'app"
- Eventuale post Product Hunt

---

## Checklist pre-requisiti (prima di Fase 1)

Segna ✅ quando completati:

- [ ] Mac con macOS 13+
- [ ] Xcode installato e licenze accettate
- [ ] Apple Developer Program enrollment partito (24-48h attesa)

Quando hai i 3 spunti, mi avvisi e partiamo con Fase 1.

---

## Promemoria

- **Niente pressione sulla timeline.** Se Apple enrollment dura 4gg invece di 2, va bene. 2 mesi di buffer.
- **Quando hai dubbi, fermati e mi scrivi.** Meglio chiarire 5 min ora che 5h di rework dopo.
- **Mandami screenshot generosamente** per problemi Xcode.
- **Tu decidi, io implemento.** Nessuna decisione architetturale senza tuo OK.
