/* ================================================================
   TTS – shared Text-to-Speech helper for all games
   Centralizes voice selection so every game reads with the same
   good-quality voice instead of each game guessing independently.

   Why this exists: speechSynthesis.getVoices() on iOS/iPadOS returns
   many "novelty" joke voices (Zarvox, Whisper, Bells, Organ, ...) all
   tagged lang="en-US", same as the real narrator voice (Samantha).
   Picking "the first en-US voice" can land on one of those by accident,
   which is why some devices sound great and others sound terrible for
   the exact same code. This module ranks voices instead of taking the
   first match.
   ================================================================ */

(function (global) {
  // Apple's classic "fun" system voices – never good for teaching kids.
  const NOVELTY_VOICE_NAMES = [
    'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos',
    'wobble', 'deranged', 'good news', 'hysterical', 'pipe organ', 'organ',
    'trinoids', 'whisper', 'zarvox', 'jester', 'superstar', 'kathy',
    'junior', 'ralph', 'fred', 'rocko', 'sandy', 'shelley', 'grandma',
    'grandpa', 'eddy', 'flo', 'reed', 'rishi',
  ];

  // Known-good voices across platforms, checked first regardless of order.
  const PREFERRED_VOICE_NAMES = [
    'google us english', 'google uk english female', 'google uk english male',
    'samantha', 'ava', 'alex', 'karen', 'daniel', 'moira', 'tessa', 'fiona',
    'microsoft aria online', 'microsoft jenny online', 'microsoft guy online',
    'microsoft zira', 'microsoft david',
  ];

  let cachedVoices = [];
  let warmed = false;
  let primed = false;

  function refreshVoices() {
    if (!('speechSynthesis' in global)) return;
    cachedVoices = global.speechSynthesis.getVoices();
  }

  function warm() {
    if (!('speechSynthesis' in global)) return;
    refreshVoices();
    if (!warmed) {
      warmed = true;
      global.speechSynthesis.onvoiceschanged = refreshVoices;
    }
  }

  function nameMatches(voiceName, list) {
    const n = voiceName.toLowerCase();
    return list.some(entry => n.includes(entry));
  }

  function pickForLangPrefix(prefix) {
    const candidates = cachedVoices.filter(
      v => v.lang && v.lang.toLowerCase().startsWith(prefix)
    );
    if (!candidates.length) return null;

    const preferred = candidates.find(v => nameMatches(v.name, PREFERRED_VOICE_NAMES));
    if (preferred) return preferred;

    // Avoid known novelty/joke voices; among what's left, a network/cloud
    // voice (localService === false) is generally higher quality than a
    // bundled offline one.
    const clean = candidates.filter(v => !nameMatches(v.name, NOVELTY_VOICE_NAMES));
    const pool = clean.length ? clean : candidates;
    return pool.find(v => v.localService === false) || pool[0];
  }

  function bestVoiceForLang(lang) {
    if (!cachedVoices.length) refreshVoices();
    const wanted = (lang || 'en-US').toLowerCase();
    return pickForLangPrefix(wanted) || pickForLangPrefix(wanted.split('-')[0]) || null;
  }

  /**
   * Speak `text` using the best available voice for options.lang.
   * Must be called synchronously from a user gesture on iOS Safari —
   * don't wrap this in setTimeout/Promise, it silently drops the utterance.
   */
  function speak(text, options) {
    options = options || {};
    if (!('speechSynthesis' in global)) return null;
    if (typeof audio !== 'undefined' && audio.muted) return null;

    const synth = global.speechSynthesis;
    warm();

    // Only cancel when something is actually mid-speech/queued – canceling
    // unconditionally right before speak() races with Chrome and can drop
    // the new utterance entirely.
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    const lang = options.lang || 'en-US';
    const utt = new SpeechSynthesisUtterance(text);
    const voice = bestVoiceForLang(lang);

    if (voice) {
      utt.voice = voice;
      utt.lang = voice.lang; // must match the assigned voice or some engines stay silent
    } else {
      utt.lang = lang;
    }

    utt.rate = options.rate != null ? options.rate : 1;
    utt.pitch = options.pitch != null ? options.pitch : 1;
    utt.volume = options.volume != null ? options.volume : 1;
    if (options.onEnd) utt.onend = options.onEnd;

    synth.speak(utt);
    return utt;
  }

  function cancel() {
    if ('speechSynthesis' in global) global.speechSynthesis.cancel();
  }

  /**
   * iOS Safari's speech engine has a noticeable one-time startup lag on the
   * very first utterance of a page session (spinning up the underlying
   * AVSpeechSynthesizer) – Android/Chrome don't have this, so the first
   * color/letter/word a game speaks can lag or land late on iPad. Call this
   * once, synchronously, from an early user gesture (e.g. tapping an island
   * card to open a game) so that lag happens before the child taps anything
   * that actually needs to be heard.
   */
  function primeIfNeeded() {
    if (primed || !('speechSynthesis' in global)) return;
    primed = true;
    warm();
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      global.speechSynthesis.speak(u);
    } catch (e) {
      // best-effort warm-up only
    }
  }

  global.TTS = { speak, cancel, warm, primeIfNeeded };
})(window);
