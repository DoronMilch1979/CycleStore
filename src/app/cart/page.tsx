import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { StorefrontShell } from "@/components/storefront/storefront-shell";

export const metadata: Metadata = {
  title: "עגלת קניות",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <StorefrontShell>
      <div className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] py-8 sm:py-12">
        <h1 className="mb-6 text-2xl font-bold tracking-tight sm:mb-8 sm:text-3xl">עגלת קניות</h1>
        <CartView />
      </div>
    </StorefrontShell>
  );
}
