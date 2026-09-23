"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { PLACEHOLDER_PRODUCT_SRC } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Price, ProductPrice } from "@/components/ui/price";
import { QuantityStepper } from "@/components/storefront/quantity-stepper";
import { useCart } from "@/components/cart/cart-provider";
import { assertGuestCartQuantity, revalidateGuestCart } from "@/server/actions/cart";
import type { ValidatedCart } from "@/domain/cart/types";

export function CartView() {
  const { cart, setQuantity, removeItem, clear } = useCart();
  const [validated, setValidated] = useState<ValidatedCart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await revalidateGuestCart(cart);
        setValidated(result);
        setError(null);
      } catch {
        setError("לא ניתן היה לרענן את העגלה. נסו שוב.");
      }
    });
  }, [cart]);

  if (!validated) {
    return <p>טוען את העגלה...</p>;
  }

  if (validated.lines.length === 0) {
    return (
      <div className="space-y-4">
        <p>העגלה ריקה.</p>
        <Link href="/" className="text-link">
          חזרה לחנות
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-danger">{error}</p> : null}
      <ul className="space-y-4">
        {validated.lines.map((line) => (
          <li
            key={line.productId}
            className="rounded-[var(--radius-md)] border border-border bg-surface p-4"
          >
            <div className="flex items-start gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-surface-muted">
                <Image
                  src={line.imageUrl ?? PLACEHOLDER_PRODUCT_SRC}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 space-y-1">
                {line.slug ? (
                  <Link href={`/products/${line.slug}`} className="text-link font-semibold">
                    {line.name}
                  </Link>
                ) : (
                  <p className="font-semibold">{line.name}</p>
                )}
                <p>
                  מחיר ליחידה:{" "}
                  <ProductPrice
                    priceAmount={line.regularPrice}
                    discountPriceAmount={line.discountPrice}
                  />
                </p>
                <p>
                  סה״כ: <Price amount={line.lineTotal} />
                </p>
                {line.issue === "insufficient_stock" ? (
                  <p className="text-sm text-danger">הכמות בעגלה גבוהה מהזמין כרגע.</p>
                ) : null}
                {line.issue === "unavailable" || line.issue === "inactive" ? (
                  <p className="text-sm text-danger">המוצר אינו זמין כרגע.</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <QuantityStepper
                  label={`כמות עבור ${line.name}`}
                  size="comfortable"
                  value={line.quantity}
                  min={1}
                  max={Math.max(line.maxQuantity, 1)}
                  disabled={line.maxQuantity <= 0}
                  onChange={(next) => {
                    startTransition(async () => {
                      const result = await assertGuestCartQuantity(line.productId, next);
                      if (!result.ok) {
                        setError(result.message);
                        return;
                      }
                      setQuantity(line.productId, next);
                    });
                  }}
                />
                <Button
                  variant="secondary"
                  className="min-h-11"
                  aria-label={`הסרת ${line.name} מהעגלה`}
                  onClick={() => removeItem(line.productId)}
                >
                  הסרה
                </Button>
              </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xl font-semibold">
        סה״כ לתשלום: <Price amount={validated.subtotal} />
      </p>
      <p className="text-muted">הזמנה ותשלום יתווספו בגרסה הבאה. אין אפשרות תשלום כרגע.</p>
      <Button variant="secondary" className="min-h-11" onClick={clear}>
        ריקון העגלה
      </Button>
    </div>
  );
}
