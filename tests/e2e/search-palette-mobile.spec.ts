import { expect, test } from '@playwright/test';

// Geometry + interaction regression for the mobile search sheet. The
// migration once lost the old `translate: none` — the dialog kept
// `translate-x-[-50%]`, shifting the sheet half a screen left and clipping
// the input.
//
// Readiness is observable, never a sleep: AppLayout marks <html
// data-hydrated> from a mount effect, and the tests wait for that marker
// before the first click — an SSR-visible button proves nothing, a click
// landing before React attaches handlers is silently lost. Every step then
// asserts its outcome through expect()'s built-in auto-waiting (menu flips
// to "Close tools menu", the palette mounts, results stream in, ✕ hides
// the sheet).
//
// Geometry is sampled after the open animation (zoom-in-95, duration-200)
// actually finishes — getAnimations() drains to zero — and the sheet is
// asserted against document.documentElement.clientWidth, the real available
// layout width (no percentages, no scrollbar guessing).

async function settle(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const panel = document.querySelector('[data-slot="dialog-content"]');
    return panel !== null && panel.getAnimations().length === 0;
  });
}

test('mobile search sheet opens from the ⋯ menu and fills the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForSelector('html[data-hydrated]');

  // ≤480px the tools live behind ⋯. The flip of the toggle's accessible
  // name to "Close tools menu" is the hydration proof.
  const menu = page.getByRole('button', { name: 'Open tools menu' });
  await menu.click();
  await expect(
    page.getByRole('button', { name: 'Close tools menu' }),
  ).toBeVisible();

  // The bar's own grep button is hidden ≤480px (and carries a different
  // accessible name), so this resolves to the sheet row alone.
  await page.getByRole('button', { name: 'grep' }).click();

  const panel = page.locator('[data-slot="dialog-content"]');
  await expect(panel).toBeVisible();
  await settle(page);

  const box = await panel.boundingBox();
  const clientW = await page.evaluate(
    () => document.documentElement.clientWidth,
  );
  if (!box) throw new Error('panel box missing');
  // Full-bleed sheet: flush with the layout viewport on both edges.
  expect(box.x).toBeGreaterThanOrEqual(-0.5);
  expect(box.x + box.width).toBeLessThanOrEqual(clientW + 0.5);
  expect(box.width).toBeGreaterThanOrEqual(clientW - 1);

  // The input sits fully inside the sheet…
  const inputBox = await page
    .locator('[data-slot="command-input"]')
    .boundingBox();
  if (!inputBox) throw new Error('input box missing');
  expect(inputBox.x).toBeGreaterThanOrEqual(box.x);

  // …typing returns real results (server-side search)…
  await page.locator('[data-slot="command-input"]').fill('blocks');
  await expect(
    page.locator('[data-slot="command-item"]').first(),
  ).toBeVisible();

  // …and the ✕ closes the sheet — touch has no esc.
  await page.locator('[data-slot="dialog-close"]').click();
  await expect(panel).toBeHidden();
});

test('search sheet stays contained at the 640px boundary', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForSelector('html[data-hydrated]');

  // >480px the grep button sits in the bar; clicking it (and the palette
  // mounting) is the hydration check. At exactly 640px v4's max-[640px] is
  // already out — strict < — so the desktop form renders; containment must
  // hold either way.
  await page.getByRole('button', { name: 'Search posts (Cmd+K)' }).click();

  const panel = page.locator('[data-slot="dialog-content"]');
  await expect(panel).toBeVisible();
  await settle(page);

  const box = await panel.boundingBox();
  const clientW = await page.evaluate(
    () => document.documentElement.clientWidth,
  );
  if (!box) throw new Error('panel box missing');
  expect(box.x).toBeGreaterThanOrEqual(-0.5);
  expect(box.x + box.width).toBeLessThanOrEqual(clientW + 0.5);
});
