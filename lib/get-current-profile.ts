import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface WilayahDesa {
  id_desa: string;
  nama_desa: string;
  id_kecamatan: string;
  nama_kecamatan: string;
}

export interface CurrentProfile {
  id: string;
  email: string | null;
  nama: string | null;
  nip: string | null;
  // Nilai dari core.memberships.role (app_slug='alsintan') -- dibatasi
  // CHECK constraint DB ke 'admin' | 'operator' | 'viewer' | 'penyuluh_bpp'
  // ('operator'/'viewer' nilai umum lintas-app, tidak dipakai app ini).
  // "penyuluh_bpp" setara konsep "penyuluh" di UI/istilah bisnis app ini.
  role: string;
  koordinator: boolean;
  // Desa-desa yang dipegang langsung (tabel penyuluh_desa).
  desaWilayah: WilayahDesa[];
  // Kecamatan turunan dari desaWilayah -- ini yang dikendalikan penuh kalau
  // koordinator=true. Set (bukan satu nilai) jaga-jaga kalau desa yang
  // dipegang ternyata lintas kecamatan.
  kecamatanWilayah: string[];
}

interface PenyuluhDesaRow {
  master_desa: {
    id_desa: string;
    nama_desa: string;
    id_kecamatan: string;
    master_kecamatan: { nama_kecamatan: string } | null;
  } | null;
}

// cache() dedupe pemanggilan dalam satu request yang sama -- layout.tsx
// (untuk sidebar) dan tiap page.tsx sama-sama butuh user+profile, tanpa ini
// jadi 2x round-trip ke Supabase Auth/DB tiap kali pindah halaman.
export const getCurrentProfile = cache(async (): Promise<{ userId: string; profile: CurrentProfile | null }> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("[getCurrentProfile] tidak ada user (belum login)");
    return { userId: "", profile: null };
  }

  console.log("[getCurrentProfile] profile_id (auth.uid):", user.id);

  // Identitas (nama/nip/role) sekarang datang dari view alsintan.v_pengguna
  // (proyek Supabase shared "FULLSTACK" -- nama/nip aslinya di core.profiles,
  // role di core.memberships per app_slug). Tabel "profiles" lama sudah
  // tidak ada di schema alsintan.
  const [{ data: penggunaRow, error: penggunaError }, { data: koordinatorRow, error: koordinatorError }, { data: desaRows, error: desaError }] =
    await Promise.all([
      supabase.from("v_pengguna").select("nama, nip, role").eq("id", user.id).maybeSingle(),
      supabase.from("penyuluh").select("koordinator").eq("profile_id", user.id).maybeSingle(),
      supabase
        .from("penyuluh_desa")
        .select("master_desa(id_desa, nama_desa, id_kecamatan, master_kecamatan(nama_kecamatan))")
        .eq("profile_id", user.id),
    ]);

  console.log("[getCurrentProfile] v_pengguna:", JSON.stringify(penggunaRow), "error:", penggunaError?.message ?? null);
  console.log("[getCurrentProfile] penyuluh.koordinator:", JSON.stringify(koordinatorRow), "error:", koordinatorError?.message ?? null);
  console.log(
    "[getCurrentProfile] penyuluh_desa rows:",
    JSON.stringify(desaRows),
    "error:",
    desaError?.message ?? null
  );

  const desaWilayah: WilayahDesa[] = ((desaRows ?? []) as unknown as PenyuluhDesaRow[])
    .map((r) => r.master_desa)
    .filter((d): d is NonNullable<typeof d> => d != null)
    .map((d) => ({
      id_desa: d.id_desa,
      nama_desa: d.nama_desa,
      id_kecamatan: d.id_kecamatan,
      nama_kecamatan: d.master_kecamatan?.nama_kecamatan ?? "",
    }));

  const kecamatanWilayah = Array.from(new Set(desaWilayah.map((d) => d.nama_kecamatan).filter(Boolean)));

  const koordinator = koordinatorRow?.koordinator ?? false;

  console.log("[getCurrentProfile] idDesaList:", desaWilayah.map((d) => d.id_desa));
  console.log("[getCurrentProfile] koordinator:", koordinator, "kecamatanWilayah:", kecamatanWilayah);
  if (desaWilayah.length === 0) {
    console.log("[getCurrentProfile] belum ada desa binaan untuk profile_id ini -- akses alsintan akan terkunci kosong");
  }

  return {
    userId: user.id,
    profile: {
      id: user.id,
      email: user.email ?? null,
      nama: penggunaRow?.nama ?? null,
      nip: penggunaRow?.nip ?? null,
      role: penggunaRow?.role ?? "penyuluh_bpp",
      koordinator,
      desaWilayah,
      kecamatanWilayah,
    },
  };
});
