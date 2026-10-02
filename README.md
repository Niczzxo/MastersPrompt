# PromptReel — AI Video Prompts Vault

A personal library for AI video prompts: browse the collection, copy any prompt
with one tap, and upload your own prompts to build your vault.

## Features

- **Gallery** — masonry grid of prompt cards with category art, model pills, copy counts
- **Search & filters** — full-text search, category chips, model filter, sorting
- **Detail view** — full prompt text, one-tap copy, duration/aspect settings, tags
- **Upload** — add your own prompts with title, category, model, tags, and an
  optional thumbnail image (stored in your browser via localStorage)
- **My Prompts** — filter to just your uploads

## Seed content

Ships with 24 original video prompts across 8 categories (Cinematic, Viral,
Nature, Anime, Product, Sci-Fi, Portrait, Travel). All written for this
project — no copied content.

## Database (Supabase)

Uploads can be stored in your own Supabase project so they sync across devices.
Without it, uploads stay in the browser (localStorage).

**One-time setup** — run this in your Supabase SQL Editor:

```sql
create table if not exists promptreel_prompts (
  id text primary key,
  title text not null,
  prompt text not null,
  category text not null default 'Cinematic',
  model text not null default 'Seedance 2.5',
  duration text not null default '10s',
  aspect_ratio text not null default '16:9',
  tags text[] default '{}',
  image_url text,
  copies integer default 0,
  created_at timestamptz default now()
);

alter table promptreel_prompts enable row level security;

drop policy if exists "promptreel public read" on promptreel_prompts;
create policy "promptreel public read" on promptreel_prompts
  for select using (true);

drop policy if exists "promptreel public write" on promptreel_prompts;
create policy "promptreel public write" on promptreel_prompts
  for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('promptreel-thumbs', 'promptreel-thumbs', true)
on conflict (id) do nothing;

drop policy if exists "promptreel thumbs public read" on storage.objects;
create policy "promptreel thumbs public read" on storage.objects
  for select using (bucket_id = 'promptreel-thumbs');

drop policy if exists "promptreel thumbs public write" on storage.objects;
create policy "promptreel thumbs public write" on storage.objects
  for insert with check (bucket_id = 'promptreel-thumbs');

drop policy if exists "promptreel thumbs public delete" on storage.objects;
create policy "promptreel thumbs public delete" on storage.objects
  for delete using (bucket_id = 'promptreel-thumbs');
```

Then open the site → gear icon (Settings) → paste your **Supabase URL** and **anon public key**
(Supabase dashboard → Project Settings → API) → Test connection → Save.

Note: policies are open (no login on the site) — anyone with the URL can read/add
prompts. Fine for a personal vault; tighten later if you add auth.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Static site — deploy the repo on Vercel (framework: Vite), no env vars needed.
