"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/storefront/quantity-stepper";
import { useCart } from "@/components/cart/cart-provider";
import { assertGuestCartQuantity } from "@/server/actions/cart";

export function AddToCartForm({
  productId,
  maxQuantity,
}: {
  productId: string;
  maxQuantity: number;
}) {
  const { cart, addItem } = useCart();
  const existing = cart.items.find((item) => item.productId === productId)?.quantity ?? 0;
  const remaining = Math.max(0, maxQuantity - existing);
  const [quantity, setQuantity] = useState(remaining > 0 ? 1 : 0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (maxQuantity <= 0) {
    return (
      <div className="space-y-3">
        <p className="text-danger">אזל מהמלאי</p>
        <a href="/#contact" className="inline-block text-sm font-medium text-primary underline-offset-2 hover:underline">
          צור קשר לפרטים נוספים
        </a>
      </div>
    );
  }

  if (remaining <= 0) {
    return <p className="text-sm text-muted">הכמות המרבית לעגלה כבר נוספה.</p>;
  }

  const selected = Math.min(Math.max(1, quantity), remaining);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await assertGuestCartQuantity(productId, existing + selected);
          if (!result.ok) {
            setError(result.message);
            setMessage(null);
            return;
          }
          addItem(productId, selected);
          setError(null);
          setMessage("המוצר נוסף לסל.");
        });
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="quantity" className="text-sm font-medium">
          כמות
        </label>
        <QuantityStepper
          id="quantity"
          label="כמות"
          size="snug"
          value={selected}
          min={1}
          max={remaining}
          disabled={pending}
          onChange={setQuantity}
        />
      </div>
      <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
        הוספה לסל
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}
    </form>
  );
}
