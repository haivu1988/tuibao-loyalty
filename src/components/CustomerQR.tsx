"use client";

import { QRCodeSVG } from "qrcode.react";

// Hiển thị mã QR trỏ tới trang /check/[phone] để khách tự quét xem tick.
export default function CustomerQR({ phone }: { phone: string }) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const url = `${base}/check/${encodeURIComponent(phone)}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
        <QRCodeSVG value={url} size={148} level="M" />
      </div>
      <p className="text-xs text-slate-400">Khách quét để xem tick</p>
    </div>
  );
}
