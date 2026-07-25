import { expect, test } from "@playwright/test";

test("landing can open the interactive chat shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Entiende tus derechos laborales." })).toBeVisible();
  await page.getByRole("link", { name: /consultar mi caso/i }).first().click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole("heading", { name: "Cuéntame tu caso" })).toBeVisible();
});

test("mobile menu exposes only the V1 sidebar controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chat");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.getByRole("button", { name: "Nueva conversación" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cerrar menú" })).toBeVisible();
  await expect(page.getByText("Favoritos")).toHaveCount(0);
});

test("submitting a question shows a safe response without persisting the conversation", async ({ page }) => {
  await page.goto("/chat");
  await page.getByRole("textbox", { name: "Escribe tu consulta laboral" }).fill("Me despidieron");
  await page.getByRole("button", { name: "Enviar consulta" }).click();
  await expect(page.getByText("Necesito un dato más")).toBeVisible();
  await expect(page.getByText(/régimen laboral privado general/i)).toBeVisible();
});
