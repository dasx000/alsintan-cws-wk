# Prompt: Aplikasi Database & Peta Sebaran Alsintan Bantuan Pemerintah (Versi Final)

Ada **DUA file** yang perlu dibawa ke VS Code:
1. File prompt ini (`prompt-aplikasi-alsintan-final.md`) — salin ke AI agent (Claude Code/Codex/dsb).
2. File `0002_seed_wilayah.sql` (dilampirkan terpisah) — berisi 227 baris data desa Way Kanan lengkap dengan kode resmi, taruh langsung di `supabase/migrations/0002_seed_wilayah.sql` di project, jangan diketik ulang manual.

Project testing CRUD sebelumnya sudah berhasil, sekarang lanjut ke aplikasi sesungguhnya.

---

## KONTEKS PROYEK

Buatkan aplikasi web untuk membantu penyuluh pertanian memonitoring bantuan alat mesin pertanian (alsintan) dari pemerintah di tingkat kabupaten. Ini aplikasi internal tanpa anggaran — tujuannya murni memudahkan pekerjaan penyuluh, bukan proyek komersial. Fokus utama: database lengkap per unit alsintan, riwayat/histori tiap unit, dan peta sebaran lokasi.

**Prioritas utama: aplikasi harus SECEPAT dan SERINGAN mungkin.** Ini dipakai penyuluh di lapangan, kadang dengan koneksi internet pas-pasan dan HP yang bukan spek tinggi. Setiap keputusan teknis di bawah ini harus mempertimbangkan performa dulu, fitur belakangan.

## STACK (SUDAH TERVALIDASI, JANGAN DIGANTI)

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Storage foto:** Supabase Storage
- **Auth:** Supabase Auth (email + password)
- **Peta:** Leaflet.js + OpenStreetMap (gratis, tanpa API key)
- **Hosting:** Vercel (free tier)

## PRINSIP PERFORMA & KESEDERHANAAN (WAJIB DIIKUTI)

1. **Server Components sebagai default.** Pakai React Server Component di Next.js untuk halaman yang menampilkan data (list, detail) — jangan jadikan semua halaman `"use client"`. Client Component hanya untuk bagian yang benar-benar interaktif (form, filter peta, tombol).
2. **Lazy-load peta.** Komponen Leaflet di-import secara dynamic (`next/dynamic`, `ssr: false`) supaya tidak membebani halaman lain yang tidak butuh peta.
3. **Pagination di semua tabel/list.** Jangan pernah `select *` tanpa limit — gunakan pagination Supabase (`.range()`) supaya halaman tidak lambat saat data sudah ratusan/ribuan baris.
4. **Foto wajib dikompresi di browser sebelum upload**, target akhir **maksimal 500KB per foto**, resize ke lebar maksimal ~1000px, format JPEG. Pakai library ringan (`browser-image-compression` atau kompresi manual via `canvas`) — jangan upload file asli dari kamera HP.
5. **1 unit alsintan = 1 foto saja** (bukan galeri banyak foto). Kolom `foto_url` tunggal di tabel, upload foto baru menggantikan yang lama (hapus file lama dari Storage supaya tidak menumpuk sampah).
6. **Jangan install library berat yang tidak esensial.** Hindari UI library besar (seperti MUI/Ant Design) — cukup Tailwind murni + komponen custom ringan. Untuk ikon, gunakan `lucide-react` (ringan) kalau dibutuhkan.
7. **Query Supabase seefisien mungkin** — ambil hanya kolom yang dipakai (`select('id, nama, kondisi')`, bukan `select('*')` kalau tidak semua kolom dipakai), manfaatkan index di kolom yang sering difilter (kecamatan, kondisi, jenis).
8. **Minim dependency.** Sebelum install package baru, pertimbangkan apakah bisa dikerjakan dengan fitur native Next.js/browser dulu.

## SKEMA DATABASE — WAJIB PAKAI MIGRATION, BUKAN SATU FILE SCHEMA BESAR

Struktur data alsintan biasanya berubah dan bertambah seiring waktu (kolom baru, tabel baru). Karena itu, JANGAN buat satu file `schema.sql` besar yang nanti diedit manual. Sebagai gantinya:

