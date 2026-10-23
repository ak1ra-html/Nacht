-- =====================================================================
-- Migrasi 5: replace bisa ditandai Gratis atau Berbayar
-- Jalankan di Supabase Dashboard > SQL Editor (aman dijalankan ulang).
-- Gratis   = tombol "Download"
-- Berbayar = tombol "Buy" (link di kolom download_url dipakai sebagai link beli)
-- =====================================================================

alter table public.script_variants
  add column if not exists is_free boolean not null default true;

notify pgrst, 'reload schema';
