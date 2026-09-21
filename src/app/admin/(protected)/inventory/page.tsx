import { and, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, productCategories, products } from "@/db/schema/catalog";
import { InventoryGrid } from "@/components/admin/inventory-grid";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : "";
  const db = getDb();

  const categoryRows = await db.select().from(categories);
  const conditions = [];
  if (q) conditions.push(or(ilike(products.name, `%${q}%`), ilike(products.sku, `%${q}%`)));
  if (categoryId) conditions.push(eq(productCategories.categoryId, categoryId));

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      priceAmount: products.priceAmount,
      stockQuantity: products.stockQuantity,
      isActive: products.isActive,
      categoryName: sql<string>`string_agg(${categories.name}, ', ')`,
    })
    .from(products)
    .leftJoin(productCategories, eq(productCategories.productId, products.id))
    .leftJoin(categories, eq(categories.id, productCategories.categoryId))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(
      products.id,
      products.name,
      products.sku,
      products.priceAmount,
      products.stockQuantity,
      products.isActive,
    );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">עדכון מלאי</h1>
      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="חיפוש"
          className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2"
        />
        <select
          name="categoryId"
          defaultValue={categoryId}
          className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2"
        >
          <option value="">כל הקטגוריות</option>
          {categoryRows.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-primary-foreground">
          סינון
        </button>
      </form>
      <InventoryGrid rows={rows} />
    </div>
  );
}
