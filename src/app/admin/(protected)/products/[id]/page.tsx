import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ProductEditor } from "@/components/admin/product-editor";
import { getDb } from "@/db";
import { categories, productCategories, productImages, products } from "@/db/schema/catalog";
import { media } from "@/db/schema/media";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) notFound();

  const [categoryRows, selected, images] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select().from(productCategories).where(eq(productCategories.productId, id)),
    db
      .select({
        id: productImages.id,
        url: media.url,
        altText: media.altText,
        isPrimary: productImages.isPrimary,
        sortOrder: productImages.sortOrder,
      })
      .from(productImages)
      .innerJoin(media, eq(media.id, productImages.mediaId))
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.sortOrder), asc(productImages.id)),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">עדכון מוצר</h1>
      <ProductEditor
        productId={product.id}
        categories={categoryRows}
        images={images}
        initial={{
          name: product.name,
          description: product.description,
          price: product.priceAmount,
          sku: product.sku ?? "",
          stockQuantity: product.stockQuantity,
          isActive: product.isActive,
          categoryIds: selected.map((row) => row.categoryId),
        }}
      />
    </div>
  );
}
