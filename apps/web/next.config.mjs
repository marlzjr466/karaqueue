/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@karaoke-queue/shared",
    "@karaoke-queue/validation",
    "@karaoke-queue/database"
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com"
      },
      {
        protocol: "https",
        hostname: "yt3.ggpht.com"
      }
    ]
  }
};

export default nextConfig;
