import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request) {
  const supabase = createClient();
  await supabase.auth.signOut();

  const url = new URL('/login', request.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET(request) {
  const supabase = createClient();
  await supabase.auth.signOut();

  const url = new URL('/login', request.url);
  return NextResponse.redirect(url, { status: 303 });
}
