import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const createClient = async (request) => {
  const cookieHeader = request.headers.get("Cookie") || "";
  
  const parseCookies = (header) => {
    return header.split(";").reduce((acc, cookie) => {
      const [name, ...value] = cookie.split("=");
      if (name && value) {
        acc[name.trim()] = value.join("=").trim();
      }
      return acc;
    }, {});
  };
  
  const cookies = parseCookies(cookieHeader);
  const accessToken = cookies['sb-access-token'];
  const refreshToken = cookies['sb-refresh-token'];
  
  const supabase = createSupabaseClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ""
  )
  
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }
  
  return supabase
}
