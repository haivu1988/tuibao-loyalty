'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types'
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react'

export default function BranchManager({ initialBranches }: { initialBranches: Branch[] }) {
  const [branches, setBranches] = useState(initialBranches)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('branches')
      .insert({ name: name.trim(), address: address.trim() || null })
      .select()
      .single()

    setLoading(false)
    if (data) {
      setBranches((prev) => [...prev, data])
      setName('')
      setAddress('')
    } else {
      alert('Lỗi: ' + error?.message)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient()
    const { error } = await supabase
      .from('branches')
      .update({ is_active: !current })
      .eq('id', id)

    if (!error) {
      setBranches((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_active: !current } : b))
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Danh sách */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Danh sách chi nhánh</h2>
        {branches.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có chi nhánh</p>
        ) : (
          <div className="space-y-3">
            {branches.map((b) => (
              <div key={b.id} className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-sm">{b.name}</div>
                  {b.address && <div className="text-xs text-gray-400">{b.address}</div>}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                      b.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {b.is_active ? 'Đang hoạt động' : 'Đã tắt'}
                  </span>
                </div>
                <button
                  onClick={() => toggleActive(b.id, b.is_active)}
                  className="text-gray-400 hover:text-green-600 mt-1 flex-shrink-0"
                  title={b.is_active ? 'Tắt chi nhánh' : 'Bật chi nhánh'}
                >
                  {b.is_active ? <ToggleRight size={24} className="text-green-600" /> : <ToggleLeft size={24} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Thêm chi nhánh */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Plus size={18} /> Thêm chi nhánh mới
        </h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="label">Tên chi nhánh *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="TUIBAO Quận 1"
              required
            />
          </div>
          <div>
            <label className="label">Địa chỉ</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field"
              placeholder="123 Nguyễn Trãi, Quận 1"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang thêm...' : 'Thêm chi nhánh'}
          </button>
        </form>
      </div>
    </div>
  )
}
