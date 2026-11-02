import * as THREE from 'three';

const canvas = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9c5c6');
scene.fog = new THREE.FogExp2('#a9c5c6', 0.018);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 150);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.HemisphereLight('#e5f7f5', '#5a6873', 2.1));
const sun = new THREE.DirectionalLight('#fff0d4', 3.4);
sun.position.set(-7, 15, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -22; sun.shadow.camera.right = 22;
sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -22;
sun.shadow.bias = -0.0004;
scene.add(sun);

const mat = (color, roughness = .86, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const clay = mat('#d77e61'), clayLight = mat('#eea071'), deepClay = mat('#a7524f');
const stoneMat = mat('#687b7b'), topMat = mat('#9caa93'), goldMat = mat('#ffd17b', .36, { emissive: '#ad5f22', emissiveIntensity: .35 });
const waterMat = new THREE.MeshStandardMaterial({ color: '#315f70', roughness: .28, metalness: .12, transparent: true, opacity: .9 });
const world = new THREE.Group(); scene.add(world);

function box(parent, size, position, material, radius = 0) {
  const geo = radius ? new THREE.BoxGeometry(...size, 2, 2, 2) : new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
  if (radius) { const edges = new THREE.EdgesGeometry(geo); mesh.geometry = geo; }
  return mesh;
}
function addRock(parent, x, y, z, scale, color, seed = 0) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), mat(color));
  rock.position.set(x, y, z); rock.scale.set(...scale); rock.rotation.set(seed * .17, seed * .31, seed * .11);
  rock.castShadow = true; rock.receiveShadow = true; parent.add(rock); return rock;
}

// The basin floor and its scattered, sculpted clay outcrops.
const water = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), waterMat);
water.rotation.x = -Math.PI / 2; water.position.y = -2.68; water.receiveShadow = true; world.add(water);
const basinBase = new THREE.Mesh(new THREE.CylinderGeometry(23, 24, .65, 48), mat('#425d62'));
basinBase.position.set(0, -3.08, -1.5); basinBase.receiveShadow = true; basinBase.castShadow = true; world.add(basinBase);
for (let i = 0; i < 36; i++) {
  const a = i * 2.399, r = 11 + (i % 5) * 1.15;
  addRock(world, Math.cos(a) * r, -2.5 + (i % 3) * .28, Math.sin(a) * r - 1.2,
    [.45 + (i % 3) * .18, .45 + (i % 4) * .22, .45 + (i % 2) * .25], i % 2 ? '#718782' : '#8b8b76', i);
}
// Misty stacks frame the distant basin.
for (let i = 0; i < 12; i++) {
  const x = (i - 5.5) * 5.4, z = -17 - (i % 3) * 3;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.7 + (i % 3) * .5, 6 + (i % 4) * 1.5, 5), mat(i % 2 ? '#859b91' : '#748e8e'));
  spire.position.set(x, -.2, z); spire.rotation.y = i * .7; spire.castShadow = true; world.add(spire);
}

function makeIsland(x, z, w, d, main = false) {
  const group = new THREE.Group(); group.position.set(x, 0, z); world.add(group);
  const baseColor = main ? '#bd795e' : '#687e7a';
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, .8, d, 2, 1, 2), mat(baseColor));
  base.position.y = -.2; base.castShadow = base.receiveShadow = true; group.add(base);
  const top = new THREE.Mesh(new THREE.BoxGeometry(w - .16, .22, d - .16, 2, 1, 2), main ? clayLight : topMat);
  top.position.y = .31; top.castShadow = top.receiveShadow = true; group.add(top);
  // Hand-shaped clay seams on island edges.
  for (let i = 0; i < 5; i++) {
    const px = -w * .42 + i * w * .21;
    addRock(group, px, -.34 + (i % 2) * .08, -d * .48, [.25, .16, .24], main ? '#d88a68' : '#82918a', i + 2);
  }
  return { x, z, w, d, top: .42, group };
}
const startIsland = makeIsland(0, 6.1, 7.2, 5.5, true);
const finishIsland = makeIsland(-.5, -10.1, 7.2, 5.2, true);

