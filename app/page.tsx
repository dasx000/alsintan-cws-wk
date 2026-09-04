import { createClient } from "@/lib/supabase/server";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingDataSection, { type YearlyDatum } from "@/components/landing/LandingDataSection";
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
    .single<{ total_alsintan: number }>();

  if (statsError) {
    console.error("get_landing_stats gagal (migration 0008 sudah dijalankan?):", statsError.message);
  }

  const { data: yearly, error: yearlyError } = await supabase.rpc("get_landing_yearly_stats");

  if (yearlyError) {
    console.error("get_landing_yearly_stats gagal (migration 0009 sudah dijalankan?):", yearlyError.message);
  }

  const markers = await getPetaMarkers();

  return (
    <div>
      <LandingNavbar loggedIn={!!user} />
      <LandingHero totalAlsintan={stats?.total_alsintan ?? 0} />
      <LandingDataSection yearly={(yearly as YearlyDatum[] | null) ?? []} />
      <LandingSebaranSection markers={markers} />
      {/* Seksi Kontak menyusul di langkah berikutnya */}
      <LandingFooter />
    </div>
  );
}
