const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

async function open(page) {
  await page.goto('/');
  await expect(page.locator('kid-model[model="world"]')).toHaveClass(/model-ready/);
  await page.locator('#btn-sound').click();
}
async function launch(page, game) { await page.locator(`.island-card[data-game="${game}"]`).click(); }
async function back(page) { await page.locator('#btn-back').click(); }

test('all referenced vocabulary and embedded GLB resources exist', () => {
  const vocab = fs.readFileSync('www/js/games/alphabet-pop.js', 'utf8');
  for (const match of vocab.matchAll(/i:'([^']+)'/g)) expect(fs.existsSync(`www/img/vocab/${match[1]}`), match[1]).toBeTruthy();
  const manifest = JSON.parse(fs.readFileSync('www/img/models/manifest.json'));
  expect(Object.keys(manifest)).toHaveLength(42);
  for (const file of Object.values(manifest)) {
    const bytes = fs.readFileSync(`www/${file}`);
    expect(bytes.readUInt32LE(8)).toBe(bytes.length);
    const data = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
    for (const img of data.images || []) expect(img.uri?.startsWith('data:') || img.bufferView !== undefined, file).toBeTruthy();
  }
});

test('home, all six games, rendering cleanup, language and console', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await open(page);
  await page.screenshot({ path: 'test-results/home-desktop.png' });
  for (const game of ['memory', 'color', 'math', 'alphabet-pop', 'drawing', 'vehicle-parking']) {
    await launch(page, game);
    await expect(page.locator('#game-screen')).toHaveClass(/active/);
    await expect(page.locator('#game-stage')).not.toBeEmpty();
    if (game !== 'alphabet-pop') await expect(page.locator('#game-stage kid-model.model-ready').first()).toBeVisible();
    await page.locator('#btn-lang').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.screenshot({ path: `test-results/game-${game}.png` });
    await page.locator('#btn-lang').click();
    await back(page);
    expect(await page.evaluate(() => window.Explorer3D.viewCount)).toBe(7);
  }
  await page.locator('#btn-lang').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(errors).toEqual([]);
});

test('audio stays gesture-gated, mute covers music, and music remains lazy', async ({ page }) => {
  await page.addInitScript(() => {
    window.__musicPlays = 0;
    window.__musicPauses = 0;
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value() { window.__musicPlays++; return Promise.resolve(); },
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value() { window.__musicPauses++; },
    });
  });
  await page.goto('/');
  expect(await page.evaluate(() => audio.ctx === null && audio.music === null)).toBe(true);
  expect(fs.readFileSync('www/asset-list.js', 'utf8')).not.toContain('audio/music/dashboard.ogg');
  expect(fs.readFileSync('www/js/games/vehicle-parking.js', 'utf8')).not.toContain('gain.connect(this.audioCtx.destination)');

  await page.locator('#btn-music').click();
  expect(await page.evaluate(() => Boolean(audio.ctx) && audio.musicEnabled)).toBe(true);
  expect(await page.evaluate(() => window.__musicPlays)).toBe(1);

  await page.locator('#btn-sound').click();
  expect(await page.evaluate(() => audio.muted)).toBe(true);
  expect(await page.evaluate(() => window.__musicPauses)).toBeGreaterThan(0);
  expect(await page.evaluate(() => {
    let voices = 0;
    const original = audio._voice;
    audio._voice = () => voices++;
    audio.playSuccess();
    audio._voice = original;
    return voices;
  })).toBe(0);
});

test('memory completes and an abandoned match cannot change the next game', async ({ page }) => {
  await open(page); await launch(page, 'memory');
  await page.locator('[data-pairs="5"]').click();
  const ids = await page.locator('.mem-card').evaluateAll(cards => [...new Set(cards.map(c => c.dataset.cardId))]);
  for (const id of ids) {
    const pair = page.locator(`.mem-card[data-card-id="${id}"]`);
    await pair.nth(0).click(); await pair.nth(1).click();
    await expect(pair.nth(0)).toHaveClass(/mem-matched/);
  }
  await expect(page.locator('#memory-complete-screen')).toBeVisible();
  expect(await page.evaluate(() => Number(localStorage.getItem('kid_explorer_stars')))).toBe(1);
  await page.locator('#comp-btn-replay').click();
  const id = await page.locator('.mem-card').first().getAttribute('data-card-id');
  await page.locator(`[data-card-id="${id}"]`).nth(0).click();
  await page.locator(`[data-card-id="${id}"]`).nth(1).click();
  await back(page); await launch(page, 'math');
  await page.waitForTimeout(1200);
  await expect(page.locator('#score-val')).toHaveText('0/5');
});

