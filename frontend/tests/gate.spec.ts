import { test, expect } from '@playwright/test';
import { createMockApi } from './helpers/mockApi';

test.describe('Gate landing', () => {
  test('prompts unauthenticated visitors to sign in', async ({ page }) => {
    const mock = createMockApi();
    mock.reset();
    await mock.attachContext(page.context());
    await mock.attachPage(page);
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.getByText(/Please sign in to begin/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Sign In/i })).toBeVisible();
  });

  test('supports theme toggle', async ({ page }) => {
    const mock = createMockApi();
    mock.reset();
    await mock.attachContext(page.context());
    await mock.attachPage(page);
    await page.goto('/', { waitUntil: 'networkidle' });

    const toggle = page.getByRole('button', { name: /Toggle theme/i });
    await expect(toggle).toBeVisible();
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);
    await toggle.click();
    await expect(html).toHaveClass(/dark/);
  });
});
