export const ACCESSIBILITY_SETTINGS_KEY = "accessibility";

export const ACCESSIBILITY_STATEMENT_PUBLISHED_LABEL = "23 בספטמבר 2026";

export type AccessibilitySettings = {
  contactName: string;
  premisesAccessibility: string;
  coordinatorAppointed: boolean;
};

export const emptyAccessibilitySettings: AccessibilitySettings = {
  contactName: "",
  premisesAccessibility: "",
  coordinatorAppointed: false,
};

export function parseAccessibilitySettings(value: unknown): AccessibilitySettings {
  if (!value || typeof value !== "object") return emptyAccessibilitySettings;
  const record = value as Record<string, unknown>;
  return {
    contactName: typeof record.contactName === "string" ? record.contactName.trim() : "",
    premisesAccessibility:
      typeof record.premisesAccessibility === "string" ? record.premisesAccessibility.trim() : "",
    coordinatorAppointed: record.coordinatorAppointed === true,
  };
}

export function formatAccessibilityUpdatedLabel(date: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jerusalem",
  }).format(date);
}
