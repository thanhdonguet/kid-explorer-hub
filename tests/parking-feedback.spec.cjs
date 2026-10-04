const { test, expect } = require('@playwright/test');

async function openParking(page) {
  await page.addInitScript(() => {
    localStorage.setItem('kid_explorer_lang', 'vi');
    localStorage.setItem('kid_explorer_stars', '0');
  });
  await page.goto('/');
  await page.locator('#btn-sound').click();
  await page.locator('.island-card[data-game="vehicle-parking"]').click();
  await expect(page.locator('.vp-station-card')).toHaveCount(4);
}

async function correctStation(page) {
  const station = await page.evaluate(() => app.activeGame.currentVehicle.station);
  return page.locator(`.vp-station-card[data-station="${station}"]`);
}

test('correct parking celebrates visibly above the scene and counts one answer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openParking(page);
  const station = await correctStation(page);
  // A tap schedules a return animation. Choosing a station immediately must
  // keep that old callback from overriding the parking animation.
  await page.locator('#vp-vehicle-display').click();
  await station.click();
  await expect(page.locator('.vp-success-feedback')).toHaveText('★Đỗ đúng bến rồi!Giỏi lắm, bé ơi!');
  await expect(page.locator('#vp-vehicle-display')).toHaveCSS('animation-name', 'none');
  await expect(station).toHaveClass(/vp-station-parked/);
  await expect(station.locator('.vp-parked-check')).toBeVisible();
  await expect(page.locator('#score-val')).toHaveText('1 / 5');
  await expect(page.locator('.vp-celebration-layer .vp-confetti')).toHaveCount(15);
  const visual = await page.locator('.vp-confetti').first().evaluate(piece => {
    const rect = piece.getBoundingClientRect();
    const style = getComputedStyle(piece);
    return {
      opacity: Number(style.opacity),
      animation: style.animationName,
      layer: Number(getComputedStyle(piece.parentElement).zIndex),
      insideGame: Boolean(piece.closest('#vehicle-parking-container')),
      topSurface: document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest('#game-screen')?.id,
    };
  });
  expect(visual.opacity).toBeGreaterThan(0);
  expect(visual.animation).toBe('vpParkingConfetti');
  expect(visual.layer).toBeGreaterThan(100);
  expect(visual.insideGame).toBe(true);
  expect(visual.topSurface).toBe('game-screen');
  await station.dispatchEvent('click');
  await expect(page.locator('#score-val')).toHaveText('1 / 5');
  await expect(page.locator('.vp-station-card:disabled')).toHaveCount(4);
  await expect.poll(() => page.evaluate(() => app.activeGame.roundLocked)).toBe(false);
  await expect(page.locator('.vp-success-feedback')).toBeHidden();
  await expect(page.locator('.vp-confetti')).toHaveCount(0);
  await expect(page.locator('.vp-station-card:enabled')).toHaveCount(4);
});

test('reduced motion and mute retain success feedback, including a language switch', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openParking(page);
  await (await correctStation(page)).click();
  await expect(page.locator('.vp-success-feedback')).toBeVisible();
  await expect(page.locator('.vp-confetti')).toHaveCount(15);
  expect(await page.locator('.vp-confetti').first().evaluate(piece => ({
    animation: getComputedStyle(piece).animationName,
    opacity: getComputedStyle(piece).opacity,
  }))).toEqual({ animation: 'none', opacity: '1' });
  expect(await page.evaluate(() => audio.muted)).toBe(true);
  await page.locator('#btn-lang').click();
  await expect(page.locator('.vp-success-feedback')).toHaveText('★Perfect parking!Great job!');
  await expect(page.locator('.vp-station-parked .vp-parked-check')).toBeVisible();
  expect(await page.evaluate(() => app.activeGame.roundLocked)).toBe(true);
  await expect.poll(() => page.evaluate(() => app.activeGame.roundLocked)).toBe(false);
  await expect(page.locator('.vp-station-card:enabled')).toHaveCount(4);
});

