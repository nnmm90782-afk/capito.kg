import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Supabase renamed "anon key" to "publishable key" in newer projects.
// We support both env var names — whichever one is set will be used.
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    [
      "Supabase is not configured.",
      "Add these to your .env file:",
      "  NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co",
      "  NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...",
      "Then restart the dev server.",
    ].join("\n")
  );
}

// Browser-safe singleton — anon/publishable key only, no server secrets
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
