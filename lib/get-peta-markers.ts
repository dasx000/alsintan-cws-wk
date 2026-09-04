import { createClient } from "@/lib/supabase/server";
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

export interface PetaFilters {
  jenis?: string;
  kondisi?: string;
  kecamatan?: string;
  tahun?: string;
  sumber_dana?: string;
}

// Dipakai bersama oleh /peta (dengan filter) dan landing page (tanpa filter,
// tampilkan semua) supaya query-nya tidak diketik ulang di dua tempat.
export async function getPetaMarkers(filters: PetaFilters = {}): Promise<PetaMarkerData[]> {
  const { jenis, kondisi, kecamatan, tahun, sumber_dana } = filters;
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

  const { data: alsintanRaw } = await query;
  const alsintanList = (alsintanRaw ?? []) as unknown as AlsintanMapRow[];

  return alsintanList.map((a) => ({
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
}
