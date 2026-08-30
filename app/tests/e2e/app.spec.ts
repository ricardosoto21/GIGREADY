import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test';

let electronApp: ElectronApplication;
let page: Page;

test.setTimeout(120_000);

test.beforeAll(async () => {
  const executablePath = process.env.GIGREADY_E2E_EXECUTABLE;
  electronApp = await electron.launch({
    args: executablePath ? [] : ['.'],
    executablePath,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
    } as Record<string, string>,
  });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await electronApp?.close();
});

test('opens the packaged renderer and exposes the safe preload API', async () => {
  await expect(page).toHaveTitle('GigReady');
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'GigReady', exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/v1\.2\.0-beta\.1/)).toBeVisible();

  const apiShape = await page.evaluate(() => ({
    hasApi: typeof window.gigready === 'object',
    hasSelectFolder: typeof window.gigready?.selectFolder === 'function',
    nodeIsHidden: typeof (window as Window & { require?: unknown }).require === 'undefined',
  }));

  expect(apiShape).toEqual({
    hasApi: true,
    hasSelectFolder: true,
    nodeIsHidden: true,
  });

  const databaseApiWorks = await page.evaluate(async () => (
    Array.isArray(await window.gigready.getSessions())
  ));
  expect(databaseApiWorks).toBe(true);
});
