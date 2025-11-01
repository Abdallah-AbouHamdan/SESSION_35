import { test, expect } from '@playwright/test';
import { createMockApi } from './helpers/mockApi';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PASSWORD = 'Playwright!123';

test('single user can create, read, update, and delete list items', async ({ page }, testInfo) => {
  const baseURL =
    (testInfo.project.use as { baseURL?: string } | undefined)?.baseURL ?? 'http://127.0.0.1:4173';
  const mock = createMockApi();
  mock.reset();
  await mock.attachContext(page.context());
  await mock.attachPage(page);

  const stamp = Date.now();
  const familyName = `CRUD Family ${stamp}`;
  const userEmail = `crud-user+${stamp}@example.com`;
  const itemTitle = `Milk ${stamp}`;
  const updatedItemTitle = `Oat Milk ${stamp}`;

  await test.step('Register a new user', async () => {
    await page.goto('/register', { waitUntil: 'networkidle' });
    await page.locator('#register-name').fill('CRUD Tester');
    await page.locator('#register-email').fill(userEmail);
    await page.locator('#register-password').fill(PASSWORD);
    await page.locator('#register-confirm').fill(PASSWORD);
    await page.getByRole('button', { name: /Create Account/i }).click();
    await expect(page).toHaveURL(/\/app$/);
  });

  await test.step('Create a family to unlock the shopping list', async () => {
    await page.goto('/gate', { waitUntil: 'networkidle' });
    await page.getByPlaceholder('e.g., The Martinez Crew').fill(familyName);
    await page.getByRole('button', { name: /Create Family Group/i }).click();
    await expect(
      page.getByText(new RegExp(`You already belong to ${escapeRegExp(familyName)}`)),
    ).toBeVisible();
  });

  await test.step('Create a new list item', async () => {
    await page.goto('/app', { waitUntil: 'networkidle' });
    await page.getByPlaceholder(/Add a new item/i).fill(itemTitle);
    await page.getByPlaceholder('Qty').fill('1');
    await page.getByRole('combobox').selectOption('Pantry');
    await page.getByRole('button', { name: /Add Item/i }).click();

    const createdRow = page.locator('.list-row').filter({ hasText: itemTitle }).first();
    await expect(createdRow).toBeVisible();
  });

  await test.step('Update the list item', async () => {
    const targetRow = page.locator('.list-row').filter({ hasText: itemTitle }).first();
    await targetRow.getByRole('button', { name: /Edit/i }).click();
    await targetRow.getByPlaceholder('Item name').fill(updatedItemTitle);
    await targetRow.getByRole('button', { name: /Save changes/i }).click();

    await expect(
      page.locator('.list-row').filter({ hasText: updatedItemTitle }),
    ).toBeVisible();
  });

  await test.step('Mark the item done and verify it appears in completed', async () => {
    const updatedRow = page.locator('.list-row').filter({ hasText: updatedItemTitle }).first();
    await updatedRow.getByRole('button', { name: /Mark done/i }).click();

    const completedRow = page
      .locator('section')
      .filter({ hasText: 'Completed' })
      .locator('.list-row')
      .filter({ hasText: updatedItemTitle })
      .first();
    await expect(completedRow).toBeVisible();
  });

  await test.step('Delete the completed item', async () => {
    const completedRow = page
      .locator('section')
      .filter({ hasText: 'Completed' })
      .locator('.list-row')
      .filter({ hasText: updatedItemTitle })
      .first();

    page.once('dialog', (dialog) => dialog.accept());
    await completedRow.getByRole('button', { name: /^Delete$/i }).click();

    await expect(
      page
        .locator('section')
        .filter({ hasText: 'Completed' })
        .locator('.list-row')
        .filter({ hasText: updatedItemTitle }),
    ).toHaveCount(0);
  });
});
