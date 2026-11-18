import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export default async function StaffLayout({
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

  const links = profile?.role === "admin" ? [{ href: "/admin", label: "Quản lý" }] : [];

  return (
    <div className="min-h-screen">
      <Navbar title="TUIBAO · Nhân viên" links={links} userName={profile?.full_name} />
      <main className="mx-auto max-w-5xl px-3.5 py-4 pb-safe">{children}</main>
    </div>
  );
}
