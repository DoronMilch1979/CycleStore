import { describe, expect, it } from "vitest";
import {
  HERO_SLIDE_INTERVAL_MS,
  buildHeroSlides,
  initialHeroSlideIndex,
  shouldAnimateHero,
  shouldAutoplayHero,
  slidesForHeroDisplay,
} from "@/domain/content/hero-slides";

describe("homepage hero slides", () => {
  it("keeps stored order and starts on the primary image", () => {
    const slides = buildHeroSlides(
      [
        { url: "/a", alt: "א", isPrimary: false, sortOrder: 0 },
        { url: "/b", alt: "ב", isPrimary: true, sortOrder: 1 },
        { url: "/c", alt: "ג", isPrimary: false, sortOrder: 2 },
      ],
      null,
    );
    expect(slides.map((slide) => slide.url)).toEqual(["/a", "/b", "/c"]);
    expect(initialHeroSlideIndex(slides)).toBe(1);
    expect(HERO_SLIDE_INTERVAL_MS).toBe(4000);
  });

  it("does not animate a single image or reduced motion", () => {
    expect(shouldAnimateHero(1, false)).toBe(false);
    expect(shouldAnimateHero(0, false)).toBe(false);
    expect(shouldAnimateHero(3, true)).toBe(false);
    expect(shouldAnimateHero(3, false)).toBe(true);
  });

  it("autoplays only while several slides are allowed to move and the visitor has not paused", () => {
    expect(shouldAutoplayHero(3, false, false)).toBe(true);
    expect(shouldAutoplayHero(3, true, false)).toBe(false);
    expect(shouldAutoplayHero(3, false, true)).toBe(false);
    expect(shouldAutoplayHero(1, false, false)).toBe(false);
  });

  it("shows every image in a slideshow and only the primary image when requested", () => {
    const slides = buildHeroSlides(
      [
        { url: "/a", alt: "א", isPrimary: false, sortOrder: 0 },
        { url: "/b", alt: "ב", isPrimary: true, sortOrder: 1 },
      ],
      null,
    );
    expect(slidesForHeroDisplay(slides, "slideshow").map((slide) => slide.url)).toEqual(["/a", "/b"]);
    expect(slidesForHeroDisplay(slides, "primary").map((slide) => slide.url)).toEqual(["/b"]);
  });

  it("falls back when there are no store images", () => {
    expect(buildHeroSlides([], null)).toEqual([]);
    expect(buildHeroSlides([], { url: "/placeholders/store-hero.svg", alt: "חנות" })).toEqual([
      { url: "/placeholders/store-hero.svg", alt: "חנות", isPrimary: true, sortOrder: 0 },
    ]);
  });
});
