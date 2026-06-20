import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL('/login', request.url);
  const response = NextResponse.redirect(url, { status: 303 });
  
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');
  
  return response;
}

export async function GET(request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL('/login', request.url);
  const response = NextResponse.redirect(url, { status: 303 });
  
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');
  
  return response;
}
