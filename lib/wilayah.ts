import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";

// Kecamatan+desa itu data tetap (15 kecamatan, 227 desa) jadi aman diambil
// sekaligus dalam satu fetch (bukan select tak terbatas pada tabel yang
// terus tumbuh). Kalau profil terikat wilayah (role penyuluh), daftarnya
// difilter:
//  - koordinator=true : kecamatanList dibatasi ke kecamatan turunan
//                        (tempat desa-desa yang dia pegang berada), tapi
//                        desaList tetap lengkap SE-KECAMATAN itu (bukan
//                        cuma desanya sendiri -- koordinator mengurus satu
//                        kecamatan penuh).
//  - koordinator=false: desaList dibatasi persis ke desa-desa yang dia
//                        pegang, kecamatanList ikut disempitkan ke
//                        kecamatan induk desa-desa itu.
export async function getKecamatanDesaForProfile() {
  const supabase = await createClient();

  const [{ profile }, { data: allKecamatan }, { data: allDesa }] = await Promise.all([
    getCurrentProfile(),
    supabase.from("master_kecamatan").select("id_kecamatan, nama_kecamatan").order("nama_kecamatan"),
    supabase.from("master_desa").select("id_desa, id_kecamatan, nama_desa").order("nama_desa"),
  ]);

  let kecamatanList = allKecamatan ?? [];
  let desaList = allDesa ?? [];

  if (profile?.role === "penyuluh") {
    if (profile.koordinator) {
      const idKecamatanSet = new Set(profile.desaWilayah.map((d) => d.id_kecamatan));
      kecamatanList = kecamatanList.filter((k) => idKecamatanSet.has(k.id_kecamatan));
    } else {
      const idDesaSet = new Set(profile.desaWilayah.map((d) => d.id_desa));
      desaList = desaList.filter((d) => idDesaSet.has(d.id_desa));
      const idKecamatanSet = new Set(desaList.map((d) => d.id_kecamatan));
      kecamatanList = kecamatanList.filter((k) => idKecamatanSet.has(k.id_kecamatan));
    }
  }

  return { kecamatanList, desaList, profile };
}
