import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    return NextResponse.json({
      totalCookies: allCookies.length,
      cookies: allCookies.map(c => ({
        name: c.name,
        valueLength: c.value.length,
        valuePreview: c.value.substring(0, 50) + (c.value.length > 50 ? '...' : '')
      })),
      session: null,
      sessionError: null,
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
