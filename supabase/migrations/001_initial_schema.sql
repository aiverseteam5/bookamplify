-- Enable extensions
create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- Table: authors
create table authors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  email text not null,
  book_title text,
  book_description text,
  genre text,
  sub_genre text,
  target_reader text,
  purchase_url text,
  author_bio text,
  tone_preference text default 'scholarly but accessible',
  launch_date date,
  voice_profile jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table authors enable row level security;
create policy "authors: owner only" on authors
  using (auth.uid() = user_id);

-- Table: book_chunks (for RAG)
create table book_chunks (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references authors(id) on delete cascade not null,
  content text not null,
  embedding vector(1536),
  chunk_index integer,
  created_at timestamptz default now()
);
alter table book_chunks enable row level security;
create policy "book_chunks: owner only" on book_chunks
  using (auth.uid() = (select user_id from authors where id = author_id));
create index book_chunks_embedding_idx on book_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Table: social_connections
create table social_connections (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references authors(id) on delete cascade not null,
  platform text not null check (platform in ('instagram','twitter','linkedin','youtube')),
  platform_user_id text,
  platform_username text,
  access_token_secret text, -- store via Supabase Vault secret name
  is_active boolean default true,
  connected_at timestamptz default now(),
  unique(author_id, platform)
);
alter table social_connections enable row level security;
create policy "social_connections: owner only" on social_connections
  using (auth.uid() = (select user_id from authors where id = author_id));

-- Table: content_items
create table content_items (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references authors(id) on delete cascade not null,
  platform text not null check (platform in ('instagram','twitter','linkedin','youtube','newsletter')),
  content_text text not null,
  status text not null default 'draft' check (status in ('draft','pending','approved','rejected','posted')),
  scheduled_at timestamptz,
  posted_at timestamptz,
  buffer_post_id text,
  created_by_agent text default 'manual',
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table content_items enable row level security;
create policy "content_items: owner only" on content_items
  using (auth.uid() = (select user_id from authors where id = author_id));

-- Table: agent_runs
create table agent_runs (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references authors(id) on delete cascade not null,
  agent_name text not null,
  triggered_at timestamptz default now(),
  completed_at timestamptz,
  status text default 'running' check (status in ('running','completed','failed')),
  output_summary text,
  items_created integer default 0
);
alter table agent_runs enable row level security;
create policy "agent_runs: owner only" on agent_runs
  using (auth.uid() = (select user_id from authors where id = author_id));

-- Table: subscriptions
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references authors(id) on delete cascade not null unique,
  razorpay_customer_id text,
  razorpay_subscription_id text,
  plan text default 'trial' check (plan in ('trial','solo','pro','agency')),
  status text default 'active',
  trial_ends_at timestamptz default (now() + interval '14 days'),
  current_period_end timestamptz,
  created_at timestamptz default now()
);
alter table subscriptions enable row level security;
create policy "subscriptions: owner only" on subscriptions
  using (auth.uid() = (select user_id from authors where id = author_id));
