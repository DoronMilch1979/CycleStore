import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { media } from "./media";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("categories_slug_idx").on(table.slug),
    index("categories_parent_id_idx").on(table.parentId),
    index("categories_active_sort_idx").on(table.isActive, table.sortOrder),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "categories_parent_id_fk",
    }).onDelete("restrict"),
  ],
);

export const categoryClosure = pgTable(
  "category_closure",
  {
    ancestorId: uuid("ancestor_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    descendantId: uuid("descendant_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    depth: integer("depth").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ancestorId, table.descendantId] }),
    index("category_closure_ancestor_depth_idx").on(table.ancestorId, table.depth),
    index("category_closure_descendant_idx").on(table.descendantId),
    check("category_closure_depth_nonnegative", sql`${table.depth} >= 0`),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    sku: text("sku"),
    priceAmount: numeric("price_amount", { precision: 12, scale: 2 }).notNull(),
    discountPriceAmount: numeric("discount_price_amount", { precision: 12, scale: 2 }),
    currency: text("currency").notNull().default("ILS"),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    uniqueIndex("products_sku_idx").on(table.sku).where(sql`${table.sku} is not null`),
    index("products_active_idx").on(table.isActive),
    index("products_name_idx").on(table.name),
    check("products_price_nonnegative", sql`${table.priceAmount} >= 0`),
    check(
      "products_discount_nonnegative",
      sql`${table.discountPriceAmount} is null or ${table.discountPriceAmount} >= 0`,
    ),
    check("products_stock_nonnegative", sql`${table.stockQuantity} >= 0`),
    check("products_currency_ils", sql`${table.currency} = 'ILS'`),
  ],
);

export const productCategories = pgTable(
  "product_categories",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index("product_categories_category_idx").on(table.categoryId),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (table) => [
    uniqueIndex("product_images_product_media_idx").on(table.productId, table.mediaId),
    uniqueIndex("product_images_one_primary_idx")
      .on(table.productId)
      .where(sql`${table.isPrimary} = true`),
    index("product_images_product_sort_idx").on(table.productId, table.sortOrder),
  ],
);

export const productPriceHistory = pgTable(
  "product_price_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    previousAmount: numeric("previous_amount", { precision: 12, scale: 2 }).notNull(),
    newAmount: numeric("new_amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("ILS"),
    actorUserId: uuid("actor_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("product_price_history_product_idx").on(table.productId, table.createdAt)],
);
