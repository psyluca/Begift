-- ============================================================
-- BeGift — Schema completo
-- Esegui in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── PROFILES (estende auth.users) ────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text unique not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now() not null
);

-- Crea automaticamente il profilo al primo login
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── GIFTS ─────────────────────────────────────────────────────────────────────
create table if not exists public.gifts (
  id                uuid    default gen_random_uuid() primary key,
  creator_id        uuid    references public.profiles(id) on delete cascade not null,
  recipient_name    text    not null,
  message           text,
  packaging         jsonb   not null default '{}',
  -- packaging shape: { paperColor, ribbonColor, bowColor, bowType, openAnimation, sound }
  content_type      text    check (content_type in ('image','video','pdf','link','message')),
  content_url       text,   -- URL Supabase Storage oppure URL esterno
  content_text      text,
  content_file_name text,
  created_at        timestamptz default now() not null
);

-- Indice per recuperare velocemente i regali di un creatore
create index if not exists gifts_creator_id_idx on public.gifts(creator_id);

-- ── REACTIONS ─────────────────────────────────────────────────────────────────
create table if not exists public.reactions (
  id            uuid default gen_random_uuid() primary key,
  gift_id       uuid references public.gifts(id) on delete cascade not null,
  reaction_type text not null check (reaction_type in ('emoji','text','photo','video','gift')),
  emoji         text,
  text          text,
  media_url     text,
  sender_name   text default 'Destinatario',
  created_at    timestamptz default now() not null
);

create index if not exists reactions_gift_id_idx on public.reactions(gift_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.gifts     enable row level security;
alter table public.reactions enable row level security;

-- Profiles: ogni utente vede solo il proprio profilo
create policy "profiles: own read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id);

-- Gifts: chiunque può leggere (link pubblico), solo il creatore può scrivere/eliminare
create policy "gifts: public read"   on public.gifts for select using (true);
create policy "gifts: creator insert" on public.gifts for insert with check (auth.uid() = creator_id);
create policy "gifts: creator update" on public.gifts for update using (auth.uid() = creator_id);
create policy "gifts: creator delete" on public.gifts for delete using (auth.uid() = creator_id);

-- Reactions: chiunque può inserire (destinatario non autenticato),
--            solo il creatore del regalo originale può leggere le proprie reazioni
create policy "reactions: public insert" on public.reactions for insert with check (true);
create policy "reactions: creator read"  on public.reactions for select using (
  exists (
    select 1 from public.gifts
    where public.gifts.id = gift_id
      and public.gifts.creator_id = auth.uid()
  )
);

-- ── STORAGE BUCKETS ───────────────────────────────────────────────────────────
-- Esegui separatamente dalla UI Supabase: Storage → New Bucket
-- Oppure usa la Supabase CLI:
--   supabase storage create gift-media --public
--   supabase storage create reaction-media --public

insert into storage.buckets (id, name, public)
values ('gift-media', 'gift-media', true)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('reaction-media', 'reaction-media', true)
on conflict do nothing;

-- Policy storage: utenti autenticati possono caricare nel proprio folder
create policy "gift-media: authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'gift-media' and auth.role() = 'authenticated');

create policy "gift-media: public read"
  on storage.objects for select
  using (bucket_id = 'gift-media');

create policy "reaction-media: anyone upload"
  on storage.objects for insert
  with check (bucket_id = 'reaction-media');

create policy "reaction-media: public read"
  on storage.objects for select
  using (bucket_id = 'reaction-media');
