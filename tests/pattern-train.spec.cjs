const { test, expect } = require('@playwright/test');

async function launch(page) {
  await page.addInitScript(() => {
    let seed = 17;
    Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  });
  await page.goto('/');
  await page.locator('.island-card[data-game="pattern-train"]').click();
  await expect(page.locator('.ptr-mascot kid-model[model="train"]')).toBeVisible();
  await page.locator('[data-mode="easy"]').click();
}

async function correctIndex(page) {
  return page.evaluate(() => {
    const game = app.activeGame;
    return game.round.choices.findIndex(token => game.tokenKey(token) === game.tokenKey(game.round.sequence[game.round.missingIndex]));
  });
}

async function solve(page, keyboard = false) {
  const station = await page.evaluate(() => app.activeGame.roundIndex);
  const button = page.locator(`.ptr-choice[data-choice="${await correctIndex(page)}"]`);
  if (keyboard) await button.press('Enter');
  else await button.click();
  if (station === 4) await expect(page.locator('.ptr-game')).toHaveAttribute('data-phase', 'complete');
  else {
    await expect.poll(() => page.evaluate(() => app.activeGame.roundIndex)).toBe(station + 1);
    await expect(page.locator('.ptr-game')).toHaveAttribute('data-phase', 'playing');
  }
  await expect(page.locator('[data-action="next"]')).toHaveCount(0);
}

for (const mode of ['easy']) {
  test(`pattern train: complete ${mode}, exactly one answer and one reward`, async ({ page }) => {
    await launch(page);
    await page.evaluate(() => {
      window.__ptrRewards = [];
      const original = app.addStars.bind(app);
      app.addStars = amount => { window.__ptrRewards.push(amount); original(amount); };
    });
    for (let station = 0; station < 5; station++) {
      const state = await page.evaluate(() => {
        const g = app.activeGame, r = g.round;
        return {
          choices: r.choices.map(t => g.tokenKey(t)),
          matches: r.choices.filter(t => g.tokenKey(t) === g.tokenKey(r.sequence[r.missingIndex])).length,
          missing: r.missingIndex,
          sizeBased: r.sizeBased,
          pattern: r.pattern.map(t => g.tokenKey(t))
        };
      });
      expect(new Set(state.choices).size).toBe(2);
      expect(state.matches).toBe(1);
      expect(state.missing).toBe(3);
      expect(state.pattern).toHaveLength(2);
      await solve(page);
      await expect(page.locator('#score-val')).toHaveText(`${station + 1}/5`);
    }
    await expect(page.locator('.ptr-complete')).toBeVisible();
    await expect(page.locator('.ptr-full-train .ptr-carriage')).toHaveCount(5);
    expect(await page.evaluate(() => window.__ptrRewards)).toEqual([5]);
    await page.evaluate(() => { app.activeGame.nextStation(); app.activeGame.nextStation(); });
    await page.locator('#btn-lang').click();
    expect(await page.evaluate(() => window.__ptrRewards)).toEqual([5]);
    await expect(page.locator('.ptr-complete')).toContainText('You visited all 5 stations!');
    await page.locator('[data-action="replay"]').click();
    await expect(page.locator('#score-val')).toHaveText('0/5');
    for (let i = 0; i < 5; i++) await solve(page);
    expect(await page.evaluate(() => window.__ptrRewards)).toEqual([5, 5]);
    await page.locator('[data-action="menu"]').click();
    await expect(page.locator('[data-mode]')).toHaveCount(1);
  });
}

