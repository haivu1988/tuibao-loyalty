import { createClient } from "@/lib/supabase/server";
import BranchManager from "@/components/BranchManager";
import type { Branch } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  const supabase = createClient();
  const { data: branches } = await supabase
    .from("branches")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Chi nhánh</h1>
      <BranchManager initial={(branches as Branch[]) ?? []} />
    </div>
  );
}
