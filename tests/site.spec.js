import { expect, test } from '@playwright/test';

test('loads under the production CSP with functional contact links', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toContain("script-src 'self' 'sha256-");
  await expect(page.locator('html')).toHaveClass(/app-ready/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /Call us now/ })).toHaveAttribute('href', 'tel:01244552233');
  await expect(page.getByRole('link', { name: /Email your enquiry/ })).toHaveAttribute(
    'href',
    'mailto:enquiries@lowesbuildingservices.co.uk'
  );
  expect(errors).toEqual([]);
});

test('derives business age and copyright from the current year', async ({ page }) => {
  await page.goto('/');
  const expectedAge = new Date().getFullYear() - 1998;

  await expect(page.locator('.hero-sub [data-business-age]')).toHaveText(`for ${expectedAge} years`);
  await expect(page.locator('[data-business-age-short]')).toHaveText(`${expectedAge}+ years of delivery`);
  await expect(page.locator('[data-current-year]')).toHaveText(String(new Date().getFullYear()));
});

test('keeps core content and mobile navigation usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.goto('/#services');
  await expect(page.getByRole('heading', { name: /Three services/ })).toBeVisible();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  await expect(page.locator('#mobile-menu').getByRole('link', { name: 'Services' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Email your enquiry/ })).toHaveAttribute(
    'href',
    'mailto:enquiries@lowesbuildingservices.co.uk'
  );

  await context.close();
});

test('contains focus inside the mobile menu and closes it beyond the breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Open menu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Primary navigation' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('#mobile-menu-close')).toBeFocused();
  await expect(page.locator('main')).toHaveAttribute('inert', '');

  await page.locator('#mobile-menu-close').press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: /Call the team/ })).toBeFocused();

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('body')).not.toHaveClass(/menu-open/);
  await expect(page.locator('#mobile-menu')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
});

test('shows all content immediately when reduced motion is requested', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();

  await page.goto('/#sectors');
  await expect(page.getByRole('heading', { name: /Built around council/ })).toBeVisible();
  const opacities = await page.locator('#sectors [data-reveal]').evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).opacity)
  );
  expect(opacities.every((opacity) => opacity === '1')).toBe(true);

  await context.close();
});
