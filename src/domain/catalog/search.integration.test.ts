import { afterEach, describe, expect, it } from "vitest";
import { createCategory } from "@/domain/catalog/category-service";
import { createProduct } from "@/domain/catalog/product-service";
import { searchPublicProducts } from "@/domain/catalog/queries";
import { createTestDatabase } from "@/test/pglite";

describe("public product search", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  it("matches name, description, sku, categories, and descendants without duplicates", async () => {
    const test = await createTestDatabase();
    close = test.close;
    const { db } = test;

    const bikes = await createCategory(db, { name: "אופניים" });
    const mountain = await createCategory(db, { name: "אופני הרים", parentId: bikes.id });
    const suspension = await createCategory(db, { name: "שיכוך", parentId: mountain.id });
    const helmets = await createCategory(db, { name: "קסדות" });

    const byName = await createProduct(db, {
      name: "פנס הרים",
      description: "תאורה",
      price: "120",
      sku: "LIGHT-1",
      isActive: true,
      categoryIds: [helmets.id],
      stockQuantity: 2,
    });
    const byDescription = await createProduct(db, {
      name: "משאבה",
      description: "מתאימה לרכיבה בהרים",
      price: "80",
      sku: "PUMP-1",
      isActive: true,
      categoryIds: [helmets.id],
      stockQuantity: 2,
    });
    const bySku = await createProduct(db, {
      name: "כפפות חורף",
      description: "חמות",
      price: "90",
      sku: "HRM-1",
      isActive: true,
      categoryIds: [helmets.id],
      stockQuantity: 2,
    });
    const inCategory = await createProduct(db, {
      name: "אופני אנדורו",
      description: "שלדה",
      price: "4000",
      sku: "ENDURO-1",
      isActive: true,
      categoryIds: [mountain.id],
      stockQuantity: 1,
    });
    const inDescendant = await createProduct(db, {
      name: "בולם קדמי",
      description: "שיכוך אוויר",
      price: "900",
      sku: "FORK-1",
      isActive: true,
      categoryIds: [suspension.id],
      stockQuantity: 1,
    });
    const both = await createProduct(db, {
      name: "אופני הרים מקצועיים",
      description: "שלדה קלה",
      price: "5000",
      sku: "PRO-1",
      isActive: true,
      categoryIds: [mountain.id, suspension.id],
      stockQuantity: 1,
    });
    await createProduct(db, {
      name: "אופני הרים מוסתרים",
      description: "לא פעיל",
      price: "100",
      sku: "HIDDEN-1",
      isActive: false,
      categoryIds: [mountain.id],
      stockQuantity: 1,
    });

    const mountainResults = await searchPublicProducts(db, "הרים");
    const ids = mountainResults.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([byName.id, byDescription.id, inCategory.id, inDescendant.id, both.id]),
    );
    expect(ids).not.toContain(bySku.id);
    expect(mountainResults).toHaveLength(5);

    const skuResults = await searchPublicProducts(db, "hrm-1");
    expect(skuResults.map((product) => product.id)).toEqual([bySku.id]);

    expect(await searchPublicProducts(db, "אין כזה מוצר")).toEqual([]);
    expect(await searchPublicProducts(db, "   ")).toEqual([]);

    const percent = await createProduct(db, {
      name: "100% כביש",
      description: "צמיג",
      price: "40",
      sku: "TIRE-100",
      isActive: true,
      categoryIds: [helmets.id],
      stockQuantity: 1,
    });
    const percentResults = await searchPublicProducts(db, "100%");
    expect(percentResults.map((product) => product.id)).toEqual([percent.id]);
    expect((await searchPublicProducts(db, "%")).map((product) => product.id)).toEqual([percent.id]);
  });
});
