import { createClient } from "@/lib/supabase/server";
import { getPetaMarkers } from "@/lib/get-peta-markers";
import PublicPetaHeader from "@/components/PublicPetaHeader";
import PetaFilter from "@/components/PetaFilter";
import PetaSebaranLoader from "@/components/PetaSebaranLoader";
import KepadatanLegend from "@/components/KepadatanLegend";

// Halaman publik (tanpa login) -- lihat migration 0011_public_peta_access.sql
// untuk policy RLS yang membuka akses baca ke role anon. Sengaja dipindah
// keluar dari route group (app) supaya tidak lewat AuthenticatedLayout yang
// redirect ke /login kalau belum ada sesi.
export default async function PetaSebaranPage({
  searchParams,
}: {
  searchParams: Promise<{ jenis?: string; kondisi?: string; kecamatan?: string; tahun?: string; sumber_dana?: string }>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();

  const [markers, { data: jenisList }, { data: kecamatanList }, { data: sumberDanaList }, { data: tahunRows }] =
    await Promise.all([
      getPetaMarkers(filters),
      supabase.from("master_jenis_alsintan").select("id, nama_jenis").order("nama_jenis"),
      supabase.from("master_kecamatan").select("id_kecamatan, nama_kecamatan").order("nama_kecamatan"),
      supabase.from("master_sumber_dana").select("id, nama_sumber").order("nama_sumber"),
      supabase.from("alsintan").select("tahun_pengadaan"),
    ]);

  const tahunOptions = Array.from(new Set((tahunRows ?? []).map((r) => r.tahun_pengadaan)))
    .sort((a, b) => b - a)
    .map((t) => ({ value: String(t), label: String(t) }));

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicPetaHeader />

      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Peta Sebaran Alsintan</h1>
          <p className="text-sm text-gray-500">{markers.length} unit ditampilkan</p>
        </div>

        <PetaFilter
          jenisOptions={(jenisList ?? []).map((j) => ({ value: j.id, label: j.nama_jenis }))}
          kecamatanOptions={(kecamatanList ?? []).map((k) => ({ value: k.nama_kecamatan, label: k.nama_kecamatan }))}
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
            <KepadatanLegend />
          </div>
        )}
      </div>
    </div>
  );
}
