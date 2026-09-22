"use client";

import { cn } from "@/lib/cn";

export function QuantityStepper({
  id,
  value,
  min = 1,
  max,
  disabled,
  onChange,
  label,
  size = "snug",
  className,
}: {
  id?: string;
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  label: string;
  size?: "compact" | "snug" | "comfortable";
  className?: string;
  onChange: (next: number) => void;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const compact = size === "compact";
  const snug = size === "snug" || compact;

  return (
    <div
      className={cn(
        "inline-flex items-center",
        compact
          ? "h-7"
          : snug
            ? "h-8"
            : "rounded-[var(--radius-md)] border border-border bg-surface",
        className,
      )}
    >
      <button
        type="button"
        className={cn(
          "shrink-0 touch-manipulation leading-none disabled:opacity-40",
          compact
            ? "flex h-7 min-w-6 items-center justify-center rounded-s-[var(--radius-md)] bg-primary px-1 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            : snug
              ? "flex h-8 min-w-7 items-center justify-center rounded-s-[var(--radius-md)] bg-primary px-1.5 text-base font-semibold text-primary-foreground hover:bg-primary-hover"
              : "flex size-10 items-center justify-center text-lg",
        )}
        aria-label={`הקטנת ${label}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        −
      </button>
      <span
        id={id}
        aria-live="polite"
        aria-label={label}
        className={cn(
          "text-center tabular-nums",
          compact
            ? "flex h-7 min-w-5 items-center justify-center bg-success/10 px-1 text-xs font-semibold text-success"
            : snug
              ? "flex h-8 min-w-8 items-center justify-center bg-success/10 px-1.5 text-sm font-semibold text-success"
              : "min-w-8 text-base",
        )}
      >
        {value}
      </span>
      <button
        type="button"
        className={cn(
          "shrink-0 touch-manipulation leading-none disabled:opacity-40",
          compact
            ? "flex h-7 min-w-6 items-center justify-center rounded-e-[var(--radius-md)] bg-primary px-1 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            : snug
              ? "flex h-8 min-w-7 items-center justify-center rounded-e-[var(--radius-md)] bg-primary px-1.5 text-base font-semibold text-primary-foreground hover:bg-primary-hover"
              : "flex size-10 items-center justify-center text-lg",
        )}
        aria-label={`הגדלת ${label}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        +
      </button>
    </div>
  );
}
