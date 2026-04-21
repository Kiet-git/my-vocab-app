// lib/supabase/client.ts
// ✅ Dùng trong "use client" components
// Không import next/headers — an toàn cho browser

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let supabaseClient: any = null;

export function createClient(): any {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ) as any;
  }
  return supabaseClient;
}
