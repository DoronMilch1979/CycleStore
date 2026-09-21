import "./load-env";
import "server-only";

import { eq } from "drizzle-orm";
import { STORE_NAME } from "@/config/site";
import {
  STORE_CONTACT_DEFAULTS,
  STORE_HERO_ALT,
  STORE_STORY,
} from "@/config/store-content";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema/catalog";
import { banners, brandingSettings, contactFields, homepageContent } from "@/db/schema/content";
import { user } from "@/db/schema/auth";
import { userProfiles } from "@/db/schema/profiles";
import { createCategory } from "@/domain/catalog/category-service";
import { createProduct } from "@/domain/catalog/product-service";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createAuth } from "@/lib/auth-factory";
import type { AppDatabase } from "@/db/types";

const INITIAL_CATEGORIES = [
  { name: "אופניים", parentName: null },
  { name: "אופני הרים", parentName: "אופניים" },
  { name: "אופניים חשמליים", parentName: "אופניים" },
  { name: "אופניים לילדים", parentName: "אופניים" },
  { name: "ציוד נלווה", parentName: null },
  { name: "קסדות", parentName: "ציוד נלווה" },
  { name: "כפפות", parentName: "ציוד נלווה" },
  { name: "סבלים", parentName: "ציוד נלווה" },
  { name: "בקבוקים ושקיות שתיה", parentName: "ציוד נלווה" },
] as const;

const DEMO_PRODUCTS = [
  {
    name: "אופני הרים 29 אינץ׳",
    slug: "mtb-29",
    sku: "DEMO-MTB-29",
    categoryName: "אופני הרים",
    price: "3490.00",
    stockQuantity: 4,
    description:
      "אופני הרים לגלגל 29 אינץ׳, מתאימים לשבילי הצפון ולרכיבה יומית. דגם הדגמה לצורך ניווט באתר.",
  },
  {
    name: "אופני הרים לנשים",
    slug: "mtb-women",
    sku: "DEMO-MTB-W",
    categoryName: "אופני הרים",
    price: "3890.00",
    stockQuantity: 2,
    description: "שלדה מותאמת לגזרה, בלמי דיסק והילוכים לשטח. דגם הדגמה.",
  },
  {
    name: "אופניים חשמליים עירוניים",
    slug: "ebike-city",
    sku: "DEMO-EBIKE-CITY",
    categoryName: "אופניים חשמליים",
    price: "7990.00",
    stockQuantity: 3,
    description: "אופניים חשמליים לעיר עם סוללה נשלפת וסיוע לדוושה. דגם הדגמה.",
  },
  {
    name: "אופניים חשמליים לשטח",
    slug: "ebike-trail",
    sku: "DEMO-EBIKE-TRAIL",
    categoryName: "אופניים חשמליים",
    price: "9490.00",
    stockQuantity: 1,
    description: "אופניים חשמליים לשבילים, עם מתלה וטווח סוללה לרכיבות ארוכות. דגם הדגמה.",
  },
  {
    name: "אופני ילדים 16 אינץ׳",
    slug: "kids-16",
    sku: "DEMO-KIDS-16",
    categoryName: "אופניים לילדים",
    price: "890.00",
    stockQuantity: 6,
    description: "אופני ילדים עם גלגלי עזר נשלפים. דגם הדגמה.",
  },
  {
    name: "אופני BMX",
    slug: "bmx-kids",
    sku: "DEMO-BMX",
    categoryName: "אופניים לילדים",
    price: "1290.00",
    stockQuantity: 3,
    description: "אופני BMX לפארק ולשכונה. דגם הדגמה.",
  },
  {
    name: "קסדת רכיבה למבוגרים",
    slug: "helmet-adult",
    sku: "DEMO-HELM-A",
    categoryName: "קסדות",
    price: "249.00",
    stockQuantity: 12,
    description: "קסדה מאווררת עם רצועות כוונון. דגם הדגמה.",
  },
  {
    name: "קסדת ילדים",
    slug: "helmet-kids",
    sku: "DEMO-HELM-K",
    categoryName: "קסדות",
    price: "149.00",
    stockQuantity: 8,
    description: "קסדת ילדים קלה עם אבזם בטיחות. דגם הדגמה.",
  },
  {
    name: "כפפות רכיבה",
    slug: "gloves",
    sku: "DEMO-GLOVES",
    categoryName: "כפפות",
    price: "79.00",
    stockQuantity: 15,
    description: "כפפות קיץ עם כף יד מרופדת. דגם הדגמה.",
  },
  {
    name: "סבל אחורי",
    slug: "rear-rack",
    sku: "DEMO-RACK",
    categoryName: "סבלים",
    price: "189.00",
    stockQuantity: 5,
    description: "סבל אחורי לנשיאת תיקים וסלסלה. דגם הדגמה.",
  },
  {
    name: "בקבוק שתייה 750 מ״ל",
    slug: "bottle-750",
    sku: "DEMO-BOTTLE",
    categoryName: "בקבוקים ושקיות שתיה",
    price: "39.00",
    stockQuantity: 20,
    description: "בקבוק לשלדה, מתאים לכלוב סטנדרטי. דגם הדגמה.",
  },
  {
    name: "שקית שתייה 2 ליטר",
    slug: "hydration-pack",
    sku: "DEMO-HYDRO",
    categoryName: "בקבוקים ושקיות שתיה",
    price: "129.00",
    stockQuantity: 7,
    description: "שקית שתייה לטיולים ולשטח. דגם הדגמה.",
  },
  {
    name: "מנעול שרשרת",
    slug: "chain-lock",
    sku: "DEMO-LOCK",
    categoryName: "ציוד נלווה",
    price: "119.00",
    stockQuantity: 0,
    description: "מנעול שרשרת לאופניים. דגם הדגמה — כרגע אזל מהמלאי.",
  },
  {
    name: "משאבה לרצפה",
    slug: "floor-pump",
    sku: "DEMO-PUMP",
    categoryName: "ציוד נלווה",
    price: "159.00",
    stockQuantity: 4,
    description: "משאבת רצפה עם מד לחץ. דגם הדגמה.",
  },
] as const;

