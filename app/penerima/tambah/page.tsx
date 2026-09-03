import Link from "next/link";
import { createPenerima } from "@/lib/actions/penerima";
import FormPenerima from "@/components/FormPenerima";
import { getKecamatanDesaForProfile } from "@/lib/wilayah";

export default async function TambahPenerimaPage() {
  const { kecamatanList, desaList } = await getKecamatanDesaForProfile();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/penerima" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Kembali ke daftar
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Tambah Penerima</h1>
      <FormPenerima
        kecamatanList={kecamatanList}
        desaList={desaList}
        action={createPenerima}
        submitLabel="Simpan"
      />
    </main>
  );
}
