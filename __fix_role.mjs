import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("D:/CODING/ALSINTRACK/.env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const core = createClient(url, serviceKey, { db: { schema: "core" } });

const { data, error, count } = await core
  .from("memberships")
  .update({ role: "penyuluh" })
  .eq("app_slug", "alsintan")
  .eq("role", "operator")
  .select("user_id", { count: "exact" });

console.log("updated rows:", count, "error:", error?.message ?? null);

const { data: allRoles } = await core.from("memberships").select("role").eq("app_slug", "alsintan");
const tally = {};
for (const r of allRoles ?? []) tally[r.role] = (tally[r.role] ?? 0) + 1;
console.log("role tally for app_slug=alsintan AFTER update:", JSON.stringify(tally));
