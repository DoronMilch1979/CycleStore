import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { homepageContent, homepageImages } from "@/db/schema/content";
import { media } from "@/db/schema/media";
import {
  attachHomepageImage,
  deleteHomepageImage,
  importLegacyHomepageHero,
  listHomepageImages,
  moveHomepageImage,
  setHomepagePrimaryImage,
} from "@/domain/content/store-images";
import { createTestDatabase } from "@/test/pglite";

function stored(key: string) {
  return {
    storageKey: key,
    url: `/media/${key}`,
    mediaType: "image/jpeg",
    originalFilename: key,
    width: null,
    height: null,
  };
}

describe("homepage store images", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  it("stores multiple images, order, and the primary image", async () => {
    const test = await createTestDatabase();
    close = test.close;
    const { db } = test;

    const first = await attachHomepageImage(db, {
      stored: stored("hero-a.jpg"),
      altText: "ראשונה",
    });
    const second = await attachHomepageImage(db, {
      stored: stored("hero-b.jpg"),
      altText: "שנייה",
    });
    const third = await attachHomepageImage(db, {
      stored: stored("hero-c.jpg"),
      altText: "שלישית",
      makePrimary: true,
    });

    let images = await listHomepageImages(db);
    expect(images.map((image) => image.sortOrder)).toEqual([0, 1, 2]);
    expect(images.find((image) => image.isPrimary)?.id).toBe(third.image?.id);

    await moveHomepageImage(db, third.image!.id, "up");
    images = await listHomepageImages(db);
    expect(images.map((image) => image.id)).toEqual([
      first.image!.id,
      third.image!.id,
      second.image!.id,
    ]);
    expect(images.find((image) => image.isPrimary)?.id).toBe(third.image!.id);

    await setHomepagePrimaryImage(db, first.image!.id);
    const [home] = await db.select().from(homepageContent).limit(1);
    expect(home?.heroMediaId).toBe(first.media.id);

    const removedKey = await deleteHomepageImage(db, second.image!.id);
    expect(removedKey).toBe("hero-b.jpg");
    images = await listHomepageImages(db);
    expect(images.map((image) => image.id)).toEqual([first.image!.id, third.image!.id]);
    expect(images.find((image) => image.isPrimary)?.id).toBe(first.image!.id);
  });

  it("keeps a single image as primary and supports an empty gallery", async () => {
    const test = await createTestDatabase();
    close = test.close;
    const { db } = test;

    expect(await listHomepageImages(db)).toEqual([]);

    const only = await attachHomepageImage(db, {
      stored: stored("only.jpg"),
      altText: "יחידה",
    });
    const images = await listHomepageImages(db);
    expect(images).toHaveLength(1);
    expect(images[0]?.isPrimary).toBe(true);
    expect(images[0]?.id).toBe(only.image?.id);

    await deleteHomepageImage(db, only.image!.id);
    expect(await listHomepageImages(db)).toEqual([]);
    const [home] = await db.select().from(homepageContent).limit(1);
    expect(home?.heroMediaId).toBeNull();
  });

  it("imports an existing homepage image without dropping the media reference", async () => {
    const test = await createTestDatabase();
    close = test.close;
    const { db } = test;

    const [created] = await db
      .insert(media)
      .values({
        url: "/media/legacy.jpg",
        storageKey: "legacy.jpg",
        mediaType: "image/jpeg",
        originalFilename: "legacy.jpg",
        altText: "קיימת",
      })
      .returning();
    await db.insert(homepageContent).values({
      id: 1,
      storyText: "סיפור",
      heroMediaId: created!.id,
      heroAlt: "קיימת",
    });

    await importLegacyHomepageHero(db);
    const images = await listHomepageImages(db);
    expect(images).toHaveLength(1);
    expect(images[0]?.mediaId).toBe(created!.id);
    expect(images[0]?.isPrimary).toBe(true);

    const [home] = await db.select().from(homepageContent).limit(1);
    expect(home?.heroMediaId).toBe(created!.id);
    const [stillThere] = await db.select().from(media).where(eq(media.id, created!.id));
    expect(stillThere?.storageKey).toBe("legacy.jpg");
    expect(await db.select().from(homepageImages)).toHaveLength(1);
  });
});
