-- Table: form_reference
-- Stores scraped government form content (chunked by section).
-- The scraper writes here instead of to a local file.
-- The chat route queries this to ground AI responses in real data.
-- Paste this in Supabase > SQL Editor and run it.

create table if not exists form_reference (
  id         uuid primary key default gen_random_uuid(),
  source     text not null,   -- e.g. "SSA.GOV - PREPARE" or "CHECK ELIGIBILITY FOR BENEFITS"
  content    text not null,   -- the scraped text for that section
  scraped_at timestamptz not null default now()
);

-- Full-text search index so the chat route can find relevant sections quickly
create index if not exists form_reference_fts_idx
  on form_reference using gin(to_tsvector('english', content));
