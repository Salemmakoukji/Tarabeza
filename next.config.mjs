/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const hostname = supabaseUrl 
  ? new URL(supabaseUrl).hostname 
  : null;

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'tarapeza.com', 
        'www.tarapeza.com',
        'localhost:3000'
      ],
    },
  },
  images: {
    remotePatterns: hostname ? [
      {
        protocol: 'https',
        hostname: hostname,
        pathname: '/**',
      },
    ] : [],
  },
};

export default nextConfig;
