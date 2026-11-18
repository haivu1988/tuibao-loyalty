import { createClient } from "@/lib/supabase/server";
import CustomerTable from "@/components/CustomerTable";
import type { CustomerStats } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const supabase = createClient();

  const { data: customers, error } = await supabase
    .from("customer_stats")
    .select("*")
    .order("total_spent", { ascending: false })
    .limit(1000);

  if (error) {
    return (
      <div className="card">
        <h1 className="text-xl font-bold text-slate-900">Khách hàng</h1>
        <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
          Chưa chạy migration <b>005_ux_updates.sql</b> trên Supabase nên chưa có
          bảng thống kê. Mở Supabase → SQL Editor → dán nội dung file đó → Run.
        </p>
        <p className="mt-2 text-xs text-slate-400">Chi tiết lỗi: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Khách hàng</h1>
        <p className="text-sm text-slate-500">
          {customers?.length ?? 0} khách · chỉ quản lý xem được
        </p>
      </div>

      <CustomerTable customers={(customers as CustomerStats[]) ?? []} />
    </div>
  );
}
