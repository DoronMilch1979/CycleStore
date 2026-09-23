export const cacheTags = {
  homepage: "homepage",
  contact: "contact",
  accessibility: "accessibility",
  branding: "branding",
  banners: "banners",
  catalog: "catalog",
  categories: "categories",
  product: (id: string) => `product:${id}`,
  productSlug: (slug: string) => `product-slug:${slug}`,
  categorySlug: (slug: string) => `category-slug:${slug}`,
} as const;
