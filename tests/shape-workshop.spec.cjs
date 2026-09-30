const { test, expect } = require('@playwright/test');

async function launch(page, mode = 'easy') {
  await page.addInitScript(() => {
    localStorage.clear();
    window.__swpAwards = [];
  });
  await page.goto('/');
  await page.locator('[data-game="shape-workshop"]').click();
  await expect(page.locator('[data-swp-screen="menu"]')).toBeVisible();
  await expect(page.locator('.swp-menu kid-model[model="robot"]')).toBeVisible();
  await expect(page.locator('[data-level]')).toHaveCount(3);
  await page.evaluate(() => {
    const original = app.addStars.bind(app);
    app.addStars = count => { window.__swpAwards.push(count); original(count); };
    window.__swpGame = app.activeGame;
  });
  await page.locator(`[data-swp-mode="${mode}"]`).click();
}

async function matchFor(page, target) {
  const [shape, size, angle] = await Promise.all(
    ['data-shape', 'data-size', 'data-angle'].map(attribute => target.getAttribute(attribute)),
  );
  return page.locator(`.swp-piece:not(:disabled)[data-shape="${shape}"][data-size="${size}"][data-angle="${angle}"]`).first();
}

async function finishObject(page) {
  while (await page.locator('.swp-target:not(:disabled)').count()) {
    const target = page.locator('.swp-target:not(:disabled)').first();
    const piece = await matchFor(page, target);
    await piece.click();
    await target.click();
  }
  await expect(page.locator('[data-swp-screen="reward"]')).toBeVisible();
}

async function finishSession(page) {
  for (let round = 0; round < 5; round++) {
    await finishObject(page);
    await expect(page.locator('#score-val')).toHaveText(`${round + 1}/5`);
    await expect(page.locator('.swp-reward-toy kid-model')).toHaveCount(1);
    // Completion stays put until the child explicitly asks for the next toy.
    await expect(page.locator('[data-swp-screen="reward"]')).toHaveAttribute('data-swp-round', `${round}`);
    await page.locator('[data-swp-next]').click();
  }
  await expect(page.locator('[data-swp-screen="gallery"]')).toBeVisible();
}

for (const mode of ['easy', 'medium', 'hard']) {
  test(`shape workshop: complete all five objects in ${mode}`, async ({ page }) => {
    await launch(page, mode);
    await expect(page.locator('.swp-target')).toHaveCount(mode === 'easy' ? 3 : 6);
    if (mode === 'hard') await expect(page.locator('.swp-piece')).toHaveCount(8);
    await finishSession(page);
    await expect(page.locator('.swp-village kid-model')).toHaveCount(5);
    expect(await page.evaluate(() => window.__swpAwards)).toEqual([5]);
    await page.evaluate(() => {
      window.__swpGame.placePiece('p0', 't0');
      window.__swpGame.next();
      window.__swpGame.next();
      window.__swpGame.updateLanguage('en');
      window.__swpGame.render();
    });
    expect(await page.evaluate(() => window.__swpAwards)).toEqual([5]);
    await page.locator('[data-swp-replay]').click();
    await expect(page.locator('#score-val')).toHaveText('0/5');
    await expect(page.locator('.swp-level')).toHaveText({ easy: 'Easy', medium: 'Medium', hard: 'Hard' }[mode]);
    expect(await page.evaluate(() => window.__swpGame.awarded)).toBe(false);
  });
}

test('shape workshop: wrong shape, size and direction are helpful and never score', async ({ page }) => {
  await launch(page, 'hard');
  const target = page.locator('[data-drop-id="t0"]');
  await page.locator('.swp-piece[data-shape="square"]').first().click();
  await target.click();
  await expect(page.locator('.swp-feedback')).toHaveAttribute('data-message', 'wrong');
  await page.locator('[data-drag-id="d-size"]').click();
  await target.click();
  await expect(page.locator('.swp-feedback')).toHaveAttribute('data-message', 'wrongSize');
  await expect(page.locator('[data-drag-id="d-size"]')).toBeEnabled();
  await page.locator('[data-drag-id="d-angle"]').click();
  await target.click();
  await expect(page.locator('.swp-feedback')).toHaveAttribute('data-message', 'wrongAngle');
  await expect(page.locator('.swp-filled')).toHaveCount(0);
  await expect(page.locator('#score-val')).toHaveText('0/5');
  expect(await page.evaluate(() => window.__swpAwards)).toEqual([]);
  await page.locator('#btn-lang').click();
  await expect(page.locator('.swp-feedback')).toContainText('same way');
  await finishObject(page);
  await expect(page.locator('#score-val')).toHaveText('1/5');
});

