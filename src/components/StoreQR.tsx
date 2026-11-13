"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

// Mã QR cố định cho quán: khách quét -> mở /check để tự nhập SĐT xem tick.
// Base URL có thể chỉnh để chắc chắn trỏ về domain công khai (Vercel), không phải localhost.
export default function StoreQR() {
  const [base, setBase] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const envUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    // Ưu tiên domain công khai; tránh để mặc định là localhost nếu có thể
    const isLocal = (u: string) => /localhost|127\.0\.0\.1/.test(u);
    const preferred =
      envUrl && !isLocal(envUrl) ? envUrl : !isLocal(origin) ? origin : envUrl || origin;
    setBase(preferred);
  }, []);

  const cleanBase = base.replace(/\/$/, "");
  const url = cleanBase ? `${cleanBase}/check` : "";
  const localWarn = /localhost|127\.0\.0\.1/.test(cleanBase);

  function download() {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "tuibao-qr-tich-diem.png";
    a.click();
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* Ô chỉnh domain */}
      <div className="no-print card">
        <label className="label">Địa chỉ web công khai của quán</label>
        <input
          className="input"
          value={base}
          onChange={(e) => setBase(e.target.value)}
          placeholder="https://tuibao-loyalty.vercel.app"
        />
        <p className="mt-1.5 text-xs text-slate-400">
          Khách sẽ quét vào <b>{url || "…"}</b>
        </p>
        {localWarn && (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
            ⚠️ Đang là địa chỉ <b>localhost</b> — chỉ mở được trên máy này. Hãy
            dán domain Vercel (vd: https://tuibao-loyalty.vercel.app) để khách
            quét được bằng điện thoại.
          </p>
        )}
      </div>

      {/* Khung QR để in/tải */}
      <div
        ref={wrapRef}
        className="qr-print card flex flex-col items-center gap-3 text-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tuibao-logo.png" alt="TUIBAO" className="h-12 w-auto" />
        <h2 className="text-xl font-black text-brand-700">
          Quét để xem tick của bạn 🧋
        </h2>
        <p className="-mt-1 text-sm text-slate-500">
          Tích đủ tick – đổi quà liền tay!
        </p>

        <div className="rounded-2xl bg-white p-4 ring-2 ring-brand-100">
          {url ? (
            <QRCodeCanvas value={url} size={240} level="M" includeMargin />
          ) : (
            <div className="h-[240px] w-[240px] animate-pulse rounded bg-slate-100" />
          )}
        </div>

        <p className="break-all text-xs text-slate-400">{url}</p>
      </div>

      <div className="no-print flex justify-center gap-2">
        <button
          onClick={download}
          className="btn-primary"
          disabled={!url || localWarn}
        >
          ⬇️ Tải ảnh QR (PNG)
        </button>
        <button
          onClick={() => window.print()}
          className="btn-secondary"
          disabled={!url || localWarn}
        >
          🖨 In
        </button>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .qr-print,
          .qr-print * {
            visibility: visible;
          }
          .qr-print {
            position: fixed;
            inset: 0;
            margin: auto;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
