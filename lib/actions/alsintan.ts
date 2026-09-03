"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateIdUnit } from "@/lib/generate-id-unit";

export interface AlsintanActionState {
  error: string | null;
}

const FOTO_BUCKET = "alsintan-foto";

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
  latitude: number | null;
  longitude: number | null;
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
  const latRaw = formData.get("latitude") as string;
  const lngRaw = formData.get("longitude") as string;
  const latitude = latRaw ? Number(latRaw) : null;
  const longitude = lngRaw ? Number(lngRaw) : null;

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
      latitude,
      longitude,
    },
  };
}

function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  return idx === -1 ? null : publicUrl.slice(idx + marker.length);
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function uploadFotoIfPresent(
  supabase: SupabaseServerClient,
  formData: FormData
): Promise<{ error: string | null; fotoUrl: string | null }> {
  const fotoFile = formData.get("foto") as File | null;
  if (!fotoFile || fotoFile.size === 0) return { error: null, fotoUrl: null };

  const path = `alsintan/${crypto.randomUUID()}.jpg`;
  const { error: uploadError } = await supabase.storage.from(FOTO_BUCKET).upload(path, fotoFile, {
    contentType: fotoFile.type || "image/jpeg",
  });
  if (uploadError) return { error: `Gagal upload foto: ${uploadError.message}`, fotoUrl: null };

  const { data } = supabase.storage.from(FOTO_BUCKET).getPublicUrl(path);
  return { error: null, fotoUrl: data.publicUrl };
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

  const { error: fotoError, fotoUrl } = await uploadFotoIfPresent(supabase, formData);
  if (fotoError) return { error: fotoError };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("alsintan").insert({
    ...parsed.data,
    id_unit: idUnit,
    foto_url: fotoUrl,
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

  // Ambil foto lama SEBELUM update, supaya kalau ada foto baru, foto lama
  // bisa dihapus dari Storage setelah update berhasil (tidak menumpuk sampah).
  const { data: existing } = await supabase.from("alsintan").select("foto_url").eq("id", id).single();

  const { error: fotoError, fotoUrl } = await uploadFotoIfPresent(supabase, formData);
  if (fotoError) return { error: fotoError };

  const updateData: ParsedAlsintan & { foto_url?: string } = { ...parsed.data };
  if (fotoUrl) updateData.foto_url = fotoUrl;

  const { error } = await supabase.from("alsintan").update(updateData).eq("id", id);
  if (error) return { error: error.message };

  if (fotoUrl && existing?.foto_url) {
    const oldPath = extractStoragePath(existing.foto_url, FOTO_BUCKET);
    if (oldPath) await supabase.storage.from(FOTO_BUCKET).remove([oldPath]);
  }

  revalidatePath("/alsintan");
  revalidatePath(`/alsintan/${id}`);
  redirect(`/alsintan/${id}`);
}

export async function deleteAlsintan(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: existing } = await supabase.from("alsintan").select("foto_url").eq("id", id).single();

  const { error } = await supabase.from("alsintan").delete().eq("id", id);
  if (error) return { error: error.message };

  if (existing?.foto_url) {
    const path = extractStoragePath(existing.foto_url, FOTO_BUCKET);
    if (path) await supabase.storage.from(FOTO_BUCKET).remove([path]);
  }

  revalidatePath("/alsintan");
  return { error: null };
}
