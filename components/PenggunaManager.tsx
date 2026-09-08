"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import PendingOverlay from "@/components/PendingOverlay";
import PasswordInput from "@/components/PasswordInput";
import {
  createPengguna,
  deletePengguna,
  updatePengguna,
  type PenggunaActionState,
} from "@/lib/actions/pengguna";

interface Kecamatan {
  id_kecamatan: string;
  nama_kecamatan: string;
}

interface Desa {
  id_desa: string;
  id_kecamatan: string;
  nama_desa: string;
}

interface Pengguna {
  id: string;
  email: string;
  nama: string | null;
  nip: string | null;
  role: string;
  koordinator: boolean;
  desaIds: string[];
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin (kabupaten)" },
  { value: "penyuluh", label: "Penyuluh" },
];

const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]));

const PAGE_SIZE = 10;

const selectClass =
  "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

// Ringkasan wilayah 1 baris untuk tabel: nama desa yang dipegang (dibatasi
// biar tidak kepanjangan), atau label koordinator + kecamatan turunannya.
function wilayahSummary(user: Pengguna, kecamatanList: Kecamatan[], desaList: Desa[]): string {
  if (user.role !== "penyuluh") return "-";
  const desaNama = user.desaIds
    .map((id) => desaList.find((d) => d.id_desa === id)?.nama_desa)
    .filter((n): n is string => !!n);
  if (desaNama.length === 0) return "Belum diatur";

  if (user.koordinator) {
    const idKecamatanSet = new Set(
      user.desaIds.map((id) => desaList.find((d) => d.id_desa === id)?.id_kecamatan).filter(Boolean)
    );
    const namaKecamatan = kecamatanList
      .filter((k) => idKecamatanSet.has(k.id_kecamatan))
      .map((k) => k.nama_kecamatan)
      .join(", ");
    return `Koordinator -- ${namaKecamatan}`;
  }

  return desaNama.length > 3 ? `${desaNama.slice(0, 3).join(", ")}, +${desaNama.length - 3} lagi` : desaNama.join(", ");
}

