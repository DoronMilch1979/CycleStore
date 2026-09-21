import { Decimal } from "decimal.js";
import { AppError } from "@/lib/errors";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type Money = Decimal;

const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

export function parseMoney(value: string | number | Decimal): Money {
  const raw = typeof value === "number" ? value.toString() : value.toString().trim();
  const normalized = raw.replace(/,/g, "");

  if (!MONEY_PATTERN.test(normalized)) {
    throw new AppError({
      code: "INVALID_PRICE",
      publicMessage: "יש להזין מחיר חוקי, עד שתי ספרות אחרי הנקודה.",
    });
  }

  const amount = new Decimal(normalized);
  if (!amount.isFinite() || amount.lt(0)) {
    throw new AppError({
      code: "INVALID_PRICE",
      publicMessage: "המחיר לא יכול להיות שלילי.",
    });
  }

  return amount.toDecimalPlaces(2);
}

export function moneyToDb(value: Money): string {
  return value.toFixed(2);
}

export function formatIls(value: string | number | Decimal): string {
  const amount = value instanceof Decimal ? value : parseMoney(value);
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount.toNumber());
}

export function lineTotal(unitPrice: Money, quantity: number): Money {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new AppError({
      code: "INVALID_QUANTITY",
      publicMessage: "הכמות חייבת להיות מספר שלם שאינו שלילי.",
    });
  }
  return unitPrice.times(quantity).toDecimalPlaces(2);
}

export function sumMoney(values: Money[]): Money {
  return values
    .reduce((total, value) => total.plus(value), new Decimal(0))
    .toDecimalPlaces(2);
}
