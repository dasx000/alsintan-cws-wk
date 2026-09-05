// Ikon marker peta membawa 2 info sekaligus, dikodekan terpisah supaya
// tidak saling menutupi:
//  - bentuk siluet + warna RING luar = KATEGORI (pra panen / pasca panen)
//  - warna isi (fill) badge          = KONDISI (baik / rusak / hilang)
// SVG inline sederhana (bukan file gambar), dipakai lewat L.divIcon jadi
// tidak perlu asset image terpisah. Lihat juga components/MarkerLegend.tsx
// yang menjelaskan kombinasi ini ke pengunjung peta.

export const KONDISI_MARKER_COLORS: Record<string, string> = {
  baik: "#16a34a",
  rusak_ringan: "#ca8a04",
  rusak_berat: "#dc2626",
  hilang: "#6b7280",
};

// Warna ring per kategori -- sama seperti konvensi hijau/amber yang sudah
// dipakai di KategoriChart & KecamatanExplorer.
export const KATEGORI_RING_COLORS: Record<string, string> = {
  pra_panen: "#16a34a",
  pasca_panen: "#d97706",
};

// Path SVG (viewBox 0 0 24 24, fill putih) per kategori. "pra_panen" pakai
// bentuk traktor, "pasca_panen" pakai bentuk combine harvester. Kategori
// yang tidak dikenal jatuh ke bentuk pra_panen sebagai fallback.
const ICON_PATHS: Record<string, string> = {
  pra_panen:
    '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><rect x="5" y="8" width="14" height="7" rx="1"/>',
  pasca_panen:
    '<rect x="3" y="9" width="12" height="7" rx="1"/><rect x="15" y="6" width="6" height="5" rx="1"/><circle cx="6" cy="18" r="2.5"/><circle cx="14" cy="18" r="2.5"/>',
};

export function getMarkerIconHtml(kategori: string, kondisi: string): string {
  const fill = KONDISI_MARKER_COLORS[kondisi] ?? "#6b7280";
  const ring = KATEGORI_RING_COLORS[kategori] ?? KATEGORI_RING_COLORS.pra_panen;
  const path = ICON_PATHS[kategori] ?? ICON_PATHS.pra_panen;

  return `<div style="background:${fill};width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid white;box-shadow:0 0 0 2px ${ring}, 0 1px 2px rgba(0,0,0,0.4);">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">${path}</svg>
  </div>`;
}
