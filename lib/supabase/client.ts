// lib/supabase/client.ts
// ✅ Dùng trong "use client" components
// Next.js 16 + React 19 compatible

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Singleton pattern — tránh tạo nhiều client trong cùng session
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient(): ReturnType<typeof createBrowserClient<Database>> {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
}
