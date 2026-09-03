import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface CurrentProfile {
  id: string;
  email: string | null;
  nama: string | null;
  role: string;
  id_kecamatan_wilayah: string | null;
}

// cache() dedupe pemanggilan dalam satu request yang sama -- layout.tsx
// (untuk sidebar) dan tiap page.tsx sama-sama butuh user+profile, tanpa ini
// jadi 2x round-trip ke Supabase Auth/DB tiap kali pindah halaman.
export const getCurrentProfile = cache(async (): Promise<{ userId: string; profile: CurrentProfile | null }> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: "", profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama, role, id_kecamatan_wilayah")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    profile: {
      id: user.id,
      email: user.email ?? null,
      nama: profile?.nama ?? null,
      role: profile?.role ?? "viewer",
      id_kecamatan_wilayah: profile?.id_kecamatan_wilayah ?? null,
    },
  };
});
