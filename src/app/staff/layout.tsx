import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StaffNav from '@/components/StaffNav'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, branch_id, branches(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.role) redirect('/login')

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <StaffNav
        name={profile.full_name}
        role={profile.role}
        // @ts-expect-error supabase join type
        branch={profile.branches?.name ?? null}
      />
      <main className="flex-1 min-h-0 px-3 pt-3 max-w-lg mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
