import { createClient } from "@/lib/supabase/server";
import PetaFilter from "@/components/PetaFilter";
import PetaSebaranLoader from "@/components/PetaSebaranLoader";
import type { PetaMarkerData } from "@/components/PetaSebaran";

interface AlsintanMapRow {
  id: string;
  id_unit: string;
  kondisi: string;
  tahun_pengadaan: number;
  latitude: number;
  longitude: number;
  master_jenis_alsintan: { nama_jenis: string; kode_ikon: string } | null;
  penerima: {
    nama_kelompok: string;
    master_desa: { nama_desa: string; id_kecamatan: string; master_kecamatan: { nama_kecamatan: string } | null } | null;
  } | null;
}

export default async function PetaSebaranPage({
  searchParams,
}: {
  searchParams: Promise<{ jenis?: string; kondisi?: string; kecamatan?: string; tahun?: string; sumber_dana?: string }>;
}) {
  const { jenis, kondisi, kecamatan, tahun, sumber_dana } = await searchParams;

  const supabase = await createClient();

  const penerimaJoin = kecamatan ? "penerima!inner" : "penerima";
  const desaJoin = kecamatan ? "master_desa!inner" : "master_desa";

  let query = supabase
    .from("alsintan")
    .select(
      `id, id_unit, kondisi, tahun_pengadaan, latitude, longitude,
       master_jenis_alsintan(nama_jenis, kode_ikon),
       ${penerimaJoin}(nama_kelompok, ${desaJoin}(nama_desa, id_kecamatan, master_kecamatan(nama_kecamatan)))`
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(2000);

  if (jenis) query = query.eq("id_jenis", jenis);
  if (kondisi) query = query.eq("kondisi", kondisi);
  if (tahun) query = query.eq("tahun_pengadaan", Number(tahun));
  if (sumber_dana) query = query.eq("id_sumber_dana", sumber_dana);
  if (kecamatan) query = query.eq("penerima.master_desa.id_kecamatan", kecamatan);

  const [{ data: alsintanRaw }, { data: jenisList }, { data: kecamatanList }, { data: sumberDanaList }, { data: tahunRows }] =
    await Promise.all([
      query,
      supabase.from("master_jenis_alsintan").select("id, nama_jenis").order("nama_jenis"),
      supabase.from("master_kecamatan").select("id_kecamatan, nama_kecamatan").order("nama_kecamatan"),
      supabase.from("master_sumber_dana").select("id, nama_sumber").order("nama_sumber"),
      supabase.from("alsintan").select("tahun_pengadaan"),
    ]);

  const alsintanList = (alsintanRaw ?? []) as unknown as AlsintanMapRow[];

  const markers: PetaMarkerData[] = alsintanList.map((a) => ({
    id: a.id,
    id_unit: a.id_unit,
    kondisi: a.kondisi,
    kode_ikon: a.master_jenis_alsintan?.kode_ikon ?? "generik",
    nama_jenis: a.master_jenis_alsintan?.nama_jenis ?? "-",
    latitude: a.latitude,
    longitude: a.longitude,
    nama_kelompok: a.penerima?.nama_kelompok ?? null,
    nama_desa: a.penerima?.master_desa?.nama_desa ?? null,
    nama_kecamatan: a.penerima?.master_desa?.master_kecamatan?.nama_kecamatan ?? null,
  }));

  const tahunOptions = Array.from(new Set((tahunRows ?? []).map((r) => r.tahun_pengadaan)))
    .sort((a, b) => b - a)
    .map((t) => ({ value: String(t), label: String(t) }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Peta Sebaran Alsintan</h1>
        <p className="text-sm text-gray-500">{markers.length} unit ditampilkan</p>
      </div>

      <PetaFilter
        jenisOptions={(jenisList ?? []).map((j) => ({ value: j.id, label: j.nama_jenis }))}
        kecamatanOptions={(kecamatanList ?? []).map((k) => ({ value: k.id_kecamatan, label: k.nama_kecamatan }))}
        sumberDanaOptions={(sumberDanaList ?? []).map((s) => ({ value: s.id, label: s.nama_sumber }))}
        tahunOptions={tahunOptions}
      />

      {markers.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-gray-500">
          Tidak ada unit dengan lokasi yang cocok dengan filter ini.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <PetaSebaranLoader markers={markers} />
        </div>
      )}
    </div>
  );
}
