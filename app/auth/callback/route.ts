// app/auth/callback/route.ts
// Next.js 16 Route Handler — handles OAuth + magic link callbacks

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Use absolute URL redirect — required in Next.js 16
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — redirect with error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
