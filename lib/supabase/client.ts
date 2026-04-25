// lib/supabase/client.ts
// "use client" components only
//
// FIX: Bỏ generic <Database> khỏi createBrowserClient.
// Khi dùng Database type thủ công (không phải generated bởi `supabase gen types`),
// Supabase JS v2 infer sai kiểu cho .insert()/.update()/.upsert() → type `never`.
// Giải pháp: dùng untyped client, cast kết quả tại điểm dùng (trong từng component).

import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient(): ReturnType<typeof createBrowserClient> {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return supabaseClient;
}
