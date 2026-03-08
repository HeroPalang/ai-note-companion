-- =============================================
-- Note Explainer - Storage Policies
-- Run this in Supabase SQL Editor
-- =============================================

-- Create attachment bucket if it doesn't exist.
-- Set public=true because the app currently stores and opens public file URLs.
insert into storage.buckets (id, name, public)
values ('note-attachments', 'note-attachments', true)
on conflict (id) do update set public = excluded.public;

-- Remove old policies so this file is idempotent.
drop policy if exists "Users can upload own attachments" on storage.objects;
drop policy if exists "Users can read own attachments" on storage.objects;
drop policy if exists "Users can update own attachments" on storage.objects;
drop policy if exists "Users can delete own attachments" on storage.objects;

-- Users can only upload to their own folder: <auth.uid()>/<filename>
create policy "Users can upload own attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'note-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read only their own files (still useful even with public bucket)
create policy "Users can read own attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'note-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own attachments"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'note-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'note-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'note-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

