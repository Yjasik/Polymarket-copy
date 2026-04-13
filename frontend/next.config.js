/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  webpack: (config) => {
    config.externals.push(
      "pino-pretty",
      "lokijs",
      "encoding",
      "idb-keyval"
    );
    return config;
  },
};

module.exports = nextConfig;
