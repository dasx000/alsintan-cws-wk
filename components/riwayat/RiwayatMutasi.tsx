"use client";

import { useActionState, useState, useTransition } from "react";
import { createMutasi, deleteMutasi } from "@/lib/actions/riwayat";

interface PenerimaOption {
  id: string;
  label: string;
}

interface MutasiEntry {
  id: string;
  tanggal: string;
  no_surat: string | null;
  keterangan: string | null;
  penerima_lama: { nama_kelompok: string } | null;
  penerima_baru: { nama_kelompok: string } | null;
}

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function RiwayatMutasi({
  idAlsintan,
  entries,
  penerimaOptions,
  canWrite,
  canDelete,
}: {
  idAlsintan: string;
  entries: MutasiEntry[];
  penerimaOptions: PenerimaOption[];
  canWrite: boolean;
  canDelete: boolean;
}) {
  const boundCreate = createMutasi.bind(null, idAlsintan);
  const [state, formAction, isPending] = useActionState(boundCreate, { error: null });
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete(id: string) {
    if (!window.confirm("Hapus catatan mutasi ini? (Penerima saat ini tidak ikut dikembalikan otomatis)")) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteMutasi(id, idAlsintan);
      if (result.error) setDeleteError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-3 text-sm font-medium text-gray-700">Riwayat Mutasi</h2>

      {canWrite && (
        <form action={formAction} className="mb-4 grid grid-cols-1 gap-3 rounded-md bg-gray-50 p-3 sm:grid-cols-4">
          <select name="id_penerima_baru" required defaultValue="" className={inputClass + " sm:col-span-2"}>
            <option value="" disabled>
              Pindah ke penerima...
            </option>
            {penerimaOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <input name="tanggal" type="date" required className={inputClass} />
          <input name="no_surat" placeholder="No. Surat" className={inputClass} />
          <input name="keterangan" placeholder="Keterangan" className={inputClass + " sm:col-span-3"} />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Menyimpan..." : "+ Tambah"}
          </button>
          {state.error && <p className="text-sm text-red-600 sm:col-span-4">{state.error}</p>}
        </form>
      )}

      {deleteError && <p className="mb-2 text-sm text-red-600">{deleteError}</p>}

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada riwayat mutasi.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((m) => (
            <li key={m.id} className="flex items-start justify-between rounded-md border border-gray-100 p-2 text-sm">
              <div>
                <p className="text-gray-900">
                  {m.tanggal} — {m.penerima_lama?.nama_kelompok ?? "?"} → {m.penerima_baru?.nama_kelompok ?? "?"}
                </p>
                {(m.no_surat || m.keterangan) && (
                  <p className="text-xs text-gray-500">
                    {[m.no_surat, m.keterangan].filter(Boolean).join(" — ")}
                  </p>
                )}
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
