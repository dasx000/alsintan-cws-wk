import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { getCurrentProfile } from "@/lib/get-current-profile";
import ImportAlsintanForm from "@/components/ImportAlsintanForm";

export default async function ImporAlsintanPage() {
  const { profile } = await getCurrentProfile();
  const canWrite = profile?.role === "admin" || profile?.role === "penyuluh";
  if (!canWrite) redirect("/alsintan");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/alsintan" className="mb-4 inline-flex items-center gap-1 text-sm text-green-600 hover:underline">
        <ArrowLeft size={14} /> Kembali ke daftar
      </Link>
      <h1 className="mb-2 text-xl font-semibold text-gray-900">Impor Alsintan dari Excel</h1>
      <p className="mb-6 text-sm text-gray-500">
        Tambahkan banyak unit sekaligus lewat file Excel -- cocok untuk data bantuan yang turun dalam jumlah besar.
      </p>

      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 shrink-0 text-green-600" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">1. Unduh template terlebih dahulu</p>
            <p className="mb-3 text-xs text-gray-600">
              Template berisi kolom yang sesuai dan sheet Referensi (daftar Jenis Alsintan, Kondisi, Kecamatan, dan
              Sumber Dana yang valid). Isi datanya persis seperti nama di sheet Referensi.
            </p>
            <a
              href="/api/alsintan/template"
              className="inline-flex items-center gap-1.5 rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              Unduh Template Excel
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium text-gray-800">2. Isi dan unggah file</p>
        <ImportAlsintanForm />
      </div>
    </div>
  );
}
