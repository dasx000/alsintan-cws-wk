"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface PenerimaActionState {
  error: string | null;
}

interface ParsedPenerima {
  error: string | null;
  data: {
    nama_kelompok: string;
    jenis_kelompok: string;
    nama_ketua: string | null;
    kontak: string | null;
    id_desa: string;
    luas_garapan_ha: number | null;
  } | null;
}

function parsePenerimaForm(formData: FormData): ParsedPenerima {
  const nama_kelompok = (formData.get("nama_kelompok") as string)?.trim();
  const jenis_kelompok = formData.get("jenis_kelompok") as string;
  const nama_ketua = (formData.get("nama_ketua") as string)?.trim() || null;
  const kontak = (formData.get("kontak") as string)?.trim() || null;
  const id_desa = formData.get("id_desa") as string;
  const luasRaw = formData.get("luas_garapan_ha") as string;
  const luas_garapan_ha = luasRaw ? Number(luasRaw) : null;

  if (!nama_kelompok || !jenis_kelompok || !id_desa) {
    return { error: "Nama kelompok, jenis kelompok, dan desa wajib diisi.", data: null };
  }

  return {
    error: null,
    data: { nama_kelompok, jenis_kelompok, nama_ketua, kontak, id_desa, luas_garapan_ha },
  };
}

export async function createPenerima(
  _prevState: PenerimaActionState,
  formData: FormData
): Promise<PenerimaActionState> {
  const parsed = parsePenerimaForm(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Data tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase.from("penerima").insert(parsed.data);

  if (error) return { error: error.message };

  revalidatePath("/penerima");
  redirect("/penerima");
}

export async function updatePenerima(
  id: string,
  _prevState: PenerimaActionState,
  formData: FormData
): Promise<PenerimaActionState> {
  const parsed = parsePenerimaForm(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Data tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase.from("penerima").update(parsed.data).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/penerima");
  redirect("/penerima");
}

export async function deletePenerima(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("penerima").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/penerima");
  return { error: null };
}
