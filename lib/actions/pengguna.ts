"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { friendlyDbError } from "@/lib/friendly-db-error";

export interface PenggunaActionState {
  error: string | null;
  // Cuma dipakai createPengguna, supaya form Tambah tahu kapan harus
  // menutup diri sendiri -- state awal juga {error: null} jadi butuh
  // penanda eksplisit ini untuk membedakan "belum submit" vs "berhasil".
  success?: boolean;
}

const VALID_ROLES = ["admin", "penyuluh"];

interface ManagerAuth {
  isAdmin: boolean;
  // null = admin (tidak dibatasi). Array = koordinator, dikunci ke kecamatan ini.
  kecamatanScope: string[] | null;
}

// Admin ATAU koordinator (penyuluh ber-status koordinator) boleh mengelola
// pengguna -- admin bebas, koordinator dikunci ke kecamatan yang dia
// koordinasikan (divalidasi lebih lanjut di tiap action lewat
// assertTargetManageable/validateDesaScope). Server action bisa dipanggil
// langsung tanpa lewat halaman /pengguna, jadi wewenang WAJIB dicek ulang di
// sini, tidak cukup mengandalkan redirect di page.tsx.
async function getManagerAuth(): Promise<{ auth: ManagerAuth | null; error: string | null }> {
  const { profile } = await getCurrentProfile();
  if (profile?.role === "admin") return { auth: { isAdmin: true, kecamatanScope: null }, error: null };
  if (profile?.role === "penyuluh" && profile.koordinator) {
    return { auth: { isAdmin: false, kecamatanScope: profile.kecamatanWilayah }, error: null };
  }
  return { auth: null, error: "Cuma admin atau koordinator kecamatan yang boleh mengelola pengguna." };
}

