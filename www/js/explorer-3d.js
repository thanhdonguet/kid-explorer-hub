import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import manifest from '../img/models/manifest.json';

// One GPU context for the whole app. Each DOM view receives a composited frame,
// so native scrolling, card flips, clipping, drag/drop and accessible buttons work.
// Still objects are rendered only when dirty; only the hero/mascot animate at rest.
const views = new Set();
const loader = new GLTFLoader();
const assets = new Map();
const geometries = new Map();
const materials = new Map();
const surfaceTextures = new Map();
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let renderer, failed = false, running = false, lastFrame = 0;

function surfaceTexture(color) {
  if (surfaceTextures.has(color)) return surfaceTextures.get(color);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(32, 32);
  let seed = [...color].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const grain = 224 + (seed >>> 27);
    image.data[i] = image.data[i + 1] = image.data[i + 2] = grain;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  surfaceTextures.set(color, texture);
  return texture;
}
function material(color, gloss = false) {
  const key = color + ':' + gloss;
  if (!materials.has(key)) {
    const texture = gloss ? null : surfaceTexture(color);
    materials.set(key, new THREE.MeshStandardMaterial({
      color,
      map: texture,
      roughnessMap: texture,
      roughness: gloss ? .26 : .78,
      metalness: 0,
    }));
  }
  return materials.get(key);
}
function geometry(key, create) {
  if (!geometries.has(key)) geometries.set(key, create());
  return geometries.get(key);
}
function mesh(parent, geo, color, pos = [0, 0, 0], scale = [1, 1, 1], gloss = false) {
  const obj = new THREE.Mesh(geo, material(color, gloss));
  obj.position.set(...pos); obj.scale.set(...scale); parent.add(obj); return obj;
}
function ball(parent, color, pos, scale, gloss) {
  return mesh(parent, geometry('sphere', () => new THREE.SphereGeometry(1, 24, 16)), color, pos, scale, gloss);
}
function box(parent, color, pos, scale, round = true) {
  return mesh(parent, geometry(round ? 'roundbox' : 'box', () => round ? new RoundedBoxGeometry(1, 1, 1, 2, .12) : new THREE.BoxGeometry(1, 1, 1)), color, pos, scale);
}
function cylinder(parent, color, pos, scale) {
  return mesh(parent, geometry('cylinder', () => new THREE.CylinderGeometry(1, 1, 1, 32)), color, pos, scale);
}
function cone(parent, color, pos, scale) {
  return mesh(parent, geometry('cone', () => new THREE.ConeGeometry(1, 1, 24)), color, pos, scale);
}
function torus(parent, color, radius, tube, pos, rotation = [0, 0, 0], arc = Math.PI * 2) {
  const key = `torus-${radius}-${tube}-${arc}`;
  const obj = mesh(parent, geometry(key, () => new THREE.TorusGeometry(radius, tube, 8, 40, arc)), color, pos);
  obj.rotation.set(...rotation); return obj;
}
function group(parent, position = [0, 0, 0], scale = 1) {
  const g = new THREE.Group(); g.position.set(...position); g.scale.setScalar(scale); parent?.add(g); return g;
}
function eyes(parent, y, z, distance = .28, size = .11) {
  for (const side of [-1, 1]) {
    ball(parent, '#fffdf2', [side * distance, y, z], [size * 1.65, size * 1.85, size]);
    ball(parent, '#253e46', [side * distance + .025, y, z + size * .82], [size * .82, size, size * .65]);
    ball(parent, '#ffffff', [side * distance + .045, y + size * .36, z + size * 1.3], [size * .28, size * .28, size * .2]);
  }
}
function shadow(parent, width = 1.1, depth = .65, y = -1.03) {
  // Soft concentric contact shadow; no expensive shadow maps on small devices.
  for (let i = 0; i < 5; i++) {
    const m = new THREE.MeshBasicMaterial({ color: '#284e55', transparent: true, opacity: .035, depthWrite: false });
    m.userData.owned = true;
    const s = new THREE.Mesh(geometry('circle', () => new THREE.CircleGeometry(1, 48)), m);
    s.rotation.x = -Math.PI / 2; s.position.y = y + i * .001;
    s.scale.set(width * (1 - i * .13), depth * (1 - i * .13), 1); parent.add(s);
  }
}
function tree(parent, pos = [0, 0, 0], size = 1, palm = false) {
  const g = group(parent, pos, size);
  cylinder(g, '#b18053', [0, .5, 0], [.11, 1, .11]);
  if (palm) {
    for (let i = 0; i < 6; i++) {
      const leaf = ball(g, i % 2 ? '#54bd79' : '#2d9867', [Math.cos(i) * .42, 1.08, Math.sin(i) * .42], [.65, .09, .19]);
      leaf.rotation.y = -i; leaf.rotation.z = .18;
    }
    ball(g, '#b18558', [.12, .92, .06], [.15, .15, .15]);
  } else {
    ball(g, '#52b979', [0, 1.02, 0], [.65, .7, .6]);
    ball(g, '#79cc85', [-.25, 1.28, .1], [.45, .45, .43]);
  }
  return g;
}
function dino(parent, color = '#66bf86') {
  const g = group(parent);
  const skin = new THREE.MeshStandardMaterial({ color, roughness: .55 }); skin.userData.owned = true;
  const part = (pos, scale) => { const o = ball(g, color, pos, scale); o.material = skin; return o; };
  part([0, -.15, 0], [.69, .84, .56]);
  part([.09, .9, .12], [.64, .62, .55]);
  part([.13, .7, .54], [.59, .3, .44]);
  ball(g, '#fff3cc', [0, -.22, .45], [.46, .58, .16]);
  part([-.43, -.84, .16], [.3, .26, .4]); part([.43, -.84, .16], [.3, .26, .4]);
  const arm = part([-.64, -.02, .26], [.18, .4, .18]); arm.rotation.z = -.45;
  part([.64, -.02, .26], [.18, .4, .18]).rotation.z = .45;
  const tail = part([-.53, -.53, -.5], [.72, .24, .25]); tail.rotation.z = -.35; tail.rotation.y = -.45;
  for (let i = 0; i < 5; i++) cone(g, '#f6c466', [-.08, 1.4 - i * .4, -.28 - i * .06], [.16, .26, .18]).rotation.x = -.4;
  eyes(g, 1.05, .54, .27, .12);
  for (const x of [-.1, .37]) ball(g, '#3e7958', [x, .78, .96], [.045, .03, .02]);
  torus(g, '#406655', .15, .018, [.14, .59, .88], [0, 0, Math.PI], Math.PI);
  g.userData.skin = skin; g.userData.arm = arm;
  return g;
}
function animal(parent, name) {
  const g = group(parent);
  const palettes = {
    lion: ['#e7a43d', '#fff0c2', '#8e4d2a'],
    monkey: ['#7047a6', '#f2c6a0', '#43265f'],
    panda: ['#f8f5e9', '#2c4251', '#d5eadf'],
    rabbit: ['#ddd1f1', '#fff4ef', '#ef91ac'],
    fox: ['#ef6f45', '#fff0d8', '#3c5060'],
    frog: ['#50bd75', '#d9f3a7', '#276d58'],
    elephant: ['#649cc3', '#dcecf2', '#315d7e'],
    penguin: ['#263f5a', '#fff5d8', '#f0a33d'],
    bear: ['#8b5d9d', '#f4d5ac', '#52355e'],
    cat: ['#50a7a0', '#fff0c9', '#28636d'],
  };
  const [color, accent, dark] = palettes[name] || ['#75bd8b', '#f5e1b7', '#365f54'];
  ball(g, color, [0, -.3, 0], [.65, .7, .51]);
  ball(g, color, [0, .52, .05], [.76, .67, .58]);
  ball(g, accent, [0, -.28, .44], [.4, .48, .15]);
  for (const side of [-1, 1]) {
    ball(g, dark, [side * .44, -.84, .18], [.3, .22, .32]);
    const ears = ball(g, name === 'panda' || name === 'penguin' ? dark : color, [side * .58, 1, .02], name === 'rabbit' ? [.19, .6, .2] : [.27, .27, .19]);
    if (name === 'rabbit') ears.rotation.z = side * -.2;
    if (name === 'elephant') ears.scale.set(.47, .58, .14);
    if (name === 'fox' || name === 'cat') {
      cone(g, color, [side * .48, 1.13, .02], [.26, .5, .24]);
      cone(g, accent, [side * .48, 1.17, .2], [.11, .22, .035]);
    }
  }
  if (name === 'lion') {
    for (let i = 0; i < 14; i++) ball(g, dark, [Math.cos(i * Math.PI / 7) * .66, .52 + Math.sin(i * Math.PI / 7) * .64, -.06], [.3, .3, .3]);
    const tail = torus(g, color, .55, .09, [-.55, -.35, -.28], [0, 0, -.6], Math.PI * 1.2); tail.scale.y = .72;
    ball(g, dark, [-.94, -.18, -.28], [.2, .24, .2]);
  }
  if (name === 'monkey') {
    for (const side of [-1, 1]) {
      ball(g, accent, [side * .62, .58, .1], [.22, .28, .16]);
      const arm = cylinder(g, dark, [side * .62, -.2, .12], [.12, .67, .12]); arm.rotation.z = side * -.38;
    }
    const tail = torus(g, accent, .68, .08, [-.45, -.28, -.28], [0, 0, -.45], Math.PI * 1.65); tail.scale.y = 1.25;
  }
  if (name === 'panda') {
    for (const x of [-.28, .28]) ball(g, dark, [x, .62, .55], [.25, .27, .09]);
    for (const x of [-.46, .46]) ball(g, dark, [x, -.26, .2], [.2, .5, .2]);
  }
  if (name === 'rabbit') ball(g, '#ffffff', [-.62, -.36, -.35], [.28, .28, .28]);
  if (name === 'fox') {
    const tail = cone(g, color, [-.72, -.38, -.3], [.34, 1.05, .34]); tail.rotation.z = -.82;
    cone(g, accent, [-1.1, -.02, -.3], [.27, .44, .27]).rotation.z = -.82;
  }
  if (name === 'bear') {
    ball(g, accent, [0, -.22, .48], [.44, .5, .13]);
    for (const side of [-1, 1]) ball(g, dark, [side * .27, .64, .55], [.12, .16, .06]);
  }
  if (name === 'cat') {
    const tail = torus(g, dark, .66, .08, [-.55, -.34, -.26], [0, 0, -.62], Math.PI * 1.45); tail.scale.y = 1.18;
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const whisker = cylinder(g, accent, [side * (.45 + i * .03), .29 - i * .07, .72], [.012, .35, .012]);
      whisker.rotation.z = Math.PI / 2 + side * (i - 1) * .12;
    }
  }
  if (name === 'penguin') {
    ball(g, accent, [0, .42, .51], [.6, .52, .1]);
    cone(g, dark, [0, .25, .78], [.2, .4, .18]).rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) {
      const wing = ball(g, color, [side * .65, -.05, 0], [.18, .55, .16]); wing.rotation.z = side * -.32;
    }
  } else {
    ball(g, accent, [0, .28, .54], [.37, .24, .16]);
    ball(g, dark, [0, .36, .72], [.12, .085, .075]);
  }
  eyes(g, .63, .61, .28, .09);
  if (name === 'elephant') {
    ball(g, color, [0, .05, .74], [.18, .52, .18]); ball(g, color, [.12, -.32, .79], [.28, .16, .18]);
    for (const side of [-1, 1]) cone(g, '#fff6de', [side * .18, .06, .82], [.06, .32, .06]).rotation.x = Math.PI / 2;
  }
  if (name === 'frog') {
    ball(g, color, [-.36, 1, .35], [.3, .28, .24]); ball(g, color, [.36, 1, .35], [.3, .28, .24]);
    eyes(g, 1.02, .55, .36, .12);
    for (const side of [-1, 1]) ball(g, dark, [side * .62, -.76, .34], [.42, .16, .35]);
  }
  return g;
}
function balloon(parent, color = '#f48d98') {
  const g = group(parent);
  ball(g, color, [0, .22, 0], [.68, .85, .6], true);
  cone(g, color, [0, -.64, 0], [.14, .18, .14]);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -.68, 0), new THREE.Vector3(-.08, -.93, 0), new THREE.Vector3(.09, -1.15, 0), new THREE.Vector3(0, -1.35, 0)]);
  const line = new THREE.TubeGeometry(curve, 14, .012, 4, false); line.userData.owned = true;
  mesh(g, line, '#738e8c'); return g;
}
function rocket(parent) {
  const g = group(parent);
  ball(g, '#fff8e5', [0, .15, 0], [.43, .88, .43]);
  cone(g, '#f1877f', [0, .95, 0], [.43, .7, .43]);
  ball(g, '#58bfd2', [0, .37, .41], [.24, .25, .07], true);
  torus(g, '#e6bd63', .25, .05, [0, .37, .42]);
  for (const x of [-.42, .42]) box(g, '#f1877f', [x, -.45, 0], [.21, .6, .45]).rotation.z = -x;
  cone(g, '#ffcd66', [0, -.95, 0], [.25, .65, .25]).rotation.z = Math.PI; return g;
}
function star(parent, color = '#f7c75e') {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2, r = i % 2 ? .45 : .9; i ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  shape.closePath();
  const geo = geometry('star', () => new THREE.ExtrudeGeometry(shape, { depth: .2, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .08, bevelThickness: .08 }));
  const g = group(parent); mesh(g, geo, color, [0, 0, -.1]); return g;
}
function potion(parent, color = '#ae88d8', bowl = false) {
  const g = group(parent);
  if (bowl) {
    ball(g, '#e9f5ed', [0, -.2, 0], [.92, .62, .8]);
    cylinder(g, '#bbcfc5', [0, .16, 0], [.87, .1, .75]);
    cylinder(g, color, [0, .23, 0], [.74, .055, .63]);
    torus(g, '#fff8e9', .82, .075, [0, .26, 0], [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 3; i++) ball(g, color, [-.4 + i * .38, .5 + i * .15, 0], [.12, .12, .12], true);
    cylinder(g, '#85ada0', [0, -.79, 0], [.65, .14, .6]);
  } else {
    ball(g, color, [0, -.13, 0], [.61, .67, .55], true);
    cylinder(g, '#dcefe3', [0, .52, 0], [.24, .49, .24]);
    cylinder(g, '#c99d74', [0, .83, 0], [.26, .18, .26]);
    box(g, '#fff7da', [0, -.14, .52], [.5, .36, .04]);
    star(g, color).scale.setScalar(.15);
  }
  return g;
}
function building(parent, name = 'School', color = '#edb96c') {
  const g = group(parent);
  const tones = { Hospital:'#e68983', 'Fire Station':'#db7466', 'Police Station':'#7ca2d3', School:'#e7bc68', Hotel:'#b099ca', Warehouse:'#a9ae97', Farm:'#c27e60' };
  color = tones[name] || color;
  if (name === 'Harbor') {
    cylinder(g,'#84c6d4',[0,-.7,0],[1.1,.12,.8]);
    for (let i=0;i<5;i++) box(g,'#c4a27a',[-.65+i*.32,-.54,0],[.28,.15,1.35]);
    for (const x of [-.7,.7]) cylinder(g,'#96734f',[x,-.28,.55],[.08,.6,.08]);
    const boat = vehicle(g,'Boat','#e7a47f'); boat.scale.setScalar(.5); boat.position.set(.35,-.12,-.35);
    return g;
  }
  if (name === 'Construction' || name === 'Road Work') {
    box(g,'#d4c3a0',[0,-.8,0],[2,.15,1.2]);
    if (name === 'Construction') {
      box(g,'#e9bb57',[-.55,.08,0],[.16,1.65,.16]);
      box(g,'#e9bb57',[.1,.88,0],[1.5,.15,.16]);
      cylinder(g,'#6a7772',[.7,.3,0],[.025,1.15,.025]);
      box(g,'#c8946b',[.7,-.28,0],[.48,.37,.5]);
    } else {
      box(g,'#84918a',[0,-.67,0],[1.9,.12,.75]);
      for (const x of [-.65,0,.65]) box(g,'#fff1c4',[x,-.595,0],[.25,.025,.06]);
      for (const x of [-.65,.65]) { box(g,'#f1ba78',[x,-.52,.42],[.34,.06,.34]); cone(g,'#eb9861',[x,-.25,.42],[.14,.5,.14]); }
    }
    return g;
  }
  if (name === 'Dump') {
    box(g,'#bcc7a3',[0,-.8,0],[2,.13,1.2]);
    for (const [i,c] of ['#72a78e','#d4b571','#87a7c5'].entries()) {
      box(g,c,[(i-1)*.6,-.28,0],[.5,.88,.58]); box(g,'#536d66',[(i-1)*.6,.2,0],[.57,.12,.65]);
      box(g,'#edf0d6',[(i-1)*.6,-.15,.31],[.19,.2,.025]);
    }
    return g;
  }
  if (name === 'Race Track') {
    const track = torus(g,'#83918b',.78,.2,[0,-.6,0],[Math.PI/2,0,0]); track.scale.x=1.2;
    cylinder(g,'#647875',[.8,.02,0],[.04,1.35,.04]);
    for(let x=0;x<3;x++)for(let y=0;y<2;y++) box(g,(x+y)%2?'#fbf2d5':'#4d6265',[.4+x*.15,.55+y*.15,0],[.15,.15,.05]);
    return g;
  }
  if (name === 'Bus Stop' || name === 'Train Station') {
    box(g,'#98bbaa',[0,-.77,0],[2,.15,1.2]);
    for (const x of [-.8,.8]) cylinder(g,'#6f8c82',[x,-.1,0],[.065,1.35,.065]);
    box(g,'#e7bd75',[0,.61,0],[2,.18,1]);
    box(g,'#9ac8cf',[0,-.08,-.38],[1.5,.95,.08]);
    box(g,'#ba916b',[0,-.45,.18],[1.4,.13,.42]);
    if(name==='Train Station') for(const z of [.48,.75])box(g,'#667971',[0,-.65,z],[2,.07,.05]);
    return g;
  }
  if (name === 'Helipad' || name === 'Launch Pad') {
    cylinder(g,'#92adb3',[0,-.75,0],[1.2,.2,1]);
    torus(g,'#fff2ba',.83,.05,[0,-.64,0],[Math.PI/2,0,0]);
    if(name==='Helipad') {
      for(const x of [-.25,.25])box(g,'#fff2ba',[x,-.62,0],[.08,.035,.65]);
      box(g,'#fff2ba',[0,-.62,0],[.5,.035,.08]);
    } else {
      box(g,'#cf9570',[-.65,.05,-.4],[.16,1.6,.16]);
      box(g,'#cf9570',[-.35,.65,-.4],[.75,.15,.15]);
      const r=rocket(g); r.scale.setScalar(.55); r.position.y=.03;
    }
    return g;
  }
  if (name === 'Hospital') {
    box(g,'#f7f3e5',[0,-.18,0],[1.8,1.25,1]);
    box(g,'#e78478',[0,.55,0],[1.9,.18,1.08]);
    box(g,'#71aeba',[0,-.46,.54],[.55,.7,.08]);
    for(const x of [-.55,.55])for(const y of [-.18,.2])box(g,'#9ed3d7',[x,y,.54],[.3,.24,.06]);
    box(g,'#e35f5a',[0,.82,.58],[.14,.42,.05]); box(g,'#e35f5a',[0,.82,.59],[.42,.14,.05]);
    return g;
  }
  if (name === 'Fire Station') {
    box(g,'#c95e4f',[0,-.25,0],[1.9,1.15,1]);
    for(const x of [-.48,.48]) { box(g,'#fff1d4',[x,-.43,.54],[.72,.72,.08]); for(let y=0;y<3;y++)box(g,'#d98168',[x,-.65+y*.22,.6],[.66,.035,.03]); }
    box(g,'#7e4c43',[-.72,.58,-.2],[.4,1.05,.55]); cone(g,'#f0b65f',[-.72,1.22,-.2],[.34,.5,.42]);
    cylinder(g,'#f1c15c',[.72,.62,.1],[.12,.18,.12],true);
    return g;
  }
  if (name === 'Police Station') {
    box(g,'#dce8e8',[0,-.28,0],[1.8,1.05,1]);
    box(g,'#668ebc',[-.64,.12,0],[.58,.72,1.12]); box(g,'#668ebc',[.64,.12,0],[.58,.72,1.12]);
    box(g,'#4d718f',[0,-.48,.55],[.5,.65,.08]);
    const badge=star(g,'#f0c45c'); badge.scale.setScalar(.27); badge.position.set(0,.3,.62);
    for(const x of [-.25,.25])ball(g,x<0?'#dc6f68':'#6aa8d2',[x,.68,0],[.14,.09,.12],true);
    return g;
  }
  if (name === 'Airport') {
    box(g,'#d9e3df',[.18,-.42,0],[1.75,.75,1]);
    box(g,'#72b3c1',[.18,-.28,.54],[1.45,.42,.07]);
    box(g,'#7f9696',[-.78,.16,-.15],[.32,1.55,.42]); box(g,'#9bd1d4',[-.78,.98,-.15],[.55,.34,.58]);
    box(g,'#83938e',[.25,-.79,.25],[2.35,.08,1.25]);
    for(let i=-2;i<=2;i++)box(g,'#fff1b7',[i*.35,-.735,.73],[.2,.02,.06]);
    return g;
  }
  if (name === 'School') {
    box(g,'#f3d48a',[0,-.3,0],[1.65,1.05,1]);
    const roof=cone(g,'#df785f',[0,.55,0],[1.22,.65,.82]); roof.rotation.y=Math.PI/4;
    box(g,'#6e9b93',[0,-.5,.53],[.38,.62,.07]);
    for(const x of [-.52,.52])box(g,'#93cbd0',[x,-.12,.53],[.3,.3,.07]);
    box(g,'#f4e5b4',[0,.7,.22],[.46,.55,.42]); ball(g,'#fff8db',[0,.78,.46],[.16,.16,.04]); cylinder(g,'#8c7558',[.9,.52,0],[.035,1.15,.035]); box(g,'#e77768',[1.08,.95,0],[.36,.22,.04]);
    return g;
  }
  if (name === 'Hotel') {
    box(g,'#9b82bc',[0,.05,0],[1.25,1.85,.9]);
    box(g,'#fff0d0',[0,-.64,.5],[.4,.58,.08]);
    for(const y of [-.35,.1,.55])for(const x of [-.35,.35])box(g,'#a9d5d5',[x,y,.49],[.24,.23,.05]);
    box(g,'#f2c76e',[0,1.05,.05],[1.35,.15,.95]);
    for(const x of [-.24,0,.24])ball(g,'#fff3b8',[x,.78,.51],[.055,.055,.025],true);
    return g;
  }
  if (name === 'Warehouse') {
    box(g,'#aeb7a7',[0,-.42,0],[2,.75,1.1]);
    for(const x of [-.66,0,.66]) { const roof=cone(g,'#788982',[x,.08,0],[.52,.5,.78]); roof.rotation.y=Math.PI/4; }
    for(const x of [-.55,.55]) { box(g,'#71847e',[x,-.48,.59],[.65,.65,.06]); for(let y=0;y<3;y++)box(g,'#d7d7ba',[x,-.7+y*.2,.63],[.58,.025,.025]); }
    box(g,'#c28f62',[0,-.7,.72],[.35,.3,.3]);
    return g;
  }
  if (name === 'Garage') {
    box(g,'#73a69c',[0,-.38,0],[1.85,.85,1]);
    box(g,'#455f62',[0,-.46,.54],[1.15,.72,.07]); for(let y=0;y<4;y++)box(g,'#a8c3b8',[0,-.72+y*.18,.59],[1.05,.025,.025]);
    const wheel=torus(g,'#f0c468',.22,.065,[.68,.28,.55]); wheel.scale.y=.75;
    for(const a of [-.65,.65]) { const tool=box(g,'#f0c468',[a,.25,.58],[.08,.5,.05]); tool.rotation.z=a; }
    return g;
  }
  if (name === 'Farm') {
    box(g,'#bf654f',[0,-.35,0],[1.55,.95,1]);
    const roof=cone(g,'#5f7f6a',[0,.48,0],[1.15,.8,.8]); roof.rotation.y=Math.PI/4;
    box(g,'#fff0d1',[0,-.43,.54],[.62,.68,.07]); for(const a of [-1,1]){const brace=box(g,'#bf654f',[0,-.43,.6],[.08,.78,.04]);brace.rotation.z=a*.65;}
    cylinder(g,'#d8c7a0',[.93,-.05,-.15],[.35,1.45,.35]); cone(g,'#8ea177',[.93,.82,-.15],[.38,.5,.38]);
    return g;
  }
  box(g, '#fff1ce', [0, -.1, 0], [1.65, 1.15, 1]);
  const roof = cone(g, color, [0, .71, 0], [1.3, .7, .9]); roof.rotation.y = Math.PI / 4;
  box(g, '#67a9b6', [0, -.39, .53], [.4, .65, .07]);
  for (const x of [-.55, .55]) box(g, '#88cad0', [x, .02, .53], [.28, .36, .07]);
  return g;
}
function vehicle(parent, name, color = '#e6b554') {
  const g = group(parent);
  if (/Airplane|Helicopter|Boat|Rocket/.test(name)) {
    if (name === 'Rocket') return rocket(parent);
    g.rotation.y = -.8;
    ball(g, color, [0, 0, 0], [.35, .35, 1]);
    if (name === 'Boat') { box(g, '#fff7dd', [0, .35, 0], [.48, .6, .65]); box(g,'#7dbac7',[0,.49,.34],[.35,.22,.03]); cylinder(g,'#cc8a6c',[0,.78,-.2],[.09,.35,.09]); return g; }
    ball(g,'#7cbfd0',[0,.19,.51],[.29,.21,.38]);
    box(g, '#ffedc9', [0, 0, 0], [2.2, .1, .42]);
    box(g, color, [0, .2, -.68], [.7, .1, .25]);
    box(g,color,[0,.35,-.78],[.08,.6,.3]);
    if (name === 'Helicopter') { cylinder(g, '#4d6469', [0, .51, 0], [.055, .4, .055]); box(g, '#47616b', [0, .74, 0], [2.2, .06, .18]); for(const x of [-.45,.45])box(g,'#526963',[x,-.4,0],[.07,.08,1.5]); }
    return g;
  }
  if (name === 'Motorcycle') {
    for (const x of [-.65,.65]) torus(g,'#405763',.33,.1,[x,-.35,0]);
    box(g,color,[0,-.06,0],[.9,.27,.35]); box(g,'#465e62',[-.22,.12,0],[.65,.1,.4]);
    const fork=box(g,'#819a98',[.55,-.04,0],[.08,.75,.08]); fork.rotation.z=.25;
    box(g,'#435b60',[.45,.37,0],[.08,.06,.7]); ball(g,'#ffe3a0',[.6,.2,.05],[.13,.13,.13]);
    return g;
  }
  const bus = /Bus|Train|Mixer/.test(name);
  box(g, color, [0, -.05, 0], [1.9, bus ? .8 : .45, .87]);
  box(g, '#74bdce', [bus ? 0 : -.15, .4, 0], [bus ? 1.55 : .88, .48, .73]);
  box(g, color, [bus ? 0 : -.15, .7, 0], [bus ? 1.7 : 1, .12, .86]);
  for (const x of [-.64, .64]) for (const z of [-.47, .47]) {
    const wheel = cylinder(g, '#3c5260', [x, -.42, z], [.28, .16, .28]); wheel.rotation.x = Math.PI / 2;
    ball(g, '#eae4ce', [x, -.42, z * 1.18], [.13, .13, .035]);
  }
  if(name==='Train') { cylinder(g,'#526e68',[-.65,.85,0],[.13,.45,.13]); box(g,'#e6c486',[-.97,-.35,0],[.2,.32,1.05]); }
  if(name==='Cement Mixer') { const drum=ball(g,'#d2dcd5',[-.15,.49,0],[.62,.55,.52]); drum.rotation.z=-.35; torus(g,'#dfaa60',.5,.09,[-.2,.49,0],[0,Math.PI/2,0]); }
  if(name==='Road Roller') { const roller=cylinder(g,'#8d9c99',[-.7,-.4,0],[.4,1.15,.4]); roller.rotation.x=Math.PI/2; }
  return g;
}
function fruit(parent, name) {
  const g = group(parent);
  const c = name === 'cucumber' ? '#72ae55' : '#f6a692';
  ball(g, c, [0, 0, 0], name === 'cucumber' ? [.32, 1, .32] : [.74, .69, .68], true);
  cylinder(g, '#926e41', [0, .77, 0], [.07, .25, .07]);
  ball(g, '#72b773', [.23, .82, 0], [.35, .08, .15]).rotation.z = .35; return g;
}
// Familiar learning objects use actual geometry rather than illustrated tiles.
function learningObject(parent, name) {
  const supported = ['book','gift','camera','robot','pencil','key','lock','unlock','bell','clock','watch','laptop','keyboard','ice','juice','milk','jug','vase','drum','hat','glasses','ring','wheel','lollipop','candy','magnet','leaf','moon','sun'];
  if (!supported.includes(name)) return null;
  const g = group(parent);
  const frontDisc = (color, x, y, z, radius, depth) => {
    const disc = cylinder(g, color, [x,y,z], [radius,depth,radius]);
    disc.rotation.x = Math.PI / 2; return disc;
  };
  if (name === 'book') {
    box(g,'#85ada6',[0,0,0],[1.35,1.65,.43]);
    box(g,'#fff4d9',[.05,0,.05],[1.17,1.47,.35]);
    box(g,'#85ada6',[0,0,.26],[1.35,1.65,.06]);
    box(g,'#577e78',[-.59,0,.3],[.13,1.6,.05]);
    for(const y of [.25,0,-.25])box(g,'#e7d39b',[.05,y,.31],[.65,.06,.025]);
  } else if (name === 'gift') {
    box(g,'#dd9eac',[0,-.15,0],[1.35,1.25,1.15]);
    box(g,'#edb0b8',[0,.49,0],[1.47,.2,1.27]);
    box(g,'#f7da96',[0,-.1,.59],[.2,1.35,.04]); box(g,'#f7da96',[0,.61,0],[.2,.04,1.28]);
    for(const x of [-.25,.25]) { const bow=torus(g,'#f7da96',.23,.065,[x,.79,0]); bow.scale.y=.65; }
  } else if (name === 'camera') {
    box(g,'#719cae',[0,-.05,0],[1.7,1.1,.65]); box(g,'#4c6c7a',[-.38,.56,0],[.62,.26,.5]);
    frontDisc('#4c6c7a',.1,-.05,.45,.43,.25); frontDisc('#b3dce3',.1,-.05,.59,.29,.04);
    box(g,'#fff0c6',[-.59,.23,.35],[.22,.17,.04]); cylinder(g,'#e4b778',[.57,.53,0],[.12,.16,.12]);
  } else if (name === 'robot') {
    box(g,'#8ab4bf',[0,-.19,0],[.85,.85,.62]); box(g,'#b8d1cc',[0,.6,0],[1.1,.64,.7]);
    eyes(g,.67,.4,.25,.1); box(g,'#577a80',[0,.41,.38],[.33,.05,.04]);
    cylinder(g,'#6b8f91',[0,1.03,0],[.04,.3,.04]); ball(g,'#e7b276',[0,1.2,0],[.1,.1,.1]);
    for(const side of [-1,1]) { ball(g,'#e4b87e',[side*.54,-.1,0],[.17,.17,.17]); box(g,'#8ab4bf',[side*.64,-.35,0],[.2,.48,.24]); box(g,'#608690',[side*.25,-.79,.12],[.3,.37,.45]); }
    frontDisc('#e7b276',0,-.1,.34,.18,.04);
  } else if (name === 'pencil') {
    cylinder(g,'#e7b956',[0,0,0],[.16,1.5,.16]); cone(g,'#e5c7a0',[0,-.91,0],[.16,.35,.16]).rotation.z=Math.PI;
    cone(g,'#485661',[0,-1.1,0],[.055,.15,.055]).rotation.z=Math.PI;
    cylinder(g,'#aebbc0',[0,.76,0],[.17,.17,.17]); ball(g,'#dca0ad',[0,.9,0],[.17,.2,.17]); g.rotation.z=-.35;
  } else if (name === 'key') {
    torus(g,'#e5bd6b',.34,.1,[-.45,.32,0]); box(g,'#e5bd6b',[.15,-.15,0],[1.15,.18,.16]).rotation.z=-.65;
    for(const x of [.42,.66])box(g,'#e5bd6b',[x,-.62,0],[.16,.3,.16]);
  } else if (name === 'lock' || name === 'unlock') {
    box(g,'#e3b967',[0,-.3,0],[1.15,.9,.48]);
    const hoop=torus(g,'#96adb4',.39,.1,[name==='unlock'?.22:0,.38,0],[0,0,0],Math.PI); hoop.rotation.z=name==='unlock'?-.35:0;
    for(const x of [-.39,.39])cylinder(g,'#96adb4',[x,.19,0],[.1,.4,.1]);
    frontDisc('#866f45',0,-.23,.26,.1,.03); box(g,'#866f45',[0,-.38,.28],[.07,.2,.025]);
  } else if (name === 'bell') {
    cone(g,'#e6bc6b',[0,.02,0],[.67,1.2,.67]); cylinder(g,'#d3a550',[0,-.59,0],[.73,.13,.73]);
    torus(g,'#b8914f',.15,.06,[0,.71,0]); ball(g,'#9f7940',[0,-.71,0],[.17,.18,.17]);
  } else if (name === 'clock' || name === 'watch') {
    if(name==='watch') box(g,'#81aba4',[0,0,-.12],[.56,2.1,.16]);
    frontDisc('#ddb976',0,0,0,.72,.25); frontDisc('#fff5dc',0,0,.14,.62,.025);
    for(let i=0;i<12;i++) { const a=i*Math.PI/6; ball(g,'#81938a',[Math.sin(a)*.51,Math.cos(a)*.51,.17],[.035,.035,.025]); }
    box(g,'#506d70',[0,.18,.2],[.06,.39,.04]); box(g,'#506d70',[.15,-.04,.21],[.35,.055,.04]).rotation.z=-.25;
    ball(g,'#d8997e',[0,0,.25],[.07,.07,.04]);
  } else if(name==='laptop'||name==='keyboard') {
    box(g,'#a3babb',[0,-.4,.15],[1.75,.13,1.05]);
    for(let row=0;row<3;row++)for(let col=0;col<7;col++)box(g,'#f1efd9',[-.64+col*.21,-.31,-.1+row*.2],[.15,.035,.13]);
    if(name==='laptop') { box(g,'#6c959c',[0,.2,-.37],[1.75,1.15,.12]); box(g,'#b3d9d6',[0,.2,-.29],[1.51,.88,.03]); }
  } else if(name==='ice') {
    box(g,'#a2d4e3',[0,0,0],[1.35,1.35,1.35]); box(g,'#d7eff0',[-.3,.35,.69],[.13,.39,.025]);
  } else if(['juice','milk','jug','vase'].includes(name)) {
    if(name==='milk') {
      box(g,'#f5f1df',[0,-.12,0],[.8,1.3,.7]); box(g,'#8dbdc8',[0,-.25,.36],[.7,.45,.025]);
      const roof=box(g,'#8dbdc8',[0,.61,0],[.8,.39,.7]); roof.scale.x=.7;
    } else if(name==='juice') {
      cylinder(g,'#f4bd67',[0,-.1,0],[.46,1.2,.46]); cylinder(g,'#f9df9b',[0,.51,0],[.47,.07,.47]);
      cylinder(g,'#dd917d',[.2,.79,0],[.045,.78,.045]).rotation.z=-.2;
    } else {
      ball(g,'#91b9b1',[0,-.25,0],[.58,.64,.5]); cylinder(g,'#91b9b1',[0,.44,0],[.29,.5,.29]);
      torus(g,'#6c978c',.28,.05,[0,.7,0],[Math.PI/2,0,0]);
      if(name==='jug')torus(g,'#91b9b1',.34,.1,[.55,.03,0]);
    }
  } else if(name==='drum') {
    cylinder(g,'#d59183',[0,0,0],[.7,1,.7]); for(const y of [-.5,.5])cylinder(g,'#ebd29b',[0,y,0],[.75,.1,.75]);
    cylinder(g,'#fff4d9',[0,.56,0],[.65,.025,.65]);
    for(const x of [-.36,.36]) { const stick=cylinder(g,'#a68357',[x,.85,0],[.04,.8,.04]); stick.rotation.z=x>0?.85:-.85; }
  } else if(name==='hat') {
    cylinder(g,'#bf9ac0',[0,-.4,0],[1,.1,.75]); cylinder(g,'#bf9ac0',[0,.07,0],[.62,.85,.52]); cylinder(g,'#ebc994',[0,-.21,0],[.635,.17,.535]);
  } else if(name==='glasses') {
    for(const x of [-.48,.48]) { torus(g,'#759ca7',.37,.07,[x,0,.2]); box(g,'#759ca7',[x*1.8,0,-.24],[.07,.07,.85]); }
    torus(g,'#759ca7',.12,.04,[0,0,.2],[0,0,0],Math.PI);
  } else if(name==='ring'||name==='wheel') {
    torus(g,name==='ring'?'#e6bd71':'#526975',.62,name==='ring'?.09:.18,[0,0,0]);
    if(name==='ring')mesh(g,geometry('ring-gem',()=>new THREE.OctahedronGeometry(.28)),'#8bcbd4',[0,.75,0]);
    else for(let i=0;i<6;i++)box(g,'#bccac5',[0,0,0],[1.15,.045,.045]).rotation.z=i*Math.PI/3;
  } else if(name==='lollipop'||name==='candy') {
    ball(g,'#dca2bf',[0,.15,0],[.54,.54,.23]);
    if(name==='lollipop') { cylinder(g,'#e0c49b',[0,-.65,0],[.045,.8,.045]); torus(g,'#fff0d5',.32,.06,[0,.15,.22]); }
    else for(const side of [-1,1])cone(g,'#f2c681',[side*.76,.15,0],[.35,.52,.25]).rotation.z=side*Math.PI/2;
  } else if(name==='magnet') {
    torus(g,'#d78f86',.55,.19,[0,.18,0],[0,0,Math.PI],Math.PI);
    for(const x of [-.55,.55]) { box(g,'#d78f86',[x,.38,0],[.38,.43,.38]); box(g,'#bcced0',[x,.68,0],[.38,.22,.38]); }
  } else if(name==='leaf') {
    const leaf=ball(g,'#8bb57b',[0,.05,0],[.5,.9,.13]); leaf.rotation.z=-.4;
    const stem=cylinder(g,'#5e895e',[0,-.13,.13],[.027,1.65,.027]); stem.rotation.z=-.4;
  } else if(name==='moon') {
    const shape=new THREE.Shape(); shape.moveTo(.35,.88); shape.bezierCurveTo(-1,.9,-1,-.9,.35,-.88); shape.bezierCurveTo(-.42,-.48,-.42,.48,.35,.88);
    mesh(g,geometry('crescent',()=>new THREE.ExtrudeGeometry(shape,{depth:.2,bevelEnabled:true,bevelThickness:.06,bevelSize:.04,bevelSegments:2,steps:1})),'#f1d38a');
  } else if(name==='sun') {
    ball(g,'#efc76e',[0,0,0],[.57,.57,.36]); for(let i=0;i<12;i++){const a=i*Math.PI/6; const ray=cone(g,'#e5b55b',[Math.sin(a)*.83,Math.cos(a)*.83,0],[.1,.32,.09]);ray.rotation.z=-a;}
  }
  return g;
}

function toy(parent, name, color) {
  const object = learningObject(parent, name);
  if (object) return object;
  const rides = {airplane:'Airplane',jet:'Airplane',helicopter:'Helicopter',boat:'Boat',yacht:'Boat',bus:'Bus',train:'Train',motorbike:'Motorcycle'};
  if (rides[name]) return vehicle(parent, rides[name], color);
  if (name === 'house' || name === 'igloo') {
    if(name==='house') return building(parent,'School');
    const g=group(parent); ball(g,'#d8eceb',[0,-.2,0],[.95,.83,.8]);
    box(g,'#b2d4da',[.12,-.52,.72],[.75,.8,.55]); box(g,'#577c89',[.12,-.58,1.01],[.43,.6,.025]);
    for(const y of [-.3,.05,.35])torus(g,'#a8cbd2',Math.sqrt(Math.max(.1,1-((y+.2)/.83)**2))*.94,.018,[0,y,0],[Math.PI/2,0,0]);
    return g;
  }
  if (['dino', 'dinosaur'].includes(name)) return dino(parent, color);
  if (['lion', 'monkey', 'panda', 'rabbit', 'fox', 'frog', 'elephant', 'penguin', 'bear', 'cat'].includes(name)) return animal(parent, name);
  if (name === 'rocket') return rocket(parent);
  if (name === 'balloon' || name === 'bubble') return balloon(parent, color);
  if (name === 'star') return star(parent, color);
  if (name === 'potion' || name === 'bowl') return potion(parent, color, name === 'bowl');
  if (name === 'peach' || name === 'cucumber') return fruit(parent, name);
  if (name === 'diamond') return mesh(parent, geometry('gem', () => new THREE.OctahedronGeometry(.86)), '#75cbd5');
  if (name === 'tree') return tree(parent, [0, -.9, 0], 1.05);
  if (name === 'fish') { const g = group(parent); ball(g, '#f4b465', [0, 0, 0], [.8, .49, .42]); cone(g, '#f18e74', [-.85, 0, 0], [.45, .6, .3]).rotation.z = Math.PI / 2; eyes(g, .14, .39, .26, .09); return g; }
  if (name === 'bird') { const g=group(parent); ball(g,'#8dc0d2',[0,-.1,0],[.55,.6,.44]); ball(g,'#8dc0d2',[.1,.55,.13],[.4,.4,.38]); for(const x of [-.54,.54])ball(g,'#67a2be',[x,-.05,0],[.3,.44,.19]); cone(g,'#ebbd6c',[.1,.4,.58],[.16,.38,.13]).rotation.x=Math.PI/2; eyes(g,.62,.45,.15,.07); for(const x of [-.2,.2])box(g,'#daa865',[x,-.68,.17],[.19,.09,.3]); return g; }
  if (name === 'butterfly') { const g=group(parent); for(const side of [-1,1]){ ball(g,'#bb9bd7',[side*.5,.35,0],[.49,.55,.17]); ball(g,'#e5adbd',[side*.4,-.32,0],[.37,.38,.15]); const a=box(g,'#736683',[side*.12,.75,0],[.025,.42,.025]); a.rotation.z=-side*.35; } ball(g,'#8b759a',[0,0,.16],[.13,.67,.15]); eyes(g,.4,.28,.07,.045); return g; }
  if (name === 'flower' || name === 'sunflower') { const g = group(parent); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ball(g, '#f2bc65', [Math.cos(a) * .55, Math.sin(a) * .55, 0], [.38, .38, .15]); } ball(g, '#b88959', [0, 0, .14], [.31, .31, .15]); return g; }
  if (name === 'cloud' || name === 'ghost') { const g = group(parent); for (let i = 0; i < 3; i++) ball(g, '#fff9ed', [(i - 1) * .5, i === 1 ? .14 : 0, 0], [.55, .45, .4]); return g; }
  if (name === 'ufo') { const g = group(parent); ball(g, '#bc9cde', [0, -.1, 0], [1, .22, .65]); ball(g, '#7bcedb', [0, .16, 0], [.5, .4, .45]); return g; }
  if (name === 'rainbow') { const g = group(parent); ['#ed8c8c', '#f3c16a', '#82c5a1', '#8cadd9'].forEach((c, i) => torus(g, c, .9 - i * .15, .09, [0, -.4, 0], [0, 0, 0], Math.PI)); return g; }
  return null;
}

