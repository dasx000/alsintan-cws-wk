import Link from "next/link";
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
      "id_jenis, merk, tipe, no_rangka, no_mesin, tahun_pengadaan, id_sumber_dana, no_bast, tanggal_bast, nilai_aset, kondisi, id_penerima_saat_ini, catatan"
    )
    .eq("id", id)
    .single();

  if (!alsintan) notFound();

  const formData = await getAlsintanFormData();
  const boundUpdate = updateAlsintan.bind(null, id);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href={`/alsintan/${id}`} className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Kembali ke detail
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Edit Alsintan</h1>
      <FormAlsintan {...formData} initialData={alsintan} action={boundUpdate} submitLabel="Update" />
    </main>
  );
}
