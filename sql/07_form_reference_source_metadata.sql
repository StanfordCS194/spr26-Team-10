-- Adds original-source metadata for dynamic citations.
-- Run this once in Supabase if form_reference already exists.

alter table form_reference
  add column if not exists source_url text,
  add column if not exists source_title text,
  add column if not exists section_title text,
  add column if not exists page_number integer,
  add column if not exists form_key text;

create index if not exists form_reference_form_key_idx
  on form_reference (form_key);

create index if not exists form_reference_source_url_idx
  on form_reference (source_url);
