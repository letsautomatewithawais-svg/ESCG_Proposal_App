import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin?: ReturnType<typeof createClient<Database>>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY environment variables.",
  );
}

// Server-only client using the secret key — bypasses Row Level Security.
// Never import this from a Client Component.
export const supabaseAdmin =
  globalForSupabase.supabaseAdmin ??
  createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabaseAdmin = supabaseAdmin;
}