// Kecamatan asal tiap id_desa yang diminta lewat form -- dipakai untuk
// memastikan desa yang dipilih koordinator memang ada di kecamatan yang dia
// koordinasikan. master_desa/master_kecamatan public-readable, jadi cukup
// pakai client biasa.
async function getKecamatanOfDesa(desaIds: string[]): Promise<Map<string, string>> {
  if (desaIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from("master_desa")
    .select("id_desa, master_kecamatan(nama_kecamatan)")
    .in("id_desa", desaIds);
  const map = new Map<string, string>();
  for (const row of (data ?? []) as unknown as {
    id_desa: string;
    master_kecamatan: { nama_kecamatan: string } | null;
  }[]) {
    if (row.master_kecamatan?.nama_kecamatan) map.set(row.id_desa, row.master_kecamatan.nama_kecamatan);
  }
  return map;
}

// Validasi desaIds yang dikirim form -- untuk koordinator, semua id baru
// harus berada di kecamatanScope yang dia koordinasikan. Desa yang sudah
// jadi milik target sebelumnya (preserveExistingIds) dilewatkan begitu saja
// supaya wilayah lintas-kecamatan yang sudah ada tidak ikut lenyap waktu
// koordinator submit form (yang cuma menampilkan kecamatannya sendiri).
async function validateDesaScope(
  auth: ManagerAuth,
  desaIds: string[],
  preserveExistingIds: string[] = []
): Promise<string | null> {
  if (auth.isAdmin) return null;
  const preserveSet = new Set(preserveExistingIds);
  const idsToCheck = desaIds.filter((id) => !preserveSet.has(id));
  const kecamatanOf = await getKecamatanOfDesa(idsToCheck);
  for (const id of idsToCheck) {
    const kec = kecamatanOf.get(id);
    if (!kec || !auth.kecamatanScope!.includes(kec)) {
      return "Anda cuma bisa mengatur desa di kecamatan yang Anda koordinasikan.";
    }
  }
  return null;
}

// Cek apakah target boleh dikelola koordinator: harus penyuluh biasa (bukan
// admin, bukan koordinator lain -- itu wewenang admin), dan kalau sudah
// punya wilayah, minimal salah satu kecamatannya termasuk yang dikoordinasikan.
// Belum punya wilayah sama sekali = boleh (koordinator boleh jadi yang
// pertama kali mengatur wilayahnya).
async function assertTargetManageable(auth: ManagerAuth, targetId: string): Promise<string | null> {
  if (auth.isAdmin) return null;

  const adminClient = createAdminClient();
  const { data: target } = await adminClient.from("profiles").select("role, koordinator").eq("id", targetId).maybeSingle();
  if (!target) return "Pengguna tidak ditemukan.";
  if (target.role !== "penyuluh" || target.koordinator) return "Anda tidak berwenang mengelola akun ini.";

  const { data: desaRows } = await adminClient
    .from("profile_desa")
    .select("master_desa(master_kecamatan(nama_kecamatan))")
    .eq("profile_id", targetId);
  const targetKecamatan = new Set(
    ((desaRows ?? []) as unknown as { master_desa: { master_kecamatan: { nama_kecamatan: string } | null } | null }[])
      .map((r) => r.master_desa?.master_kecamatan?.nama_kecamatan)
      .filter((k): k is string => !!k)
  );
  if (targetKecamatan.size === 0) return null;
  const overlap = [...targetKecamatan].some((k) => auth.kecamatanScope!.includes(k));
  return overlap ? null : "Anda tidak berwenang mengelola akun ini.";
}

async function getExistingDesaIds(profileId: string): Promise<string[]> {
  const adminClient = createAdminClient();
  const { data } = await adminClient.from("profile_desa").select("id_desa").eq("profile_id", profileId);
  return (data ?? []).map((r) => r.id_desa as string);
}

async function syncDesaWilayah(profileId: string, desaIds: string[]): Promise<string | null> {
  // Admin client -- profile_desa_write RLS cuma izinkan admin, sementara
  // koordinator (sudah divalidasi lewat validateDesaScope/assertTargetManageable
  // di atas) juga perlu bisa menulis di sini.
  const adminClient = createAdminClient();

  const { error: deleteError } = await adminClient.from("profile_desa").delete().eq("profile_id", profileId);
  if (deleteError) return friendlyDbError(deleteError, "Gagal menyimpan wilayah desa.");

  if (desaIds.length > 0) {
    const { error: insertError } = await adminClient
      .from("profile_desa")
      .insert(desaIds.map((id_desa) => ({ profile_id: profileId, id_desa })));
    if (insertError) return friendlyDbError(insertError, "Gagal menyimpan wilayah desa.");
  }

  return null;
}

export async function createPengguna(
  _prevState: PenggunaActionState,
  formData: FormData
): Promise<PenggunaActionState> {
  const { auth, error: authError } = await getManagerAuth();
  if (!auth) return { error: authError };

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!email || !password) return { error: "Email dan password wajib diisi." };
  if (password.length < 6) return { error: "Password minimal 6 karakter." };
  if (!VALID_ROLES.includes(role)) return { error: "Role tidak dikenali." };
  if (!auth.isAdmin && role !== "penyuluh") return { error: "Anda cuma bisa membuat akun penyuluh." };

  const koordinatorRequested = role === "penyuluh" && formData.get("koordinator") === "on";
  if (koordinatorRequested && !auth.isAdmin) return { error: "Cuma admin yang boleh menetapkan koordinator." };

  const nama = (formData.get("nama") as string)?.trim() || null;
  const nip = (formData.get("nip") as string)?.trim() || null;
  const koordinator = koordinatorRequested;
  const desaIds = role === "penyuluh" ? formData.getAll("id_desa").map(String) : [];

  const desaScopeError = await validateDesaScope(auth, desaIds);
  if (desaScopeError) return { error: desaScopeError };

  // Cek duplikat NIP DULU sebelum bikin akun Auth -- kalau dicek belakangan
  // (setelah createUser), akun yang sudah kadung dibuat jadi nyangkut tanpa
  // detail yang benar ketika update profil gagal karena NIP bentrok. Pakai
  // admin client -- profiles_select RLS membatasi client biasa cuma bisa
  // baca baris sendiri untuk non-admin.
  const adminClient = createAdminClient();
  if (nip) {
    const { data: existingNip } = await adminClient.from("profiles").select("id").eq("nip", nip).maybeSingle();
    if (existingNip) return { error: "NIP ini sudah dipakai, gunakan yang lain." };
  }

  // email_confirm: true -- akun langsung aktif tanpa perlu klik link
  // verifikasi, karena akun dibuat manual oleh admin/koordinator (bukan
  // self-signup publik), jadi email-nya sudah pasti benar/dipercaya.
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    const msg = createError.message.includes("already been registered")
      ? "Email ini sudah terdaftar."
      : createError.message;
    return { error: msg };
  }

  const userId = created.user.id;

  // handle_new_user() trigger otomatis bikin baris profiles (role default
  // 'penyuluh', koordinator false, nip null) begitu auth.users terisi --
  // di sini tinggal update ke nilai yang sebenarnya diminta di form.
  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ role, koordinator, nip, nama })
    .eq("id", userId);
  if (profileError) return { error: friendlyDbError(profileError, "Akun dibuat, tapi gagal menyimpan detail pengguna.") };

  const desaError = await syncDesaWilayah(userId, desaIds);
  if (desaError) return { error: `Akun dibuat, tapi ${desaError.charAt(0).toLowerCase()}${desaError.slice(1)}` };

  revalidatePath("/pengguna");
  return { error: null, success: true };
}

