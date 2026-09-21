import { describe, expect, it } from "vitest";
import { publicMaxSelectableQuantity } from "@/domain/cart/limits";

describe("publicMaxSelectableQuantity", () => {
  it("caps selectable quantity at five even when stock is higher", () => {
    expect(publicMaxSelectableQuantity(20)).toBe(5);
    expect(publicMaxSelectableQuantity(5)).toBe(5);
  });

  it("follows remaining stock when stock is below five", () => {
    expect(publicMaxSelectableQuantity(3)).toBe(3);
    expect(publicMaxSelectableQuantity(1)).toBe(1);
  });

  it("returns zero when nothing can be sold", () => {
    expect(publicMaxSelectableQuantity(0)).toBe(0);
    expect(publicMaxSelectableQuantity(-1)).toBe(0);
    expect(publicMaxSelectableQuantity(1.5)).toBe(0);
  });
});
