import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBreadcrumbs } from "@/components/storefront/product-breadcrumbs";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { ProductCardGrid, toProductCardData } from "@/components/storefront/product-card";
import { getCachedCategories } from "@/server/queries/public";
import {
  getCategoryBreadcrumbPath,
  getCategoryBySlug,
  listProductsInCategoryTree,
} from "@/domain/catalog/queries";
import { getDb } from "@/db";
import { isDatabaseConfigured } from "@/lib/env";
import { eq } from "drizzle-orm";
import { categories } from "@/db/schema/catalog";
import { STORE_NAME } from "@/config/site";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isDatabaseConfigured()) {
    return { title: "קטגוריה" };
  }
  const category = await getCategoryBySlug(getDb(), decodeURIComponent(slug));
  if (!category) {
    return { title: "קטגוריה" };
  }
  return {
    title: category.name,
    description: `מוצרים בקטגוריה ${category.name} ב${STORE_NAME}`,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: { title: category.name },
  };
}

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  if (!isDatabaseConfigured()) {
    notFound();
  }

  const { slug } = await params;
  const db = getDb();
  const category = await getCategoryBySlug(db, decodeURIComponent(slug));
  if (!category || !category.isActive) {
    notFound();
  }

  const [children, products, allCategories, lineage] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(eq(categories.parentId, category.id)),
    listProductsInCategoryTree(db, category.id),
    getCachedCategories(),
    getCategoryBreadcrumbPath(db, category.id),
  ]);
  void allCategories;
  const ancestors = lineage.slice(0, -1);

  const cards = products.map(toProductCardData);
  const activeChildren = children.filter((child) => child.isActive);

  return (
    <StorefrontShell>
      <div className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] py-8 sm:py-12">
        {ancestors.length > 0 ? (
          <ProductBreadcrumbs path={ancestors} productName={category.name} />
        ) : null}
        <header className="mb-8 sm:mb-10">
          <h1 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            {category.name}
          </h1>
        </header>
        {activeChildren.length > 0 ? (
          <section className="mb-10 text-center">
            <h2 className="mb-5 text-lg font-semibold tracking-tight sm:text-xl">קטגוריות משנה</h2>
            <ul className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {activeChildren.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/categories/${child.slug}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 py-2 text-sm"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {cards.length === 0 ? (
          <p className="text-center text-muted">אין מוצרים להצגה בקטגוריה זו.</p>
        ) : (
          <ProductCardGrid products={cards} />
        )}
      </div>
    </StorefrontShell>
  );
}
