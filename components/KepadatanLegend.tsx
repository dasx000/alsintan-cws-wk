// Gradasi sama persis dengan DENSITY_COLOR_STOPS di KecamatanChoropleth.tsx.
// Dipakai sebagai footer kartu peta -- di /peta dan landing page.
export default function KepadatanLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
      <span>Kepadatan per Kecamatan:</span>
      <span
        className="h-3 w-24 rounded-full"
        style={{ background: "linear-gradient(to right, rgb(37,99,235), rgb(250,204,21), rgb(220,38,38))" }}
      />
      <span>Rendah → Tinggi</span>
    </div>
  );
}
