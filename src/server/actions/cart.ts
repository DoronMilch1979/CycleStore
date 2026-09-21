"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema/catalog";
import { publicMaxSelectableQuantity } from "@/domain/cart/limits";
import { normalizeGuestCart, type GuestCart } from "@/domain/cart/types";
import {
  assertQuantityWithinStock,
  validateCartAgainstCatalog,
} from "@/domain/catalog/queries";
import { toPublicErrorMessage } from "@/lib/errors";

export async function revalidateGuestCart(input: unknown) {
  const cart: GuestCart = normalizeGuestCart(input);
  return validateCartAgainstCatalog(getDb(), cart);
}

export async function assertGuestCartQuantity(
  productId: string,
  quantity: number,
): Promise<{ ok: true; maxQuantity: number } | { ok: false; message: string }> {
  try {
    const [product] = await getDb()
      .select({
        stockQuantity: products.stockQuantity,
        isActive: products.isActive,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product || !product.isActive) {
      return { ok: false, message: "המוצר אינו זמין כרגע." };
    }

    const maxQuantity = publicMaxSelectableQuantity(product.stockQuantity);
    if (maxQuantity <= 0) {
      return { ok: false, message: "המוצר אזל מהמלאי." };
    }

    assertQuantityWithinStock(quantity, product.stockQuantity);
    return { ok: true, maxQuantity };
  } catch (error) {
    return { ok: false, message: toPublicErrorMessage(error) };
  }
}
