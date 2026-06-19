import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request) {
  // 1. Show ALL cookies with their value lengths
  const allCookies = request.cookies.getAll();
  const cookieInfo = allCookies.map(c => ({
    name: c.name,
    valueLength: c.value?.length || 0,
    valuePreview: c.value?.substring(0, 50) + (c.value?.length > 50 ? '...' : ''),
  }));

  // 2. Try to get the Supabase session
  let sessionInfo = null;
  let userInfo = null;
  let sessionError = null;
  let userError = null;

  try {
    const supabase = await createClient();
    const { data: sessionData, error: sErr } = await supabase.auth.getSession();
    sessionInfo = sessionData?.session ? {
      hasAccessToken: !!sessionData.session.access_token,
      tokenLength: sessionData.session.access_token?.length,
      expiresAt: sessionData.session.expires_at,
    } : null;
    sessionError = sErr?.message || null;

    const { data: userData, error: uErr } = await supabase.auth.getUser();
    userInfo = userData?.user ? {
      id: userData.user.id,
      email: userData.user.email,
      role: userData.user.user_metadata?.role,
    } : null;
    userError = uErr?.message || null;
  } catch (e) {
    sessionError = e.message;
  }

  return NextResponse.json({
    totalCookies: allCookies.length,
    cookies: cookieInfo,
    session: sessionInfo,
    sessionError,
    user: userInfo,
    userError,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing',
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }, { status: 200 });
}
