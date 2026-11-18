'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Profile, Branch } from '@/types'

interface Props {
  initialStaff: (Profile & { branch?: { name: string } | null })[]
  branches: Pick<Branch, 'id' | 'name'>[]
}

export default function StaffManager({ initialStaff, branches }: Props) {
  const [staff, setStaff] = useState(initialStaff)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [branchId, setBranchId] = useState('')
  const [role, setRole] = useState<'staff' | 'admin'>('staff')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, password, full_name: fullName, branch_id: branchId || null, role,
      }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error ?? 'Lỗi không xác định')
      return
    }

    setSuccess(`Đã tạo tài khoản ${fullName} thành công!`)
    setStaff((prev) => [...prev, json.profile])
    setFullName(''); setEmail(''); setPassword(''); setBranchId(''); setRole('staff')
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch('/api/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    if (res.ok) {
      setStaff((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s))
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Danh sách nhân viên */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Danh sách ({staff.length})</h2>
        <div className="space-y-3">
          {staff.map((s) => (
            <div key={s.id} className={`flex items-start justify-between gap-2 border-b border-gray-100 pb-3 last:border-0 ${!s.is_active ? 'opacity-50' : ''}`}>
              <div>
                <div className="font-medium text-sm">{s.full_name}</div>
                <div className="text-xs text-gray-400">
                  {s.role === 'admin' ? '👑 Quản lý' : '👤 Nhân viên'}
                  {s.branch && ` · ${s.branch.name}`}
                </div>
              </div>
              <button
                onClick={() => toggleActive(s.id, s.is_active)}
                className={`text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 ${
                  s.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s.is_active ? 'Đang hoạt động' : 'Đã vô hiệu'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tạo tài khoản mới */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Plus size={18} /> Tạo tài khoản mới
        </h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Họ và tên *</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="input-field" placeholder="Nguyễn Thị B" required />
          </div>
          <div>
            <label className="label">Email đăng nhập *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-field" placeholder="b.nguyen@tuibao.vn" required />
          </div>
          <div>
            <label className="label">Mật khẩu *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="input-field" placeholder="Tối thiểu 6 ký tự" minLength={6} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Chi nhánh</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="input-field">
                <option value="">-- Chọn --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Vai trò</label>
              <select value={role} onChange={(e) => setRole(e.target.value as 'staff' | 'admin')} className="input-field">
                <option value="staff">Nhân viên</option>
                <option value="admin">Quản lý</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{success}</div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>
      </div>
    </div>
  )
}
