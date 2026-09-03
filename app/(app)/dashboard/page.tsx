import Link from "next/link";
import { AlertTriangle, Boxes, Gauge, MapPinned } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
  const totalUnit = kondisiStats.reduce((sum, k) => sum + k.jumlah, 0);
  const perluPerhatianList = (perluPerhatian ?? []) as PerluPerhatian[];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Selamat datang, {profile?.nama || user?.email} · Total {totalUnit} unit alsintan terdata
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-gray-700">
            <Gauge size={16} />
            <h2 className="text-sm font-medium">Unit per Kondisi</h2>
          </div>
          <ul className="space-y-1.5">
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

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-gray-700">
            <Boxes size={16} />
            <h2 className="text-sm font-medium">Unit per Jenis</h2>
          </div>
          <ul className="space-y-1.5">
            {((perJenis ?? []) as PerJenis[]).map((j) => (
              <li key={j.id_jenis} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{j.nama_jenis}</span>
                <span className="font-medium text-gray-900">{j.jumlah}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:col-span-2">
          <div className="mb-3 flex items-center gap-2 text-gray-700">
            <MapPinned size={16} />
            <h2 className="text-sm font-medium">Unit per Kecamatan</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
            {((perKecamatan ?? []) as PerKecamatan[]).map((k) => (
              <div key={k.id_kecamatan} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{k.nama_kecamatan}</span>
                <span className="font-medium text-gray-900">{k.jumlah}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-gray-700">
          <AlertTriangle size={16} />
          <h2 className="text-sm font-medium">Perlu Perhatian</h2>
        </div>
        {perluPerhatianList.length === 0 ? (
          <p className="text-sm text-gray-500">Tidak ada unit yang perlu perhatian saat ini.</p>
        ) : (
          <ul className="space-y-2">
            {perluPerhatianList.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-1 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
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
    </div>
  );
}