// Five submerged stones lift only when a nearby pulse wakes them.
const stoneDefs = [
  { x: 0, z: 1.65 }, { x: 2.05, z: -.55 }, { x: 3.45, z: -2.85 },
  { x: 1.55, z: -5.15 }, { x: -.45, z: -7.55 }
];
const stones = stoneDefs.map((p, index) => {
  const g = new THREE.Group(); g.position.set(p.x, -2.6, p.z); world.add(g);
  const w = index === 2 ? 2.25 : 2.35, d = 2.15;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, .8, d, 2, 1, 2), stoneMat);
  body.position.y = -.05; body.castShadow = body.receiveShadow = true; g.add(body);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(w - .1, .2, d - .1, 2, 1, 2), topMat);
  cap.position.y = .45; cap.castShadow = cap.receiveShadow = true; g.add(cap);
  // Carved luminous rune in the center of each sleeping stone.
  const rune = new THREE.Mesh(new THREE.TorusGeometry(.24, .045, 8, 24), new THREE.MeshStandardMaterial({ color: '#88e4d3', emissive: '#37a995', emissiveIntensity: .5, roughness: .4 }));
  rune.rotation.x = -Math.PI / 2; rune.position.y = .57; g.add(rune);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.24, 1.42, 48), new THREE.MeshBasicMaterial({ color: '#72dece', transparent: true, opacity: .28, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, -2.61, p.z); world.add(ring);
  return { x: p.x, z: p.z, w, d, group: g, rune, ring, height: -2.6, timer: 0, active: false, phase: index * 1.4 };
});

// Gate, warm light and kiln fire at the end of the causeway.
const gate = new THREE.Group(); gate.position.set(-.5, .42, -11.55); world.add(gate);
box(gate, [.55, 3.4, .58], [-1.25, 1.7, 0], clayLight);
box(gate, [.55, 3.4, .58], [1.25, 1.7, 0], clayLight);
box(gate, [3.05, .6, .7], [0, 3.35, 0], clay);
const portal = new THREE.Mesh(new THREE.CircleGeometry(.97, 40), new THREE.MeshBasicMaterial({ color: '#f9bb70', transparent: true, opacity: .86, side: THREE.DoubleSide }));
portal.position.set(0, 1.82, -.11); gate.add(portal);
const gateRing = new THREE.Mesh(new THREE.TorusGeometry(1.08, .11, 12, 48), new THREE.MeshStandardMaterial({ color: '#ffe1a0', emissive: '#ff9d47', emissiveIntensity: .8 }));
gateRing.position.set(0, 1.82, -.06); gate.add(gateRing);
const gateLight = new THREE.PointLight('#ffc27a', 2.4, 9); gateLight.position.set(-.5, 2.6, -11.5); scene.add(gateLight);

// Three kiln embers, arranged along the jumping line.
const embers = [];
for (const [i, p] of [[0, [0, 2.14, 1.65]], [1, [3.45, 2.14, -2.85]], [2, [-.45, 2.14, -7.55]]]) {
  const group = new THREE.Group(); group.position.set(...p); world.add(group);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(.34, 0), goldMat);
  core.castShadow = true; group.add(core);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.53, .035, 8, 28), new THREE.MeshBasicMaterial({ color: '#ffe6a3', transparent: true, opacity: .8 }));
  halo.rotation.x = Math.PI / 2; group.add(halo);
  const light = new THREE.PointLight('#ffbb64', 1.1, 4); group.add(light);
  embers.push({ group, core, halo, light, got: false, phase: i * 2 });
}

