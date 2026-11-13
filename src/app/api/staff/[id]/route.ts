import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";

const RESET_PASSWORD = "12345678";

// Xác thực người gọi là admin + trả về client service-role
async function requireAdmin() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập", status: 401 as const };

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return { error: "Không có quyền", status: 403 as const };

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey)
    return { error: "Thiếu SUPABASE_SERVICE_ROLE_KEY trên server", status: 500 as const };

  const admin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  return { admin, meId: user.id };
}

// PATCH: reset mật khẩu, hoặc đổi chi nhánh
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const { admin } = ctx;
  const id = params.id;

  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action === "reset_password") {
    const { error } = await admin.auth.admin.updateUserById(id, {
      password: RESET_PASSWORD,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, password: RESET_PASSWORD });
  }

  if (action === "set_branch") {
    const branchId = body?.branch_id || null;
    const { error } = await admin
      .from("profiles")
      .update({ branch_id: branchId })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, branch_id: branchId });
  }

  return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
}

// DELETE: xoá tài khoản nhân viên (xoá auth user -> profile tự xoá theo cascade)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireAdmin();
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const { admin, meId } = ctx;
  const id = params.id;

  if (id === meId) {
    return NextResponse.json(
      { error: "Không thể tự xoá tài khoản của chính mình" },
      { status: 400 }
    );
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
