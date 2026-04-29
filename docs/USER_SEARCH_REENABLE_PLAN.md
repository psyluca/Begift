# User Search — Piano di riabilitazione

**Stato attuale (2026-04-28):** sospesa. Endpoint `/api/users` ritorna sempre `[]`, componente `InAppSend` nascosto da `CreateGiftClient`.

**Decisione di Luca:** quando si riabilita, sarà con architettura "search nella cerchia provata" (Opzione 1 + Opzione 3).

**Quando:** post-lancio, dopo Festa Mamma 11 maggio. Stima realistica: Q3 2026 (giugno-luglio).

---

## Principi di design

1. **Cerchia provata, non auto-dichiarata** — la relazione deve essere documentata da un'azione (gift scambiato, reazione lasciata) o da un consenso esplicito ("salva contatto"). Nessuna scoperta di sconosciuti.
2. **Mai esporre email** — i risultati di ricerca contengono solo `display_name` + `username` (handle pubblico) + eventualmente `avatar_url`. L'email resta privata.
3. **Reciprocità asimmetrica controllata** — A può cercare B se A→B ha avuto interazione, ma B può aver impostato `block(A)`. Il blocco prevale sempre.
4. **Auth obbligatoria** — solo utenti loggati possono usare la search.
5. **Rate limit** — max 30 query/minuto per user, max 5 risultati per query.

---

## Architettura tecnica

### Tabella `connections` (nuova)

```sql
create table public.connections (
  user_id    uuid references public.profiles(id) on delete cascade,
  contact_id uuid references public.profiles(id) on delete cascade,
  source     text check (source in ('gift_sent','gift_received','reaction_given','reaction_received','manual')) not null,
  created_at timestamptz default now() not null,
  primary key (user_id, contact_id),
  check (user_id <> contact_id)
);
create index idx_connections_user on public.connections(user_id);
```

Pattern: **bidirezionale** — quando A interagisce con B (gift o reazione), creiamo SIA `(A,B,...)` SIA `(B,A,...)`. Così la search della cerchia di A vede B, e viceversa.

### Trigger automatici

Quando un evento di interazione registrato → creo connessione:

