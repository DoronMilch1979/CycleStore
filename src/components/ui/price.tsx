import { formatIls } from "@/domain/money";

export function Price({ amount }: { amount: string | number }) {
  return (
    <span className="font-semibold tracking-tight" dir="ltr">
      {formatIls(amount)}
    </span>
  );
}
