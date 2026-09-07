"use client";

import { useActionState, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  createJenisAlsintan,
  deleteJenisAlsintan,
  updateJenisAlsintan,
  type JenisAlsintanActionState,
} from "@/lib/actions/jenis-alsintan";
import { KATEGORI_OPTIONS } from "@/lib/jenis-alsintan-kategori";

const PAGE_SIZE = 10;

interface JenisAlsintan {
  id: string;
  nama_jenis: string;
  kategori: string;
}

const initialActionState: JenisAlsintanActionState = { error: null };

const KATEGORI_LABEL: Record<string, string> = Object.fromEntries(
  KATEGORI_OPTIONS.map((o) => [o.value, o.label])
);

function KategoriSelect({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? KATEGORI_OPTIONS[0].value}
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
    >
      {KATEGORI_OPTIONS.map((opt) => (
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
    <form
      action={formAction}
      className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      <div className="flex-1 min-w-[160px]">
        <label className="mb-1 block text-sm font-medium text-gray-700">Nama Jenis</label>
        <input
          name="nama_jenis"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
        <KategoriSelect name="kategori" />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "+ Tambah"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

function EditForm({ jenis, onCancel }: { jenis: JenisAlsintan; onCancel: () => void }) {
  const boundUpdate = updateJenisAlsintan.bind(null, jenis.id);
  const [state, formAction, isPending] = useActionState(boundUpdate, initialActionState);

  return (
    <form
      action={formAction}
      className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-green-200 bg-green-50 p-4"
    >
      <p className="w-full text-xs font-medium text-green-700">Mengubah &quot;{jenis.nama_jenis}&quot;</p>
      <div className="flex-1 min-w-[160px]">
        <label className="mb-1 block text-sm font-medium text-gray-700">Nama Jenis</label>
        <input
          name="nama_jenis"
          defaultValue={jenis.nama_jenis}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
        <KategoriSelect name="kategori" defaultValue={jenis.kategori} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Simpan"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Batal
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const editingJenis = initialData.find((j) => j.id === editingId) ?? null;

  const filtered = initialData.filter((j) => j.nama_jenis.toLowerCase().includes(search.trim().toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

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
      {editingJenis ? (
        <EditForm jenis={editingJenis} onCancel={() => setEditingId(null)} />
      ) : (
        isAdmin && <AddForm />
      )}
      {deleteError && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{deleteError}</p>
      )}

      <div className="relative mb-4">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Cari nama jenis..."
          className="w-full max-w-xs rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nama Jenis</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kategori</th>
              {isAdmin && <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paged.map((jenis) => (
              <tr key={jenis.id} className={editingId === jenis.id ? "bg-green-50/50" : undefined}>
                <td className="px-4 py-3 font-medium text-gray-900">{jenis.nama_jenis}</td>
                <td className="px-4 py-3 text-gray-700">{KATEGORI_LABEL[jenis.kategori] ?? jenis.kategori}</td>
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
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 3 : 2} className="px-4 py-8 text-center text-gray-500">
                  {initialData.length === 0
                    ? "Belum ada jenis alsintan."
                    : "Tidak ada jenis yang cocok dengan pencarian."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-gray-500">
            Menampilkan {(pageSafe - 1) * PAGE_SIZE + 1}–{Math.min(pageSafe * PAGE_SIZE, filtered.length)} dari{" "}
            {filtered.length} jenis
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe <= 1}
                className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50"
              >
                <ChevronLeft size={15} />
                Sebelumnya
              </button>
              <span className="text-gray-600">
                Halaman {pageSafe} dari {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe >= totalPages}
                className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50"
              >
                Berikutnya
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
