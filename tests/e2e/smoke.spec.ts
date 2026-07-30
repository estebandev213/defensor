import { expect, test } from "@playwright/test";

test("landing can open the interactive chat shell", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Entiende tus derechos laborales con claridad.",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Consultar mi caso" }).first().click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole("heading", { name: "Cuéntame tu caso" })).toBeVisible();
});

test("chat safely prefills a landing query", async ({ page }) => {
  const query = "Necesito orientación sobre mis vacaciones";
  await page.goto(`/chat?q=${encodeURIComponent(query)}`);

  const composer = page.getByRole("textbox", {
    name: "Escribe tu consulta laboral",
  });
  await expect(composer).toHaveValue(query);
  await expect(composer).toBeFocused();
});

test("mobile menu exposes only the V1 sidebar controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chat");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.getByRole("button", { name: "Nueva conversación" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cerrar menú" })).toBeVisible();
  await expect(page.getByText("Favoritos")).toHaveCount(0);
});

test("desktop chat can toggle the sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/chat");

  const sidebar = page.locator("#main-sidebar");
  const toggle = sidebar.getByRole("button", { name: "Ocultar barra lateral" });
  await expect(toggle).toBeVisible();
  await expect(page.getByRole("button", { name: "Nueva conversación" })).toBeVisible();

  await toggle.click();
  await expect(sidebar).toHaveCSS("width", "0px");
  await expect(sidebar).toHaveCSS("padding-left", "0px");
  await expect(page.locator("main")).toHaveJSProperty("offsetLeft", 0);
  // Collapsed content is display:none, so nothing inside stays tabbable.
  await expect(page.getByRole("button", { name: "Nueva conversación" })).toBeHidden();

  // The expand control sits outside the aside: a zero-width, clipped sidebar
  // cannot host its own escape hatch.
  const expand = page.getByRole("button", { name: "Mostrar barra lateral" });
  await expect(expand).toBeVisible();
  await expand.click();
  await expect(sidebar).toHaveCSS("width", "300px");
  await expect(toggle).toBeVisible();
});

test("chat can add and switch between session conversations", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/chat");

  await expect(page.getByRole("button", { name: "Abrir conversación: Conversación actual" })).toBeVisible();
  await page.getByRole("button", { name: "Nueva conversación" }).click();
  await expect(page.getByRole("button", { name: "Abrir conversación: Conversación 2" })).toBeVisible();

  await page.getByRole("button", { name: "Abrir conversación: Conversación actual" }).click();
  await expect(page.getByRole("button", { name: "Abrir conversación: Conversación actual" })).toHaveAttribute("aria-current", "page");
});

test("sidebar theme toggle reflects the active theme", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/chat");

  const sidebar = page.locator("#main-sidebar");
  await expect(sidebar.getByRole("button", { name: "Activar tema oscuro" })).toBeVisible();
  await sidebar.getByRole("button", { name: "Activar tema oscuro" }).click();
  await expect(sidebar.getByRole("button", { name: "Activar tema claro" })).toBeVisible();
  await expect(sidebar.getByText("Oscuro")).toBeVisible();
});

test("chat moves guidance beside the theme toggle after removing the header", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/chat");

  const sidebar = page.locator("#main-sidebar");
  await expect(page.locator("header")).toHaveCount(0);
  await expect(sidebar.getByRole("link", { name: "¿Cómo funciona?" })).toBeVisible();
  await expect(sidebar.getByText("Claro")).toBeVisible();
});

test("the assistant reply reads as a conversation, not as a legal document", async ({ page }) => {
  // A real turn is two LLM round trips; the default 30s budget is not enough.
  test.setTimeout(120_000);
  await page.goto("/chat");
  await page.getByRole("textbox", { name: "Escribe tu consulta laboral" }).fill("Me despidieron");
  await page.getByRole("button", { name: "Enviar consulta" }).click();

  // The turn can end as an answer, a clarifying question or an abstention
  // depending on the configured providers; the shape is what must hold.
  const answer = page.locator("article").first();
  await expect(answer).toBeVisible({ timeout: 90_000 });
  await expect(answer.getByRole("heading")).toHaveCount(0);
  await expect(answer.getByText(/^\[\d+\]$/)).toHaveCount(0);
  await expect(page.getByText("Próximos pasos prudentes")).toHaveCount(0);
  await expect(page.getByText("Ver cómo lo razoné")).toBeVisible();
  await expect(page.getByRole("button", { name: "Nueva conversación" })).toBeVisible();
});

test("quick replies offer an escape hatch into the composer", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/chat");
  const composer = page.getByRole("textbox", { name: "Escribe tu consulta laboral" });
  await composer.fill("Me despidieron");
  await page.getByRole("button", { name: "Enviar consulta" }).click();

  const compose = page.getByRole("button", { name: "Otra respuesta" }).first();
  await expect(compose).toBeVisible({ timeout: 90_000 });
  await compose.click();
  await expect(composer).toBeFocused();
  // It hands over to the input instead of sending anything on its own.
  await expect(composer).toHaveValue("");
});

test("public pages expose canonical SEO metadata", async ({ page }) => {
  await page.goto("/metodologia");
  await expect(page.getByRole("heading", { name: "La respuesta también explica sus límites." })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/metodologia$/);
  await page.goto("/chat");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
