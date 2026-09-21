import { and, eq, sql } from "drizzle-orm";
import { products } from "@/db/schema";
import { inventoryMovements } from "@/db/schema/inventory";
import type { AppDatabase } from "@/db/types";
import { AppError } from "@/lib/errors";

type DbExecutor = Pick<AppDatabase, "select" | "insert" | "update">;

export async function applyStockChange(
  db: DbExecutor,
  options: {
    productId: string;
    newQuantity: number;
    actorUserId?: string | null;
    reason?: string | null;
  },
) {
  if (!Number.isInteger(options.newQuantity) || options.newQuantity < 0) {
    throw new AppError({
      code: "INVALID_STOCK",
      publicMessage: "כמות המלאי לא יכולה להיות שלילית.",
    });
  }

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, options.productId))
    .for("update")
    .limit(1);

  if (!product) {
    throw new AppError({
      code: "NOT_FOUND",
      publicMessage: "המוצר לא נמצא.",
      httpStatus: 404,
    });
  }

  if (product.stockQuantity === options.newQuantity) {
    return product;
  }

  await db.insert(inventoryMovements).values({
    productId: product.id,
    previousQuantity: product.stockQuantity,
    newQuantity: options.newQuantity,
    quantityDelta: options.newQuantity - product.stockQuantity,
    actorUserId: options.actorUserId ?? null,
    reason: options.reason ?? null,
  });

  const [updated] = await db
    .update(products)
    .set({
      stockQuantity: options.newQuantity,
      updatedAt: new Date(),
    })
    .where(
      and(eq(products.id, product.id), sql`${products.stockQuantity} = ${product.stockQuantity}`),
    )
    .returning();

  if (!updated) {
    throw new AppError({
      code: "STOCK_CONFLICT",
      publicMessage: "המלאי עודכן במקביל. רעננו את המסך ונסו שוב.",
    });
  }

  return updated;
}

export async function setStockQuantity(
  db: AppDatabase,
  options: {
    productId: string;
    newQuantity: number;
    actorUserId?: string | null;
    reason?: string | null;
  },
) {
  return db.transaction(async (tx) => applyStockChange(tx, options));
}
