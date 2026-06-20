import { redirect } from 'react-router'
import { createClient } from '../lib/supabase/server'

export async function loader({ request }) {
  const supabase = await createClient(request)
  await supabase.auth.signOut()

  const responseHeaders = new Headers()
  responseHeaders.append('Set-Cookie', 'sb-access-token=; Path=/; Max-Age=0; SameSite=Lax; Secure')
  responseHeaders.append('Set-Cookie', 'sb-refresh-token=; Path=/; Max-Age=0; SameSite=Lax; Secure')

  return redirect('/login', {
    headers: responseHeaders,
  })
}
