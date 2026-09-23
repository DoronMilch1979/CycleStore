import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { formatPrice, getEffectivePrice, hasDiscount, parseAdminDiscount, parseAdminPrice } from "@/domain/pricing";

describe("admin price validation", () => {
  it("accepts whole shekel amounts", () => {
    expect(parseAdminPrice("100").toFixed(2)).toBe("100.00");
    expect(parseAdminPrice("249").toFixed(2)).toBe("249.00");
    expect(parseAdminPrice("1890").toFixed(2)).toBe("1890.00");
    expect(parseAdminPrice("0").toFixed(2)).toBe("0.00");
  });

  it("rejects decimal and negative prices", () => {
    expect(() => parseAdminPrice("99.90")).toThrow(AppError);
    expect(() => parseAdminPrice("249.5")).toThrow(AppError);
    expect(() => parseAdminPrice("-20")).toThrow(AppError);
    expect(() => parseAdminPrice("10.00")).toThrow(AppError);
  });

  it("treats an empty or zero discount as inactive", () => {
    expect(parseAdminDiscount("")).toBeNull();
    expect(parseAdminDiscount(null)).toBeNull();
    expect(parseAdminDiscount(undefined)).toBeNull();
    expect(parseAdminDiscount("0")).toBeNull();
    expect(parseAdminDiscount("250")?.toFixed(2)).toBe("250.00");
  });
});

describe("discount pricing", () => {
  it("uses the regular price when there is no discount", () => {
    const product = { priceAmount: "300.00", discountPriceAmount: null };
    expect(hasDiscount(product)).toBe(false);
    expect(getEffectivePrice(product).toFixed(2)).toBe("300.00");
    expect(hasDiscount({ priceAmount: "300.00", discountPriceAmount: "0.00" })).toBe(false);
  });

  it("uses a positive discount price as the effective price", () => {
    const product = { priceAmount: "300.00", discountPriceAmount: "250.00" };
    expect(hasDiscount(product)).toBe(true);
    expect(getEffectivePrice(product).toFixed(2)).toBe("250.00");
  });

  it("formats public prices without agorot", () => {
    expect(formatPrice("249.00")).not.toMatch(/[.,]00/);
    expect(formatPrice("1890.00")).not.toContain(".00");
    expect(formatPrice("249.00")).toMatch(/249/);
  });
});
