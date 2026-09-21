import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/server/queries/public";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
