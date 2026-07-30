import { expect, test, type Page } from "@playwright/test";

async function sampleHeadline(page: Page, ticks: number, everyMs: number) {
  const headline = page.locator("h1");
  await expect(headline).toBeVisible();
  const samples = new Set<string>();
  for (let i = 0; i < ticks; i += 1) {
    samples.add(((await headline.textContent()) ?? "").trim());
    await page.waitForTimeout(everyMs);
  }
  return [...samples].filter((sample) => sample.length > 0);
}

/** Partial words prove the phrase is being typed out, not swapped in whole. */
function hasPartialWords(samples: string[]): boolean {
  return samples.some((sample) => !sample.endsWith("?") && sample !== "Cuéntame tu caso");
}

test("the opening headline types, erases and moves to the next phrase", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/chat");
  const samples = await sampleHeadline(page, 40, 250);

  expect(hasPartialWords(samples)).toBe(true);
  expect(new Set(samples.map((sample) => sample.charAt(0))).size).toBeGreaterThan(1);
});

test("it still types when the system asks for reduced motion", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/chat");
  const samples = await sampleHeadline(page, 40, 250);

  // The deliberate choice is that this headline animates regardless; a whole
  // phrase appearing at once means the effect regressed.
  expect(hasPartialWords(samples)).toBe(true);

  // The blanket reduced-motion rule in globals.css would otherwise freeze the
  // caret solid at 0.01ms.
  await expect(page.locator(".typing-caret")).toHaveCSS("animation-duration", "1.06s");
});

test("the caret follows the last letter onto a wrapped second line", async ({ page }) => {
  test.setTimeout(90_000);
  // Narrow enough that the longest phrase needs two lines.
  await page.setViewportSize({ width: 760, height: 900 });
  await page.goto("/chat");

  const headline = page.locator("h1");
  const caret = page.locator(".typing-caret");
  await expect(headline).toBeVisible();

  for (let i = 0; i < 220; i += 1) {
    const headlineBox = await headline.boundingBox();
    const caretBox = await caret.boundingBox();
    if (headlineBox && caretBox && headlineBox.height > headlineBox.width / 8) {
      const wrapped = headlineBox.height > 90;
      if (wrapped) {
        // A flex wrapper would strand the caret on the first line; in inline
        // flow it rides along with the last character.
        expect(caretBox.y).toBeGreaterThan(headlineBox.y + headlineBox.height / 2);
        return;
      }
    }
    await page.waitForTimeout(120);
  }
  throw new Error("the headline never wrapped onto a second line");
});

test("hydrates the headline without a server/client mismatch", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (/hydrat|did not match|didn't match/i.test(text)) problems.push(text);
  });
  page.on("pageerror", (error) => problems.push(error.message));

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/chat");
  await expect(page.locator("h1")).toBeVisible();
  await page.waitForTimeout(2_500);

  expect(problems).toEqual([]);
});
