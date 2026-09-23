import type { MetadataRoute } from "next";
import { getCachedCategories, getSiteUrl } from "@/server/queries/public";
import { isDatabaseConfigured } from "@/lib/env";
import { getDb } from "@/db";
import { products } from "@/db/schema/catalog";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: site, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${site}/accessibility`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categories = await getCachedCategories();
  for (const category of categories) {
    entries.push({
      url: `${site}/categories/${encodeURIComponent(category.slug)}`,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  if (isDatabaseConfigured()) {
    try {
      const productRows = await getDb()
        .select({ slug: products.slug, updatedAt: products.updatedAt })
        .from(products)
        .where(eq(products.isActive, true));
      for (const product of productRows) {
        entries.push({
          url: `${site}/products/${encodeURIComponent(product.slug)}`,
          lastModified: product.updatedAt,
          changeFrequency: "daily",
          priority: 0.7,
        });
      }
    } catch {
      // Sitemap remains valid with homepage and categories only.
    }
  }

  return entries;
}
