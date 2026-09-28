import "server-only";

import { revalidatePath, updateTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";

/** Drop public catalog pages and their data cache. Admin actions only. */
export function revalidatePublicCatalog(productSlugs?: Array<string | null | undefined>) {
  updateTag(cacheTags.catalog);
  updateTag(cacheTags.categories);
  for (const slug of productSlugs ?? []) {
    if (slug) updateTag(cacheTags.productSlug(slug));
  }
  revalidatePath("/");
  revalidatePath("/categories", "layout");
  revalidatePath("/products", "layout");
}