test('fruit fast taps complete one question exactly once and finish five rounds', async ({ page }) => {
  await open(page); await launch(page, 'math');
  for (let round = 0; round < 5; round++) {
    await expect.poll(() => page.evaluate(() => app.activeGame.roundLocked)).toBe(false);
    // Dispatch a rapid burst as a child may do; all UI buttons receive the burst.
    await page.locator('.fm-fruit').evaluateAll(buttons => buttons.forEach(button => button.click()));
    await expect(page.locator('#score-val')).toHaveText(`${round + 1}/5`);
    expect(await page.evaluate(() => app.activeGame.currentCount)).toBe(await page.evaluate(() => app.activeGame.targetCount));
  }
  await expect(page.locator('.fm-win-overlay')).toBeVisible();
  expect(await page.evaluate(() => app.stars)).toBe(10);
});

test('mix recipes update the 3D bowl, keyboard works, reset clears', async ({ page }) => {
  await open(page); await launch(page, 'color');
  await page.locator('#bubble-red').press('Enter');
  await page.locator('#bubble-yellow').press('Enter');
  await expect(page.locator('#cmx-result-name-en')).toHaveText('Orange');
  await expect(page.locator('#cmx-bowl-model')).toHaveAttribute('color', '#ffa500');
  await page.locator('#cmx-reset-btn').click();
  await expect(page.locator('#cmx-result-name-en')).toHaveText('—');
  await expect(page.locator('#cmx-bowl-model')).toHaveAttribute('color', '#c1d5bf');
});

test('every additional paint changes the mix and full-bowl feedback is localized', async ({ page }) => {
  await open(page); await launch(page, 'color');
  const sequence = ['red', 'yellow', 'red', 'blue', 'white', 'green', 'magenta', 'black'];
  let previous = null;
  for (const id of sequence) {
    await page.locator(`#bubble-${id}`).press('Enter');
    const hex = await page.locator('#cmx-result-hex').textContent();
    await expect(page.locator('#cmx-bowl-model')).toHaveAttribute('color', hex.toLowerCase());
    if (previous) {
      const delta = await page.evaluate(([a, b]) => {
        const game = app.activeGame;
        return game._deltaE(game._hexToRgb(a), game._hexToRgb(b));
      }, [previous, hex]);
      expect(delta, `${id} should visibly change ${previous}`).toBeGreaterThanOrEqual(2.2);
    }
    previous = hex;
  }
  await page.locator('#bubble-cyan').press('Enter');
  await expect(page.locator('#app-toast')).toContainText('Bát đã đầy 8 màu rồi!');
  await page.locator('#btn-lang').click();
  await page.locator('#bubble-cyan').press('Enter');
  await expect(page.locator('#app-toast')).toContainText('The bowl is full after 8 colors!');

  const lessons = [
    ['red', 'yellow', 'Orange'],
    ['blue', 'yellow', 'Green'],
    ['red', 'blue', 'Purple'],
    ['red', 'white', 'Pink'],
    ['black', 'white', 'Gray'],
  ];
  for (const [first, second, name] of lessons) {
    await page.locator('#cmx-reset-btn').click();
    await page.locator(`#bubble-${first}`).press('Enter');
    await page.locator(`#bubble-${second}`).press('Enter');
    await expect(page.locator('#cmx-result-name-en')).toHaveText(name);
  }
  await page.locator('#cmx-reset-btn').click();
  await page.locator('#bubble-yellow').press('Enter');
  await page.locator('#bubble-red').press('Enter');
  const orange = await page.locator('#cmx-result-hex').textContent();
  await page.locator('#bubble-red').press('Enter');
  const redder = await page.locator('#cmx-result-hex').textContent();
  const distances = await page.evaluate(([before, after]) => {
    const game = app.activeGame, red = game.COLORS.find(color => color.id === 'red');
    return [game._deltaE(game._hexToRgb(before), red), game._deltaE(game._hexToRgb(after), red)];
  }, [orange, redder]);
  expect(distances[1]).toBeLessThan(distances[0]);

  for (const id of ['red', 'white', 'black']) {
    await page.locator('#cmx-reset-btn').click();
    const shades = [];
    for (let drop = 0; drop < 3; drop++) {
      await page.locator(`#bubble-${id}`).press('Enter');
      shades.push(await page.locator('#cmx-result-hex').textContent());
    }
    expect(new Set(shades).size, `${id} concentration should remain visible`).toBe(3);
  }
});

