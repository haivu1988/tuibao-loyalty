export type Role = 'admin' | 'staff'

export interface Branch {
  id: string
  name: string
  address: string | null
  is_active: boolean
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: Role
  branch_id: string | null
  is_active: boolean
  created_at: string
  branch?: Branch
}

export interface Customer {
  id: string
  phone: string
  full_name: string | null
  total_points: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  invoice_code: string
  customer_id: string
  amount: number
  points_earned: number
  staff_id: string
  branch_id: string
  invoice_date: string
  created_at: string
  profile?: Pick<Profile, 'full_name'>
  branch?: Pick<Branch, 'name'>
  customer?: Pick<Customer, 'phone' | 'full_name'>
}

/** View customer_stats — chỉ quản lý xem */
export interface CustomerStats {
  id: string
  phone: string
  full_name: string | null
  total_points: number
  created_at: string
  total_spent: number
  total_points_earned: number
  transaction_count: number
  last_transaction_at: string | null
  total_points_used: number
  redemption_count: number
}

export interface Reward {
  id: string
  name: string
  points_required: number
  stock_quantity: number
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Redemption {
  id: string
  customer_id: string
  reward_id: string
  points_used: number
  staff_id: string
  branch_id: string
  created_at: string
  reward?: Pick<Reward, 'name'>
  profile?: Pick<Profile, 'full_name'>
}

// Milestone gần nhất chưa đạt
export interface NearMilestone {
  reward: Reward
  diff: number // số tick còn thiếu
}
