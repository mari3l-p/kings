import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tgvgysttzzjhmmsgujlu.supabase.co', // El ID que veo en tu tabla
      },
    ],
  },
};

export default nextConfig;
