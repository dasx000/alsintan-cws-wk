export type Kondisi = "baik" | "rusak ringan" | "rusak berat";

export const KONDISI_OPTIONS: Kondisi[] = ["baik", "rusak ringan", "rusak berat"];

export interface Alat {
  id: string;
  nama_alat: string;
  kategori: string;
  jumlah: number;
  kondisi: Kondisi;
  created_at: string;
}

export type AlatFormData = Omit<Alat, "id" | "created_at">;
