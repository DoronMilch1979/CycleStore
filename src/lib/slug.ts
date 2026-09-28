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

const MAX_PUBLIC_SLUG_LENGTH = 200;

/** True when `slug` is already a stored public slug, not a raw search string. */
export function isPublicSlug(slug: string): boolean {
  if (slug.length === 0 || slug.length > MAX_PUBLIC_SLUG_LENGTH) return false;
  try {
    return slugify(slug) === slug;
  } catch {
    return false;
  }
}

export function readPublicSlug(raw: string): string | null {
  let slug: string;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    return null;
  }
  return isPublicSlug(slug) ? slug : null;
}
