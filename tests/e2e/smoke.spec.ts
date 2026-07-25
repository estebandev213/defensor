import { expect, test } from "@playwright/test";

test("landing can open the styled Foundation chat shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Entiende tus derechos laborales." })).toBeVisible();
  await page.getByRole("link", { name: /consultar mi caso/i }).first().click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole("heading", { name: "En resumen" })).toBeVisible();
});

test("mobile menu exposes only the V1 sidebar controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chat");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.getByRole("button", { name: "Nueva conversación" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cerrar menú" })).toBeVisible();
  await expect(page.getByText("Favoritos")).toHaveCount(0);
});
