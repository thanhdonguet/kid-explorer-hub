const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const vm = require('node:vm');

const activities = [
  { id: 'shape-workshop', vi: 'Xưởng Lắp Ghép', en: 'Shape Workshop' },
  { id: 'pattern-train', vi: 'Đoàn Tàu Quy Luật', en: 'Pattern Train' },
  { id: 'story-garden', vi: 'Khu Vườn Diệu Kỳ', en: 'Story Garden' },
];

test('new game scripts and styles are in the offline release', () => {
  const release = { self: {} };
  vm.runInNewContext(fs.readFileSync('www/asset-list.js', 'utf8'), release);
  const assets = release.self.KID_ASSETS;
  for (const file of [
    'js/activity-base.js', 'css/activities.css',
    ...activities.flatMap(game => [`js/games/${game.id}.js`, `css/${game.id}.css`]),
  ]) {
    expect(fs.existsSync(`www/${file}`), file).toBe(true);
    expect(assets, file).toContain(file);
  }
});

for (const fallback of [false, true]) {
  test(`new activities can start offline ${fallback ? 'with SVG fallback' : 'with 3D'}`, async ({ page, context }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (fallback) await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return type === 'webgl2' ? null : getContext.call(this, type, ...args);
      };
    });
    await page.goto('/');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await page.locator('#btn-sound').click();
    for (const game of activities) {
      await page.locator(`[data-game="${game.id}"]`).click();
      await expect(page.locator('#app-title-hud')).toHaveText(game.vi);
      await page.locator('#game-stage [data-level="easy"]').click();
      await expect(page.locator('#game-stage')).not.toBeEmpty();
      const oldGame = await page.evaluateHandle(() => app.activeGame);
      await page.locator('#btn-lang').click();
      await expect(page.locator('#app-title-hud')).toHaveText(game.en);
      await expect(page.locator('#game-hint')).not.toBeEmpty();
      await page.locator('#btn-lang').click();
      await page.locator('#btn-back').click();
      expect(await oldGame.evaluate(game => game.destroyed && game.timers.size === 0)).toBe(true);
      await oldGame.dispose();
      await expect(page.locator('.activity-drag-ghost')).toHaveCount(0);
      expect(await page.evaluate(() => window.Explorer3D.viewCount)).toBe(10);
    }
    expect(errors).toEqual([]);
  });
}

test('shared drag cancels cleanly and a new screen does not receive an old drop', async ({ page, context }) => {
  await page.goto('/');
  await page.locator('[data-game="shape-workshop"]').click();
  await page.evaluate(() => {
    app.activeGame.destroy();
    app.activeGame = new ExplorerActivity(document.querySelector('#game-stage'), app);
    app.activeGame.container.innerHTML = '<button data-drag-id="piece" style="width:80px;height:80px">Piece</button><button data-drop-id="slot" style="width:80px;height:80px;margin-left:50px">Slot</button>';
    window.__drops = [];
    app.activeGame.bindDragDrop('[data-drag-id]', '[data-drop-id]', (piece, slot) => window.__drops.push([piece, slot]));
  });
  const source = page.locator('[data-drag-id="piece"]');
  const target = page.locator('[data-drop-id="slot"]');
  await source.scrollIntoViewIfNeeded();
  const a = await source.boundingBox(), b = await target.boundingBox();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x + 40, y: a.y + 40 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: b.x + 40, y: b.y + 40 }] });
  await expect(page.locator('.activity-drag-ghost')).toHaveCount(1);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(page.locator('.activity-drag-ghost')).toHaveCount(0);
  expect(await page.evaluate(() => window.__drops)).toEqual([]);
  await page.mouse.move(a.x + 40, a.y + 40);
  await page.mouse.down();
  await page.mouse.move(b.x + 40, b.y + 40, { steps: 5 });
  await expect(page.locator('.activity-drag-ghost')).toHaveCount(1);
  await page.evaluate(() => app.closeActiveGame());
  await page.mouse.up();
  await expect(page.locator('.activity-drag-ghost')).toHaveCount(0);
  expect(await page.evaluate(() => window.__drops)).toEqual([]);
  await cdp.detach();
});
