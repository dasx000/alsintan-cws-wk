import { createClient } from "@/lib/supabase/server";

// Kecamatan+desa itu data tetap (15 kecamatan, 227 desa) jadi aman diambil
// sekaligus dalam satu fetch (bukan select tak terbatas pada tabel yang
// terus tumbuh). Kalau profil penyuluh terikat wilayah, kecamatanList
// difilter jadi cuma kecamatannya sendiri.
export async function getKecamatanDesaForProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, id_kecamatan_wilayah")
    .eq("id", user!.id)
    .single();

  const [{ data: allKecamatan }, { data: allDesa }] = await Promise.all([
    supabase.from("master_kecamatan").select("id_kecamatan, nama_kecamatan").order("nama_kecamatan"),
    supabase.from("master_desa").select("id_desa, id_kecamatan, nama_desa").order("nama_desa"),
  ]);

  const kecamatanList = profile?.id_kecamatan_wilayah
    ? (allKecamatan ?? []).filter((k) => k.id_kecamatan === profile.id_kecamatan_wilayah)
    : (allKecamatan ?? []);

  return { kecamatanList, desaList: allDesa ?? [], profile };
}
