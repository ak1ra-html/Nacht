-- =====================================================================
-- Script ML Hub - skema database Supabase
-- Jalankan seluruh isi file ini di: Supabase Dashboard > SQL Editor
-- =====================================================================

-- 1. Tabel script -------------------------------------------------------
create table if not exists public.scripts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,              -- contoh: "Script Fanny Legend"
  replace_name  text,                       -- contoh: "Elite"
  description   text,
  thumbnail_url text,                       -- gambar skin
  download_url  text not null,              -- link download script
  downloads     integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists scripts_set_updated_at on public.scripts;
create trigger scripts_set_updated_at
  before update on public.scripts
  for each row execute function public.set_updated_at();

-- 2. Daftar admin -------------------------------------------------------
-- Hanya user yang ada di tabel ini yang boleh menambah/mengubah/menghapus.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- RLS aktif tanpa policy = tabel tidak bisa dibaca lewat API publik.
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- 3. Row Level Security untuk scripts ------------------------------------
alter table public.scripts enable row level security;

drop policy if exists "scripts_public_read" on public.scripts;
create policy "scripts_public_read" on public.scripts
  for select using (true);

drop policy if exists "scripts_admin_insert" on public.scripts;
create policy "scripts_admin_insert" on public.scripts
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "scripts_admin_update" on public.scripts;
create policy "scripts_admin_update" on public.scripts
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "scripts_admin_delete" on public.scripts;
create policy "scripts_admin_delete" on public.scripts
  for delete to authenticated
  using (public.is_admin());

-- 4. Penghitung download (boleh dipanggil siapa saja) --------------------
create or replace function public.increment_downloads(script_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.scripts set downloads = downloads + 1 where id = script_id;
$$;

grant execute on function public.increment_downloads(uuid) to anon, authenticated;

-- 5. Storage untuk thumbnail --------------------------------------------
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

drop policy if exists "thumbnails_public_read" on storage.objects;
create policy "thumbnails_public_read" on storage.objects
  for select using (bucket_id = 'thumbnails');

drop policy if exists "thumbnails_admin_insert" on storage.objects;
create policy "thumbnails_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'thumbnails' and public.is_admin());

drop policy if exists "thumbnails_admin_update" on storage.objects;
create policy "thumbnails_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'thumbnails' and public.is_admin());

drop policy if exists "thumbnails_admin_delete" on storage.objects;
create policy "thumbnails_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'thumbnails' and public.is_admin());

-- =====================================================================
-- LANGKAH TERAKHIR (jalankan SETELAH membuat user admin di
-- Authentication > Users). Ganti emailnya dengan email admin kamu:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'email-admin-kamu@gmail.com';
-- =====================================================================
