import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("nama, role").eq("id", user.id).single();

  return (
    <AppShell userLabel={profile?.nama || user.email || ""} role={profile?.role ?? "viewer"}>
      {children}
    </AppShell>
  );
}
