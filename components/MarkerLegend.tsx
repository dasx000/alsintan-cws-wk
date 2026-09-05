import { KATEGORI_RING_COLORS, KONDISI_MARKER_COLORS } from "@/lib/marker-icon";
import { KONDISI_OPTIONS } from "@/lib/kondisi-alsintan";

const KATEGORI_LABELS: Record<string, string> = {
  pra_panen: "Prapanen",
  pasca_panen: "Pascapanen",
};

// Menjelaskan kombinasi 2-warna di tiap ikon marker peta: ring luar = kategori,
// isi badge = kondisi (lihat lib/marker-icon.ts). Ditaruh bersama
// KepadatanLegend di kartu yang sama dengan peta.
export default function MarkerLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-600">Kategori (ring):</span>
        {Object.entries(KATEGORI_RING_COLORS).map(([kategori, color]) => (
          <span key={kategori} className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-full border-2 bg-white"
              style={{ borderColor: color }}
            />
            {KATEGORI_LABELS[kategori] ?? kategori}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-600">Kondisi (isi):</span>
        {KONDISI_OPTIONS.map((k) => (
          <span key={k.value} className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: KONDISI_MARKER_COLORS[k.value] ?? "#6b7280" }}
            />
            {k.label}
          </span>
        ))}
      </div>
    </div>
  );
}
