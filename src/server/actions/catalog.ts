"use server";

import { revalidatePath, updateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema/catalog";
import { banners, brandingSettings, contactFields, siteSettings } from "@/db/schema/content";
import { ACCESSIBILITY_SETTINGS_KEY } from "@/domain/content/accessibility-statement";
import {
  createCategory,
  deleteCategory,
  moveCategory,
  moveCategoryOrder,
} from "@/domain/catalog/category-service";
import {
  attachHomepageImage,
  deleteHomepageImage,
  importLegacyHomepageHero,
  moveHomepageImage,
  setHomepagePrimaryImage,
} from "@/domain/content/store-images";
import { discountInputValue } from "@/domain/pricing";
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
        discountPrice: String(formData.get("discountPrice") ?? ""),
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
        discountPrice: String(formData.get("discountPrice") ?? ""),
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
      const db = getDb();
      const [existing] = await db
        .select({ discountPriceAmount: products.discountPriceAmount })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);
      await updateProduct(
        db,
        productId,
        {
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
          price,
          discountPrice: formData.has("discountPrice")
            ? String(formData.get("discountPrice") ?? "")
            : discountInputValue(existing?.discountPriceAmount),
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

export async function reorderCategoryAction(categoryId: string, direction: "up" | "down") {
  try {
    await requireAdminSession();
    await moveCategoryOrder(getDb(), categoryId, direction);
    revalidateCatalog();
    revalidatePath("/admin/categories");
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

export async function saveAccessibilitySettingsAction(formData: FormData) {
  try {
    await requireAdminSession();
    const value = {
      contactName: String(formData.get("contactName") ?? "").trim().slice(0, 120),
      premisesAccessibility: String(formData.get("premisesAccessibility") ?? "")
        .trim()
        .slice(0, 4000),
      coordinatorAppointed: formData.get("coordinatorAppointed") === "on",
    };
    await getDb()
      .insert(siteSettings)
      .values({
        key: ACCESSIBILITY_SETTINGS_KEY,
        value,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value,
          updatedAt: new Date(),
        },
      });
    updateTag(cacheTags.accessibility);
    revalidatePath("/accessibility");
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
    const storeName = String(formData.get("storeName") ?? "");
    const logoAlt = String(formData.get("logoAlt") ?? "");
    await getDb()
      .insert(brandingSettings)
      .values({ id: 1, storeName, logoAlt })
      .onConflictDoUpdate({
        target: brandingSettings.id,
        set: { storeName, logoAlt, updatedAt: new Date() },
      });
    updateTag(cacheTags.branding);
    updateTag(cacheTags.homepage);
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

function revalidateHomepage() {
  updateTag(cacheTags.homepage);
  revalidatePath("/");
  revalidatePath("/admin/content/homepage");
}

export async function uploadHomepageImageAction(formData: FormData) {
  try {
    await requireAdminSession();
    const files = formData
      .getAll("file")
      .filter((file): file is File => file instanceof File && file.size > 0);
    if (files.length === 0) {
      return { ok: false as const, error: "יש לבחור תמונה." };
    }

    const db = getDb();
    await importLegacyHomepageHero(db);
    const makePrimary = files.length === 1 && formData.get("isPrimary") === "on";
    const altText = String(formData.get("altText") ?? formData.get("heroAlt") ?? "");

    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mediaType = assertSafeImageUpload(file, bytes);
      const stored = await getMediaStorage().put({
        bytes,
        mediaType,
        originalFilename: file.name,
      });
      await attachHomepageImage(db, { stored, altText, makePrimary });
    }

    revalidateHomepage();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function deleteHomepageImageAction(imageId: string) {
  try {
    await requireAdminSession();
    const db = getDb();
    await importLegacyHomepageHero(db);
    const storageKey = await deleteHomepageImage(db, imageId);
    if (storageKey) {
      await getMediaStorage().delete(storageKey);
    }
    revalidateHomepage();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function setHomepagePrimaryImageAction(imageId: string) {
  try {
    await requireAdminSession();
    const db = getDb();
    await importLegacyHomepageHero(db);
    await setHomepagePrimaryImage(db, imageId);
    revalidateHomepage();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function moveHomepageImageAction(imageId: string, direction: "up" | "down") {
  try {
    await requireAdminSession();
    const db = getDb();
    await importLegacyHomepageHero(db);
    await moveHomepageImage(db, imageId, direction);
    revalidateHomepage();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}
