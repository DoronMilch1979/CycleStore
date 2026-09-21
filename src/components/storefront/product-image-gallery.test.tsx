/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CSSProperties } from "react";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";

vi.mock("next/image", () => ({
  default: function MockImage({
    alt,
    src,
    style,
    className,
  }: {
    alt: string;
    src: string;
    style?: CSSProperties;
    className?: string;
  }) {
    // eslint-disable-next-line @next/next/no-img-element -- test mock for next/image
    return <img alt={alt} src={src} className={className} style={style} />;
  },
}));

afterEach(() => {
  cleanup();
});

const images = [
  {
    id: "side",
    url: "/media/side.jpg",
    altText: "מבט מהצד",
    isPrimary: false,
  },
  {
    id: "main",
    url: "/media/main.jpg",
    altText: "תמונה ראשית",
    isPrimary: true,
  },
  {
    id: "detail",
    url: "/media/detail.jpg",
    altText: "פרט",
    isPrimary: false,
  },
];

describe("ProductImageGallery", () => {
  it("shows the primary image by default", () => {
    render(
      <ProductImageGallery
        productName="אופני הרים"
        images={images}
        placeholderSrc="/placeholders/product.svg"
      />,
    );

    expect(screen.getByRole("img", { name: "תמונה ראשית" }).getAttribute("src")).toBe(
      "/media/main.jpg",
    );
    expect(
      screen.getByRole("button", { name: "תמונה ראשית" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("switches the main frame when a thumbnail is selected", async () => {
    const user = userEvent.setup();
    render(
      <ProductImageGallery
        productName="אופני הרים"
        images={images}
        placeholderSrc="/placeholders/product.svg"
      />,
    );

    await user.click(screen.getByRole("button", { name: "פרט" }));

    expect(screen.getByRole("img", { name: "פרט" }).getAttribute("src")).toBe(
      "/media/detail.jpg",
    );
    expect(screen.getByRole("button", { name: "פרט" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(
      screen.getByRole("button", { name: "תמונה ראשית" }).getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("navigates with edge arrows and keeps thumbnails in sync", async () => {
    const user = userEvent.setup();
    render(
      <ProductImageGallery
        productName="אופני הרים"
        images={images}
        placeholderSrc="/placeholders/product.svg"
      />,
    );

    await user.click(screen.getByRole("button", { name: "התמונה הבאה" }));
    expect(screen.getByRole("img", { name: "פרט" }).getAttribute("src")).toBe(
      "/media/detail.jpg",
    );
    expect(screen.getByRole("button", { name: "פרט" }).getAttribute("aria-pressed")).toBe(
      "true",
    );

    await user.click(screen.getByRole("button", { name: "התמונה הקודמת" }));
    expect(screen.getByRole("img", { name: "תמונה ראשית" }).getAttribute("src")).toBe(
      "/media/main.jpg",
    );
  });

  it("does not show zoom controls or a zoom percentage", () => {
    render(
      <ProductImageGallery
        productName="אופני הרים"
        images={images}
        placeholderSrc="/placeholders/product.svg"
      />,
    );

    expect(screen.queryByRole("button", { name: "הגדלת התמונה" })).toBeNull();
    expect(screen.queryByRole("button", { name: "הקטנת התמונה" })).toBeNull();
    expect(screen.queryByText("100%")).toBeNull();
    expect(screen.queryByText("1:1")).toBeNull();
  });
});
