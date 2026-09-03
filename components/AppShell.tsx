"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Tractor,
  Users,
  Wrench,
  UserCog,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const BASE_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/peta", label: "Peta Sebaran", icon: Map },
  { href: "/alsintan", label: "Alsintan", icon: Tractor },
  { href: "/penerima", label: "Penerima", icon: Users },
  { href: "/jenis-alsintan", label: "Jenis Alsintan", icon: Wrench },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({
  children,
  userLabel,
  role,
}: {
  children: React.ReactNode;
  userLabel: string;
  role: string;
}) {
  const pathname = usePathname();
  const navItems =
    role === "admin" ? [...BASE_NAV_ITEMS, { href: "/pengguna", label: "Pengguna", icon: UserCog }] : BASE_NAV_ITEMS;

  return (
    <div className="min-h-screen bg-gray-50 sm:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white sm:flex">
        <div className="border-b border-gray-200 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900">CWS Way Kanan</p>
          <p className="text-xs text-gray-500">Monitoring Alsintan</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-200 p-3">
          <p className="truncate px-2 py-1 text-xs font-medium text-gray-700">{userLabel}</p>
          <p className="px-2 pb-2 text-xs capitalize text-gray-400">{role}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut size={16} />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (mobile) */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:hidden">
          <div>
            <p className="text-sm font-semibold text-gray-900">CWS Way Kanan</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-gray-500">
              <LogOut size={18} />
            </button>
          </form>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-3 py-2 sm:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-blue-50 text-blue-700" : "text-gray-600"
                }`}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
