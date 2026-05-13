-- Table: messages
-- Individual chat messages (user and assistant) within a session.
-- message_meta holds optional rich UI data: suggestions, annotations, citation.
-- Paste this in Supabase > SQL Editor and run it AFTER 03_chat_sessions.sql.

create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid        not null references chat_sessions (id) on delete cascade,
  role         text        not null check (role in ('user', 'assistant')),
  content      text        not null,   -- the message text
  message_meta jsonb,                  -- optional: { suggestions, annotations, citation }
  created_at   timestamptz not null default now()
);

-- Index for fetching all messages in a session, in order
create index if not exists messages_session_id_created_at_idx
  on messages (session_id, created_at asc);
