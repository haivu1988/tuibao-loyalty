'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Reward } from '@/types'
import { Plus } from 'lucide-react'

export default function RewardManager({ initialRewards }: { initialRewards: Reward[] }) {
  const [rewards, setRewards] = useState(initialRewards)
  const [name, setName] = useState('')
  const [points, setPoints] = useState('')
  const [stock, setStock] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingStock, setEditingStock] = useState<string | null>(null)
  const [newStock, setNewStock] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('rewards')
      .insert({
        name: name.trim(),
        points_required: Number(points),
        stock_quantity: Number(stock),
        sort_order: rewards.length + 1,
      })
      .select()
      .single()

    setLoading(false)
    if (data) {
      setRewards((prev) => [...prev, data])
      setName(''); setPoints(''); setStock('')
    } else {
      alert('Lỗi: ' + error?.message)
    }
  }

  async function updateStock(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('rewards')
      .update({ stock_quantity: Number(newStock) })
      .eq('id', id)

    if (!error) {
      setRewards((prev) =>
        prev.map((r) => (r.id === id ? { ...r, stock_quantity: Number(newStock) } : r))
      )
      setEditingStock(null)
    } else {
      alert('Lỗi: ' + error.message)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient()
    const { error } = await supabase
      .from('rewards')
      .update({ is_active: !current })
      .eq('id', id)

    if (!error) {
      setRewards((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: !current } : r))
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Danh sách quà */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Danh sách quà tặng</h2>
        <div className="space-y-3">
          {rewards.map((r) => (
            <div key={r.id} className={`border rounded-xl p-3 ${r.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium text-sm">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.points_required} tick để đổi</div>
                </div>
                <button
                  onClick={() => toggleActive(r.id, r.is_active)}
                  className={`text-xs px-2 py-1 rounded-lg font-medium ${
                    r.is_active ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {r.is_active ? 'Bật' : 'Tắt'}
                </button>
              </div>

              {/* Tồn kho */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">Tồn kho:</span>
                {editingStock === r.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm"
                      min="0"
                      autoFocus
                    />
                    <button
                      onClick={() => updateStock(r.id)}
                      className="bg-green-600 text-white px-2 py-1 rounded-lg text-xs"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingStock(null)}
                      className="text-gray-400 px-2 py-1 rounded-lg text-xs"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingStock(r.id); setNewStock(String(r.stock_quantity)) }}
                    className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      r.stock_quantity === 0
                        ? 'bg-red-100 text-red-600'
                        : r.stock_quantity <= 5
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {r.stock_quantity} ✏️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thêm quà mới */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Plus size={18} /> Thêm quà tặng mới
        </h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="label">Tên quà *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="input-field" placeholder="Ly trà sữa size L" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Số tick cần *</label>
              <input type="number" value={points} onChange={(e) => setPoints(e.target.value)}
                className="input-field" placeholder="10" min="1" required inputMode="numeric" />
            </div>
            <div>
              <label className="label">Tồn kho ban đầu *</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)}
                className="input-field" placeholder="20" min="0" required inputMode="numeric" />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang thêm...' : 'Thêm quà tặng'}
          </button>
        </form>
      </div>
    </div>
  )
}
