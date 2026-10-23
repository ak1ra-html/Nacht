# Script ML Hub

Web katalog download script ML: thumbnail skin, judul script, nama replace, dan link download. Dibangun dengan React (Vite) + Supabase, siap deploy ke Vercel.

## Fitur

- Satu kartu per script (mis. "Fanny Legend"). Saat diklik muncul daftar replace (Elite, dll), masing-nya dengan gambar skin dan tombol download
- Pencarian berdasarkan judul atau replace
- Upcoming: script yang belum rilis tampil di bagian "Segera hadir" tanpa tombol download. Saat sudah siap, tekan tombol **Rilis** di panel admin
- Request Script: pengunjung mengirim request lewat tombol di header. Admin membacanya di tab **Request** (status Baru, Diproses, Selesai). Request tidak bisa dibaca publik
- Preview video YouTube: isi link YouTube di form script, maka di jendela detail muncul pemutar video (dimuat saat diklik, jadi halaman tetap ringan). Kartu yang punya video diberi label "Preview" di pojok kanan bawah gambar
- Deskripsi mendukung baris baru dan paragraf (tekan Enter saat menulis)
- Replace Gratis atau Berbayar: replace gratis memakai tombol **Download**, replace berbayar memakai tombol **Buy** (link beli, mis. chat WhatsApp). Diatur lewat pilihan **Jenis** di panel admin
- Tombol Saluran WhatsApp dan Discord di footer. Ganti link-nya di `src/lib/links.js`
- Admin tersembunyi: tambah, edit, hapus script, upload thumbnail

## 1. Setup Supabase

1. Buat project di https://supabase.com
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu **Run**. Setelah itu jalankan juga `supabase/02-replace-variants.sql` (membuat tabel replace, satu script bisa punya banyak replace), lalu `supabase/03-upcoming-requests.sql` (fitur Upcoming dan Request Script), dan lalu `supabase/04-youtube-preview.sql` (kolom link YouTube), dan terakhir `supabase/05-free-or-paid.sql` (replace Gratis/Berbayar)
3. Buka **Authentication > Users > Add user**, buat akun admin (email + password). Centang auto-confirm
4. Kembali ke SQL Editor, daftarkan akun itu sebagai admin (ganti emailnya):

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'email-admin-kamu@gmail.com';
   ```

5. **Penting:** buka **Authentication > Sign In / Providers** dan matikan **Allow new users to sign up**, supaya tidak ada orang lain yang bisa mendaftar
6. Ambil kunci di **Project Settings > API**: `Project URL` dan `anon public key`

## 2. Jalankan lokal

```bash
npm install
cp .env.example .env     # lalu isi URL dan anon key
npm run dev
```

## 3. Deploy ke Vercel

1. Upload folder ini ke repo GitHub
2. Di https://vercel.com pilih **Add New > Project**, import repo tersebut (preset Vite terdeteksi otomatis)
3. Di **Environment Variables** isi:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Klik **Deploy**

## Cara masuk admin (tombol rahasia)

Ketuk atau klik **logo "Script ML Hub" 5 kali dengan cepat** (dalam 2 detik). Form login admin akan muncul. Setelah login, panel admin tampil di atas daftar script. Demi keamanan, sesi admin **tidak disimpan**: menutup panel (tombol Tutup atau Keluar) atau me-refresh halaman otomatis keluar dari akun, sehingga email dan password harus dimasukkan lagi setiap kali masuk.

Keamanan sebenarnya ada di Supabase, bukan di tombol tersembunyi. Orang yang menemukan form login tetap tidak bisa menambah atau mengubah data tanpa akun yang terdaftar di tabel `admins`, karena Row Level Security menolak semua penulisan dari akun lain. Anon key aman dipublikasikan di frontend, jangan pernah memakai `service_role` key di sini.

## Struktur

```
src/
  App.jsx                  halaman utama + tombol rahasia
  components/
    ScriptCard.jsx         kartu script
    ScriptModal.jsx        daftar replace + tombol download + preview video
    YouTubePreview.jsx     pemutar YouTube (klik untuk memuat)
    SocialLinks.jsx        tombol medsos (header + footer)
    AdminLogin.jsx         form login admin
    AdminPanel.jsx         tambah / edit / hapus script
    VariantManager.jsx     tambah / edit / hapus replace per script
  lib/supabase.js          klien Supabase
  lib/helpers.js           upload gambar, normalisasi link
  lib/links.js             daftar link medsos (WhatsApp, Discord)
public/art/                ilustrasi karakter (stiker)
supabase/schema.sql        tabel, RLS, storage
supabase/02-replace-variants.sql   tabel replace (varian)
supabase/03-upcoming-requests.sql  status upcoming + tabel request script
supabase/04-youtube-preview.sql    kolom link YouTube
supabase/05-free-or-paid.sql       kolom is_free (Gratis/Berbayar)
```
