const { test, expect } = require('@playwright/test');

async function openAlphabet(page) {
  await page.addInitScript(() => {
    window.__spoken = [];
    window.__musicPlaying = false;
    window.__musicPlays = 0;
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [],
        speak: utterance => window.__spoken.push(utterance.text),
        cancel() {}, speaking: false, pending: false,
      },
    });
    HTMLMediaElement.prototype.play = function () {
      window.__musicPlaying = true;
      window.__musicPlays++;
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () { window.__musicPlaying = false; };
  });
  await page.goto('/');
  await page.locator('#btn-music').click();
  expect(await page.evaluate(() => __musicPlaying)).toBe(true);
  await page.locator('[data-game="alphabet-pop"]').click();
  expect(await page.evaluate(() => __musicPlaying)).toBe(false);
  await page.evaluate(() => {
    window.__effects = [];
    audio._voice = (...args) => __effects.push(['voice', ...args]);
    audio._noise = (...args) => __effects.push(['noise', ...args]);
    audio._sample = (...args) => { __effects.push(['sample', ...args]); return false; };
  });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
}

test('letters and vocabulary remain speech-only through five rounds, listening and replay', async ({ page }) => {
  await openAlphabet(page);
  await page.locator('.ap-letter-btn').filter({ hasText: /^A$/ }).press('Enter');
  expect(await page.evaluate(() => __spoken.at(-1))).toBe('ay');
  await page.clock.runFor(1000);
  for (let round = 0; round < 5; round++) {
    if (round === 0) await page.locator('.ap-flying-object:not([aria-label="A"])').first().press('Enter');
    await page.locator('.ap-flying-object[aria-label="A"]').press('Enter');
    expect(await page.evaluate(() => __spoken.at(-1))).toBe('ay');
    await page.clock.runFor(1150);
    const word = await page.locator('.ap-vocab-text').textContent();
    expect(await page.evaluate(() => __spoken.at(-1))).toBe(word);
    await page.locator('.ap-listen').press('Enter');
    expect(await page.evaluate(() => __spoken.at(-1))).toBe(word);
    await page.locator('.ap-vocab-image-container').click();
    expect(await page.evaluate(() => __spoken.at(-1))).toBe(word);
    await page.locator('.ap-next-btn').press('Enter');
  }
  await expect(page.locator('#alphabet-complete')).toBeVisible();
  expect(await page.evaluate(() => app.stars)).toBe(5);
  await page.locator('#ap-btn-replay').press('Enter');
  await expect(page.locator('.ap-flying-object')).toHaveCount(10);
  await page.locator('.ap-back-btn').press('Enter');
  await expect(page.locator('.ap-letter-btn')).toHaveCount(26);
  expect(await page.evaluate(() => __effects)).toEqual([]);
  expect(await page.evaluate(() => ({ playing: __musicPlaying, starts: __musicPlays }))).toEqual({ playing: false, starts: 1 });
  await page.locator('#btn-back').click();
  expect(await page.evaluate(() => __musicPlaying)).toBe(true);
});

test('muting also stops letter and word speech without enabling music in the game', async ({ page }) => {
  await openAlphabet(page);
  await page.locator('#btn-sound').click();
  await page.evaluate(() => { window.__effects = []; window.__spoken = []; });
  await page.locator('.ap-letter-btn').filter({ hasText: /^B$/ }).press('Enter');
  await page.clock.runFor(1000);
  await page.locator('.ap-flying-object[aria-label="B"]').press('Enter');
  await page.clock.runFor(1150);
  await page.locator('.ap-listen').press('Enter');
  expect(await page.evaluate(() => __spoken)).toEqual([]);
  expect(await page.evaluate(() => __effects)).toEqual([]);
  expect(await page.evaluate(() => __musicPlaying)).toBe(false);
});
