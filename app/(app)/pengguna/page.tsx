import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, createAdminCoreClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/get-current-profile";
import PenggunaManager from "@/components/PenggunaManager";

export default async function PenggunaPage() {
  const { profile } = await getCurrentProfile();

  const isAdmin = profile?.role === "admin";
  const isKoordinator = profile?.role === "penyuluh_bpp" && profile.koordinator;
  if (!isAdmin && !isKoordinator) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: kecamatanListRaw }, { data: desaListRaw }] = await Promise.all([
    supabase.from("master_kecamatan").select("id_kecamatan, nama_kecamatan").order("nama_kecamatan"),
    supabase.from("master_desa").select("id_desa, id_kecamatan, nama_desa").order("nama_desa"),
  ]);

  // Koordinator dikunci ke kecamatan yang dia koordinasikan -- baik daftar
  // kecamatan/desa yang ditawarkan di form maupun daftar pengguna yang
  // ditampilkan dibatasi ke situ saja. profiles/profile_desa RLS cuma izinkan
  // baca baris sendiri untuk non-admin, jadi baca daftar pengguna pakai admin
  // client (wewenang koordinator sudah dipastikan lewat pengecekan di atas).
  const kecamatanScope = isAdmin ? null : profile!.kecamatanWilayah;
  const kecamatanList = isAdmin
    ? (kecamatanListRaw ?? [])
    : (kecamatanListRaw ?? []).filter((k) => kecamatanScope!.includes(k.nama_kecamatan));
  const scopedKecamatanIds = new Set(kecamatanList.map((k) => k.id_kecamatan));
  const desaList = isAdmin
    ? (desaListRaw ?? [])
    : (desaListRaw ?? []).filter((d) => scopedKecamatanIds.has(d.id_kecamatan));

  // v_pengguna (schema alsintan) cuma mengembalikan baris milik auth.uid()
  // sesi yang login -- BUKAN daftar semua pengguna -- jadi untuk kebutuhan
  // admin di sini identitas (email/nama/nip) dibaca langsung dari
  // core.profiles, role dari core.memberships (app_slug='alsintan'). Ini
  // tabel identitas yang dipakai bareng semua app di project Supabase
  // "FULLSTACK". koordinator + desa yang dipegang tetap tabel khusus app
  // ini: penyuluh / penyuluh_desa (schema alsintan).
  const adminClient = createAdminClient();
  const adminCoreClient = createAdminCoreClient();
  const [
    { data: profilesRows, error: profilesError },
    { data: membershipRows, error: membershipError },
    { data: koordinatorRows, error: koordinatorError },
    { data: desaRows, error: desaRowsError },
  ] = await Promise.all([
    adminCoreClient.from("profiles").select("id, email, nama, nip").order("email"),
    adminCoreClient.from("memberships").select("user_id, role").eq("app_slug", "alsintan"),
    adminClient.from("penyuluh").select("profile_id, koordinator"),
    adminClient.from("penyuluh_desa").select("profile_id, id_desa"),
  ]);
  console.log("[PenggunaPage] core.profiles:", profilesRows?.length, "error:", profilesError?.message ?? null);
  console.log("[PenggunaPage] core.memberships (alsintan):", membershipRows?.length, "error:", membershipError?.message ?? null);
  console.log("[PenggunaPage] penyuluh:", koordinatorRows?.length, "error:", koordinatorError?.message ?? null);
  console.log("[PenggunaPage] penyuluh_desa:", desaRows?.length, "error:", desaRowsError?.message ?? null);

  const roleByProfile = new Map((membershipRows ?? []).map((r) => [r.user_id, r.role]));
  const koordinatorByProfile = new Map((koordinatorRows ?? []).map((r) => [r.profile_id, r.koordinator]));
  const desaIdsByProfile = new Map<string, string[]>();
  for (const r of desaRows ?? []) {
    const list = desaIdsByProfile.get(r.profile_id) ?? [];
    list.push(r.id_desa);
    desaIdsByProfile.set(r.profile_id, list);
  }

  // Cuma tampilkan orang yang memang punya membership di app ini -- profiles
  // shared lintas app, jadi bisa ada user yang tidak pernah pakai alsintan.
  let usersWithDesa = (profilesRows ?? [])
    .filter((u) => roleByProfile.has(u.id))
    .map((u) => ({
      ...u,
      role: roleByProfile.get(u.id) ?? "penyuluh_bpp",
      koordinator: koordinatorByProfile.get(u.id) ?? false,
      desaIds: desaIdsByProfile.get(u.id) ?? [],
    }));

  if (!isAdmin) {
    const desaKecamatanMap = new Map((desaListRaw ?? []).map((d) => [d.id_desa, d.id_kecamatan]));
    usersWithDesa = usersWithDesa.filter((u) => {
      // Koordinator cuma boleh mengelola penyuluh biasa (bukan admin, bukan
      // koordinator lain -- itu tetap wewenang admin).
      if (u.role !== "penyuluh_bpp" || u.koordinator) return false;
      if (u.desaIds.length === 0) return true; // belum diatur wilayahnya -- boleh diambil koordinator manapun
      return u.desaIds.some((id) => scopedKecamatanIds.has(desaKecamatanMap.get(id) ?? ""));
    });
  }

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Kelola Pengguna</h1>
      <PenggunaManager users={usersWithDesa} kecamatanList={kecamatanList} desaList={desaList} isAdmin={isAdmin} />
    </div>
  );
}
