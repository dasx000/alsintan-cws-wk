"use client";

import { useState, type FormEvent } from "react";
import { KONDISI_OPTIONS, type AlatFormData, type Kondisi } from "@/lib/types";

interface FormAlatProps {
  initialData?: AlatFormData;
  onSubmit: (data: AlatFormData) => Promise<void>;
  submitLabel: string;
}

export default function FormAlat({ initialData, onSubmit, submitLabel }: FormAlatProps) {
  const [namaAlat, setNamaAlat] = useState(initialData?.nama_alat ?? "");
  const [kategori, setKategori] = useState(initialData?.kategori ?? "");
  const [jumlah, setJumlah] = useState(initialData?.jumlah ?? 1);
  const [kondisi, setKondisi] = useState<Kondisi>(initialData?.kondisi ?? "baik");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ nama_alat: namaAlat, kategori, jumlah, kondisi });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="nama_alat" className="mb-1 block text-sm font-medium text-gray-700">
          Nama Alat
        </label>
        <input
          id="nama_alat"
          type="text"
          required
          value={namaAlat}
          onChange={(e) => setNamaAlat(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="kategori" className="mb-1 block text-sm font-medium text-gray-700">
          Kategori
        </label>
        <input
          id="kategori"
          type="text"
          required
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="jumlah" className="mb-1 block text-sm font-medium text-gray-700">
          Jumlah
        </label>
        <input
          id="jumlah"
          type="number"
          min={0}
          required
          value={jumlah}
          onChange={(e) => setJumlah(Number(e.target.value))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="kondisi" className="mb-1 block text-sm font-medium text-gray-700">
          Kondisi
        </label>
        <select
          id="kondisi"
          value={kondisi}
          onChange={(e) => setKondisi(e.target.value as Kondisi)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {KONDISI_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
