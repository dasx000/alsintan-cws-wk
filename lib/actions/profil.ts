"use server";

import { revalidatePath } from "next/cache";
import { createAdminCoreClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { friendlyDbError } from "@/lib/friendly-db-error";

export interface ProfilActionState {
  error: string | null;
  success?: boolean;
}

// Edit profil sendiri -- cuma nama, NIP, password. Role/koordinator/wilayah
// TIDAK bisa diubah lewat sini (itu tetap wewenang admin/koordinator lewat
// menu Pengguna), jadi tidak ada risiko eskalasi hak akses lewat halaman ini.
export async function updateProfilSendiri(
  _prevState: ProfilActionState,
  formData: FormData
): Promise<ProfilActionState> {
  const { userId } = await getCurrentProfile();
  if (!userId) return { error: "Sesi tidak ditemukan, silakan login ulang." };

  const nama = (formData.get("nama") as string)?.trim() || null;
  const nip = (formData.get("nip") as string)?.trim() || null;
  const password = formData.get("password") as string;

  if (password && password.length < 6) return { error: "Password baru minimal 6 karakter." };

  // nama/nip sekarang di core.profiles (identitas lintas-app, project
  // Supabase shared "FULLSTACK") -- pakai admin client (core schema) di
  // sini, amannya cukup karena id yang di-update SELALU dari sesi sendiri
  // (userId), bukan dari input form.
  const adminCoreClient = createAdminCoreClient();

  const { error: profileError } = await adminCoreClient.from("profiles").update({ nama, nip }).eq("id", userId);
  if (profileError) return { error: friendlyDbError(profileError, "Gagal menyimpan perubahan profil.") };

  if (password) {
    const { error: passwordError } = await adminCoreClient.auth.admin.updateUserById(userId, { password });
    if (passwordError) return { error: `Profil disimpan, tapi gagal mengganti password: ${passwordError.message}` };
  }

  revalidatePath("/profil");
  return { error: null, success: true };
}
