-- =========================================================================
-- Run this AFTER a user has signed up through the app, to make them a
-- Government Administrator. Replace the email address below, then run this
-- in the Supabase SQL Editor.
-- =========================================================================

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');

-- Verify:
select id, username, full_name, role from public.profiles where role = 'admin';