async function loadModel(name) {
  if (!assets.has(name)) assets.set(name, loader.loadAsync(manifest[name]).then(gltf => {
    const root = gltf.scene;
    root.traverse(o => { if (o.isMesh) { o.material.roughness = .72; o.material.metalness = 0; } });
    return root;
  }).catch(err => { assets.delete(name); throw err; }));
  const source = await assets.get(name);
  const clone = source.clone(true);
  const bounds = new THREE.Box3().setFromObject(clone);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const factor = 1.9 / Math.max(size.x, size.y, size.z);
  clone.position.copy(center).multiplyScalar(-factor); clone.scale.setScalar(factor);
  const normalized = new THREE.Group(); normalized.add(clone);
  // A few source files include broad invisible rig bounds. Compensate only at
  // presentation time so the recognizable animal fills its card.
  normalized.scale.setScalar({ lion: 2.05, monkey: 1.55, fox: 1.9, bear: 1.45, cat: 1.15 }[name] || 1);
  return normalized;
}
const aliases = { car: 'sedan', fire_truck: 'firetruck', icecream: 'ice-cream', ice_cream: 'ice-cream', hamburger: 'burger', tent:'tent_smallOpen', jewel:'diamond' };
const vehicleModels = { 'Fire Truck': 'firetruck', Ambulance: 'ambulance', 'Police Car': 'police', Taxi: 'taxi', 'Garbage Truck': 'garbage-truck', Excavator: 'tractor-shovel', Bulldozer: 'tractor-shovel', Tractor: 'tractor', Van: 'van', 'Race Car': 'race' };

