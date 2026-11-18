'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, Gift, LayoutDashboard, LogOut, Contact, Receipt, Settings } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/customers', label: 'Khách hàng', icon: Contact },
  { href: '/admin/transactions', label: 'Giao dịch', icon: Receipt },
  { href: '/admin/rewards', label: 'Quà tặng', icon: Gift },
  { href: '/admin/staff', label: 'Cài đặt', icon: Settings },
]

export default function AdminNav({ name }: { name: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <header className="bg-green-800 text-white px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-black text-lg leading-none">TUIBAO</div>
          <div className="text-green-300 text-xs">Quản lý · {name}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/staff" className="text-green-300 text-xs underline mr-2">
            Về nhân viên
          </Link>
          <button onClick={handleLogout} className="p-1.5 hover:bg-green-700 rounded-lg">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(href) ||
                  (href === '/admin/staff' && pathname.startsWith('/admin/branches'))
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[11px]
                            font-medium transition-colors ${
                  isActive ? 'text-green-700' : 'text-gray-400'
                }`}
              >
                <Icon size={19} />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
