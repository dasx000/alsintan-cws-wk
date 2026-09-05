import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getKecamatanDesaForProfile } from "@/lib/wilayah";
import { buildAlsintanImportTemplate } from "@/lib/alsintan-import-template";

export async function GET() {
  const supabase = await createClient();

  const [{ kecamatanList }, { data: jenisList }, { data: sumberDanaList }] = await Promise.all([
    getKecamatanDesaForProfile(),
    supabase.from("master_jenis_alsintan").select("nama_jenis, kategori").order("nama_jenis"),
    supabase.from("master_sumber_dana").select("nama_sumber").order("nama_sumber"),
  ]);

  const buffer = await buildAlsintanImportTemplate({
    jenisList: jenisList ?? [],
    kecamatanList,
    sumberDanaList: sumberDanaList ?? [],
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="template-impor-alsintan.xlsx"`,
    },
  });
}
