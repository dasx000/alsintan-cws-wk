"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateIdUnit } from "@/lib/generate-id-unit";

export interface AlsintanActionState {
  error: string | null;
}

interface ParsedAlsintan {
  id_jenis: string;
  id_penerima_saat_ini: string;
  merk: string | null;
  tipe: string | null;
  no_rangka: string | null;
  no_mesin: string | null;
  tahun_pengadaan: number;
  id_sumber_dana: string | null;
  no_bast: string | null;
  tanggal_bast: string | null;
  nilai_aset: number | null;
  kondisi: string;
  catatan: string | null;
}

function parseAlsintanForm(formData: FormData): { error: string | null; data: ParsedAlsintan | null } {
  const id_jenis = formData.get("id_jenis") as string;
  const id_penerima_saat_ini = formData.get("id_penerima_saat_ini") as string;
  const merk = (formData.get("merk") as string)?.trim() || null;
  const tipe = (formData.get("tipe") as string)?.trim() || null;
  const no_rangka = (formData.get("no_rangka") as string)?.trim() || null;
  const no_mesin = (formData.get("no_mesin") as string)?.trim() || null;
  const tahunRaw = formData.get("tahun_pengadaan") as string;
  const tahun_pengadaan = tahunRaw ? Number(tahunRaw) : NaN;
  const id_sumber_dana = (formData.get("id_sumber_dana") as string) || null;
  const no_bast = (formData.get("no_bast") as string)?.trim() || null;
  const tanggal_bast = (formData.get("tanggal_bast") as string) || null;
  const nilaiRaw = formData.get("nilai_aset") as string;
  const nilai_aset = nilaiRaw ? Number(nilaiRaw) : null;
  const kondisi = formData.get("kondisi") as string;
  const catatan = (formData.get("catatan") as string)?.trim() || null;

  if (!id_jenis || !id_penerima_saat_ini || !tahun_pengadaan || Number.isNaN(tahun_pengadaan) || !kondisi) {
    return {
      error: "Jenis alsintan, penerima, tahun pengadaan, dan kondisi wajib diisi.",
      data: null,
    };
  }

  return {
    error: null,
    data: {
      id_jenis,
      id_penerima_saat_ini,
      merk,
      tipe,
      no_rangka,
      no_mesin,
      tahun_pengadaan,
      id_sumber_dana,
      no_bast,
      tanggal_bast,
      nilai_aset,
      kondisi,
      catatan,
    },
  };
}

export async function createAlsintan(
  _prevState: AlsintanActionState,
  formData: FormData
): Promise<AlsintanActionState> {
  const parsed = parseAlsintanForm(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Data tidak valid." };

  const supabase = await createClient();

  const { data: idKecamatan, error: kecErr } = await supabase.rpc("kecamatan_of_penerima", {
    penerima_id: parsed.data.id_penerima_saat_ini,
  });
  if (kecErr || !idKecamatan) {
    return { error: "Tidak bisa menentukan kecamatan dari penerima yang dipilih." };
  }

  const { data: jenis, error: jenisErr } = await supabase
    .from("master_jenis_alsintan")
    .select("kode_singkat")
    .eq("id", parsed.data.id_jenis)
    .single();
  if (jenisErr || !jenis) {
    return { error: "Jenis alsintan tidak ditemukan." };
  }

  let idUnit: string;
  try {
    idUnit = await generateIdUnit(supabase, idKecamatan, jenis.kode_singkat, parsed.data.tahun_pengadaan);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal membuat ID unit." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("alsintan").insert({
    ...parsed.data,
    id_unit: idUnit,
    dibuat_oleh: user?.id,
  });

  if (error) {
    if (error.code === "23505" && error.message.includes("id_unit")) {
      return { error: "ID unit yang dibuat bentrok (kemungkinan ada input bersamaan). Coba simpan ulang." };
    }
    return { error: error.message };
  }

  revalidatePath("/alsintan");
  redirect("/alsintan");
}

export async function updateAlsintan(
  id: string,
  _prevState: AlsintanActionState,
  formData: FormData
): Promise<AlsintanActionState> {
  const parsed = parseAlsintanForm(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Data tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase.from("alsintan").update(parsed.data).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/alsintan");
  revalidatePath(`/alsintan/${id}`);
  redirect(`/alsintan/${id}`);
}

export async function deleteAlsintan(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("alsintan").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/alsintan");
  return { error: null };
}
