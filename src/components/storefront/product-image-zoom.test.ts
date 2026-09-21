import { describe, expect, it } from "vitest";
import {
  clampPan,
  clampZoom,
  defaultSelectedImageIndex,
  PRODUCT_IMAGE_MAX_ZOOM,
  PRODUCT_IMAGE_MIN_ZOOM,
  zoomTowards,
} from "@/components/storefront/product-image-zoom";

describe("product image zoom helpers", () => {
  it("clamps zoom between min and max", () => {
    expect(clampZoom(0.2)).toBe(PRODUCT_IMAGE_MIN_ZOOM);
    expect(clampZoom(9)).toBe(PRODUCT_IMAGE_MAX_ZOOM);
    expect(clampZoom(1.5)).toBe(1.5);
  });

  it("resets pan when zoom is 1", () => {
    expect(clampPan({ x: 40, y: -20 }, 1, 400, 400)).toEqual({ x: 0, y: 0 });
  });

  it("keeps pan inside the overflow created by zoom", () => {
    expect(clampPan({ x: 500, y: -500 }, 2, 400, 400)).toEqual({ x: 200, y: -200 });
  });

  it("keeps the cursor point stable when zooming toward it", () => {
    expect(zoomTowards(1, 2, { x: 0, y: 0 }, { x: 100, y: -50 })).toEqual({
      x: -100,
      y: 50,
    });
  });

  it("defaults to the primary image even when it is not first", () => {
    expect(
      defaultSelectedImageIndex([
        { isPrimary: false },
        { isPrimary: true },
        { isPrimary: false },
      ]),
    ).toBe(1);
  });

  it("falls back to the first image when none is primary", () => {
    expect(defaultSelectedImageIndex([{ isPrimary: false }, { isPrimary: false }])).toBe(
      0,
    );
  });
});
