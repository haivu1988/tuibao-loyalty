'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Settings } from 'lucide-react'
import Link from 'next/link'

interface StaffNavProps {
  name: string
  role: string
  branch: string | null
}

export default function StaffNav({ name, role, branch }: StaffNavProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-green-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
      <div>
        <div className="font-black text-lg leading-none">TUIBAO</div>
        {branch && <div className="text-green-200 text-xs">{branch}</div>}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium leading-none">{name}</div>
          <div className="text-green-200 text-xs mt-0.5">
            {role === 'admin' ? 'Quản lý' : 'Nhân viên'}
          </div>
        </div>

        {role === 'admin' && (
          <Link href="/admin" className="p-1.5 hover:bg-green-600 rounded-lg transition-colors">
            <Settings size={18} />
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="p-1.5 hover:bg-green-600 rounded-lg transition-colors"
          title="Đăng xuất"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
