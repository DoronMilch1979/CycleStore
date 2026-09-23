"use client";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { AccessibilitySettings } from "@/domain/content/accessibility-statement";
import { formAction } from "@/lib/form-action";
import { saveAccessibilitySettingsAction } from "@/server/actions/catalog";

export function AccessibilityManager({ settings }: { settings: AccessibilitySettings }) {
  return (
    <form className="grid max-w-2xl gap-4" action={formAction(saveAccessibilitySettingsAction)}>
      <p className="text-sm text-muted">
        הטלפון והדוא״ל שמופיעים בהצהרה נלקחים מפרטי הקשר הפעילים. כאן ממלאים את שם איש הקשר ואת
        תיאור הנגישות בחנות עצמה.
      </p>
      <div>
        <Label htmlFor="contactName">שם איש הקשר לפניות נגישות</Label>
        <Input
          id="contactName"
          name="contactName"
          defaultValue={settings.contactName}
          autoComplete="name"
        />
      </div>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          name="coordinatorAppointed"
          defaultChecked={settings.coordinatorAppointed}
          className="mt-1"
        />
        <span>מונה רכז נגישות (חובה כשיש בעסק 25 עובדים או יותר)</span>
      </label>
      <div>
        <Label htmlFor="premisesAccessibility">נגישות החנות הפיזית</Label>
        <Textarea
          id="premisesAccessibility"
          name="premisesAccessibility"
          defaultValue={settings.premisesAccessibility}
          placeholder="למשל: כניסה בקומת קרקע, דלפק נמוך, חניה בסמוך, ואין מדרגות בדרך לאולם."
        />
      </div>
      <Button type="submit">שמירת הצהרת הנגישות</Button>
    </form>
  );
}
