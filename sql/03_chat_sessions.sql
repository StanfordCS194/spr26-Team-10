-- Table: chat_sessions
-- Groups all messages for one chat about a specific document.
-- Paste this in Supabase > SQL Editor and run it AFTER 01_documents.sql.

create table if not exists chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid        not null references documents (id) on delete cascade,
  user_id     uuid,                              -- nullable; FK to users when auth lands
  language    text        not null default 'en'  -- en | es | zh | ar | fr
                          check (language in ('en', 'es', 'zh', 'ar', 'fr')),
  created_at  timestamptz not null default now()
);

-- Index for fetching all sessions for a given document
create index if not exists chat_sessions_document_id_idx on chat_sessions (document_id);

-- Index for fetching all sessions for a given user
create index if not exists chat_sessions_user_id_idx on chat_sessions (user_id);
