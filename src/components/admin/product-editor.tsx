"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import {
  createCategoryAction,
  createProductAction,
  deleteProductImageAction,
  moveProductImageAction,
  setProductPrimaryImageAction,
  updateProductAction,
  uploadProductImageAction,
} from "@/server/actions/catalog";
import { formAction } from "@/lib/form-action";

type CategoryOption = { id: string; name: string; parentId: string | null };

type ProductImage = {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
};

function listCategoriesByDepth(categories: CategoryOption[]) {
  const ids = new Set(categories.map((category) => category.id));
  const children = new Map<string | null, CategoryOption[]>();
  for (const category of categories) {
    const parentId = category.parentId && ids.has(category.parentId) ? category.parentId : null;
    const list = children.get(parentId) ?? [];
    list.push(category);
    children.set(parentId, list);
  }

  const ordered: Array<{ category: CategoryOption; depth: number }> = [];
  const visit = (parentId: string | null, depth: number) => {
    for (const category of children.get(parentId) ?? []) {
      ordered.push({ category, depth });
      visit(category.id, depth + 1);
    }
  };
  visit(null, 0);
  return ordered;
}

export function ProductEditor({
  productId,
  categories,
  initial,
  images = [],
}: {
  productId?: string;
  categories: CategoryOption[];
  images?: ProductImage[];
  initial?: {
    name: string;
    description: string;
    price: string;
    discountPrice: string;
    sku: string;
    stockQuantity: number;
    isActive: boolean;
    categoryIds: string[];
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imagePending, setImagePending] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [selected, setSelected] = useState<string[]>(initial?.categoryIds ?? []);
  const orderedCategories = listCategoriesByDepth(categories);

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          selected.forEach((id) => formData.append("categoryIds", id));
          const result = productId
            ? await updateProductAction(productId, formData)
            : await createProductAction(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          if (!productId && result.ok && "id" in result) {
            router.push(`/admin/products/${result.id}`);
            return;
          }
          router.refresh();
        }}
      >
        <div>
          <Label htmlFor="name">שם המוצר</Label>
          <Input id="name" name="name" defaultValue={initial?.name} required />
        </div>
        <div>
          <Label htmlFor="description">תיאור מוצר</Label>
          <Textarea id="description" name="description" defaultValue={initial?.description} />
        </div>
        <div>
          <Label htmlFor="price">מחיר (₪)</Label>
          <Input
            id="price"
            name="price"
            inputMode="numeric"
            defaultValue={initial?.price ?? "0"}
            required
          />
        </div>
        <div>
          <Label htmlFor="discountPrice">מחיר הנחה (₪)</Label>
          <Input
            id="discountPrice"
            name="discountPrice"
            inputMode="numeric"
            defaultValue={initial?.discountPrice ?? ""}
            placeholder="ללא הנחה"
          />
        </div>
        <div>
          <Label htmlFor="sku">מק״ט</Label>
          <Input id="sku" name="sku" defaultValue={initial?.sku} />
        </div>
        <div>
          <Label htmlFor="stockQuantity">מלאי נוכחי</Label>
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min={0}
            defaultValue={initial?.stockQuantity ?? 0}
          />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} />
          מוצר פעיל
        </label>
        <fieldset>
          <legend className="mb-2 font-medium">קטגוריות</legend>
          <div className="grid gap-2">
            {orderedCategories.map(({ category, depth }) => (
              <label
                key={category.id}
                className="flex items-center gap-2"
                style={{ marginInlineStart: depth * 16 }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(category.id)}
                  onChange={(event) => {
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, category.id]
                        : current.filter((id) => id !== category.id),
                    );
                  }}
                />
                {category.name}
              </label>
            ))}
          </div>
        </fieldset>
        <FieldError message={error} />
        <Button type="submit">{productId ? "שמירת מוצר" : "יצירת מוצר"}</Button>
      </form>
      <aside className="space-y-6">
        <form
          className="space-y-3 rounded-[var(--radius-md)] border border-border bg-surface p-4"
          action={formAction(createCategoryAction)}
        >
          <h2 className="font-semibold">קטגוריה חדשה</h2>
          <Input name="name" placeholder="שם קטגוריה" required />
          <select
            name="parentId"
            className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2"
            defaultValue=""
          >
            <option value="">ללא קטגוריית אב</option>
            {orderedCategories.map(({ category, depth }) => (
              <option key={category.id} value={category.id}>
                {"\u2003".repeat(depth)}
                {category.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            יצירת קטגוריה
          </Button>
        </form>
        {productId ? (
          <div className="space-y-3 rounded-[var(--radius-md)] border border-border bg-surface p-4">
            <h2 className="font-semibold">תמונות מוצר</h2>
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = event.currentTarget;
                setImagePending(true);
                setImageError(null);
                const result = await uploadProductImageAction(productId, new FormData(form));
                setImagePending(false);
                if (!result.ok) {
                  setImageError(result.error);
                  return;
                }
                form.reset();
                setUploadCount(0);
                router.refresh();
              }}
            >
              <Input
                type="file"
                name="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                onChange={(event) => setUploadCount(event.target.files?.length ?? 0)}
              />
              <Input name="altText" placeholder="טקסט חלופי" />
              {uploadCount > 1 ? (
                <p className="text-sm text-muted">בהעלאת כמה תמונות לא ניתן לקבוע תמונה ראשית.</p>
              ) : (
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="isPrimary" />
                  תמונה ראשית
                </label>
              )}
              <Button type="submit" variant="secondary" disabled={imagePending}>
                העלאת תמונות
              </Button>
            </form>
            {images.length === 0 ? (
              <p className="text-sm text-muted">אין תמונות למוצר.</p>
            ) : (
              <ul className="space-y-3">
                {images.map((image, index) => (
                  <li key={image.id} className="flex gap-3 rounded border border-border p-2">
                    <img
                      src={image.url}
                      alt={image.altText || "תמונת מוצר"}
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-sm">
                        {image.isPrimary ? <span className="font-medium">תמונה ראשית</span> : null}
                        {image.isPrimary && image.altText ? " · " : null}
                        {image.altText}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {image.isPrimary ? null : (
                          <Button
                            size="sm"
                            variant="secondary"
                            type="button"
                            disabled={imagePending}
                            onClick={async () => {
                              setImagePending(true);
                              setImageError(null);
                              const result = await setProductPrimaryImageAction(productId, image.id);
                              setImagePending(false);
                              if (!result.ok) {
                                setImageError(result.error);
                                return;
                              }
                              router.refresh();
                            }}
                          >
                            קבע כראשית
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          type="button"
                          disabled={imagePending || index === 0}
                          onClick={async () => {
                            setImagePending(true);
                            setImageError(null);
                            const result = await moveProductImageAction(productId, image.id, "up");
                            setImagePending(false);
                            if (!result.ok) {
                              setImageError(result.error);
                              return;
                            }
                            router.refresh();
                          }}
                        >
                          למעלה
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          type="button"
                          disabled={imagePending || index === images.length - 1}
                          onClick={async () => {
                            setImagePending(true);
                            setImageError(null);
                            const result = await moveProductImageAction(productId, image.id, "down");
                            setImagePending(false);
                            if (!result.ok) {
                              setImageError(result.error);
                              return;
                            }
                            router.refresh();
                          }}
                        >
                          למטה
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          type="button"
                          disabled={imagePending}
                          onClick={async () => {
                            if (!window.confirm("למחוק את התמונה?")) return;
                            setImagePending(true);
                            setImageError(null);
                            const result = await deleteProductImageAction(productId, image.id);
                            setImagePending(false);
                            if (!result.ok) {
                              setImageError(result.error);
                              return;
                            }
                            router.refresh();
                          }}
                        >
                          מחיקה
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <FieldError message={imageError} />
          </div>
        ) : (
          <p className="text-sm text-muted">לאחר יצירת המוצר ניתן להעלות תמונות.</p>
        )}
      </aside>
    </div>
  );
}
