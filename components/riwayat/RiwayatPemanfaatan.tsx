"use client";

import { useActionState, useState, useTransition } from "react";
import { createPemanfaatan, deletePemanfaatan } from "@/lib/actions/riwayat";

interface PemanfaatanEntry {
  id: string;
  tanggal: string;
  luas_layanan_ha: number | null;
  komoditas: string | null;
  operator: string | null;
}

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

export default function RiwayatPemanfaatan({
  idAlsintan,
  entries,
  canWrite,
  canDelete,
}: {
  idAlsintan: string;
  entries: PemanfaatanEntry[];
  canWrite: boolean;
  canDelete: boolean;
}) {
  const boundCreate = createPemanfaatan.bind(null, idAlsintan);
  const [state, formAction, isPending] = useActionState(boundCreate, { error: null });
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete(id: string) {
    if (!window.confirm("Hapus catatan pemanfaatan ini?")) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deletePemanfaatan(id, idAlsintan);
      if (result.error) setDeleteError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-gray-700">Riwayat Pemanfaatan</h2>

      {canWrite && (
        <form action={formAction} className="mb-4 grid grid-cols-1 gap-3 rounded-md bg-gray-50 p-3 sm:grid-cols-4">
          <input name="tanggal" type="date" required className={inputClass} />
          <input name="luas_layanan_ha" type="number" step="0.01" min={0} placeholder="Luas (ha)" className={inputClass} />
          <input name="komoditas" placeholder="Komoditas" className={inputClass} />
          <input name="operator" placeholder="Operator" className={inputClass} />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 sm:col-span-4 sm:w-fit"
          >
            {isPending ? "Menyimpan..." : "+ Tambah"}
          </button>
          {state.error && <p className="text-sm text-red-600 sm:col-span-4">{state.error}</p>}
        </form>
      )}

      {deleteError && <p className="mb-2 text-sm text-red-600">{deleteError}</p>}

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada riwayat pemanfaatan.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((p) => (
            <li key={p.id} className="flex items-start justify-between rounded-md border border-gray-100 p-2 text-sm">
              <div>
                <p className="text-gray-900">
                  {p.tanggal}
                  {p.luas_layanan_ha != null && ` — ${p.luas_layanan_ha} ha`}
                  {p.komoditas && ` — ${p.komoditas}`}
                </p>
                {p.operator && <p className="text-xs text-gray-500">Operator: {p.operator}</p>}
              </div>
              {canDelete && (
                <button
                  onClick={() => handleDelete(p.id)}
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