// Blok koordinator + pemilih desa (dipakai bareng oleh form Tambah & Edit).
// Kecamatan cuma dipakai untuk MEMPERSEMPIT daftar checkbox yang tampil --
// desa yang sudah dicentang dari kecamatan lain tetap dipertahankan lewat
// hidden input, tidak hilang saat filter kecamatan diganti.
function WilayahFields({
  koordinator,
  onKoordinatorChange,
  selectedDesa,
  onToggleDesa,
  kecFilter,
  onKecFilterChange,
  kecamatanList,
  desaList,
  canSetKoordinator,
}: {
  koordinator: boolean;
  onKoordinatorChange: (v: boolean) => void;
  selectedDesa: Set<string>;
  onToggleDesa: (id: string) => void;
  kecFilter: string;
  onKecFilterChange: (v: string) => void;
  kecamatanList: Kecamatan[];
  desaList: Desa[];
  canSetKoordinator: boolean;
}) {
  const filteredDesa = desaList.filter((d) => d.id_kecamatan === kecFilter);

  return (
    <div className="mt-3">
      {canSetKoordinator && (
        <label className="mb-2 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="koordinator"
            checked={koordinator}
            onChange={(e) => onKoordinatorChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Koordinator (kendalikan 1 kecamatan penuh)
        </label>
      )}

      <label className="mb-1 block text-xs font-medium text-gray-700">
        {koordinator ? "Kecamatan yang dikoordinasi" : "Desa yang dipegang"}
      </label>
      <p className="mb-2 text-xs text-gray-500">
        {koordinator
          ? "Pilih kecamatan, lalu centang minimal 1 desa di kecamatan itu -- kecamatan yang dikoordinasi otomatis mengikuti desa yang dicentang."
          : "Pilih kecamatan untuk mempersempit daftar, lalu centang desa yang dipegang (boleh lebih dari 1, boleh lintas kecamatan)."}
      </p>

      <select
        value={kecFilter}
        onChange={(e) => onKecFilterChange(e.target.value)}
        className={`${inputClass} mb-2 max-w-xs`}
      >
        <option value="">-- Pilih kecamatan --</option>
        {kecamatanList.map((k) => (
          <option key={k.id_kecamatan} value={k.id_kecamatan}>
            {k.nama_kecamatan}
          </option>
        ))}
      </select>

      {kecFilter && (
        <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-gray-300 bg-white p-2 sm:grid-cols-3">
          {filteredDesa.map((d) => (
            <label key={d.id_desa} className="flex items-center gap-1.5 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={selectedDesa.has(d.id_desa)}
                onChange={() => onToggleDesa(d.id_desa)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              {d.nama_desa}
            </label>
          ))}
        </div>
      )}

      {selectedDesa.size > 0 && (
        <p className="mt-2 text-xs text-gray-500">{selectedDesa.size} desa dipilih (termasuk dari kecamatan lain).</p>
      )}

      {/* Hidden input per desa terpilih -- dipertahankan walau lagi tidak
          terlihat di filter kecamatan yang sedang aktif. */}
      {Array.from(selectedDesa).map((id) => (
        <input key={id} type="hidden" name="id_desa" value={id} />
      ))}
    </div>
  );
}

function AddForm({
  kecamatanList,
  desaList,
  isAdmin,
  onDone,
}: {
  kecamatanList: Kecamatan[];
  desaList: Desa[];
  isAdmin: boolean;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState<PenggunaActionState, FormData>(createPengguna, {
    error: null,
  });
  const roleOptions = isAdmin ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value === "penyuluh");
  const [role, setRole] = useState("penyuluh");
  const [koordinator, setKoordinator] = useState(false);
  const [selectedDesa, setSelectedDesa] = useState<Set<string>>(new Set());
  const [kecFilter, setKecFilter] = useState("");

  useEffect(() => {
    if (state.success) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function toggleDesa(id: string) {
    setSelectedDesa((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
      <button
        type="button"
        onClick={onDone}
        className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:underline"
      >
        <ArrowLeft size={13} /> Kembali ke daftar pengguna
      </button>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
          <input name="email" type="email" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Password</label>
          <PasswordInput name="password" required minLength={6} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Nama</label>
          <input name="nama" placeholder="- kosong -" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">NIP</label>
          <input name="nip" placeholder="- kosong -" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Role</label>
          <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {role === "penyuluh" && (
        <WilayahFields
          koordinator={koordinator}
          onKoordinatorChange={setKoordinator}
          selectedDesa={selectedDesa}
          onToggleDesa={toggleDesa}
          kecFilter={kecFilter}
          onKecFilterChange={setKecFilter}
          kecamatanList={kecamatanList}
          desaList={desaList}
          canSetKoordinator={isAdmin}
        />
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Tambah Pengguna"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

function EditForm({
  user,
  kecamatanList,
  desaList,
  isAdmin,
  onCancel,
}: {
  user: Pengguna;
  kecamatanList: Kecamatan[];
  desaList: Desa[];
  isAdmin: boolean;
  onCancel: () => void;
}) {
  const boundUpdate = updatePengguna.bind(null, user.id);
  const [state, formAction, isPending] = useActionState<PenggunaActionState, FormData>(boundUpdate, {
    error: null,
  });
  const roleOptions = isAdmin ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value === "penyuluh");
  const [role, setRole] = useState(user.role);
  const [koordinator, setKoordinator] = useState(user.koordinator);
  const [selectedDesa, setSelectedDesa] = useState<Set<string>>(new Set(user.desaIds));
  const initialKecamatan = desaList.find((d) => user.desaIds.includes(d.id_desa))?.id_kecamatan ?? "";
  const [kecFilter, setKecFilter] = useState(initialKecamatan);

  function toggleDesa(id: string) {
    setSelectedDesa((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
      <button
        type="button"
        onClick={onCancel}
        className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:underline"
      >
        <ArrowLeft size={13} /> Kembali ke daftar pengguna
      </button>
      <p className="mb-3 text-xs font-medium text-green-700">Mengubah &quot;{user.email}&quot;</p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <label className="mb-1 block text-xs font-medium text-gray-700">Nama</label>
          <input name="nama" defaultValue={user.nama ?? ""} placeholder="- kosong -" className={inputClass} />
        </div>

        <div className="w-48">
          <label className="mb-1 block text-xs font-medium text-gray-700">NIP</label>
          <input name="nip" defaultValue={user.nip ?? ""} placeholder="- kosong -" className={inputClass} />
        </div>

        <div className="w-48">
          <label className="mb-1 block text-xs font-medium text-gray-700">Password baru</label>
          <PasswordInput name="password" minLength={6} placeholder="Kosongkan jika tidak diubah" className={inputClass} />
        </div>

        <div className="w-56">
          <label className="mb-1 block text-xs font-medium text-gray-700">Role</label>
          <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {role === "penyuluh" && (
        <WilayahFields
          koordinator={koordinator}
          onKoordinatorChange={setKoordinator}
          selectedDesa={selectedDesa}
          onToggleDesa={toggleDesa}
          kecFilter={kecFilter}
          onKecFilterChange={setKecFilter}
          kecamatanList={kecamatanList}
          desaList={desaList}
          canSetKoordinator={isAdmin}
        />
      )}

      <div className="mt-3 flex items-center gap-2">
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
      </div>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

function DeleteButton({ id, email }: { id: string; email: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { confirm, alert, dialog } = useConfirmDialog();

  async function handleClick() {
    const ok = await confirm(`Hapus akun "${email}"? Aksi ini tidak bisa dibatalkan.`, {
      title: "Hapus pengguna",
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      const result = await deletePengguna(id);
      if (result.error) await alert(result.error, { title: "Gagal menghapus" });
    });
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        title="Hapus"
        className="inline-flex items-center justify-center rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 size={15} />
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {dialog}
      <PendingOverlay show={isPending} label="Menghapus..." />
    </>
  );
}

export default function PenggunaManager({
  users,
  kecamatanList,
  desaList,
  isAdmin,
}: {
  users: Pengguna[];
  kecamatanList: Kecamatan[];
  desaList: Desa[];
  isAdmin: boolean;
}) {
  const roleOptions = isAdmin ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value === "penyuluh");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const editingUser = users.find((u) => u.id === editingId) ?? null;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [koordinatorFilter, setKoordinatorFilter] = useState("");
  const [kecFilterList, setKecFilterList] = useState("");
  const [page, setPage] = useState(1);

  function resetPage() {
    setPage(1);
  }

  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (koordinatorFilter && String(u.koordinator) !== koordinatorFilter) return false;
    if (kecFilterList) {
      const idKecamatanSet = new Set(
        u.desaIds.map((id) => desaList.find((d) => d.id_desa === id)?.id_kecamatan).filter(Boolean)
      );
      if (!idKecamatanSet.has(kecFilterList)) return false;
    }
    if (search) {
      const term = search.trim().toLowerCase();
      const haystack = `${u.email} ${u.nama ?? ""} ${u.nip ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const activeFilterCount = [roleFilter, koordinatorFilter, kecFilterList, search].filter(Boolean).length;

  function resetFilters() {
    setSearch("");
    setRoleFilter("");
    setKoordinatorFilter("");
    setKecFilterList("");
    setPage(1);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        {!showAddForm && (
          <button
            onClick={() => {
              setEditingId(null);
              setShowAddForm(true);
            }}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            + Tambah Pengguna
          </button>
        )}
      </div>

      {showAddForm && (
        <AddForm
          kecamatanList={kecamatanList}
          desaList={desaList}
          isAdmin={isAdmin}
          onDone={() => setShowAddForm(false)}
        />
      )}

      {editingUser && (
        <EditForm
          user={editingUser}
          kecamatanList={kecamatanList}
          desaList={desaList}
          isAdmin={isAdmin}
          onCancel={() => setEditingId(null)}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            resetPage();
          }}
          className={selectClass}
        >
          <option value="">Semua Role</option>
          {roleOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <select
          value={koordinatorFilter}
          onChange={(e) => {
            setKoordinatorFilter(e.target.value);
            resetPage();
          }}
          className={selectClass}
        >
          <option value="">Semua (koordinator/bukan)</option>
          <option value="true">Koordinator</option>
          <option value="false">Bukan koordinator</option>
        </select>

        <select
          value={kecFilterList}
          onChange={(e) => {
            setKecFilterList(e.target.value);
            resetPage();
          }}
          className={selectClass}
        >
          <option value="">Semua Kecamatan</option>
          {kecamatanList.map((k) => (
            <option key={k.id_kecamatan} value={k.id_kecamatan}>
              {k.nama_kecamatan}
            </option>
          ))}
        </select>

        {activeFilterCount > 0 && (
          <button type="button" onClick={resetFilters} className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
            Reset filter
          </button>
        )}
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPage();
          }}
          placeholder="Cari email, nama, atau NIP..."
          className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nama</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">NIP</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Koordinator</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Wilayah</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paged.map((u) => (
              <tr key={u.id} className={editingId === u.id ? "bg-green-50/50" : undefined}>
                <td className="px-4 py-3 text-gray-900">{u.email}</td>
                <td className="px-4 py-3 text-gray-700">{u.nama ?? "-"}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{u.nip ?? "-"}</td>
                <td className="px-4 py-3 text-gray-700">{ROLE_LABEL[u.role] ?? u.role}</td>
                <td className="px-4 py-3">
                  {u.role === "penyuluh" ? (
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        u.koordinator ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {u.koordinator ? "Ya" : "Tidak"}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{wilayahSummary(u, kecamatanList, desaList)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingId(u.id);
                      }}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <DeleteButton id={u.id} email={u.email} />
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {users.length === 0 ? "Belum ada pengguna lain." : "Tidak ada pengguna yang cocok dengan filter/pencarian."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-gray-500">
            Menampilkan {(pageSafe - 1) * PAGE_SIZE + 1}-{Math.min(pageSafe * PAGE_SIZE, filtered.length)} dari{" "}
            {filtered.length} pengguna
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
