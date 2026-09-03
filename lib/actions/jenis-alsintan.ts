"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface JenisAlsintanActionState {
  error: string | null;
}

export async function createJenisAlsintan(
  _prevState: JenisAlsintanActionState,
  formData: FormData
): Promise<JenisAlsintanActionState> {
  const nama_jenis = (formData.get("nama_jenis") as string)?.trim();
  const kode_ikon = formData.get("kode_ikon") as string;

  if (!nama_jenis || !kode_ikon) {
    return { error: "Nama jenis dan ikon wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("master_jenis_alsintan").insert({ nama_jenis, kode_ikon });

  if (error) return { error: error.message };

  revalidatePath("/jenis-alsintan");
  return { error: null };
}

export async function updateJenisAlsintan(
  id: string,
  _prevState: JenisAlsintanActionState,
  formData: FormData
): Promise<JenisAlsintanActionState> {
  const nama_jenis = (formData.get("nama_jenis") as string)?.trim();
  const kode_ikon = formData.get("kode_ikon") as string;

  if (!nama_jenis || !kode_ikon) {
    return { error: "Nama jenis dan ikon wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("master_jenis_alsintan")
    .update({ nama_jenis, kode_ikon })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/jenis-alsintan");
  return { error: null };
}

export async function deleteJenisAlsintan(id: string): Promise<JenisAlsintanActionState> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("alsintan")
    .select("id", { count: "exact", head: true })
    .eq("id_jenis", id);

  if (count && count > 0) {
    return { error: `Tidak bisa dihapus — masih dipakai oleh ${count} unit alsintan.` };
  }

  const { error } = await supabase.from("master_jenis_alsintan").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/jenis-alsintan");
  return { error: null };
}
