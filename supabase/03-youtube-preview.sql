-- =====================================================================
-- Migrasi: link YouTube preview per script
-- Jalankan di Supabase Dashboard > SQL Editor (aman dijalankan ulang).
-- Jalankan SEBELUM deploy versi web terbaru.
-- =====================================================================
alter table public.scripts add column if not exists youtube_url text;
