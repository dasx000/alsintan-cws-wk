import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/get-current-profile";
import AppShell from "@/components/AppShell";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getCurrentProfile();

  if (!profile) redirect("/login");

  return (
    <AppShell userLabel={profile.nama || profile.email || ""} role={profile.role}>
      {children}
    </AppShell>
  );
}