test('alphabet session learns five words and awards stars', async ({ page }) => {
  await open(page); await launch(page, 'alphabet-pop');
  await page.getByRole('button', { name: 'A', exact: true }).click();
  for (let round = 0; round < 5; round++) {
    await page.locator('.ap-flying-object[aria-label="A"]').click();
    await expect(page.locator('.ap-vocab-result')).toBeVisible();
    await expect(page.locator('.ap-vocab-result kid-model')).toHaveClass(/model-ready/);
    await page.locator('.ap-next-btn').click();
  }
  await expect(page.locator('#alphabet-complete')).toBeVisible();
  await expect(page.locator('.ap-complete-word')).toHaveCount(5);
  expect(await page.evaluate(() => app.stars)).toBe(5);
});

test('mouse and touch drags reach the bowl and the correct vehicle station', async ({ page, context }) => {
  await open(page);
  const cdp = await context.newCDPSession(page);
  async function drag(from, to, touch, cancel = false) {
    await page.locator(from).click({trial:true});
    const a = await page.locator(from).boundingBox();
    const b = await page.locator(to).boundingBox();
    const start = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
    const end = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    if (touch) {
      await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[start] });
      for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{x:start.x+(end.x-start.x)*i/6,y:start.y+(end.y-start.y)*i/6}] });
      await cdp.send('Input.dispatchTouchEvent', { type:cancel?'touchCancel':'touchEnd', touchPoints:[] });
    } else {
      await page.mouse.move(start.x,start.y); await page.mouse.down();
      await page.mouse.move(end.x,end.y,{steps:6});
      await page.mouse.up();
    }
  }
  for (const touch of [false,true]) {
    if (touch) await page.setViewportSize({width:390,height:844});
    await launch(page,'color');
    await drag('#bubble-red','#cmx-bowl',touch);
    await drag('#bubble-yellow','#cmx-bowl',touch);
    await expect(page.locator('#cmx-result-name-en')).toHaveText('Orange');
    if(touch) {
      await page.locator('#cmx-reset-btn').click();
      await drag('#bubble-red','#cmx-bowl',true,true);
      await expect(page.locator('#cmx-result-name-en')).toHaveText('—');
      await expect(page.locator('.cmx-drag-ghost')).toHaveCount(0);
    }
    await back(page); await launch(page,'vehicle-parking');
    const station = await page.evaluate(() => app.activeGame.currentVehicle.station);
    await drag('.vp-vehicle-display',`.vp-station-card[data-station="${station}"]`,touch);
    await expect(page.locator('#score-val')).toHaveText('1 / 5');
    await back(page);
  }
  await cdp.detach();
});

test('animal friends have distinct models, silhouettes and surface colors', async ({ page }) => {
  const names = ['lion','monkey','panda','rabbit','fox','frog','elephant','penguin','bear','cat'];
  await open(page); await launch(page, 'memory');
  await page.evaluate(names => {
    const stage = document.querySelector('#game-stage');
    stage.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:12px;min-height:0;padding:16px';
    stage.replaceChildren(...names.map(name => {
      const cell = document.createElement('div');
      cell.style.cssText = 'height:210px;text-align:center;font:700 14px sans-serif';
      cell.innerHTML = `<kid-model model="${name}" style="display:block;height:180px"></kid-model><div>${name}</div>`;
      return cell;
    }));
  }, names);
  const averages = [];
  for (const name of names) {
    const model = page.locator(`kid-model[model="${name}"]`);
    await expect(model).toHaveClass(/model-ready/);
    await expect(model).toHaveAttribute('data-model-kind', 'mesh');
    averages.push(await model.locator('canvas').evaluate(canvas => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < pixels.length; i += 16) {
        if (pixels[i + 3] < 32) continue;
        r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; count++;
      }
      return [r / count, g / count, b / count];
    }));
  }
  for (let i = 0; i < averages.length; i++) {
    for (let j = i + 1; j < averages.length; j++) {
      const distance = Math.hypot(...averages[i].map((value, channel) => value - averages[j][channel]));
      expect(distance, `${names[i]} and ${names[j]} should not share one flat palette`).toBeGreaterThan(3);
    }
  }
  await page.screenshot({ path: 'test-results/animal-material-contact-sheet.png' });
});

