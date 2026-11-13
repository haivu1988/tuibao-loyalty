"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Gift } from "@/types";

type Draft = {
  name: string;
  description: string;
  tick_cost: string;
  stock: string;
  image_url: string;
};
const emptyDraft: Draft = {
  name: "",
  description: "",
  tick_cost: "5",
  stock: "50",
  image_url: "",
};

export default function GiftManager({ initial }: { initial: Gift[] }) {
  const supabase = createClient();
  const [gifts, setGifts] = useState<Gift[]>(initial);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Gift | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Gift | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sortGifts = (l: Gift[]) => [...l].sort((a, b) => a.tick_cost - b.tick_cost);

  // ---- Upload ảnh lên Supabase Storage (bucket "gifts") ----
  async function uploadImage(file: File): Promise<string | null> {
    setError(null);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("gifts").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      setError("Tải ảnh thất bại: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("gifts").getPublicUrl(path);
    return data.publicUrl;
  }

  async function addGift(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cost = parseInt(draft.tick_cost, 10);
    const stk = parseInt(draft.stock, 10);
    if (!draft.name.trim() || !cost || cost < 1) {
      return setError("Nhập tên quà và số tick hợp lệ.");
    }
    setAdding(true);
    const { data, error } = await supabase
      .from("gifts")
      .insert({
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        tick_cost: cost,
        stock: isNaN(stk) ? 0 : stk,
        image_url: draft.image_url.trim() || null,
      })
      .select()
      .single();
    setAdding(false);
    if (error) return setError(error.message);
    setGifts((p) => sortGifts([...p, data as Gift]));
    setDraft(emptyDraft);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!editing.name.trim() || editing.tick_cost < 1) {
      return setError("Nhập tên quà và số tick hợp lệ.");
    }
    setBusyId(editing.id);
    const { data, error } = await supabase
      .from("gifts")
      .update({
        name: editing.name.trim(),
        description: editing.description?.trim() || null,
        tick_cost: editing.tick_cost,
        stock: editing.stock,
        image_url: editing.image_url?.trim() || null,
      })
      .eq("id", editing.id)
      .select()
      .single();
    setBusyId(null);
    if (error) return setError(error.message);
    setGifts((p) => sortGifts(p.map((g) => (g.id === editing.id ? (data as Gift) : g))));
    setEditing(null);
  }

  async function updateStock(g: Gift, delta: number) {
    const next = Math.max(g.stock + delta, 0);
    const { data, error } = await supabase
      .from("gifts")
      .update({ stock: next })
      .eq("id", g.id)
      .select()
      .single();
    if (!error && data)
      setGifts((p) => p.map((x) => (x.id === g.id ? (data as Gift) : x)));
  }

  async function toggleActive(g: Gift) {
    const { data, error } = await supabase
      .from("gifts")
      .update({ active: !g.active })
      .eq("id", g.id)
      .select()
      .single();
    if (!error && data)
      setGifts((p) => p.map((x) => (x.id === g.id ? (data as Gift) : x)));
  }

  async function doDelete(g: Gift) {
    setBusyId(g.id);
    const { error } = await supabase.from("gifts").delete().eq("id", g.id);
    setBusyId(null);
    setConfirmDelete(null);
    if (error) return setError(error.message);
    setGifts((p) => p.filter((x) => x.id !== g.id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Form thêm */}
      <form onSubmit={addGift} className="card space-y-4 lg:col-span-2">
        <h2 className="text-sm font-black text-brand-800">🎁 Thêm quà</h2>

        <ImagePicker
          value={draft.image_url}
          onChange={(url) => setDraft({ ...draft, image_url: url })}
          onPickFile={uploadImage}
        />

        <div>
          <label className="label">Tên quà</label>
          <input
            className="input"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Mô tả</label>
          <input
            className="input"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tick cần</label>
            <input
              inputMode="numeric"
              className="input"
              value={draft.tick_cost}
              onChange={(e) =>
                setDraft({ ...draft, tick_cost: e.target.value.replace(/\D/g, "") })
              }
            />
          </div>
          <div>
            <label className="label">Tồn kho</label>
            <input
              inputMode="numeric"
              className="input"
              value={draft.stock}
              onChange={(e) =>
                setDraft({ ...draft, stock: e.target.value.replace(/\D/g, "") })
              }
            />
          </div>
        </div>
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={adding}>
          {adding ? "Đang lưu…" : "Thêm quà"}
        </button>
      </form>

      {/* Danh sách */}
      <div className="card lg:col-span-3">
        <h2 className="mb-3 text-sm font-black text-brand-800">
          🧋 Danh sách quà ({gifts.length})
        </h2>
        <ul className="space-y-3">
          {gifts.map((g) => (
            <li
              key={g.id}
              className={`rounded-2xl border-2 p-3 ${
                g.active ? "border-brand-100" : "border-slate-200 bg-slate-50 opacity-80"
              }`}
            >
              <div className="flex gap-3">
                <Thumb url={g.image_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-slate-800">{g.name}</p>
                    {!g.active && (
                      <span className="chip bg-slate-200 text-slate-600">Ẩn</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {g.description || "—"}
                  </p>
                  <p className="mt-0.5 text-xs font-black text-carrot-600">
                    {g.tick_cost} tick
                  </p>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">Tồn:</span>
                <button
                  onClick={() => updateStock(g, -1)}
                  className="btn-secondary h-7 w-7 px-0 text-xs"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-bold text-slate-800">
                  {g.stock}
                </span>
                <button
                  onClick={() => updateStock(g, 1)}
                  className="btn-secondary h-7 w-7 px-0 text-xs"
                >
                  +
                </button>
                <button
                  onClick={() => updateStock(g, 10)}
                  className="btn-secondary h-7 px-2 text-xs"
                >
                  +10
                </button>

                <span className="mx-1 h-4 w-px bg-slate-200" />

                <button
                  className="btn-secondary h-7 px-2 text-xs"
                  onClick={() => setEditing(g)}
                >
                  ✏️ Sửa
                </button>
                <button
                  className="btn-ghost h-7 px-2 text-xs"
                  onClick={() => toggleActive(g)}
                >
                  {g.active ? "Ẩn" : "Hiện"}
                </button>
                <button
                  className="btn-ghost h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => setConfirmDelete(g)}
                >
                  🗑 Xóa
                </button>
              </div>
            </li>
          ))}
          {gifts.length === 0 && (
            <li className="py-4 text-center text-sm text-slate-400">
              Chưa có quà nào.
            </li>
          )}
        </ul>
      </div>

      {/* Modal sửa */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title="Sửa quà">
          <form onSubmit={saveEdit} className="space-y-4">
            <ImagePicker
              value={editing.image_url ?? ""}
              onChange={(url) => setEditing({ ...editing, image_url: url })}
              onPickFile={uploadImage}
            />
            <div>
              <label className="label">Tên quà</label>
              <input
                className="input"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Mô tả</label>
              <input
                className="input"
                value={editing.description ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tick cần</label>
                <input
                  inputMode="numeric"
                  className="input"
                  value={String(editing.tick_cost)}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      tick_cost: parseInt(e.target.value.replace(/\D/g, ""), 10) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Tồn kho</label>
                <input
                  inputMode="numeric"
                  className="input"
                  value={String(editing.stock)}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      stock: parseInt(e.target.value.replace(/\D/g, ""), 10) || 0,
                    })
                  }
                />
              </div>
            </div>
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
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
        <Modal onClose={() => setConfirmDelete(null)} title="Xóa quà">
          <p className="text-sm text-slate-600">
            Xóa quà <b>{confirmDelete.name}</b>? Lịch sử đổi quà cũ vẫn được giữ
            lại.
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

/* ---------- Ảnh quà: upload file hoặc dán URL ---------- */
function ImagePicker({
  value,
  onChange,
  onPickFile,
}: {
  value: string;
  onChange: (url: string) => void;
  onPickFile: (file: File) => Promise<string | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await onPickFile(file);
    setUploading(false);
    if (url) onChange(url);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="label">Hình ảnh quà</label>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-brand-100">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl">🎁</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary h-8 px-3 text-xs"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Đang tải…" : "📷 Tải ảnh"}
            </button>
            {value && (
              <button
                type="button"
                className="btn-ghost h-8 px-3 text-xs text-red-600"
                onClick={() => onChange("")}
              >
                Xóa ảnh
              </button>
            )}
          </div>
          <input
            className="input !py-1.5 text-xs"
            placeholder="hoặc dán link ảnh https://…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

function Thumb({ url }: { url?: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-black/5"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">
      🎁
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
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-lg font-black text-brand-800">{title}</h3>
        {children}
      </div>
    </div>
  );
}
