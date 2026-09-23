export const HERO_SLIDE_INTERVAL_MS = 4000;

export type HeroSlide = {
  url: string;
  alt: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

export function buildHeroSlides(
  images: HeroSlide[],
  fallback: { url: string; alt: string } | null,
): HeroSlide[] {
  const ordered = [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  if (ordered.length === 0) {
    return fallback ? [{ url: fallback.url, alt: fallback.alt, isPrimary: true, sortOrder: 0 }] : [];
  }
  return ordered;
}

export function initialHeroSlideIndex(images: { isPrimary?: boolean }[]): number {
  const index = images.findIndex((image) => image.isPrimary);
  return index >= 0 ? index : 0;
}

export function shouldAnimateHero(slideCount: number, prefersReducedMotion: boolean): boolean {
  return slideCount > 1 && !prefersReducedMotion;
}

export type HeroDisplayMode = "slideshow" | "primary";

export function parseHeroDisplayMode(value: string | null | undefined): HeroDisplayMode {
  return value === "primary" ? "primary" : "slideshow";
}

export function slidesForHeroDisplay(slides: HeroSlide[], mode: HeroDisplayMode): HeroSlide[] {
  if (mode !== "primary" || slides.length <= 1) return slides;
  const primary = slides.find((slide) => slide.isPrimary) ?? slides[0];
  return primary ? [primary] : [];
}
