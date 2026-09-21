import { describe, expect, it } from "vitest";
import { normalizeGuestCart } from "@/domain/cart/types";

describe("guest cart persistence shape", () => {
  it("merges duplicate product rows and drops invalid quantities", () => {
    const cart = normalizeGuestCart({
      version: 1,
      items: [
        { productId: "a", quantity: 2 },
        { productId: "a", quantity: 1 },
        { productId: "b", quantity: 0 },
        { productId: "c", quantity: 1.5 },
      ],
    });

    expect(cart.items).toEqual([{ productId: "a", quantity: 3 }]);
  });

  it("returns an empty cart for unknown payloads", () => {
    expect(normalizeGuestCart(null).items).toEqual([]);
    expect(normalizeGuestCart({ version: 2, items: [] }).items).toEqual([]);
  });
});
