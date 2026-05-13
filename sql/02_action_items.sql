-- Table: action_items
-- Per-document action items shown in the chat sidebar
-- (e.g. "Gather Required Documents", "Filing Fee", "Deadline").
-- Paste this in Supabase > SQL Editor and run it AFTER 01_documents.sql.

create table if not exists action_items (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid        not null references documents (id) on delete cascade,
  title       text        not null,   -- e.g. "Filing Fee"
  detail      text,                   -- e.g. "$410 (check or money order)"
  sort_order  integer     not null default 0,  -- controls display order in sidebar
  created_at  timestamptz not null default now()
);

-- Index for fetching all action items for a given document
create index if not exists action_items_document_id_idx on action_items (document_id);
