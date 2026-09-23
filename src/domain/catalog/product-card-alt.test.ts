import { describe, expect, it } from "vitest";
import { productCardImageAlt } from "@/domain/catalog/product-card-alt";

describe("product card image alt", () => {
  it("keeps an alt that adds information beyond the product name", () => {
    expect(productCardImageAlt("אופני הרים", "אופני הרים אדומים עם בולם")).toBe(
      "אופני הרים אדומים עם בולם",
    );
  });

  it("treats a repeated product name as decorative", () => {
    expect(productCardImageAlt("אופני הרים", "אופני הרים")).toBe("");
    expect(productCardImageAlt("אופני הרים", "  אופני   הרים ")).toBe("");
    expect(productCardImageAlt("אופני הרים", null)).toBe("");
    expect(productCardImageAlt("אופני הרים", "   ")).toBe("");
  });
});
