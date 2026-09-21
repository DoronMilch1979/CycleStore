import Image from "next/image";
import { PLACEHOLDER_HERO_SRC, STORE_NAME } from "@/config/site";
import { ProductCardGrid, toProductCardData } from "@/components/storefront/product-card";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { jsonLdScript, storeOrganizationJsonLd } from "@/lib/json-ld";
import {
  getCachedBanners,
  getCachedContactFields,
  getCachedHomepage,
  getSiteUrl,
} from "@/server/queries/public";
import { isDatabaseConfigured } from "@/lib/env";
import { getDb } from "@/db";
import { products } from "@/db/schema/catalog";
import { productImages } from "@/db/schema/catalog";
import { media } from "@/db/schema/media";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [homepage, banners, contact] = await Promise.all([
    getCachedHomepage(),
    getCachedBanners(),
    getCachedContactFields(),
  ]);

  let featured: ReturnType<typeof toProductCardData>[] = [];

  if (isDatabaseConfigured()) {
    try {
      const rows = await getDb()
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          priceAmount: products.priceAmount,
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
      featured = rows.map(toProductCardData);
    } catch {
      featured = [];
    }
  }

  const email = contact.find((field) => field.fieldType === "email")?.value;
  const telephone = contact.find((field) => field.fieldType === "phone")?.value;
  const address = contact.find((field) => field.fieldType === "address")?.value;
  const homepageBanners = banners.filter((banner) => banner.location === "homepage");

  return (
    <StorefrontShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          storeOrganizationJsonLd({
            url: getSiteUrl(),
            email,
            telephone,
            address,
          }),
        )}
      />
      <section className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] py-8 sm:py-12">
        {featured.length === 0 ? (
          <p className="text-center text-muted">אין מוצרים להצגה כרגע.</p>
        ) : (
          <ProductCardGrid products={featured} />
        )}
      </section>
      <section className="relative">
        <div className="relative h-[min(48vh,22rem)] w-full bg-surface-muted sm:h-[min(70vh,36rem)]">
          <Image
            src={homepage.heroUrl ?? PLACEHOLDER_HERO_SRC}
            alt={homepage.heroAlt || STORE_NAME}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
      </section>
      <section className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] py-8 sm:py-12">
        <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">{homepage.storeName}</h1>
        <p className="max-w-3xl whitespace-pre-line text-base leading-7 text-muted sm:text-lg sm:leading-8">
          {homepage.storyText}
        </p>
      </section>
      {homepageBanners.length > 0 ? (
        <section className="mx-auto grid w-full max-w-[var(--width-content)] gap-4 px-[var(--space-page)] pb-12">
          {homepageBanners.map((banner) => (
            <article
              key={banner.id}
              className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:p-6"
            >
              <h2 className="text-2xl font-semibold">{banner.title}</h2>
              {banner.subtitle ? <p className="text-muted">{banner.subtitle}</p> : null}
            </article>
          ))}
        </section>
      ) : null}
    </StorefrontShell>
  );
}
