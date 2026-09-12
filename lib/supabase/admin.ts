import "server-only";
import { createClient } from "@supabase/supabase-js";

// Client dengan service role key -- BYPASS RLS sepenuhnya dan bisa
// panggil Supabase Auth Admin API (buat/hapus akun). HANYA boleh dipakai
// di server action/route handler yang SUDAH memverifikasi sendiri bahwa
// pemanggilnya admin (lihat lib/actions/pengguna.ts) -- client ini sendiri
// tidak melakukan pengecekan role apapun. Import "server-only" memastikan
// file ini gagal build kalau ada yang salah import dari client component.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "alsintan" },
  });
}

// Sama seperti createAdminClient(), tapi scoped ke schema "core" -- identitas
// (profiles) + role per-app (memberships) yang dipakai bareng semua app di
// project Supabase "FULLSTACK". v_pengguna di schema alsintan HANYA
// mengembalikan baris milik auth.uid() sesi yang login (bukan daftar semua
// pengguna), jadi untuk kebutuhan admin (daftar SEMUA pengguna, lihat
// app/(app)/pengguna/page.tsx) harus baca core.profiles/core.memberships
// langsung lewat client ini.
export function createAdminCoreClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "core" },
  });
}