test('learning objects render as full meshes and can be inspected on a small screen', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await open(page); await launch(page,'alphabet-pop');
  const names = ['book','gift','camera','robot','pencil','key','lock','unlock','bell','clock','watch','laptop','keyboard','ice','juice','milk','jug','vase','drum','hat','glasses','ring','wheel','lollipop','candy','magnet','leaf','moon','sun','airplane','jet','helicopter','boat','yacht','bus','train','motorbike','house','igloo','jewel','tent'];
  // A visual QA contact sheet exercises actual rendering for the new vocabulary.
  await page.evaluate(names => {
    const stage = document.querySelector('#game-stage');
    stage.style.cssText='display:grid;grid-template-columns:repeat(8,1fr);gap:8px;min-height:0;max-width:1250px;flex:none;padding:12px';
    stage.replaceChildren(...names.map(name => {
      const cell=document.createElement('div'); cell.style.cssText='height:132px;text-align:center;font:12px sans-serif';
      cell.innerHTML=`<kid-model model="${name}" src="img/vocab/${name}.svg" yaw="0" style="height:108px"></kid-model><div>${name}</div>`;
      return cell;
    }));
  },names);
  for(const name of names) {
    const model=page.locator(`#game-stage kid-model[model="${name}"]`);
    await expect(model).toHaveAttribute('data-model-kind','mesh');
    await expect(model).toHaveClass(/model-ready/);
    expect(await model.evaluate(e => { const c=e.querySelector('canvas'); const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data; return data.some((v,i)=>i%4===3 && v>0); }),name).toBe(true);
  }
  await page.screenshot({path:'test-results/vocabulary-3d-contact-sheet.png'});
  await back(page); await page.reload(); await page.setViewportSize({width:320,height:640});
  await launch(page,'alphabet-pop');
  await page.evaluate(() => { app.activeGame.VOCAB_DB.R=[{word:'Robot',image:'img/vocab/robot.svg'}]; });
  await page.getByRole('button',{name:'R',exact:true}).click();
  await page.locator('.ap-flying-object[aria-label="R"]').click();
  const model=page.locator('.ap-vocab-result kid-model');
  await expect(model).toHaveClass(/model-ready/);
  const front=await model.locator('canvas').evaluate(c=>c.toDataURL());
  await page.getByRole('button',{name:'Xoay sang phải',exact:true}).press('Enter');
  await expect(model).toHaveAttribute('yaw','45');
  await expect.poll(()=>model.locator('canvas').evaluate(c=>c.toDataURL())).not.toBe(front);
  await page.locator('#btn-lang').click();
  await expect(page.getByRole('button',{name:'Rotate left',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'♪ Listen',exact:true})).toBeVisible();
  expect(await page.locator('.ap-vocab-result').evaluate(e=>e.scrollWidth<=e.clientWidth+2)).toBe(true);
  await page.screenshot({path:'test-results/vocabulary-inspect-mobile.png'});
  await back(page); await launch(page,'alphabet-pop');
  await page.getByRole('button',{name:'X',exact:true}).click();
  await page.locator('.ap-flying-object[aria-label="X"]').click({ force: true });
  await expect(page.locator('.ap-vocab-result kid-model')).toHaveAttribute('data-model-kind','illustration');
  await expect(page.locator('.ap-rotate').first()).toBeHidden();
  await expect(page.locator('.ap-listen')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a web update waits until the child leaves the current game', async ({ page }) => {
  await open(page);
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await page.reload();
  await launch(page,'memory'); await page.locator('[data-pairs="5"]').click();
  await page.locator('.mem-card').first().click();
  await page.evaluate(()=>navigator.serviceWorker.dispatchEvent(new Event('controllerchange')));
  expect(await page.evaluate(()=>app.pendingAppUpdate)).toBe(true);
  await expect(page.locator('.mem-card.mem-flipped')).toHaveCount(1);
  await Promise.all([page.waitForEvent('load'),back(page)]);
  await expect(page.locator('#dashboard-screen')).toHaveClass(/active/);
  expect(await page.evaluate(()=>!!app.pendingAppUpdate)).toBe(false);
});

