import { createClient } from "@/lib/supabase/server";
import StaffConsole from "@/components/StaffConsole";
import { todayVN } from "@/lib/utils";
import type { Customer, Gift, TodayEntry } from "@/types";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("branch_id, branch:branches(name)")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const myBranch =
    (me as unknown as { branch: { name: string } | null } | null)?.branch?.name ?? null;

  const [{ data: gifts }, { data: todayTx }, { data: withTicks }] = await Promise.all([
    supabase
      .from("gifts")
      .select("*")
      .eq("active", true)
      .order("tick_cost", { ascending: true }),

    // Giao dịch hôm nay (theo giờ VN)
    supabase
      .from("transactions")
      .select("customer_id, amount, ticks_earned, created_at, customer:customers(*)")
      .eq("invoice_date", todayVN())
      .order("created_at", { ascending: false }),

    // Khách đã có tick — để tính nhắc Zalo
    supabase
      .from("customers")
      .select("*")
      .gt("ticks", 0)
      .order("ticks", { ascending: false })
      .limit(300),
  ]);

  const giftList = (gifts as Gift[]) ?? [];

  // ── Gom giao dịch hôm nay theo khách ──
  const map = new Map<string, TodayEntry>();
  for (const tx of todayTx ?? []) {
    const c = (tx as unknown as { customer: Customer | null }).customer;
    if (!c) continue;
    const existing = map.get(c.id);
    if (existing) {
      existing.txCount += 1;
    } else {
      map.set(c.id, {
        customer: c,
        lastAmount: tx.amount,
        lastTicks: tx.ticks_earned,
        lastTime: tx.created_at,
        txCount: 1,
      });
    }
  }
  const todayList = Array.from(map.values());

  // ── Khách gần đủ tick (thiếu 1-2) ──
  const sorted = [...giftList].sort((a, b) => a.tick_cost - b.tick_cost);
  const zaloAlerts = ((withTicks as Customer[]) ?? [])
    .map((c) => {
      const next = sorted.find((g) => g.tick_cost > c.ticks);
      if (!next) return null;
      const diff = next.tick_cost - c.ticks;
      if (diff > 2) return null;
      return { customer: c, diff, giftName: next.name };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, 10);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Tích tick & đổi quà</h1>
        {myBranch ? (
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-brand-50
                        px-3 py-1 text-xs font-bold text-brand-700">
            📍 {myBranch}
          </p>
        ) : (
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-50
                        px-3 py-1 text-xs font-bold text-amber-800">
            📍 Chưa gán chi nhánh
          </p>
        )}
      </div>

      <StaffConsole
        gifts={giftList}
        todayList={todayList}
        zaloAlerts={zaloAlerts}
      />
    </div>
  );
}
