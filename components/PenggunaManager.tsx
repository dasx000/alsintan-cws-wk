"use client";

import { useActionState, useState } from "react";
import { updatePengguna, type PenggunaActionState } from "@/lib/actions/pengguna";

interface Kecamatan {
  id_kecamatan: string;
  nama_kecamatan: string;
}

interface Pengguna {
  id: string;
  email: string;
  nama: string | null;
  role: string;
  id_kecamatan_wilayah: string | null;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "penyuluh", label: "Penyuluh" },
  { value: "viewer", label: "Viewer" },
];

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function EditRow({
  user,
  kecamatanList,
  onCancel,
}: {
  user: Pengguna;
  kecamatanList: Kecamatan[];
  onCancel: () => void;
}) {
  const boundUpdate = updatePengguna.bind(null, user.id);
  const [state, formAction, isPending] = useActionState<PenggunaActionState, FormData>(boundUpdate, {
    error: null,
  });

  return (
    <tr>
      <td className="px-4 py-3" colSpan={4}>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-gray-700">Role</label>
            <select name="role" defaultValue={user.role} className={inputClass}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-56">
            <label className="mb-1 block text-xs font-medium text-gray-700">Wilayah (untuk penyuluh)</label>
            <select name="id_kecamatan_wilayah" defaultValue={user.id_kecamatan_wilayah ?? ""} className={inputClass}>
              <option value="">Tidak dibatasi (semua kecamatan)</option>
              {kecamatanList.map((k) => (
                <option key={k.id_kecamatan} value={k.id_kecamatan}>
                  {k.nama_kecamatan}
                </option>
              ))}
            </select>
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

export default function PenggunaManager({
  users,
  kecamatanList,
}: {
  users: Pengguna[];
  kecamatanList: Kecamatan[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Wilayah</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.map((u) =>
            editingId === u.id ? (
              <EditRow key={u.id} user={u} kecamatanList={kecamatanList} onCancel={() => setEditingId(null)} />
            ) : (
              <tr key={u.id}>
                <td className="px-4 py-3 text-gray-900">{u.email}</td>
                <td className="px-4 py-3 text-gray-700">{u.role}</td>
                <td className="px-4 py-3 text-gray-700">
                  {kecamatanList.find((k) => k.id_kecamatan === u.id_kecamatan_wilayah)?.nama_kecamatan ??
                    "Tidak dibatasi"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditingId(u.id)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            )
          )}
          {users.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                Belum ada pengguna lain.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
