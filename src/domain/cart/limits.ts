export const MAX_PUBLIC_LINE_QUANTITY = 5;

export function publicMaxSelectableQuantity(stockQuantity: number): number {
  if (!Number.isInteger(stockQuantity) || stockQuantity <= 0) {
    return 0;
  }
  return Math.min(MAX_PUBLIC_LINE_QUANTITY, stockQuantity);
}