function platform(parent, x, z, radius, top = '#91c98e') {
  const g = group(parent, [x, -.25, z]);
  cylinder(g, '#d1b384', [0, -.2, 0], [radius, .55, radius * .76]);
  cylinder(g, '#f6dcaa', [0, .05, 0], [radius * 1.04, .18, radius * .79]);
  cylinder(g, top, [0, .18, 0], [radius * .91, .19, radius * .68]); return g;
}
function world(parent, invalidate) {
  const g = group(parent);
  const island = platform(g, 0, 0, 3.25);
  // Sandy winding path.
  for (let i = 0; i < 12; i++) cylinder(island, '#f6dfa9', [Math.sin(i * .35) * .9, .29, 1.8 - i * .32], [.43, .015, .34]);
  const house = building(island, 'School', '#e98e76'); house.position.set(.15, .99, -.66); house.scale.setScalar(.85);
  const mascot = dino(island); mascot.position.set(-1.35, .95, .7); mascot.scale.setScalar(.61); mascot.rotation.y = .24;
  tree(island, [-2, .28, -.7], 1.2, true); tree(island, [1.65, .28, -1.2], 1.3); tree(island, [2.1, .28, .45], .8, true);
  for (const [x, z, s] of [[-1.2, -1.2, 1], [1.5, .7, .72], [1, -1.3, .8]]) {
    const holder = group(island, [x, .28 + s * .65, z], s);
    loadModel('tree_palmBend').then(model => { holder.add(model); invalidate(); }).catch(() => tree(holder, [0, -.6, 0], .8, true));
  }
  const mini = platform(g, 3.8, 1.7, 1.05, '#a8c99a');
  const r = rocket(mini); r.scale.setScalar(.63); r.position.y = 1.06; r.rotation.z = -.17;
  // Wooden bridge.
  for (let i = 0; i < 7; i++) { const b = box(g, i % 2 ? '#cea26c' : '#e4bc84', [2.2 + i * .23, -.05, 1.25 + i * .055], [.2, .1, .55]); b.rotation.y = -.22; }
  const balloonRig = group(g, [-2.9, 2.5, -1.5]);
  balloon(balloonRig, '#efaf70').scale.setScalar(.76);
  box(balloonRig, '#c89462', [0, -1.05, 0], [.38, .32, .35]);
  for (const [x, y, z] of [[-3.8, 2.4, 1], [2.9, 3.1, -1.7], [4.1, 1.9, .1]]) toy(g, 'cloud').position.set(x, y, z);
  for (let i = 0; i < 18; i++) {
    const x = Math.sin(i * 2.39) * 2.5, z = Math.cos(i * 1.7) * 1.5;
    if (Math.abs(x) < .8) continue;
    ball(island, i % 2 ? '#f7e8a4' : '#edaa93', [x, .34, z], [.08, .13, .08]);
  }
  g.userData.mascot = mascot; g.userData.balloonRig = balloonRig;
  return g;
}
function diorama(parent, kind, invalidate) {
  const g = group(parent);
  const p = platform(g, 0, 0, 1.2, { memory: '#9acaa7', color: '#c5b0df', math: '#e4c78c', alphabet: '#9acbdc', drawing: '#a3c994', vehicles: '#a9c6c5' }[kind]);
  p.position.y = -.85;
  if (kind === 'memory') {
    const holder = group(g, [0, 0, 0], .62);
    loadModel('lion').then(model => { holder.add(model); invalidate?.(); }).catch(() => animal(holder, 'lion'));
    tree(g, [-.86, -.53, -.45], .8);
  }
  if (kind === 'color') { potion(g, '#a792d6').position.x = .35; const b = potion(g, '#e7a16e'); b.scale.setScalar(.65); b.position.set(-.68, -.2, .15); }
  if (kind === 'math') { fruit(g, 'peach').position.set(.35, 0, 0); const a = fruit(g, 'cucumber'); a.scale.setScalar(.65); a.position.set(-.65, 0, .1); }
  if (kind === 'alphabet') { balloon(g, '#efb668').position.x = -.4; const b = balloon(g, '#9f93d1'); b.scale.setScalar(.7); b.position.set(.57, -.1, 0); }
  if (kind === 'drawing') { dino(g).scale.setScalar(.74); tree(g, [-.8, -.55, -.45], .55, true); }
  if (kind === 'vehicles') { vehicle(g, 'Bus', '#edb55c').scale.setScalar(.85); }
  return g;
}
function disposeOwned(root) {
  root?.traverse(o => {
    if (o.geometry?.userData.owned) o.geometry.dispose();
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
      if (!m?.userData.owned) continue;
      m.map?.dispose(); m.dispose();
    }
  });
}
function initRenderer() {
  if (renderer || failed) return;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(1);
    renderer.setSize(1024, 768, false);
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.addEventListener('webglcontextlost', e => {
      e.preventDefault(); failed = true;
      views.forEach(v => v.showFallback());
    });
    renderer.domElement.addEventListener('webglcontextrestored', () => {
      failed = false; views.forEach(v => { v.dirty = true; }); wake();
    });
    document.documentElement.dataset.graphics = '3d';
  } catch {
    failed = true; document.documentElement.dataset.graphics = 'fallback';
  }
}
function wake() {
  if (running || document.hidden || failed) return;
  running = true; requestAnimationFrame(frame);
}
function frame(now) {
  running = false;
  if (failed || document.hidden) return;
  if (now - lastFrame < 1000 / 30) { wake(); return; }
  lastFrame = now;
  let animated = false;
  let draws = 0;
  for (const v of views) {
    if (!v.visible || !v.object || !v.isConnected || !v.offsetWidth || !v.closest('.screen.active')) continue;
    const moving = !motionQuery.matches && (v.hasAttribute('animate') || v.hovering);
    if ((v.dirty || moving) && draws < 8) { v.render(now / 1000, moving); draws++; }
    if (moving || v.dirty) animated = true;
  }
  if (animated) wake();
}
const visibility = new IntersectionObserver(entries => {
  entries.forEach(e => { e.target.visible = e.isIntersecting; if (e.isIntersecting) e.target.dirty = true; }); wake();
});
const resize = new ResizeObserver(entries => { entries.forEach(e => { e.target.dirty = true; }); wake(); });

