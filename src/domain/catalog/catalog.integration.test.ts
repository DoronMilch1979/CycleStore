import { afterEach, describe, expect, it } from "vitest";
import { asc, eq } from "drizzle-orm";
import { productImages } from "@/db/schema/catalog";
import {
  createCategory,
  deleteCategory,
  listDescendantIds,
  moveCategory,
} from "@/domain/catalog/category-service";
import {
  attachProductImage,
  createProduct,
  deleteProductImage,
  moveProductImage,
  setProductPrimaryImage,
} from "@/domain/catalog/product-service";
import { setStockQuantity } from "@/domain/inventory/stock-service";
import {
  getCategoryBreadcrumbPath,
  getProductCategoryPath,
  validateCartAgainstCatalog,
} from "@/domain/catalog/queries";
import { AppError } from "@/lib/errors";
import { createTestDatabase } from "@/test/pglite";

describe("catalog and inventory persistence", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  it("maintains the category closure table across nested creates and moves", async () => {
    const test = await createTestDatabase();
    close = test.close;
    const { db } = test;

    const root = await createCategory(db, { name: "אופניים" });
    const child = await createCategory(db, { name: "אופני הרים", parentId: root.id });
    const grandchild = await createCategory(db, {
      name: "אופני הרים לילדים",
      parentId: child.id,
    });
    const accessory = await createCategory(db, { name: "ציוד נלווה" });

    expect(await listDescendantIds(db, root.id)).toEqual(
      expect.arrayContaining([root.id, child.id, grandchild.id]),
    );

    await expect(moveCategory(db, root.id, grandchild.id)).rejects.toBeInstanceOf(AppError);

    await moveCategory(db, child.id, accessory.id);
    const accessoryTree = await listDescendantIds(db, accessory.id);
    expect(accessoryTree).toEqual(
      expect.arrayContaining([accessory.id, child.id, grandchild.id]),
    );
    expect(await listDescendantIds(db, root.id)).toEqual([root.id]);
  });

  it("deletes a category only when no products are assigned", async () => {
    const test = await createTestDatabase();
    close = test.close;
    const { db } = test;

    const empty = await createCategory(db, { name: "ריקה" });
    await deleteCategory(db, empty.id);
    await expect(deleteCategory(db, empty.id)).rejects.toMatchObject({ code: "NOT_FOUND" });

    const parent = await createCategory(db, { name: "הורה" });
    const child = await createCategory(db, { name: "ילד", parentId: parent.id });
    await expect(deleteCategory(db, parent.id)).rejects.toMatchObject({
      code: "CATEGORY_HAS_CHILDREN",
    });

    const occupied = await createCategory(db, { name: "תפוסה" });
    await createProduct(db, {
      name: "מוצר משויך",
      description: "תיאור",
      price: "10.00",
      isActive: true,
      categoryIds: [occupied.id],
      stockQuantity: 1,
    });
    await expect(deleteCategory(db, occupied.id)).rejects.toMatchObject({
      code: "CATEGORY_HAS_PRODUCTS",
      publicMessage: expect.stringContaining("מוצר אחד"),
    });

    await deleteCategory(db, child.id);
    await deleteCategory(db, parent.id);
  });

  it("creates products with validated prices and inventory history", async () => {
    const test = await createTestDatabase();
    close = test.close;
    const { db } = test;

    const category = await createCategory(db, { name: "קסדות" });
    await expect(
      createProduct(db, {
        name: "קסדה",
        description: "תיאור",
        price: "-10",
        isActive: true,
        categoryIds: [category.id],
        stockQuantity: 2,
      }),
    ).rejects.toBeInstanceOf(AppError);

    const product = await createProduct(db, {
      name: "קסדה",
      description: "תיאור",
      price: "199.90",
      isActive: true,
      categoryIds: [category.id],
      stockQuantity: 2,
    });

    expect(product.priceAmount).toBe("199.90");
    expect(product.stockQuantity).toBe(2);

    await expect(
      setStockQuantity(db, { productId: product.id, newQuantity: -1 }),
    ).rejects.toBeInstanceOf(AppError);

    const updated = await setStockQuantity(db, {
      productId: product.id,
      newQuantity: 5,
      reason: "ספירת מלאי",
    });
    expect(updated.stockQuantity).toBe(5);

    const cart = await validateCartAgainstCatalog(db, {
      version: 1,
      items: [{ productId: product.id, quantity: 6 }],
    });
    expect(cart.lines[0]?.issue).toBe("insufficient_stock");

    const validCart = await validateCartAgainstCatalog(db, {
      version: 1,
      items: [{ productId: product.id, quantity: 2 }],
    });
    expect(validCart.subtotal).toBe("399.80");
    expect(validCart.lines[0]?.issue).toBeNull();
  });

  it("caps public cart quantity at five even when stock is higher", async () => {
    const test = await createTestDatabase();
    close = test.close;
    const { db } = test;

    const category = await createCategory(db, { name: "אופני הרים" });
    const product = await createProduct(db, {
      name: "אופני הרים",
      description: "תיאור",
      price: "100.00",
      isActive: true,
      categoryIds: [category.id],
      stockQuantity: 20,
    });

    const overCap = await validateCartAgainstCatalog(db, {
      version: 1,
      items: [{ productId: product.id, quantity: 6 }],
    });
    expect(overCap.lines[0]?.issue).toBe("insufficient_stock");
    expect(overCap.lines[0]?.maxQuantity).toBe(5);

    const allowed = await validateCartAgainstCatalog(db, {
      version: 1,
      items: [{ productId: product.id, quantity: 5 }],
    });
    expect(allowed.lines[0]?.issue).toBeNull();
    expect(allowed.lines[0]?.maxQuantity).toBe(5);
  });

  it("builds the full category path for a product", async () => {
    const test = await createTestDatabase();
    close = test.close;
    const { db } = test;

    const root = await createCategory(db, { name: "אופניים" });
    const child = await createCategory(db, { name: "אופני הרים", parentId: root.id });
    const product = await createProduct(db, {
      name: "שם המוצר",
      description: "תיאור",
      price: "100.00",
      isActive: true,
      categoryIds: [child.id],
      stockQuantity: 1,
    });

    await expect(getProductCategoryPath(db, product.id)).resolves.toEqual([
      { name: "אופניים", slug: "אופניים" },
      { name: "אופני הרים", slug: "אופני-הרים" },
    ]);
    await expect(getCategoryBreadcrumbPath(db, child.id)).resolves.toEqual([
      { name: "אופניים", slug: "אופניים" },
      { name: "אופני הרים", slug: "אופני-הרים" },
    ]);
    await expect(getCategoryBreadcrumbPath(db, root.id)).resolves.toEqual([
      { name: "אופניים", slug: "אופניים" },
    ]);
  });

  it("sets, reorders, and deletes product images", async () => {
    const test = await createTestDatabase();
    close = test.close;
    const { db } = test;

    const category = await createCategory(db, { name: "קסדות" });
    const product = await createProduct(db, {
      name: "קסדה",
      description: "תיאור",
      price: "100.00",
      isActive: true,
      categoryIds: [category.id],
      stockQuantity: 1,
    });

    const stored = (key: string) => ({
      storageKey: key,
      url: `/media/${key}`,
      mediaType: "image/jpeg",
      originalFilename: key,
      width: null,
      height: null,
    });

    const first = await attachProductImage(db, {
      productId: product.id,
      stored: stored("a.jpg"),
      altText: "ראשונה",
      makePrimary: false,
    });
    const second = await attachProductImage(db, {
      productId: product.id,
      stored: stored("b.jpg"),
      altText: "שנייה",
      makePrimary: false,
    });
    const third = await attachProductImage(db, {
      productId: product.id,
      stored: stored("c.jpg"),
      altText: "שלישית",
      makePrimary: true,
    });

    const ordered = async () =>
      db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(asc(productImages.sortOrder));

    expect((await ordered()).map((row) => row.isPrimary)).toEqual([false, false, true]);

    await moveProductImage(db, product.id, third.image!.id, "up");
    expect((await ordered()).map((row) => row.id)).toEqual([
      first.image!.id,
      third.image!.id,
      second.image!.id,
    ]);

    await setProductPrimaryImage(db, product.id, second.image!.id);
    expect((await ordered()).find((row) => row.isPrimary)?.id).toBe(second.image!.id);

    await deleteProductImage(db, product.id, second.image!.id);
    const afterDelete = await ordered();
    expect(afterDelete.map((row) => row.id)).toEqual([first.image!.id, third.image!.id]);
    expect(afterDelete[0]?.isPrimary).toBe(true);
  });
});
