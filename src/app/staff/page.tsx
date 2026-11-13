import { createClient } from "@/lib/supabase/server";
import StaffConsole from "@/components/StaffConsole";
import type { Gift } from "@/types";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const supabase = createClient();

  const { data: gifts } = await supabase
    .from("gifts")
    .select("*")
    .eq("active", true)
    .order("tick_cost", { ascending: true });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Tích điểm & đổi quà</h1>
        <p className="text-sm text-slate-500">
          Nhập số điện thoại khách để tìm hoặc tạo mới, sau đó tích tick theo hoá đơn.
        </p>
      </div>
      <StaffConsole gifts={(gifts as Gift[]) ?? []} />
    </div>
  );
}
