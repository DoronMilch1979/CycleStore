"use client";

import { useTransition } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/storefront/quantity-stepper";
import { assertGuestCartQuantity } from "@/server/actions/cart";
import { cn } from "@/lib/cn";

const ACTION_SLOT =
  "flex h-8 w-[6.75rem] shrink-0 items-center justify-end sm:w-[7.25rem]";

function stopCardNavigation(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export function ProductCardAction({
  productId,
  inStock,
  maxQuantity,
}: {
  productId: string;
  inStock: boolean;
  maxQuantity: number;
}) {
  const { cart, addItem, setQuantity, removeItem } = useCart();
  const [pending, startTransition] = useTransition();
  const quantity = cart.items.find((item) => item.productId === productId)?.quantity ?? 0;

  if (!inStock) {
    return (
      <div className={ACTION_SLOT} onClick={stopCardNavigation} onPointerDown={stopCardNavigation}>
        <a
          href="/#contact"
          className="text-end text-[0.7rem] font-medium leading-tight text-muted underline-offset-2 hover:text-primary hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          צור קשר לפרטים נוספים
        </a>
      </div>
    );
  }

  if (quantity > 0) {
    return (
      <div className={ACTION_SLOT} onClick={stopCardNavigation} onPointerDown={stopCardNavigation}>
        <QuantityStepper
          label="כמות בסל"
          size="snug"
          className="w-full"
          value={quantity}
          min={0}
          max={maxQuantity}
          disabled={pending}
          onChange={(next) => {
            startTransition(async () => {
              if (next <= 0) {
                removeItem(productId);
                return;
              }
              const result = await assertGuestCartQuantity(productId, next);
              if (!result.ok) {
                return;
              }
              setQuantity(productId, next);
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className={ACTION_SLOT} onClick={stopCardNavigation} onPointerDown={stopCardNavigation}>
      <button
        type="button"
        disabled={pending || maxQuantity <= 0}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          startTransition(async () => {
            const result = await assertGuestCartQuantity(productId, 1);
            if (!result.ok) {
              return;
            }
            addItem(productId, 1);
          });
        }}
        className={cn(
          "h-8 w-full rounded-[var(--radius-md)] bg-primary px-2 text-[0.7rem] font-medium leading-none text-primary-foreground touch-manipulation hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs",
        )}
      >
        הוספה לסל
      </button>
    </div>
  );
}
