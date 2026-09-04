import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Format: ALS-{kode 6 digit kecamatan}-{kode kategori}-{tahun}-{urut}, kode
// kategori PP (pra panen) / PS (pasca panen). Urut reset per kombinasi
// kecamatan+kategori+tahun, ditentukan dari id_unit terakhir yang match
// prefix yang sama (bukan sequence Postgres terpisah -- cukup untuk skala
// penggunaan beberapa penyuluh, race condition langka ditangani lewat
// UNIQUE constraint + pesan retry di action pemanggilnya).
export async function generateIdUnit(
  supabase: SupabaseServerClient,
  idKecamatan: string,
  kodeKategori: string,
  tahun: number
): Promise<string> {
  const prefix = `ALS-${idKecamatan}-${kodeKategori}-${tahun}-`;

  const { data, error } = await supabase
    .from("alsintan")
    .select("id_unit")
    .like("id_unit", `${prefix}%`)
    .order("id_unit", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);

  let nextSeq = 1;
  if (data && data.length > 0) {
    const lastSeq = parseInt(data[0].id_unit.slice(prefix.length), 10);
    if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}
