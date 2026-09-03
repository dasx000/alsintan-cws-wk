import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateAlsintan } from "@/lib/actions/alsintan";
import FormAlsintan from "@/components/FormAlsintan";
import { getAlsintanFormData } from "@/lib/alsintan-form-data";

export default async function EditAlsintanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: alsintan } = await supabase
    .from("alsintan")
    .select(
      "id_jenis, merk, tipe, no_rangka, no_mesin, tahun_pengadaan, id_sumber_dana, no_bast, tanggal_bast, nilai_aset, kondisi, id_penerima_saat_ini, catatan, foto_url, latitude, longitude"
    )
    .eq("id", id)
    .single();

  if (!alsintan) notFound();

  const formData = await getAlsintanFormData();
  const boundUpdate = updateAlsintan.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/alsintan/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
      >
        <ArrowLeft size={14} /> Kembali ke detail
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Edit Alsintan</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <FormAlsintan {...formData} initialData={alsintan} action={boundUpdate} submitLabel="Update" />
      </div>
    </div>
  );
}
