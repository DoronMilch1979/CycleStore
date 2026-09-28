"use client";

import { useCart } from "@/components/cart/cart-provider";
import { useConfirmedQuantity } from "@/components/cart/use-confirmed-quantity";
import { QuantityStepper } from "@/components/storefront/quantity-stepper";
import { cn } from "@/lib/cn";

const ACTION_SLOT = "flex h-7 shrink-0 items-center justify-end sm:h-8";

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
  const { cart } = useCart();
  const { commit, error } = useConfirmedQuantity(productId);
  const quantity = cart.items.find((item) => item.productId === productId)?.quantity ?? 0;

  if (!inStock) {
    return (
      <div
        className={ACTION_SLOT}
        onClick={stopCardNavigation}
        onPointerDown={stopCardNavigation}
      >
        <a
          href="/#contact"
          className="text-link max-w-[5.5rem] text-end text-[0.65rem] leading-tight font-medium sm:max-w-[6.75rem] sm:text-xs"
          onClick={(event) => event.stopPropagation()}
        >
          צור קשר לפרטים נוספים
        </a>
      </div>
    );
  }

  return (
    <div
      className={cn(ACTION_SLOT, error && "h-auto flex-col items-end gap-1")}
      onClick={stopCardNavigation}
      onPointerDown={stopCardNavigation}
    >
      {quantity > 0 ? (
        <QuantityStepper
          label="כמות בסל"
          size="compact"
          value={quantity}
          min={0}
          max={maxQuantity}
          onChange={(next) => commit(next)}
        />
      ) : (
        <button
          type="button"
          disabled={maxQuantity <= 0}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            commit(1);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary-hover h-7 touch-manipulation rounded-[var(--radius-md)] px-1.5 text-[0.65rem] leading-none font-medium whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60 sm:h-8 sm:px-2 sm:text-xs"
        >
          הוספה לסל
        </button>
      )}
      {error ? (
        <p
          role="alert"
          className="text-danger max-w-[8rem] text-end text-[0.65rem] leading-tight"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
