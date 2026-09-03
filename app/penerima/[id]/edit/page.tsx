import Link from "next/link";
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
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/penerima" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Kembali ke daftar
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Edit Penerima</h1>
      <FormPenerima
        kecamatanList={kecamatanList}
        desaList={desaList}
        initialData={penerima}
        action={boundUpdate}
        submitLabel="Update"
      />
    </main>
  );
}
