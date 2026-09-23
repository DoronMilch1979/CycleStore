import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { PLACEHOLDER_PRODUCT_SRC, STORE_NAME } from "@/config/site";
import { AddToCartForm } from "@/components/storefront/add-to-cart-form";
import { ProductBreadcrumbs } from "@/components/storefront/product-breadcrumbs";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { ProductPrice } from "@/components/ui/price";
import { getDb } from "@/db";
import { productImages } from "@/db/schema/catalog";
import { media } from "@/db/schema/media";
import { publicMaxSelectableQuantity } from "@/domain/cart/limits";
import { getProductBySlug, getProductCategoryPath } from "@/domain/catalog/queries";
import { getEffectivePrice } from "@/domain/pricing";
import { jsonLdScript } from "@/lib/json-ld";
import { isDatabaseConfigured } from "@/lib/env";
import { getSiteUrl } from "@/server/queries/public";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isDatabaseConfigured()) return { title: "מוצר" };
  const product = await getProductBySlug(getDb(), decodeURIComponent(slug));
  if (!product) return { title: "מוצר" };
  return {
    title: product.name,
    description: product.description.slice(0, 160) || product.name,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description: product.description.slice(0, 160) },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  if (!isDatabaseConfigured()) notFound();
  const { slug } = await params;
  const db = getDb();
  const product = await getProductBySlug(db, decodeURIComponent(slug));
  if (!product || !product.isActive) notFound();

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

  const primary = images.find((image) => image.isPrimary) ?? images[0];
  const inStock = product.stockQuantity > 0;
  const availability = inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  return (
    <StorefrontShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript({
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: primary?.url,
          sku: product.sku ?? undefined,
          brand: { "@type": "Brand", name: STORE_NAME },
          offers: {
            "@type": "Offer",
            priceCurrency: "ILS",
            price: getEffectivePrice(product).toFixed(2),
            availability,
            url: `${getSiteUrl()}/products/${product.slug}`,
          },
        })}
      />
      <div className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] py-8 sm:py-12">
        <ProductBreadcrumbs path={categoryPath} productName={product.name} />
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductImageGallery
            productName={product.name}
            images={images}
            placeholderSrc={PLACEHOLDER_PRODUCT_SRC}
          />
          <div className="space-y-5">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>
            <p className="text-xl sm:text-2xl">
              <ProductPrice
                priceAmount={product.priceAmount}
                discountPriceAmount={product.discountPriceAmount}
              />
            </p>
            <p className="text-muted whitespace-pre-line">
              {product.description || "אין תיאור למוצר זה."}
            </p>
            <p
              className={inStock ? "text-success font-medium" : "text-danger font-medium"}
            >
              {inStock ? "במלאי" : "אזל מהמלאי"}
            </p>
            <AddToCartForm
              productId={product.id}
              maxQuantity={publicMaxSelectableQuantity(product.stockQuantity)}
            />
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
