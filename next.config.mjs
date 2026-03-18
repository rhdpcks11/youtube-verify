/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ojsafjfufhebzozzvepl.supabase.co",
      },
    ],
  },
};

export default nextConfig;
