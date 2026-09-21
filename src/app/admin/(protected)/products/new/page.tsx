import { ProductEditor } from "@/components/admin/product-editor";
import { getDb } from "@/db";
import { categories } from "@/db/schema/catalog";
import { asc } from "drizzle-orm";

export default async function NewProductPage() {
  const categoryRows = await getDb()
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">הוספת מוצר חדש</h1>
      <ProductEditor categories={categoryRows} />
    </div>
  );
}
