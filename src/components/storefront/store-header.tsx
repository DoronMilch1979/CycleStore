"use client";

import { STORE_NAME } from "@/config/site";
import { useCart } from "@/components/cart/cart-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const roots = categories.filter((category) => !category.parentId);

  const childrenOf = (parentId: string) =>
    categories.filter((category) => category.parentId === parentId);

  const isCategoryActive = (slug: string) => {
    const current = decodeURIComponent(pathname);
    const href = `/categories/${slug}`;
    return current === href || current.startsWith(`${href}/`);
  };

  const brand = storeName || STORE_NAME;

  const cartLink = () => (
    <Link
      href="/cart"
      className="inline-flex min-h-11 shrink-0 items-center px-1 text-xs font-medium text-muted transition-colors hover:text-foreground sm:px-2 sm:text-sm"
    >
      עגלה{itemCount > 0 ? ` (${itemCount})` : ""}
    </Link>
  );

  const categoryNav = () => (
    <nav aria-label="ניווט ראשי" className="flex min-w-0 items-center justify-center gap-3 sm:gap-10">
      {roots.map((category, index) => {
        const children = childrenOf(category.id);
        return (
          <span key={category.id} className="flex items-center gap-3 sm:gap-10">
            {index > 0 ? (
              <span aria-hidden="true" className="h-4 w-px bg-border sm:h-5" />
            ) : null}
            <div className="group relative">
              <Link
                href={`/categories/${category.slug}`}
                aria-haspopup={children.length > 0 ? "true" : undefined}
                className={cn(
                  "relative inline-flex min-h-11 items-center text-sm font-semibold tracking-[0.04em] text-foreground sm:text-lg sm:tracking-[0.08em]",
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
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] md:hidden">
        <Link
          href="/"
          className="block truncate py-2.5 text-center text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          {brand}
        </Link>
        <div className="flex items-center justify-between gap-2 border-t border-border/70">
          {categoryNav()}
          {cartLink()}
        </div>
      </div>

      <div className="mx-auto hidden min-h-[var(--header-height)] w-full max-w-[var(--width-content)] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-[var(--space-page)] md:grid">
        <Link
          href="/"
          className="min-w-0 justify-self-start truncate text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          {brand}
        </Link>
        {categoryNav()}
        <div className="justify-self-end">{cartLink()}</div>
      </div>
    </header>
  );
}
