"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { getDb } from "@/db";
import { products } from "@/db/schema/catalog";
import { setStockQuantity } from "@/domain/inventory/stock-service";
import { moneyToDb } from "@/domain/money";
import {
  assertDiscountBelowRegular,
  discountToDb,
  parseAdminDiscount,
  parseAdminPrice,
} from "@/domain/pricing";
import { cacheTags } from "@/lib/cache-tags";
import { toPublicErrorMessage } from "@/lib/errors";
import { requireAdminSession } from "@/server/authz";

export async function updateStockRowAction(input: {
  productId: string;
  stockQuantity: number;
  price: string;
  discountPrice: string;
}) {
  try {
    const admin = await requireAdminSession();
    const db = getDb();
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, input.productId))
      .limit(1);
    if (!existing) {
      return { ok: false as const, error: "המוצר לא נמצא." };
    }

    const price = parseAdminPrice(input.price);
    const discount = parseAdminDiscount(input.discountPrice);
    assertDiscountBelowRegular(discount, price);
    await setStockQuantity(db, {
      productId: input.productId,
      newQuantity: input.stockQuantity,
      actorUserId: admin.userId,
      reason: "עדכון גיליון מלאי",
    });

    const priceChanged = existing.priceAmount !== moneyToDb(price);
    const discountChanged = (existing.discountPriceAmount ?? null) !== discountToDb(discount);
    if (priceChanged || discountChanged) {
      const { productCategories } = await import("@/db/schema/catalog");
      const links = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.productId, input.productId));
      const { updateProduct } = await import("@/domain/catalog/product-service");
      await updateProduct(
        db,
        input.productId,
        {
          name: existing.name,
          description: existing.description,
          price: input.price,
          discountPrice: input.discountPrice,
          sku: existing.sku,
          isActive: existing.isActive,
          categoryIds: links.map((link) => link.categoryId),
          stockQuantity: input.stockQuantity,
        },
        admin.userId,
      );
    }

    updateTag(cacheTags.catalog);
    revalidatePath("/admin/inventory");
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}
