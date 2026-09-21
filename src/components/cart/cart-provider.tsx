"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { CART_STORAGE_KEY } from "@/config/site";
import { MAX_PUBLIC_LINE_QUANTITY } from "@/domain/cart/limits";
import {
  EMPTY_GUEST_CART,
  emptyGuestCart,
  normalizeGuestCart,
  type GuestCart,
  type GuestCartItem,
} from "@/domain/cart/types";

type CartContextValue = {
  cart: GuestCart;
  setQuantity: (productId: string, quantity: number) => void;
  addItem: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

let memoryCart: GuestCart = EMPTY_GUEST_CART;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function getServerSnapshot(): GuestCart {
  return EMPTY_GUEST_CART;
}

function readCart(): GuestCart {
  if (typeof window === "undefined") {
    return EMPTY_GUEST_CART;
  }
  if (!hydrated) {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      memoryCart = normalizeGuestCart(raw ? JSON.parse(raw) : null);
    } catch {
      memoryCart = EMPTY_GUEST_CART;
    }
    hydrated = true;
  }
  return memoryCart;
}

function writeCart(cart: GuestCart) {
  memoryCart = normalizeGuestCart(cart);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(memoryCart));
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useSyncExternalStore(subscribe, readCart, getServerSnapshot);

  const update = useCallback((updater: (current: GuestCart) => GuestCart) => {
    writeCart(updater(readCart()));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      itemCount: cart.items.reduce((total, item) => total + item.quantity, 0),
      addItem: (productId, quantity) => {
        update((current) => {
          const existing = current.items.find((item) => item.productId === productId);
          const nextQuantity = Math.min(
            (existing?.quantity ?? 0) + quantity,
            MAX_PUBLIC_LINE_QUANTITY,
          );
          if (nextQuantity <= 0) {
            return current;
          }
          const items: GuestCartItem[] = existing
            ? current.items.map((item) =>
                item.productId === productId ? { ...item, quantity: nextQuantity } : item,
              )
            : [...current.items, { productId, quantity: nextQuantity }];
          return { version: 1, items };
        });
      },
      setQuantity: (productId, quantity) => {
        const nextQuantity = Math.min(quantity, MAX_PUBLIC_LINE_QUANTITY);
        update((current) => ({
          version: 1,
          items:
            nextQuantity <= 0
              ? current.items.filter((item) => item.productId !== productId)
              : current.items.map((item) =>
                  item.productId === productId ? { ...item, quantity: nextQuantity } : item,
                ),
        }));
      },
      removeItem: (productId) => {
        update((current) => ({
          version: 1,
          items: current.items.filter((item) => item.productId !== productId),
        }));
      },
      clear: () => update(() => emptyGuestCart()),
    }),
    [cart, update],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used within CartProvider");
  }
  return value;
}
