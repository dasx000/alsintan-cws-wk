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

// Path SVG per kategori -- diambil langsung dari ikon lucide-react "Tractor"
// (pra_panen) dan "Wheat" (pasca_panen): traktor = alat berat sebelum panen,
// gandum = hasil setelah panen, jadi maknanya langsung kebaca tanpa perlu
// legenda. Ikon yang sama juga dipakai di popup PetaSebaran supaya bahasa
// visualnya konsisten se-aplikasi. Kategori tidak dikenal jatuh ke bentuk
// pra_panen sebagai fallback.
const ICON_PATHS: Record<string, string> = {
  pra_panen:
    '<path d="m10 11 11 .9a1 1 0 0 1 .8 1.1l-.665 4.158a1 1 0 0 1-.988.842H20"/><path d="M16 18h-5"/><path d="M18 5a1 1 0 0 0-1 1v5.573"/><path d="M3 4h8.129a1 1 0 0 1 .99.863L13 11.246"/><path d="M4 11V4"/><path d="M7 15h.01"/><path d="M8 10.1V4"/><circle cx="18" cy="18" r="2"/><circle cx="7" cy="15" r="5"/>',
  pasca_panen:
    '<path d="M2 22 16 8"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"/><path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/>',
};

// Traktor punya lebih banyak goresan detail daripada gandum -- stroke sedikit
// lebih tipis di ukuran 13px biar tidak jadi gumpalan solid.
const ICON_STROKE_WIDTH: Record<string, number> = {
  pra_panen: 2.2,
  pasca_panen: 2.5,
};

export function getMarkerIconHtml(kategori: string, kondisi: string): string {
  const fill = KONDISI_MARKER_COLORS[kondisi] ?? "#6b7280";
  const ring = KATEGORI_RING_COLORS[kategori] ?? KATEGORI_RING_COLORS.pra_panen;
  const path = ICON_PATHS[kategori] ?? ICON_PATHS.pra_panen;
  const strokeWidth = ICON_STROKE_WIDTH[kategori] ?? 2.5;

  return `<div style="background:${fill};width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid white;box-shadow:0 0 0 2px ${ring}, 0 1px 2px rgba(0,0,0,0.4);">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${path}</svg>
  </div>`;
}
