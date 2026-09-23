import { describe, expect, it } from "vitest";
import {
  emptyAccessibilitySettings,
  parseAccessibilitySettings,
} from "@/domain/content/accessibility-statement";

describe("accessibility statement settings", () => {
  it("returns empty settings for missing values", () => {
    expect(parseAccessibilitySettings(null)).toEqual(emptyAccessibilitySettings);
    expect(parseAccessibilitySettings("text")).toEqual(emptyAccessibilitySettings);
  });

  it("reads the contact name, premises text, and coordinator flag", () => {
    expect(
      parseAccessibilitySettings({
        contactName: "  דנה כהן  ",
        premisesAccessibility: "כניסה בקומת קרקע",
        coordinatorAppointed: true,
      }),
    ).toEqual({
      contactName: "דנה כהן",
      premisesAccessibility: "כניסה בקומת קרקע",
      coordinatorAppointed: true,
    });
  });
});
