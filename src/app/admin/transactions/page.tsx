import { createClient } from "@/lib/supabase/server";
import TransactionLog from "@/components/TransactionLog";
import type { Branch } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
  const supabase = createClient();

  const { data: branches } = await supabase
    .from("branches")
    .select("*")
    .order("name");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Lịch sử giao dịch</h1>
        <p className="text-sm text-slate-500">
          Toàn bộ lần tích tick và đổi quà, kèm thông tin khách.
        </p>
      </div>

      <TransactionLog branches={(branches as Branch[]) ?? []} />
    </div>
  );
}
