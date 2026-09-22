create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  password_hash text not null,
  avatar_mime text,
  avatar_updated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table users add column if not exists avatar_mime text;
alter table users add column if not exists avatar_updated_at timestamptz;
alter table users add column if not exists locale text not null default 'sr';

create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null
);

create index if not exists sessions_user_idx on sessions (user_id);

create table if not exists items (
  user_id uuid not null references users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

create table if not exists notes (
  user_id uuid not null references users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

create table if not exists kb_nodes (
  user_id uuid not null references users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

create table if not exists finances (
  user_id uuid primary key references users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists media (
  user_id uuid not null references users (id) on delete cascade,
  id text not null,
  mime text not null,
  size bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
