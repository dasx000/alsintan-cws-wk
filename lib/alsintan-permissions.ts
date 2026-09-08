import type { CurrentProfile } from "@/lib/get-current-profile";

// Aturan akses tulis alsintan (cermin dari fungsi can_manage_wilayah()
// di supabase/migrations/0024_penyuluh_multidesa_koordinator.sql):
//  - admin              : semua baris.
//  - penyuluh koordinator: baris yang kecamatan-nya termasuk salah satu
//                          kecamatan turunan (lihat kecamatanWilayah di
//                          get-current-profile.ts).
//  - penyuluh biasa      : baris yang desa-nya termasuk salah satu desa
//                          yang dia pegang.
// Belum pegang desa sama sekali = tidak ada akses tulis, bukan "tidak
// dibatasi" -- lihat catatan keamanan di migration. Helper ini HANYA untuk
// UI (tampil/sembunyikan tombol) -- RLS di database tetap penegak aturan
// yang sebenarnya.

export function canCreateAlsintan(profile: CurrentProfile | null): boolean {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  if (profile.role === "penyuluh") return profile.desaWilayah.length > 0;
  return false;
}

export function canManageAlsintanRow(
  profile: CurrentProfile | null,
  row: { kecamatan: string | null; desa: string | null }
): boolean {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  if (profile.role === "penyuluh") {
    if (profile.koordinator) {
      return !!row.kecamatan && profile.kecamatanWilayah.includes(row.kecamatan);
    }
    return !!row.desa && profile.desaWilayah.some((d) => d.nama_desa === row.desa);
  }
  return false;
}

export interface AlsintanFilterScope {
  // Non-null = daftar alsintan (dan pilihan filternya) dikunci ke wilayah
  // ini -- admin selalu null/null (tidak dibatasi).
  lockedKecamatan: string[] | null;
  lockedDesa: string[] | null;
}

// Menu Alsintan boleh dilihat semua role, tapi cakupannya dikunci sesuai
// wilayah: koordinator dikunci ke kecamatan yang dia koordinasikan, penyuluh
// biasa dikunci ke desa yang dia pegang. Dipakai di app/(app)/alsintan/page.tsx
// untuk membatasi query DAN opsi dropdown filter -- bukan cuma nilai default.
export function getAlsintanFilterScope(profile: CurrentProfile | null): AlsintanFilterScope {
  if (!profile || profile.role !== "penyuluh") return { lockedKecamatan: null, lockedDesa: null };
  if (profile.koordinator) {
    return { lockedKecamatan: profile.kecamatanWilayah, lockedDesa: null };
  }
  return { lockedKecamatan: null, lockedDesa: profile.desaWilayah.map((d) => d.nama_desa) };
}
