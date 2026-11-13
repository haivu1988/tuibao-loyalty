import { createClient } from "@/lib/supabase/server";
import GiftManager from "@/components/GiftManager";
import type { Gift } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminGiftsPage() {
  const supabase = createClient();
  const { data: gifts } = await supabase
    .from("gifts")
    .select("*")
    .order("tick_cost", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Quà đổi điểm</h1>
      <GiftManager initial={(gifts as Gift[]) ?? []} />
    </div>
  );
}
