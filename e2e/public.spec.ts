import { test, expect } from "@playwright/test";

test("public homepage renders in Hebrew", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("admin login is reachable and not linked from the public header", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "ניהול" })).toHaveCount(0);
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "כניסת מנהל" })).toBeVisible();
});
