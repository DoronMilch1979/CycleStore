export function productCardImageAlt(
  productName: string,
  imageAlt: string | null | undefined,
): string {
  const alt = imageAlt?.trim().replace(/\s+/g, " ") ?? "";
  const name = productName.trim().replace(/\s+/g, " ");
  if (!alt || alt === name) return "";
  return alt;
}
