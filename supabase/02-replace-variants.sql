-- =====================================================================
-- Migrasi: satu script bisa punya banyak replace
-- Jalankan di Supabase Dashboard > SQL Editor (aman dijalankan ulang).
-- Data lama (judul, replace, link) otomatis dipindahkan.
-- =====================================================================

-- 1. Tabel replace
create table if not exists public.script_variants (
  id            uuid primary key default gen_random_uuid(),
  script_id     uuid not null references public.scripts (id) on delete cascade,
  replace_name  text not null,
  thumbnail_url text,
  download_url  text not null,
  downloads     integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists script_variants_script_id_idx
  on public.script_variants (script_id);

-- 2. Pindahkan data lama, lalu hapus kolom lama dari tabel scripts
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scripts' and column_name = 'download_url'
  ) then
    insert into public.script_variants (script_id, replace_name, thumbnail_url, download_url, downloads)
    select id, coalesce(nullif(replace_name, ''), 'Default'), thumbnail_url, download_url, downloads
    from public.scripts
    where download_url is not null;

    alter table public.scripts
      drop column download_url,
      drop column replace_name,
      drop column downloads;
  end if;
end $$;

drop function if exists public.increment_downloads(uuid);

-- 3. Keamanan (RLS)
alter table public.script_variants enable row level security;

drop policy if exists "variants_public_read" on public.script_variants;
create policy "variants_public_read" on public.script_variants
  for select using (true);

drop policy if exists "variants_admin_insert" on public.script_variants;
create policy "variants_admin_insert" on public.script_variants
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "variants_admin_update" on public.script_variants;
create policy "variants_admin_update" on public.script_variants
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "variants_admin_delete" on public.script_variants;
create policy "variants_admin_delete" on public.script_variants
  for delete to authenticated
  using (public.is_admin());

-- 4. Penghitung download per replace
create or replace function public.increment_variant_downloads(variant_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.script_variants set downloads = downloads + 1 where id = variant_id;
$$;

grant execute on function public.increment_variant_downloads(uuid) to anon, authenticated;
