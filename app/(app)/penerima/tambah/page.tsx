import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createPenerima } from "@/lib/actions/penerima";
import FormPenerima from "@/components/FormPenerima";
import { getKecamatanDesaForProfile } from "@/lib/wilayah";

export default async function TambahPenerimaPage() {
  const { kecamatanList, desaList } = await getKecamatanDesaForProfile();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/penerima" className="mb-4 inline-flex items-center gap-1 text-sm text-green-600 hover:underline">
        <ArrowLeft size={14} /> Kembali ke daftar
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Tambah Penerima</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <FormPenerima
          kecamatanList={kecamatanList}
          desaList={desaList}
          action={createPenerima}
          submitLabel="Simpan"
        />
      </div>
    </div>
  );
}
