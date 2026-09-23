import "server-only";

import { asc, eq } from "drizzle-orm";
import { homepageContent, homepageImages } from "@/db/schema/content";
import { media } from "@/db/schema/media";
import type { AppDatabase } from "@/db/types";
import { deleteMediaIfUnreferenced } from "@/domain/media/references";
import { AppError } from "@/lib/errors";

export async function listHomepageImages(db: AppDatabase) {
  return db
    .select({
      id: homepageImages.id,
      mediaId: homepageImages.mediaId,
      url: media.url,
      altText: media.altText,
      isPrimary: homepageImages.isPrimary,
      sortOrder: homepageImages.sortOrder,
    })
    .from(homepageImages)
    .innerJoin(media, eq(media.id, homepageImages.mediaId))
    .orderBy(asc(homepageImages.sortOrder), asc(homepageImages.id));
}

async function writeHomepageImageOrder(db: AppDatabase, orderedIds: string[]) {
  for (const [index, imageId] of orderedIds.entries()) {
    await db.update(homepageImages).set({ sortOrder: index }).where(eq(homepageImages.id, imageId));
  }
}

async function syncHomepageHeroPointer(db: AppDatabase) {
  const images = await db
    .select()
    .from(homepageImages)
    .orderBy(asc(homepageImages.sortOrder), asc(homepageImages.id));
  const primary = images.find((image) => image.isPrimary) ?? images[0] ?? null;

  await db
    .insert(homepageContent)
    .values({
      id: 1,
      storyText: "",
      heroMediaId: primary?.mediaId ?? null,
    })
    .onConflictDoUpdate({
      target: homepageContent.id,
      set: {
        heroMediaId: primary?.mediaId ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function importLegacyHomepageHero(db: AppDatabase) {
  const [home] = await db.select().from(homepageContent).limit(1);
  if (!home?.heroMediaId) return;

  const existing = await db.select({ id: homepageImages.id }).from(homepageImages).limit(1);
  if (existing.length > 0) return;

  await db.insert(homepageImages).values({
    mediaId: home.heroMediaId,
    sortOrder: 0,
    isPrimary: true,
  });
}

export async function attachHomepageImage(
  db: AppDatabase,
  options: {
    stored: {
      storageKey: string;
      url: string;
      mediaType: string;
      originalFilename: string;
      width: number | null;
      height: number | null;
    };
    altText: string;
    makePrimary?: boolean;
  },
) {
  return db.transaction(async (tx) => {
    const database = tx as unknown as AppDatabase;
    const [createdMedia] = await database
      .insert(media)
      .values({
        url: options.stored.url,
        storageKey: options.stored.storageKey,
        mediaType: options.stored.mediaType,
        originalFilename: options.stored.originalFilename,
        altText: options.altText,
        width: options.stored.width,
        height: options.stored.height,
      })
      .returning();

    if (!createdMedia) {
      throw new AppError({
        code: "MEDIA_CREATE_FAILED",
        publicMessage: "שמירת התמונה נכשלה.",
      });
    }

    const existing = await database.select().from(homepageImages);
    const isPrimary = options.makePrimary || existing.length === 0;
    if (isPrimary && existing.length > 0) {
      await database.update(homepageImages).set({ isPrimary: false });
    }

    const [image] = await database
      .insert(homepageImages)
      .values({
        mediaId: createdMedia.id,
        sortOrder: existing.length,
        isPrimary,
      })
      .returning();

    await syncHomepageHeroPointer(database);
    return { media: createdMedia, image };
  });
}

export async function setHomepagePrimaryImage(db: AppDatabase, imageId: string) {
  await db.transaction(async (tx) => {
    const database = tx as unknown as AppDatabase;
    const images = await database.select().from(homepageImages);
    if (!images.some((image) => image.id === imageId)) {
      throw new AppError({
        code: "NOT_FOUND",
        publicMessage: "התמונה לא נמצאה.",
        httpStatus: 404,
      });
    }

    await database.update(homepageImages).set({ isPrimary: false });
    await database.update(homepageImages).set({ isPrimary: true }).where(eq(homepageImages.id, imageId));
    await syncHomepageHeroPointer(database);
  });
}

export async function moveHomepageImage(db: AppDatabase, imageId: string, direction: "up" | "down") {
  await db.transaction(async (tx) => {
    const database = tx as unknown as AppDatabase;
    const images = await database
      .select()
      .from(homepageImages)
      .orderBy(asc(homepageImages.sortOrder), asc(homepageImages.id));
    const index = images.findIndex((image) => image.id === imageId);
    if (index < 0) {
      throw new AppError({
        code: "NOT_FOUND",
        publicMessage: "התמונה לא נמצאה.",
        httpStatus: 404,
      });
    }

    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) return;

    const ordered = images.map((image) => image.id);
    const [moved] = ordered.splice(index, 1);
    if (!moved) return;
    ordered.splice(target, 0, moved);
    await writeHomepageImageOrder(database, ordered);
  });
}

export async function deleteHomepageImage(db: AppDatabase, imageId: string) {
  return db.transaction(async (tx) => {
    const database = tx as unknown as AppDatabase;
    const [image] = await database
      .select()
      .from(homepageImages)
      .where(eq(homepageImages.id, imageId))
      .limit(1);

    if (!image) {
      throw new AppError({
        code: "NOT_FOUND",
        publicMessage: "התמונה לא נמצאה.",
        httpStatus: 404,
      });
    }

    await database.delete(homepageImages).where(eq(homepageImages.id, image.id));
    const remaining = await database
      .select()
      .from(homepageImages)
      .orderBy(asc(homepageImages.sortOrder), asc(homepageImages.id));

    if (image.isPrimary && remaining[0]) {
      await database
        .update(homepageImages)
        .set({ isPrimary: true })
        .where(eq(homepageImages.id, remaining[0].id));
    }
    await writeHomepageImageOrder(
      database,
      remaining.map((row) => row.id),
    );
    await syncHomepageHeroPointer(database);
    return deleteMediaIfUnreferenced(database, image.mediaId);
  });
}
