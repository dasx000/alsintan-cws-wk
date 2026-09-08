# AlsinTrack

Aplikasi monitoring alat mesin pertanian (alsintan) bantuan pemerintah untuk Kabupaten Way Kanan — pencatatan unit, kondisi, riwayat, dan peta sebaran per kecamatan/desa. Dibangun dengan Next.js (App Router) + Supabase (Postgres, Auth, Storage, RLS).

## Tech stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Supabase** — Postgres, Auth, Storage, Row Level Security
- **Tailwind CSS v4**
- **Leaflet** / `react-leaflet` — peta sebaran & pemilih lokasi
- **Recharts** — grafik dashboard
- **ExcelJS** — impor/ekspor data alsintan via Excel

## Struktur

- `app/(app)/` — halaman setelah login: `dashboard`, `alsintan` (daftar/tambah/edit/detail/impor), `jenis-alsintan`, `pengguna`, `profil`
- `app/(auth)/login/` — halaman login (email atau NIP)
- `app/page.tsx` — landing page publik (statistik ringkas + peta sebaran)
- `app/peta/` — halaman peta sebaran versi penuh
- `app/api/alsintan/` — route handler ekspor Excel & unduh template impor
- `components/` — komponen UI, dikelompokkan per fitur (`landing/`, `dashboard/`, dll)
- `lib/actions/` — Next.js Server Actions (CRUD alsintan, pengguna, auth, dll)
- `lib/supabase/` — inisialisasi Supabase client (`server.ts`, `client.ts`, `admin.ts`)
- `supabase/migrations/` — seluruh riwayat skema database, urut secara kronologis

## Model peran

Dua role: **admin** (akses penuh se-kabupaten) dan **penyuluh** (dibatasi wilayah lewat tabel `profile_desa`, boleh pegang 1+ desa). Penyuluh dengan flag `koordinator = true` otomatis mengendalikan seluruh kecamatan tempat desa-desa yang dia pegang berada, bukan cuma desanya sendiri. Login bisa pakai email atau NIP.

## Setup

1. Buat project di [supabase.com](https://supabase.com).
2. Jalankan semua file di `supabase/migrations/` **secara berurutan** (0001, 0002, ...) lewat SQL Editor — tidak ada tooling migrasi otomatis di project ini, tiap file dijalankan manual sekali.
3. Salin `.env.local.example` ke `.env.local`, isi 3 variabelnya (URL, anon key, service role key — semua ada di Project Settings > API).
4. `npm install`
5. `npm run dev` lalu buka [http://localhost:3000](http://localhost:3000)

## Deploy

Deploy sebagai project Next.js biasa (mis. Vercel). Set 3 environment variable yang sama seperti di `.env.local` pada pengaturan project — terutama `SUPABASE_SERVICE_ROLE_KEY` yang wajib ada di server (bukan `NEXT_PUBLIC_*`) untuk fitur kelola pengguna, login via NIP, edit profil, dan impor Excel.
