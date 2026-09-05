import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}

export default function StatCard({ icon: Icon, label, value, iconBg, iconColor, valueColor }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className={`flex size-10 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
        <Icon size={18} />
      </span>
      <p className={`mt-3 text-2xl font-bold ${valueColor ?? "text-gray-900"}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
