const { test, expect } = require('@playwright/test');

async function openStories(page) {
  await page.addInitScript(() => {
    localStorage.setItem('kid_explorer_lang', 'vi');
    localStorage.setItem('kid_explorer_stars', '0');
  });
  await page.goto('/');
  await page.locator('[data-game="story-garden"]').click();
  await expect(page.locator('.sgr-game')).toHaveAttribute('data-phase', 'arrange');
  await expect(page.locator('.sgr-menu, [data-mode]')).toHaveCount(0);
}

test('all twelve stories play in short sessions without repeating before the library is used', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openStories(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  expect(await page.evaluate(() => app.activeGame.stories.length)).toBe(12);
  const seen = new Set();
  let previousSession;
  for (let session = 0; session < 4; session++) {
    const currentSession = await page.evaluate(() => app.activeGame.sessionStories.map(story => story.id));
    expect(currentSession).toHaveLength(3);
    expect(new Set(currentSession).size).toBe(3);
    for (let round = 0; round < 3; round++) {
      const story = await page.evaluate(() => ({
        id: app.activeGame.story.id,
        steps: app.activeGame.steps.map(step => step[0]),
      }));
      expect(seen.has(story.id), story.id).toBe(false);
      seen.add(story.id);
      await expect(page.locator('.sgr-card svg')).toHaveCount(3);
      await expect(page.locator('.sgr-placeholder svg')).toHaveCount(3);
      const pictures = await page.locator('.sgr-card svg').evaluateAll(nodes => nodes.map(node => node.outerHTML));
      expect(new Set(pictures).size, story.id).toBe(3);
      expect(await page.locator('.sgr-game').innerText()).not.toMatch(/[\p{L}\p{N}]/u);
      for (const [index, id] of story.steps.entries()) {
        await page.locator(`[data-card="${id}"]`).press('Enter');
        await page.locator(`[data-slot="${index}"]`).press('Space');
      }
      await expect(page.locator('.sgr-game')).toHaveAttribute('data-phase', 'playing');
      await page.clock.runFor(4300);
      await expect(page.locator('.sgr-game')).toHaveAttribute('data-phase', round === 2 ? 'complete' : 'reward');
      await expect(page.locator('[data-earned="true"]')).toHaveCount(round + 1);
      if (round < 2) await page.locator('[data-action="next"]').press('Enter');
    }
    expect(await page.evaluate(() => app.stars)).toBe((session + 1) * 5);
    await page.evaluate(() => app.activeGame.finishStory());
    expect(await page.evaluate(() => app.stars)).toBe((session + 1) * 5);
    previousSession = currentSession;
    await page.locator('[data-action="replay"]').press('Enter');
  }
  expect(seen.size).toBe(12);
  const nextCycle = await page.evaluate(() => app.activeGame.sessionStories.map(story => story.id));
  expect(nextCycle.some(id => previousSession.includes(id))).toBe(false);
  expect(errors).toEqual([]);
});

test('new picture stories preserve selection, language, progress and playback cleanup', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openStories(page);
  await page.evaluate(() => {
    const game = app.activeGame;
    game.sessionStories = game.stories.filter(story => ['cake', 'paper-boat', 'school'].includes(story.id));
    game.startStory();
  });
  const details = await page.evaluate(() => ({
    id: app.activeGame.steps[0][0],
    en: app.activeGame.steps[0][2],
    sequence: app.activeGame.steps.map(step => step[0]),
  }));
  await page.locator(`[data-card="${details.id}"]`).click();
  await page.locator('#btn-lang').click();
  await expect(page.locator(`[data-card="${details.id}"]`)).toHaveAttribute('aria-label', details.en);
  await expect(page.locator(`[data-card="${details.id}"]`)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-slot="0"]').click();
  for (let i = 1; i < details.sequence.length; i++) {
    await page.locator(`[data-card="${details.sequence[i]}"]`).press('Enter');
    await page.locator(`[data-slot="${i}"]`).press('Space');
  }
  await expect(page.locator('.sgr-game')).toHaveAttribute('data-phase', 'playing');
  await page.evaluate(() => { window.__oldStoryGame = app.activeGame; });
  await page.locator('#btn-back').click();
  expect(await page.evaluate(() => ({
    destroyed: __oldStoryGame.destroyed,
    timers: __oldStoryGame.timers.size,
    stars: app.stars,
  }))).toEqual({ destroyed: true, timers: 0, stars: 0 });
});

for (const [width, height] of [[320, 740], [844, 390]]) {
  test(`new illustrations remain usable at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openStories(page);
    await page.evaluate(() => {
      const game = app.activeGame;
      game.sessionStories = game.stories.filter(story => ['bird', 'butterfly', 'laundry'].includes(story.id));
      game.startStory();
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const button of await page.locator('.sgr-slot, .sgr-card').all()) {
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const id = await page.evaluate(() => app.activeGame.steps[0][0]);
    await page.locator(`[data-card="${id}"]`).press('Enter');
    await page.locator('[data-slot="0"]').press('Space');
    await expect(page.locator('[data-slot="0"]')).toHaveAttribute('data-drag-id', id);
  });
}
