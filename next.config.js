const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    domains: ["localhost", "via.placeholder.com", "placeholder.svg"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost", port: "5000", pathname: "/uploads/**" },
    ],
    unoptimized: true,
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000", "localhost:3001"] },
  },
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
};

module.exports = nextConfig;

