import Link from "next/link";
import { createAlsintan } from "@/lib/actions/alsintan";
import FormAlsintan from "@/components/FormAlsintan";
import { getAlsintanFormData } from "@/lib/alsintan-form-data";

export default async function TambahAlsintanPage() {
  const formData = await getAlsintanFormData();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/alsintan" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Kembali ke daftar
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Tambah Alsintan</h1>
      <FormAlsintan {...formData} action={createAlsintan} submitLabel="Simpan" />
    </main>
  );
}