- **Gift apertura** (`gift_opens` insertion con `user_id` non null):
  - Connection (creator → opener) source `gift_received` (visto dal creator: ha ricevuto un'apertura)
  - Connection (opener → creator) source `gift_sent` (visto dall'opener: ha aperto un regalo da quel creator)
- **Reazione** (`reactions` insertion con `user_id` non null):
  - Idem, `reaction_given` / `reaction_received`
- **Manual save** (futuro): bottone "Salva contatto" → source `manual`

### API `/api/users/search`

Replace dell'attuale `/api/users` (che resta no-op per backward compat).

```
GET /api/users/search?q=mar
Auth: Bearer required
Response 200: [
  {
    id: "uuid",
    username: "@maria",
    display_name: "Maria",
    avatar_url: "https://..."
    // NO email
  }
]
```

Query SQL (concettuale):

```sql
select p.id, p.username, p.display_name, p.avatar_url
from public.profiles p
where p.id in (
  select contact_id from public.connections
  where user_id = $auth.uid
)
and (
  p.username ilike $q || '%'
  or p.display_name ilike '%' || $q || '%'
)
and p.id not in (
  select blocked_id from public.user_blocks where blocker_id = $auth.uid
)
order by (p.username ilike $q || '%') desc, p.display_name
limit 5;
```

Note:
- `username` matching prefix-only (più stretto, più predittibile)
- `display_name` matching contains (più permissivo perché spesso è "Maria Rossi")
- Esclusione blocchi: rispetta `user_blocks` esistente
- Limit 5 risultati (no enumeration via paginazione)

### Migration step-by-step

```sql
-- Migration 019_user_connections.sql

-- 1. Crea tabella
create table public.connections (...);

-- 2. Backfill da gift_opens esistenti
insert into public.connections (user_id, contact_id, source)
select distinct g.creator_id, go.user_id, 'gift_received'
from public.gift_opens go
join public.gifts g on g.id = go.gift_id
where go.user_id is not null and go.user_id <> g.creator_id
on conflict do nothing;

insert into public.connections (user_id, contact_id, source)
select distinct go.user_id, g.creator_id, 'gift_sent'
from public.gift_opens go
join public.gifts g on g.id = go.gift_id
where go.user_id is not null and go.user_id <> g.creator_id
on conflict do nothing;

-- 3. Backfill da reactions
insert into public.connections (user_id, contact_id, source)
select distinct g.creator_id, r.user_id, 'reaction_received'
from public.reactions r
join public.gifts g on g.id = r.gift_id
where r.user_id is not null and r.user_id <> g.creator_id
on conflict do nothing;

insert into public.connections (user_id, contact_id, source)
select distinct r.user_id, g.creator_id, 'reaction_given'
from public.reactions r
join public.gifts g on g.id = r.gift_id
where r.user_id is not null and r.user_id <> g.creator_id
on conflict do nothing;

-- 4. RLS (i connections sono per-user)
alter table public.connections enable row level security;
create policy "user can read own connections"
  on public.connections for select
  using (user_id = auth.uid());
```

### Trigger Supabase (futura migration 020)

```sql
-- Auto-popola connections quando un gift viene aperto da utente loggato
create or replace function public.connections_on_gift_open()
returns trigger as $$
declare
  creator uuid;
begin
  if new.user_id is null then return new; end if;
  select creator_id into creator from public.gifts where id = new.gift_id;
  if creator is null or creator = new.user_id then return new; end if;

  insert into public.connections (user_id, contact_id, source)
  values (creator, new.user_id, 'gift_received')
  on conflict do nothing;

  insert into public.connections (user_id, contact_id, source)
  values (new.user_id, creator, 'gift_sent')
  on conflict do nothing;

  return new;
end;
$$ language plpgsql security definer;

create trigger connections_on_gift_open
after insert on public.gift_opens
for each row execute function public.connections_on_gift_open();

-- Stesso pattern per reactions
```

---

## Stima sviluppo

| Step | Tempo |
|---|---|
| Migration 019 (tabella + backfill) | 1 ora |
| Migration 020 (trigger automatici) | 1 ora |
| `/api/users/search` endpoint | 2 ore |
| Riattivazione `InAppSend` con nuovo endpoint | 1 ora |
| Test end-to-end | 2 ore |
| **Totale** | **~1 giornata di dev** |

---

## Side effect positivi della cerchia

Una volta che esiste `connections`, si abilitano altre feature gratis:

1. **"Le tue persone"** in dashboard — vedi quante persone hai nella tua cerchia
2. **Wallet relazionale** (idea già discussa col CEO) — per ogni connessione, mini-profilo con storia interazioni
3. **Anniversario amicizia** — *"Un anno fa hai mandato il primo regalo a Marco"* via `min(created_at)` su connections
4. **Notifiche relazionali** — *"Maria ha aperto 3 dei tuoi regali quest'anno"* — engagement loop forte
5. **Suggerimenti per ricorrenze** — "Per il compleanno di Marco (nella tua cerchia), vedi le tue idee passate"

In altre parole: la tabella `connections` non è solo per la search. È **il grafo del network intimate** che rende BeGift un social per davvero. Costruirla bene oggi è il fondamento di tutto il framing "intimate social network" di cui ha parlato il CEO.

---

## Quando riabilitare

**Trigger naturale**: quando avrai 200+ utenti registrati con relazioni multiple (almeno 2-3 connections per utente medio). A quel punto la search inizia a essere utile davvero — sotto i 100 utenti, ognuno conosce a memoria i 4-5 contatti che ha scambiato gift, search non serve.

**Sequenza realistica**:
1. Festa Mamma 11 maggio → primo aumento utenti
2. Settimane successive → naturale formazione di connessioni via gift_opens e reactions
3. Quando vedi nei dati `/admin/stats` che il 40%+ degli utenti ha 2+ connessioni → conviene attivare
4. **Stima**: probabilmente luglio-agosto 2026
