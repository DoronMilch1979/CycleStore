"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/storefront/quantity-stepper";
import { useCart } from "@/components/cart/cart-provider";
import { useConfirmedQuantity } from "@/components/cart/use-confirmed-quantity";

export function AddToCartForm({
  productId,
  maxQuantity,
}: {
  productId: string;
  maxQuantity: number;
}) {
  const { cart } = useCart();
  const { commit, error } = useConfirmedQuantity(productId);
  const existing = cart.items.find((item) => item.productId === productId)?.quantity ?? 0;
  const remaining = Math.max(0, maxQuantity - existing);
  const [quantity, setQuantity] = useState(remaining > 0 ? 1 : 0);
  const [message, setMessage] = useState<string | null>(null);

  if (maxQuantity <= 0) {
    return (
      <div className="space-y-3">
        <p className="text-danger">אזל מהמלאי</p>
        <a href="/#contact" className="text-link inline-block text-sm font-medium">
          צור קשר לפרטים נוספים
        </a>
      </div>
    );
  }

  if (remaining <= 0) {
    return <p className="text-muted text-sm">הכמות המרבית לעגלה כבר נוספה.</p>;
  }

  const selected = Math.min(Math.max(1, quantity), remaining);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        commit(existing + selected);
        setMessage("המוצר נוסף לסל.");
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
          onChange={setQuantity}
        />
      </div>
      <Button type="submit" className="min-h-11 w-full sm:w-auto">
        הוספה לסל
      </Button>
      {error ? (
        <p className="text-danger text-sm">{error}</p>
      ) : message ? (
        <p className="text-success text-sm">{message}</p>
      ) : null}
    </form>
  );
}
