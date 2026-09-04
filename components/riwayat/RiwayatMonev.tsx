"use client";

import { useActionState, useRef, useState, useTransition, type ChangeEvent } from "react";
import { createMonev, deleteMonev } from "@/lib/actions/riwayat";
import { compressImage } from "@/lib/compress-image";
import { KONDISI_OPTIONS, kondisiLabel } from "@/lib/kondisi-alsintan";

interface MonevEntry {
  id: string;
  tanggal_kunjungan: string;
  kondisi_terverifikasi: string | null;
  catatan: string | null;
  foto_url: string | null;
  petugas: string | null;
}

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

export default function RiwayatMonev({
  idAlsintan,
  entries,
  canWrite,
  canDelete,
}: {
  idAlsintan: string;
  entries: MonevEntry[];
  canWrite: boolean;
  canDelete: boolean;
}) {
  const boundCreate = createMonev.bind(null, idAlsintan);
  const [state, formAction, isPending] = useActionState(boundCreate, { error: null });
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file);
      const dt = new DataTransfer();
      dt.items.add(compressed);
      if (fileInputRef.current) fileInputRef.current.files = dt.files;
    } finally {
      setIsCompressing(false);
    }
  }

  function handleDelete(id: string) {
    if (!window.confirm("Hapus catatan monev ini?")) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteMonev(id, idAlsintan);
      if (result.error) setDeleteError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-gray-700">Riwayat Monev</h2>

      {canWrite && (
        <form action={formAction} className="mb-4 grid grid-cols-1 gap-3 rounded-md bg-gray-50 p-3 sm:grid-cols-4">
          <input name="tanggal_kunjungan" type="date" required className={inputClass} />
          <select name="kondisi_terverifikasi" defaultValue="" className={inputClass}>
            <option value="">- Kondisi -</option>
            {KONDISI_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          <input name="petugas" placeholder="Petugas" className={inputClass} />
          <input
            ref={fileInputRef}
            name="foto"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-xs text-gray-700 file:mr-2 file:rounded-md file:border-0 file:bg-gray-200 file:px-2 file:py-1.5 file:text-xs"
          />
          <input name="catatan" placeholder="Catatan" className={inputClass + " sm:col-span-4"} />
          <button
            type="submit"
            disabled={isPending || isCompressing}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 sm:w-fit"
          >
            {isCompressing ? "Memproses foto..." : isPending ? "Menyimpan..." : "+ Tambah"}
          </button>
          {state.error && <p className="text-sm text-red-600 sm:col-span-4">{state.error}</p>}
        </form>
      )}

      {deleteError && <p className="mb-2 text-sm text-red-600">{deleteError}</p>}

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada riwayat monev.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((m) => (
            <li key={m.id} className="flex items-start gap-3 rounded-md border border-gray-100 p-2 text-sm">
              {m.foto_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.foto_url} alt="Foto monev" className="h-12 w-12 rounded object-cover" />
              )}
              <div className="flex-1">
                <p className="text-gray-900">
                  {m.tanggal_kunjungan}
                  {m.kondisi_terverifikasi && ` — ${kondisiLabel(m.kondisi_terverifikasi)}`}
                  {m.petugas && ` — ${m.petugas}`}
                </p>
                {m.catatan && <p className="text-xs text-gray-500">{m.catatan}</p>}
              </div>
              {canDelete && (
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={isDeleting}
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                  Hapus
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
