// lib/supabase/server.ts
// ✅ Dùng trong Server Components, Server Actions, Route Handlers
// KHÔNG import file này vào "use client" components

import {
  createServerClient,
  type CookieOptions,
  type CookieMethodsServer,
} from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createClient(): Promise<any> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: CookieOptions;
          }>,
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component không set cookie được — bỏ qua
          }
        },
      } as CookieMethodsServer,
    },
  ) as any;
}
