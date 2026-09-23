"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  HERO_SLIDE_INTERVAL_MS,
  initialHeroSlideIndex,
  shouldAnimateHero,
  shouldAutoplayHero,
  type HeroSlide,
} from "@/domain/content/hero-slides";
import { cn } from "@/lib/cn";

export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(() => initialHeroSlideIndex(slides));
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!shouldAutoplayHero(slides.length, reducedMotion, paused)) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, HERO_SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const activeIndex = index % slides.length;
  const fade = shouldAnimateHero(slides.length, reducedMotion);
  const initialIndex = initialHeroSlideIndex(slides);
  const active = slides[activeIndex];
  const canNavigate = slides.length > 1;

  function step(direction: 1 | -1) {
    setIndex((current) => (current + direction + slides.length) % slides.length);
  }

  return (
    <div className="relative h-[min(48vh,22rem)] w-full overflow-hidden bg-surface-muted sm:h-[min(70vh,36rem)]">
      {slides.map((slide, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        return (
          <div
            key={`${slide.url}-${slideIndex}`}
            aria-hidden={isActive ? undefined : true}
            className={cn("absolute inset-0", fade && "transition-opacity duration-700 ease-in-out")}
            style={{ opacity: isActive ? 1 : 0, zIndex: isActive ? 1 : 0 }}
          >
            <Image
              src={slide.url}
              alt={isActive ? slide.alt : ""}
              fill
              priority={slideIndex === initialIndex}
              loading={slideIndex === initialIndex ? undefined : "eager"}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        );
      })}
      {canNavigate ? (
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-center gap-2 bg-surface/95 px-3 py-2 text-foreground">
          <button type="button" className="text-link min-h-11 cursor-pointer border-0 bg-transparent px-2" onClick={() => step(-1)}>
            השקופית הקודמת
          </button>
          {reducedMotion ? null : (
            <button
              type="button"
              className="text-link min-h-11 cursor-pointer border-0 bg-transparent px-2"
              aria-pressed={paused}
              onClick={() => setPaused((current) => !current)}
            >
              {paused ? "הפעלת המצגת" : "עצירת המצגת"}
            </button>
          )}
          <button type="button" className="text-link min-h-11 cursor-pointer border-0 bg-transparent px-2" onClick={() => step(1)}>
            השקופית הבאה
          </button>
          <p aria-live="polite" className="min-w-0 text-sm">
            {`שקופית ${activeIndex + 1} מתוך ${slides.length}: ${active?.alt ?? ""}`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
