"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { cn } from "@/lib/cn";
import {
  PRODUCT_IMAGE_MIN_ZOOM,
  clampPan,
  clampZoom,
  defaultSelectedImageIndex,
  type PanOffset,
  zoomTowards,
} from "@/components/storefront/product-image-zoom";

export type ProductGalleryImage = {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
};

type ProductImageGalleryProps = {
  productName: string;
  images: ProductGalleryImage[];
  placeholderSrc: string;
};

const ZERO_PAN: PanOffset = { x: 0, y: 0 };

export function ProductImageGallery({
  productName,
  images,
  placeholderSrc,
}: ProductImageGalleryProps) {
  const items =
    images.length > 0
      ? images
      : [
          {
            id: "placeholder",
            url: placeholderSrc,
            altText: productName,
            isPrimary: true,
          },
        ];

  const [selectedIndex, setSelectedIndex] = useState(() =>
    defaultSelectedImageIndex(items),
  );
  const [zoom, setZoom] = useState(PRODUCT_IMAGE_MIN_ZOOM);
  const [pan, setPan] = useState<PanOffset>(ZERO_PAN);
  const [isDragging, setIsDragging] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: PanOffset;
  } | null>(null);

  const selected = items[Math.min(selectedIndex, items.length - 1)] ?? items[0];
  const zoomed = zoom > PRODUCT_IMAGE_MIN_ZOOM;
  const canNavigate = images.length > 1;

  const resetView = useCallback(() => {
    zoomRef.current = PRODUCT_IMAGE_MIN_ZOOM;
    panRef.current = ZERO_PAN;
    setZoom(PRODUCT_IMAGE_MIN_ZOOM);
    setPan(ZERO_PAN);
  }, []);

  const selectImage = useCallback(
    (index: number) => {
      if (index === selectedIndex) return;
      setSelectedIndex(index);
      resetView();
    },
    [resetView, selectedIndex],
  );

  const stepImage = useCallback(
    (direction: 1 | -1) => {
      if (items.length < 2) return;
      selectImage((selectedIndex + direction + items.length) % items.length);
    },
    [items.length, selectImage, selectedIndex],
  );

  const applyZoom = useCallback((nextZoom: number, nextPan: PanOffset) => {
    const frame = frameRef.current;
    const width = frame?.clientWidth ?? 0;
    const height = frame?.clientHeight ?? 0;
    const clampedZoom = clampZoom(nextZoom);
    const clampedPan =
      clampedZoom <= PRODUCT_IMAGE_MIN_ZOOM
        ? ZERO_PAN
        : clampPan(nextPan, clampedZoom, width, height);
    setZoom(clampedZoom);
    setPan(clampedPan);
    zoomRef.current = clampedZoom;
    panRef.current = clampedPan;
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = frame.getBoundingClientRect();
      const currentZoom = zoomRef.current;
      // Wheel forward / up (negative deltaY) zooms in; backward zooms out to 100%.
      const nextZoom = clampZoom(currentZoom - event.deltaY * 0.002);
      if (nextZoom === currentZoom) return;

      const cursorFromCenter = {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      };
      applyZoom(
        nextZoom,
        zoomTowards(currentZoom, nextZoom, panRef.current, cursorFromCenter),
      );
    };

    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, [applyZoom]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    frameRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: panRef.current,
    };
    setIsDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    applyZoom(zoomRef.current, { x: drag.origin.x + dx, y: drag.origin.y + dy });
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
    if (frameRef.current?.hasPointerCapture(event.pointerId)) {
      frameRef.current.releasePointerCapture(event.pointerId);
    }
  };

  const onFrameKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (items.length < 2) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepImage(1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepImage(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectImage(defaultSelectedImageIndex(items));
    }
  };

  return (
    <div className="space-y-4">
      <div
        ref={frameRef}
        role="region"
        aria-label="תמונת המוצר"
        tabIndex={0}
        className={cn(
          "bg-surface-muted relative aspect-square overflow-hidden rounded-[var(--radius-lg)] outline-none",
          zoomed ? "touch-none" : "touch-pan-y",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onFrameKeyDown}
      >
        <div
          key={selected.id}
          className="absolute inset-0"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 150ms ease-out",
          }}
        >
          <Image
            src={selected.url}
            alt={selected.altText || productName}
            fill
            preload={selected.isPrimary}
            sizes="(max-width: 1024px) 100vw, 50vw"
            draggable={false}
            className="pointer-events-none object-contain select-none"
          />
        </div>

        {canNavigate ? (
          <>
            <NavArrow side="left" label="התמונה הבאה" onNavigate={() => stepImage(1)} />
            <NavArrow
              side="right"
              label="התמונה הקודמת"
              onNavigate={() => stepImage(-1)}
            />
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="grid grid-cols-4 gap-2 sm:gap-3" aria-label="תמונות נוספות">
          {images.map((image, index) => {
            const isSelected = image.id === selected.id;
            return (
              <li key={image.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={
                    image.altText ||
                    `תמונה ${index + 1} מתוך ${images.length}${image.isPrimary ? ", תמונה ראשית" : ""}`
                  }
                  className={cn(
                    "bg-surface-muted relative aspect-square w-full overflow-hidden rounded-md border-2 transition-colors",
                    isSelected
                      ? "border-primary"
                      : "hover:border-border border-transparent",
                  )}
                  onClick={() => selectImage(index)}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function NavArrow({
  side,
  label,
  onNavigate,
}: {
  side: "left" | "right";
  label: string;
  onNavigate: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full",
        "text-foreground/55 bg-white/45 shadow-none backdrop-blur-[1px] transition-colors",
        "hover:text-foreground/80 hover:bg-white/70",
        side === "left" ? "left-2" : "right-2",
      )}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onNavigate();
      }}
    >
      {side === "left" ? <ChevronLeft /> : <ChevronRight />}
    </button>
  );
}

function ChevronLeft() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 5.5 8.5 12 15 18.5" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5.5 15.5 12 9 18.5" />
    </svg>
  );
}
