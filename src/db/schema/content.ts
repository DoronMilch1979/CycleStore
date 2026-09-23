import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { media } from "./media";

export const homepageContent = pgTable(
  "homepage_content",
  {
    id: integer("id").primaryKey().default(1),
    storyText: text("story_text").notNull().default(""),
    heroMediaId: uuid("hero_media_id").references(() => media.id, { onDelete: "set null" }),
    heroAlt: text("hero_alt").notNull().default(""),
    heroDisplay: text("hero_display").notNull().default("slideshow"),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("homepage_content_singleton", sql`${table.id} = 1`),
    check(
      "homepage_content_hero_display",
      sql`${table.heroDisplay} in ('slideshow', 'primary')`,
    ),
  ],
);

export const homepageImages = pgTable(
  "homepage_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (table) => [
    uniqueIndex("homepage_images_media_idx").on(table.mediaId),
    uniqueIndex("homepage_images_one_primary_idx")
      .on(table.isPrimary)
      .where(sql`${table.isPrimary} = true`),
    index("homepage_images_sort_idx").on(table.sortOrder),
  ],
);

export const brandingSettings = pgTable(
  "branding_settings",
  {
    id: integer("id").primaryKey().default(1),
    storeName: text("store_name").notNull(),
    logoMediaId: uuid("logo_media_id").references(() => media.id, { onDelete: "set null" }),
    logoAlt: text("logo_alt").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("branding_settings_singleton", sql`${table.id} = 1`)],
);

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const contactFields = pgTable(
  "contact_fields",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fieldKey: text("field_key").notNull(),
    fieldType: text("field_type").notNull(),
    label: text("label").notNull(),
    value: text("value").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("contact_fields_key_idx").on(table.fieldKey)],
);

export const banners = pgTable(
  "banners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    mediaId: uuid("media_id").references(() => media.id, { onDelete: "set null" }),
    linkUrl: text("link_url"),
    location: text("location").notNull().default("homepage"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(false),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("banners_location_sort_idx").on(table.location, table.sortOrder, table.id),
  ],
);