test('shape workshop: every medium object has a rejected extra piece and remains solvable', async ({ page }) => {
  await launch(page, 'medium');
  for (let round = 0; round < 5; round++) {
    const targetCount = await page.locator('.swp-target').count();
    await expect(page.locator('.swp-piece')).toHaveCount(targetCount + 1);
    for (let index = 0; index < targetCount; index++) {
      await page.locator('[data-drag-id="d-medium"]').click();
      await page.locator('.swp-target').nth(index).click();
      await expect(page.locator('.swp-feedback')).toHaveAttribute('data-message', /^(wrong|wrongAngle)$/);
    }
    await expect(page.locator('[data-drag-id="d-medium"]')).toBeEnabled();
    await expect(page.locator('.swp-filled')).toHaveCount(0);
    await expect(page.locator('#score-val')).toHaveText(`${round}/5`);
    await finishObject(page);
    expect(await page.evaluate(() => window.__swpGame.used.has('d-medium'))).toBe(false);
    await page.locator('[data-swp-next]').click();
  }
  await expect(page.locator('[data-swp-screen="gallery"]')).toBeVisible();
  expect(await page.evaluate(() => window.__swpAwards)).toEqual([5]);
});

test('shape workshop: mouse drag snaps and wrong drag leaves the tray unchanged', async ({ page }) => {
  await launch(page);
  const target = page.locator('[data-drop-id="t0"]');
  await page.locator('.swp-piece[data-shape="square"]').dragTo(target);
  await expect(page.locator('.swp-filled')).toHaveCount(0);
  await expect(page.locator('.swp-feedback')).toHaveAttribute('data-message', 'wrong');
  const piece = await matchFor(page, target);
  const pieceId = await piece.getAttribute('data-drag-id');
  await piece.dragTo(target);
  await expect(target).toHaveClass(/swp-filled/);
  await expect(page.locator(`[data-drag-id="${pieceId}"]`)).toBeDisabled();
  await expect(page.locator('.swp-piece[aria-pressed="true"]')).toHaveCount(0);
});

test('shape workshop: dragging carries the colored shape, size and direction instead of text', async ({ page }) => {
  await launch(page, 'hard');
  for (const id of ['p0', 'd-size', 'd-angle']) {
    const piece = page.locator(`[data-drag-id="${id}"]`);
    await piece.scrollIntoViewIfNeeded();
    const source = await piece.locator('svg').evaluate(svg => {
      const box = svg.getBoundingClientRect();
      return {
        shape: svg.innerHTML,
        color: getComputedStyle(svg.querySelector('g')).fill,
        width: box.width, height: box.height,
      };
    });
    const box = await piece.boundingBox();
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 30, y - 30, { steps: 4 });
    const ghost = page.locator('.activity-drag-ghost');
    await expect(ghost.locator('svg')).toHaveCount(1);
    await expect(ghost).toHaveText('');
    const preview = await ghost.locator('svg').evaluate(svg => {
      const box = svg.getBoundingClientRect();
      return {
        shape: svg.innerHTML,
        color: getComputedStyle(svg.querySelector('g')).fill,
        width: box.width, height: box.height,
      };
    });
    expect(preview.shape).toBe(source.shape);
    expect(preview.color).toBe(source.color);
    expect(preview.width).toBeCloseTo(source.width, 1);
    expect(preview.height).toBeCloseTo(source.height, 1);
    await expect(ghost).toHaveCSS('pointer-events', 'none');
    const firstPosition = await ghost.boundingBox();
    await page.mouse.move(x - 50, y - 50);
    const nextPosition = await ghost.boundingBox();
    expect(nextPosition.x).toBeCloseTo(firstPosition.x - 20, 1);
    expect(nextPosition.y).toBeCloseTo(firstPosition.y - 20, 1);
    await page.mouse.up();
    await expect(ghost).toHaveCount(0);
  }
});

test('shape workshop: keyboard builds with Enter and Space', async ({ page }) => {
  await launch(page);
  const targets = await page.locator('.swp-target').count();
  for (let index = 0; index < targets; index++) {
    const target = page.locator('.swp-target:not(:disabled)').first();
    const piece = await matchFor(page, target);
    await piece.focus();
    await page.keyboard.press(index % 2 ? 'Enter' : 'Space');
    await expect(piece).toHaveAttribute('aria-pressed', 'true');
    await target.focus();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('[data-swp-next]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-swp-screen="build"]')).toHaveAttribute('data-swp-round', '1');
});

