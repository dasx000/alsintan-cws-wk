"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, createAdminCoreClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { friendlyDbError } from "@/lib/friendly-db-error";

export interface PenggunaActionState {
  error: string | null;
  // Cuma dipakai createPengguna, supaya form Tambah tahu kapan harus
  // menutup diri sendiri -- state awal juga {error: null} jadi butuh
  // penanda eksplisit ini untuk membedakan "belum submit" vs "berhasil".
  success?: boolean;
}

// Nilai role dibatasi CHECK constraint core.memberships_role_check ke
// 'admin' | 'operator' | 'viewer' | 'penyuluh_bpp' ('operator'/'viewer'
// nilai umum lintas-app, tidak dipakai app ini). "penyuluh_bpp" setara
// "penyuluh" di UI/istilah bisnis app ini.
const VALID_ROLES = ["admin", "penyuluh_bpp"];

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
  if (profile?.role === "penyuluh_bpp" && profile.koordinator) {
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
  const adminCoreClient = createAdminCoreClient();
  const [{ data: membership }, { data: koordinatorRow }] = await Promise.all([
    adminCoreClient.from("memberships").select("role").eq("user_id", targetId).eq("app_slug", "alsintan").maybeSingle(),
    adminClient.from("penyuluh").select("koordinator").eq("profile_id", targetId).maybeSingle(),
  ]);
  if (!membership) return "Pengguna tidak ditemukan.";
  if (membership.role !== "penyuluh_bpp" || koordinatorRow?.koordinator) return "Anda tidak berwenang mengelola akun ini.";

  const { data: desaRows } = await adminClient
    .from("penyuluh_desa")
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
  const { data } = await adminClient.from("penyuluh_desa").select("id_desa").eq("profile_id", profileId);
  return (data ?? []).map((r) => r.id_desa as string);
}

async function syncDesaWilayah(profileId: string, desaIds: string[]): Promise<string | null> {
  // Admin client -- koordinator (sudah divalidasi lewat
  // validateDesaScope/assertTargetManageable di atas) juga perlu bisa
  // menulis di sini, jadi pakai service role (bypass RLS).
  const adminClient = createAdminClient();

  const { error: deleteError } = await adminClient.from("penyuluh_desa").delete().eq("profile_id", profileId);
  if (deleteError) return friendlyDbError(deleteError, "Gagal menyimpan wilayah desa.");

  if (desaIds.length > 0) {
    const { error: insertError } = await adminClient
      .from("penyuluh_desa")
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
  if (!auth.isAdmin && role !== "penyuluh_bpp") return { error: "Anda cuma bisa membuat akun penyuluh." };

  const koordinatorRequested = role === "penyuluh_bpp" && formData.get("koordinator") === "on";
  if (koordinatorRequested && !auth.isAdmin) return { error: "Cuma admin yang boleh menetapkan koordinator." };

  const nama = (formData.get("nama") as string)?.trim() || null;
  const nip = (formData.get("nip") as string)?.trim() || null;
  const koordinator = koordinatorRequested;
  const desaIds = role === "penyuluh_bpp" ? formData.getAll("id_desa").map(String) : [];

  const desaScopeError = await validateDesaScope(auth, desaIds);
  if (desaScopeError) return { error: desaScopeError };

  // Cek duplikat NIP DULU sebelum bikin akun Auth -- kalau dicek belakangan
  // (setelah createUser), akun yang sudah kadung dibuat jadi nyangkut tanpa
  // detail yang benar ketika update profil gagal karena NIP bentrok. NIP
  // sekarang di core.profiles (identitas lintas-app, project Supabase
  // shared "FULLSTACK").
  const adminClient = createAdminClient();
  const adminCoreClient = createAdminCoreClient();
  if (nip) {
    const { data: existingNip } = await adminCoreClient.from("profiles").select("id").eq("nip", nip).maybeSingle();
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

  // Upsert (bukan update) ke core.profiles/core.memberships -- BELUM
  // dipastikan apakah masih ada trigger seperti handle_new_user() lama yang
  // otomatis bikin baris ini begitu auth.users terisi. Upsert aman untuk
  // kedua kemungkinan (trigger bikin baris duluan, atau tidak sama sekali).
  const { error: profileError } = await adminCoreClient
    .from("profiles")
    .upsert({ id: userId, email, nama, nip }, { onConflict: "id" });
  if (profileError) return { error: friendlyDbError(profileError, "Akun dibuat, tapi gagal menyimpan detail pengguna.") };

  const { error: membershipError } = await adminCoreClient
    .from("memberships")
    .upsert({ user_id: userId, app_slug: "alsintan", role }, { onConflict: "user_id,app_slug" });
  if (membershipError) return { error: friendlyDbError(membershipError, "Akun dibuat, tapi gagal menyimpan role pengguna.") };

  const { error: koordinatorError } = await adminClient
    .from("penyuluh")
    .upsert({ profile_id: userId, koordinator }, { onConflict: "profile_id" });
  if (koordinatorError) return { error: friendlyDbError(koordinatorError, "Akun dibuat, tapi gagal menyimpan status koordinator.") };

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
  if (!auth.isAdmin && role !== "penyuluh_bpp") return { error: "Anda cuma bisa mengelola akun penyuluh." };

  const koordinatorRequested = role === "penyuluh_bpp" && formData.get("koordinator") === "on";
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
  const desaIds = role === "penyuluh_bpp" ? formData.getAll("id_desa").map(String) : [];

  const existingDesaIds = auth.isAdmin ? [] : await getExistingDesaIds(id);
  const desaScopeError = await validateDesaScope(auth, desaIds, existingDesaIds);
  if (desaScopeError) return { error: desaScopeError };

  // Target sudah pasti ada (lolos assertTargetManageable), jadi upsert di
  // sini cuma jaga-jaga kalau baris core.profiles/core.memberships-nya
  // ternyata belum lengkap (mis. akun lama dari sebelum migrasi schema).
  const adminClient = createAdminClient();
  const adminCoreClient = createAdminCoreClient();
  const { error: profileError } = await adminCoreClient.from("profiles").update({ nip, nama }).eq("id", id);
  if (profileError) return { error: friendlyDbError(profileError, "Gagal menyimpan perubahan pengguna.") };

  const { error: membershipError } = await adminCoreClient
    .from("memberships")
    .upsert({ user_id: id, app_slug: "alsintan", role }, { onConflict: "user_id,app_slug" });
  if (membershipError) return { error: friendlyDbError(membershipError, "Gagal menyimpan role pengguna.") };

  const { error: koordinatorError } = await adminClient
    .from("penyuluh")
    .upsert({ profile_id: id, koordinator }, { onConflict: "profile_id" });
  if (koordinatorError) return { error: friendlyDbError(koordinatorError, "Gagal menyimpan status koordinator.") };

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
  // Belum dipastikan apakah core.profiles/core.memberships masih di-cascade
  // otomatis (ON DELETE CASCADE) dari auth.users setelah migrasi ke schema
  // shared -- jadi tabel milik app ini sendiri (penyuluh/penyuluh_desa)
  // dibersihkan manual dulu di sini supaya tidak ada baris yatim tersisa
  // kalau ternyata tidak ada cascade.
  await adminClient.from("penyuluh_desa").delete().eq("profile_id", id);
  await adminClient.from("penyuluh").delete().eq("profile_id", id);

  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  revalidatePath("/pengguna");
  return { error: null };
}
