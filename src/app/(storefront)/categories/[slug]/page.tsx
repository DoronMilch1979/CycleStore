import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBreadcrumbs } from "@/components/storefront/product-breadcrumbs";
import { ProductCardGrid, toProductCardData } from "@/components/storefront/product-card";
import { STORE_NAME } from "@/config/site";
import { readPublicSlug } from "@/lib/slug";
import {
  getCachedPublicCategory,
  listActiveCategoryParams,
} from "@/server/queries/catalog-cache";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  return listActiveCategoryParams();
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = readPublicSlug(raw);
  const category = slug ? await getCachedPublicCategory(slug) : null;
  if (!category) return { title: "קטגוריה" };
  return {
    title: category.name,
    description: `מוצרים בקטגוריה ${category.name} ב${STORE_NAME}`,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: { title: category.name },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug: raw } = await params;
  const slug = readPublicSlug(raw);
  const category = slug ? await getCachedPublicCategory(slug) : null;
  if (!category) notFound();

  const cards = category.products.map(toProductCardData);

  return (
    <div className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] py-8 sm:py-12">
      {category.ancestors.length > 0 ? (
        <ProductBreadcrumbs path={category.ancestors} productName={category.name} />
      ) : null}
      <header className={category.children.length > 0 ? "mb-4 sm:mb-5" : "mb-8 sm:mb-10"}>
        <h1 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          {category.name}
        </h1>
      </header>
      {category.children.length > 0 ? (
        <section className="mb-6 text-center sm:mb-8">
          <ul className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {category.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/categories/${child.slug}`}
                  className="border-border bg-surface inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {cards.length === 0 ? (
        <p className="text-muted text-center">אין מוצרים להצגה בקטגוריה זו.</p>
      ) : (
        <ProductCardGrid products={cards} />
      )}
    </div>
  );
}
