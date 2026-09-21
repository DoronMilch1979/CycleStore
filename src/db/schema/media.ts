import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  mediaType: text("media_type").notNull(),
  originalFilename: text("original_filename").notNull(),
  altText: text("alt_text").notNull().default(""),
  width: integer("width"),
  height: integer("height"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
