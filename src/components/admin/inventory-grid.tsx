"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { discountInputValue, wholeShekelDigits } from "@/domain/pricing";
import { updateStockRowAction } from "@/server/actions/inventory";

type Row = {
  id: string;
  name: string;
  sku: string | null;
  priceAmount: string;
  discountPriceAmount: string | null;
  stockQuantity: number;
  isActive: boolean;
  categoryName: string | null;
};

export function InventoryGrid({ rows }: { rows: Row[] }) {
  const [drafts, setDrafts] = useState<
    Record<string, { stock: string; price: string; discount: string }>
  >({});
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse bg-surface">
        <thead>
          <tr className="border-b border-border text-start">
            <th className="p-3">מוצר</th>
            <th className="p-3">קטגוריה</th>
            <th className="p-3">מחיר ₪</th>
            <th className="p-3">מחיר הנחה ₪</th>
            <th className="p-3">מלאי</th>
            <th className="p-3">שמירה</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const draft = drafts[row.id] ?? {
              stock: String(row.stockQuantity),
              price: wholeShekelDigits(row.priceAmount),
              discount: discountInputValue(row.discountPriceAmount),
            };
            return (
              <tr key={row.id} className="border-b border-border">
                <td className="p-3">
                  <Link
                    href={`/admin/products/${row.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {row.name}
                  </Link>
                  <div className="text-sm text-muted">{row.sku}</div>
                </td>
                <td className="p-3">{row.categoryName}</td>
                <td className="p-3">
                  <input
                    className="w-28 rounded border border-border px-2 py-1"
                    value={draft.price}
                    onChange={(event) => {
                      setDirty(true);
                      setDrafts((current) => ({
                        ...current,
                        [row.id]: { ...draft, price: event.target.value },
                      }));
                    }}
                    aria-label={`מחיר עבור ${row.name}`}
                    inputMode="numeric"
                  />
                </td>
                <td className="p-3">
                  <input
                    className="w-28 rounded border border-border px-2 py-1"
                    value={draft.discount}
                    onChange={(event) => {
                      setDirty(true);
                      setDrafts((current) => ({
                        ...current,
                        [row.id]: { ...draft, discount: event.target.value },
                      }));
                    }}
                    aria-label={`מחיר הנחה עבור ${row.name}`}
                    inputMode="numeric"
                  />
                </td>
                <td className="p-3">
                  <input
                    className="w-20 rounded border border-border px-2 py-1"
                    type="number"
                    min={0}
                    value={draft.stock}
                    onChange={(event) => {
                      setDirty(true);
                      setDrafts((current) => ({
                        ...current,
                        [row.id]: { ...draft, stock: event.target.value },
                      }));
                    }}
                    aria-label={`מלאי עבור ${row.name}`}
                  />
                </td>
                <td className="p-3">
                  <Button
                    size="sm"
                    onClick={async () => {
                      const result = await updateStockRowAction({
                        productId: row.id,
                        stockQuantity: Number(draft.stock),
                        price: draft.price,
                        discountPrice: draft.discount,
                      });
                      if (result.ok) {
                        setDirty(false);
                        setMessage("השינוי נשמר.");
                      } else {
                        setMessage(result.error);
                      }
                    }}
                  >
                    שמירה
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {message ? <p className="mt-3">{message}</p> : null}
    </div>
  );
}
