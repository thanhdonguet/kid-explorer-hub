const { test, expect } = require('@playwright/test');

async function launch(page) {
  await page.addInitScript(() => {
    localStorage.setItem('kid_explorer_lang', 'vi');
    localStorage.setItem('kid_explorer_stars', '0');
  });
  await page.goto('/');
  await page.locator('[data-game="math"]').click();
  await page.locator('[data-level="easy"]').click();
  await page.evaluate(() => {
    app.activeGame.question = { a: 2, b: 3, sum: 5, choices: [4, 5, 6] };
    app.activeGame.render();
  });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
}

test('correct addition stays visibly successful with reduced motion and mute', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await launch(page);
  await page.locator('#btn-sound').click();
  await page.evaluate(() => {
    window.__additionVoices = 0;
    audio._voice = () => window.__additionVoices++;
  });
  await page.locator('[data-answer="5"]').press('Enter');

  await expect(page.locator('.fm-success')).toContainText('Đúng rồi!');
  await expect(page.locator('.fm-success-mark')).toBeVisible();
  await expect(page.locator('.fm-result')).toHaveText('5');
  await expect(page.locator('.fm-celebration')).toBeHidden();
  expect(await page.locator('.fm-result').evaluate(el => ({
    animation: getComputedStyle(el).animationName,
    background: getComputedStyle(el).backgroundColor,
  }))).toEqual({ animation: 'none', background: 'rgb(220, 239, 199)' });
  expect(await page.evaluate(() => window.__additionVoices)).toBe(0);
  await page.screenshot({ path: 'test-results/addition-correct-reduced.png' });

  await page.clock.runFor(1000);
  await expect(page.locator('.fm-success')).toBeVisible();
  await page.locator('#btn-lang').click();
  await expect(page.locator('.fm-success')).toContainText('Correct!');
  await expect(page.locator('.fm-answer:disabled')).toHaveCount(3);
  await expect(page.locator('#score-val')).toHaveText('1/5');
  await page.clock.runFor(201);
  await expect(page.locator('.fm-addition')).toHaveAttribute('data-phase', 'playing');
  await expect(page.locator('.fm-success,.fm-celebration')).toHaveCount(0);
});

test('normal motion celebrates once, fits a small screen and clears on menu or exit', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await launch(page);
  await page.locator('[data-answer="5"]').click();
  await page.evaluate(() => {
    for (let i = 0; i < 20; i++) app.activeGame.choose(5);
  });

  await expect(page.locator('.fm-success')).toBeVisible();
  await expect(page.locator('.fm-celebration')).toHaveCount(1);
  await expect(page.locator('.fm-celebration')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.fm-celebration-star')).toHaveCount(8);
  await expect(page.locator('#score-val')).toHaveText('1/5');
  expect(await page.locator('.fm-result').evaluate(el => getComputedStyle(el).animationName)).toBe('fm-success-pulse');
  expect(await page.locator('.fm-celebration-star').first().evaluate(el => getComputedStyle(el).animationName)).toBe('fm-success-stars');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.clock.runFor(250);
  await page.screenshot({ path: 'test-results/addition-correct-mobile.png' });

  await page.locator('[data-action="menu"]').click();
  await expect(page.locator('.fm-level')).toHaveCount(3);
  await expect(page.locator('.fm-success,.fm-celebration')).toHaveCount(0);
  await page.clock.runFor(1500);
  await expect(page.locator('.fm-addition')).toHaveAttribute('data-phase', 'menu');
  await page.locator('[data-level="easy"]').click();
  await page.evaluate(() => {
    window.__additionGame = app.activeGame;
    app.activeGame.choose(app.activeGame.question.sum);
  });
  await page.locator('#btn-back').click();
  await page.clock.runFor(1500);
  expect(await page.evaluate(() => ({
    destroyed: window.__additionGame.destroyed,
    timers: window.__additionGame.timers.size,
    stars: app.stars,
  }))).toEqual({ destroyed: true, timers: 0, stars: 0 });
  await expect(page.locator('.fm-success,.fm-celebration')).toHaveCount(0);
});
