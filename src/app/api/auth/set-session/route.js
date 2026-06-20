import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { access_token, refresh_token } = await request.json()
  
  const supabase = await createClient()
  
  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
