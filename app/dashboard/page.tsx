import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama, role")
    .eq("id", user!.id)
    .single();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">CWS Kabupaten Way Kanan</h1>
          <p className="text-sm text-gray-500">Dashboard Monitoring Alsintan</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Keluar
          </button>
        </form>
      </div>

      <p className="mb-4 text-gray-700">
        Selamat datang, <span className="font-medium">{profile?.nama || user?.email}</span>{" "}
        <span className="text-sm text-gray-500">({profile?.role ?? "belum ada role"})</span>
      </p>

      <Link href="/jenis-alsintan" className="text-sm text-blue-600 hover:underline">
        Kelola Jenis Alsintan →
      </Link>
    </main>
  );
}
