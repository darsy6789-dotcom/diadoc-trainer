const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('url');

const TRAINER_PATH =
  'C:\\Users\\Алена\\Downloads\\1с разраба\\версии\\Версия 8.1.html';

const trainerUrl = pathToFileURL(TRAINER_PATH).href;


// ==========================================
// ТЕСТ №1 — ЗАГРУЗКА БЕЗ JAVASCRIPT-ОШИБОК
// ==========================================

test('V8 — №1 загрузка без ошибок', async ({ page }) => {
  const jsErrors = [];
  const consoleErrors = [];
  const failedRequests = [];

  page.on('pageerror', error => jsErrors.push(error.message));

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', request => {
    failedRequests.push(
      `${request.method()} ${request.url()} — ${request.failure()?.errorText || 'unknown'}`
    );
  });

  await page.goto(trainerUrl, {
    waitUntil: 'load',
    timeout: 30000
  });

  await expect(page.locator('body')).toBeVisible();

  expect(
    jsErrors,
    `JavaScript-ошибки:\n${jsErrors.join('\n')}`
  ).toEqual([]);

  expect(
    consoleErrors,
    `Ошибки console.error:\n${consoleErrors.join('\n')}`
  ).toEqual([]);

  expect(
    failedRequests,
    `Ошибки загрузки ресурсов:\n${failedRequests.join('\n')}`
  ).toEqual([]);
});


// ==========================================
// ТЕСТ №2 — ОСНОВНЫЕ КЛИКИ ТРЕНАЖЁРА
// ==========================================

test('V8 — №2 основные кнопки открываются', async ({ page }) => {
  const jsErrors = [];

  page.on('pageerror', error => jsErrors.push(error.message));

  await page.goto(trainerUrl, {
    waitUntil: 'load',
    timeout: 30000
  });

  // Нумерация
  await page.locator('#toggle').click();

  // Сборник кнопок
  await page.locator('#collectionBtn').click();
  await expect(page.locator('#collection')).toHaveClass(/open/);

  // Проверка знаний
  await page.locator('#knowledgeBtn').click();
  await expect(page.locator('#m8Setup')).toBeVisible();

  // Набор заданий
  await page.locator('#m8Pool').click();
  await expect(page.locator('#poolModal')).toHaveClass(/open/);

  expect(
    jsErrors,
    `JavaScript-ошибки после кликов:\n${jsErrors.join('\n')}`
  ).toEqual([]);
});