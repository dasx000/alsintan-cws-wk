import ScrollReveal from "@/components/landing/ScrollReveal";
import PetaSebaranLoader from "@/components/PetaSebaranLoader";
import KepadatanLegend from "@/components/KepadatanLegend";
import type { PetaMarkerData } from "@/components/PetaSebaran";

export default function LandingSebaranSection({ markers }: { markers: PetaMarkerData[] }) {
  return (
    <section id="sebaran" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <h2 className="text-center text-3xl font-bold tracking-tight text-green-700 sm:text-4xl">Sebaran</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-500">
            Peta lengkap lokasi alsintan tersalurkan se-Kabupaten Way Kanan, terbuka untuk umum -- {markers.length}{" "}
            unit ditampilkan.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <PetaSebaranLoader markers={markers} />
            <KepadatanLegend />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
