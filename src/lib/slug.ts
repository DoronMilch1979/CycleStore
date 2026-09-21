export function slugify(input: string): string {
  const slug = input
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  if (!slug) {
    throw new Error("Cannot build a slug from an empty value");
  }

  return slug;
}
