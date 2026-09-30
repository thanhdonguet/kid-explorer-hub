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
  expect(Object.keys(manifest)).toHaveLength(51);
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
  for (const game of ['memory', 'color', 'math', 'alphabet-pop', 'dinosaur-colors', 'vehicle-parking']) {
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
  expect(await page.evaluate(() => {
    const notes = [];
    const original = audio._voice;
    audio._voice = frequency => notes.push(frequency);
    for (let step = 0; step < 10; step++) audio.playFruitNote(step);
    audio._voice = original;
    return notes.filter((_, index) => index % 2 === 0);
  })).toEqual([523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5, 1174.66, 1318.51]);

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
    await page.evaluate(() => {
      window.__fruitNotes = [];
      audio.playFruitNote = step => window.__fruitNotes.push(step);
    });
    // Dispatch a rapid burst as a child may do; all UI buttons receive the burst.
    await page.locator('.fm-fruit').evaluateAll(buttons => buttons.forEach(button => button.click()));
    await expect(page.locator('#score-val')).toHaveText(`${round + 1}/5`);
    expect(await page.evaluate(() => app.activeGame.currentCount)).toBe(await page.evaluate(() => app.activeGame.targetCount));
    expect(await page.evaluate(() => window.__fruitNotes)).toEqual(
      await page.evaluate(() => Array.from({ length: app.activeGame.targetCount }, (_, index) => index))
    );
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

  await page.locator('#cmx-reset-btn').click();
  for (const id of ['red', 'yellow', 'navy']) await page.locator(`#bubble-${id}`).press('Enter');
  const darkMix = await page.evaluate(() => {
    const game = app.activeGame;
    return {
      rgb: game.currentMix,
      name: game.currentColorName,
      lightness: game._rgbToLab(game.currentMix).l,
    };
  });
  expect(darkMix.name).toContain('Brown');
  expect(darkMix.lightness).toBeGreaterThan(35);

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
    await page.locator('.ap-flying-object[aria-label="A"]').click({ force: true });
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
  for (const name of ['lion', 'panda', 'rabbit', 'fox', 'elephant', 'bear', 'cat']) {
    const yaw = await page.locator(`kid-model[model="${name}"]`).evaluate(model => model.object.children[0].rotation.y);
    expect(yaw, `${name} should start in profile`).toBeGreaterThan(1.2);
  }
  const frogBounds = await page.locator('kid-model[model="frog"] canvas').evaluate(canvas => {
    const { width, height } = canvas;
    const pixels = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const max = Math.max(pixels[index], pixels[index + 1], pixels[index + 2]);
      const min = Math.min(pixels[index], pixels[index + 1], pixels[index + 2]);
      // Ignore the neutral contact shadow and measure the colored animal only.
      if (pixels[index + 3] < 128 || max - min < 15 || max < 40) continue;
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    return { width: maxX - minX + 1, height: maxY - minY + 1, canvasWidth: width, canvasHeight: height };
  });
  expect(frogBounds.width / frogBounds.canvasWidth).toBeLessThan(.62);
  expect(frogBounds.height / frogBounds.canvasHeight).toBeLessThan(.58);
  await page.screenshot({ path: 'test-results/animal-material-contact-sheet.png' });
});

test('parking destinations have recognizable architecture instead of one template', async ({ page }) => {
  const stations = ['Fire Station','Hospital','Police Station','Airport','Helipad','Launch Pad','Bus Stop','School','Hotel','Train Station','Dump','Construction','Road Work','Harbor','Warehouse','Garage','Race Track','Farm'];
  await open(page); await launch(page, 'vehicle-parking');
  await page.evaluate(stations => {
    const stage = document.querySelector('#game-stage');
    stage.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:8px;min-height:0;padding:12px';
    stage.replaceChildren(...stations.map(name => {
      const cell = document.createElement('div');
      cell.style.cssText = 'height:170px;text-align:center;font:700 11px sans-serif';
      cell.innerHTML = `<kid-model model="station-${name}" style="display:block;height:142px"></kid-model><div>${name}</div>`;
      return cell;
    }));
  }, stations);
  for (const name of stations) {
    const model = page.locator(`kid-model[model="station-${name}"]`);
    await expect(model).toHaveClass(/model-ready/);
    expect(await model.locator('canvas').evaluate(canvas => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      return data.some((value, index) => index % 4 === 3 && value > 0);
    }), name).toBe(true);
  }
  await page.screenshot({ path: 'test-results/parking-stations-contact-sheet.png' });
});

