"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import FormAlat from "@/components/FormAlat";
import { supabase } from "@/lib/supabase";
import type { AlatFormData } from "@/lib/types";

export default function TambahAlatPage() {
  const router = useRouter();

  async function handleSubmit(formData: AlatFormData) {
    const { error } = await supabase.from("alat").insert(formData);
    if (error) throw new Error(error.message);
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Kembali ke daftar
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Tambah Alat</h1>
      <FormAlat onSubmit={handleSubmit} submitLabel="Simpan" />
    </main>
  );
}
