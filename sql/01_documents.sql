-- Table: documents
-- Stores each uploaded government form (file metadata + OCR-extracted text).
-- Paste this in Supabase > SQL Editor and run it.

create table if not exists documents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid,                        -- nullable; FK to users when auth lands
  file_name       text        not null,         -- e.g. "analytics.png"
  form_type       text,                         -- e.g. "Form I-765"
  form_description text,                        -- e.g. "Employment Authorization"
  storage_path    text,                         -- path inside Supabase Storage bucket
  ocr_text        text,                         -- raw text extracted from the document
  created_at      timestamptz not null default now()
);

-- Index for looking up all documents belonging to a user
create index if not exists documents_user_id_idx on documents (user_id);
