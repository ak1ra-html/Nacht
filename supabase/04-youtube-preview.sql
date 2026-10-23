-- =====================================================================
-- Migrasi 4: preview video YouTube pada script
-- Jalankan di Supabase Dashboard > SQL Editor (aman dijalankan ulang).
-- =====================================================================

alter table public.scripts
  add column if not exists youtube_url text
    check (youtube_url is null or char_length(youtube_url) <= 300);

notify pgrst, 'reload schema';
