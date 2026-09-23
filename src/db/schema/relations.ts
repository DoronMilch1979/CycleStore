import { relations } from "drizzle-orm";
import { account, session, user } from "./auth";
import {
  categories,
  categoryClosure,
  productCategories,
  productImages,
  productPriceHistory,
  products,
} from "./catalog";
import {
  banners,
  brandingSettings,
  contactFields,
  homepageContent,
  homepageImages,
} from "./content";
import { inventoryMovements } from "./inventory";
import { media } from "./media";
import { userProfiles } from "./profiles";

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  profile: one(userProfiles, {
    fields: [user.id],
    references: [userProfiles.userId],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const userProfileRelations = relations(userProfiles, ({ one }) => ({
  user: one(user, { fields: [userProfiles.userId], references: [user.id] }),
}));

export const categoryRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "category_parent",
  }),
  children: many(categories, { relationName: "category_parent" }),
  ancestorRows: many(categoryClosure, { relationName: "closure_descendant" }),
  descendantRows: many(categoryClosure, { relationName: "closure_ancestor" }),
  productLinks: many(productCategories),
}));

export const categoryClosureRelations = relations(categoryClosure, ({ one }) => ({
  ancestor: one(categories, {
    fields: [categoryClosure.ancestorId],
    references: [categories.id],
    relationName: "closure_ancestor",
  }),
  descendant: one(categories, {
    fields: [categoryClosure.descendantId],
    references: [categories.id],
    relationName: "closure_descendant",
  }),
}));

export const productRelations = relations(products, ({ many }) => ({
  categoryLinks: many(productCategories),
  images: many(productImages),
  priceHistory: many(productPriceHistory),
  inventoryMovements: many(inventoryMovements),
}));

export const productCategoryRelations = relations(productCategories, ({ one }) => ({
  product: one(products, {
    fields: [productCategories.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id],
  }),
}));

export const productImageRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  media: one(media, {
    fields: [productImages.mediaId],
    references: [media.id],
  }),
}));

export const mediaRelations = relations(media, ({ many }) => ({
  productImages: many(productImages),
  homepageImages: many(homepageImages),
}));

export const homepageImageRelations = relations(homepageImages, ({ one }) => ({
  media: one(media, {
    fields: [homepageImages.mediaId],
    references: [media.id],
  }),
}));

export const homepageContentRelations = relations(homepageContent, ({ one }) => ({
  heroMedia: one(media, {
    fields: [homepageContent.heroMediaId],
    references: [media.id],
  }),
}));

export const brandingSettingsRelations = relations(brandingSettings, ({ one }) => ({
  logoMedia: one(media, {
    fields: [brandingSettings.logoMediaId],
    references: [media.id],
  }),
}));

export const bannerRelations = relations(banners, ({ one }) => ({
  media: one(media, {
    fields: [banners.mediaId],
    references: [media.id],
  }),
}));

export const contactFieldRelations = relations(contactFields, () => ({}));
