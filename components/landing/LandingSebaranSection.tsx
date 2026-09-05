import ScrollReveal from "@/components/landing/ScrollReveal";
import LandingPetaFilter from "@/components/landing/LandingPetaFilter";
import TopKecamatanChart, { type KecamatanDatum } from "@/components/landing/TopKecamatanChart";
import KecamatanExplorer, { type KecamatanDetailRow } from "@/components/landing/KecamatanExplorer";
import type { PetaMarkerData } from "@/components/PetaSebaran";

export default function LandingSebaranSection({
  markers,
  kecamatanStats,
  kecamatanDetail,
}: {
  markers: PetaMarkerData[];
  kecamatanStats: KecamatanDatum[];
  kecamatanDetail: KecamatanDetailRow[];
}) {
  return (
    <section id="sebaran" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <h2 className="text-center text-3xl font-bold tracking-tight text-green-700 sm:text-4xl">Sebaran</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-500">
            Peta lengkap lokasi alsintan tersalurkan se-Kabupaten Way Kanan.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <LandingPetaFilter markers={markers} />
        </ScrollReveal>

        <ScrollReveal delay={250}>
          <TopKecamatanChart data={kecamatanStats} />
        </ScrollReveal>

        <ScrollReveal delay={350}>
          <KecamatanExplorer stats={kecamatanStats} detail={kecamatanDetail} />
        </ScrollReveal>
      </div>
    </section>
  );
}
