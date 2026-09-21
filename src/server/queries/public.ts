import "server-only";

import { and, asc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { STORE_NAME } from "@/config/site";
import { STORE_CONTACT_DEFAULTS, STORE_HERO_ALT, STORE_STORY } from "@/config/store-content";
import { getDb } from "@/db";
import { categories } from "@/db/schema/catalog";
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

export type PublicHomepage = {
  storyText: string;
  heroUrl: string | null;
  heroAlt: string;
  storeName: string;
  logoUrl: string | null;
  logoAlt: string;
};

const fallbackHomepage: PublicHomepage = {
  storyText: STORE_STORY,
  heroUrl: null,
  heroAlt: STORE_HERO_ALT,
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
        heroUrl: media.url,
      })
      .from(homepageContent)
      .leftJoin(media, eq(homepageContent.heroMediaId, media.id))
      .limit(1);

    const [branding] = await db
      .select({
        storeName: brandingSettings.storeName,
        logoAlt: brandingSettings.logoAlt,
        logoUrl: media.url,
      })
      .from(brandingSettings)
      .leftJoin(media, eq(brandingSettings.logoMediaId, media.id))
      .limit(1);

    return {
      storyText: home?.storyText || fallbackHomepage.storyText,
      heroUrl: home?.heroUrl ?? null,
      heroAlt: home?.heroAlt || fallbackHomepage.heroAlt,
      storeName: branding?.storeName || STORE_NAME,
      logoUrl: branding?.logoUrl ?? null,
      logoAlt: branding?.logoAlt || STORE_NAME,
    };
  });
}

async function loadCategories(): Promise<PublicCategory[]> {
  return withDatabaseFallback([], async () =>
    getDb()
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
  );
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