test('wrong parking does not celebrate and allows a correct retry', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openParking(page);
  const current = await page.evaluate(() => app.activeGame.currentVehicle.station);
  const wrongStation = page.locator(`.vp-station-card:not([data-station="${current}"])`).first();
  const wrongDestination = await wrongStation.getAttribute('data-station');
  await page.evaluate(destination => {
    const vehicle = document.getElementById('vp-vehicle-display');
    vehicle.addEventListener('animationstart', event => {
      if (event.animationName !== 'vpWrongParkingShake') return;
      const vehicleRect = vehicle.getBoundingClientRect();
      const stationRect = document.querySelector(`.vp-station-card[data-station="${destination}"]`).getBoundingClientRect();
      const x = vehicleRect.x + vehicleRect.width / 2;
      const y = vehicleRect.y + vehicleRect.height / 2;
      window.__parkingWrongAnimation = {
        name: getComputedStyle(vehicle).animationName,
        running: vehicle.getAnimations().some(animation => animation.animationName === event.animationName && animation.playState === 'running'),
        distanceX: Math.abs(x - stationRect.x - stationRect.width / 2),
        distanceY: Math.abs(y - stationRect.y - stationRect.height / 2),
        aboveStation: Boolean(document.elementFromPoint(x, y)?.closest('#vp-vehicle-display')),
      };
    });
  }, wrongDestination);
  await wrongStation.click();
  await expect(page.locator('.vp-success-feedback')).toBeHidden();
  await expect(page.locator('.vp-confetti')).toHaveCount(0);
  await expect(page.locator('#score-val')).toHaveText('0 / 5');
  const vehicle = page.locator('#vp-vehicle-display');
  await expect.poll(() => page.evaluate(() => window.__parkingWrongAnimation)).toBeTruthy();
  const wrongAnimation = await page.evaluate(() => window.__parkingWrongAnimation);
  expect(wrongAnimation).toMatchObject({ name: 'vpWrongParkingShake', running: true, aboveStation: true });
  expect(wrongAnimation.distanceX).toBeLessThan(30);
  expect(wrongAnimation.distanceY).toBeLessThan(30);
  await expect.poll(() => page.evaluate(() => app.activeGame.roundLocked)).toBe(false);
  await expect(vehicle).toHaveCSS('animation-name', 'vehicleBounce');
  await expect(page.locator('.vp-station-card:enabled')).toHaveCount(4);
  await (await correctStation(page)).click();
  await expect(page.locator('.vp-success-feedback')).toBeVisible();
  await expect(page.locator('#score-val')).toHaveText('1 / 5');
});

test('closing during success clears particles and pending callbacks', async ({ page }) => {
  await openParking(page);
  await page.clock.install();
  await (await correctStation(page)).click();
  await page.clock.fastForward(500);
  await expect(page.locator('.vp-success-feedback')).toBeVisible();
  await page.evaluate(() => { window.__closedParking = app.activeGame; });
  await page.locator('#btn-back').click();
  await page.clock.fastForward(3000);
  await expect(page.locator('.vp-confetti')).toHaveCount(0);
  await expect(page.locator('#game-stage')).toBeEmpty();
  expect(await page.evaluate(() => ({
    destroyed: window.__closedParking.destroyed,
    timers: window.__closedParking.timers.size,
    particles: window.__closedParking.confettiPieces.size,
    activeGame: app.activeGame,
    stars: app.stars,
  }))).toEqual({ destroyed: true, timers: 0, particles: 0, activeGame: null, stars: 0 });
});

test('all five rounds celebrate, reward once, and replay starts clean', async ({ page }) => {
  await openParking(page);
  for (let score = 1; score <= 5; score++) {
    await expect.poll(() => page.evaluate(() => app.activeGame.roundLocked)).toBe(false);
    await (await correctStation(page)).click();
    await expect(page.locator('.vp-success-feedback')).toBeVisible();
    await expect(page.locator('#score-val')).toHaveText(`${score} / 5`);
  }
  await expect(page.locator('#vp-replay-btn')).toBeVisible();
  expect(await page.evaluate(() => app.stars)).toBe(1);
  await expect(page.locator('.vp-confetti')).toHaveCount(0);
  await page.locator('#vp-replay-btn').click();
  await expect(page.locator('#score-val')).toHaveText('0 / 5');
  await expect(page.locator('.vp-station-card')).toHaveCount(4);
  await expect(page.locator('.vp-success-feedback')).toBeHidden();
});

test('mobile touch drag parks correctly and keeps success inside the game', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openParking(page);
  const station = await correctStation(page);
  await station.scrollIntoViewIfNeeded();
  const vehicleBox = await page.locator('#vp-vehicle-display').boundingBox();
  const stationBox = await station.boundingBox();
  const start = { x: vehicleBox.x + vehicleBox.width / 2, y: vehicleBox.y + vehicleBox.height / 2 };
  const end = { x: stationBox.x + stationBox.width / 2, y: stationBox.y + stationBox.height / 2 };
  await page.evaluate(({ start, end }) => {
    const vehicle = document.getElementById('vp-vehicle-display');
    const send = (type, point, target) => {
      const touch = new Touch({ identifier: 1, target: vehicle, clientX: point.x, clientY: point.y });
      target.dispatchEvent(new TouchEvent(type, {
        bubbles: true, cancelable: true,
        touches: type === 'touchend' ? [] : [touch],
        changedTouches: [touch],
      }));
    };
    send('touchstart', start, vehicle);
    send('touchmove', end, document);
    send('touchend', end, document);
  }, { start, end });
  await expect(page.locator('.vp-success-feedback')).toBeVisible();
  await expect(station.locator('.vp-parked-check')).toBeVisible();
  await expect(page.locator('#score-val')).toHaveText('1 / 5');
  const layout = await page.locator('#game-stage').evaluate(stage => ({ width: stage.clientWidth, scroll: stage.scrollWidth }));
  expect(layout.scroll).toBeLessThanOrEqual(layout.width + 2);
  await page.screenshot({ path: 'test-results/parking-success-mobile.png' });
});