test('shape workshop: language switches preserve selection and placed pieces; listen uses new language', async ({ page }) => {
  await launch(page, 'medium');
  const first = page.locator('[data-drop-id="t0"]');
  await (await matchFor(page, first)).click();
  await first.click();
  const second = page.locator('[data-drop-id="t1"]');
  const piece = await matchFor(page, second);
  const selected = await piece.getAttribute('data-drag-id');
  await piece.click();
  await page.locator('#btn-lang').click();
  await expect(page.locator('.swp-game')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.swp-filled')).toHaveCount(1);
  await expect(page.locator(`[data-drag-id="${selected}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(second).toHaveAttribute('aria-label', /square/);
  await page.evaluate(() => {
    window.__swpSpoken = [];
    window.TTS.speak = (text, options) => window.__swpSpoken.push({ text, lang: options.lang });
  });
  await page.locator('[data-swp-listen]').click();
  expect(await page.evaluate(() => window.__swpSpoken.at(-1))).toEqual({
    text: 'House. Drag a piece onto its shadow, or choose a piece and then a shadow. Take your time!',
    lang: 'en-US',
  });
  await second.click();
  await page.locator('#btn-lang').click();
  await expect(page.locator('.swp-filled')).toHaveCount(2);
  await expect(page.locator('.swp-game')).toHaveAttribute('lang', 'vi');
  await finishObject(page);
});

test('shape workshop: replay earns a fresh single award and gallery offers the level menu', async ({ page }) => {
  await launch(page);
  await finishSession(page);
  await page.locator('[data-swp-replay]').click();
  await finishSession(page);
  expect(await page.evaluate(() => window.__swpAwards)).toEqual([5, 5]);
  await page.locator('[data-swp-menu]').click();
  await expect(page.locator('[data-swp-mode]')).toHaveCount(3);
  await page.locator('[data-swp-mode="hard"]').click();
  await expect(page.locator('.swp-target')).toHaveCount(6);
  await expect(page.locator('#score-val')).toHaveText('0/5');
});

test('shape workshop: touch drag on a phone', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await launch(page);
  const target = page.locator('[data-drop-id="t0"]');
  const piece = await matchFor(page, target);
  const sourceBox = await piece.boundingBox();
  const targetBox = await target.boundingBox();
  const from = { x: sourceBox.x + sourceBox.width / 2, y: sourceBox.y + sourceBox.height / 2 };
  const to = { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 };
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
  for (let step = 1; step <= 8; step++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{
      x: from.x + (to.x - from.x) * step / 8, y: from.y + (to.y - from.y) * step / 8,
    }] });
  }
  await expect(page.locator('.activity-drag-ghost svg')).toHaveCount(1);
  await expect(page.locator('.activity-drag-ghost')).toHaveText('');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('.activity-drag-ghost')).toHaveCount(0);
  await expect(target).toHaveClass(/swp-filled/);
  await expect(page.locator('.swp-filled')).toHaveCount(1);
  await context.close();
});

test('shape workshop: leaving during a drag cancels callbacks and state updates', async ({ page }) => {
  await launch(page);
  const source = await page.locator('.swp-piece').first().boundingBox();
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(source.x - 50, source.y - 20, { steps: 4 });
  // Navigation while a pointer is down represents an interrupted mobile gesture.
  await page.locator('#btn-back').evaluate(button => button.click());
  await page.mouse.up();
  await expect(page.locator('.swp-game')).toHaveCount(0);
  expect(await page.evaluate(() => {
    const game = window.__swpGame;
    game.placePiece('p0', 't0');
    game.startMode('hard');
    game.updateLanguage('en');
    game.next();
    return { destroyed: game.destroyed, timers: game.timers.size, awards: window.__swpAwards };
  })).toEqual({ destroyed: true, timers: 0, awards: [] });
  await page.locator('[data-game="shape-workshop"]').click();
  await expect(page.locator('[data-swp-screen="menu"]')).toBeVisible();
  await page.locator('[data-swp-mode="easy"]').click();
  await expect(page.locator('#score-val')).toHaveText('0/5');
});

for (const viewport of [{ width: 320, height: 844 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`shape workshop: ${viewport.width}x${viewport.height} fits and controls remain usable`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await launch(page, 'hard');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const buttons = page.locator('.swp-piece, .swp-target');
    for (let index = 0; index < await buttons.count(); index++) {
      const box = await buttons.nth(index).boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(43);
      expect(box.height).toBeGreaterThanOrEqual(43);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    }
    await finishObject(page);
    await expect(page.locator('[data-swp-next]')).toBeInViewport();
  });
}
