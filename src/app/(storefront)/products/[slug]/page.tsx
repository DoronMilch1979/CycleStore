import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PLACEHOLDER_PRODUCT_SRC, STORE_NAME } from "@/config/site";
import { AddToCartForm } from "@/components/storefront/add-to-cart-form";
import { ProductBreadcrumbs } from "@/components/storefront/product-breadcrumbs";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";
import { ProductPrice } from "@/components/ui/price";
import { publicMaxSelectableQuantity } from "@/domain/cart/limits";
import { getEffectivePrice } from "@/domain/pricing";
import { jsonLdScript } from "@/lib/json-ld";
import { readPublicSlug } from "@/lib/slug";
import {
  getCachedPublicProduct,
  listActiveProductParams,
} from "@/server/queries/catalog-cache";
import { getSiteUrl } from "@/server/queries/public";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  return listActiveProductParams();
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = readPublicSlug(raw);
  const product = slug ? await getCachedPublicProduct(slug) : null;
  if (!product) return { title: "מוצר" };
  const description = product.description.slice(0, 160) || product.name;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug: raw } = await params;
  const slug = readPublicSlug(raw);
  const product = slug ? await getCachedPublicProduct(slug) : null;
  if (!product) notFound();

  const primary = product.images.find((image) => image.isPrimary) ?? product.images[0];
  const inStock = product.stockQuantity > 0;
  const availability = inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  return (
    <>
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
        <ProductBreadcrumbs path={product.categoryPath} productName={product.name} />
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductImageGallery
            productName={product.name}
            images={product.images}
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
    </>
  );
}
