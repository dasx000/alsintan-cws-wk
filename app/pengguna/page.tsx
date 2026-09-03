import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PenggunaManager from "@/components/PenggunaManager";

export default async function PenggunaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: users }, { data: kecamatanList }] = await Promise.all([
    supabase.from("profiles").select("id, email, nama, role, id_kecamatan_wilayah").order("email"),
    supabase.from("master_kecamatan").select("id_kecamatan, nama_kecamatan").order("nama_kecamatan"),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/dashboard" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Kelola Pengguna</h1>
      <PenggunaManager users={users ?? []} kecamatanList={kecamatanList ?? []} />
    </main>
  );
}
