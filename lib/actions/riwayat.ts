"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface RiwayatActionState {
  error: string | null;
}

async function currentUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ---------- Mutasi ----------
// Membuat entri mutasi = transfer resmi. id_penerima_lama diambil otomatis
// dari id_penerima_saat_ini unit saat ini, lalu id_penerima_saat_ini
// di-update ke penerima baru. Kalau update gagal, entri mutasi yang baru
// dibuat dihapus lagi supaya datanya tidak nyangkut setengah jalan.
export async function createMutasi(
  idAlsintan: string,
  _prevState: RiwayatActionState,
  formData: FormData
): Promise<RiwayatActionState> {
  const id_penerima_baru = formData.get("id_penerima_baru") as string;
  const tanggal = formData.get("tanggal") as string;
  const no_surat = (formData.get("no_surat") as string)?.trim() || null;
  const keterangan = (formData.get("keterangan") as string)?.trim() || null;

  if (!id_penerima_baru || !tanggal) {
    return { error: "Penerima baru dan tanggal wajib diisi." };
  }

  const supabase = await createClient();

  const { data: alsintan, error: alsintanErr } = await supabase
    .from("alsintan")
    .select("id_penerima_saat_ini")
    .eq("id", idAlsintan)
    .single();
  if (alsintanErr) return { error: alsintanErr.message };

  const dibuat_oleh = await currentUserId(supabase);

  const { data: inserted, error: insertErr } = await supabase
    .from("mutasi")
    .insert({
      id_alsintan: idAlsintan,
      id_penerima_lama: alsintan?.id_penerima_saat_ini ?? null,
      id_penerima_baru,
      tanggal,
      no_surat,
      keterangan,
      dibuat_oleh,
    })
    .select("id")
    .single();
  if (insertErr) return { error: insertErr.message };

  const { error: updateErr } = await supabase
    .from("alsintan")
    .update({ id_penerima_saat_ini: id_penerima_baru })
    .eq("id", idAlsintan);

  if (updateErr) {
    await supabase.from("mutasi").delete().eq("id", inserted.id);
    return { error: `Gagal memindahkan penerima: ${updateErr.message}` };
  }

  revalidatePath(`/alsintan/${idAlsintan}`);
  return { error: null };
}

export async function deleteMutasi(id: string, idAlsintan: string): Promise<RiwayatActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("mutasi").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/alsintan/${idAlsintan}`);
  return { error: null };
}

// ---------- Pemanfaatan ----------
export async function createPemanfaatan(
  idAlsintan: string,
  _prevState: RiwayatActionState,
  formData: FormData
): Promise<RiwayatActionState> {
  const tanggal = formData.get("tanggal") as string;
  const luasRaw = formData.get("luas_layanan_ha") as string;
  const luas_layanan_ha = luasRaw ? Number(luasRaw) : null;
  const komoditas = (formData.get("komoditas") as string)?.trim() || null;
  const operator = (formData.get("operator") as string)?.trim() || null;

  if (!tanggal) return { error: "Tanggal wajib diisi." };

  const supabase = await createClient();
  const dibuat_oleh = await currentUserId(supabase);

  const { error } = await supabase.from("pemanfaatan").insert({
    id_alsintan: idAlsintan,
    tanggal,
    luas_layanan_ha,
    komoditas,
    operator,
    dibuat_oleh,
  });
  if (error) return { error: error.message };

  revalidatePath(`/alsintan/${idAlsintan}`);
  return { error: null };
}

export async function deletePemanfaatan(id: string, idAlsintan: string): Promise<RiwayatActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("pemanfaatan").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/alsintan/${idAlsintan}`);
  return { error: null };
}

// ---------- Servis ----------
export async function createServis(
  idAlsintan: string,
  _prevState: RiwayatActionState,
  formData: FormData
): Promise<RiwayatActionState> {
  const tanggal = formData.get("tanggal") as string;
  const kerusakan = (formData.get("kerusakan") as string)?.trim() || null;
  const biayaRaw = formData.get("biaya") as string;
  const biaya = biayaRaw ? Number(biayaRaw) : null;
  const sparepart = (formData.get("sparepart") as string)?.trim() || null;
  const status = (formData.get("status") as string) || "proses";

  if (!tanggal) return { error: "Tanggal wajib diisi." };

  const supabase = await createClient();
  const dibuat_oleh = await currentUserId(supabase);

  const { error } = await supabase.from("servis").insert({
    id_alsintan: idAlsintan,
    tanggal,
    kerusakan,
    biaya,
    sparepart,
    status,
    dibuat_oleh,
  });
  if (error) return { error: error.message };

  revalidatePath(`/alsintan/${idAlsintan}`);
  return { error: null };
}

export async function updateServis(
  id: string,
  idAlsintan: string,
  _prevState: RiwayatActionState,
  formData: FormData
): Promise<RiwayatActionState> {
  const tanggal = formData.get("tanggal") as string;
  const kerusakan = (formData.get("kerusakan") as string)?.trim() || null;
  const biayaRaw = formData.get("biaya") as string;
  const biaya = biayaRaw ? Number(biayaRaw) : null;
  const sparepart = (formData.get("sparepart") as string)?.trim() || null;
  const status = (formData.get("status") as string) || "proses";

  if (!tanggal) return { error: "Tanggal wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("servis")
    .update({ tanggal, kerusakan, biaya, sparepart, status })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/alsintan/${idAlsintan}`);
  return { error: null };
}

export async function deleteServis(id: string, idAlsintan: string): Promise<RiwayatActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("servis").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/alsintan/${idAlsintan}`);
  return { error: null };
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
    if (uploadError) return { error: `Gagal upload foto: ${uploadError.message}` };
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
  if (error) return { error: error.message };

  revalidatePath(`/alsintan/${idAlsintan}`);
  return { error: null };
}

export async function deleteMonev(id: string, idAlsintan: string): Promise<RiwayatActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("monev").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/alsintan/${idAlsintan}`);
  return { error: null };
}
