"use client";

import dynamic from "next/dynamic";
import type { PetaMarkerData } from "@/components/PetaSebaran";

const PetaSebaran = dynamic(() => import("@/components/PetaSebaran"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center rounded-lg border border-gray-300 text-sm text-gray-400">
      Memuat peta...
    </div>
  ),
});

export default function PetaSebaranLoader({ markers }: { markers: PetaMarkerData[] }) {
  return <PetaSebaran markers={markers} />;
}
