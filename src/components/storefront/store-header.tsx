"use client";

import { STORE_NAME } from "@/config/site";
import { useCart } from "@/components/cart/cart-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { PublicCategory } from "@/server/queries/public";
import { cn } from "@/lib/cn";

export function StoreHeader({
  storeName,
  categories,
}: {
  storeName: string;
  categories: PublicCategory[];
}) {
  const { itemCount } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const roots = categories.filter((category) => !category.parentId);

  const childrenOf = (parentId: string) =>
    categories.filter((category) => category.parentId === parentId);

  const close = () => setOpen(false);

  const isCategoryActive = (slug: string) => {
    const current = decodeURIComponent(pathname);
    const href = `/categories/${slug}`;
    return current === href || current.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto grid min-h-[var(--header-height)] w-full max-w-[var(--width-content)] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-[var(--space-page)]">
        <Link
          href="/"
          className="min-w-0 justify-self-start truncate text-xs font-medium text-muted transition-colors hover:text-foreground sm:text-sm"
          onClick={close}
        >
          {storeName || STORE_NAME}
        </Link>

        <nav aria-label="ניווט ראשי" className="flex items-center justify-center gap-5 sm:gap-10">
          {roots.map((category, index) => {
            const children = childrenOf(category.id);
            return (
              <span key={category.id} className="flex items-center gap-5 sm:gap-10">
                {index > 0 ? (
                  <span aria-hidden="true" className="h-4 w-px bg-border sm:h-5" />
                ) : null}
                <div className="group relative">
                  <Link
                    href={`/categories/${category.slug}`}
                    onClick={close}
                    aria-haspopup={children.length > 0 ? "true" : undefined}
                    className={cn(
                      "relative inline-flex min-h-11 items-center text-[0.95rem] font-semibold tracking-[0.06em] text-foreground sm:text-lg sm:tracking-[0.08em]",
                      "after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 after:ease-out",
                      "hover:text-primary hover:after:scale-x-100",
                      isCategoryActive(category.slug) && "text-primary after:scale-x-100",
                    )}
                  >
                    {category.name}
                  </Link>
                  {children.length > 0 ? (
                    <div className="invisible absolute top-full left-1/2 z-50 hidden w-max -translate-x-1/2 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 md:block">
                      <ul className="min-w-40 rounded-[var(--radius-md)] border border-border bg-surface py-1 text-start shadow-[var(--shadow-md)]">
                        {children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/categories/${child.slug}`}
                              onClick={close}
                              className={cn(
                                "flex min-h-11 items-center px-4 text-sm whitespace-nowrap hover:bg-surface-muted hover:text-primary",
                                isCategoryActive(child.slug) && "text-primary",
                              )}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </span>
            );
          })}
        </nav>

        <div className="flex items-center justify-self-end">
          <Link
            href="/cart"
            className="inline-flex min-h-11 items-center px-2 text-xs font-medium text-muted transition-colors hover:text-foreground sm:text-sm"
            onClick={close}
          >
            עגלה{itemCount > 0 ? ` (${itemCount})` : ""}
          </Link>
          <button
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-xs font-medium text-muted transition-colors hover:text-foreground md:hidden"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "סגירה" : "תפריט"}
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-border px-[var(--space-page)] py-3 md:hidden"
          aria-label="ניווט בנייד"
        >
          <ul className="flex flex-col">
            {roots.map((category) => {
              const children = childrenOf(category.id);
              if (children.length === 0) {
                return null;
              }
              return (
                <li key={category.id} className="border-b border-border/70 py-2 last:border-b-0">
                  <p className="px-0 pt-1 text-xs font-semibold tracking-wide text-muted">
                    {category.name}
                  </p>
                  <ul className="mt-1 flex flex-col">
                    {children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/categories/${child.slug}`}
                          className="flex min-h-11 items-center text-sm"
                          onClick={close}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
