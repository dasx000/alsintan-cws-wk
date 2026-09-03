import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import PenggunaManager from "@/components/PenggunaManager";

export default async function PenggunaPage() {
  const { profile } = await getCurrentProfile();

  if (profile?.role !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: users }, { data: kecamatanList }] = await Promise.all([
    supabase.from("profiles").select("id, email, nama, role, id_kecamatan_wilayah").order("email"),
    supabase.from("master_kecamatan").select("id_kecamatan, nama_kecamatan").order("nama_kecamatan"),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Kelola Pengguna</h1>
      <PenggunaManager users={users ?? []} kecamatanList={kecamatanList ?? []} />
    </div>
  );
}
