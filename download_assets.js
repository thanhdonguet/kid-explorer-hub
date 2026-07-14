const fs = require('fs');
const https = require('https');
const path = require('path');

const vocab = {
  'k': '1f998', 'l': '1f981', 'm': '1f435', 'n': '1fab9', 'o': '1f989',
  'p': '1f437', 'q': '1f478', 'r': '1f430', 's': '1f40d', 't': '1f42f',
  'u': '2602', 'v': '1f3bb', 'w': '1f433', 'x': '1fa7b', 'y': '1f402', 'z': '1f993'
};

const themes = {
  'balloon': '1f388', 'rocket': '1f680', 'cloud': '2601', 'cat': '1f431',
  'star': '2b50', 'bubble': '1fae7', 'frog': '1f438', 'bird': '1f426',
  'leaf': '1f343', 'fish': '1f41f', 'ghost': '1f47b', 'car': '1f697',
  'flower': '1f338', 'ufo': '1f6f8'
};

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      } else if (res.statusCode === 301 || res.statusCode === 302) {
          // Handle redirect
          https.get(res.headers.location, (redirRes) => {
              const file = fs.createWriteStream(dest);
              redirRes.pipe(file);
              file.on('finish', () => { file.close(); resolve(); });
          }).on('error', reject);
      } else {
        reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
    }).on('error', reject);
  });
};

const run = async () => {
  // Ensure directories exist
  fs.mkdirSync(path.join(__dirname, 'www/img/vocab'), { recursive: true });
  fs.mkdirSync(path.join(__dirname, 'www/img/themes'), { recursive: true });

  for (const [name, hex] of Object.entries(vocab)) {
    const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${hex}.svg`;
    const dest = path.join(__dirname, `www/img/vocab/${name}.svg`);
    try {
      await download(url, dest);
      console.log(`Downloaded vocab/${name}.svg`);
    } catch (e) {
      console.error(`Failed vocab/${name}: ${e.message}`);
    }
  }
  
  for (const [name, hex] of Object.entries(themes)) {
    const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${hex}.svg`;
    const dest = path.join(__dirname, `www/img/themes/${name}.svg`);
    try {
      await download(url, dest);
      console.log(`Downloaded themes/${name}.svg`);
    } catch (e) {
      console.error(`Failed themes/${name}: ${e.message}`);
    }
  }
};
run();
