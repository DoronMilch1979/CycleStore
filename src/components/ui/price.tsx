import { formatShekelAmount } from "@/domain/money";
import { resolveProductPricing } from "@/domain/pricing";
import { cn } from "@/lib/cn";

export function Price({
  amount,
  className,
}: {
  amount: string | number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-[0.1875rem] font-semibold", className)} dir="ltr">
      <span className="tracking-tight">{formatShekelAmount(amount)}</span>
      <span>₪</span>
    </span>
  );
}

export function ProductPrice({
  priceAmount,
  discountPriceAmount,
  className,
}: {
  priceAmount: string;
  discountPriceAmount?: string | null;
  className?: string;
}) {
  const pricing = resolveProductPricing({ priceAmount, discountPriceAmount });
  if (!pricing.hasDiscount || !pricing.discount) {
    return <Price amount={pricing.regular.toFixed(2)} className={className} />;
  }

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <Price
        amount={pricing.regular.toFixed(2)}
        className="text-[0.85em] font-normal text-danger line-through decoration-danger"
      />
      <Price amount={pricing.effective.toFixed(2)} />
    </span>
  );
}
