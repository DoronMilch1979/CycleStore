import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/** Wi-Fi and other RFC1918 addresses on this machine, so a phone on the LAN can load dev assets. */
function lanDevOrigins(): string[] {
  const origins = new Set<string>();
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.internal || entry.family !== "IPv4") continue;
      const [first, second] = entry.address.split(".").map(Number);
      const isPrivate =
        first === 10 ||
        (first === 192 && second === 168) ||
        (first === 172 && second >= 16 && second <= 31);
      if (isPrivate) origins.add(entry.address);
    }
  }
  return [...origins];
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  // Next.js still requires 'unsafe-inline' for hydration; 'unsafe-eval' is limited to development.
  isProduction
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  experimental: {
    serverActions: {
      // App uploads allow 5MB. Multipart overhead and the platform body limit sit near 4.5MB.
      bodySizeLimit: "4.5mb",
    },
  },
  ...(!isProduction ? { allowedDevOrigins: lanDevOrigins() } : {}),
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      { pathname: "/placeholders/**" },
      { pathname: "/media/**" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
