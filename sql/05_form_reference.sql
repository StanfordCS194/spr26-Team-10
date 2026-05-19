-- Table: form_reference
-- Stores scraped government form content (chunked by section).
-- The scraper writes here instead of to a local file.
-- The chat route queries this to ground AI responses in real data.
-- Paste this in Supabase > SQL Editor and run it.

create table if not exists form_reference (
  id         uuid primary key default gen_random_uuid(),
  source     text not null,   -- e.g. "SSA.GOV - PREPARE" or "CHECK ELIGIBILITY FOR BENEFITS"
  source_url text,            -- original website/PDF URL this chunk came from
  source_title text,          -- human-readable page/form title
  section_title text,         -- nearest heading or section label for this chunk
  page_number integer,        -- PDF page number when available
  form_key text,              -- normalized form/topic key, e.g. "ss-5" or "cms-40b"
  content    text not null,   -- the scraped text for that section
  scraped_at timestamptz not null default now()
);

-- Full-text search index so the chat route can find relevant sections quickly
create index if not exists form_reference_fts_idx
  on form_reference using gin(to_tsvector('english', content));

create index if not exists form_reference_form_key_idx
  on form_reference (form_key);

create index if not exists form_reference_source_url_idx
  on form_reference (source_url);
