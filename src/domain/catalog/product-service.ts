import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  productCategories,
  productImages,
  productPriceHistory,
  products,
} from "@/db/schema/catalog";
import { media } from "@/db/schema/media";
import { deleteMediaIfUnreferenced } from "@/domain/media/references";
import { moneyToDb, parseMoney } from "@/domain/money";
import {
  assertDiscountBelowRegular,
  discountToDb,
  parseAdminDiscount,
  parseAdminPrice,
} from "@/domain/pricing";
import { applyStockChange } from "@/domain/inventory/stock-service";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/slug";
import type { AppDatabase } from "@/db/types";

export type ProductInput = {
  name: string;
  description: string;
  price: string;
  discountPrice?: string | null;
  sku?: string | null;
  isActive: boolean;
  categoryIds: string[];
  stockQuantity: number;
  slug?: string;
};

function pricedProduct(input: ProductInput) {
  const price = parseAdminPrice(input.price);
  const discount = parseAdminDiscount(input.discountPrice);
  assertDiscountBelowRegular(discount, price);
  return { price, discount };
}

function normalizeSku(sku: string | null | undefined) {
  const value = sku?.trim();
  return value ? value : null;
}

export async function createProduct(
  db: AppDatabase,
  input: ProductInput,
  actorUserId?: string,
) {
  const name = input.name.trim();
  if (!name) {
    throw new AppError({ code: "INVALID_PRODUCT", publicMessage: "יש להזין שם מוצר." });
  }
  if (input.categoryIds.length === 0) {
    throw new AppError({
      code: "INVALID_PRODUCT",
      publicMessage: "יש לשייך את המוצר לפחות לקטגוריה אחת.",
    });
  }

  const { price, discount } = pricedProduct(input);
  const slug = input.slug ? slugify(input.slug) : slugify(name);

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(products)
      .values({
        name,
        slug,
        description: input.description.trim(),
        sku: normalizeSku(input.sku),
        priceAmount: moneyToDb(price),
        discountPriceAmount: discountToDb(discount),
        currency: "ILS",
        stockQuantity: 0,
        isActive: input.isActive,
      })
      .returning();

    if (!created) {
      throw new AppError({
        code: "PRODUCT_CREATE_FAILED",
        publicMessage: "יצירת המוצר נכשלה.",
      });
    }

    await tx.insert(productCategories).values(
      input.categoryIds.map((categoryId) => ({
        productId: created.id,
        categoryId,
      })),
    );

    await tx.insert(productPriceHistory).values({
      productId: created.id,
      previousAmount: moneyToDb(parseMoney("0")),
      newAmount: moneyToDb(price),
      currency: "ILS",
      actorUserId: actorUserId ?? null,
    });

    if (input.stockQuantity > 0) {
      const updated = await applyStockChange(tx, {
        productId: created.id,
        newQuantity: input.stockQuantity,
        actorUserId,
        reason: "מלאי התחלתי",
      });
      return updated;
    }

    return created;
  });
}

export async function updateProduct(
  db: AppDatabase,
  productId: string,
  input: ProductInput,
  actorUserId?: string,
) {
  const { price, discount } = pricedProduct(input);
  const name = input.name.trim();
  if (!name) {
    throw new AppError({ code: "INVALID_PRODUCT", publicMessage: "יש להזין שם מוצר." });
  }
  if (input.categoryIds.length === 0) {
    throw new AppError({
      code: "INVALID_PRODUCT",
      publicMessage: "יש לשייך את המוצר לפחות לקטגוריה אחת.",
    });
  }

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existing) {
      throw new AppError({
        code: "NOT_FOUND",
        publicMessage: "המוצר לא נמצא.",
        httpStatus: 404,
      });
    }

    const [updated] = await tx
      .update(products)
      .set({
        name,
        slug: input.slug ? slugify(input.slug) : existing.slug,
        description: input.description.trim(),
        sku: normalizeSku(input.sku),
        priceAmount: moneyToDb(price),
        discountPriceAmount: discountToDb(discount),
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    if (existing.priceAmount !== moneyToDb(price)) {
      await tx.insert(productPriceHistory).values({
        productId,
        previousAmount: existing.priceAmount,
        newAmount: moneyToDb(price),
        currency: "ILS",
        actorUserId: actorUserId ?? null,
      });
    }

    await tx.delete(productCategories).where(eq(productCategories.productId, productId));
    await tx.insert(productCategories).values(
      input.categoryIds.map((categoryId) => ({
        productId,
        categoryId,
      })),
    );

    if (existing.stockQuantity !== input.stockQuantity) {
      return applyStockChange(tx, {
        productId,
        newQuantity: input.stockQuantity,
        actorUserId,
        reason: "עדכון מוצר",
      });
    }

    return updated;
  });
}

