export const PRODUCT_IMAGE_MIN_ZOOM = 1;
export const PRODUCT_IMAGE_MAX_ZOOM = 3;

export type PanOffset = {
  x: number;
  y: number;
};

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function clampZoom(value: number) {
  return clampNumber(value, PRODUCT_IMAGE_MIN_ZOOM, PRODUCT_IMAGE_MAX_ZOOM);
}

export function clampPan(
  pan: PanOffset,
  zoom: number,
  width: number,
  height: number,
): PanOffset {
  if (zoom <= PRODUCT_IMAGE_MIN_ZOOM || width <= 0 || height <= 0) {
    return { x: 0, y: 0 };
  }

  const maxX = (width * (zoom - 1)) / 2;
  const maxY = (height * (zoom - 1)) / 2;
  return {
    x: clampNumber(pan.x, -maxX, maxX),
    y: clampNumber(pan.y, -maxY, maxY),
  };
}

export function zoomTowards(
  currentZoom: number,
  nextZoom: number,
  pan: PanOffset,
  cursorFromCenter: PanOffset,
): PanOffset {
  if (currentZoom <= 0) return { x: 0, y: 0 };
  const scale = nextZoom / currentZoom;
  return {
    x: cursorFromCenter.x - (cursorFromCenter.x - pan.x) * scale,
    y: cursorFromCenter.y - (cursorFromCenter.y - pan.y) * scale,
  };
}

export function defaultSelectedImageIndex<T extends { isPrimary: boolean }>(images: T[]) {
  const primaryIndex = images.findIndex((image) => image.isPrimary);
  return primaryIndex >= 0 ? primaryIndex : 0;
}
