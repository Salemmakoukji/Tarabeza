import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    let user = null;
    let userError = null;
    if (session) {
      try {
        const { data: { user: u }, error: uErr } = await supabase.auth.getUser();
        user = u;
        userError = uErr;
      } catch (e) {
        userError = e.message;
      }
    }

    return NextResponse.json({
      totalCookies: allCookies.length,
      cookies: allCookies.map(c => ({
        name: c.name,
        valueLength: c.value.length,
        valuePreview: c.value.substring(0, 50) + (c.value.length > 50 ? '...' : '')
      })),
      session: session ? {
        hasAccessToken: !!session.access_token,
        tokenLength: session.access_token?.length,
        expiresAt: session.expires_at,
        user: {
          id: session.user?.id,
          email: session.user?.email
        }
      } : null,
      sessionError: sessionError?.message || null,
      user: user ? {
        id: user.id,
        email: user.email
      } : null,
      userError: userError?.message || userError || null,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'placeholder-url',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
