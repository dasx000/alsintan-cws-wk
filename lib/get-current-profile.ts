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
  role: string;
  koordinator: boolean;
  // Desa-desa yang dipegang langsung (tabel profile_desa).
  desaWilayah: WilayahDesa[];
  // Kecamatan turunan dari desaWilayah -- ini yang dikendalikan penuh kalau
  // koordinator=true. Set (bukan satu nilai) jaga-jaga kalau desa yang
  // dipegang ternyata lintas kecamatan.
  kecamatanWilayah: string[];
}

interface ProfileDesaRow {
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
    return { userId: "", profile: null };
  }

  const [{ data: profileRow }, { data: desaRows }] = await Promise.all([
    supabase.from("profiles").select("nama, nip, role, koordinator").eq("id", user.id).single(),
    supabase
      .from("profile_desa")
      .select("master_desa(id_desa, nama_desa, id_kecamatan, master_kecamatan(nama_kecamatan))")
      .eq("profile_id", user.id),
  ]);

  const desaWilayah: WilayahDesa[] = ((desaRows ?? []) as unknown as ProfileDesaRow[])
    .map((r) => r.master_desa)
    .filter((d): d is NonNullable<typeof d> => d != null)
    .map((d) => ({
      id_desa: d.id_desa,
      nama_desa: d.nama_desa,
      id_kecamatan: d.id_kecamatan,
      nama_kecamatan: d.master_kecamatan?.nama_kecamatan ?? "",
    }));

  const kecamatanWilayah = Array.from(new Set(desaWilayah.map((d) => d.nama_kecamatan).filter(Boolean)));

  return {
    userId: user.id,
    profile: {
      id: user.id,
      email: user.email ?? null,
      nama: profileRow?.nama ?? null,
      nip: profileRow?.nip ?? null,
      role: profileRow?.role ?? "penyuluh",
      koordinator: profileRow?.koordinator ?? false,
      desaWilayah,
      kecamatanWilayah,
    },
  };
});
