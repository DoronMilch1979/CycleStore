"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  HERO_SLIDE_INTERVAL_MS,
  initialHeroSlideIndex,
  shouldAnimateHero,
  type HeroSlide,
} from "@/domain/content/hero-slides";
import { cn } from "@/lib/cn";

export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(() => initialHeroSlideIndex(slides));
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, HERO_SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const activeIndex = index % slides.length;
  const fade = shouldAnimateHero(slides.length, reducedMotion);
  const initialIndex = initialHeroSlideIndex(slides);

  return (
    <div className="relative h-[min(48vh,22rem)] w-full overflow-hidden bg-surface-muted sm:h-[min(70vh,36rem)]">
      {slides.map((slide, slideIndex) => {
        const active = slideIndex === activeIndex;
        return (
          <div
            key={`${slide.url}-${slideIndex}`}
            aria-hidden={active ? undefined : true}
            className={cn("absolute inset-0", fade && "transition-opacity duration-700 ease-in-out")}
            style={{ opacity: active ? 1 : 0, zIndex: active ? 1 : 0 }}
          >
            <Image
              src={slide.url}
              alt={active ? slide.alt : ""}
              fill
              priority={slideIndex === initialIndex}
              loading={slideIndex === initialIndex ? undefined : "eager"}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}
