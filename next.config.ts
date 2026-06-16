import type { NextConfig } from "next";

const apiProxyTarget = process.env.SHOPAHSO_DEV_API_PROXY_TARGET?.trim();
const apiProxyRoutes = [
  "admin",
  "api",
  "auth",
  "backoffice",
  "banners",
  "cart",
  "catalog",
  "checkout",
  "orders",
  "payment",
  "promotions",
  "quote-requests",
  "slug",
  "tax",
  "user-addresses",
  "utils",
];

const nextConfig: NextConfig = {
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.vietqr.io",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    if (!apiProxyTarget) {
      return [];
    }

    return apiProxyRoutes.map((route) => ({
      source: `/${route}/:path*`,
      destination: `${apiProxyTarget}/${route}/:path*`,
    }));
  },
};

export default nextConfig;
