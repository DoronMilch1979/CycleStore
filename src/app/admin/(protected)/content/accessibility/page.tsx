import { AccessibilityManager } from "@/components/admin/accessibility-manager";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema/content";
import {
  ACCESSIBILITY_SETTINGS_KEY,
  emptyAccessibilitySettings,
  parseAccessibilitySettings,
} from "@/domain/content/accessibility-statement";
import { eq } from "drizzle-orm";

export default async function AccessibilityAdminPage() {
  const [row] = await getDb()
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, ACCESSIBILITY_SETTINGS_KEY))
    .limit(1);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">הצהרת נגישות</h1>
      <AccessibilityManager settings={row ? parseAccessibilitySettings(row.value) : emptyAccessibilitySettings} />
    </div>
  );
}
