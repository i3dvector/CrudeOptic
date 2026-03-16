/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  // Allow d3-sankey (CommonJS) to be bundled
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

export default nextConfig;
