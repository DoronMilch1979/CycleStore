"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input } from "@/components/ui/input";
import {
  createCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
} from "@/server/actions/catalog";
import { formAction } from "@/lib/form-action";

type Category = {
  id: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<{ categoryId: string; message: string } | null>(null);
  const roots = categories.filter((category) => !category.parentId);

  async function onDelete(category: Category) {
    const confirmed = window.confirm(`למחוק את הקטגוריה "${category.name}"?`);
    if (!confirmed) return;

    setPendingId(category.id);
    setError(null);
    const result = await deleteCategoryAction(category.id);
    setPendingId(null);
    if (!result.ok) {
      setError({ categoryId: category.id, message: result.error });
      return;
    }
    router.refresh();
  }

  const renderTree = (parentId: string | null, depth = 0) =>
    categories
      .filter((category) => category.parentId === parentId)
      .map((category) => (
        <li key={category.id} style={{ marginInlineStart: depth * 16 }} className="space-y-2 py-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium">{category.name}</span>
            <form action={formAction(moveCategoryAction)} className="flex items-center gap-2">
              <input type="hidden" name="categoryId" value={category.id} />
              <select
                name="parentId"
                defaultValue={category.parentId ?? ""}
                className="rounded border border-border px-2 py-1"
              >
                <option value="">שורש</option>
                {categories
                  .filter((item) => item.id !== category.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
              <Button size="sm" variant="secondary" type="submit">
                העברה
              </Button>
            </form>
            <Button
              size="sm"
              variant="danger"
              type="button"
              disabled={pendingId === category.id}
              onClick={() => onDelete(category)}
            >
              מחיקה
            </Button>
          </div>
          <FieldError message={error?.categoryId === category.id ? error.message : null} />
          <ul>{renderTree(category.id, depth + 1)}</ul>
        </li>
      ));

  return (
    <div className="space-y-8">
      <ul>{renderTree(null)}</ul>
      {roots.length === 0 ? <p>אין קטגוריות עדיין.</p> : null}
      <form className="max-w-md space-y-3" action={formAction(createCategoryAction)}>
        <h2 className="font-semibold">קטגוריה חדשה</h2>
        <Input name="name" placeholder="שם הקטגוריה" required />
        <select
          name="parentId"
          className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2"
          defaultValue=""
        >
          <option value="">קטגוריית על</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <Button type="submit">יצירה</Button>
      </form>
    </div>
  );
}
