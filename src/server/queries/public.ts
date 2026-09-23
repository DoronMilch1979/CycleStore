import "server-only";

import { and, asc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { STORE_NAME } from "@/config/site";
import { STORE_CONTACT_DEFAULTS, STORE_HERO_ALT, STORE_STORY } from "@/config/store-content";
import { getDb } from "@/db";
import { listCategoriesInDisplayOrder } from "@/domain/catalog/category-service";
import { buildHeroSlides, parseHeroDisplayMode, type HeroDisplayMode } from "@/domain/content/hero-slides";
import { listHomepageImages } from "@/domain/content/store-images";
import {
  banners,
  brandingSettings,
  contactFields,
  homepageContent,
} from "@/db/schema/content";
import { media } from "@/db/schema/media";
import { cacheTags } from "@/lib/cache-tags";
import { env, isDatabaseConfigured } from "@/lib/env";
import { PUBLIC_CACHE_SECONDS } from "@/config/site";

export type PublicContactField = {
  fieldKey: string;
  fieldType: string;
  label: string;
  value: string;
};

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

export type PublicHeroImage = {
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type PublicHomepage = {
  storyText: string;
  heroUrl: string | null;
  heroAlt: string;
  heroDisplay: HeroDisplayMode;
  heroImages: PublicHeroImage[];
  storeName: string;
  logoUrl: string | null;
  logoAlt: string;
};

const fallbackHomepage: PublicHomepage = {
  storyText: STORE_STORY,
  heroUrl: null,
  heroAlt: STORE_HERO_ALT,
  heroDisplay: "slideshow",
  heroImages: [],
  storeName: STORE_NAME,
  logoUrl: null,
  logoAlt: STORE_NAME,
};

const fallbackContactFields: PublicContactField[] = STORE_CONTACT_DEFAULTS.filter(
  (field) => field.value.trim().length > 0,
).map((field) => ({
  fieldKey: field.fieldKey,
  fieldType: field.fieldType,
  label: field.label,
  value: field.value,
}));

async function withDatabaseFallback<T>(fallback: T, loader: () => Promise<T>): Promise<T> {
  if (!isDatabaseConfigured()) {
    return fallback;
  }
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

async function loadHomepage(): Promise<PublicHomepage> {
  return withDatabaseFallback(fallbackHomepage, async () => {
    const db = getDb();
    const [home] = await db
      .select({
        storyText: homepageContent.storyText,
        heroAlt: homepageContent.heroAlt,
        heroDisplay: homepageContent.heroDisplay,
        heroUrl: media.url,
      })
      .from(homepageContent)
      .leftJoin(media, eq(homepageContent.heroMediaId, media.id))
      .limit(1);

    const storedImages = await listHomepageImages(db);
    const heroImages =
      storedImages.length > 0
        ? storedImages.map((image) => ({
            url: image.url,
            alt: image.altText || home?.heroAlt || STORE_HERO_ALT,
            isPrimary: image.isPrimary,
            sortOrder: image.sortOrder,
          }))
        : home?.heroUrl
          ? [
              {
                url: home.heroUrl,
                alt: home.heroAlt || STORE_HERO_ALT,
                isPrimary: true,
                sortOrder: 0,
              },
            ]
          : [];

    const [branding] = await db
      .select({
        storeName: brandingSettings.storeName,
        logoAlt: brandingSettings.logoAlt,
        logoUrl: media.url,
      })
      .from(brandingSettings)
      .leftJoin(media, eq(brandingSettings.logoMediaId, media.id))
      .limit(1);

    const slides = buildHeroSlides(heroImages, null);
    const primary = slides.find((slide) => slide.isPrimary) ?? slides[0];

    return {
      storyText: home?.storyText || fallbackHomepage.storyText,
      heroUrl: primary?.url ?? home?.heroUrl ?? null,
      heroAlt: home?.heroAlt || fallbackHomepage.heroAlt,
      heroDisplay: parseHeroDisplayMode(home?.heroDisplay),
      heroImages: slides.map((slide) => ({
        url: slide.url,
        alt: slide.alt,
        isPrimary: Boolean(slide.isPrimary),
        sortOrder: slide.sortOrder ?? 0,
      })),
      storeName: branding?.storeName || STORE_NAME,
      logoUrl: branding?.logoUrl ?? null,
      logoAlt: branding?.logoAlt || STORE_NAME,
    };
  });
}

async function loadCategories(): Promise<PublicCategory[]> {
  return withDatabaseFallback([], async () => {
    const rows = await listCategoriesInDisplayOrder(getDb(), true);
    return rows.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
    }));
  });
}

async function loadContactFields(): Promise<PublicContactField[]> {
  return withDatabaseFallback(fallbackContactFields, async () =>
    getDb()
      .select({
        fieldKey: contactFields.fieldKey,
        fieldType: contactFields.fieldType,
        label: contactFields.label,
        value: contactFields.value,
      })
      .from(contactFields)
      .where(and(eq(contactFields.isActive, true)))
      .orderBy(asc(contactFields.sortOrder)),
  );
}

async function loadBanners() {
  return withDatabaseFallback([], async () => {
    const now = new Date();
    return getDb()
      .select({
        id: banners.id,
        title: banners.title,
        subtitle: banners.subtitle,
        linkUrl: banners.linkUrl,
        location: banners.location,
        imageUrl: media.url,
        imageAlt: media.altText,
      })
      .from(banners)
      .leftJoin(media, eq(banners.mediaId, media.id))
      .where(
        and(
          eq(banners.isActive, true),
          or(isNull(banners.startsAt), lte(banners.startsAt, now)),
          or(isNull(banners.endsAt), gte(banners.endsAt, now)),
        ),
      )
      .orderBy(asc(banners.sortOrder));
  });
}

export const getCachedHomepage = unstable_cache(loadHomepage, ["homepage"], {
  revalidate: PUBLIC_CACHE_SECONDS,
  tags: [cacheTags.homepage, cacheTags.branding],
});

export const getCachedCategories = unstable_cache(loadCategories, ["categories"], {
  revalidate: PUBLIC_CACHE_SECONDS,
  tags: [cacheTags.categories, cacheTags.catalog],
});

export const getCachedContactFields = unstable_cache(loadContactFields, ["contact"], {
  revalidate: PUBLIC_CACHE_SECONDS,
  tags: [cacheTags.contact],
});

export const getCachedBanners = unstable_cache(loadBanners, ["banners"], {
  revalidate: PUBLIC_CACHE_SECONDS,
  tags: [cacheTags.banners],
});

export function getSiteUrl() {
  return env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
