"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { readGuestCart, useCart } from "@/components/cart/cart-provider";
import { assertGuestCartQuantity } from "@/server/actions/cart";

/**
 * Writes the guest cart immediately, then checks stock.
 * A rejected check restores the previous quantity. The browser cart is not trusted
 * for price or for checkout.
 */
export function useConfirmedQuantity(productId: string) {
  const { addItem, setQuantity, removeItem } = useCart();
  const requestId = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const commit = useCallback(
    (next: number) => {
      const current =
        readGuestCart().items.find((item) => item.productId === productId)?.quantity ?? 0;
      if (next === current) return;

      if (next <= 0) {
        removeItem(productId);
        setError(null);
        return;
      }

      if (current <= 0) addItem(productId, next);
      else setQuantity(productId, next);
      setError(null);

      const id = ++requestId.current;
      startTransition(async () => {
        const result = await assertGuestCartQuantity(productId, next);
        if (requestId.current !== id) return;
        if (!result.ok) {
          if (current <= 0) removeItem(productId);
          else setQuantity(productId, current);
          setError(result.message);
        }
      });
    },
    [addItem, productId, removeItem, setQuantity, startTransition],
  );

  return { commit, error };
}
