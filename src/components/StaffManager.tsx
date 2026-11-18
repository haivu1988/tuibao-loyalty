"use client";

import { useState } from "react";
import type { Branch, Profile } from "@/types";

export default function StaffManager({
  initial,
  branches,
  currentUserId,
}: {
  initial: Profile[];
  branches: Branch[];
  currentUserId: string;
}) {
  const [staff, setStaff] = useState<Profile[]>(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [confirmDel, setConfirmDel] = useState<Profile | null>(null);
  const [confirmReset, setConfirmReset] = useState<Profile | null>(null);

  const branchName = (id: string | null) =>
    id ? branches.find((b) => b.id === id)?.name ?? "—" : "—";

  async function changeBranch(p: Profile, branchId: string) {
    setBusyId(p.id);
    setMsg(null);
    const res = await fetch(`/api/staff/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_branch", branch_id: branchId || null }),
    });
    const json = await res.json();
    setBusyId(null);
    if (!res.ok) return setMsg({ text: json.error || "Đổi chi nhánh thất bại", ok: false });
    setStaff((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, branch_id: branchId || null } : x))
    );
    setMsg({ text: `Đã đổi chi nhánh cho ${p.full_name}`, ok: true });
  }

  async function resetPassword(p: Profile) {
    setBusyId(p.id);
    setMsg(null);
    const res = await fetch(`/api/staff/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_password" }),
    });
    const json = await res.json();
    setBusyId(null);
    setConfirmReset(null);
    if (!res.ok) return setMsg({ text: json.error || "Reset mật khẩu thất bại", ok: false });
    setMsg({ text: `Đã reset mật khẩu của ${p.full_name} về: ${json.password}`, ok: true });
  }

  async function doDelete(p: Profile) {
    setBusyId(p.id);
    setMsg(null);
    const res = await fetch(`/api/staff/${p.id}`, { method: "DELETE" });
    const json = await res.json();
    setBusyId(null);
    setConfirmDel(null);
    if (!res.ok) return setMsg({ text: json.error || "Xoá thất bại", ok: false });
    setStaff((prev) => prev.filter((x) => x.id !== p.id));
    setMsg({ text: `Đã xoá ${p.full_name}`, ok: true });
  }

  return (
    <div className="card">
      <h2 className="mb-3 text-sm font-black text-brand-800">
        👥 Danh sách ({staff.length})
      </h2>

      {msg && (
        <p
          className={`mb-3 rounded-xl px-3 py-2 text-sm ${
            msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {msg.text}
        </p>
      )}

      <ul className="space-y-3">
        {staff.map((p) => {
          const isSelf = p.id === currentUserId;
          return (
            <li key={p.id} className="rounded-2xl border-2 border-brand-100 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-slate-800">{p.full_name}</p>
                    <span
                      className={`chip ${
                        p.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.role === "admin" ? "Quản lý" : "Nhân viên"}
                    </span>
                    {isSelf && (
                      <span className="chip bg-sun-100 text-sun-800">Bạn</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Chi nhánh: {branchName(p.branch_id)}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/* Đổi chi nhánh */}
                <select
                  className="input h-8 max-w-[11rem] !py-0 text-xs"
                  value={p.branch_id ?? ""}
                  disabled={busyId === p.id}
                  onChange={(e) => changeBranch(p, e.target.value)}
                >
                  <option value="">— Không gán —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {!b.active ? " (tạm dừng)" : ""}
                    </option>
                  ))}
                </select>

                {/* Reset mật khẩu */}
                <button
                  className="btn-secondary h-8 px-3 text-xs"
                  onClick={() => setConfirmReset(p)}
                  disabled={busyId === p.id}
                >
                  🔑 Reset mật khẩu
                </button>

                {/* Xoá */}
                <button
                  className="btn-ghost h-8 px-3 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                  onClick={() => setConfirmDel(p)}
                  disabled={busyId === p.id || isSelf}
                  title={isSelf ? "Không thể tự xoá chính mình" : "Xoá nhân viên"}
                >
                  🗑 Xoá
                </button>
              </div>
            </li>
          );
        })}
        {staff.length === 0 && (
          <li className="py-4 text-center text-sm text-slate-400">
            Chưa có nhân viên.
          </li>
        )}
      </ul>

      {/* Modal reset mật khẩu */}
      {confirmReset && (
        <Modal onClose={() => setConfirmReset(null)} title="Reset mật khẩu">
          <p className="text-sm text-slate-600">
            Đặt lại mật khẩu của <b>{confirmReset.full_name}</b> về{" "}
            <b className="font-mono">12345678</b>? Hãy nhắc nhân viên đổi lại sau
            khi đăng nhập.
          </p>
          <div className="mt-5 flex gap-2">
            <button className="btn-secondary flex-1" onClick={() => setConfirmReset(null)}>
              Huỷ
            </button>
            <button
              className="btn-primary flex-1"
              onClick={() => resetPassword(confirmReset)}
              disabled={busyId === confirmReset.id}
            >
              {busyId === confirmReset.id ? "Đang reset…" : "Reset về 12345678"}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal xoá */}
      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)} title="Xoá nhân viên">
          <p className="text-sm text-slate-600">
            Xoá tài khoản <b>{confirmDel.full_name}</b>? Không thể hoàn tác. Lịch
            sử giao dịch cũ vẫn được giữ lại (bỏ gán người thực hiện).
          </p>
          <div className="mt-5 flex gap-2">
            <button className="btn-secondary flex-1" onClick={() => setConfirmDel(null)}>
              Huỷ
            </button>
            <button
              className="btn-danger flex-1"
              onClick={() => doDelete(confirmDel)}
              disabled={busyId === confirmDel.id}
            >
              {busyId === confirmDel.id ? "Đang xoá…" : "Xoá"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[1.75rem] bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-lg font-black text-brand-800">{title}</h3>
        {children}
      </div>
    </div>
  );
}
