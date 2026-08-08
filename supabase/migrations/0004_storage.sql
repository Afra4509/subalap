-- =========================================================================
-- SUBALAP -- Storage buckets
-- =========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-images', 'report-images', true, 8388608, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 4194304, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- Public read for both buckets
drop policy if exists "public_read_report_images" on storage.objects;
create policy "public_read_report_images" on storage.objects
  for select using (bucket_id = 'report-images');

drop policy if exists "public_read_avatars" on storage.objects;
create policy "public_read_avatars" on storage.objects
  for select using (bucket_id = 'avatars');

-- Authenticated users can upload into a folder named after their own user id:
-- e.g. report-images/<user_id>/<filename>
drop policy if exists "auth_upload_report_images" on storage.objects;
create policy "auth_upload_report_images" on storage.objects
  for insert with check (
    bucket_id = 'report-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "auth_upload_avatars" on storage.objects;
create policy "auth_upload_avatars" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own_delete_report_images" on storage.objects;
create policy "own_delete_report_images" on storage.objects
  for delete using (
    bucket_id = 'report-images'
    and (owner = auth.uid() or (storage.foldername(name))[1] = auth.uid()::text)
  );

drop policy if exists "own_delete_avatars" on storage.objects;
create policy "own_delete_avatars" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (owner = auth.uid() or (storage.foldername(name))[1] = auth.uid()::text)
  );