- Gunakan Supabase CLI dan folder `supabase/migrations/`, dengan file bernomor urut, contoh:
  - `0001_init.sql` — seluruh skema awal di bawah ini (tabel, enum, index, RLS)
  - `0002_seed_wilayah.sql` — data 15 kecamatan + 227 desa Way Kanan dengan kode wilayah resmi (file sudah disediakan terpisah, lihat bagian "Data Awal" di bawah — TINGGAL SALIN, jangan ditulis ulang manual)
  - `0003_seed_jenis_alsintan.sql` — data awal jenis alsintan (lihat bagian "Data Awal" di bawah)
  - File berikutnya menyusul kalau nanti ada tambahan kolom/tabel
- Setiap perubahan struktur di masa depan = file migration baru (`ALTER TABLE ... ADD COLUMN ...`, `CREATE TABLE ...`), jangan pernah edit file migration lama yang sudah dijalankan.
- Jelaskan di README cara pakai `supabase migration new nama_perubahan` dan `supabase db push` untuk menjalankan migration.
- Prinsip aman: menambah kolom/tabel baru = boleh langsung. Mengubah tipe data atau menghapus kolom = harus lewat migration bertahap (tambah kolom baru → migrasikan data → baru hapus kolom lama), jangan langsung diubah di tempat.

Isi `0001_init.sql` berisi seluruh `CREATE TABLE` di bawah, plus index yang relevan:

```
-- master_kecamatan: id_kecamatan (TEXT, primary key, pakai kode resmi Kemendagri/BPS
--                    6 digit misal "180801"), nama_kecamatan (unique)
-- master_desa: id_desa (TEXT, primary key, kode resmi 10 digit misal "1808011005"),
--              id_kecamatan (FK ke master_kecamatan), nama_desa
-- master_jenis_alsintan: id, nama_jenis (unique), kode_ikon (text, untuk pemetaan
--                         ikon di peta, misal "traktor_r2", "traktor_r4"), created_at
-- master_sumber_dana: id, nama_sumber
-- penerima: id, nama_kelompok, jenis_kelompok (poktan/gapoktan/upja/brigade),
--           nama_ketua, kontak, id_desa (FK ke master_desa), luas_garapan_ha
--           -- kecamatan didapat lewat JOIN master_desa -> master_kecamatan,
--           -- tidak perlu disimpan dobel di tabel ini
-- alsintan: id, id_unit (unique, format ALS-{KECAMATAN}-{JENIS}-{TAHUN}-{URUT}),
--           id_jenis (FK), merk, tipe, no_rangka, no_mesin, tahun_pengadaan,
--           id_sumber_dana (FK), no_bast, tanggal_bast, nilai_aset, kondisi
--           (enum: baik/rusak_ringan/rusak_berat/hilang),
--           id_penerima_saat_ini (FK, nullable), foto_url, latitude, longitude,
--           catatan, dibuat_oleh, created_at, updated_at
-- mutasi: id, id_alsintan (FK), id_penerima_lama (FK), id_penerima_baru (FK),
--         tanggal, no_surat, keterangan, dibuat_oleh, created_at
-- pemanfaatan: id, id_alsintan (FK), tanggal, luas_layanan_ha, komoditas,
--              operator, dibuat_oleh, created_at
-- servis: id, id_alsintan (FK), tanggal, kerusakan, biaya, sparepart,
--         status (enum: proses/selesai), dibuat_oleh, created_at
-- monev: id, id_alsintan (FK), tanggal_kunjungan, kondisi_terverifikasi,
--        catatan, foto_url, petugas, created_at
-- profiles: id (FK ke auth.users), email, nama, role (enum: admin/penyuluh/viewer),
--           id_kecamatan_wilayah (FK ke master_kecamatan, nullable, untuk batasi
--           akses penyuluh per wilayah)
```

Gunakan tabel master `master_kecamatan` dan `master_desa` (bukan kolom teks bebas) untuk wilayah di `penerima` dan `profiles`, dengan **ID resmi pemerintah** (bukan auto-increment sendiri) sebagai primary key — supaya kalau nanti data ini perlu disandingkan dengan data resmi dari dinas/BPS/Kemendagri, ID-nya sudah cocok tanpa perlu mapping ulang.

Gunakan tipe data yang tepat (enum Postgres untuk `kondisi`, `role`, `status`), foreign key dengan `ON DELETE SET NULL` atau `RESTRICT` sesuai konteks (jangan `CASCADE` yang bisa menghapus riwayat penting tanpa sengaja), dan index di kolom yang akan sering difilter: `kondisi`, `id_jenis`, `tahun_pengadaan`, dan `id_kecamatan` di `master_desa` (supaya join `penerima -> master_desa -> master_kecamatan` cepat saat difilter per kecamatan).

