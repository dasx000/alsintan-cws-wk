import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePenerima } from "@/lib/actions/penerima";
import FormPenerima from "@/components/FormPenerima";
import { getKecamatanDesaForProfile } from "@/lib/wilayah";

export default async function EditPenerimaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: penerima } = await supabase
    .from("penerima")
    .select("nama_kelompok, jenis_kelompok, nama_ketua, kontak, id_desa, luas_garapan_ha")
    .eq("id", id)
    .single();

  if (!penerima) notFound();

  const { kecamatanList, desaList } = await getKecamatanDesaForProfile();
  const boundUpdate = updatePenerima.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/penerima" className="mb-4 inline-flex items-center gap-1 text-sm text-green-600 hover:underline">
        <ArrowLeft size={14} /> Kembali ke daftar
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Edit Penerima</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <FormPenerima
          kecamatanList={kecamatanList}
          desaList={desaList}
          initialData={penerima}
          action={boundUpdate}
          submitLabel="Update"
        />
      </div>
    </div>
  );
}
