import { Decimal } from "decimal.js";

export type GuestCartItem = {
  productId: string;
  quantity: number;
};

export type GuestCart = {
  version: 1;
  items: GuestCartItem[];
};

export type ValidatedCartLine = {
  productId: string;
  slug: string;
  name: string;
  quantity: number;
  maxQuantity: number;
  unitPrice: string;
  lineTotal: string;
  currency: "ILS";
  imageUrl: string | null;
  imageAlt: string | null;
  isActive: boolean;
  issue: "unavailable" | "insufficient_stock" | "inactive" | null;
};

export type ValidatedCart = {
  lines: ValidatedCartLine[];
  subtotal: string;
  itemCount: number;
  currency: "ILS";
};

export const EMPTY_GUEST_CART: GuestCart = Object.freeze({
  version: 1,
  items: Object.freeze([]) as unknown as GuestCartItem[],
});

export function emptyGuestCart(): GuestCart {
  return { version: 1, items: [] };
}

export function normalizeGuestCart(input: unknown): GuestCart {
  if (!input || typeof input !== "object") {
    return emptyGuestCart();
  }
  const record = input as Record<string, unknown>;
  if (record.version !== 1 || !Array.isArray(record.items)) {
    return emptyGuestCart();
  }

  const merged = new Map<string, number>();
  for (const item of record.items) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.productId !== "string" || row.productId.length === 0) continue;
    const quantity = typeof row.quantity === "number" ? row.quantity : Number(row.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) continue;
    merged.set(row.productId, (merged.get(row.productId) ?? 0) + quantity);
  }

  return {
    version: 1,
    items: [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity })),
  };
}

export function cartSubtotal(lines: ValidatedCartLine[]): Decimal {
  return lines
    .filter((line) => !line.issue)
    .reduce((total, line) => total.plus(line.lineTotal), new Decimal(0))
    .toDecimalPlaces(2);
}
