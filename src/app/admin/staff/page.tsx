import { createClient } from "@/lib/supabase/server";
import CreateStaffForm from "@/components/CreateStaffForm";
import type { Branch } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const supabase = createClient();

  const [{ data: profiles }, { data: branches }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, branch_id, active, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("branches").select("*").order("name"),
  ]);

  const branchMap = new Map((branches ?? []).map((b: Branch) => [b.id, b.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Nhân viên</h1>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <CreateStaffForm branches={(branches as Branch[]) ?? []} />
        </div>

        <div className="lg:col-span-3">
          <div className="card">
            <h2 className="mb-3 text-sm font-bold text-slate-900">
              Danh sách ({profiles?.length ?? 0})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="pb-2 font-medium">Họ tên</th>
                    <th className="pb-2 font-medium">Vai trò</th>
                    <th className="pb-2 font-medium">Chi nhánh</th>
                    <th className="pb-2 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(profiles ?? []).map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 font-medium text-slate-800">
                        {p.full_name}
                      </td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            p.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {p.role === "admin" ? "Quản lý" : "Nhân viên"}
                        </span>
                      </td>
                      <td className="py-2 text-slate-600">
                        {p.branch_id ? branchMap.get(p.branch_id) || "—" : "—"}
                      </td>
                      <td className="py-2">
                        {p.active ? (
                          <span className="text-emerald-600">Hoạt động</span>
                        ) : (
                          <span className="text-slate-400">Khoá</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!profiles || profiles.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        Chưa có nhân viên.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
