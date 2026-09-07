"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Login boleh pakai email ATAU NIP. Supabase Auth cuma terima email, jadi
// kalau yang diketik bukan email (tidak ada "@"), cari email pemiliknya
// lewat NIP dulu -- pakai admin client karena ini dipanggil SEBELUM user
// login (belum ada sesi authenticated buat baca tabel profiles).
export async function resolveLoginEmail(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) return trimmed;

  const adminClient = createAdminClient();
  const { data } = await adminClient.from("profiles").select("email").eq("nip", trimmed).maybeSingle();
  return data?.email ?? null;
}
