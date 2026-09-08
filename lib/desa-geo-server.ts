import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Feature, FeatureCollection } from "geojson";
import type { Polygon, MultiPolygon } from "geojson";
import { getRandomPointInPolygon } from "@/lib/polygon-label-point";

const DESA_GEOJSON_PATH = path.join(process.cwd(), "public", "geo", "way-kanan-desa.geojson");

// Cache di level module -- file ~380KB, tidak perlu dibaca ulang tiap baris
// atau tiap request impor selama proses server masih hidup.
let cachedFeatures: Feature[] | null = null;

async function loadDesaFeatures(): Promise<Feature[]> {
  if (cachedFeatures) return cachedFeatures;
  const raw = await readFile(DESA_GEOJSON_PATH, "utf8");
  const data = JSON.parse(raw) as FeatureCollection;
  cachedFeatures = data.features;
  return cachedFeatures;
}

// Versi server (baca file lewat fs, bukan fetch) dari logika yang sama
// dengan AutoPinOnDesaChange di PetaLokasiPicker.tsx -- dipakai saat impor
// Excel untuk mengisi otomatis koordinat baris yang tidak diisi user sendiri.
// null kalau kombinasi nama desa+kecamatan tidak ditemukan di data batas
// (typo, desa di luar Way Kanan, dsb) -- baris impor tetap jalan, koordinat
// baris itu saja yang dikosongkan.
export async function getRandomPointForDesa(
  desaNama: string,
  kecamatanNama: string
): Promise<{ lat: number; lng: number } | null> {
  let features: Feature[];
  try {
    features = await loadDesaFeatures();
  } catch {
    return null;
  }

  const feature = features.find((f) => {
    const namaCocok =
      (f.properties?.NAMOBJ as string | undefined)?.trim().toLowerCase() === desaNama.trim().toLowerCase();
    if (!namaCocok) return false;
    return (f.properties?.WADMKC as string | undefined)?.trim().toLowerCase() === kecamatanNama.trim().toLowerCase();
  });
  if (!feature) return null;

  return getRandomPointInPolygon(feature.geometry as Polygon | MultiPolygon);
}