async function seedCategories(db: AppDatabase) {
  const existing = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories);
  const created = new Map(existing.map((row) => [row.name, row.id]));

  for (const category of INITIAL_CATEGORIES) {
    if (created.has(category.name)) {
      continue;
    }
    const parentId = category.parentName ? created.get(category.parentName) : null;
    const record = await createCategory(db, {
      name: category.name,
      parentId: parentId ?? null,
      isActive: true,
    });
    created.set(category.name, record.id);
  }

  return created;
}

async function seedCms(db: AppDatabase) {
  await db
    .insert(homepageContent)
    .values({
      id: 1,
      storyText: STORE_STORY,
      heroAlt: STORE_HERO_ALT,
    })
    .onConflictDoUpdate({
      target: homepageContent.id,
      set: {
        storyText: STORE_STORY,
        heroAlt: STORE_HERO_ALT,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(brandingSettings)
    .values({
      id: 1,
      storeName: STORE_NAME,
      logoAlt: STORE_NAME,
    })
    .onConflictDoUpdate({
      target: brandingSettings.id,
      set: {
        storeName: STORE_NAME,
        logoAlt: STORE_NAME,
        updatedAt: new Date(),
      },
    });

  for (const field of STORE_CONTACT_DEFAULTS) {
    const isActive = "isActive" in field ? Boolean(field.isActive) : field.value.trim().length > 0;
    await db
      .insert(contactFields)
      .values({
        fieldKey: field.fieldKey,
        fieldType: field.fieldType,
        label: field.label,
        value: field.value,
        sortOrder: field.sortOrder,
        isActive,
      })
      .onConflictDoUpdate({
        target: contactFields.fieldKey,
        set: {
          fieldType: field.fieldType,
          label: field.label,
          value: field.value,
          sortOrder: field.sortOrder,
          isActive,
          updatedAt: new Date(),
        },
      });
  }

  const existingBanners = await db.select({ id: banners.id }).from(banners).limit(1);
  if (existingBanners.length === 0) {
    await db.insert(banners).values({
      title: "סדנה, שדרוג ומכירה במקום אחד",
      subtitle: "א׳–ה׳ 08:00–19:00 · ו׳ 08:00–14:00 · שבת סגור",
      location: "homepage",
      sortOrder: 0,
      isActive: true,
    });
  }
}

async function seedDemoProducts(db: AppDatabase, categoryIds: Map<string, string>) {
  const existing = await db.select({ slug: products.slug }).from(products);
  const slugs = new Set(existing.map((row) => row.slug));

  for (const product of DEMO_PRODUCTS) {
    if (slugs.has(product.slug)) {
      continue;
    }
    const categoryId = categoryIds.get(product.categoryName);
    if (!categoryId) {
      throw new Error(`Missing category for demo product: ${product.categoryName}`);
    }
    await createProduct(db, {
      name: product.name,
      slug: product.slug,
      description: product.description,
      sku: product.sku,
      price: product.price,
      isActive: true,
      categoryIds: [categoryId],
      stockQuantity: product.stockQuantity,
    });
  }
}

async function seedAdmin() {
  const password = env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!password) {
    logger.info("Skipping admin seed; ADMIN_BOOTSTRAP_PASSWORD is not set.");
    return;
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, env.ADMIN_BOOTSTRAP_USERNAME))
    .limit(1);

  if (existing) {
    return;
  }

  const ctx = await createAuth(db, { withNextCookies: false }).$context;
  const hash = await ctx.password.hash(password);
  const created = await ctx.internalAdapter.createUser(
    {
      name: "מנהל מערכת",
      email: env.ADMIN_BOOTSTRAP_EMAIL,
      username: env.ADMIN_BOOTSTRAP_USERNAME,
      displayUsername: env.ADMIN_BOOTSTRAP_USERNAME,
      emailVerified: true,
    },
    { method: "admin" },
  );

  await ctx.internalAdapter.createAccount({
    userId: created.id,
    accountId: created.id,
    providerId: "credential",
    password: hash,
  });

  await db
    .insert(userProfiles)
    .values({
      userId: created.id,
      role: "ADMIN",
      mustChangePassword: true,
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        role: "ADMIN",
        mustChangePassword: true,
        updatedAt: new Date(),
      },
    });
}

export async function seedDatabase() {
  const db = getDb();
  const categoryIds = await seedCategories(db);
  await seedCms(db);
  await seedDemoProducts(db, categoryIds);
  await seedAdmin();
  logger.info("Database seed completed");
}

if (import.meta.url === `file://${process.argv[1].replaceAll("\\", "/")}` || process.argv[1]?.endsWith("seed.ts")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error("Database seed failed", { error: String(error) });
      process.exit(1);
    });
}
