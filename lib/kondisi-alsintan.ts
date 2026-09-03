export const KONDISI_OPTIONS = [
  { value: "baik", label: "Baik" },
  { value: "rusak_ringan", label: "Rusak Ringan" },
  { value: "rusak_berat", label: "Rusak Berat" },
  { value: "hilang", label: "Hilang" },
] as const;

export const KONDISI_BADGE_STYLES: Record<string, string> = {
  baik: "bg-green-100 text-green-800",
  rusak_ringan: "bg-yellow-100 text-yellow-800",
  rusak_berat: "bg-red-100 text-red-800",
  hilang: "bg-gray-200 text-gray-700",
};

export function kondisiLabel(value: string): string {
  return KONDISI_OPTIONS.find((k) => k.value === value)?.label ?? value;
}
