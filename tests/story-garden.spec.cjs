const { test, expect } = require('@playwright/test');

const sequences = [
  ['seed', 'water', 'grown'],
  ['seed', 'water', 'harvest'],
  ['soap', 'rinse', 'dry'],
];
async function openGarden(page) {
  await page.addInitScript(() => {
    localStorage.setItem('kid_explorer_lang', 'vi');
    localStorage.setItem('kid_explorer_stars', '0');
    Math.random = () => .27;
  });
  await page.goto('/');
  await page.locator('[data-game="story-garden"]').click();
  await expect(page.locator('[data-mode]')).toHaveCount(1);
  await page.locator('[data-mode="easy"]').click();
}
async function arrange(page, sequence) {
  for (const [index, id] of sequence.entries()) {
    await page.locator('[data-card="' + id + '"]').press('Enter');
    await page.locator('[data-slot="' + index + '"]').press('Space');
  }
}
test('picture-only guided stories auto-play and reward exactly once', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openGarden(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  for (let story = 0; story < 3; story++) {
    await expect(page.locator('.sgr-placeholder svg')).toHaveCount(3);
    await expect(page.locator('.sgr-card svg')).toHaveCount(3);
    expect(await page.locator('.sgr-game').innerText()).not.toMatch(/[\p{L}\p{N}]/u);
    await arrange(page, sequences[story]);
    await expect(page.locator('.sgr-game')).toHaveAttribute('data-phase', 'playing');
    await expect(page.locator('.sgr-playback svg')).toHaveCount(1);
    await expect(page.locator('[data-action="watch"]')).toHaveCount(0);
    await page.clock.runFor(4300);
    await expect(page.locator('.sgr-game')).toHaveAttribute('data-phase', story === 2 ? 'complete' : 'reward');
    await expect(page.locator('[data-earned="true"]')).toHaveCount(story + 1);
    if (story < 2) await page.locator('[data-action="next"]').click();
  }
  expect(await page.evaluate(() => app.stars)).toBe(5);
  await page.evaluate(() => { app.activeGame.check(); app.activeGame.finishStory(); });
  expect(await page.evaluate(() => app.stars)).toBe(5);
  await page.locator('#btn-lang').click();
  await expect(page.locator('[data-action="replay"]')).toHaveAttribute('aria-label', 'Play again');
  expect(await page.locator('.sgr-game').innerText()).not.toMatch(/[\p{L}\p{N}]/u);
  await page.locator('[data-action="replay"]').click();
  await expect(page.locator('.sgr-card')).toHaveCount(3);
  expect(await page.evaluate(() => app.activeGame.completed)).toBe(0);
  expect(errors).toEqual([]);
});
test('wrong placement stays in tray and highlights matching picture; language keeps state', async ({ page }) => {
  await openGarden(page);
  await page.locator('[data-card="water"]').click();
  await page.locator('[data-slot="0"]').click();
  expect(await page.evaluate(() => app.activeGame.slots)).toEqual([null, null, null]);
  await expect(page.locator('[data-card="water"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-slot="1"]')).toHaveClass(/sgr-issue/);
  await page.locator('#btn-lang').click();
  await expect(page.locator('[data-slot="1"]')).toHaveClass(/sgr-issue/);
  await expect(page.locator('[data-card="water"]')).toHaveAttribute('aria-label', 'Water the seed');
  await page.locator('[data-slot="1"]').click();
  expect(await page.evaluate(() => app.activeGame.slots)).toEqual([null, 'water', null]);
  await page.evaluate(() => { window.__speech = []; TTS.speak = (text, options) => window.__speech.push({text, lang: options.lang}); });
  await page.locator('[data-action="listen"]').click();
  expect(await page.evaluate(() => window.__speech[0])).toEqual({text: expect.stringContaining('matching picture'), lang: 'en-US'});
});
test('drag carries the actual picture, places it, returns it and cancels on language change', async ({ page }) => {
  await openGarden(page);
  const startDrag = async source => {
    await source.scrollIntoViewIfNeeded();
    const box = await source.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 15, box.y + box.height / 2 - 15, {steps: 3});
  };
  const drop = async target => {
    const box = await target.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {steps: 8});
    await page.mouse.up();
  };
  const source = page.locator('[data-card="seed"]');
  const picture = await source.locator('svg').evaluate(el => el.outerHTML);
  await startDrag(source);
  await expect(page.locator('.activity-drag-ghost svg')).toHaveCount(1);
  expect(await page.locator('.activity-drag-ghost').innerText()).toBe('');
  expect(await page.locator('.activity-drag-ghost svg').evaluate(el => el.outerHTML)).toBe(picture);
  await drop(page.locator('[data-slot="0"]'));
  await expect(page.locator('[data-slot="0"]')).toHaveAttribute('data-drag-id', 'seed');
  await startDrag(page.locator('[data-slot="0"]'));
  await drop(page.locator('.sgr-tray'));
  await expect(source).toBeVisible();
  await startDrag(source);
  await page.evaluate(() => app.activeGame.updateLanguage('en'));
  await expect(page.locator('.activity-drag-ghost')).toHaveCount(0);
  await page.mouse.up();
  expect(await page.evaluate(() => app.activeGame.drag)).toBeNull();
});
test('leaving automatic playback cancels timers and rewards', async ({ page }) => {
  await openGarden(page);
  await arrange(page, sequences[0]);
  await page.evaluate(() => { window.__oldGarden = app.activeGame; });
  await page.locator('#btn-back').click();
  expect(await page.evaluate(() => ({destroyed: __oldGarden.destroyed, timers: __oldGarden.timers.size, stars: app.stars}))).toEqual({destroyed: true, timers: 0, stars: 0});
});
for (const [width, height] of [[320, 740], [390, 844], [844, 390]]) {
  test('pictures fit and remain usable at ' + width + 'x' + height, async ({ page }) => {
    await page.setViewportSize({width, height});
    await openGarden(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const button of await page.locator('.sgr-slot, .sgr-card').all()) {
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.locator('#game-hint')).toBeHidden();
    await page.locator('[data-card="seed"]').press('Enter');
    await page.locator('[data-slot="0"]').press('Space');
    await expect(page.locator('[data-slot="0"]')).toHaveAttribute('data-drag-id', 'seed');
  });
}

test('real touch pointer drag arranges a picture', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await openGarden(page);
  const source = page.locator('[data-card="seed"]');
  const target = page.locator('[data-slot="0"]');
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  const session = await context.newCDPSession(page);
  const x = from.x + from.width / 2;
  const y = from.y + from.height / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 8; i++) await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove', touchPoints: [{ x: x + (to.x + to.width / 2 - x) * i / 8, y: y + (to.y + to.height / 2 - y) * i / 8 }],
  });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('[data-slot="0"]')).toHaveAttribute('data-drag-id', 'seed');
  await context.close();
});

