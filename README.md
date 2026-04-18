# BeGift — Backend Next.js + Supabase

Progetto completo pronto al deploy. Stack: **Next.js 14** (App Router) + **Supabase** (PostgreSQL + Auth + Storage).

---

## Setup in 5 minuti

### 1. Clona e installa

```bash
git clone <repo-url> begift
cd begift
npm install
```

### 2. Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) → New Project
2. Copia **Project URL** e **anon key** da Project Settings → API

### 3. Configura le variabili d'ambiente

```bash
cp .env.local.example .env.local
```

Apri `.env.local` e incolla i valori Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Esegui lo schema SQL

Nel dashboard Supabase → **SQL Editor** → New Query, incolla e esegui il contenuto di:

```
supabase/migrations/001_schema.sql
```

Questo crea le tabelle `profiles`, `gifts`, `reactions`, i bucket Storage e le policy RLS.

### 5. Configura l'autenticazione

In Supabase Dashboard → **Authentication** → URL Configuration:

- **Site URL**: `http://localhost:3000` (poi cambia con il dominio reale)
- **Redirect URLs**: `http://localhost:3000/auth/callback`

### 6. Avvia in locale

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

---

## Struttura del progetto

```
begift/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Reset CSS
│   ├── not-found.tsx               # 404
│   ├── create/
│   │   ├── page.tsx                # Server Component (auth check)
│   │   └── CreateGiftClient.tsx    # Creator multi-step
│   ├── gift/[id]/
│   │   ├── page.tsx                # Server Component (SSR + metadata OG)
│   │   └── GiftOpeningClient.tsx   # Animazione apertura + reazione
│   ├── dashboard/
│   │   ├── page.tsx                # Server Component
│   │   └── DashboardClient.tsx     # Lista regali + reazioni realtime
│   ├── auth/
│   │   ├── login/page.tsx          # Magic link login
│   │   └── callback/route.ts       # Callback OTP
│   └── api/
│       ├── upload/route.ts         # POST: upload file → Storage
│       ├── gifts/route.ts          # GET: lista, POST: crea
│       ├── gifts/[id]/route.ts     # DELETE: elimina
│       └── reactions/route.ts      # GET/POST: reazioni
├── hooks/
│   ├── useUser.ts                  # Auth state
│   ├── useUpload.ts                # Upload file → Storage
│   └── useRealtimeReactions.ts     # Push via WebSocket
├── lib/supabase/
│   ├── client.ts                   # Browser client
│   └── server.ts                   # Server client + admin
├── types/index.ts                  # Tutti i tipi TypeScript
├── middleware.ts                   # Protezione route
└── supabase/migrations/
    └── 001_schema.sql              # Schema completo DB + RLS + Storage
```

---

## Flusso principale

```
Utente           Next.js              Supabase
   |                |                    |
   |-- /create ---->|                    |
   |                |-- getUser() ------>|
   |                |<-- user/null ------|
   |                |                    |
   |-- POST file -->|                    |
   |                |-- Storage.upload ->|
   |                |<-- publicUrl ------|
   |                |                    |
   |-- POST gift -->|                    |
   |                |-- gifts.insert --->|
   |                |<-- { id, url } ----|
   |                |                    |
   |<-- link -------|                    |
   |                |                    |
   |-- /gift/[id] ->|                    |
   |                |-- gifts.select --->|
   |                |<-- gift data ------|
   |<-- SSR page ---|                    |
   |                |                    |
   |-- reazione --->|                    |
   |                |-- reactions.insert>|
   |                |<-- ok ------------|
   |                |                    |
   |  (creatore)    |<-- Realtime WS ----|
```

---

## Deploy su Vercel

Il deploy è **automatico via GitHub** (dal 2026-04-18):

- Push su `main` → build automatica di produzione su `begift.app`
- Push su qualsiasi altro branch → preview URL dedicato generato da Vercel

Per modifiche alle variabili d'ambiente: Vercel → **Settings → Environment Variables**. Le modifiche sono rispecchiate alla prossima build.

Aggiorna Supabase → Authentication → URL Configuration quando il dominio cambia.

---

## Variabili d'ambiente

| Variabile | Dove trovarla | Visibilità |
|-----------|--------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | Solo Server |
| `NEXT_PUBLIC_APP_URL` | Il tuo dominio | Client + Server |

> **Attenzione**: non esporre mai `SUPABASE_SERVICE_ROLE_KEY` al client. Bypassa le RLS policy.

---

## Prossimi step

- [ ] Email provider dedicato (Resend/SendGrid) per magic link in produzione
- [ ] Rate limiting sulle API route (es. `@upstash/ratelimit`)
- [ ] Scadenza link regalo (campo `expires_at` nella tabella gifts)
- [ ] Analytics aperture regalo
- [ ] Notifiche push (Web Push API)
