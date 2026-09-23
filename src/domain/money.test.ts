import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { formatIls, lineTotal, parseMoney, sumMoney } from "@/domain/money";

describe("money", () => {
  it("parses valid ILS amounts", () => {
    expect(parseMoney("10").toFixed(2)).toBe("10.00");
    expect(parseMoney("10.5").toFixed(2)).toBe("10.50");
    expect(parseMoney("10.50").toFixed(2)).toBe("10.50");
  });

  it("rejects negative and invalid prices", () => {
    expect(() => parseMoney("-1")).toThrow(AppError);
    expect(() => parseMoney("1.234")).toThrow(AppError);
    expect(() => parseMoney("abc")).toThrow(AppError);
  });

  it("formats prices in whole shekels without agorot", () => {
    const formatted = formatIls("1234.00");
    expect(formatted).not.toMatch(/[.,]00\b/);
    expect(formatted).toMatch(/1[,.\u00a0]?234|1234/);
    expect(formatted.includes("₪") || formatted.includes("ILS")).toBe(true);
  });

  it("calculates line totals and cart subtotal with decimal precision", () => {
    const unit = parseMoney("19.99");
    const line = lineTotal(unit, 3);
    expect(line.toFixed(2)).toBe("59.97");
    expect(sumMoney([line, parseMoney("0.03")]).toFixed(2)).toBe("60.00");
  });
});
