import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/get-current-profile";
import PenggunaManager from "@/components/PenggunaManager";

export default async function PenggunaPage() {
  const { profile } = await getCurrentProfile();

  const isAdmin = profile?.role === "admin";
  const isKoordinator = profile?.role === "penyuluh" && profile.koordinator;
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

  const adminClient = createAdminClient();
  const { data: users } = await adminClient
    .from("profiles")
    .select("id, email, nama, nip, role, koordinator, profile_desa(id_desa)")
    .order("email");

  let usersWithDesa = (users ?? []).map((u) => ({
    ...u,
    desaIds: (u.profile_desa ?? []).map((pd: { id_desa: string }) => pd.id_desa),
  }));

  if (!isAdmin) {
    const desaKecamatanMap = new Map((desaListRaw ?? []).map((d) => [d.id_desa, d.id_kecamatan]));
    usersWithDesa = usersWithDesa.filter((u) => {
      // Koordinator cuma boleh mengelola penyuluh biasa (bukan admin, bukan
      // koordinator lain -- itu tetap wewenang admin).
      if (u.role !== "penyuluh" || u.koordinator) return false;
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
