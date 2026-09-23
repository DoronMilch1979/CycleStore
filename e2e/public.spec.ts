import { test, expect } from "@playwright/test";

test("accessibility statement is linked from the storefront", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1.sr-only")).toHaveCount(1);
  await expect(page.locator("h2.sr-only", { hasText: "מוצרים בחנות" })).toHaveCount(1);
  await page.getByRole("link", { name: "הצהרת נגישות" }).click();
  await expect(page).toHaveURL(/\/accessibility$/);
  await expect(page.getByRole("heading", { level: 1, name: "הצהרת נגישות" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "פנייה בנושא נגישות" })).toBeVisible();
  await expect(page.getByText("תאריך עדכון:")).toBeVisible();
});

test("public homepage renders in Hebrew", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("h1.sr-only")).toHaveCount(1);
});

test("admin login is reachable and not linked from the public header", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "ניהול" })).toHaveCount(0);
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "כניסת מנהל" })).toBeVisible();
});

test("product page switches photos from arrows and thumbnails", async ({ page }) => {
  await page.goto("/products/gloves");

  const frame = page.getByRole("region", { name: "תמונת המוצר" });
  await expect(frame).toBeVisible();
  await expect(page.getByRole("button", { name: "הגדלת התמונה" })).toHaveCount(0);

  const gallery = page.getByRole("list", { name: "תמונות נוספות" });
  await expect(gallery.getByRole("button", { pressed: true })).toHaveCount(1);

  await page.getByRole("button", { name: "התמונה הבאה" }).click();
  await expect(gallery.getByRole("button", { pressed: true })).toHaveCount(1);

  const otherThumb = gallery.getByRole("button", { pressed: false }).first();
  await otherThumb.click();
  await expect(otherThumb).toHaveAttribute("aria-pressed", "true");
});
