"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import FormAlat from "@/components/FormAlat";
import { supabase } from "@/lib/supabase";
import type { Alat, AlatFormData } from "@/lib/types";

export default function EditAlatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [alat, setAlat] = useState<Alat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAlat() {
      const { data, error } = await supabase
        .from("alat")
        .select("*")
        .eq("id", params.id)
        .single();

      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setAlat(data);
      }
      setLoading(false);
    }

    fetchAlat();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleSubmit(formData: AlatFormData) {
    const { error } = await supabase.from("alat").update(formData).eq("id", params.id);
    if (error) throw new Error(error.message);
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Kembali ke daftar
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Edit Alat</h1>

      {loading && <p className="text-gray-500">Memuat data...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && !error && alat && (
        <FormAlat
          initialData={{
            nama_alat: alat.nama_alat,
            kategori: alat.kategori,
            jumlah: alat.jumlah,
            kondisi: alat.kondisi,
          }}
          onSubmit={handleSubmit}
          submitLabel="Update"
        />
      )}
    </main>
  );
}
