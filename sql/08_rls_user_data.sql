-- Per-user RLS for chat history.
-- Adds `to authenticated` policies on chat_sessions, messages, and documents so that
-- a signed-in user only sees their own data. The pre-existing `to anon` policies on
-- documents/action_items stay in place so the legacy unauthenticated demo still works.
-- Run in Supabase SQL Editor after 06_chat_history_user_links.sql.

-- 1. chat_sessions: scope to auth.uid().
alter table chat_sessions enable row level security;

drop policy if exists "chat_sessions_owner_select" on chat_sessions;
create policy "chat_sessions_owner_select"
  on chat_sessions for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "chat_sessions_owner_insert" on chat_sessions;
create policy "chat_sessions_owner_insert"
  on chat_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "chat_sessions_owner_update" on chat_sessions;
create policy "chat_sessions_owner_update"
  on chat_sessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "chat_sessions_owner_delete" on chat_sessions;
create policy "chat_sessions_owner_delete"
  on chat_sessions for delete
  to authenticated
  using (user_id = auth.uid());

-- 2. messages: derive ownership through the parent chat_sessions row.
alter table messages enable row level security;

drop policy if exists "messages_owner_select" on messages;
create policy "messages_owner_select"
  on messages for select
  to authenticated
  using (
    session_id in (
      select id from chat_sessions where user_id = auth.uid()
    )
  );

drop policy if exists "messages_owner_insert" on messages;
create policy "messages_owner_insert"
  on messages for insert
  to authenticated
  with check (
    session_id in (
      select id from chat_sessions where user_id = auth.uid()
    )
  );

-- 3. documents: authenticated users only see/modify their own rows.
-- (Anon policies from 04_rls_policies_anon.sql remain in place for the demo path.)
drop policy if exists "documents_owner_select" on documents;
create policy "documents_owner_select"
  on documents for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "documents_owner_insert" on documents;
create policy "documents_owner_insert"
  on documents for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "documents_owner_update" on documents;
create policy "documents_owner_update"
  on documents for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
