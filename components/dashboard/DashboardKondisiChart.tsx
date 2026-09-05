"use client";

import { Gauge } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { KONDISI_MARKER_COLORS } from "@/lib/marker-icon";

export interface KondisiDatum {
  value: string;
  label: string;
  jumlah: number;
}

export default function DashboardKondisiChart({ data }: { data: KondisiDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.jumlah, 0);
  const chartData = data.map((d) => ({
    name: d.label,
    jumlah: d.jumlah,
    fill: KONDISI_MARKER_COLORS[d.value] ?? "#9ca3af",
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2 text-gray-700">
        <Gauge size={16} />
        <h2 className="text-sm font-medium">Unit per Kondisi</h2>
      </div>

      {total > 0 ? (
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#374151" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Bar dataKey="jumlah" radius={[8, 8, 0, 0]} maxBarSize={56}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
                <LabelList dataKey="jumlah" position="top" style={{ fontWeight: 700, fill: "#111827", fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-gray-400">Belum ada data alsintan.</p>
      )}
    </div>
  );
}
