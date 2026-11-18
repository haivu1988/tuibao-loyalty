"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Branch } from "@/types";

type Draft = { name: string; address: string; phone: string };
const empty: Draft = { name: "", address: "", phone: "" };

export default function BranchManager({ initial }: { initial: Branch[] }) {
  const supabase = createClient();
  const [branches, setBranches] = useState<Branch[]>(initial);

  const [draft, setDraft] = useState<Draft>(empty);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Branch | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Branch | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function sortIn(list: Branch[]) {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }

  async function addBranch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!draft.name.trim()) return;
    setAdding(true);
    const { data, error } = await supabase
      .from("branches")
      .insert({
        name: draft.name.trim(),
        address: draft.address.trim() || null,
        phone: draft.phone.trim() || null,
      })
      .select()
      .single();
    setAdding(false);
    if (error) return setError(error.message);
    setBranches((p) => sortIn([...p, data as Branch]));
    setDraft(empty);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusyId(editing.id);
    const { data, error } = await supabase
      .from("branches")
      .update({
        name: editing.name.trim(),
        address: editing.address?.trim() || null,
        phone: editing.phone?.trim() || null,
      })
      .eq("id", editing.id)
      .select()
      .single();
    setBusyId(null);
    if (error) return setError(error.message);
    setBranches((p) =>
      sortIn(p.map((b) => (b.id === editing.id ? (data as Branch) : b)))
    );
    setEditing(null);
  }

  async function togglePause(b: Branch) {
    setBusyId(b.id);
    const { data, error } = await supabase
      .from("branches")
      .update({ active: !b.active })
      .eq("id", b.id)
      .select()
      .single();
    setBusyId(null);
    if (!error && data)
      setBranches((p) => p.map((x) => (x.id === b.id ? (data as Branch) : x)));
  }

  async function doDelete(b: Branch) {
    setBusyId(b.id);
    const { error } = await supabase.from("branches").delete().eq("id", b.id);
    setBusyId(null);
    setConfirmDelete(null);
    if (error) return setError(error.message);
    setBranches((p) => p.filter((x) => x.id !== b.id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Form thêm */}
      <form onSubmit={addBranch} className="card space-y-4 lg:col-span-2">
        <h2 className="text-sm font-black text-brand-800">➕ Thêm chi nhánh</h2>
        <div>
          <label className="label">Tên chi nhánh</label>
          <input
            className="input"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Địa chỉ</label>
          <input
            className="input"
            value={draft.address}
            onChange={(e) => setDraft({ ...draft, address: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Số điện thoại</label>
          <input
            className="input"
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
          />
        </div>
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={adding}>
          {adding ? "Đang lưu…" : "Thêm chi nhánh"}
        </button>
      </form>

      {/* Danh sách */}
      <div className="card lg:col-span-3">
        <h2 className="mb-3 text-sm font-black text-brand-800">
          🏪 Danh sách ({branches.length})
        </h2>
        <ul className="space-y-3">
          {branches.map((b) => (
            <li
              key={b.id}
              className={`rounded-2xl border-2 px-4 py-3 ${
                b.active
                  ? "border-brand-100"
                  : "border-slate-200 bg-slate-50 opacity-80"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-slate-800">{b.name}</p>
                    {!b.active && (
                      <span className="chip bg-slate-200 text-slate-600">
                        Tạm dừng
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {b.address || "—"}
                    {b.phone && <span> · {b.phone}</span>}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className="btn-secondary h-8 px-3 text-xs"
                  onClick={() => setEditing(b)}
                  disabled={busyId === b.id}
                >
                  ✏️ Sửa
                </button>
                <button
                  className="btn-ghost h-8 px-3 text-xs"
                  onClick={() => togglePause(b)}
                  disabled={busyId === b.id}
                >
                  {b.active ? "⏸ Tạm dừng" : "▶️ Mở lại"}
                </button>
                <button
                  className="btn-ghost h-8 px-3 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => setConfirmDelete(b)}
                  disabled={busyId === b.id}
                >
                  🗑 Xóa
                </button>
              </div>
            </li>
          ))}
          {branches.length === 0 && (
            <li className="py-4 text-center text-sm text-slate-400">
              Chưa có chi nhánh.
            </li>
          )}
        </ul>
      </div>

      {/* Modal sửa */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title="Sửa chi nhánh">
          <form onSubmit={saveEdit} className="space-y-4">
            <div>
              <label className="label">Tên chi nhánh</label>
              <input
                className="input"
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Địa chỉ</label>
              <input
                className="input"
                value={editing.address ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, address: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Số điện thoại</label>
              <input
                className="input"
                value={editing.phone ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, phone: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => setEditing(null)}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={busyId === editing.id}
              >
                {busyId === editing.id ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal xóa */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)} title="Xóa chi nhánh">
          <p className="text-sm text-slate-600">
            Xóa chi nhánh <b>{confirmDelete.name}</b>? Nhân viên &amp; giao dịch
            cũ sẽ được giữ lại nhưng bỏ gán chi nhánh này.
          </p>
          <div className="mt-5 flex gap-2">
            <button
              className="btn-secondary flex-1"
              onClick={() => setConfirmDelete(null)}
            >
              Hủy
            </button>
            <button
              className="btn-danger flex-1"
              onClick={() => doDelete(confirmDelete)}
              disabled={busyId === confirmDelete.id}
            >
              {busyId === confirmDelete.id ? "Đang xóa…" : "Xóa"}
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
