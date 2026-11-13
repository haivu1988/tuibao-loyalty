// Quy đổi tick: 20.000đ = 1 tick (phải khớp v_rate trong migration 004)
export const TICK_RATE = 20000;

export function ticksFromAmount(amount: number): number {
  return Math.floor(Math.max(amount || 0, 0) / TICK_RATE);
}

// Định dạng tiền VND
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// Chuẩn hoá số điện thoại: chỉ giữ chữ số
export function normalizePhone(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

// Kiểm tra SĐT hợp lệ (tối thiểu 8 chữ số)
export function isValidPhone(phone: string): boolean {
  return normalizePhone(phone).length >= 8;
}

// Đăng nhập bằng ID: Supabase Auth cần email, nên ta map ID -> email nội bộ.
// Nếu người dùng vẫn nhập dạng email (có @) thì giữ nguyên để tương thích.
export const LOGIN_DOMAIN = "tuibao.local";

export function loginIdToEmail(input: string): string {
  const v = (input || "").trim().toLowerCase();
  if (!v) return v;
  if (v.includes("@")) return v;
  return `${v.replace(/\s+/g, "")}@${LOGIN_DOMAIN}`;
}

// Định dạng ngày giờ VN
export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
