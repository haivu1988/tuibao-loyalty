import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // Chỉ quản lý mới vào được khu admin
  if (profile?.role !== "admin") redirect("/staff");

  const links = [
    { href: "/admin", label: "Tổng quan" },
    { href: "/admin/staff", label: "Nhân viên" },
    { href: "/admin/branches", label: "Chi nhánh" },
    { href: "/admin/gifts", label: "Quà" },
    { href: "/admin/qr", label: "Mã QR" },
    { href: "/staff", label: "Màn NV" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar title="TUIBAO · Quản lý" links={links} userName={profile?.full_name} />
      <main className="mx-auto max-w-5xl px-4 py-5 pb-safe">{children}</main>
    </div>
  );
}
