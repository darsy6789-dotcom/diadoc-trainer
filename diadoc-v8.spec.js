const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('url');
const path = require('path');

const TRAINER_PATH = path.resolve(__dirname, 'index.html');
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
// ==========================================
// ТЕСТ №3 — СБОРНИК КНОПОК И ПОИСК
// ==========================================

test('V8 — №3 сборник кнопок и поиск работают', async ({ page }) => {
  const jsErrors = [];

  page.on('pageerror', error => jsErrors.push(error.message));

  await page.goto(trainerUrl, {
    waitUntil: 'load',
    timeout: 30000
  });

  // Открываем сборник кнопок
  await page.locator('#collectionBtn').click();
  await expect(page.locator('#collection')).toHaveClass(/open/);

  // Проверяем, что сборник действительно заполнен кнопками
  const items = page.locator('#items .item');
  await expect(items.first()).toBeVisible();
  expect(await items.count()).toBeGreaterThan(0);

  // Нажимаем первую кнопку в сборнике
  await items.first().click();

  // После выбора тренажёр должен показать найденную кнопку
  await expect(page.locator('.found')).toBeVisible();

  // Проверяем, что после этих действий не появилось JS-ошибок
  expect(
    jsErrors,
    `JavaScript-ошибки в сборнике кнопок:\n${jsErrors.join('\n')}`
  ).toEqual([]);
});
// ==========================================
// ТЕСТ №4 — ОКНА НЕ ДОЛЖНЫ ПЕРЕКРЫВАТЬСЯ
// ==========================================

test('V8 — №4 при открытии набора стартовое окно не перекрывает его', async ({ page }) => {
  await page.goto(trainerUrl, {
    waitUntil: 'load',
    timeout: 30000
  });

  // Открываем Проверку знаний
  await page.locator('#knowledgeBtn').click();
  await expect(page.locator('#m8Setup')).toBeVisible();

  // Открываем Набор заданий
  await page.locator('#m8Pool').click();
  await expect(page.locator('#poolModal')).toHaveClass(/open/);

  // Стартовое окно больше не должно перекрывать Набор заданий
  await expect(page.locator('#m8Setup')).not.toBeVisible();
});
// ==========================================
// ТЕСТ №5 — ПРАВИЛЬНЫЙ ОТВЕТ ПОДСВЕЧИВАЕТСЯ
// ==========================================

test('V8 — №5 правильный ответ получает зелёную реакцию', async ({ page }) => {
  await page.goto(trainerUrl, {
    waitUntil: 'load',
    timeout: 30000
  });

  // Открываем Проверку знаний
  await page.locator('#knowledgeBtn').click();
  await expect(page.locator('#m8Setup')).toBeVisible();

  // Запускаем игру
  await page.locator('#m8Start').click();

  // Игровое табло должно появиться
  await expect(page.locator('#m8Bar')).toHaveClass(/on/);

  // Узнаём номер правильной кнопки из текущего задания
  const question = page.locator('#m8Question');
  await expect(question).toBeVisible();

  const text = await question.textContent();
  const match = text.match(/№(\d+)/);

  expect(match, `Не найден номер правильной кнопки в задании: ${text}`).not.toBeNull();

  const targetNumber = match[1];

  // Находим реальную кнопку с этим номером
  const target = page.locator(`.target[data-n="${targetNumber}"]`).first();
  await expect(target).toBeVisible();

  // Нажимаем правильный ответ
  await target.click();
  //
// ТЕСТ №6 — ЦЕЛОСТНОСТЬ РАБОЧИХ КНОПОК
//
test('V8 — №6 кнопки зарегистрированы во всех разделах', async ({ page }) => {
  await page.goto(trainerUrl);

  const result = await page.evaluate(() => {
    const targets = [...document.querySelectorAll('.target[data-n]')];
    const numbers = [...new Set(targets.map(el => el.dataset.n))];
    const collection = [...document.querySelectorAll('#items .item')]
      .map(el => el.querySelector('.itemNo')?.textContent?.trim());

    return {
      missingNames: targets.filter(el => !el.dataset.name).map(el => el.dataset.n),
      missingCollection: numbers.filter(n => !collection.includes(n)),
      invalidPaths: targets.filter(el => {
        if (!el.dataset.path) return false;
        const steps = el.dataset.path.split(',');
        return steps.at(-1) !== el.dataset.n ||
          steps.some(n => !numbers.includes(n));
      }).map(el => el.dataset.n)
    };
  });

  expect(result.missingNames, 'Кнопки без названия').toEqual([]);
  expect(result.missingCollection, 'Кнопки отсутствуют в сборнике').toEqual([]);
  expect(result.invalidPaths, 'Ошибочные маршруты').toEqual([]);
});

//
// ТЕСТ №7 — ВЛОЖЕННЫЙ МАРШРУТ №105
//
test('V8 — №7 поиск ведёт от №94 к №105', async ({ page }) => {
  await page.goto(trainerUrl);

  await page.locator('#quickSearch').fill('Функции для технического специалиста');
  await page.locator('#quickResults .searchResult')
    .filter({ hasText: '№105' }).click();

  await expect(page.locator('.target[data-n="94"]')).toHaveClass(/route/);

  await page.locator('.target[data-n="94"]').click();

  await expect(page.locator('.target[data-n="105"]')).toHaveClass(/route|found/);
});

  // Правильная кнопка должна получить зелёную реакцию
  await expect(target).toHaveClass(/m8target-ok/);
});
