-- Optional: structured AI review fields (filename + hints until real OCR exists)
-- Run in Supabase SQL Editor after 01_documents.sql

alter table documents
  add column if not exists ai_extraction jsonb;

comment on column documents.ai_extraction is
  'AI-generated review fields: { "fields": [{ "key", "label", "value", "icon" }], "generatedAt" }';