### Data awal (seed) untuk `master_kecamatan` dan `master_desa`

Saya sudah sediakan file SQL siap pakai — **salin isinya persis ke `supabase/migrations/0002_seed_wilayah.sql`, jangan ditulis ulang manual** (rawan typo untuk 227 baris data desa):

```sql
-- ISI FILE 0002_seed_wilayah.sql (salin persis):

INSERT INTO master_kecamatan (id_kecamatan, nama_kecamatan) VALUES
  ('180801', 'Blambangan Umpu'),
  ('180802', 'Kasui'),
  ('180803', 'Banjit'),
  ('180804', 'Baradatu'),
  ('180805', 'Bahuga'),
  ('180806', 'Pakuan Ratu'),
  ('180807', 'Negeri Agung'),
  ('180808', 'Way Tuba'),
  ('180809', 'Rebang Tangkas'),
  ('180810', 'Gunung Labuhan'),
  ('180811', 'Negara Batin'),
  ('180812', 'Negeri Besar'),
  ('180813', 'Buay Bahuga'),
  ('180814', 'Bumi Agung'),
  ('180815', 'Umpu Semenguk')
ON CONFLICT (id_kecamatan) DO NOTHING;

-- INSERT INTO master_desa (id_desa, id_kecamatan, nama_desa) VALUES (...)
-- 227 baris data desa disediakan LENGKAP di file terpisah "0002_seed_wilayah.sql"
-- yang saya lampirkan bersama prompt ini — salin isinya apa adanya ke migration,
-- JANGAN diketik ulang manual atau digenerate ulang oleh agent (rawan typo/salah
-- kode wilayah untuk 227 baris). Kalau file lampiran tidak ikut ter-copy ke agent,
-- minta saya kirimkan ulang isinya.
```

**Catatan untuk agent:** kode wilayah (`id_kecamatan`, `id_desa`) di atas adalah kode resmi pemerintah — simpan sebagai kolom `TEXT`, bukan `INTEGER` atau `SERIAL`, karena beberapa kode bisa berawalan angka yang bermakna posisional (bukan urutan matematis) dan harus tetap presisi sesuai sumber, bukan digenerate ulang oleh database.

### Data awal (seed) untuk `master_jenis_alsintan`

Isi migration `0003_seed_jenis_alsintan.sql` dengan minimal dua baris awal:

```
Traktor Roda 2  -> kode_ikon: traktor_r2
Traktor Roda 4  -> kode_ikon: traktor_r4
```

Jenis lain (pompa air, rice transplanter, combine harvester, dryer, dll) TIDAK perlu di-seed dari awal — akan ditambahkan lewat menu CRUD jenis alsintan yang dijelaskan di bagian fitur di bawah, karena daftar jenis ini harus dinamis, bukan hardcode di kode aplikasi. Berbeda dengan kecamatan (yang jumlahnya tetap 15 dan sudah baku dari pemerintah), jenis alsintan memang perlu tetap bisa ditambah admin kapan saja.

## ROLE & HAK AKSES (ROW LEVEL SECURITY)

Tiga role, diatur lewat tabel `profiles` + Supabase RLS policy (bukan logic manual di frontend):

- **admin** — akses penuh: baca, tulis, ubah, hapus semua data, kelola pengguna dan master data.
- **penyuluh** — bisa baca semua data, bisa tambah/ubah data (alsintan, riwayat mutasi/servis/pemanfaatan/monev). Kalau kolom `id_kecamatan_wilayah` di profil penyuluh terisi, batasi dia hanya bisa **ubah** data di kecamatan itu (baca tetap boleh semua, supaya penyuluh bisa lihat gambaran kabupaten). Tidak boleh hapus data.
- **viewer** — hanya baca (read-only) semua data, tidak bisa tambah/ubah/hapus apa pun. Cocok untuk pimpinan/atasan yang cuma mau lihat laporan.

Tulis RLS policy langsung di file migration `0001_init.sql` untuk tiap tabel (`SELECT`, `INSERT`, `UPDATE`, `DELETE` masing-masing punya policy sendiri sesuai role di atas). Jangan hanya mengandalkan pengecekan role di frontend — itu bisa dibypass, RLS di database adalah lapisan keamanan yang sesungguhnya.

## STRUKTUR PROJECT

