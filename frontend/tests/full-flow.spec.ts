import { test, expect } from '@playwright/test';
import { createMockApi } from './helpers/mockApi';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PASSWORD = 'Playwright!123';

test('happy path: register, invite, join, manage list', async ({ page, browser }, testInfo) => {
  const baseURL =
    (testInfo.project.use as { baseURL?: string } | undefined)?.baseURL ??
    'http://127.0.0.1:4173';
  const mock = createMockApi();
  mock.reset();
  await mock.attachContext(page.context());
  await mock.attachPage(page);
  const stamp = Date.now();
  const familyName = `QA Family ${stamp}`;
  const userAEmail = `userA+${stamp}@example.com`;
  const userBEmail = `userB+${stamp}@example.com`;
  const itemName = `Apples ${stamp}`;
  const updatedItemName = `Green Apples ${stamp}`;

  await test.step('Register primary user', async () => {
    await page.goto('/register', { waitUntil: 'networkidle' });
    await page.locator('#register-name').fill('Primary User');
    await page.locator('#register-email').fill(userAEmail);
    await page.locator('#register-password').fill(PASSWORD);
    await page.locator('#register-confirm').fill(PASSWORD);
    await page.getByRole('button', { name: /Create Account/i }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole('button', { name: /Sign Out/i })).toBeVisible();
  });

  await test.step('Create a family', async () => {
    await page.goto('/gate', { waitUntil: 'networkidle' });
    await page.getByPlaceholder('e.g., The Martinez Crew').fill(familyName);
    await page.getByRole('button', { name: /Create Family Group/i }).click();
    await expect(
      page.getByText(new RegExp(`You already belong to ${escapeRegExp(familyName)}`))
    ).toBeVisible();
  });

  let inviteToken = '';

  await test.step('Generate invite token', async () => {
    await page.goto('/settings', { waitUntil: 'networkidle' });
    const inviteResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes('/api/invites') &&
        response.request().method() === 'POST' &&
        response.status() === 200
      );
    });

    await page.getByRole('button', { name: /Generate token only/i }).click();
    const inviteResponse = await inviteResponsePromise;
    const inviteJson = (await inviteResponse.json()) as {
      invite: { token: string };
    };
    inviteToken = inviteJson.invite.token;
    expect(inviteToken).toBeTruthy();
    await expect(page.getByText(inviteToken)).toBeVisible();
  });

  const userBContext = await browser.newContext({ baseURL });
  await mock.attachContext(userBContext);
  const userBPage = await userBContext.newPage();
  await mock.attachPage(userBPage);

  await test.step('Register second user', async () => {
    await userBPage.goto('/register', { waitUntil: 'networkidle' });
    await userBPage.locator('#register-name').fill('Secondary User');
    await userBPage.locator('#register-email').fill(userBEmail);
    await userBPage.locator('#register-password').fill(PASSWORD);
    await userBPage.locator('#register-confirm').fill(PASSWORD);
    await userBPage.getByRole('button', { name: /Create Account/i }).click();
    await expect(userBPage).toHaveURL(/\/app$/);
  });

  await test.step('Secondary user joins family with token', async () => {
    await userBPage.goto('/gate', { waitUntil: 'networkidle' });
    await userBPage.getByPlaceholder('Enter invite token').fill(inviteToken);
    const acceptResponsePromise = userBPage.waitForResponse((response) => {
      return (
        response.url().includes('/api/invites/accept') &&
        response.request().method() === 'POST'
      );
    });
    await userBPage.getByRole('button', { name: /Join Family/i }).click();
    await acceptResponsePromise;
    await expect(
      userBPage.getByText(new RegExp(`You already belong to ${escapeRegExp(familyName)}`)),
    ).toBeVisible();
  });

  await test.step('Primary user adds and edits a shopping item', async () => {
    await page.goto('/app', { waitUntil: 'networkidle' });
    await page.getByPlaceholder(/Add a new item/i).fill(itemName);
    await page.getByPlaceholder('Qty').fill('2');
    await page.getByRole('combobox').selectOption('Produce');
    await page.getByRole('button', { name: /Add Item/i }).click();

    const row = page
      .locator('.list-row')
      .filter({ hasText: itemName })
      .first();
    await expect(row).toBeVisible();

    await row.getByRole('button', { name: /Edit/i }).click();
    await row.getByPlaceholder('Item name').fill(updatedItemName);
    await row.getByRole('button', { name: /Save changes/i }).click();
    await expect(
      page.locator('.list-row').filter({ hasText: updatedItemName }),
    ).toBeVisible();
  });

  await test.step('Mark item as done and verify second user sees it', async () => {
    const updatedRow = page
      .locator('.list-row')
      .filter({ hasText: updatedItemName })
      .first();
    await updatedRow.getByRole('button', { name: /Mark done/i }).click();

    const completedRow = page
      .locator('section')
      .filter({ hasText: 'Completed' })
      .locator('.list-row')
      .filter({ hasText: updatedItemName })
      .first();
    await expect(completedRow).toBeVisible();

    await userBPage.goto('/app', { waitUntil: 'networkidle' });
    const secondaryRow = userBPage
      .locator('section')
      .filter({ hasText: 'Completed' })
      .locator('.list-row')
      .filter({ hasText: updatedItemName })
      .first();
    await expect(secondaryRow).toBeVisible();
  });

  await test.step('Delete the completed item', async () => {
    const targetRow = page
      .locator('section')
      .filter({ hasText: 'Completed' })
      .locator('.list-row')
      .filter({ hasText: updatedItemName })
      .first();

    page.once('dialog', (dialog) => dialog.accept());
    await targetRow.getByRole('button', { name: /^Delete$/i }).click();
    await expect(
      page
        .locator('section')
        .filter({ hasText: 'Completed' })
        .locator('.list-row')
        .filter({ hasText: updatedItemName }),
    ).toHaveCount(0);
  });

  await userBContext.close();
});
