"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Branch } from "@/types";

export default function CreateStaffForm({ branches }: { branches: Branch[] }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);

    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        login_id: loginId,
        password,
        role,
        branch_id: branchId || null,
      }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Tạo tài khoản thất bại.");
      return;
    }

    setOk(`Đã tạo tài khoản cho ${fullName} (ID: ${loginId}).`);
    setFullName("");
    setLoginId("");
    setPassword("");
    setRole("staff");
    setBranchId("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-sm font-bold text-slate-900">Tạo tài khoản mới</h2>

      <div>
        <label className="label">Họ tên</label>
        <input
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label">ID đăng nhập</label>
        <input
          type="text"
          autoCapitalize="none"
          className="input"
          placeholder="vd: nv001"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          required
        />
        <p className="mt-1 text-xs text-slate-400">
          Nhân viên dùng ID này để đăng nhập (không cần email).
        </p>
      </div>

      <div>
        <label className="label">Mật khẩu tạm (tối thiểu 6 ký tự)</label>
        <input
          type="text"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Vai trò</label>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as "staff" | "admin")}
          >
            <option value="staff">Nhân viên</option>
            <option value="admin">Quản lý</option>
          </select>
        </div>
        <div>
          <label className="label">Chi nhánh</label>
          <select
            className="input"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">— Không gán —</option>
            {branches
              .filter((b) => b.active)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {ok}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Đang tạo…" : "Tạo tài khoản"}
      </button>
    </form>
  );
}
