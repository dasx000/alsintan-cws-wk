// Ikon marker peta: bentuk beda per JENIS (kode_ikon), warna badge beda per
// KONDISI. SVG inline sederhana (bukan file gambar), dipakai lewat L.divIcon
// jadi tidak perlu asset image terpisah.

export const KONDISI_MARKER_COLORS: Record<string, string> = {
  baik: "#16a34a",
  rusak_ringan: "#ca8a04",
  rusak_berat: "#dc2626",
  hilang: "#6b7280",
};

// Path SVG (viewBox 0 0 24 24, fill putih) per kode_ikon. "generik" dipakai
// sebagai fallback untuk kode_ikon yang belum terdaftar di sini -- supaya
// jenis baru yang ditambah admin lewat CRUD tetap tampil di peta walau
// belum dibuatkan ikon khususnya.
const ICON_PATHS: Record<string, string> = {
  traktor_r2:
    '<circle cx="7" cy="17" r="3"/><circle cx="17" cy="18" r="2"/><rect x="6" y="8" width="9" height="6" rx="1"/><rect x="14" y="10" width="4" height="3"/>',
  traktor_r4:
    '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><rect x="5" y="8" width="14" height="7" rx="1"/>',
  pompa_air: '<path d="M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z"/>',
  rice_transplanter:
    '<rect x="3" y="6" width="18" height="4" rx="1"/><rect x="3" y="12" width="18" height="4" rx="1"/><circle cx="6" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>',
  combine_harvester:
    '<rect x="3" y="9" width="12" height="7" rx="1"/><rect x="15" y="6" width="6" height="5" rx="1"/><circle cx="6" cy="18" r="2.5"/><circle cx="14" cy="18" r="2.5"/>',
  dryer: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="white" stroke-width="1.5"/>',
  generik:
    '<circle cx="12" cy="12" r="5"/><rect x="11" y="1" width="2" height="4"/><rect x="11" y="19" width="2" height="4"/><rect x="1" y="11" width="4" height="2"/><rect x="19" y="11" width="4" height="2"/><rect x="4" y="4" width="3" height="2" transform="rotate(45 5.5 5)"/><rect x="17" y="4" width="3" height="2" transform="rotate(-45 18.5 5)"/><rect x="4" y="18" width="3" height="2" transform="rotate(-45 5.5 19)"/><rect x="17" y="18" width="3" height="2" transform="rotate(45 18.5 19)"/>',
};

export function getMarkerIconHtml(kodeIkon: string, kondisi: string): string {
  const color = KONDISI_MARKER_COLORS[kondisi] ?? "#6b7280";
  const path = ICON_PATHS[kodeIkon] ?? ICON_PATHS.generik;

  return `<div style="background:${color};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">${path}</svg>
  </div>`;
}
