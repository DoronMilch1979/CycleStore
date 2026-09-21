"use client";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { saveBannerAction, saveBrandingAction } from "@/server/actions/catalog";
import { formAction } from "@/lib/form-action";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  linkUrl: string | null;
  location: string;
  sortOrder: number;
  isActive: boolean;
};

export function BrandingManager({
  storeName,
  logoAlt,
  banners,
}: {
  storeName: string;
  logoAlt: string;
  banners: Banner[];
}) {
  return (
    <div className="space-y-10">
      <form className="max-w-xl space-y-3" action={formAction(saveBrandingAction)}>
        <div>
          <Label htmlFor="storeName">שם החנות</Label>
          <Input id="storeName" name="storeName" defaultValue={storeName} />
        </div>
        <div>
          <Label htmlFor="logoAlt">טקסט חלופי ללוגו</Label>
          <Input id="logoAlt" name="logoAlt" defaultValue={logoAlt} />
        </div>
        <p className="text-sm text-muted">
          החלפת הלוגו מתבצעת על ידי העלאת מדיה בעתיד. כרגע ניתן לנהל את הטקסט החלופי.
        </p>
        <Button type="submit">שמירת מיתוג</Button>
      </form>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">באנרים</h2>
        {banners.map((banner) => (
          <form
            key={banner.id}
            className="grid gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-4 md:grid-cols-2"
            action={formAction(saveBannerAction)}
          >
            <input type="hidden" name="id" value={banner.id} />
            <Input name="title" defaultValue={banner.title} />
            <Input name="subtitle" defaultValue={banner.subtitle ?? ""} />
            <Input name="linkUrl" defaultValue={banner.linkUrl ?? ""} />
            <Input name="location" defaultValue={banner.location} />
            <Input name="sortOrder" type="number" defaultValue={banner.sortOrder} />
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isActive" defaultChecked={banner.isActive} />
              פעיל
            </label>
            <Button type="submit">שמירת באנר</Button>
          </form>
        ))}
        <form className="grid max-w-xl gap-3" action={formAction(saveBannerAction)}>
          <h3 className="font-medium">באנר חדש</h3>
          <Input name="title" placeholder="כותרת" required />
          <Input name="subtitle" placeholder="כותרת משנה" />
          <Input name="linkUrl" placeholder="קישור אופציונלי" />
          <Input name="location" defaultValue="homepage" />
          <Button type="submit">יצירת באנר</Button>
        </form>
        <p className="text-sm text-muted">אין ליצור באנרים עם מבצעים מומצאים.</p>
      </section>
    </div>
  );
}