// A little wandering siltling guards the narrow middle step.
const hazard = new THREE.Group(); world.add(hazard);
const hbody = new THREE.Mesh(new THREE.DodecahedronGeometry(.42, 0), mat('#d46a54', .6, { emissive: '#60251d', emissiveIntensity: .25 }));
hbody.castShadow = true; hazard.add(hbody);
for (let s = -1; s <= 1; s += 2) {
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 8), mat('#ffe2a8', .2, { emissive: '#ffc86a', emissiveIntensity: .8 }));
  eye.position.set(s * .16, .12, -.34); hazard.add(eye);
}
const hazardGlow = new THREE.PointLight('#f48153', .8, 2.5); hazard.add(hazardGlow);

// The little handmade clay runner.
const player = new THREE.Group(); world.add(player);
const torso = new THREE.Mesh(new THREE.SphereGeometry(.42, 12, 10), clay);
torso.scale.set(.86, 1.08, .72); torso.position.y = .76; torso.castShadow = true; player.add(torso);
const head = new THREE.Mesh(new THREE.SphereGeometry(.33, 12, 10), clayLight);
head.position.set(0, 1.35, -.02); head.castShadow = true; player.add(head);
const tuft = new THREE.Mesh(new THREE.ConeGeometry(.16, .32, 5), deepClay); tuft.position.set(.03, 1.68, -.02); tuft.rotation.z = -.25; tuft.castShadow = true; player.add(tuft);
for (const s of [-1, 1]) {
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 8), mat('#342e36', .4));
  eye.position.set(s * .12, 1.39, -.305); player.add(eye);
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.105, .33, 3, 6), clay);
  arm.position.set(s * .39, .76, .02); arm.rotation.z = s * -.3; arm.castShadow = true; player.add(arm);
  const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .24, 3, 6), deepClay);
  leg.position.set(s * .17, .24, 0); leg.castShadow = true; player.add(leg);
}
const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(.48, 24), new THREE.MeshBasicMaterial({ color: '#152b32', transparent: true, opacity: .3, depthWrite: false }));
shadowDisc.rotation.x = -Math.PI / 2; shadowDisc.position.y = .015; player.add(shadowDisc);

// Pulse rings are visual feedback for the new resonance mechanic.
const pulseRings = [];
for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 64), new THREE.MeshBasicMaterial({ color: i === 0 ? '#a0ffe9' : '#ffcb79', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; world.add(ring); pulseRings.push({ mesh: ring, age: 0 });
}

const state = { running: false, ended: false, y: .43, vy: 0, grounded: true, lastSafe: new THREE.Vector3(0, .43, 6.1), pulseCooldown: 0, time: 0, moveX: 0, moveZ: 0, walk: 0 };
player.position.set(0, state.y, 6.1);
const keys = new Set();
const keyAliases = { ArrowUp: 'w', ArrowDown: 's', ArrowLeft: 'a', ArrowRight: 'd' };
let toastTimer = 0;
function toast(text) { const el = document.querySelector('#toast'); el.textContent = text; el.classList.add('show'); toastTimer = 1.8; }
function startGame() {
  document.querySelector('#intro').classList.add('hidden');
  document.querySelector('#ending').classList.add('hidden');
  state.running = true; state.ended = false;
}
document.querySelector('#start').addEventListener('click', startGame);
document.querySelector('#again').addEventListener('click', () => { resetGame(); document.querySelector('#ending').classList.add('hidden'); state.running = true; });
function resetGame() {
  state.y = .43; state.vy = 0; state.grounded = true; state.lastSafe.set(0, .43, 6.1); player.position.set(0, .43, 6.1); state.time = 0; state.pulseCooldown = 0;
  for (const e of embers) { e.got = false; e.group.visible = true; }
  document.querySelectorAll('.gem').forEach(e => e.classList.remove('on'));
  document.querySelector('#count').textContent = '0 / 3';
  for (const s of stones) { s.timer = 0; s.active = false; s.height = -2.6; s.group.position.y = -2.6; }
  document.querySelector('#meter').style.width = '100%';
}
function doJump() { if (state.running && state.grounded) { state.vy = 7.3; state.grounded = false; } }
function doPulse() {
  if (!state.running || state.pulseCooldown > 0) return;
  state.pulseCooldown = .78;
  let awakened = 0;
  for (const s of stones) {
    const d = Math.hypot(player.position.x - s.x, player.position.z - s.z);
    if (d < 5.5) { s.timer = 3.7; s.active = true; awakened++; }
  }
  const ring = pulseRings.find(r => !r.mesh.visible) || pulseRings[0];
  ring.mesh.visible = true; ring.age = 0; ring.mesh.position.set(player.position.x, Math.max(.02, state.y + .05), player.position.z); ring.mesh.scale.setScalar(.3);
  toast(awakened ? 'The sunken stones answer your pulse' : 'The pulse ripples into the silt');
}
window.addEventListener('keydown', e => {
  const key = keyAliases[e.key] || e.key.toLowerCase();
  if (['w','a','s','d',' ','arrowup','arrowdown','arrowleft','arrowright','e'].includes(key) || e.code === 'Space') e.preventDefault();
  if (e.code === 'Space' && !e.repeat) doJump();
  if (key === 'e' && !e.repeat) doPulse();
  keys.add(key);
});
window.addEventListener('keyup', e => keys.delete(keyAliases[e.key] || e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
for (const el of document.querySelectorAll('.touch')) {
  const key = el.dataset.key;
  el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture(e.pointerId); if (key) keys.add(key); if (el.dataset.action === 'jump') doJump(); if (el.dataset.action === 'pulse') doPulse(); });
  const release = () => { if (key) keys.delete(key); };
  el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release); el.addEventListener('lostpointercapture', release);
}