test('learning objects render and auto-rotate without rotation buttons on a small screen', async ({ page }) => {
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
  await page.locator('.ap-flying-object[aria-label="R"]').click({ force: true });
  const model=page.locator('.ap-vocab-result kid-model');
  await expect(model).toHaveClass(/model-ready/);
  await expect(page.locator('.ap-rotate')).toHaveCount(0);
  await expect(model).toHaveAttribute('auto-rotate', '');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => model.evaluate(element => element.object.rotation.y)).toBeCloseTo(.18);
  const stillAngle = await model.evaluate(element => element.object.rotation.y);
  await page.waitForTimeout(300);
  expect(await model.evaluate(element => element.object.rotation.y)).toBe(stillAngle);
  const front=await model.locator('canvas').evaluate(c=>c.toDataURL());
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const startAngle = await model.evaluate(element => element.object.rotation.y);
  await expect.poll(() => model.evaluate(element => element.object.rotation.y)).toBeGreaterThan(startAngle + .15);
  await expect.poll(()=>model.locator('canvas').evaluate(c=>c.toDataURL())).not.toBe(front);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => model.evaluate(element => element.object.rotation.y)).toBeCloseTo(.18);
  await page.locator('#btn-lang').click();
  await expect(page.locator('.ap-rotate')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'♪ Listen',exact:true})).toBeVisible();
  await page.evaluate(() => { window.__spokenWords = []; app.activeGame.speak = word => window.__spokenWords.push(word); });
  await page.getByRole('button',{name:'♪ Listen',exact:true}).press('Enter');
  expect(await page.evaluate(() => window.__spokenWords)).toEqual(['Robot']);
  expect(await page.locator('.ap-vocab-result').evaluate(e=>e.scrollWidth<=e.clientWidth+2)).toBe(true);
  await page.screenshot({path:'test-results/vocabulary-inspect-mobile.png'});
  await back(page); await launch(page,'alphabet-pop');
  await page.getByRole('button',{name:'X',exact:true}).click();
  await page.locator('.ap-flying-object[aria-label="X"]').click({ force: true });
  await expect(page.locator('.ap-vocab-result kid-model')).toHaveAttribute('data-model-kind','illustration');
  await expect(model).toHaveClass(/model-ready/);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const illustrationAngle = await model.evaluate(element => element.object.rotation.y);
  await page.waitForTimeout(400);
  expect(await model.evaluate(element => element.object.rotation.y)).toBe(illustrationAngle);
  await expect(page.locator('.ap-rotate')).toHaveCount(0);
  await expect(page.locator('.ap-listen')).toBeVisible();
  expect(errors).toEqual([]);
});

test('alphabet SVG illustrations show actual artwork without WebGL upload errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (/texSubImage2D|GL_INVALID|Texture is immutable|Model unavailable/i.test(message.text())) errors.push(message.text());
  });
  await open(page);
  await launch(page, 'alphabet-pop');
  await page.getByRole('button', { name: 'X', exact: true }).click();
  await page.locator('.ap-flying-object[aria-label="X"]').click({ force: true });
  const model = page.locator('.ap-vocab-result kid-model');
  await expect(model).toHaveClass(/model-ready/);
  await expect(model).toHaveAttribute('data-model-kind', 'illustration');
  await expect.poll(() => model.locator('canvas').evaluate(canvas => {
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let blue = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] > 128 && pixels[i + 2] > pixels[i] + 30) blue++;
    }
    return blue / (canvas.width * canvas.height);
  }), { message: 'The blue X-ray artwork must be visible, not just the beige tile' }).toBeGreaterThan(.05);
  await expect(page.locator('.ap-rotate')).toHaveCount(0);
  await expect(page.locator('.ap-listen')).toBeVisible();
  await page.screenshot({ path: 'test-results/alphabet-x-ray-illustration.png' });
  expect(errors).toEqual([]);
});

