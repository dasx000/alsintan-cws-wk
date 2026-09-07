import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/get-current-profile";
import ProfilForm from "@/components/ProfilForm";

export default async function ProfilPage() {
  const { profile } = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Profil Saya</h1>
      <ProfilForm profile={profile} />
    </div>
  );
}
