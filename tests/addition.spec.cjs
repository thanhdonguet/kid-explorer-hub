const { test, expect } = require('@playwright/test');

async function launch(page, level = 'easy') {
  await page.addInitScript(() => {
    localStorage.setItem('kid_explorer_lang', 'vi');
    localStorage.setItem('kid_explorer_stars', '0');
  });
  await page.goto('/');
  await page.locator('[data-game="math"]').click();
  await expect(page.locator('.fm-level')).toHaveCount(3);
  await page.locator('[data-level="' + level + '"]').click();
}

test('all generated sums and choices respect each limit, including 0 and 100', async ({ page }) => {
  await launch(page);
  const result = await page.evaluate(() => {
    const g = app.activeGame, random = Math.random;
    const results = [];
    for (const [level, limit] of [['easy', 10], ['medium', 20], ['hard', 100]]) {
      let bad = 0;
      for (let i = 0; i < 2000; i++) {
        const q = g.makeQuestion(level);
        if (!Number.isInteger(q.a) || !Number.isInteger(q.b) || q.a < 0 || q.b < 0 ||
            q.sum !== q.a + q.b || q.sum > limit || q.sum < g.levels[level].min ||
            new Set(q.choices).size !== 3 || q.choices.filter(n => n === q.sum).length !== 1 ||
            q.choices.some(n => !Number.isInteger(n) || n < 0 || n > limit)) bad++;
      }
      Math.random = () => .999999;
      const upper = g.makeQuestion(level);
      let call = 0;
      Math.random = () => call++ === 0 ? .999999 : 0;
      const zero = g.makeQuestion(level);
      Math.random = random;
      results.push({level, bad, upper: [upper.a, upper.b, upper.sum], zero: [zero.a, zero.b, zero.sum]});
    }
    return results;
  });
  expect(result).toEqual([
    {level:'easy',bad:0,upper:[10,0,10],zero:[0,10,10]},
    {level:'medium',bad:0,upper:[20,0,20],zero:[0,20,20]},
    {level:'hard',bad:0,upper:[100,0,100],zero:[0,100,100]},
  ]);
});

for (const level of ['easy', 'medium', 'hard']) {
  test(level + ': five sums, fast clicks, single reward, replay and level menu', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await launch(page, level);
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    for (let i = 0; i < 5; i++) {
      const q = await page.evaluate(() => app.activeGame.question);
      await page.locator('[data-answer="' + q.sum + '"]').press('Enter');
      await page.evaluate(value => { for(let n=0;n<20;n++) app.activeGame.choose(value); }, q.sum);
      await expect(page.locator('.fm-result')).toHaveText(String(q.sum));
      await expect(page.locator('.fm-answer:disabled')).toHaveCount(3);
      await expect(page.locator('#score-val')).toHaveText((i+1)+'/5');
      await page.clock.runFor(1250);
    }
    await expect(page.locator('.fm-addition')).toHaveAttribute('data-phase','complete');
    expect(await page.evaluate(() => app.stars)).toBe(5);
    await page.clock.runFor(5000);
    expect(await page.evaluate(() => app.stars)).toBe(5);
    await page.locator('[data-action="replay"]').click();
    expect(await page.evaluate(() => app.activeGame.currentLevel)).toBe(level);
    await expect(page.locator('#score-val')).toHaveText('0/5');
    await page.locator('[data-action="menu"]').click();
    await expect(page.locator('.fm-level')).toHaveCount(3);
    expect(errors).toEqual([]);
  });
}

