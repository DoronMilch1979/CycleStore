import Image from "next/image";
import Link from "next/link";
import { PLACEHOLDER_PRODUCT_SRC } from "@/config/site";
import { Price } from "@/components/ui/price";
import { ProductCardAction } from "@/components/storefront/product-card-action";
import { publicMaxSelectableQuantity } from "@/domain/cart/limits";
import { cn } from "@/lib/cn";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  priceAmount: string;
  inStock: boolean;
  maxQuantity: number;
  imageUrl: string | null;
  imageAlt: string | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-sm)]">
      <Link
        href={`/products/${product.slug}`}
        className="absolute inset-0 z-0"
        aria-label={product.name}
      />
      <div className="pointer-events-none flex h-full flex-col">
        <div className="relative aspect-[4/3] bg-surface-muted">
          <Image
            src={product.imageUrl ?? PLACEHOLDER_PRODUCT_SRC}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col px-3 pt-3 sm:px-4 sm:pt-4">
          <h2 className="line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-snug sm:text-base">
            {product.name}
          </h2>
          <p
            className={cn(
              "mt-2 text-xs sm:text-sm",
              product.inStock ? "text-success" : "text-danger",
            )}
          >
            {product.inStock ? "במלאי" : "אזל מהמלאי"}
          </p>
        </div>
        <div className="pointer-events-none relative z-10 mt-auto flex items-center justify-between gap-1 ps-2.5 pe-1.5 pt-2 pb-2 sm:gap-2 sm:px-4 sm:pt-3 sm:pb-4">
          <p className="min-w-0 shrink text-sm leading-none sm:text-base">
            <Price amount={product.priceAmount} />
          </p>
          <div className="pointer-events-auto">
            <ProductCardAction
              productId={product.id}
              inStock={product.inStock}
              maxQuantity={product.maxQuantity}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductCardGrid({
  products,
}: {
  products: ProductCardData[];
}) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function toProductCardData(product: {
  id: string;
  name: string;
  slug: string;
  priceAmount: string;
  stockQuantity: number;
  imageUrl: string | null;
  imageAlt: string | null;
}): ProductCardData {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    priceAmount: product.priceAmount,
    inStock: product.stockQuantity > 0,
    maxQuantity: publicMaxSelectableQuantity(product.stockQuantity),
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
  };
}
