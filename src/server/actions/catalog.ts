"use server";

import { revalidatePath, updateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { banners, brandingSettings, contactFields, homepageContent } from "@/db/schema/content";
import { createCategory, deleteCategory, moveCategory } from "@/domain/catalog/category-service";
import {
  attachProductImage,
  createProduct,
  deleteProductImage,
  moveProductImage,
  setProductPrimaryImage,
  updateProduct,
} from "@/domain/catalog/product-service";
import { setStockQuantity } from "@/domain/inventory/stock-service";
import { assertSafeImageUpload, getMediaStorage } from "@/domain/media/storage";
import { cacheTags } from "@/lib/cache-tags";
import { toPublicErrorMessage } from "@/lib/errors";
import { requireAdminSession } from "@/server/authz";

function revalidateCatalog() {
  updateTag(cacheTags.catalog);
  updateTag(cacheTags.categories);
  revalidatePath("/");
  revalidatePath("/categories", "layout");
  revalidatePath("/products", "layout");
}

export async function createProductAction(formData: FormData) {
  try {
    const admin = await requireAdminSession();
    const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);
    const product = await createProduct(
      getDb(),
      {
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        price: String(formData.get("price") ?? ""),
        sku: String(formData.get("sku") ?? ""),
        isActive: formData.get("isActive") === "on",
        categoryIds,
        stockQuantity: Number(formData.get("stockQuantity") ?? 0),
      },
      admin.userId,
    );
    revalidateCatalog();
    return { ok: true as const, id: product.id };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function updateProductAction(productId: string, formData: FormData) {
  try {
    const admin = await requireAdminSession();
    const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);
    await updateProduct(
      getDb(),
      productId,
      {
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        price: String(formData.get("price") ?? ""),
        sku: String(formData.get("sku") ?? ""),
        isActive: formData.get("isActive") === "on",
        categoryIds,
        stockQuantity: Number(formData.get("stockQuantity") ?? 0),
      },
      admin.userId,
    );
    revalidateCatalog();
    updateTag(cacheTags.product(productId));
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function updateStockAction(formData: FormData) {
  try {
    const admin = await requireAdminSession();
    const productId = String(formData.get("productId") ?? "");
    const newQuantity = Number(formData.get("stockQuantity") ?? 0);
    const price = formData.get("price");
    await setStockQuantity(getDb(), {
      productId,
      newQuantity,
      actorUserId: admin.userId,
      reason: String(formData.get("reason") ?? "עדכון מלאי"),
    });
    if (typeof price === "string" && price.length > 0) {
      await updateProduct(
        getDb(),
        productId,
        {
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
          price,
          sku: String(formData.get("sku") ?? ""),
          isActive: formData.get("isActive") !== "false",
          categoryIds: formData.getAll("categoryIds").map(String),
          stockQuantity: newQuantity,
        },
        admin.userId,
      );
    }
    revalidateCatalog();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function createCategoryAction(formData: FormData) {
  try {
    await requireAdminSession();
    const created = await createCategory(getDb(), {
      name: String(formData.get("name") ?? ""),
      parentId: String(formData.get("parentId") ?? "") || null,
    });
    revalidateCatalog();
    return { ok: true as const, id: created.id };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function deleteCategoryAction(categoryId: string) {
  try {
    await requireAdminSession();
    await deleteCategory(getDb(), categoryId);
    revalidateCatalog();
    revalidatePath("/admin/categories");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function moveCategoryAction(formData: FormData) {
  try {
    await requireAdminSession();
    await moveCategory(
      getDb(),
      String(formData.get("categoryId") ?? ""),
      String(formData.get("parentId") ?? "") || null,
    );
    revalidateCatalog();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function uploadProductImageAction(productId: string, formData: FormData) {
  try {
    await requireAdminSession();
    const files = formData
      .getAll("file")
      .filter((file): file is File => file instanceof File && file.size > 0);
    if (files.length === 0) {
      return { ok: false as const, error: "יש לבחור תמונה." };
    }

    const prepared = [];
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      prepared.push({
        file,
        bytes,
        mediaType: assertSafeImageUpload(file, bytes),
      });
    }

    const makePrimary = prepared.length === 1 && formData.get("isPrimary") === "on";
    const altText = String(formData.get("altText") ?? "");
    for (const item of prepared) {
      const stored = await getMediaStorage().put({
        bytes: item.bytes,
        mediaType: item.mediaType,
        originalFilename: item.file.name,
      });
      await attachProductImage(getDb(), {
        productId,
        stored,
        altText,
        makePrimary,
      });
    }
    revalidateCatalog();
    updateTag(cacheTags.product(productId));
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function deleteProductImageAction(productId: string, imageId: string) {
  try {
    await requireAdminSession();
    const storageKey = await deleteProductImage(getDb(), productId, imageId);
    if (storageKey) {
      await getMediaStorage().delete(storageKey);
    }
    revalidateCatalog();
    updateTag(cacheTags.product(productId));
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function setProductPrimaryImageAction(productId: string, imageId: string) {
  try {
    await requireAdminSession();
    await setProductPrimaryImage(getDb(), productId, imageId);
    revalidateCatalog();
    updateTag(cacheTags.product(productId));
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function moveProductImageAction(
  productId: string,
  imageId: string,
  direction: "up" | "down",
) {
  try {
    await requireAdminSession();
    await moveProductImage(getDb(), productId, imageId, direction);
    revalidateCatalog();
    updateTag(cacheTags.product(productId));
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function saveContactFieldAction(formData: FormData) {
  try {
    await requireAdminSession();
    const id = String(formData.get("id") ?? "");
    await getDb()
      .update(contactFields)
      .set({
        label: String(formData.get("label") ?? ""),
        value: String(formData.get("value") ?? ""),
        isActive: formData.get("isActive") === "on",
        fieldType: String(formData.get("fieldType") ?? "text"),
        updatedAt: new Date(),
      })
      .where(eq(contactFields.id, id));
    updateTag(cacheTags.contact);
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function addContactFieldAction(formData: FormData) {
  try {
    await requireAdminSession();
    await getDb().insert(contactFields).values({
      fieldKey: String(formData.get("fieldKey") ?? "").trim(),
      fieldType: String(formData.get("fieldType") ?? "text"),
      label: String(formData.get("label") ?? ""),
      value: String(formData.get("value") ?? ""),
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(formData.get("sortOrder") ?? 100),
    });
    updateTag(cacheTags.contact);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function saveBannerAction(formData: FormData) {
  try {
    await requireAdminSession();
    const id = String(formData.get("id") ?? "");
    const payload = {
      title: String(formData.get("title") ?? ""),
      subtitle: String(formData.get("subtitle") ?? "") || null,
      linkUrl: String(formData.get("linkUrl") ?? "") || null,
      location: String(formData.get("location") ?? "homepage"),
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      updatedAt: new Date(),
    };
    if (id) {
      await getDb().update(banners).set(payload).where(eq(banners.id, id));
    } else {
      await getDb().insert(banners).values(payload);
    }
    updateTag(cacheTags.banners);
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function saveBrandingAction(formData: FormData) {
  try {
    await requireAdminSession();
    await getDb()
      .update(brandingSettings)
      .set({
        storeName: String(formData.get("storeName") ?? ""),
        logoAlt: String(formData.get("logoAlt") ?? ""),
        updatedAt: new Date(),
      })
      .where(eq(brandingSettings.id, 1));
    updateTag(cacheTags.branding);
    updateTag(cacheTags.homepage);
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

const homepageImageSchema = z.object({
  heroAlt: z.string(),
});

export async function uploadHomepageImageAction(formData: FormData) {
  try {
    await requireAdminSession();
    homepageImageSchema.parse({ heroAlt: String(formData.get("heroAlt") ?? "") });
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false as const, error: "יש לבחור תמונה." };
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mediaType = assertSafeImageUpload(file, bytes);
    const stored = await getMediaStorage().put({
      bytes,
      mediaType,
      originalFilename: file.name,
    });
    const { media } = await import("@/db/schema/media");
    const [created] = await getDb()
      .insert(media)
      .values({
        url: stored.url,
        storageKey: stored.storageKey,
        mediaType: stored.mediaType,
        originalFilename: stored.originalFilename,
        altText: String(formData.get("heroAlt") ?? ""),
      })
      .returning();
    if (created) {
      await getDb()
        .update(homepageContent)
        .set({ heroMediaId: created.id, heroAlt: created.altText, updatedAt: new Date() })
        .where(eq(homepageContent.id, 1));
    }
    updateTag(cacheTags.homepage);
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}
