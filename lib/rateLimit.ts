import { supabaseAdmin } from "@/lib/supabase";
import { utcIso } from "@/lib/dates";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
// Postgres error code for "relation does not exist" — lets login keep working
// (with no rate limiting) if the LoginAttempt migration in database-updates.sql
// hasn't been run yet, instead of breaking the login page outright.
const UNDEFINED_TABLE = "42P01";

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function isLoginLocked(ip: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("LoginAttempt")
    .select("lockedUntil")
    .eq("ip", ip)
    .maybeSingle();

  if (error) {
    if (error.code === UNDEFINED_TABLE) return false;
    console.error("Failed to check login rate limit:", error);
    return false;
  }
  if (!data?.lockedUntil) return false;
  return new Date(utcIso(data.lockedUntil)).getTime() > Date.now();
}

export async function recordLoginFailure(ip: string): Promise<void> {
  const { data, error: selectError } = await supabaseAdmin
    .from("LoginAttempt")
    .select("failCount")
    .eq("ip", ip)
    .maybeSingle();
  if (selectError) {
    if (selectError.code === UNDEFINED_TABLE) return;
    console.error("Failed to read login attempt count:", selectError);
    return;
  }

  const nextCount = (data?.failCount ?? 0) + 1;
  const lockedOut = nextCount >= MAX_ATTEMPTS;

  const { error: upsertError } = await supabaseAdmin.from("LoginAttempt").upsert({
    ip,
    failCount: lockedOut ? 0 : nextCount,
    lockedUntil: lockedOut ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString() : null,
    updatedAt: new Date().toISOString(),
  });
  if (upsertError && upsertError.code !== UNDEFINED_TABLE) {
    console.error("Failed to record login failure:", upsertError);
  }
}

export async function recordLoginSuccess(ip: string): Promise<void> {
  const { error } = await supabaseAdmin.from("LoginAttempt").delete().eq("ip", ip);
  if (error && error.code !== "42P01") {
    console.error("Failed to clear login attempt record:", error);
  }
}
