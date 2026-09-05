import { Boxes, CheckCircle2, MapPinned, Sprout } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { KONDISI_OPTIONS } from "@/lib/kondisi-alsintan";
import StatCard from "@/components/dashboard/StatCard";
import DashboardKondisiChart from "@/components/dashboard/DashboardKondisiChart";
import HorizontalBarList from "@/components/dashboard/HorizontalBarList";

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

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ profile }, { data: perJenis }, { data: perKondisi }, { data: perKecamatan }] = await Promise.all([
    getCurrentProfile(),
    supabase.from("stat_alsintan_per_jenis").select("*"),
    supabase.from("stat_alsintan_per_kondisi").select("*"),
    supabase.from("stat_alsintan_per_kecamatan").select("*"),
  ]);

  const kondisiCounts = (perKondisi ?? []) as PerKondisi[];
  const kondisiStats = KONDISI_OPTIONS.map((k) => ({
    ...k,
    jumlah: kondisiCounts.find((c) => c.kondisi === k.value)?.jumlah ?? 0,
  }));
  const totalUnit = kondisiStats.reduce((sum, k) => sum + k.jumlah, 0);
  const jumlahBaik = kondisiStats.find((k) => k.value === "baik")?.jumlah ?? 0;
  const persenBaik = totalUnit > 0 ? Math.round((jumlahBaik / totalUnit) * 100) : 0;
  const jenisList = (perJenis ?? []) as PerJenis[];
  const kecamatanList = (perKecamatan ?? []) as PerKecamatan[];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Selamat datang, {profile?.nama || profile?.email}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Boxes} label="Total Unit" value={totalUnit} iconBg="bg-green-100" iconColor="text-green-700" />
        <StatCard
          icon={CheckCircle2}
          label="Kondisi Baik"
          value={`${persenBaik}%`}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-700"
          valueColor="text-emerald-700"
        />
        <StatCard
          icon={Sprout}
          label="Jenis Alsintan"
          value={jenisList.filter((j) => j.jumlah > 0).length}
          iconBg="bg-amber-100"
          iconColor="text-amber-700"
          valueColor="text-amber-700"
        />
        <StatCard
          icon={MapPinned}
          label="Kecamatan Terjangkau"
          value={kecamatanList.filter((k) => k.jumlah > 0).length}
          iconBg="bg-blue-100"
          iconColor="text-blue-700"
          valueColor="text-blue-700"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardKondisiChart data={kondisiStats} />
        <HorizontalBarList
          icon={<Boxes size={16} />}
          title="Unit per Jenis"
          data={jenisList.map((j) => ({ name: j.nama_jenis, jumlah: j.jumlah }))}
        />
      </div>

      <div>
        <HorizontalBarList
          icon={<MapPinned size={16} />}
          title="Unit per Kecamatan"
          data={kecamatanList.map((k) => ({ name: k.nama_kecamatan, jumlah: k.jumlah }))}
        />
      </div>
    </div>
  );
}
