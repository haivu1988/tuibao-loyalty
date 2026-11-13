import { createClient } from "@/lib/supabase/server";
import CreateStaffForm from "@/components/CreateStaffForm";
import StaffManager from "@/components/StaffManager";
import type { Branch, Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profiles }, { data: branches }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, branch_id, active, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("branches").select("*").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Nhân viên</h1>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <CreateStaffForm branches={(branches as Branch[]) ?? []} />
        </div>

        <div className="lg:col-span-3">
          <StaffManager
            initial={(profiles as Profile[]) ?? []}
            branches={(branches as Branch[]) ?? []}
            currentUserId={user?.id ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
