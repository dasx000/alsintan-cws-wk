import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { KONDISI_BADGE_STYLES, KONDISI_OPTIONS, kondisiLabel } from "@/lib/kondisi-alsintan";

interface PerJenis {
  id_jenis: string;
  nama_jenis: string;
  jumlah: number;
}

interface PerKondisi {
  kondisi: string;
  jumlah: number;
}

interface PerKecamatan {
  id_kecamatan: string;
  nama_kecamatan: string;
  jumlah: number;
}

interface PerluPerhatian {
  id: string;
  id_unit: string;
  kondisi: string;
  nama_jenis: string;
  tanpa_pemanfaatan_3bulan: boolean;
  rusak_berat_tanpa_servis: boolean;
}

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

  const [{ data: perJenis }, { data: perKondisi }, { data: perKecamatan }, { data: perluPerhatian }] =
    await Promise.all([
      supabase.from("stat_alsintan_per_jenis").select("*"),
      supabase.from("stat_alsintan_per_kondisi").select("*"),
      supabase.from("stat_alsintan_per_kecamatan").select("*"),
      supabase.from("unit_perlu_perhatian").select("*").limit(50),
    ]);

  const kondisiCounts = (perKondisi ?? []) as PerKondisi[];
  const kondisiStats = KONDISI_OPTIONS.map((k) => ({
    ...k,
    jumlah: kondisiCounts.find((c) => c.kondisi === k.value)?.jumlah ?? 0,
  }));

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

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/peta" className="text-sm text-blue-600 hover:underline">
          Peta Sebaran →
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/alsintan" className="text-sm text-blue-600 hover:underline">
          Kelola Alsintan →
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/penerima" className="text-sm text-blue-600 hover:underline">
          Kelola Penerima →
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/jenis-alsintan" className="text-sm text-blue-600 hover:underline">
          Kelola Jenis Alsintan →
        </Link>
        {profile?.role === "admin" && (
          <>
            <span className="text-gray-300">|</span>
            <Link href="/pengguna" className="text-sm text-blue-600 hover:underline">
              Kelola Pengguna →
            </Link>
          </>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-medium text-gray-700">Unit per Kondisi</h2>
          <ul className="space-y-1">
            {kondisiStats.map((k) => (
              <li key={k.value} className="flex items-center justify-between text-sm">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    KONDISI_BADGE_STYLES[k.value] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {k.label}
                </span>
                <span className="font-medium text-gray-900">{k.jumlah}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-medium text-gray-700">Unit per Jenis</h2>
          <ul className="space-y-1">
            {((perJenis ?? []) as PerJenis[]).map((j) => (
              <li key={j.id_jenis} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{j.nama_jenis}</span>
                <span className="font-medium text-gray-900">{j.jumlah}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 sm:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-gray-700">Unit per Kecamatan</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
            {((perKecamatan ?? []) as PerKecamatan[]).map((k) => (
              <div key={k.id_kecamatan} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{k.nama_kecamatan}</span>
                <span className="font-medium text-gray-900">{k.jumlah}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-medium text-gray-700">Perlu Perhatian</h2>
        {(perluPerhatian ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">Tidak ada unit yang perlu perhatian saat ini.</p>
        ) : (
          <ul className="space-y-2">
            {((perluPerhatian ?? []) as PerluPerhatian[]).map((u) => (
              <li key={u.id} className="flex items-center justify-between rounded-md border border-amber-100 bg-amber-50 p-2 text-sm">
                <div>
                  <Link href={`/alsintan/${u.id}`} className="font-mono font-medium text-gray-900 hover:underline">
                    {u.id_unit}
                  </Link>
                  <span className="text-gray-500"> — {u.nama_jenis}</span>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      KONDISI_BADGE_STYLES[u.kondisi] ?? "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {kondisiLabel(u.kondisi)}
                  </span>
                </div>
                <p className="text-xs text-amber-800">
                  {[
                    u.tanpa_pemanfaatan_3bulan ? "Belum lapor pemanfaatan >3 bulan" : null,
                    u.rusak_berat_tanpa_servis ? "Rusak berat, belum ada servis" : null,
                  ]
                    .filter(Boolean)
                    .join(" & ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