test('every alphabet vocabulary image decodes and every illustration renders artwork', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (/texSubImage2D|GL_INVALID|Texture is immutable|Model unavailable/i.test(message.text())) errors.push(message.text());
  });
  await open(page);
  await launch(page, 'alphabet-pop');
  const vocabulary = await page.evaluate(() => Object.values(app.activeGame.VOCAB_DB).flat());
  for (let start = 0; start < vocabulary.length; start += 12) {
    const batch = vocabulary.slice(start, start + 12);
    await page.evaluate(batch => {
      const stage = document.querySelector('#game-stage');
      stage.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;min-height:0;flex:none;padding:8px';
      stage.replaceChildren(...batch.map(item => {
        const model = document.createElement('kid-model');
        model.style.cssText = 'height:130px;display:block';
        model.setAttribute('model', item.image.split('/').pop().replace('.svg', ''));
        model.setAttribute('src', item.image);
        model.setAttribute('yaw', '0');
        const fallback = document.createElement('img');
        fallback.className = 'model-fallback';
        fallback.src = item.image;
        fallback.alt = item.word;
        model.append(fallback);
        return model;
      }));
    }, batch);
    for (const [index, item] of batch.entries()) {
      const model = page.locator('#game-stage kid-model').nth(index);
      await model.scrollIntoViewIfNeeded();
      await expect(model, item.word).toHaveClass(/model-ready/);
      expect(await model.locator('img').evaluate(async img => {
        await img.decode();
        return img.naturalWidth > 0 && img.naturalHeight > 0;
      }), item.word).toBe(true);
      if (await model.getAttribute('data-model-kind') !== 'illustration') continue;
      expect(await model.evaluate(element => {
        const face = element.object.children.find(child => child.material?.map?.image.width === 256);
        if (!face) return false;
        const image = face.material.map.image;
        const data = image.getContext('2d').getImageData(0, 0, image.width, image.height).data;
        return data.some((value, index) => index % 4 === 3 && value > 128);
      }), `${item.word} texture contains artwork`).toBe(true);
      const withArtwork = await model.locator('canvas').evaluate(canvas => canvas.toDataURL());
      await model.evaluate(element => {
        element.object.children.find(child => child.material?.map?.image.width === 256).visible = false;
        element.render(0, false);
      });
      const withoutArtwork = await model.locator('canvas').evaluate(canvas => canvas.toDataURL());
      expect(withArtwork, `${item.word} artwork reaches the rendered canvas`).not.toBe(withoutArtwork);
    }
  }
  expect(errors).toEqual([]);
});

