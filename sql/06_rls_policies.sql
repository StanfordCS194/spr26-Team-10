-- RLS Policies
-- Paste this in Supabase > SQL Editor and run it.

-- form_reference is public government data — disable RLS so the scraper
-- (using the anon key) can write to it and the chat route can read from it.
alter table form_reference disable row level security;

-- For the other tables, allow full access for now (no auth yet).
-- These can be tightened once auth is wired up.
alter table documents disable row level security;
alter table action_items disable row level security;
alter table chat_sessions disable row level security;
alter table messages disable row level security;
