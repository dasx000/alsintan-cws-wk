"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError } from "@/lib/friendly-db-error";

export interface RiwayatActionState {
  error: string | null;
}

// ---------- Monev ----------
export async function createMonev(
  idAlsintan: string,
  _prevState: RiwayatActionState,
  formData: FormData
): Promise<RiwayatActionState> {
  const tanggal_kunjungan = formData.get("tanggal_kunjungan") as string;
  const kondisi_terverifikasi = (formData.get("kondisi_terverifikasi") as string) || null;
  const catatan = (formData.get("catatan") as string)?.trim() || null;
  const petugas = (formData.get("petugas") as string)?.trim() || null;

  if (!tanggal_kunjungan) return { error: "Tanggal kunjungan wajib diisi." };

  const supabase = await createClient();

  const fotoFile = formData.get("foto") as File | null;
  let foto_url: string | null = null;
  if (fotoFile && fotoFile.size > 0) {
    const path = `monev/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage.from("alsintan-foto").upload(path, fotoFile, {
      contentType: fotoFile.type || "image/jpeg",
    });
    if (uploadError) return { error: "Gagal mengunggah foto. Coba lagi." };
    const { data } = supabase.storage.from("alsintan-foto").getPublicUrl(path);
    foto_url = data.publicUrl;
  }

  const { error } = await supabase.from("monev").insert({
    id_alsintan: idAlsintan,
    tanggal_kunjungan,
    kondisi_terverifikasi,
    catatan,
    foto_url,
    petugas,
  });
  if (error) return { error: friendlyDbError(error, "Gagal menyimpan hasil kunjungan.") };

  revalidatePath(`/alsintan/${idAlsintan}`);
  return { error: null };
}

export async function deleteMonev(id: string, idAlsintan: string): Promise<RiwayatActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("monev").delete().eq("id", id);
  if (error) return { error: friendlyDbError(error, "Gagal menghapus catatan kunjungan.") };

  revalidatePath(`/alsintan/${idAlsintan}`);
  return { error: null };
}