test('pattern train: wrong answers stay put, rapid clicks lock one answer and correct answers auto-advance', async ({ page }) => {
  await launch(page);
  const correct = await correctIndex(page);
  await page.locator(`.ptr-choice[data-choice="${(correct + 1) % 2}"]`).click();
  await expect(page.locator('#ptr-feedback')).toContainText('Hãy thử đồ chơi khác');
  await expect(page.locator('#score-val')).toHaveText('0/5');
  await expect(page.locator('.ptr-highlight')).toHaveCount(1);
  await page.waitForTimeout(3200);
  expect(await page.evaluate(() => app.activeGame.roundIndex)).toBe(0);
  await expect(page.locator('.ptr-game')).toHaveAttribute('data-phase', 'playing');
  await page.evaluate(index => {
    const buttons = [...document.querySelectorAll('.ptr-choice')];
    for (let i = 0; i < 10; i++) buttons[index].click();
    for (let i = 0; i < 10; i++) app.activeGame.choose(index);
  }, correct);
  await expect(page.locator('#score-val')).toHaveText('1/5');
  await expect(page.locator('.ptr-choice:disabled')).toHaveCount(2);
  expect(await page.evaluate(() => app.activeGame.roundIndex)).toBe(0);
  await expect.poll(() => page.evaluate(() => app.activeGame.roundIndex)).toBe(1);
  await expect(page.locator('[data-action="next"]')).toHaveCount(0);
  await expect(page.locator('.ptr-choice:enabled')).toHaveCount(2);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => app.activeGame.roundIndex)).toBe(1);
});

test('pattern train: VI/EN, speech and keyboard preserve round and explanation state', async ({ page }) => {
  await launch(page);
  const snapshot = () => page.evaluate(() => JSON.stringify({ rounds: app.activeGame.rounds, answers: app.activeGame.answers, index: app.activeGame.roundIndex }));
  const before = await snapshot();
  await page.locator('#btn-lang').click();
  expect(await snapshot()).toBe(before);
  await expect(page.locator('[data-action="listen"]')).toHaveAttribute('aria-label', 'Listen to instructions');
  await expect(page.locator('.ptr-choices')).toHaveAttribute('aria-label', 'Choose a toy for the missing carriage');
  await page.evaluate(() => { window.__ptrSpeech = []; app.activeGame.speak = text => window.__ptrSpeech.push(text); });
  await page.locator('[data-action="listen"]').press('Enter');
  expect(await page.evaluate(() => window.__ptrSpeech[0])).toContain('Which toy is missing');
  await page.locator(`.ptr-choice[data-choice="${await correctIndex(page)}"]`).press('Space');
  const answered = await snapshot();
  await page.locator('#btn-lang').click();
  expect(await snapshot()).toBe(answered);
  await expect(page.locator('.ptr-choice:disabled')).toHaveCount(2);
  await expect(page.locator('.ptr-choices')).toHaveAttribute('aria-label', 'Chọn đồ chơi cho toa còn thiếu');
  await expect.poll(() => page.evaluate(() => app.activeGame.roundIndex)).toBe(1);
  await expect(page.locator('.ptr-game')).toHaveAttribute('data-phase', 'playing');
  await expect(page.locator('[data-action="next"]')).toHaveCount(0);
  await solve(page, true);
  await expect(page.locator('#score-val')).toHaveText('2/5');
});

