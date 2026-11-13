"use client";

import { createBrowserClient } from "@supabase/ssr";

// Supabase client dùng ở Client Component (trình duyệt)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
