import { PLACEHOLDER_HERO_SRC, STORE_NAME } from "@/config/site";
import { HeroSlideshow } from "@/components/storefront/hero-slideshow";
import { ProductCardGrid, toProductCardData } from "@/components/storefront/product-card";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { buildHeroSlides, slidesForHeroDisplay } from "@/domain/content/hero-slides";
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
      <section className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] pt-6 pb-8 sm:pt-8 sm:pb-12">
        <h1 className="sr-only">{homepage.storeName}</h1>
        <h2 className="sr-only">מוצרים בחנות</h2>
        {featured.length === 0 ? (
          <p className="text-center text-muted">אין מוצרים להצגה כרגע.</p>
        ) : (
          <ProductCardGrid products={featured} headingLevel="h3" />
        )}
      </section>
      <section className="relative">
        <HeroSlideshow
          slides={slidesForHeroDisplay(
            buildHeroSlides(homepage.heroImages, {
              url: PLACEHOLDER_HERO_SRC,
              alt: homepage.heroAlt || STORE_NAME,
            }),
            homepage.heroDisplay,
          )}
        />
      </section>
      <section className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] py-8 sm:py-12">
        <h2 className="mb-4 text-2xl font-semibold">על החנות</h2>
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
