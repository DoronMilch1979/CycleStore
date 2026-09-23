import type { Metadata } from "next";
import { ProductCardGrid, toProductCardData } from "@/components/storefront/product-card";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { getDb } from "@/db";
import { searchPublicProducts } from "@/domain/catalog/queries";
import { isDatabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "חיפוש מוצרים",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  let products: ReturnType<typeof toProductCardData>[] = [];
  if (query && isDatabaseConfigured()) {
    products = (await searchPublicProducts(getDb(), query)).map(toProductCardData);
  }

  return (
    <StorefrontShell>
      <div className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] py-8 sm:py-12">
        <h1 className="mb-6 text-center text-3xl font-bold tracking-tight sm:mb-8 sm:text-4xl">
          {query ? `תוצאות חיפוש: ${query}` : "חיפוש מוצרים"}
        </h1>
        {!query ? (
          <p className="text-center text-muted">יש להזין טקסט לחיפוש.</p>
        ) : products.length === 0 ? (
          <p className="text-center text-muted">לא נמצאו מוצרים התואמים לחיפוש.</p>
        ) : (
          <ProductCardGrid products={products} />
        )}
      </div>
    </StorefrontShell>
  );
}
