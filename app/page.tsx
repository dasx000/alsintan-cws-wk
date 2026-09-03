"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Alat, Kondisi } from "@/lib/types";

const KONDISI_STYLES: Record<Kondisi, string> = {
  baik: "bg-green-100 text-green-800",
  "rusak ringan": "bg-yellow-100 text-yellow-800",
  "rusak berat": "bg-red-100 text-red-800",
};

export default function DaftarAlatPage() {
  const [items, setItems] = useState<Alat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const { data, error } = await supabase
        .from("alat")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setItems(data ?? []);
        setError(null);
      }
      setLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string, nama: string) {
    if (!window.confirm(`Hapus data "${nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;

    setDeletingId(id);
    const { error } = await supabase.from("alat").delete().eq("id", id);
    setDeletingId(null);

    if (error) {
      alert(`Gagal menghapus: ${error.message}`);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Daftar Alat</h1>
        <Link
          href="/tambah"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Data
        </Link>
      </div>

      {loading && <p className="text-gray-500">Memuat data...</p>}
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">Error: {error}</p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="rounded-md border border-dashed border-gray-300 px-4 py-8 text-center text-gray-500">
          Belum ada data. Klik &quot;Tambah Data&quot; untuk menambahkan.
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nama Alat</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Kategori</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Jumlah</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Kondisi</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.nama_alat}</td>
                  <td className="px-4 py-3 text-gray-700">{item.kategori}</td>
                  <td className="px-4 py-3 text-gray-700">{item.jumlah}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${KONDISI_STYLES[item.kondisi] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {item.kondisi}
                    </span>
                  </td>
                  <td className="space-x-2 px-4 py-3 text-right">
                    <Link
                      href={`/edit/${item.id}`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id, item.nama_alat)}
                      disabled={deletingId === item.id}
                      className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === item.id ? "Menghapus..." : "Hapus"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
