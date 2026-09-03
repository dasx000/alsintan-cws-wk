// Katalog kode_ikon yang tersedia untuk dipilih admin saat menambah/mengubah
// jenis alsintan. Ikon SVG aktualnya (komponen IkonJenisAlsintan) dibuat di
// tahap peta sebaran — jenis baru yang belum punya SVG khusus pakai "generik"
// sampai developer menambahkan ikon SVG-nya.
export const IKON_OPTIONS = [
  { value: "traktor_r2", label: "Traktor Roda 2" },
  { value: "traktor_r4", label: "Traktor Roda 4" },
  { value: "pompa_air", label: "Pompa Air" },
  { value: "rice_transplanter", label: "Rice Transplanter" },
  { value: "combine_harvester", label: "Combine Harvester" },
  { value: "dryer", label: "Dryer" },
  { value: "generik", label: "Generik (ikon default)" },
] as const;