function overPlatform(x, z, p) { return Math.abs(x - p.x) < p.w / 2 + .12 && Math.abs(z - p.z) < p.d / 2 + .12; }
function finish() {
  state.running = false; state.ended = true;
  document.querySelector('#end-eyebrow').textContent = 'The kiln remembers';
  document.querySelector('#end-title').textContent = 'Embers restored';
  document.querySelector('#end-copy').textContent = 'The Sunken Kiln glows awake. You crossed the drowned causeway and kindled a new path beyond the basin.';
  document.querySelector('#ending').classList.remove('hidden');
}
function respawn() {
  player.position.copy(state.lastSafe); state.y = state.lastSafe.y; state.vy = 0; state.grounded = true;
  toast('The siltling bumps you back to solid ground');
}
function update(dt) {
  state.time += dt;
  const ax = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0);
  const az = (keys.has('s') ? 1 : 0) - (keys.has('w') ? 1 : 0);
  const len = Math.hypot(ax, az) || 1;
  state.moveX = ax / len; state.moveZ = az / len;
  const speed = state.grounded ? 5.1 : 4.6;
  if (state.running) {
    player.position.x += state.moveX * speed * dt;
    player.position.z += state.moveZ * speed * dt;
    player.position.x = THREE.MathUtils.clamp(player.position.x, -17, 17);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -20, 14);
    if (ax || az) { player.rotation.y = Math.atan2(state.moveX, state.moveZ) + Math.PI; state.walk += dt * 12; }
    const oldY = state.y;
    state.vy -= 17.5 * dt; state.y += state.vy * dt;
    let support = null;
    if (overPlatform(player.position.x, player.position.z, startIsland)) support = startIsland;
    if (overPlatform(player.position.x, player.position.z, finishIsland)) support = finishIsland;
    for (const s of stones) if (s.height > -1.4 && overPlatform(player.position.x, player.position.z, s)) support = { top: s.height + .56, stone: s };
    if (support && state.vy <= 0 && oldY >= support.top - .05 && state.y <= support.top + .12) {
      state.y = support.top; state.vy = 0; state.grounded = true;
      if (!support.stone) state.lastSafe.set(player.position.x, state.y, player.position.z);
    } else state.grounded = false;
    if (state.y < -7) {
      player.position.copy(state.lastSafe); state.y = state.lastSafe.y; state.vy = 0; state.grounded = true; toast('The basin returns you to the last safe island');
    }
    if (state.grounded && state.moveX === 0 && state.moveZ === 0) { /* soft idle */ }
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      if (e.got) continue;
      if (Math.hypot(player.position.x - e.group.position.x, player.position.z - e.group.position.z) < .9 && Math.abs(state.y + .8 - e.group.position.y) < 1.5) {
        e.got = true; e.group.visible = false;
        document.querySelector(`#g${i}`).classList.add('on');
        const count = embers.filter(v => v.got).length;
        document.querySelector('#count').textContent = `${count} / 3`;
        toast(count === 3 ? 'All embers found — the kiln gate is open!' : `Kiln ember ${count} of 3 gathered`);
        if (count === 3) { portal.material.color.set('#fff0ae'); portal.material.opacity = 1; gateLight.intensity = 4; }
      }
    }
    if (player.position.distanceTo(hazard.position) < .74 && Math.abs(state.y - hazard.position.y) < 1.1) respawn();
    if (player.position.distanceTo(new THREE.Vector3(-.5, 0, -11.15)) < 1.85 && embers.every(e => e.got)) finish();
  }
  for (const s of stones) {
    if (state.running) {
      if (s.timer > 0) s.timer -= dt;
      else s.active = false;
    }
    const target = s.active ? .02 : -2.6;
    s.height = THREE.MathUtils.damp(s.height, target, 8.5, dt);
    s.group.position.y = s.height;
    s.rune.material.emissiveIntensity = s.active ? .95 + Math.sin(state.time * 8 + s.phase) * .25 : .25;
    s.group.rotation.y = Math.sin(state.time * .4 + s.phase) * .012;
    s.ring.material.opacity = s.active ? .06 : .26;
  }
  hazard.position.set(3.45 + Math.sin(state.time * 1.3) * .66, stones[2].height + .96, -2.85 + Math.sin(state.time * 2.1) * .55);
  hazard.rotation.set(state.time * 1.9, state.time * 2.6, state.time * .7);
  for (const e of embers) if (!e.got) { e.group.position.y = 2.14 + Math.sin(state.time * 2.2 + e.phase) * .17; e.core.rotation.y += dt * 1.4; e.halo.rotation.z += dt * .7; }
  for (const r of pulseRings) if (r.mesh.visible) {
    r.age += dt; const t = r.age / .85; r.mesh.scale.setScalar(.3 + t * 5.3); r.mesh.material.opacity = Math.max(0, .66 * (1 - t)); if (t >= 1) r.mesh.visible = false;
  }
  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) document.querySelector('#toast').classList.remove('show'); }
  player.position.y = state.y;
  const hop = state.grounded && (state.moveX || state.moveZ) ? Math.abs(Math.sin(state.walk)) * .055 : 0;
  torso.position.y = .76 + hop; head.position.y = 1.35 + hop;
  shadowDisc.material.opacity = THREE.MathUtils.clamp(.34 - Math.max(0, state.y - .43) * .11, .08, .34);
  const target = new THREE.Vector3(player.position.x + 9.5, state.y + 11.5, player.position.z + 13.5);
  camera.position.lerp(target, 1 - Math.exp(-3.2 * dt));
  camera.lookAt(player.position.x, state.y + .1, player.position.z - 1.8);
  state.pulseCooldown = Math.max(0, state.pulseCooldown - dt);
  const meter = document.querySelector('#meter'); meter.style.width = `${(1 - state.pulseCooldown / .78) * 100}%`; meter.style.background = state.pulseCooldown <= 0 ? '#78e5cf' : '#ffcf72';
  gateRing.rotation.z = Math.sin(state.time * 1.2) * .055;
  portal.rotation.z = Math.sin(state.time * .8) * .08;
}

const clock = new THREE.Clock();
function frame() { requestAnimationFrame(frame); const dt = Math.min(clock.getDelta(), .04); update(dt); renderer.render(scene, camera); }
frame();
window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight); });
