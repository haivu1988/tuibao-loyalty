export type Role = "staff" | "admin";

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  branch_id: string | null;
  active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  phone: string;
  full_name: string | null;
  ticks: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Gift {
  id: string;
  name: string;
  description: string | null;
  tick_cost: number;
  stock: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  customer_id: string;
  staff_id: string | null;
  branch_id: string | null;
  invoice_number: string | null;
  amount: number;
  ticks_earned: number;
  created_at: string;
}

export interface Redemption {
  id: string;
  customer_id: string;
  staff_id: string | null;
  gift_id: string | null;
  gift_name: string | null;
  ticks_spent: number;
  created_at: string;
}

// Kết quả từ RPC customer_check (trang QR công khai)
export interface CustomerCheckGift {
  id: string;
  name: string;
  tick_cost: number;
  image_url: string | null;
  in_stock: boolean;
  reached: boolean;
  ticks_needed: number;
}

export interface CustomerCheckResult {
  found: boolean;
  full_name?: string | null;
  phone?: string;
  ticks?: number;
  gifts?: CustomerCheckGift[];
}

// ── Bổ sung cho giao diện mới ────────────────────────────────

/** Giao dịch kèm thông tin join (dùng ở trang quản lý) */
export interface TransactionWithRefs extends Transaction {
  invoice_date?: string | null;
  customer?: Pick<Customer, "phone" | "full_name"> | null;
  staff?: Pick<Profile, "full_name"> | null;
  branch?: Pick<Branch, "name"> | null;
}

/** Lượt đổi quà kèm thông tin join */
export interface RedemptionWithRefs extends Redemption {
  customer?: Pick<Customer, "phone" | "full_name"> | null;
  staff?: Pick<Profile, "full_name"> | null;
}

/** View customer_stats — chỉ quản lý xem được */
export interface CustomerStats {
  id: string;
  phone: string;
  full_name: string | null;
  ticks: number;
  total_spent: number;
  created_at: string;
  ticks_earned: number;
  transaction_count: number;
  last_transaction_at: string | null;
  ticks_spent: number;
  redemption_count: number;
}

/** Khách đã tích trong ngày — hiển thị ở màn hình nhân viên */
export interface TodayEntry {
  customer: Customer;
  lastAmount: number;
  lastTicks: number;
  lastTime: string;
  txCount: number;
}