test('pattern train: back during explanation cleans timers, models and score', async ({ page }) => {
  await launch(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(() => { window.__oldPatternTrain = app.activeGame; });
  await page.locator(`.ptr-choice[data-choice="${await correctIndex(page)}"]`).click();
  await page.locator('#btn-back').click();
  expect(await page.evaluate(() => window.__oldPatternTrain.destroyed)).toBe(true);
  expect(await page.evaluate(() => window.__oldPatternTrain.timers.size)).toBe(0);
  await expect(page.locator('.ptr-game')).toHaveCount(0);
  await page.locator('.island-card[data-game="pattern-train"]').click();
  await page.locator('[data-mode="easy"]').click();
  await page.waitForTimeout(1500);
  await expect(page.locator('#score-val')).toHaveText('0/5');
  await expect(page.locator('.ptr-game')).toHaveAttribute('data-phase', 'playing');
  expect(await page.evaluate(() => app.stars)).toBe(0);
  expect(errors).toEqual([]);
});

test('pattern train: leaving during departure cancels the automatic next lesson', async ({ page }) => {
  await launch(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.evaluate(() => { window.__oldPatternTrain = app.activeGame; });
  await page.locator(`.ptr-choice[data-choice="${await correctIndex(page)}"]`).click();
  await page.clock.runFor(1520);
  await expect(page.locator('.ptr-game')).toHaveAttribute('data-phase', 'departing');
  await page.locator('#btn-back').click();
  await page.locator('[data-game="pattern-train"]').click();
  await page.locator('[data-level="easy"]').click();
  await page.clock.runFor(1100);
  expect(await page.evaluate(() => ({
    oldRound: window.__oldPatternTrain.roundIndex,
    timers: window.__oldPatternTrain.timers.size,
    newRound: app.activeGame.roundIndex,
    stars: app.stars,
  }))).toEqual({ oldRound: 0, timers: 0, newRound: 0, stars: 0 });
  await expect(page.locator('#score-val')).toHaveText('0/5');
});

test('pattern train: reduced motion still auto-advances and only after the explanation', async ({ page }) => {
  await launch(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.locator(`.ptr-choice[data-choice="${await correctIndex(page)}"]`).press('Enter');
  await expect(page.locator('.ptr-game')).toHaveAttribute('data-phase', 'explaining');
  await page.clock.runFor(420);
  expect(await page.evaluate(() => app.activeGame.roundIndex)).toBe(0);
  await page.clock.runFor(200);
  expect(await page.evaluate(() => app.activeGame.roundIndex)).toBe(1);
  await expect(page.locator('.ptr-game')).toHaveAttribute('data-phase', 'playing');
  await expect(page.locator('[data-choice]').first()).toBeFocused();
});

test('pattern train: dog uses its local illustration rather than a generic star', async ({ page }) => {
  await launch(page);
  await page.evaluate(() => {
    const dog = { model: 'dog', size: 'normal' };
    const cat = { model: 'cat', size: 'normal' };
    app.activeGame.rounds[0] = {
      pattern: [dog, cat], sequence: [dog, cat, dog, cat, dog, cat],
      missingIndex: 5, sizeBased: false,
      choices: [dog, cat, { model: 'star', size: 'normal' }]
    };
    app.activeGame.beginRound();
  });
  const dog = page.locator('.ptr-choice kid-model[model="dog"]');
  await expect(dog).toHaveAttribute('src', 'img/vocab/dog.svg');
  await expect(dog).toHaveAttribute('data-model-kind', 'illustration');
  await expect(dog).toHaveClass(/model-ready/);
  const artwork = dog.locator('img.model-fallback');
  await expect(artwork).toHaveAttribute('src', 'img/vocab/dog.svg');
  await expect.poll(() => artwork.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  const response = await page.request.get('/img/vocab/dog.svg');
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain('<svg');
});

for (const width of [320, 1440]) {
  test(`pattern train: selecting answers preserves model nodes and layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await launch(page);
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    const result = await page.evaluate(() => {
      const game = app.activeGame;
      const root = document.querySelector('.ptr-game');
      const train = root.querySelector('.ptr-train');
      const models = [...root.querySelectorAll('kid-model')];
      const choices = root.querySelector('.ptr-choices');
      const y = choices.getBoundingClientRect().top;
      const answer = game.round.sequence[game.round.missingIndex];
      const correct = game.round.choices.findIndex(token => game.tokenKey(token) === game.tokenKey(answer));
      game.choose((correct + 1) % 2);
      const wrong = {
        retained: models.every(model => model.isConnected),
        y: choices.getBoundingClientRect().top,
      };
      game.choose(correct);
      return {
        count: models.length,
        wrong,
        rightRetained: models.every(model => model.isConnected),
        sameTrain: train === document.querySelector('.ptr-train'),
        sameRoot: root === document.querySelector('.ptr-game'),
        newModels: root.querySelectorAll('kid-model').length - models.length,
        y, rightY: choices.getBoundingClientRect().top,
        filledModel: root.querySelector(`[data-carriage="${game.round.missingIndex}"] kid-model`).getAttribute('model'),
        answer: answer.model,
      };
    });
    expect(result.count).toBe(5);
    expect(result.wrong.retained).toBe(true);
    expect(result.rightRetained).toBe(true);
    expect(result.sameTrain).toBe(true);
    expect(result.sameRoot).toBe(true);
    expect(result.newModels).toBe(1);
    expect(result.filledModel).toBe(result.answer);
    expect(result.wrong.y).toBeCloseTo(result.y, 1);
    expect(result.rightY).toBeCloseTo(result.y, 1);
    await page.clock.runFor(3200);
    expect(await page.evaluate(() => app.activeGame.roundIndex)).toBe(1);
    expect(await page.locator('.ptr-choices').evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(result.y, 1);
    expect(await page.evaluate(() => {
      const models = [...document.querySelectorAll('.ptr-game kid-model')];
      app.activeGame.updateLanguage('en');
      return models.every(model => model.isConnected);
    })).toBe(true);
  });
}

test('pattern train: pending 3D models do not flash SVG and context loss restores fallback', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl2') window.__trainWebGLCanvas = this;
      return getContext.call(this, type, ...args);
    };
  });
  await launch(page);
  await page.evaluate(() => {
    app.activeGame.rounds[0] = {
      pattern: [{ model: 'cat', size: 'normal' }, { model: 'banana', size: 'normal' }],
      sequence: Array.from({ length: 6 }, (_, i) => ({ model: i % 2 ? 'banana' : 'cat', size: 'normal' })),
      missingIndex: 5, sizeBased: false,
      choices: ['cat', 'banana', 'star'].map(model => ({ model, size: 'normal' })),
    };
    app.activeGame.beginRound();
  });
  const model = page.locator('.ptr-choice kid-model[model="cat"]');
  await expect(model).toHaveClass(/model-ready/);
  expect(await model.evaluate(element => {
    element.classList.remove('model-ready');
    return getComputedStyle(element.querySelector('.model-fallback')).visibility;
  })).toBe('hidden');
  await page.evaluate(() => window.__trainWebGLCanvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.locator('html')).toHaveAttribute('data-graphics', 'fallback');
  await expect(model.locator('.model-fallback')).toBeVisible();
  await expect(page.locator('.ptr-choice')).toHaveCount(3);
});

for (const [width, height] of [[320, 740], [390, 844], [844, 390]]) {
  test(`pattern train: simple picture controls and hint at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await launch(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('.ptr-train .ptr-carriage')).toHaveCount(4);
    await expect(page.locator('.ptr-choice')).toHaveCount(2);
    await expect(page.locator('.ptr-carriage-label, .ptr-carriage-number, .ptr-instruction')).toHaveCount(0);
    await expect(page.locator('#game-hint')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const button of await page.locator('.ptr-choice, .ptr-listen').all()) {
      const rect = await button.boundingBox();
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
      expect(await button.getAttribute('aria-label')).toBeTruthy();
    }
    const index = await correctIndex(page);
    const y = await page.locator('.ptr-choices').evaluate(el => el.getBoundingClientRect().top - el.closest('.ptr-game').getBoundingClientRect().top);
    await page.locator(`[data-choice="${1 - index}"]`).click();
    await expect(page.locator(`[data-choice="${index}"]`)).toHaveClass(/ptr-hint/);
    expect(await page.evaluate(() => app.activeGame.roundIndex)).toBe(0);
    expect(await page.locator('.ptr-choices').evaluate(el => el.getBoundingClientRect().top - el.closest('.ptr-game').getBoundingClientRect().top)).toBeCloseTo(y, 1);
    await solve(page);
    await expect(page.locator('.ptr-hint')).toHaveCount(0);
    expect(await page.locator('.ptr-choices').evaluate(el => el.getBoundingClientRect().top - el.closest('.ptr-game').getBoundingClientRect().top)).toBeCloseTo(y, 1);
  });
}
