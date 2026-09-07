import { createClient } from "@/lib/supabase/server";
import { getKecamatanDesaForProfile } from "@/lib/wilayah";

export async function getAlsintanFormData() {
  const supabase = await createClient();
  const { kecamatanList, desaList } = await getKecamatanDesaForProfile();

  const [{ data: jenisList }, { data: sumberDanaList }] = await Promise.all([
    supabase.from("master_jenis_alsintan").select("id, nama_jenis, kategori").order("nama_jenis"),
    supabase.from("master_sumber_dana").select("id, nama_sumber").order("nama_sumber"),
  ]);

  return {
    jenisList: jenisList ?? [],
    sumberDanaList: sumberDanaList ?? [],
    kecamatanList,
    desaList,
  };
}
