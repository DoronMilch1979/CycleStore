import "server-only";

import { cache } from "react";
import { and, asc, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { PUBLIC_CACHE_SECONDS } from "@/config/site";
import { getDb } from "@/db";
import { categories, productImages, products } from "@/db/schema/catalog";
import { media } from "@/db/schema/media";
import {
  getCategoryBreadcrumbPath,
  getProductCategoryPath,
  listProductsInCategoryTree,
  type CategoryBreadcrumb,
} from "@/domain/catalog/queries";
import { cacheTags } from "@/lib/cache-tags";
import { isDatabaseConfigured } from "@/lib/env";
import { isPublicSlug } from "@/lib/slug";

const CATALOG_CACHE_MISS = "cyclestore:public-catalog-miss";

export type PublicProductImage = {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string | null;
  priceAmount: string;
  discountPriceAmount: string | null;
  stockQuantity: number;
  images: PublicProductImage[];
  categoryPath: CategoryBreadcrumb[];
};

export type PublicCategoryChild = {
  id: string;
  name: string;
  slug: string;
};

export type PublicCategoryProduct = {
  id: string;
  name: string;
  slug: string;
  priceAmount: string;
  discountPriceAmount: string | null;
  stockQuantity: number;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type PublicCategoryPage = {
  id: string;
  name: string;
  slug: string;
  children: PublicCategoryChild[];
  products: PublicCategoryProduct[];
  ancestors: CategoryBreadcrumb[];
};

export type PublicFeaturedProduct = PublicCategoryProduct;

function isCatalogCacheMiss(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.message === CATALOG_CACHE_MISS) return true;
  return "cause" in error && isCatalogCacheMiss(error.cause);
}

async function cachePublicHit<T>(
  key: string[],
  tags: string[],
  load: () => Promise<T | null>,
): Promise<T | null> {
  try {
    return await unstable_cache(
      async () => {
        const value = await load();
        if (value == null) throw new Error(CATALOG_CACHE_MISS);
        return value;
      },
      key,
      { revalidate: PUBLIC_CACHE_SECONDS, tags },
    )();
  } catch (error) {
    if (isCatalogCacheMiss(error)) return null;
    throw error;
  }
}

async function loadPublicProduct(slug: string): Promise<PublicProduct | null> {
  const db = getDb();
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      sku: products.sku,
      priceAmount: products.priceAmount,
      discountPriceAmount: products.discountPriceAmount,
      stockQuantity: products.stockQuantity,
      isActive: products.isActive,
    })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product || !product.isActive) return null;

  const [images, categoryPath] = await Promise.all([
    db
      .select({
        id: productImages.id,
        url: media.url,
        altText: media.altText,
        isPrimary: productImages.isPrimary,
        sortOrder: productImages.sortOrder,
      })
      .from(productImages)
      .innerJoin(media, eq(media.id, productImages.mediaId))
      .where(eq(productImages.productId, product.id))
      .orderBy(productImages.sortOrder),
    getProductCategoryPath(db, product.id),
  ]);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    priceAmount: product.priceAmount,
    discountPriceAmount: product.discountPriceAmount,
    stockQuantity: product.stockQuantity,
    images,
    categoryPath,
  };
}

async function loadPublicCategory(slug: string): Promise<PublicCategoryPage | null> {
  const db = getDb();
  const [category] = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      isActive: categories.isActive,
    })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (!category || !category.isActive) return null;

  const [children, productRows, lineage] = await Promise.all([
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .where(and(eq(categories.parentId, category.id), eq(categories.isActive, true)))
      .orderBy(asc(categories.sortOrder), asc(categories.name), asc(categories.id)),
    listProductsInCategoryTree(db, category.id),
    getCategoryBreadcrumbPath(db, category.id),
  ]);

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    children,
    products: productRows.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      priceAmount: product.priceAmount,
      discountPriceAmount: product.discountPriceAmount,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
    })),
    ancestors: lineage.slice(0, -1),
  };
}

async function loadFeaturedProducts(): Promise<PublicFeaturedProduct[]> {
  const rows = await getDb()
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      priceAmount: products.priceAmount,
      discountPriceAmount: products.discountPriceAmount,
      stockQuantity: products.stockQuantity,
      imageUrl: media.url,
      imageAlt: media.altText,
    })
    .from(products)
    .leftJoin(
      productImages,
      and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true)),
    )
    .leftJoin(media, eq(media.id, productImages.mediaId))
    .where(eq(products.isActive, true))
    .orderBy(desc(products.updatedAt))
    .limit(8);

  return rows.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    priceAmount: product.priceAmount,
    discountPriceAmount: product.discountPriceAmount,
    stockQuantity: product.stockQuantity,
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
  }));
}

export async function listActiveProductParams() {
  return listActiveSlugParams(products);
}

export async function listActiveCategoryParams() {
  return listActiveSlugParams(categories);
}

async function listActiveSlugParams(table: typeof products | typeof categories) {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await getDb()
      .select({ slug: table.slug })
      .from(table)
      .where(eq(table.isActive, true));
    return rows
      .filter((row) => isPublicSlug(row.slug))
      .map((row) => ({ slug: row.slug }));
  } catch {
    return [];
  }
}

export const getCachedPublicProduct = cache(async (slug: string) => {
  if (!isDatabaseConfigured() || !isPublicSlug(slug)) return null;
  return cachePublicHit(
    ["public-product", slug],
    [cacheTags.catalog, cacheTags.productSlug(slug)],
    () => loadPublicProduct(slug),
  );
});

export const getCachedPublicCategory = cache(async (slug: string) => {
  if (!isDatabaseConfigured() || !isPublicSlug(slug)) return null;
  return cachePublicHit(
    ["public-category", slug],
    [cacheTags.catalog, cacheTags.categories, cacheTags.categorySlug(slug)],
    () => loadPublicCategory(slug),
  );
});

export const getCachedFeaturedProducts = cache(async () => {
  if (!isDatabaseConfigured()) return [];
  try {
    return await unstable_cache(loadFeaturedProducts, ["featured-products"], {
      revalidate: PUBLIC_CACHE_SECONDS,
      tags: [cacheTags.catalog],
    })();
  } catch {
    return [];
  }
});
