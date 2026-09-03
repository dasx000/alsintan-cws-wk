"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createJenisAlsintan,
  deleteJenisAlsintan,
  updateJenisAlsintan,
  type JenisAlsintanActionState,
} from "@/lib/actions/jenis-alsintan";
import { IKON_OPTIONS } from "@/lib/jenis-alsintan-icons";

interface JenisAlsintan {
  id: string;
  nama_jenis: string;
  kode_ikon: string;
}

const initialActionState: JenisAlsintanActionState = { error: null };

function IkonSelect({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? IKON_OPTIONS[0].value}
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {IKON_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function AddForm() {
  const [state, formAction, isPending] = useActionState(createJenisAlsintan, initialActionState);

  return (
    <form action={formAction} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex-1 min-w-[160px]">
        <label className="mb-1 block text-sm font-medium text-gray-700">Nama Jenis</label>
        <input
          name="nama_jenis"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="mb-1 block text-sm font-medium text-gray-700">Ikon</label>
        <IkonSelect name="kode_ikon" />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "+ Tambah"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

function EditRow({ jenis, onCancel }: { jenis: JenisAlsintan; onCancel: () => void }) {
  const boundUpdate = updateJenisAlsintan.bind(null, jenis.id);
  const [state, formAction, isPending] = useActionState(boundUpdate, initialActionState);

  return (
    <tr>
      <td className="px-4 py-3" colSpan={3}>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <input
              name="nama_jenis"
              defaultValue={jenis.nama_jenis}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <IkonSelect name="kode_ikon" defaultValue={jenis.kode_ikon} />
          </div>
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
          {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
        </form>
      </td>
    </tr>
  );
}

export default function JenisAlsintanManager({
  initialData,
  isAdmin,
}: {
  initialData: JenisAlsintan[];
  isAdmin: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete(id: string, nama: string) {
    if (!window.confirm(`Hapus jenis "${nama}"?`)) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteJenisAlsintan(id);
      if (result.error) setDeleteError(result.error);
    });
  }

  return (
    <div>
      {isAdmin && <AddForm />}
      {deleteError && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{deleteError}</p>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nama Jenis</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Ikon</th>
              {isAdmin && <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {initialData.map((jenis) =>
              editingId === jenis.id ? (
                <EditRow key={jenis.id} jenis={jenis} onCancel={() => setEditingId(null)} />
              ) : (
                <tr key={jenis.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{jenis.nama_jenis}</td>
                  <td className="px-4 py-3 text-gray-700">{jenis.kode_ikon}</td>
                  {isAdmin && (
                    <td className="space-x-2 px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingId(jenis.id)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(jenis.id, jenis.nama_jenis)}
                        disabled={isDeleting}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </td>
                  )}
                </tr>
              )
            )}
            {initialData.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 3 : 2} className="px-4 py-8 text-center text-gray-500">
                  Belum ada jenis alsintan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
