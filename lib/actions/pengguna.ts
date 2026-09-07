"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError } from "@/lib/friendly-db-error";

export interface PenggunaActionState {
  error: string | null;
}

export async function updatePengguna(
  id: string,
  _prevState: PenggunaActionState,
  formData: FormData
): Promise<PenggunaActionState> {
  const role = formData.get("role") as string;
  const id_kecamatan_wilayah = (formData.get("id_kecamatan_wilayah") as string) || null;

  if (!role) return { error: "Role wajib dipilih." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, id_kecamatan_wilayah })
    .eq("id", id);

  if (error) return { error: friendlyDbError(error, "Gagal menyimpan perubahan pengguna.") };

  revalidatePath("/pengguna");
  return { error: null };
}
