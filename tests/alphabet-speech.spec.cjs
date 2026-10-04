const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const vm = require('node:vm');

test('letter speech avoids capital labels, keeps US names and honors voice options and mute', () => {
  const spoken = [];
  const voice = { name: 'Google US English', lang: 'en-US' };
  const context = vm.createContext({
    window: {
      speechSynthesis: {
        getVoices: () => [voice],
        speak: utterance => spoken.push(utterance),
      },
    },
    audio: { muted: false },
    SpeechSynthesisUtterance: function (text) { this.text = text; },
  });
  vm.runInContext(fs.readFileSync('www/js/tts.js', 'utf8'), context);

  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const utterance = context.window.TTS.speakLetter(letter, { rate: 0.9 });
    expect(utterance.text).toMatch(/^[a-z ]{2,}$/);
    expect(utterance.text).not.toContain('capital');
    expect(utterance.lang).toBe('en-US');
    expect(utterance.voice).toBe(voice);
    expect(utterance.rate).toBe(0.9);
  }
  expect(spoken[0].text).toBe('ay');
  expect(spoken[8].text).toBe('eye');
  expect(spoken[22].text).toBe('double you');
  expect(spoken[25].text).toBe('zee');
  expect(context.window.TTS.speakLetter('a').text).toBe('ay');
  expect(context.window.TTS.speakLetter('Apple')).toBeNull();
  expect(context.window.TTS.speak('Apple').text).toBe('Apple');
  context.audio.muted = true;
  const count = spoken.length;
  expect(context.window.TTS.speakLetter('B')).toBeNull();
  expect(spoken).toHaveLength(count);
});

test('alphabet board and correct toy read letter names while vocabulary stays unchanged', async ({ page }) => {
  await page.addInitScript(() => {
    window.__spoken = [];
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [],
        speak: utterance => window.__spoken.push(utterance.text),
        cancel() {},
        speaking: false,
        pending: false,
      },
    });
  });
  await page.goto('/');
  await page.locator('.island-card[data-game="alphabet-pop"]').click();
  await page.locator('.ap-letter-btn').filter({ hasText: /^W$/ }).click();
  expect(await page.evaluate(() => window.__spoken.filter(text => text.trim()))).toEqual(['double you']);
  await page.locator('.ap-flying-object').filter({ hasText: /^W$/ }).click();
  expect(await page.evaluate(() => window.__spoken.filter(text => text.trim()))).toEqual(['double you', 'double you']);

  await expect(page.locator('.ap-vocab-text')).toBeVisible();
  const word = await page.locator('.ap-vocab-text').textContent();
  await expect.poll(() => page.evaluate(() => window.__spoken.at(-1))).toBe(word);
  await page.locator('.ap-listen').click();
  expect(await page.evaluate(() => window.__spoken.at(-1))).toBe(word);
  await page.locator('#btn-back').click();
});
