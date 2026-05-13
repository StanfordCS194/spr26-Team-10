-- Optional: allow the browser-facing anon key to read/write demo tables without a service role.
-- Use this ONLY for class demos. For production, prefer SUPABASE_SERVICE_ROLE_KEY in API routes
-- (see my-app/lib/supabase-server.ts) so chat/message inserts are covered too.
-- Run in Supabase SQL Editor after 01–03 migrations.

alter table if exists documents enable row level security;
alter table if exists action_items enable row level security;

drop policy if exists "documents_anon_select" on documents;
create policy "documents_anon_select"
  on documents for select
  to anon
  using (true);

drop policy if exists "documents_anon_insert" on documents;
create policy "documents_anon_insert"
  on documents for insert
  to anon
  with check (true);

drop policy if exists "documents_anon_update" on documents;
create policy "documents_anon_update"
  on documents for update
  to anon
  using (true)
  with check (true);

drop policy if exists "action_items_anon_select" on action_items;
create policy "action_items_anon_select"
  on action_items for select
  to anon
  using (true);

drop policy if exists "action_items_anon_insert" on action_items;
create policy "action_items_anon_insert"
  on action_items for insert
  to anon
  with check (true);
