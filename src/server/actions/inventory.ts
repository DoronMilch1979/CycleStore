"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { getDb } from "@/db";
import { products } from "@/db/schema/catalog";
import { setStockQuantity } from "@/domain/inventory/stock-service";
import { moneyToDb, parseMoney } from "@/domain/money";
import { cacheTags } from "@/lib/cache-tags";
import { toPublicErrorMessage } from "@/lib/errors";
import { requireAdminSession } from "@/server/authz";

export async function updateStockRowAction(input: {
  productId: string;
  stockQuantity: number;
  price: string;
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

    const price = parseMoney(input.price);
    await setStockQuantity(db, {
      productId: input.productId,
      newQuantity: input.stockQuantity,
      actorUserId: admin.userId,
      reason: "עדכון גיליון מלאי",
    });

    if (existing.priceAmount !== moneyToDb(price)) {
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
          price: moneyToDb(price),
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
