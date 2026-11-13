import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Chẩn đoán: cho biết env có mặt lúc chạy hay không (KHÔNG lộ giá trị bí mật).
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";

  return NextResponse.json({
    ok: Boolean(url && anon && service),
    NEXT_PUBLIC_SUPABASE_URL: { present: Boolean(url), length: url.length, value: url || null },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: { present: Boolean(anon), length: anon.length },
    SUPABASE_SERVICE_ROLE_KEY: { present: Boolean(service), length: service.length },
    NEXT_PUBLIC_SITE_URL: { present: Boolean(site), length: site.length, value: site || null },
  });
}
