"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

// Mã QR cố định cho quán: khách quét -> mở /check để tự nhập SĐT xem tick.
export default function StoreQR() {
  const [origin, setOrigin] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    setOrigin(base.replace(/\/$/, ""));
  }, []);

  const url = origin ? `${origin}/check` : "";

  function download() {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "tuibao-qr-tich-diem.png";
    a.click();
  }

  return (
    <div className="mx-auto max-w-md">
      <div
        ref={wrapRef}
        className="qr-print card flex flex-col items-center gap-3 text-center"
      >
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tuibao-logo.png" alt="TUIBAO" className="h-12 w-auto" />
        </div>
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

      <div className="no-print mt-4 flex justify-center gap-2">
        <button onClick={download} className="btn-primary">
          ⬇️ Tải ảnh QR (PNG)
        </button>
        <button onClick={() => window.print()} className="btn-secondary">
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
