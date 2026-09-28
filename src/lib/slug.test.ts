import { describe, expect, it } from "vitest";
import { isPublicSlug, readPublicSlug, slugify } from "@/lib/slug";

describe("slugify", () => {
  it("keeps Hebrew characters and collapses whitespace", () => {
    expect(slugify("אופני הרים")).toBe("אופני-הרים");
    expect(slugify("  בקבוקים ושקיות שתיה  ")).toBe("בקבוקים-ושקיות-שתיה");
  });
});

describe("isPublicSlug", () => {
  it("accepts stored Hebrew slugs and rejects paths, spaces, and oversized values", () => {
    expect(isPublicSlug("אופני-הרים")).toBe(true);
    expect(isPublicSlug("helmet-1")).toBe(true);
    expect(isPublicSlug("")).toBe(false);
    expect(isPublicSlug("bad slug")).toBe(false);
    expect(isPublicSlug("../etc")).toBe(false);
    expect(isPublicSlug("a".repeat(201))).toBe(false);
    expect(readPublicSlug("%D7%90%D7%95%D7%A4%D7%A0%D7%99%D7%99%D7%9D")).toBe("אופניים");
    expect(readPublicSlug("%")).toBe(null);
  });
});
