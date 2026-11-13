import StoreQR from "@/components/StoreQR";

export const dynamic = "force-dynamic";

export default function AdminQRPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mã QR tích điểm</h1>
        <p className="text-sm text-slate-500">
          In mã này dán tại quầy. Khách quét → nhập số điện thoại → xem số tick
          &amp; quà sắp đạt.
        </p>
      </div>
      <StoreQR />
    </div>
  );
}
