import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  categories,
  categoryClosure,
  productCategories,
  productImages,
  products,
} from "@/db/schema";
import { media } from "@/db/schema/media";
import type { AppDatabase } from "@/db/types";
import { lineTotal, parseMoney } from "@/domain/money";
import { publicMaxSelectableQuantity } from "@/domain/cart/limits";
import type { GuestCart, ValidatedCart, ValidatedCartLine } from "@/domain/cart/types";
import { AppError } from "@/lib/errors";

export async function validateCartAgainstCatalog(
  db: AppDatabase,
  cart: GuestCart,
): Promise<ValidatedCart> {
  if (cart.items.length === 0) {
    return { lines: [], subtotal: "0.00", itemCount: 0, currency: "ILS" };
  }

  const productIds = cart.items.map((item) => item.productId);
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      priceAmount: products.priceAmount,
      stockQuantity: products.stockQuantity,
      isActive: products.isActive,
      imageUrl: media.url,
      imageAlt: media.altText,
    })
    .from(products)
    .leftJoin(
      productImages,
      and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true)),
    )
    .leftJoin(media, eq(media.id, productImages.mediaId))
    .where(inArray(products.id, productIds));

  const byId = new Map(rows.map((row) => [row.id, row]));
  const lines: ValidatedCartLine[] = cart.items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) {
      return {
        productId: item.productId,
        slug: "",
        name: "מוצר שאינו זמין",
        quantity: item.quantity,
        maxQuantity: 0,
        unitPrice: "0.00",
        lineTotal: "0.00",
        currency: "ILS",
        imageUrl: null,
        imageAlt: null,
        isActive: false,
        issue: "unavailable",
      };
    }

    const unitPrice = parseMoney(product.priceAmount);
    const maxQuantity = publicMaxSelectableQuantity(product.stockQuantity);
    let issue: ValidatedCartLine["issue"] = null;
    if (!product.isActive) issue = "inactive";
    else if (maxQuantity <= 0 || item.quantity > maxQuantity) {
      issue = "insufficient_stock";
    }

    const safeQuantity = Math.min(item.quantity, maxQuantity);
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      quantity: item.quantity,
      maxQuantity,
      unitPrice: unitPrice.toFixed(2),
      lineTotal: lineTotal(unitPrice, Math.max(safeQuantity, 0)).toFixed(2),
      currency: "ILS",
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
      isActive: product.isActive,
      issue,
    };
  });

  const sellable = lines.filter((line) => !line.issue);
  const subtotal = sellable
    .reduce((total, line) => total.plus(line.lineTotal), parseMoney("0"))
    .toFixed(2);

  return {
    lines,
    subtotal,
    itemCount: sellable.reduce((count, line) => count + line.quantity, 0),
    currency: "ILS",
  };
}

export async function listProductsInCategoryTree(db: AppDatabase, categoryId: string) {
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      priceAmount: products.priceAmount,
      stockQuantity: products.stockQuantity,
      isActive: products.isActive,
      imageUrl: media.url,
      imageAlt: media.altText,
    })
    .from(categoryClosure)
    .innerJoin(productCategories, eq(productCategories.categoryId, categoryClosure.descendantId))
    .innerJoin(products, eq(products.id, productCategories.productId))
    .leftJoin(
      productImages,
      and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true)),
    )
    .leftJoin(media, eq(media.id, productImages.mediaId))
    .where(and(eq(categoryClosure.ancestorId, categoryId), eq(products.isActive, true)))
    .groupBy(
      products.id,
      products.name,
      products.slug,
      products.priceAmount,
      products.stockQuantity,
      products.isActive,
      media.url,
      media.altText,
    );
}

export async function getCategoryBySlug(db: AppDatabase, slug: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return category ?? null;
}

export async function getProductBySlug(db: AppDatabase, slug: string) {
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return product ?? null;
}

export function assertQuantityWithinStock(quantity: number, stock: number) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new AppError({
      code: "INVALID_QUANTITY",
      publicMessage: "יש לבחור כמות תקינה.",
    });
  }
  const maxQuantity = publicMaxSelectableQuantity(stock);
  if (maxQuantity <= 0 || quantity > maxQuantity) {
    throw new AppError({
      code: "OUT_OF_STOCK",
      publicMessage: "הכמות המבוקשת אינה זמינה.",
    });
  }
}

export type CategoryBreadcrumb = {
  name: string;
  slug: string;
};

export async function getCategoryBreadcrumbPath(
  db: AppDatabase,
  categoryId: string,
): Promise<CategoryBreadcrumb[]> {
  const path = await db
    .select({
      name: categories.name,
      slug: categories.slug,
      isActive: categories.isActive,
    })
    .from(categoryClosure)
    .innerJoin(categories, eq(categories.id, categoryClosure.ancestorId))
    .where(eq(categoryClosure.descendantId, categoryId))
    .orderBy(desc(categoryClosure.depth));

  return path
    .filter((category) => category.isActive)
    .map((category) => ({ name: category.name, slug: category.slug }));
}

export async function getProductCategoryPath(
  db: AppDatabase,
  productId: string,
): Promise<CategoryBreadcrumb[]> {
  const assigned = await db
    .select({
      categoryId: productCategories.categoryId,
    })
    .from(productCategories)
    .where(eq(productCategories.productId, productId));

  let best: CategoryBreadcrumb[] = [];

  for (const row of assigned) {
    const crumbs = await getCategoryBreadcrumbPath(db, row.categoryId);
    if (crumbs.length > best.length) {
      best = crumbs;
    }
  }

  return best;
}

export { sql };
