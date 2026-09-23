import "server-only";

import { eq } from "drizzle-orm";
import { productImages } from "@/db/schema/catalog";
import { banners, brandingSettings, homepageContent, homepageImages } from "@/db/schema/content";
import { media } from "@/db/schema/media";
import type { AppDatabase } from "@/db/types";

export async function mediaIsReferenced(db: AppDatabase, mediaId: string) {
  const [image] = await db
    .select({ id: productImages.id })
    .from(productImages)
    .where(eq(productImages.mediaId, mediaId))
    .limit(1);
  if (image) return true;

  const [homepageImage] = await db
    .select({ id: homepageImages.id })
    .from(homepageImages)
    .where(eq(homepageImages.mediaId, mediaId))
    .limit(1);
  if (homepageImage) return true;

  const [hero] = await db
    .select({ id: homepageContent.id })
    .from(homepageContent)
    .where(eq(homepageContent.heroMediaId, mediaId))
    .limit(1);
  if (hero) return true;

  const [logo] = await db
    .select({ id: brandingSettings.id })
    .from(brandingSettings)
    .where(eq(brandingSettings.logoMediaId, mediaId))
    .limit(1);
  if (logo) return true;

  const [banner] = await db
    .select({ id: banners.id })
    .from(banners)
    .where(eq(banners.mediaId, mediaId))
    .limit(1);
  return Boolean(banner);
}

export async function deleteMediaIfUnreferenced(db: AppDatabase, mediaId: string) {
  if (await mediaIsReferenced(db, mediaId)) return null;
  const [removed] = await db.delete(media).where(eq(media.id, mediaId)).returning();
  return removed?.storageKey ?? null;
}
