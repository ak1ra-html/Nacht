-- =====================================================================
-- Migrasi 3: fitur Upcoming + Request Script
-- Jalankan di Supabase Dashboard > SQL Editor (aman dijalankan ulang).
-- =====================================================================

-- 1. Upcoming: script bisa berstatus "upcoming" (belum rilis)
alter table public.scripts
  add column if not exists status text not null default 'published'
    check (status in ('published', 'upcoming')),
  add column if not exists release_note text;

-- 2. Request script dari pengunjung
create table if not exists public.script_requests (
  id             uuid primary key default gen_random_uuid(),
  requester_name text check (requester_name is null or char_length(requester_name) <= 60),
  contact        text check (contact is null or char_length(contact) <= 100),
  request_text   text not null check (char_length(request_text) between 5 and 500),
  status         text not null default 'new' check (status in ('new', 'processing', 'done')),
  created_at     timestamptz not null default now()
);

alter table public.script_requests enable row level security;

-- Siapa saja boleh MENGIRIM request, tapi hanya sebagai status 'new'.
drop policy if exists "requests_public_insert" on public.script_requests;
create policy "requests_public_insert" on public.script_requests
  for insert to anon, authenticated
  with check (status = 'new');

-- Hanya admin yang boleh MEMBACA, mengubah, dan menghapus request.
drop policy if exists "requests_admin_select" on public.script_requests;
create policy "requests_admin_select" on public.script_requests
  for select to authenticated
  using (public.is_admin());

drop policy if exists "requests_admin_update" on public.script_requests;
create policy "requests_admin_update" on public.script_requests
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "requests_admin_delete" on public.script_requests;
create policy "requests_admin_delete" on public.script_requests
  for delete to authenticated
  using (public.is_admin());

notify pgrst, 'reload schema';