```
app/
  (auth)/login/page.tsx
  dashboard/page.tsx              -- ringkasan statistik
  alsintan/page.tsx               -- daftar unit (server component, pagination)
  alsintan/[id]/page.tsx          -- detail unit + seluruh riwayat
  alsintan/tambah/page.tsx
  alsintan/[id]/edit/page.tsx
  penerima/page.tsx               -- CRUD kelompok tani
  jenis-alsintan/page.tsx         -- CRUD master jenis alsintan (admin)
  peta/page.tsx                   -- peta sebaran (client component, dynamic import)
  pengguna/page.tsx                -- kelola user & role (admin only)
lib/
  supabase/client.ts               -- Supabase client sisi browser
  supabase/server.ts               -- Supabase client sisi server (Server Component/Action)
  compress-image.ts                -- fungsi kompresi foto sebelum upload
  generate-id-unit.ts              -- logic generate ID unit otomatis
components/
  FormAlsintan.tsx
  PetaSebaran.tsx                  -- wrapper Leaflet, dynamic import
  IkonJenisAlsintan.tsx            -- pemetaan kode_ikon -> SVG ikon marker per jenis
  TabelRiwayat.tsx
  RoleGuard.tsx                    -- proteksi halaman berdasar role di sisi client (pelengkap RLS, bukan pengganti)
middleware.ts                      -- proteksi route: redirect ke /login kalau belum auth
supabase/
  migrations/
    0001_init.sql
    0002_seed_wilayah.sql
    0003_seed_jenis_alsintan.sql
```

## FITUR YANG HARUS ADA

### 1. Login
Halaman login sederhana (email + password via Supabase Auth). Setelah login, redirect sesuai ada tidaknya sesi. `middleware.ts` melindungi semua route di bawah `/dashboard`, `/alsintan`, dll — kalau belum login, redirect ke `/login`.

### 2. Dashboard ringkas
Statistik: total unit per jenis, per kondisi, per kecamatan. Daftar unit "perlu perhatian" (tidak ada laporan pemanfaatan >3 bulan, atau rusak berat tanpa servis lanjutan). Query harus efisien — gunakan agregasi di level database (`count()`, `group by` lewat Supabase RPC/view) bukan ambil semua baris lalu dihitung di JavaScript.

### 3. CRUD alsintan
- Form tambah/edit sesuai skema, dengan generate ID unit otomatis.
- Upload foto dengan kompresi otomatis sisi browser (max 500KB, resize ~1000px).
- Input lokasi dengan klik di peta Leaflet mini di dalam form (bukan ketik koordinat manual).
- Halaman detail menampilkan data + seluruh riwayat (mutasi, servis, pemanfaatan, monev) dalam satu halaman.

### 4. CRUD penerima/kelompok tani
Sederhana, sesuai skema `penerima`. Form input desa pakai dua dropdown berjenjang: pilih kecamatan dulu (dari `master_kecamatan`), lalu dropdown desa terfilter otomatis sesuai kecamatan yang dipilih (dari `master_desa`) — supaya penyuluh tidak harus scroll 227 desa sekaligus.

### 4b. CRUD jenis alsintan (master data dinamis)
- Halaman `/jenis-alsintan` — hanya admin yang bisa tambah/ubah/hapus, role lain hanya bisa baca (dipakai untuk pilihan dropdown di form).
- Field: `nama_jenis` dan `kode_ikon` (dipilih dari daftar ikon yang tersedia di aplikasi — lihat bagian ikon peta di poin 5).
- Data awal sudah terisi "Traktor Roda 2" dan "Traktor Roda 4" lewat seed migration. Admin bisa tambah jenis lain kapan saja (pompa air, rice transplanter, combine harvester, dryer, dll) tanpa perlu ubah kode aplikasi.
- Dropdown "jenis alsintan" di form tambah/edit unit alsintan mengambil data dari tabel ini secara dinamis lewat query, bukan opsi hardcode di kode.
- Sebelum menghapus satu jenis, cek dulu apakah masih ada unit alsintan yang memakainya — kalau ada, tolak penghapusan dengan pesan jelas (supaya `id_jenis` di tabel alsintan tidak jadi rusak/yatim).

