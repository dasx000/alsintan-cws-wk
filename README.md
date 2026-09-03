# CRUD Alat - Testing Stack Next.js + Supabase + Vercel

Project percobaan untuk memastikan alur Next.js (App Router, TypeScript) + Supabase (Postgres) + Vercel berjalan lancar, sebelum lanjut ke aplikasi database alsintan yang sebenarnya.

## Struktur

- `app/` — routing (App Router): `/` (daftar), `/tambah`, `/edit/[id]`
- `components/FormAlat.tsx` — form input, dipakai di halaman tambah & edit
- `lib/supabase.ts` — satu-satunya tempat inisialisasi Supabase client
- `lib/types.ts` — tipe data `Alat`
- `supabase/schema.sql` — SQL untuk membuat tabel `alat` di Supabase

## Setup

1. Buat project di [supabase.com](https://supabase.com), lalu jalankan isi `supabase/schema.sql` di SQL Editor.
2. Salin `.env.local.example` ke `.env.local`, isi dengan URL & anon key dari Supabase (Project Settings > API).
3. `npm install`
4. `npm run dev` lalu buka [http://localhost:3000](http://localhost:3000)

Catatan: RLS pada tabel `alat` sengaja dibuat permisif (akses publik) untuk keperluan testing ini saja — jangan dipakai apa adanya untuk data sungguhan.
