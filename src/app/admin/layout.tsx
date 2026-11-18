import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminNav from '@/components/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/staff')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminNav name={profile.full_name} />
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full pb-24">{children}</main>
    </div>
  )
}
