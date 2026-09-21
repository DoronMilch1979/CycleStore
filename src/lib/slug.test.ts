import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("keeps Hebrew characters and collapses whitespace", () => {
    expect(slugify("אופני הרים")).toBe("אופני-הרים");
    expect(slugify("  בקבוקים ושקיות שתיה  ")).toBe("בקבוקים-ושקיות-שתיה");
  });
});