test('wrong answer keeps the sum, opens accurate visual help and preserves state across VI/EN', async ({ page }) => {
  await launch(page, 'hard');
  await page.evaluate(() => {
    app.activeGame.question = {a:47,b:53,sum:100,choices:[99,100,98]};
    app.activeGame.render();
    window.__mathSpeech = [];
    TTS.speak = (text, opts) => __mathSpeech.push({text,lang:opts.lang});
  });
  await page.locator('[data-answer="99"]').click();
  await expect(page.locator('.fm-feedback')).toHaveText('Thử lại nhé 👀');
  await expect(page.locator('#score-val')).toHaveText('0/5');
  await expect(page.locator('.fm-hint')).toBeVisible();
  const groups = page.locator('.fm-quantities > div');
  for (const [i, value] of [47,53].entries()) {
    await expect(groups.nth(i).locator('.fm-ten')).toHaveCount(Math.floor(value/10));
    await expect(groups.nth(i).locator('.fm-one')).toHaveCount(value%10);
    await expect(groups.nth(i).locator('.fm-ten i')).toHaveCount(Math.floor(value/10)*10);
  }
  await page.locator('#btn-lang').click();
  await expect(page.locator('.fm-feedback')).toHaveText('Try again 👀');
  await page.locator('[data-action="listen"]').click();
  expect(await page.evaluate(() => __mathSpeech.at(-1))).toEqual({text:'What is 47 plus 53?',lang:'en-US'});
  expect(await page.evaluate(() => app.activeGame.question.sum)).toBe(100);
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.locator('[data-answer="100"]').press('Space');
  await page.locator('#btn-lang').click();
  await expect(page.locator('.fm-result')).toHaveText('100');
  await expect(page.locator('.fm-answer:disabled')).toHaveCount(3);
  await page.clock.runFor(1250);
  await expect(page.locator('.fm-addition')).toHaveAttribute('data-phase','playing');
});

test('easy fruit hints count both addends and support zero', async ({ page }) => {
  await launch(page);
  await page.evaluate(() => { app.activeGame.question={a:0,b:10,sum:10,choices:[8,9,10]}; app.activeGame.render(); });
  await expect(page.locator('.fm-quantities > div').nth(0).locator('.fm-zero')).toHaveText('0');
  await expect(page.locator('.fm-apples img')).toHaveCount(10);
  await page.locator('[data-action="hint"]').click();
  await expect(page.locator('.fm-hint')).toBeHidden();
});

test('leaving or changing level cancels delayed advancement', async ({ page }) => {
  await launch(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.evaluate(() => { window.__oldMath = app.activeGame; app.activeGame.choose(app.activeGame.question.sum); });
  await page.locator('[data-action="menu"]').click();
  await page.locator('[data-level="hard"]').click();
  await page.clock.runFor(1500);
  await expect(page.locator('#score-val')).toHaveText('0/5');
  await page.evaluate(() => app.activeGame.choose(app.activeGame.question.sum));
  await page.locator('#btn-back').click();
  await page.clock.runFor(1500);
  expect(await page.evaluate(() => ({destroyed:__oldMath.destroyed,timers:__oldMath.timers.size,stars:app.stars}))).toEqual({destroyed:true,timers:0,stars:0});
});

for (const [width,height] of [[320,740],[390,844],[844,390]]) {
  test('addition fits '+width+'x'+height+' with sum 100 and touch answers', async ({ browser }) => {
    const context=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width,height},hasTouch:true});
    const page=await context.newPage();
    await launch(page,'hard');
    await page.evaluate(() => { app.activeGame.question={a:47,b:53,sum:100,choices:[98,99,100]}; app.activeGame.hint=true; app.activeGame.render(); });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const button of await page.locator('.fm-answer,.fm-icon').all()) {
      const box=await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await page.locator('[data-answer="100"]').tap();
    await expect(page.locator('.fm-result')).toHaveText('100');
    await page.screenshot({path:'test-results/addition-'+width+'.png',fullPage:true});
    await context.close();
  });
}

test('addition starts and solves offline after PWA installation', async ({ page, context }) => {
  await launch(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await page.locator('[data-game="math"]').click();
  await page.locator('[data-level="hard"]').click();
  const sum=await page.evaluate(() => app.activeGame.question.sum);
  await page.locator('[data-answer="'+sum+'"]').click();
  await expect(page.locator('.fm-result')).toHaveText(String(sum));
});
