"use client";

import { useActionState, useState, useTransition } from "react";
import { createServis, deleteServis, updateServis } from "@/lib/actions/riwayat";

interface ServisEntry {
  id: string;
  tanggal: string;
  kerusakan: string | null;
  biaya: number | null;
  sparepart: string | null;
  status: string;
}

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

const STATUS_OPTIONS = [
  { value: "proses", label: "Proses" },
  { value: "selesai", label: "Selesai" },
];

function EditRow({
  entry,
  idAlsintan,
  onCancel,
}: {
  entry: ServisEntry;
  idAlsintan: string;
  onCancel: () => void;
}) {
  const boundUpdate = updateServis.bind(null, entry.id, idAlsintan);
  const [state, formAction, isPending] = useActionState(boundUpdate, { error: null });

  return (
    <li className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <input name="tanggal" type="date" defaultValue={entry.tanggal} required className={inputClass} />
        <input
          name="kerusakan"
          defaultValue={entry.kerusakan ?? ""}
          placeholder="Kerusakan"
          className={inputClass + " sm:col-span-2"}
        />
        <input
          name="sparepart"
          defaultValue={entry.sparepart ?? ""}
          placeholder="Sparepart"
          className={inputClass}
        />
        <input
          name="biaya"
          type="number"
          min={0}
          defaultValue={entry.biaya ?? ""}
          placeholder="Biaya"
          className={inputClass}
        />
        <select name="status" defaultValue={entry.status} className={inputClass}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2 sm:col-span-4">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Menyimpan..." : "Simpan"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
        {state.error && <p className="text-sm text-red-600 sm:col-span-5">{state.error}</p>}
      </form>
    </li>
  );
}

export default function RiwayatServis({
  idAlsintan,
  entries,
  canWrite,
  canDelete,
}: {
  idAlsintan: string;
  entries: ServisEntry[];
  canWrite: boolean;
  canDelete: boolean;
}) {
  const boundCreate = createServis.bind(null, idAlsintan);
  const [state, formAction, isPending] = useActionState(boundCreate, { error: null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete(id: string) {
    if (!window.confirm("Hapus catatan servis ini?")) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteServis(id, idAlsintan);
      if (result.error) setDeleteError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-gray-700">Riwayat Servis</h2>

      {canWrite && (
        <form action={formAction} className="mb-4 grid grid-cols-1 gap-3 rounded-md bg-gray-50 p-3 sm:grid-cols-4">
          <input name="tanggal" type="date" required className={inputClass} />
          <input name="kerusakan" placeholder="Kerusakan" className={inputClass + " sm:col-span-2"} />
          <input name="sparepart" placeholder="Sparepart" className={inputClass} />
          <input name="biaya" type="number" min={0} placeholder="Biaya" className={inputClass} />
          <select name="status" defaultValue="proses" className={inputClass}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
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
        <p className="text-sm text-gray-500">Belum ada riwayat servis.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((s) =>
            editingId === s.id ? (
              <EditRow key={s.id} entry={s} idAlsintan={idAlsintan} onCancel={() => setEditingId(null)} />
            ) : (
              <li
                key={s.id}
                className="flex items-start justify-between rounded-md border border-gray-100 p-2 text-sm"
              >
                <div>
                  <p className="text-gray-900">
                    {s.tanggal} — {s.kerusakan ?? "-"}{" "}
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                        s.status === "selesai" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {s.status === "selesai" ? "Selesai" : "Proses"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {[s.sparepart, s.biaya != null ? `Rp ${s.biaya.toLocaleString("id-ID")}` : null]
                      .filter(Boolean)
                      .join(" — ")}
                  </p>
                </div>
                {canWrite && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(s.id)}
                      className="text-xs font-medium text-gray-600 hover:underline"
                    >
                      Edit
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={isDeleting}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
