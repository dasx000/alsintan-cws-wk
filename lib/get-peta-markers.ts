import { createClient } from "@/lib/supabase/server";
import type { PetaMarkerData } from "@/components/PetaSebaran";

interface AlsintanMapRow {
  id: string;
  id_unit: string;
  kondisi: string;
  tahun_pengadaan: number;
  latitude: number;
  longitude: number;
  penerima: string | null;
  desa: string | null;
  kecamatan: string | null;
  master_jenis_alsintan: { nama_jenis: string; kategori: string } | null;
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

  let query = supabase
    .from("alsintan")
    .select(
      `id, id_unit, kondisi, tahun_pengadaan, latitude, longitude, penerima, desa, kecamatan,
       master_jenis_alsintan(nama_jenis, kategori)`
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(2000);

  if (jenis) query = query.eq("id_jenis", jenis);
  if (kondisi) query = query.eq("kondisi", kondisi);
  if (tahun) query = query.eq("tahun_pengadaan", Number(tahun));
  if (sumber_dana) query = query.eq("id_sumber_dana", sumber_dana);
  if (kecamatan) query = query.eq("kecamatan", kecamatan);

  const { data: alsintanRaw } = await query;
  const alsintanList = (alsintanRaw ?? []) as unknown as AlsintanMapRow[];

  return alsintanList.map((a) => ({
    id: a.id,
    id_unit: a.id_unit,
    kondisi: a.kondisi,
    kategori: a.master_jenis_alsintan?.kategori ?? "pra_panen",
    nama_jenis: a.master_jenis_alsintan?.nama_jenis ?? "-",
    latitude: a.latitude,
    longitude: a.longitude,
    nama_kelompok: a.penerima,
    nama_desa: a.desa,
    nama_kecamatan: a.kecamatan,
  }));
}
