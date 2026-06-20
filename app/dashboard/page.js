import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')
  
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard ✅</h1>
      <p>Logged in as: {user.email}</p>
      <a href="/auth/logout">Logout</a>
    </div>
  )
}
