const https = require('https');
const fs = require('fs');
const path = require('path');

const lines = {
  'intro': "I'm so hungry! I'm going to find some food!",
  'banana': "Eating the banana turned me yellow!",
  'peach': "Eating the peach turned me pink!",
  'tomato': "Eating the tomato turned me red!",
  'cucumber': "Eating the cucumber turned me green!",
  'grapes': "Eating the grapes turned me purple!",
  'orange': "Eating the orange turned me orange!",
  'full': "I ate everything! I'm so full! Burp!"
};

const dir = path.join(__dirname, 'www', 'audio', 'dino');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

function downloadTTS(text, name) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-US&q=${encodeURIComponent(text)}`;
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to get '${name}' (${res.statusCode})`));
        return;
      }
      const file = fs.createWriteStream(path.join(dir, `${name}.mp3`));
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${name}.mp3`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(path.join(dir, `${name}.mp3`));
      reject(err);
    });
  });
}

async function run() {
  for (const [name, text] of Object.entries(lines)) {
    try {
      await downloadTTS(text, name);
    } catch (err) {
      console.error(err.message);
    }
  }
}

run();
