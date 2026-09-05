"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ScrollReveal from "@/components/landing/ScrollReveal";
import KategoriChart, { type KategoriDatum } from "@/components/landing/KategoriChart";
import JenisChart, { type JenisDatum } from "@/components/landing/JenisChart";

export interface YearlyDatum {
  tahun: number;
  jumlah: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: YearlyDatum }[];
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const { tahun, jumlah } = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-gray-900">{tahun}</p>
      <p className="text-green-700">{jumlah} unit tersalurkan</p>
    </div>
  );
}

export default function LandingDataSection({
  yearly,
  kategori,
  jenis,
}: {
  yearly: YearlyDatum[];
  kategori: KategoriDatum[];
  jenis: JenisDatum[];
}) {
  // Fungsi get_landing_yearly_stats() sudah kembalikan 5 tahun kalender
  // terakhir terurut ascending (lama->baru), termasuk tahun dengan jumlah 0.
  const hasData = yearly.length > 0;

  return (
    <section id="data-alsintan" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <h2 className="text-center text-3xl font-bold tracking-tight text-green-700 sm:text-4xl">Data Alsintan</h2>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <TrendingUp size={20} />
              </span>
              <div>
                <p className="font-semibold text-gray-900">Alsintan Tersalurkan per Tahun</p>
                <p className="text-sm text-gray-500">
                  Jumlah bantuan alat mesin pertanian yang tersalurkan ke kelompok tani se-Kabupaten Way Kanan, 5
                  tahun terakhir.
                </p>
              </div>
            </div>

            {hasData ? (
              <div className="mt-8 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={yearly} margin={{ top: 20, right: 16, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="alsintanFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="tahun"
                      tick={{ fontSize: 12, fill: "#9ca3af" }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="jumlah"
                      stroke="#16a34a"
                      strokeWidth={3}
                      fill="url(#alsintanFill)"
                      dot={{ r: 5, fill: "#16a34a", stroke: "#fff", strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-8 text-center text-sm text-gray-400">
                Belum ada data alsintan dengan tahun pengadaan tercatat.
              </p>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={250}>
          <KategoriChart data={kategori} />
        </ScrollReveal>

        <ScrollReveal delay={350}>
          <JenisChart data={jenis} />
        </ScrollReveal>
      </div>
    </section>
  );
}