### 5. Peta sebaran
- Halaman `/peta` menampilkan semua unit sebagai marker Leaflet dengan marker clustering (`leaflet.markercluster` atau `react-leaflet-cluster`).
- **Ikon marker dibedakan per JENIS alsintan** (bukan cuma warna) — supaya dari peta langsung kelihatan mana traktor roda 2, mana roda 4, dst tanpa perlu klik dulu. Buat set ikon SVG sederhana dan ringan (bukan file gambar besar) untuk tiap jenis, dipetakan lewat kolom `kode_ikon` di `master_jenis_alsintan` — misal siluet traktor kecil untuk roda 2, siluet traktor lebih besar untuk roda 4, dan satu ikon generik (misal roda gigi) untuk jenis yang belum punya ikon khusus (supaya kalau admin tambah jenis baru lewat CRUD dan belum sempat dibuatkan ikon custom, marker tetap tampil, tidak kosong/error).
- **Warna pada border/badge kecil di ikon menunjukkan kondisi** (baik=hijau, rusak ringan=kuning, rusak berat=merah, hilang=abu) — jadi satu marker sekaligus menunjukkan JENIS (lewat bentuk ikon) dan KONDISI (lewat warna) tanpa perlu klik atau filter dua kali.
- Buat komponen `IkonJenisAlsintan.tsx` yang memetakan `kode_ikon` ke SVG masing-masing dengan fallback ikon generik untuk kode yang belum terdaftar.
- Filter: jenis, kondisi, kecamatan (dari `master_kecamatan`, filter ini otomatis mencakup semua desa di kecamatan itu lewat join), tahun pengadaan, sumber dana.
- Klik marker → popup ringkas + link ke halaman detail.
- Karena prioritas performa: batasi jumlah marker yang di-load sekaligus dengan query terfilter dari server, jangan load semua data lalu filter di client kalau datanya sudah besar.

### 6. Riwayat (mutasi, servis, pemanfaatan, monev)
Form tambah entri riwayat dari halaman detail unit, tampil sebagai timeline/tabel terurut tanggal terbaru.

### 7. Kelola pengguna (admin only)
Admin bisa lihat daftar user, ubah role, set `id_kecamatan_wilayah` (pilih dari 15 kecamatan) untuk penyuluh.

### 8. Ekspor data
Tombol ekspor tabel alsintan ke CSV/Excel (pakai library ringan seperti `papaparse` untuk CSV, hindari library Excel yang berat kalau CSV sudah cukup).

## YANG TIDAK PERLU DIBUAT

- Jangan buat mode offline/PWA.
- Jangan pakai Google Maps API (butuh billing).
- Jangan buat sistem galeri multi-foto per unit — cukup 1 foto per unit.
- Jangan install UI library berat (MUI, Ant Design, Chakra) — Tailwind saja.
- Jangan buat notifikasi WhatsApp/SMS otomatis — cukup daftar "perlu perhatian" di dashboard.

## URUTAN PENGERJAAN

Kerjakan bertahap, pastikan tiap tahap bisa dites sebelum lanjut:

1. Setup migration `0001_init.sql` (tabel, enum, index, RLS policy) + `0002_seed_wilayah.sql` (15 kecamatan + 227 desa) + `0003_seed_jenis_alsintan.sql`, jalankan di Supabase project baru (khusus aplikasi ini, terpisah dari project testing sebelumnya).
2. Setup Next.js project + koneksi Supabase (client & server) + `middleware.ts` untuk proteksi route.
3. Login page + halaman dashboard kosong (pastikan auth & redirect jalan dulu).
4. CRUD jenis alsintan (supaya dropdown jenis di form alsintan sudah ada datanya).
5. CRUD alsintan lengkap (termasuk kompresi foto & generate ID).
6. CRUD penerima.
7. Modul riwayat (mutasi, servis, pemanfaatan, monev) di halaman detail.
8. Halaman peta sebaran dengan ikon per jenis, warna per kondisi, filter, dan clustering.
9. Dashboard statistik.
10. Kelola pengguna (admin only).
11. Ekspor CSV.

Setelah selesai, buatkan `README.md` berisi: cara setup Supabase project dari nol (jalankan seluruh migration di `supabase/migrations/` urut, aktifkan RLS, cara membuat user admin pertama kali), cara jalankan lokal, cara deploy ke Vercel (environment variable yang dibutuhkan), cara menjalankan migration baru di kemudian hari (`supabase migration new` + `supabase db push`), dan struktur folder + penjelasan singkat tiap bagian.

## PERTANYAAN SEBELUM MULAI

Tanyakan ke saya sebelum mulai coding kalau ada yang ambigu — terutama: nama resmi instansi untuk branding, dan apakah saya sudah punya project Supabase baru yang khusus untuk aplikasi ini (bukan project testing sebelumnya) atau perlu dipandu bikin dari nol. (Daftar 15 kecamatan sudah ditentukan di seed data, tidak perlu ditanyakan lagi.)