export async function updatePengguna(
  id: string,
  _prevState: PenggunaActionState,
  formData: FormData
): Promise<PenggunaActionState> {
  const { auth, error: authError } = await getManagerAuth();
  if (!auth) return { error: authError };

  const targetError = await assertTargetManageable(auth, id);
  if (targetError) return { error: targetError };

  const role = formData.get("role") as string;
  if (!VALID_ROLES.includes(role)) return { error: "Role tidak dikenali." };
  if (!auth.isAdmin && role !== "penyuluh") return { error: "Anda cuma bisa mengelola akun penyuluh." };

  const koordinatorRequested = role === "penyuluh" && formData.get("koordinator") === "on";
  if (koordinatorRequested && !auth.isAdmin) return { error: "Cuma admin yang boleh menetapkan koordinator." };

  const password = formData.get("password") as string;
  if (password && password.length < 6) return { error: "Password baru minimal 6 karakter." };

  // Ganti password lewat Auth Admin API (bypass RLS) -- wewenang pemanggil
  // sudah dicek di atas lewat getManagerAuth()+assertTargetManageable().
  if (password) {
    const adminClient = createAdminClient();
    const { error: passwordError } = await adminClient.auth.admin.updateUserById(id, { password });
    if (passwordError) return { error: `Gagal mengganti password: ${passwordError.message}` };
  }

  const nama = (formData.get("nama") as string)?.trim() || null;
  const nip = (formData.get("nip") as string)?.trim() || null;

  // Koordinator & desa cuma relevan untuk role penyuluh -- form tidak
  // merender field itu untuk admin, jadi otomatis kosong/false di sini
  // kalau role-nya admin (wilayah lama ikut kebersihkan saat role diganti).
  const koordinator = koordinatorRequested;
  const desaIds = role === "penyuluh" ? formData.getAll("id_desa").map(String) : [];

  const existingDesaIds = auth.isAdmin ? [] : await getExistingDesaIds(id);
  const desaScopeError = await validateDesaScope(auth, desaIds, existingDesaIds);
  if (desaScopeError) return { error: desaScopeError };

  const adminClient = createAdminClient();
  const { error: profileError } = await adminClient.from("profiles").update({ role, koordinator, nip, nama }).eq("id", id);
  if (profileError) return { error: friendlyDbError(profileError, "Gagal menyimpan perubahan pengguna.") };

  const desaError = await syncDesaWilayah(id, desaIds);
  if (desaError) return { error: desaError };

  revalidatePath("/pengguna");
  return { error: null };
}

export async function deletePengguna(id: string): Promise<PenggunaActionState> {
  const { auth, error: authError } = await getManagerAuth();
  if (!auth) return { error: authError };

  const { userId } = await getCurrentProfile();
  if (id === userId) return { error: "Tidak bisa menghapus akun sendiri yang sedang login." };

  const targetError = await assertTargetManageable(auth, id);
  if (targetError) return { error: targetError };

  const adminClient = createAdminClient();
  // Hapus di Auth otomatis menghapus baris profiles+profile_desa juga
  // (foreign key ON DELETE CASCADE), tidak perlu hapus manual di public.*.
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  revalidatePath("/pengguna");
  return { error: null };
}
