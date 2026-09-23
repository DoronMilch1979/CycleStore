"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { STORE_LOGO_DESKTOP_SRC, STORE_LOGO_MOBILE_SRC, STORE_NAME } from "@/config/site";
import { useCart } from "@/components/cart/cart-provider";
import { DesktopProductSearch, ProductSearch } from "@/components/storefront/product-search";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PublicCategory } from "@/server/queries/public";
import { cn } from "@/lib/cn";

function BrandHomeLink({
  brand,
  src,
  width,
  height,
  sizes,
  className,
  imageClassName,
}: {
  brand: string;
  src: string;
  width: number;
  height: number;
  sizes: string;
  className: string;
  imageClassName: string;
}) {
  return (
    <Link href="/" className={className}>
      <Image
        src={src}
        alt={brand}
        width={width}
        height={height}
        sizes={sizes}
        className={imageClassName}
      />
    </Link>
  );
}

function useDesktopMenu() {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const apply = () => setDesktop(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return desktop;
}

function CategoryNav({
  instanceId,
  categories,
  pathname,
}: {
  instanceId: string;
  categories: PublicCategory[];
  pathname: string;
}) {
  const desktop = useDesktopMenu();
  const [openId, setOpenId] = useState<string | null>(null);
  const roots = categories.filter((category) => !category.parentId);

  const childrenOf = (parentId: string) =>
    categories.filter((category) => category.parentId === parentId);

  const isCategoryActive = (slug: string) => {
    const current = decodeURIComponent(pathname);
    const href = `/categories/${slug}`;
    return current === href || current.startsWith(`${href}/`);
  };

  return (
    <nav aria-label="ניווט ראשי" className="flex min-w-0 items-center justify-center gap-3 sm:gap-10">
      {roots.map((category, index) => {
        const children = childrenOf(category.id);
        const hasChildren = children.length > 0;
        const menuOpen = desktop && openId === category.id;
        const menuId = `category-menu-${instanceId}-${category.id}`;
        return (
          <span key={category.id} className="flex items-center gap-3 sm:gap-10">
            {index > 0 ? (
              <span aria-hidden="true" className="h-4 w-px bg-border sm:h-5" />
            ) : null}
            <div
              className="group relative"
              onMouseEnter={() => {
                if (desktop && hasChildren) setOpenId(category.id);
              }}
              onMouseLeave={(event) => {
                if (event.currentTarget.contains(document.activeElement)) return;
                setOpenId((current) => (current === category.id ? null : current));
              }}
              onFocus={() => {
                if (desktop && hasChildren) setOpenId(category.id);
              }}
              onBlur={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                setOpenId((current) => (current === category.id ? null : current));
              }}
            >
              <Link
                href={`/categories/${category.slug}`}
                aria-haspopup={desktop && hasChildren ? "true" : undefined}
                aria-expanded={desktop && hasChildren ? menuOpen : undefined}
                aria-controls={desktop && hasChildren ? menuId : undefined}
                className={cn(
                  "relative inline-flex min-h-11 items-center text-sm font-semibold tracking-[0.04em] text-foreground sm:text-lg sm:tracking-[0.08em]",
                  "after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 after:ease-out",
                  "hover:text-primary hover:after:scale-x-100",
                  isCategoryActive(category.slug) && "text-primary after:scale-x-100",
                )}
              >
                {category.name}
              </Link>
              {hasChildren ? (
                <div
                  id={menuId}
                  className={cn(
                    "absolute top-full left-1/2 z-50 w-max -translate-x-1/2 pt-2 opacity-0 transition",
                    "invisible hidden group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 md:block",
                    menuOpen && "visible opacity-100",
                  )}
                >
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
}

export function StoreHeader({
  storeName,
  categories,
}: {
  storeName: string;
  categories: PublicCategory[];
}) {
  const { itemCount } = useCart();
  const pathname = usePathname();
  const brand = storeName || STORE_NAME;

  const cartLink = () => (
    <Link
      href="/cart"
      className="inline-flex min-h-11 shrink-0 items-center px-1 text-xs font-medium text-muted transition-colors hover:text-foreground sm:px-2 sm:text-sm"
    >
      עגלה{itemCount > 0 ? ` (${itemCount})` : ""}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] md:hidden">
        <BrandHomeLink
          brand={brand}
          src={STORE_LOGO_MOBILE_SRC}
          width={672}
          height={168}
          sizes="224px"
          className="flex justify-center py-2"
          imageClassName="h-auto max-h-14 w-auto max-w-full"
        />
        <div className="flex items-center justify-between gap-2 border-t border-border/70">
          <CategoryNav instanceId="mobile" categories={categories} pathname={pathname} />
          {cartLink()}
        </div>
      </div>

      <div className="mx-auto hidden min-h-[var(--header-height)] w-full max-w-[var(--width-content)] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-[var(--space-page)] md:grid">
        <BrandHomeLink
          brand={brand}
          src={STORE_LOGO_DESKTOP_SRC}
          width={768}
          height={192}
          sizes="256px"
          className="inline-flex min-w-0 max-w-full items-center justify-self-start"
          imageClassName="h-auto max-h-16 w-auto max-w-full"
        />
        <CategoryNav instanceId="desktop" categories={categories} pathname={pathname} />
        <div className="flex items-center justify-self-end">
          <Suspense fallback={<span className="inline-flex size-11" />}>
            <DesktopProductSearch />
          </Suspense>
          {cartLink()}
        </div>
      </div>
      <div className="border-t border-border/70 md:hidden">
        <div className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] py-2">
          <Suspense
            fallback={
              <div className="min-h-11 w-full rounded-[var(--radius-md)] border border-border bg-background" />
            }
          >
            <ProductSearch />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
