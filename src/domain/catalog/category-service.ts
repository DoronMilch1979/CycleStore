import { and, asc, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { categories, categoryClosure, productCategories } from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/slug";

export type CategoryRecord = typeof categories.$inferSelect;

export type CategoryInput = {
  name: string;
  slug?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

async function assertNotDescendant(
  db: AppDatabase,
  categoryId: string,
  prospectiveParentId: string,
) {
  const [row] = await db
    .select({ depth: categoryClosure.depth })
    .from(categoryClosure)
    .where(
      and(
        eq(categoryClosure.ancestorId, categoryId),
        eq(categoryClosure.descendantId, prospectiveParentId),
      ),
    )
    .limit(1);

  if (row) {
    throw new AppError({
      code: "INVALID_CATEGORY_MOVE",
      publicMessage: "לא ניתן להעביר קטגוריה אל תחת צאצא שלה.",
    });
  }
}

function parentFilter(parentId: string | null) {
  return parentId ? eq(categories.parentId, parentId) : isNull(categories.parentId);
}

async function nextSortOrder(db: AppDatabase, parentId: string | null, exceptId?: string) {
  const filters = [parentFilter(parentId)];
  if (exceptId) {
    filters.push(sql`${categories.id} <> ${exceptId}`);
  }
  const [row] = await db
    .select({
      maxOrder: sql<number>`coalesce(max(${categories.sortOrder}), -1)`,
    })
    .from(categories)
    .where(and(...filters));
  return Number(row?.maxOrder ?? -1) + 1;
}

export async function listCategoriesInDisplayOrder(db: AppDatabase, activeOnly = false) {
  return db
    .select()
    .from(categories)
    .where(activeOnly ? eq(categories.isActive, true) : undefined)
    .orderBy(asc(categories.sortOrder), asc(categories.name), asc(categories.id));
}

export async function createCategory(db: AppDatabase, input: CategoryInput) {
  const name = input.name.trim();
  if (!name) {
    throw new AppError({
      code: "INVALID_CATEGORY",
      publicMessage: "יש להזין שם קטגוריה.",
    });
  }

  const slug = input.slug ? slugify(input.slug) : slugify(name);

  return db.transaction(async (tx) => {
    const database = tx as unknown as AppDatabase;
    const parentId = input.parentId ?? null;
    const [created] = await tx
      .insert(categories)
      .values({
        name,
        slug,
        parentId,
        sortOrder: input.sortOrder ?? (await nextSortOrder(database, parentId)),
        isActive: input.isActive ?? true,
      })
      .returning();

    if (!created) {
      throw new AppError({
        code: "CATEGORY_CREATE_FAILED",
        publicMessage: "יצירת הקטגוריה נכשלה.",
      });
    }

    await tx.insert(categoryClosure).values({
      ancestorId: created.id,
      descendantId: created.id,
      depth: 0,
    });

    if (created.parentId) {
      const ancestors = await tx
        .select()
        .from(categoryClosure)
        .where(eq(categoryClosure.descendantId, created.parentId));

      if (ancestors.length === 0) {
        throw new AppError({
          code: "INVALID_PARENT_CATEGORY",
          publicMessage: "קטגוריית האב לא נמצאה.",
        });
      }

      await tx.insert(categoryClosure).values(
        ancestors.map((ancestor) => ({
          ancestorId: ancestor.ancestorId,
          descendantId: created.id,
          depth: ancestor.depth + 1,
        })),
      );
    }

    return created;
  });
}

export async function moveCategory(
  db: AppDatabase,
  categoryId: string,
  newParentId: string | null,
) {
  if (newParentId === categoryId) {
    throw new AppError({
      code: "INVALID_CATEGORY_MOVE",
      publicMessage: "קטגוריה לא יכולה להיות האב של עצמה.",
    });
  }

  return db.transaction(async (tx) => {
    const [category] = await tx
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!category) {
      throw new AppError({
        code: "NOT_FOUND",
        publicMessage: "הקטגוריה לא נמצאה.",
        httpStatus: 404,
      });
    }

    if (newParentId) {
      await assertNotDescendant(tx as unknown as AppDatabase, categoryId, newParentId);
    }

    const subtree = await tx
      .select({ descendantId: categoryClosure.descendantId })
      .from(categoryClosure)
      .where(eq(categoryClosure.ancestorId, categoryId));
    const subtreeIds = subtree.map((row) => row.descendantId);

    await tx.delete(categoryClosure).where(
      and(
        inArray(categoryClosure.descendantId, subtreeIds),
        sql`${categoryClosure.ancestorId} NOT IN (${sql.join(
          subtreeIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      ),
    );

    const database = tx as unknown as AppDatabase;
    await tx
      .update(categories)
      .set({
        parentId: newParentId,
        sortOrder: await nextSortOrder(database, newParentId, categoryId),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId));

    if (newParentId) {
      const newAncestors = await tx
        .select()
        .from(categoryClosure)
        .where(eq(categoryClosure.descendantId, newParentId));

      const subtreeRows = await tx
        .select()
        .from(categoryClosure)
        .where(eq(categoryClosure.ancestorId, categoryId));

      const inserts = [];
      for (const ancestor of newAncestors) {
        for (const node of subtreeRows) {
          inserts.push({
            ancestorId: ancestor.ancestorId,
            descendantId: node.descendantId,
            depth: ancestor.depth + node.depth + 1,
          });
        }
      }
      if (inserts.length > 0) {
        await tx.insert(categoryClosure).values(inserts);
      }
    }

    const [updated] = await tx
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);
    return updated;
  });
}

export async function moveCategoryOrder(
  db: AppDatabase,
  categoryId: string,
  direction: "up" | "down",
) {
  return db.transaction(async (tx) => {
    const [category] = await tx
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!category) {
      throw new AppError({
        code: "NOT_FOUND",
        publicMessage: "הקטגוריה לא נמצאה.",
        httpStatus: 404,
      });
    }

    const siblings = await tx
      .select()
      .from(categories)
      .where(parentFilter(category.parentId))
      .orderBy(asc(categories.sortOrder), asc(categories.name), asc(categories.id));

    const index = siblings.findIndex((sibling) => sibling.id === categoryId);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= siblings.length) {
      return category;
    }

    const ordered = siblings.map((sibling) => sibling.id);
    const [moved] = ordered.splice(index, 1);
    if (!moved) return category;
    ordered.splice(target, 0, moved);

    for (const [sortOrder, id] of ordered.entries()) {
      await tx
        .update(categories)
        .set({ sortOrder, updatedAt: new Date() })
        .where(eq(categories.id, id));
    }

    const [updated] = await tx.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
    return updated ?? category;
  });
}

function assignedProductsMessage(productCount: number) {
  if (productCount === 1) {
    return "לא ניתן למחוק את הקטגוריה כי משויך אליה מוצר אחד. יש להסיר את השיוך מהמוצר לפני המחיקה.";
  }
  return `לא ניתן למחוק את הקטגוריה כי משויכים אליה ${productCount} מוצרים. יש להסיר את השיוך מהמוצרים לפני המחיקה.`;
}

export async function deleteCategory(db: AppDatabase, categoryId: string) {
  await db.transaction(async (tx) => {
    const [category] = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!category) {
      throw new AppError({
        code: "NOT_FOUND",
        publicMessage: "הקטגוריה לא נמצאה.",
        httpStatus: 404,
      });
    }

    const [assigned] = await tx
      .select({ productCount: count() })
      .from(productCategories)
      .where(eq(productCategories.categoryId, categoryId));
    const productCount = Number(assigned?.productCount ?? 0);
    if (productCount > 0) {
      throw new AppError({
        code: "CATEGORY_HAS_PRODUCTS",
        publicMessage: assignedProductsMessage(productCount),
      });
    }

    const [child] = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, categoryId))
      .limit(1);
    if (child) {
      throw new AppError({
        code: "CATEGORY_HAS_CHILDREN",
        publicMessage:
          "לא ניתן למחוק את הקטגוריה כי יש לה תת-קטגוריות. יש להעביר או למחוק אותן תחילה.",
      });
    }

    await tx.delete(categories).where(eq(categories.id, categoryId));
  });
}

export async function listDescendantIds(db: AppDatabase, categoryId: string) {
  const rows = await db
    .select({ id: categoryClosure.descendantId })
    .from(categoryClosure)
    .where(eq(categoryClosure.ancestorId, categoryId));
  return rows.map((row) => row.id);
}

export async function listAncestorIds(db: AppDatabase, categoryId: string) {
  const rows = await db
    .select({
      id: categoryClosure.ancestorId,
      depth: categoryClosure.depth,
    })
    .from(categoryClosure)
    .where(eq(categoryClosure.descendantId, categoryId))
    .orderBy(asc(categoryClosure.depth));
  return rows;
}

export async function listCategoryTree(db: AppDatabase, activeOnly = false) {
  const rows = await db
    .select()
    .from(categories)
    .where(activeOnly ? eq(categories.isActive, true) : undefined)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const byParent = new Map<string | null, CategoryRecord[]>();
  for (const row of rows) {
    const key = row.parentId;
    const list = byParent.get(key) ?? [];
    list.push(row);
    byParent.set(key, list);
  }

  type TreeNode = CategoryRecord & { children: TreeNode[] };
  const build = (parentId: string | null): TreeNode[] =>
    (byParent.get(parentId) ?? []).map((node) => ({
      ...node,
      children: build(node.id),
    }));

  return build(null);
}
