import { Decimal } from "decimal.js";
import { AppError } from "@/lib/errors";
import { formatIls, moneyToDb, parseMoney, type Money } from "@/domain/money";

const WHOLE_SHEKEL = /^(?:0|[1-9]\d*)$/;

export type PricedProduct = {
  priceAmount: string;
  discountPriceAmount?: string | null;
};

export type ProductPricing = {
  regular: Money;
  discount: Money | null;
  effective: Money;
  hasDiscount: boolean;
};

export function parseAdminPrice(value: string | number): Money {
  const raw = String(value).trim().replace(/,/g, "");
  if (raw.startsWith("-")) {
    throw new AppError({
      code: "INVALID_PRICE",
      publicMessage: "המחיר לא יכול להיות שלילי.",
    });
  }
  if (!WHOLE_SHEKEL.test(raw)) {
    throw new AppError({
      code: "INVALID_PRICE",
      publicMessage: "יש להזין מחיר בשקלים שלמים, ללא אגורות.",
    });
  }

  return new Decimal(raw).toDecimalPlaces(2);
}

export function parseAdminDiscount(value: string | number | null | undefined): Money | null {
  const raw = value == null ? "" : String(value).trim().replace(/,/g, "");
  if (raw === "" || raw === "0") return null;
  const amount = parseAdminPrice(raw);
  return amount.isZero() ? null : amount;
}

export function assertDiscountBelowRegular(discount: Money | null, regular: Money) {
  if (discount && discount.gte(regular)) {
    throw new AppError({
      code: "INVALID_DISCOUNT",
      publicMessage: "מחיר ההנחה חייב להיות נמוך ממחיר המוצר.",
    });
  }
}

export function resolveProductPricing(product: PricedProduct): ProductPricing {
  const regular = parseMoney(product.priceAmount);
  const raw = product.discountPriceAmount;
  if (raw == null || String(raw).trim() === "") {
    return { regular, discount: null, effective: regular, hasDiscount: false };
  }

  const discount = parseMoney(raw);
  if (!discount.gt(0)) {
    return { regular, discount: null, effective: regular, hasDiscount: false };
  }

  return { regular, discount, effective: discount, hasDiscount: true };
}

export function hasDiscount(product: PricedProduct): boolean {
  return resolveProductPricing(product).hasDiscount;
}

export function getEffectivePrice(product: PricedProduct): Money {
  return resolveProductPricing(product).effective;
}

export function formatPrice(value: string | number | Decimal): string {
  return formatIls(value);
}

export function wholeShekelDigits(value: string | number | Decimal): string {
  const amount = value instanceof Decimal ? value : parseMoney(value);
  return amount.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0);
}

export function discountInputValue(value: string | null | undefined): string {
  if (value == null || value.trim() === "") return "";
  const digits = wholeShekelDigits(value);
  return digits === "0" ? "" : digits;
}

export function discountToDb(discount: Money | null): string | null {
  return discount ? moneyToDb(discount) : null;
}