class KidModel extends HTMLElement {
  static observedAttributes = ['model', 'color', 'src', 'animate', 'yaw'];
  connectedCallback() {
    if (this.canvas) { views.add(this); visibility.observe(this); resize.observe(this); this.dirty = true; wake(); return; }
    this.canvas = document.createElement('canvas'); this.canvas.setAttribute('aria-hidden', 'true');
    this.canvas.className = 'model-canvas'; this.append(this.canvas);
    this.ctx = this.canvas.getContext('2d'); this.visible = true; this.dirty = true;
    this.setAttribute('role', 'img');
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight('#fffbef', '#8ca9ad', 1.5));
    const light = new THREE.DirectionalLight('#fff2d8', 2.2); light.position.set(-3, 6, 5); this.scene.add(light);
    const fill = new THREE.DirectionalLight('#bdebf0', .8); fill.position.set(4, 2, -3); this.scene.add(fill);
    this.camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
    this.onpointerenter = () => { this.hovering = true; this.dirty = true; wake(); };
    this.onpointerleave = () => { this.hovering = false; this.dirty = true; wake(); };
    views.add(this); visibility.observe(this); resize.observe(this);
    initRenderer(); this.build();
  }
  disconnectedCallback() {
    views.delete(this); visibility.unobserve(this); resize.unobserve(this);
    this.generation = (this.generation || 0) + 1;
    disposeOwned(this.object); this.scene?.remove(this.object); this.object = null;
    // A reconnected node rebuilds its view; cached shared GLBs remain bounded by manifest.
    this.canvas?.remove(); this.canvas = null;
  }
  attributeChangedCallback(name, old, value) {
    if (old === value || !this.canvas) return;
    if (name === 'yaw') { this.dirty = true; wake(); }
    else if (name === 'color' && this.object?.userData.skin) {
      this.object.userData.skin.color.set(value || '#66bf86'); this.dirty = true; wake();
    } else if (name === 'animate') { wake(); } else this.build();
  }
  showFallback() { this.classList.remove('model-ready'); }
  async build() {
    const generation = this.generation = (this.generation || 0) + 1;
    delete this.dataset.loadError;
    this.dataset.modelKind = 'mesh';
    const name = this.getAttribute('model') || 'star', color = this.getAttribute('color') || undefined;
    this.isWorld = name === 'world';
    if (this.object) { this.scene.remove(this.object); disposeOwned(this.object); }
    const root = new THREE.Group(); this.object = root; this.scene.add(root);
    const invalidate = () => { this.dirty = true; wake(); };
    try {
      const key = aliases[name] || name;
      if (name === 'world') world(root, invalidate);
      else if (name.startsWith('island-')) diorama(root, name.slice(7), invalidate);
      else if (name.startsWith('station-')) building(root, name.slice(8), color);
      else if (name.startsWith('vehicle-')) {
        const vehicleName = name.slice(8);
        if (vehicleModels[vehicleName]) root.add(await loadModel(vehicleModels[vehicleName]));
        else vehicle(root, vehicleName, color);
      } else if (manifest[key]) root.add(await loadModel(key));
      else {
        const created = toy(root, key, color);
        if (created?.userData.skin) root.userData.skin = created.userData.skin;
        if (!created) {
          this.dataset.modelKind = 'illustration';
          // Unmodeled vocabulary stays recognizable on a thick illustrated 3D tile.
          box(root, '#fff4d5', [0, 0, -.1], [1.7, 1.7, .22]);
          const src = this.getAttribute('src');
          if (src) {
            const texture = await new THREE.TextureLoader().loadAsync(src);
            texture.colorSpace = THREE.SRGBColorSpace;
            if (!this.isConnected || generation !== this.generation) { texture.dispose(); return; }
            const m = new THREE.MeshBasicMaterial({ map: texture, transparent: true }); m.userData.owned = true;
            const p = new THREE.Mesh(geometry('tile-face', () => new THREE.PlaneGeometry(1.42, 1.42)), m); p.position.z = .025; root.add(p);
          } else star(root);
        }
      }
      if (!this.isConnected || generation !== this.generation) { disposeOwned(root); return; }
      if (!this.isWorld) shadow(root);
      this.dirty = true; wake();
    } catch (error) {
      if (!this.isConnected || generation !== this.generation) return;
      this.showFallback(); this.dataset.loadError = 'true';
      console.warn('Model unavailable:', name, error.message);
    }
  }
  render(time, moving) {
    if (!renderer || failed || !this.ctx || this.dataset.loadError) { this.dirty = false; return; }
    const width = this.clientWidth, height = this.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.5, 1024 / width, 768 / height);
    const w = Math.max(1, Math.round(width * ratio)), h = Math.max(1, Math.round(height * ratio));
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    this.camera.aspect = w / h;
    if (this.isWorld) {
      this.camera.position.set(7.5, 6.5, 11.5); this.camera.lookAt(.3, .65, 0);
      this.camera.zoom = this.camera.aspect < 1.25 ? this.camera.aspect / 1.25 : 1;
      this.object.rotation.y = moving ? Math.sin(time * .16) * .065 : 0;
      const rig = this.object.children[0];
      if (rig?.userData.balloonRig) rig.userData.balloonRig.position.y = 2.5 + (moving ? Math.sin(time) * .1 : 0);
    } else {
      this.camera.position.set(.5, 1.35, 5.8); this.camera.lookAt(0, -.05, 0);
      this.camera.zoom = Math.min(1, this.camera.aspect);
      const yaw = Number(this.getAttribute('yaw')) || 0;
      this.object.rotation.y = .18 + yaw * Math.PI / 180 + (moving && !this.hasAttribute('yaw') ? Math.sin(time * .8) * .19 : 0);
      this.object.position.y = moving && this.hasAttribute('animate') ? Math.sin(time * 1.7) * .035 : 0;
    }
    this.camera.updateProjectionMatrix();
    renderer.setViewport(0, 0, w, h); renderer.setScissor(0, 0, w, h); renderer.setScissorTest(true);
    renderer.render(this.scene, this.camera);
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.drawImage(renderer.domElement, 0, 768 - h, w, h, 0, 0, w, h);
    this.classList.add('model-ready'); this.dirty = false;
  }
}
customElements.define('kid-model', KidModel);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { views.forEach(v => { v.dirty = true; }); wake(); } });
document.addEventListener('explorer-screen-change', () => { views.forEach(v => { v.dirty = true; }); wake(); });
motionQuery.addEventListener('change', () => { views.forEach(v => { v.dirty = true; }); wake(); });
window.Explorer3D = { get viewCount() { return views.size; }, get supported() { return !!renderer && !failed; } };
