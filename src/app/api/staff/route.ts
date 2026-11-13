import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { loginIdToEmail } from "@/lib/utils";

// POST /api/staff — Tạo tài khoản nhân viên mới (chỉ quản lý được gọi)
export async function POST(request: Request) {
  // 1) Xác thực người gọi phải là admin
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  // 2) Đọc payload
  const body = await request.json().catch(() => null);
  const loginId = (body?.login_id || body?.email || "").trim();
  const email = loginIdToEmail(loginId); // ID -> email nội bộ (hoặc giữ nguyên nếu là email)
  const password = body?.password || "";
  const fullName = (body?.full_name || "").trim();
  const role = body?.role === "admin" ? "admin" : "staff";
  const branchId = body?.branch_id || null;

  if (!loginId || !password || !fullName) {
    return NextResponse.json(
      { error: "Thiếu ID đăng nhập, mật khẩu hoặc tên" },
      { status: 400 }
    );
  }
  if (!/^[a-z0-9._-]+$/i.test(loginId) && !loginId.includes("@")) {
    return NextResponse.json(
      { error: "ID chỉ gồm chữ, số và . _ - (không dấu, không khoảng trắng)" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Mật khẩu tối thiểu 6 ký tự" },
      { status: 400 }
    );
  }

  // 3) Dùng service role để tạo user (KHÔNG bao giờ lộ key này ra client)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Thiếu SUPABASE_SERVICE_ROLE_KEY trên server" },
      { status: 500 }
    );
  }

  const admin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role, branch_id: branchId },
  });

  if (createErr) {
    return NextResponse.json(
      { error: createErr.message || "Tạo tài khoản thất bại" },
      { status: 400 }
    );
  }

  // Trigger handle_new_user sẽ tự tạo profile. Đảm bảo giá trị đúng (phòng khi trigger chưa chạy).
  if (created.user) {
    await admin.from("profiles").upsert(
      {
        id: created.user.id,
        full_name: fullName,
        role,
        branch_id: branchId,
        active: true,
      },
      { onConflict: "id" }
    );
  }

  return NextResponse.json({ ok: true, id: created.user?.id });
}
