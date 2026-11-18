import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";
import { formatVND, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = createClient();

  const [
    { count: customerCount },
    { count: giftCount },
    { count: redemptionCount },
    { data: tickAgg },
    { data: recent },
  ] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase
      .from("gifts")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    supabase.from("redemptions").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("ticks"),
    supabase
      .from("transactions")
      .select(
        "id, amount, ticks_earned, invoice_number, created_at, staff:profiles(full_name, role)"
      )
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalTicks =
    (tickAgg ?? []).reduce((sum, r: { ticks: number }) => sum + (r.ticks || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Tổng quan</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Khách hàng" value={customerCount ?? 0} accent="brand" />
        <StatCard
          label="Tổng tick đang lưu"
          value={totalTicks}
          accent="blue"
          hint="Tick chưa đổi"
        />
        <StatCard label="Quà đang bán" value={giftCount ?? 0} accent="green" />
        <StatCard label="Lượt đổi quà" value={redemptionCount ?? 0} accent="slate" />
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-bold text-slate-900">
          Giao dịch tích điểm gần đây
        </h2>
        {recent && recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="pb-2 font-medium">Thời gian</th>
                  <th className="pb-2 font-medium">Người tích</th>
                  <th className="pb-2 font-medium">Hoá đơn</th>
                  <th className="pb-2 font-medium">Số tiền</th>
                  <th className="pb-2 text-right font-medium">Tick</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((t) => {
                  const staff = Array.isArray(t.staff) ? t.staff[0] : t.staff;
                  return (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap py-2 text-slate-600">
                      {formatDateTime(t.created_at)}
                    </td>
                    <td className="py-2">
                      {staff?.full_name ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-medium text-slate-700">
                            {staff.full_name}
                          </span>
                          {staff.role === "admin" && (
                            <span className="chip bg-purple-100 text-purple-700">
                              QL
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 text-slate-600">{t.invoice_number || "—"}</td>
                    <td className="whitespace-nowrap py-2 text-slate-600">
                      {formatVND(t.amount)}
                    </td>
                    <td className="py-2 text-right font-semibold text-brand-600">
                      +{t.ticks_earned}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Chưa có giao dịch nào.</p>

        )}
      </div>
    </div>
  );
}
