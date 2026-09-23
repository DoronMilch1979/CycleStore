import { getDb } from "@/db";
import { CategoryManager } from "@/components/admin/category-manager";
import { listCategoriesInDisplayOrder } from "@/domain/catalog/category-service";

export default async function CategoriesPage() {
  const rows = await listCategoriesInDisplayOrder(getDb());
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ניהול קטגוריות</h1>
      <CategoryManager categories={rows} />
    </div>
  );
}
