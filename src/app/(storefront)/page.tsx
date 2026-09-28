import { PLACEHOLDER_HERO_SRC, STORE_NAME } from "@/config/site";
import { HeroSlideshow } from "@/components/storefront/hero-slideshow";
import { ProductCardGrid, toProductCardData } from "@/components/storefront/product-card";
import { buildHeroSlides, slidesForHeroDisplay } from "@/domain/content/hero-slides";
import { jsonLdScript, storeOrganizationJsonLd } from "@/lib/json-ld";
import { getCachedFeaturedProducts } from "@/server/queries/catalog-cache";
import {
  getCachedBanners,
  getCachedContactFields,
  getCachedHomepage,
  getSiteUrl,
} from "@/server/queries/public";

export default async function HomePage() {
  const [homepage, banners, contact, featuredRows] = await Promise.all([
    getCachedHomepage(),
    getCachedBanners(),
    getCachedContactFields(),
    getCachedFeaturedProducts(),
  ]);
  const featured = featuredRows.map(toProductCardData);

  const email = contact.find((field) => field.fieldType === "email")?.value;
  const telephone = contact.find((field) => field.fieldType === "phone")?.value;
  const address = contact.find((field) => field.fieldType === "address")?.value;
  const homepageBanners = banners.filter((banner) => banner.location === "homepage");

  return (
    <>
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
          <p className="text-muted text-center">אין מוצרים להצגה כרגע.</p>
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
        <p className="text-muted max-w-3xl text-base leading-7 whitespace-pre-line sm:text-lg sm:leading-8">
          {homepage.storyText}
        </p>
      </section>
      {homepageBanners.length > 0 ? (
        <section className="mx-auto grid w-full max-w-[var(--width-content)] gap-4 px-[var(--space-page)] pb-12">
          {homepageBanners.map((banner) => (
            <article
              key={banner.id}
              className="border-border bg-surface rounded-[var(--radius-lg)] border p-4 sm:p-6"
            >
              <h2 className="text-2xl font-semibold">{banner.title}</h2>
              {banner.subtitle ? <p className="text-muted">{banner.subtitle}</p> : null}
            </article>
          ))}
        </section>
      ) : null}
    </>
  );
}
