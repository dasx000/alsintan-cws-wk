import { createClient } from "@/lib/supabase/server";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingDataSection, { type YearlyDatum } from "@/components/landing/LandingDataSection";
import type { KategoriDatum } from "@/components/landing/KategoriChart";
import type { JenisDatum } from "@/components/landing/JenisChart";
import type { KecamatanDatum } from "@/components/landing/TopKecamatanChart";
import type { KecamatanDetailRow } from "@/components/landing/KecamatanExplorer";
import LandingSebaranSection from "@/components/landing/LandingSebaranSection";
import LandingFooter from "@/components/landing/LandingFooter";
import { getPetaMarkers } from "@/lib/get-peta-markers";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: stats, error: statsError } = await supabase
    .rpc("get_landing_stats")
    .single<{ total_alsintan: number; total_kelompok: number }>();

  if (statsError) {
    console.error("get_landing_stats gagal (migration 0008/0020 sudah dijalankan?):", statsError.message);
  }

  const { data: yearly, error: yearlyError } = await supabase.rpc("get_landing_yearly_stats");

  if (yearlyError) {
    console.error("get_landing_yearly_stats gagal (migration 0009 sudah dijalankan?):", yearlyError.message);
  }

  const { data: kategori, error: kategoriError } = await supabase.rpc("get_landing_kategori_stats");

  if (kategoriError) {
    console.error("get_landing_kategori_stats gagal (migration 0015 sudah dijalankan?):", kategoriError.message);
  }

  const { data: jenis, error: jenisError } = await supabase.rpc("get_landing_jenis_stats");

  if (jenisError) {
    console.error("get_landing_jenis_stats gagal (migration 0016 sudah dijalankan?):", jenisError.message);
  }

  const { data: kecamatanStats, error: kecamatanStatsError } = await supabase.rpc("get_landing_kecamatan_stats");

  if (kecamatanStatsError) {
    console.error("get_landing_kecamatan_stats gagal (migration 0010/0014 sudah dijalankan?):", kecamatanStatsError.message);
  }

  const { data: kecamatanDetail, error: kecamatanDetailError } = await supabase.rpc("get_landing_kecamatan_detail");

  if (kecamatanDetailError) {
    console.error("get_landing_kecamatan_detail gagal (migration 0019 sudah dijalankan?):", kecamatanDetailError.message);
  }

  const markers = await getPetaMarkers();

  return (
    <div>
      <LandingNavbar loggedIn={!!user} />
      <LandingHero totalAlsintan={stats?.total_alsintan ?? 0} totalKelompok={stats?.total_kelompok ?? 0} />
      <LandingDataSection
        yearly={(yearly as YearlyDatum[] | null) ?? []}
        kategori={(kategori as KategoriDatum[] | null) ?? []}
        jenis={(jenis as JenisDatum[] | null) ?? []}
      />
      <LandingSebaranSection
        markers={markers}
        kecamatanStats={(kecamatanStats as KecamatanDatum[] | null) ?? []}
        kecamatanDetail={(kecamatanDetail as KecamatanDetailRow[] | null) ?? []}
      />
      {/* Seksi Kontak menyusul di langkah berikutnya */}
      <LandingFooter />
    </div>
  );
}
