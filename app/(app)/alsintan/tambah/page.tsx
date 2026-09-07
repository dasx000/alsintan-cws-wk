import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAlsintan } from "@/lib/actions/alsintan";
import FormAlsintan from "@/components/FormAlsintan";
import { getAlsintanFormData } from "@/lib/alsintan-form-data";
import { canCreateAlsintan } from "@/lib/alsintan-permissions";

export default async function TambahAlsintanPage() {
  const { profile, ...formData } = await getAlsintanFormData();
  if (!canCreateAlsintan(profile)) redirect("/alsintan");

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/alsintan" className="mb-4 inline-flex items-center gap-1 text-sm text-green-600 hover:underline">
        <ArrowLeft size={14} /> Kembali ke daftar
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Tambah Alsintan</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <FormAlsintan {...formData} action={createAlsintan} submitLabel="Simpan" />
      </div>
    </div>
  );
}
