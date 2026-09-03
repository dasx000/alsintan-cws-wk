import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import JenisAlsintanManager from "@/components/JenisAlsintanManager";

export default async function JenisAlsintanPage() {
  const supabase = await createClient();

  const [{ profile }, { data: jenisList }] = await Promise.all([
    getCurrentProfile(),
    supabase.from("master_jenis_alsintan").select("id, nama_jenis, kode_singkat, kode_ikon").order("nama_jenis"),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Jenis Alsintan</h1>
      <JenisAlsintanManager initialData={jenisList ?? []} isAdmin={profile?.role === "admin"} />
    </div>
  );
}
