/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["sharp"],
    outputFileTracingIncludes: {
      "/api/studio/composite": [
        "./node_modules/sharp/**/*",
        "./node_modules/@img/**/*",
      ],
      "/studio": [
        "./node_modules/sharp/**/*",
        "./node_modules/@img/**/*",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.replicate.delivery",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "sharp"];
    }
    return config;
  },
};

export default nextConfig;
