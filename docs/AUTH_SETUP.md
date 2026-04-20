# Auth Setup — Google OAuth + Magic-link email

Guida step-by-step per abilitare Google Sign-In su BeGift. Magic-link email è già attivo (il login OTP attuale usa quella infrastruttura), qui configuriamo solo Google.

Tempo stimato: **25-40 minuti**.

Prerequisiti: accesso a Supabase Dashboard del progetto BeGift + un account Google.

---

## Step 1 — Google Cloud Console (setup OAuth)

### 1.1 Crea il progetto Google Cloud

1. Vai su https://console.cloud.google.com/
2. In alto a sinistra clicca sul selettore di progetto (`Select a project`) → **New Project**
3. Nome: `BeGift Auth` (o qualsiasi nome, è interno)
4. Organizzazione: lascia vuoto se non ne hai una
5. Click **Create**, attendi ~30 secondi

### 1.2 Configura l'OAuth consent screen

1. Nel menu hamburger (≡) → **APIs & Services** → **OAuth consent screen**
2. User Type: **External** → Create
3. App information:
   - App name: `BeGift`
   - User support email: la tua email
   - App logo: opzionale (puoi caricare il logo BeGift più tardi)
4. App domain:
   - Application home page: `https://begift.it` (o il tuo dominio)
   - Privacy policy: `https://begift.it/privacy` (esiste già in `/privacy`)
   - Terms of service: lascia vuoto (o aggiungi il link se ce l'hai)
5. Developer contact: la tua email
6. Click **Save and Continue**
7. **Scopes**: lascia tutto come default (Google aggiungerà `email`, `profile`, `openid` automaticamente). Click **Save and Continue**.
8. **Test users**: opzionale, puoi saltare
9. **Summary** → **Back to dashboard**

> ⚠️ Lo status sarà "Testing". Google limita a 100 utenti totali in testing. Per andare in produzione (>100 utenti), clicca **Publish App** — richiede verifica Google (può durare giorni). Per ora lascia in Testing, è sufficiente.

### 1.3 Crea le credenziali OAuth

1. **APIs & Services** → **Credentials** → **+ Create Credentials** → **OAuth client ID**
2. Application type: **Web application**
3. Name: `BeGift Web Client`
4. **Authorized JavaScript origins**: aggiungi
   - `https://begift.it` (il tuo dominio produzione)
   - `http://localhost:3000` (per dev locale)
5. **Authorized redirect URIs**: aggiungi
   - `https://acoettfsxcfpvhjzreoy.supabase.co/auth/v1/callback`
   - (sostituisci `acoettfsxcfpvhjzreoy` con il tuo project ref Supabase se è cambiato)
6. Click **Create**
7. Appare un popup con **Client ID** e **Client Secret** — **copia entrambi** (o scaricali come JSON). Te li chiede Supabase subito dopo.

---

## Step 2 — Supabase Dashboard (abilita Google)

1. Vai su https://supabase.com/dashboard/project/acoettfsxcfpvhjzreoy
2. **Authentication** (icona chiave) → **Providers**
3. Trova **Google** nella lista → click per espandere
4. Enable: **on**
5. Incolla:
   - **Client ID (for OAuth)**: il Client ID da Google Cloud
   - **Client Secret (for OAuth)**: il Client Secret da Google Cloud
6. **Skip nonce check**: lascia off
7. Click **Save**

### Verifica magic-link

Mentre sei lì:
1. **Authentication** → **Providers** → **Email** → Enable: **on**
2. **Confirm email**: lascia **on** (Supabase manda una conferma al primo login)
3. Scroll giù, **Email auth methods**:
   - ✅ Enable email signup
   - ✅ Enable email provider (magic link)
   - ✅ Enable OTP (6-digit code) — questo è quello che usi già oggi

---

## Step 3 — Variabili d'ambiente (Vercel)

In produzione, serve un env var per attivare il social login:

1. Vercel Dashboard → progetto BeGift → **Settings** → **Environment Variables**
2. Aggiungi:
   - Key: `NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN`
   - Value: `true`
   - Environments: Production + Preview + Development
3. Redeploy del branch in cui vuoi attivarlo (oppure push un commit qualsiasi, Vercel auto-redeploya)

Se vuoi testare prima in **staging**, metti `true` solo su Preview e lascia Production a `false`.

---

## Step 4 — Test dal browser

### Test dev locale

1. Nel file `.env.local`:
   ```
   NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=true
   ```
2. `npm run dev`
3. Vai su `http://localhost:3000/auth/login`
4. Vedi il bottone "Accedi con Google"? → click → consenso Google → redirect a `/dashboard` (o alla pagina `next` che hai passato)

### Test produzione

Dopo il deploy con la env var attiva:
1. Vai su `https://begift.it/auth/login`
2. Click "Accedi con Google"
3. Dovrebbe redirigere a Google → consenso → tornare su BeGift loggato

### Se qualcosa non funziona

- **Google mostra "Access blocked: This app's request is invalid"** → l'URI di redirect nell'OAuth consent non combacia con quello in Supabase. Controlla step 1.3 punto 5.
- **Dopo il consenso torna a `/auth/login?error=nocode`** → il callback non sta ricevendo il code. Controlla le variabili Supabase + network tab del browser.
- **Errore "exchangeCodeForSession"** → in genere un problema di cookie. Apri i cookie del browser, controlla che `sb-*` sia presente dopo il redirect.

Se ti blocchi, mandami l'errore esatto (screenshot del browser + console log) e sistemiamo in 5 minuti.

---

## Note operative

- **Costi**: Google OAuth è gratis. Non c'è limite di login mensili. Servono solo €0.
- **Apple Sign In**: non incluso in questa guida. Quando lo vorrai, serve Apple Developer Account €99/anno + Service ID + JWT client secret. Ti preparo una guida dedicata `APPLE_AUTH_SETUP.md` quando decidi di investire.
- **Facebook**: opzionale. Se vuoi aggiungerlo, la procedura è simile a Google (App su Meta for Developers → Client ID/Secret → Supabase). Lasciata a dopo.

## Rollback

Se dovesse esserci un problema:
1. Metti `NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=false` in Vercel
2. Redeploy (prende 30 secondi)
3. La login page torna a mostrare solo OTP email (comportamento attuale). Nessun utente è impattato.

Lo ripeto perché è importante: tutta la feature è **dietro flag**, può essere disattivata istantaneamente.
