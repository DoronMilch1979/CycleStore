import { getDb } from "@/db";
import { banners, brandingSettings } from "@/db/schema/content";
import { BrandingManager } from "@/components/admin/branding-manager";
import { STORE_NAME } from "@/config/site";

export default async function BrandingPage() {
  const db = getDb();
  const [branding] = await db.select().from(brandingSettings).limit(1);
  const bannerRows = await db.select().from(banners);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">מיתוג ובאנרים</h1>
      <BrandingManager
        storeName={branding?.storeName ?? STORE_NAME}
        logoAlt={branding?.logoAlt ?? ""}
        banners={bannerRows}
      />
    </div>
  );
}