export async function attachProductImage(
  db: AppDatabase,
  options: {
    productId: string;
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
    const [createdMedia] = await tx
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

    const existing = await tx
      .select()
      .from(productImages)
      .where(eq(productImages.productId, options.productId));

    const isPrimary = options.makePrimary || existing.length === 0;
    if (isPrimary && existing.length > 0) {
      await tx
        .update(productImages)
        .set({ isPrimary: false })
        .where(eq(productImages.productId, options.productId));
    }

    const [image] = await tx
      .insert(productImages)
      .values({
        productId: options.productId,
        mediaId: createdMedia.id,
        sortOrder: existing.length,
        isPrimary,
      })
      .returning();

    return { media: createdMedia, image };
  });
}

async function listProductImages(db: AppDatabase, productId: string) {
  return db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.sortOrder), asc(productImages.id));
}

async function writeImageOrder(
  db: AppDatabase,
  orderedIds: string[],
) {
  for (const [index, imageId] of orderedIds.entries()) {
    await db.update(productImages).set({ sortOrder: index }).where(eq(productImages.id, imageId));
  }
}

export async function setProductPrimaryImage(db: AppDatabase, productId: string, imageId: string) {
  await db.transaction(async (tx) => {
    const database = tx as unknown as AppDatabase;
    const images = await listProductImages(database, productId);
    if (!images.some((image) => image.id === imageId)) {
      throw new AppError({
        code: "NOT_FOUND",
        publicMessage: "התמונה לא נמצאה.",
        httpStatus: 404,
      });
    }

    await database
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, productId));
    await database
      .update(productImages)
      .set({ isPrimary: true })
      .where(eq(productImages.id, imageId));
  });
}

export async function moveProductImage(
  db: AppDatabase,
  productId: string,
  imageId: string,
  direction: "up" | "down",
) {
  await db.transaction(async (tx) => {
    const database = tx as unknown as AppDatabase;
    const images = await listProductImages(database, productId);
    const index = images.findIndex((image) => image.id === imageId);
    if (index < 0) {
      throw new AppError({
        code: "NOT_FOUND",
        publicMessage: "התמונה לא נמצאה.",
        httpStatus: 404,
      });
    }

    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) {
      return;
    }

    const ordered = images.map((image) => image.id);
    const [moved] = ordered.splice(index, 1);
    if (!moved) return;
    ordered.splice(target, 0, moved);
    await writeImageOrder(database, ordered);
  });
}

export async function deleteProductImage(db: AppDatabase, productId: string, imageId: string) {
  return db.transaction(async (tx) => {
    const database = tx as unknown as AppDatabase;
    const [image] = await database
      .select()
      .from(productImages)
      .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)))
      .limit(1);

    if (!image) {
      throw new AppError({
        code: "NOT_FOUND",
        publicMessage: "התמונה לא נמצאה.",
        httpStatus: 404,
      });
    }

    await database.delete(productImages).where(eq(productImages.id, image.id));

    const remaining = await listProductImages(database, productId);
    if (image.isPrimary && remaining[0]) {
      await database
        .update(productImages)
        .set({ isPrimary: true })
        .where(eq(productImages.id, remaining[0].id));
    }
    await writeImageOrder(
      database,
      remaining.map((row) => row.id),
    );

    return deleteMediaIfUnreferenced(database, image.mediaId);
  });
}

export { getDb };
