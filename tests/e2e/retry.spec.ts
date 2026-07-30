import { expect, test } from "@playwright/test";

test("retries a failed turn silently and only then explains the way out", async ({ page }) => {
  test.setTimeout(120_000);
  let attempts = 0;
  await page.route("**/api/chat", async (route) => {
    attempts += 1;
    await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"LLM_PROVIDER_ERROR"}' });
  });

  await page.goto("/chat");
  await page.getByRole("textbox", { name: "Escribe tu consulta laboral" }).fill("Me despidieron");
  await page.getByRole("button", { name: "Enviar consulta" }).click();

  await expect(page.getByText(/Reintentando \(2 de 3\)/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/después de 3 intentos/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Empezar una conversación nueva" })).toBeVisible();
  expect(attempts).toBe(3);
});

test("does not retry when the server says the limit was reached", async ({ page }) => {
  test.setTimeout(60_000);
  let attempts = 0;
  await page.route("**/api/chat", async (route) => {
    attempts += 1;
    await route.fulfill({ status: 429, contentType: "application/json", body: '{"error":"RATE_LIMITED"}' });
  });

  await page.goto("/chat");
  await page.getByRole("textbox", { name: "Escribe tu consulta laboral" }).fill("Me despidieron");
  await page.getByRole("button", { name: "Enviar consulta" }).click();

  await expect(page.getByText(/límite temporal/)).toBeVisible({ timeout: 15_000 });
  expect(attempts).toBe(1);
});

test("does not retry an upstream limit reported inside the stream", async ({ page }) => {
  test.setTimeout(60_000);
  let attempts = 0;
  // The route answers 200 and reports provider failures as SSE frames, so an
  // upstream 429 never reaches the client as an HTTP status.
  await page.route("**/api/chat", async (route) => {
    attempts += 1;
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream; charset=utf-8",
      body: 'data: {"type":"error","code":"RATE_LIMITED","retryAfterSeconds":15}\n\ndata: [DONE]\n\n',
    });
  });

  await page.goto("/chat");
  await page.getByRole("textbox", { name: "Escribe tu consulta laboral" }).fill("Me despidieron");
  await page.getByRole("button", { name: "Enviar consulta" }).click();

  await expect(page.getByText(/Espera unos 15 segundos/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/después de 3 intentos/)).toHaveCount(0);
  expect(attempts).toBe(1);
});
