import { getDb } from "@/db";
import { categories } from "@/db/schema/catalog";
import { CategoryManager } from "@/components/admin/category-manager";
import { asc } from "drizzle-orm";

export default async function CategoriesPage() {
  const rows = await getDb()
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ניהול קטגוריות</h1>
      <CategoryManager categories={rows} />
    </div>
  );
}