test('Dino changes the real mesh color and finishes all six foods', async ({ page }) => {
  await open(page); await launch(page, 'drawing');
  await page.locator('.dino-feed-btn').click();
  const colors = ['#FFD700','#FF8FAB','#E53935','#43A047','#7B1FA2','#FB8C00'];
  for (const [index, color] of colors.entries()) {
    await page.locator('.fruit-item').click();
    await expect(page.locator('kid-model[model="dino"]')).toHaveAttribute('color', color);
    if (index < colors.length - 1) await expect(page.locator('.fruit-item')).toBeVisible({ timeout: 6000 });
  }
  await expect(page.locator('.dino-full-screen')).toBeVisible({ timeout: 6000 });
  expect(await page.evaluate(() => app.stars)).toBe(10);
  await page.locator('.dino-replay-btn').click();
  await expect(page.locator('.dino-feed-btn')).toBeVisible();
});

test('vehicle wrong answer, five right stations, replay and no duplicate reward', async ({ page }) => {
  await open(page); await launch(page, 'vehicle-parking');
  const current = await page.evaluate(() => app.activeGame.currentVehicle.station);
  await page.locator(`.vp-station-card:not([data-station="${current}"])`).first().click();
  await expect.poll(() => page.evaluate(() => app.activeGame.roundLocked)).toBe(false);
  await expect(page.locator('#score-val')).toHaveText('0 / 5');
  for (let i = 1; i <= 5; i++) {
    await expect.poll(() => page.evaluate(() => app.activeGame.roundLocked)).toBe(false);
    const station = await page.evaluate(() => app.activeGame.currentVehicle.station);
    await page.locator(`.vp-station-card[data-station="${station}"]`).click();
    await expect(page.locator('#score-val')).toHaveText(`${i} / 5`);
  }
  await expect(page.locator('#vp-replay-btn')).toBeVisible();
  expect(await page.evaluate(() => app.stars)).toBe(1);
  await page.locator('#vp-replay-btn').click();
  await expect(page.locator('.vp-station-card')).toHaveCount(4);
});

test('mobile portrait and landscape keep every activity reachable without horizontal scrolling', async ({ page }) => {
  await open(page);
  for (const size of [{width:390,height:844},{width:320,height:640},{width:844,height:390}]) {
    await page.setViewportSize(size);
    for (const game of ['memory','color','math','alphabet-pop','drawing','vehicle-parking']) {
      await launch(page, game);
      const overflow = await page.locator('#game-stage').evaluate(e => ({client:e.clientWidth,scroll:e.scrollWidth}));
      expect(overflow.scroll, `${game} at ${size.width}`).toBeLessThanOrEqual(overflow.client + 2);
      if (size.width === 390) await page.screenshot({ path:`test-results/mobile-${game}.png` });
      await back(page);
    }
    expect(await page.locator('#dashboard-screen').evaluate(e => e.scrollWidth <= e.clientWidth + 2)).toBe(true);
    if (size.width === 390) await page.screenshot({ path:'test-results/home-mobile.png' });
  }
});

test('a fully installed PWA can load every game and 3D model offline', async ({ page, context }) => {
  await open(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('kid-model[model="world"]')).toHaveClass(/model-ready/);
  for (const game of ['memory','color','math','alphabet-pop','drawing','vehicle-parking']) {
    await launch(page, game);
    if (game !== 'alphabet-pop') await expect(page.locator('#game-stage kid-model.model-ready').first()).toBeVisible();
    await back(page);
  }
});

test('without WebGL, fallback images and all game routes remain usable', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type === 'webgl2' ? null : getContext.call(this,type,...args); };
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-graphics','fallback');
  await expect(page.locator('.hero-art .model-fallback')).toBeVisible();
  for (const game of ['memory','color','math','alphabet-pop','drawing','vehicle-parking']) {
    await launch(page,game); await expect(page.locator('#game-stage')).not.toBeEmpty(); await back(page);
  }
  await launch(page,'drawing');
  await page.locator('#btn-sound').click();
  await page.locator('.dino-feed-btn').click();
  await page.locator('.fruit-item').click();
  await expect(page.locator('.dino-body-path')).toHaveCSS('fill','rgb(255, 215, 0)');
});
