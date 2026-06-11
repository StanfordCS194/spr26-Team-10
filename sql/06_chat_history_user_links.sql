-- Migration: link documents + chat_sessions to auth.users, add chat title + updated_at.
-- Paste this in Supabase > SQL Editor and run it AFTER 01–05 migrations.

-- 1. Foreign keys to auth.users so deleting a user cascades their data.
alter table documents
  drop constraint if exists documents_user_id_fkey;
alter table documents
  add constraint documents_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table chat_sessions
  drop constraint if exists chat_sessions_user_id_fkey;
alter table chat_sessions
  add constraint chat_sessions_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

-- 2. Chat history metadata on chat_sessions.
alter table chat_sessions
  add column if not exists title text;

alter table chat_sessions
  add column if not exists updated_at timestamptz not null default now();

-- Keep updated_at fresh on any row change so the sidebar can sort by recency.
create or replace function chat_sessions_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chat_sessions_set_updated_at_trg on chat_sessions;
create trigger chat_sessions_set_updated_at_trg
  before update on chat_sessions
  for each row
  execute function chat_sessions_set_updated_at();

-- 3. Index for the "list my chats" query, ordered by recency.
create index if not exists chat_sessions_user_id_updated_at_idx
  on chat_sessions (user_id, updated_at desc);
