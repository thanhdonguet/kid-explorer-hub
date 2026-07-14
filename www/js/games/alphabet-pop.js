/* ================================================================
   Alphabet Pop Game (Bong Bóng Chữ Cái)
   ================================================================ */

class AlphabetPop {
  constructor(container, appCtrl) {
    this.container = container;
    this.appCtrl = appCtrl;
    this.lang = appCtrl.lang;

    // Game state
    this.currentScreen = 1; // 1: Alphabet board, 2: Gameplay
    this.selectedLetter = null;
    this.currentThemeIndex = 0;
    
    // 14 Themes setup (CSS animation classes will correspond to these)
    this.themes = [
      'theme-balloon', 'theme-rocket', 'theme-cloud', 'theme-cat',
      'theme-star', 'theme-bubble', 'theme-frog', 'theme-bird',
      'theme-leaf', 'theme-fish', 'theme-ghost', 'theme-car',
      'theme-flower', 'theme-ufo'
    ];

    // Vocabulary DB
    this.VOCAB_DB = {
      'A': [{w:'Apple',i:'apple.svg'},{w:'Ant',i:'ant.svg'},{w:'Alien',i:'alien.svg'},{w:'Airplane',i:'airplane.svg'},{w:'Ambulance',i:'ambulance.svg'},{w:'Avocado',i:'avocado.svg'},{w:'Anchor',i:'anchor.svg'},{w:'Axe',i:'axe.svg'},{w:'Alarm',i:'alarm.svg'},{w:'Art',i:'art.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'B': [{w:'Bear',i:'bear.svg'},{w:'Balloon',i:'balloon.svg'},{w:'Banana',i:'banana.svg'},{w:'Bell',i:'bell.svg'},{w:'Bird',i:'bird.svg'},{w:'Boat',i:'boat.svg'},{w:'Book',i:'book.svg'},{w:'Bus',i:'bus.svg'},{w:'Bread',i:'bread.svg'},{w:'Butterfly',i:'butterfly.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'C': [{w:'Cat',i:'cat.svg'},{w:'Car',i:'car.svg'},{w:'Carrot',i:'carrot.svg'},{w:'Castle',i:'castle.svg'},{w:'Cow',i:'cow.svg'},{w:'Camel',i:'camel.svg'},{w:'Cake',i:'cake.svg'},{w:'Camera',i:'camera.svg'},{w:'Candy',i:'candy.svg'},{w:'Clock',i:'clock.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'D': [{w:'Dog',i:'dog.svg'},{w:'Duck',i:'duck.svg'},{w:'Dolphin',i:'dolphin.svg'},{w:'Dinosaur',i:'dinosaur.svg'},{w:'Dress',i:'dress.svg'},{w:'Drum',i:'drum.svg'},{w:'Door',i:'door.svg'},{w:'Diamond',i:'diamond.svg'},{w:'Donut',i:'donut.svg'},{w:'Deer',i:'deer.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'E': [{w:'Elephant',i:'elephant.svg'},{w:'Egg',i:'egg.svg'},{w:'Eye',i:'eye.svg'},{w:'Ear',i:'ear.svg'},{w:'Earth',i:'earth.svg'},{w:'Eagle',i:'eagle.svg'},{w:'Envelope',i:'envelope.svg'},{w:'Engine',i:'engine.svg'},{w:'Eggplant',i:'eggplant.svg'},{w:'Elf',i:'elf.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'F': [{w:'Fox',i:'fox.svg'},{w:'Fish',i:'fish.svg'},{w:'Frog',i:'frog.svg'},{w:'Flower',i:'flower.svg'},{w:'Fire',i:'fire.svg'},{w:'Flag',i:'flag.svg'},{w:'Foot',i:'foot.svg'},{w:'Fairy',i:'fairy.svg'},{w:'Feather',i:'feather.svg'},{w:'Fries',i:'fries.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'G': [{w:'Giraffe',i:'giraffe.svg'},{w:'Ghost',i:'ghost.svg'},{w:'Guitar',i:'guitar.svg'},{w:'Gorilla',i:'gorilla.svg'},{w:'Goat',i:'goat.svg'},{w:'Gift',i:'gift.svg'},{w:'Glasses',i:'glasses.svg'},{w:'Globe',i:'globe.svg'},{w:'Grapes',i:'grapes.svg'},{w:'Garlic',i:'garlic.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'H': [{w:'Horse',i:'horse.svg'},{w:'House',i:'house.svg'},{w:'Hat',i:'hat.svg'},{w:'Heart',i:'heart.svg'},{w:'Helicopter',i:'helicopter.svg'},{w:'Hamburger',i:'hamburger.svg'},{w:'Honey',i:'honey.svg'},{w:'Hedgehog',i:'hedgehog.svg'},{w:'Hamster',i:'hamster.svg'},{w:'Hippo',i:'hippo.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'I': [{w:'Ice cream',i:'ice_cream.svg'},{w:'Ice',i:'ice.svg'},{w:'Igloo',i:'igloo.svg'},{w:'Island',i:'island.svg'},{w:'Insect',i:'insect.svg'},{w:'Ink',i:'ink.svg'},{w:'Instrument',i:'instrument.svg'},{w:'Iris',i:'iris.svg'},{w:'Idea',i:'idea.svg'},{w:'Iguana',i:'iguana.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'J': [{w:'Juice',i:'juice.svg'},{w:'Jeans',i:'jeans.svg'},{w:'Jacket',i:'jacket.svg'},{w:'Jaguar',i:'jaguar.svg'},{w:'Joker',i:'joker.svg'},{w:'Joystick',i:'joystick.svg'},{w:'Jug',i:'jug.svg'},{w:'Jelly',i:'jelly.svg'},{w:'Jewel',i:'jewel.svg'},{w:'Jet',i:'jet.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'K': [{w:'Kangaroo',i:'kangaroo.svg'},{w:'Key',i:'key.svg'},{w:'Kite',i:'kite.svg'},{w:'Keyboard',i:'keyboard.svg'},{w:'Kiwi',i:'kiwi.svg'},{w:'Koala',i:'koala.svg'},{w:'Knife',i:'knife.svg'},{w:'Knot',i:'knot.svg'},{w:'King',i:'king.svg'},{w:'Kiss',i:'kiss.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'L': [{w:'Lion',i:'lion.svg'},{w:'Leaf',i:'leaf.svg'},{w:'Lemon',i:'lemon.svg'},{w:'Lock',i:'lock.svg'},{w:'Laptop',i:'laptop.svg'},{w:'Ladybug',i:'ladybug.svg'},{w:'Lizard',i:'lizard.svg'},{w:'Llama',i:'llama.svg'},{w:'Lobster',i:'lobster.svg'},{w:'Lollipop',i:'lollipop.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'M': [{w:'Monkey',i:'monkey.svg'},{w:'Mouse',i:'mouse.svg'},{w:'Moon',i:'moon.svg'},{w:'Magnet',i:'magnet.svg'},{w:'Map',i:'map.svg'},{w:'Mushroom',i:'mushroom.svg'},{w:'Melon',i:'melon.svg'},{w:'Microscope',i:'microscope.svg'},{w:'Motorbike',i:'motorbike.svg'},{w:'Milk',i:'milk.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'N': [{w:'Nest',i:'nest.svg'},{w:'Nose',i:'nose.svg'},{w:'Nut',i:'nut.svg'},{w:'Ninja',i:'ninja.svg'},{w:'Newspaper',i:'newspaper.svg'},{w:'Note',i:'note.svg'},{w:'Necklace',i:'necklace.svg'},{w:'Nail',i:'nail.svg'},{w:'Noodle',i:'noodle.svg'},{w:'Night',i:'night.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'O': [{w:'Owl',i:'owl.svg'},{w:'Octopus',i:'octopus.svg'},{w:'Orange',i:'orange.svg'},{w:'Onion',i:'onion.svg'},{w:'Ocean',i:'ocean.svg'},{w:'Ox',i:'ox.svg'},{w:'Otter',i:'otter.svg'},{w:'Ostrich',i:'ostrich.svg'},{w:'Olive',i:'olive.svg'},{w:'Oyster',i:'oyster.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'P': [{w:'Pig',i:'pig.svg'},{w:'Penguin',i:'penguin.svg'},{w:'Panda',i:'panda.svg'},{w:'Pizza',i:'pizza.svg'},{w:'Pear',i:'pear.svg'},{w:'Peach',i:'peach.svg'},{w:'Parrot',i:'parrot.svg'},{w:'Piano',i:'piano.svg'},{w:'Pencil',i:'pencil.svg'},{w:'Pineapple',i:'pineapple.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'Q': [{w:'Queen',i:'queen.svg'},{w:'Quilt',i:'quilt.svg'},{w:'Quarter',i:'quarter.svg'},{w:'Question',i:'question.svg'},{w:'Quill',i:'quill.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'R': [{w:'Rabbit',i:'rabbit.svg'},{w:'Rocket',i:'rocket.svg'},{w:'Robot',i:'robot.svg'},{w:'Rose',i:'rose.svg'},{w:'Ring',i:'ring.svg'},{w:'Rainbow',i:'rainbow.svg'},{w:'Rat',i:'rat.svg'},{w:'Rooster',i:'rooster.svg'},{w:'Rhino',i:'rhino.svg'},{w:'Rice',i:'rice.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'S': [{w:'Snake',i:'snake.svg'},{w:'Star',i:'star.svg'},{w:'Sun',i:'sun.svg'},{w:'Spider',i:'spider.svg'},{w:'Snail',i:'snail.svg'},{w:'Shark',i:'shark.svg'},{w:'Sheep',i:'sheep.svg'},{w:'Sandwich',i:'sandwich.svg'},{w:'Shoe',i:'shoe.svg'},{w:'Scissors',i:'scissors.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'T': [{w:'Tiger',i:'tiger.svg'},{w:'Turtle',i:'turtle.svg'},{w:'Tree',i:'tree.svg'},{w:'Train',i:'train.svg'},{w:'Truck',i:'truck.svg'},{w:'Tractor',i:'tractor.svg'},{w:'Tomato',i:'tomato.svg'},{w:'Taco',i:'taco.svg'},{w:'Tooth',i:'tooth.svg'},{w:'Tent',i:'tent.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'U': [{w:'Umbrella',i:'umbrella.svg'},{w:'Unicorn',i:'unicorn.svg'},{w:'UFO',i:'ufo.svg'},{w:'Uniform',i:'uniform.svg'},{w:'Unlock',i:'unlock.svg'},{w:'Up',i:'up.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'V': [{w:'Violin',i:'violin.svg'},{w:'Volcano',i:'volcano.svg'},{w:'Vampire',i:'vampire.svg'},{w:'Van',i:'van.svg'},{w:'Vest',i:'vest.svg'},{w:'Video',i:'video.svg'},{w:'Virus',i:'virus.svg'},{w:'Vase',i:'vase.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'W': [{w:'Whale',i:'whale.svg'},{w:'Wolf',i:'wolf.svg'},{w:'Worm',i:'worm.svg'},{w:'Watermelon',i:'watermelon.svg'},{w:'Watch',i:'watch.svg'},{w:'Window',i:'window.svg'},{w:'Wheel',i:'wheel.svg'},{w:'Wood',i:'wood.svg'},{w:'Web',i:'web.svg'},{w:'Waffle',i:'waffle.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'X': [{w:'X-ray',i:'x-ray.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'Y': [{w:'Yak',i:'yak.svg'},{w:'Yarn',i:'yarn.svg'},{w:'Yo-yo',i:'yo-yo.svg'},{w:'Yacht',i:'yacht.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i})),
      'Z': [{w:'Zebra',i:'zebra.svg'},{w:'Zombie',i:'zombie.svg'},{w:'Zipper',i:'zipper.svg'},{w:'Zero',i:'zero.svg'}].map(o=>({word:o.w, image:'img/vocab/'+o.i}))
    };

    // Synthesizer for TTS
    this.synth = window.speechSynthesis;
  }

  start() {
    this.renderScreen1();
  }

  destroy() {
    this.container.innerHTML = '';
    this.synth.cancel(); // Stop any reading
  }

  updateLanguage(lang, T) {
    this.lang = lang;
  }

  /* ── Text-to-Speech Helper ── */
  speak(text) {
    if (!this.synth) return;
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Always read in English for alphabet/vocab
    utterance.rate = 0.9;
    this.synth.speak(utterance);
  }

  /* ── Screen 1: Alphabet Board ── */
  renderScreen1() {
    this.currentScreen = 1;
    this.container.innerHTML = `
      <div id="alphabet-board" class="ap-board">
        <h2 class="ap-title">Choose a Letter!</h2>
        <div class="ap-grid"></div>
      </div>
    `;

    const grid = this.container.querySelector('.ap-grid');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    letters.forEach(letter => {
      const btn = document.createElement('button');
      btn.className = 'ap-letter-btn';
      btn.textContent = letter;
      btn.addEventListener('click', () => {
        // Highlight logic and TTS
        this.speak(letter);
        // Add effect, then transition to Screen 2
        btn.classList.add('ap-selected');
        setTimeout(() => {
          this.selectedLetter = letter;
          this.renderScreen2();
        }, 1000); // wait for voice and animation
      });
      grid.appendChild(btn);
    });
  }

  /* ── Screen 2: Gameplay ── */
  renderScreen2() {
    this.currentScreen = 2;
    this.currentThemeIndex = Math.floor(Math.random() * this.themes.length);
    const themeClass = this.themes[this.currentThemeIndex];

    this.container.innerHTML = `
      <div id="alphabet-play" class="ap-play-area ${themeClass}">
        <button class="ap-back-btn" aria-label="Back to Board">⬅️</button>
        <div class="ap-objects-container"></div>
      </div>
    `;

    this.container.querySelector('.ap-back-btn').addEventListener('click', () => {
      this.renderScreen1();
    });

    this.spawnObjects();
  }

  spawnObjects() {
    const container = this.container.querySelector('.ap-objects-container');
    container.innerHTML = ''; // clear old

    const objectsCount = 10;
    const correctIndex = Math.floor(Math.random() * objectsCount);
    this.activeObjects = [];

    for (let i = 0; i < objectsCount; i++) {
      const isCorrect = (i === correctIndex);
      const objEl = document.createElement('div');
      objEl.className = 'ap-flying-object';
      
      // Random starting positions and animations
      const startX = Math.random() * 80 + 10; // 10% to 90%
      const startY = Math.random() * 80 + 10;
      objEl.style.left = `${startX}%`;
      objEl.style.top = `${startY}%`;
      objEl.style.animationDelay = `${Math.random() * 2}s`;
      
      // We use a pseudo-element or an img child for the visual
      const visualEl = document.createElement('div');
      visualEl.className = 'ap-object-visual';
      
      const themeImg = document.createElement('img');
      const currentTheme = this.themes[this.currentThemeIndex];
      themeImg.src = `img/themes/${currentTheme.replace('theme-', '')}.svg`;
      themeImg.className = 'ap-theme-icon';
      themeImg.onerror = () => { themeImg.style.display = 'none'; }; // fallback if theme SVG fails
      visualEl.appendChild(themeImg);

      objEl.appendChild(visualEl);

      if (isCorrect) {
        const textEl = document.createElement('span');
        textEl.className = 'ap-object-text';
        textEl.textContent = this.selectedLetter;
        objEl.appendChild(textEl);
      }

      objEl.addEventListener('click', () => this.handleObjectClick(objEl, isCorrect));
      
      container.appendChild(objEl);
      this.activeObjects.push(objEl);
    }
  }

  handleObjectClick(element, isCorrect) {
    if (element.classList.contains('ap-popped')) return;

    element.classList.add('ap-popped'); // Trigger disappear animation
    if (typeof audio !== 'undefined' && audio.playPop) audio.playPop();

    if (isCorrect) {
      this.speak(this.selectedLetter);
      
      // Pop all others
      this.activeObjects.forEach(obj => {
        if (obj !== element) obj.classList.add('ap-popped');
      });

      // Show vocab picture after pop
      setTimeout(() => {
        this.showVocabResult();
      }, 600);
    } else {
      // Just empty, it disappears.
      if (typeof audio !== 'undefined' && audio.playMiss) audio.playMiss();
    }
  }

  showVocabResult() {
    const vocabList = this.VOCAB_DB[this.selectedLetter];
    const vocabItem = vocabList[Math.floor(Math.random() * vocabList.length)];
    
    const resultEl = document.createElement('div');
    resultEl.className = 'ap-vocab-result';
    
    // Instead of using missing images right away, use a fallback emoji or text if img fails
    resultEl.innerHTML = `
      <div class="ap-vocab-image-container">
        <img src="${vocabItem.image}" alt="${vocabItem.word}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div class="ap-vocab-placeholder" style="display:none;">${this.selectedLetter}</div>
      </div>
      <div class="ap-vocab-text">${vocabItem.word}</div>
    `;

    resultEl.addEventListener('click', () => {
      this.speak(vocabItem.word);
      // pop animation
      resultEl.style.transform = 'scale(1.1)';
      setTimeout(() => resultEl.style.transform = 'scale(1)', 200);
    });

    this.container.querySelector('.ap-play-area').appendChild(resultEl);
    
    // Play voice and cheer
    setTimeout(() => {
      this.speak(vocabItem.word);
      if (typeof audio !== 'undefined' && audio.playCheer) audio.playCheer();
    }, 500);
  }
}