test('illustration fallback stays visible while loading and after a load failure', async ({ page }) => {
  await open(page);
  await launch(page, 'alphabet-pop');
  const svg = fs.readFileSync('www/img/vocab/x-ray.svg', 'utf8');
  let pendingRoute;
  const intercepted = new Promise(resolve => { pendingRoute = resolve; });
  await page.route('**/delayed-illustration.svg', route => pendingRoute(route));
  await page.evaluate(() => {
    document.querySelector('#game-stage').innerHTML = '<kid-model model="delayed-illustration" src="delayed-illustration.svg" style="width:200px;height:200px"><img class="model-fallback" src="img/vocab/x-ray.svg" alt="X-ray"></kid-model>';
  });
  const route = await intercepted;
  const model = page.locator('#game-stage kid-model');
  await page.waitForTimeout(200);
  await expect(model).not.toHaveClass(/model-ready/);
  await expect(model.locator('img')).toBeVisible();
  await route.fulfill({ contentType: 'image/svg+xml', body: svg });
  await expect(model).toHaveClass(/model-ready/);
  await expect(model.locator('img')).toBeHidden();

  const warnings = [];
  page.on('console', message => { if (message.text().includes('Model unavailable:')) warnings.push(message.text()); });
  await page.route('**/missing-illustration.svg', route => route.abort());
  await model.evaluate(element => element.setAttribute('src', 'missing-illustration.svg'));
  await expect(model).toHaveAttribute('data-load-error', 'true');
  await expect(model).not.toHaveClass(/model-ready/);
  await expect(model.locator('img')).toBeVisible();
  await expect.poll(() => warnings.length).toBeGreaterThan(0);
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

test('Dino route, translations, model and offline script use the current game name', async ({ page }) => {
  const script = 'js/games/dinosaur-colors.js';
  expect(fs.existsSync(`www/${script}`)).toBe(true);
  expect(fs.existsSync('www/js/games/drawing.js')).toBe(false);
  const manifest = fs.readFileSync('www/asset-list.js', 'utf8');
  expect(manifest).toContain(`"${script}"`);
  expect(manifest).not.toContain('"js/games/drawing.js"');
  await page.addInitScript(() => {
    localStorage.setItem('kid_explorer_stars', '12');
    localStorage.setItem('mem_hs_5', '42');
  });
  await open(page);
  const island = page.locator('#island-dinosaur-colors');
  const model = island.locator('kid-model');
  await expect(model).toHaveAttribute('model', 'island-dinosaur-colors');
  await expect(model).toHaveClass(/model-ready/);
  expect(await model.evaluate(element => {
    let hasDino = false;
    element.object.traverse(object => { if (object.userData.skin) hasDino = true; });
    return hasDino;
  })).toBe(true);
  expect(await page.evaluate(() => [...document.querySelectorAll('[data-i18n]')].every(element =>
    Object.values(app.T).every(translations => element.dataset.i18n in translations)
  ))).toBe(true);
  await launch(page, 'dinosaur-colors');
  await expect(page.locator('body')).toHaveAttribute('data-game', 'dinosaur-colors');
  await expect(page.locator('#app-title-hud')).toHaveText('Khủng Long Sắc Màu');
  await expect(page.locator('#game-hint')).toHaveText('Chạm vào trái cây và xem Dino đổi màu nhé!');
  await expect(page.locator('#game-dashboard')).toBeHidden();
  await page.locator('#btn-lang').click();
  await expect(page.locator('#app-title-hud')).toHaveText('Colorful Dinosaur');
  await expect(page.locator('#game-hint')).toHaveText('Tap a fruit and watch Dino change color!');
  await expect(page.locator('.dino-feed-btn')).toHaveText('Feed me! 🍽️');
  await expect(page.locator('#game-dashboard')).toBeHidden();
  await back(page);
  await expect(island).toBeFocused();
  await expect(page.locator('#star-count')).toHaveText('12');
  expect(await page.evaluate(() => localStorage.getItem('mem_hs_5'))).toBe('42');
});

test('Dino changes the real mesh color and finishes all six foods', async ({ page }) => {
  await open(page); await launch(page, 'dinosaur-colors');
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
    for (const game of ['memory','color','math','alphabet-pop','dinosaur-colors','vehicle-parking']) {
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
  for (const game of ['memory','color','math','alphabet-pop','dinosaur-colors','vehicle-parking']) {
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
  for (const game of ['memory','color','math','alphabet-pop','dinosaur-colors','vehicle-parking']) {
    await launch(page,game); await expect(page.locator('#game-stage')).not.toBeEmpty(); await back(page);
  }
  await launch(page,'dinosaur-colors');
  await page.locator('#btn-sound').click();
  await page.locator('.dino-feed-btn').click();
  await page.locator('.fruit-item').click();
  await expect(page.locator('.dino-body-path')).toHaveCSS('fill','rgb(255, 215, 0)');
});
