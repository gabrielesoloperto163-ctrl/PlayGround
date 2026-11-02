const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const waveEl = document.getElementById('wave');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('startButton');
const touchControls = document.getElementById('touchControls');

const keys = new Set();
let lastTime = 0;
let gameRunning = false;
let gameOver = false;
let score = 0;
let wave = 1;
let enemySpawnTimer = 0;
let bossTimer = 0;
let bossActive = false;

const state = {
  player: null,
  bullets: [],
  enemyBullets: [],
  enemies: [],
  particles: [],
  stars: [],
};

const world = {
  width: canvas.width,
  height: canvas.height,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createStars() {
  state.stars = Array.from({ length: 130 }, () => ({
    x: Math.random() * world.width,
    y: Math.random() * world.height,
    r: Math.random() * 2.5 + 0.5,
    speed: Math.random() * 80 + 30,
    alpha: Math.random() * 0.8 + 0.2,
  }));
}

function createPlayer() {
  return {
    x: world.width / 2,
    y: world.height - 70,
    width: 28,
    height: 36,
    speed: 330,
    cooldown: 0,
    invulnerable: 0,
    lives: 5,
  };
}

function resetGame() {
  score = 0;
  wave = 1;
  enemySpawnTimer = 0;
  bossTimer = 0;
  bossActive = false;
  gameOver = false;
  state.player = createPlayer();
  state.bullets = [];
  state.enemyBullets = [];
  state.enemies = [];
  state.particles = [];
  updateHud();
}

function updateHud() {
  scoreEl.textContent = String(score);
  livesEl.textContent = String(state.player ? state.player.lives : 0);
  waveEl.textContent = String(wave);
}

function spawnEnemy() {
  const size = 18 + Math.random() * 12;
  const x = randomBetween(40, world.width - 40);
  const y = -20;
  state.enemies.push({
    x,
    y,
    size,
    speedX: randomBetween(-70, 70),
    speedY: randomBetween(80, 160),
    hp: 1 + Math.floor(wave / 3),
    cooldown: randomBetween(0.5, 1.8),
    drift: randomBetween(-1, 1),
  });
}

function spawnBoss() {
  bossActive = true;
  state.enemies.push({
    x: world.width / 2,
    y: -60,
    size: 48,
    speedX: 120,
    speedY: 80,
    hp: 16 + wave * 4,
    cooldown: 1,
    drift: 1,
    boss: true,
  });
}

function shootPlayerBullet() {
  const p = state.player;
  if (!p || p.cooldown > 0) return;
  p.cooldown = 0.18;
  state.bullets.push({
    x: p.x,
    y: p.y - p.height / 2,
    radius: 4,
    speed: 480,
    color: '#8af8ff',
  });
}

function enemyShoot(enemy) {
  state.enemyBullets.push({
    x: enemy.x,
    y: enemy.y + enemy.size,
    radius: enemy.boss ? 7 : 4,
    speed: enemy.boss ? 260 : 200,
    color: enemy.boss ? '#ff8ea6' : '#ffb13b',
    dx: (state.player.x - enemy.x) * 0.8,
    dy: (state.player.y - enemy.y) * 0.8,
  });
}

function createExplosion(x, y, color, count = 18) {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x,
      y,
      vx: randomBetween(-130, 130),
      vy: randomBetween(-130, 130),
      life: randomBetween(0.35, 0.9),
      radius: randomBetween(2, 5),
      color,
    });
  }
}

function handleInput(dt) {
  const p = state.player;
  if (!p) return;

  let dx = 0;
  let dy = 0;

  if (keys.has('ArrowLeft') || keys.has('a')) dx -= 1;
  if (keys.has('ArrowRight') || keys.has('d')) dx += 1;
  if (keys.has('ArrowUp') || keys.has('w')) dy -= 1;
  if (keys.has('ArrowDown') || keys.has('s')) dy += 1;

  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    p.x += (dx / len) * p.speed * dt;
    p.y += (dy / len) * p.speed * dt;
  }

  p.x = clamp(p.x, 30, world.width - 30);
  p.y = clamp(p.y, 40, world.height - 30);

  p.cooldown = Math.max(0, p.cooldown - dt);
  p.invulnerable = Math.max(0, p.invulnerable - dt);

  if (keys.has(' ') && !gameOver) {
    shootPlayerBullet();
  }
}

function updateStars(dt) {
  for (const star of state.stars) {
    star.y += star.speed * dt;
    if (star.y > world.height + 4) {
      star.y = -4;
      star.x = Math.random() * world.width;
    }
  }
}

function updateBullets(dt) {
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const bullet = state.bullets[i];
    bullet.y -= bullet.speed * dt;
    if (bullet.y < -20) state.bullets.splice(i, 1);
  }

  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const bullet = state.enemyBullets[i];
    const vx = bullet.dx ? bullet.dx : 0;
    const vy = bullet.dy ? bullet.dy : bullet.speed;
    const len = Math.hypot(vx, vy) || 1;
    bullet.x += (vx / len) * bullet.speed * dt;
    bullet.y += (vy / len) * bullet.speed * dt;
    if (bullet.y > world.height + 20 || bullet.x < -20 || bullet.x > world.width + 20) {
      state.enemyBullets.splice(i, 1);
    }
  }
}

function updateEnemies(dt) {
  const maxEnemies = bossActive ? 1 : 6 + wave * 2;
  enemySpawnTimer -= dt;
  if (!bossActive && enemySpawnTimer <= 0 && state.enemies.length < maxEnemies) {
    spawnEnemy();
    enemySpawnTimer = Math.max(0.45, 1.2 - wave * 0.08 + Math.random() * 0.6);
  }

  if (!bossActive && wave > 1 && Math.random() < 0.003 + wave * 0.0008) {
    spawnBoss();
  }

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    if (enemy.boss) {
      enemy.x += enemy.speedX * dt * enemy.drift;
      if (enemy.x < 70 || enemy.x > world.width - 70) {
        enemy.speedX *= -1;
        enemy.x = clamp(enemy.x, 70, world.width - 70);
      }
      enemy.y = Math.min(enemy.y + enemy.speedY * dt, 110);
      enemy.cooldown -= dt;
      if (enemy.cooldown <= 0) {
        const burstCount = enemy.hp > 12 ? 3 : 2;
        for (let b = 0; b < burstCount; b++) {
          const spread = (b - (burstCount - 1) / 2) * 0.42;
          state.enemyBullets.push({
            x: enemy.x + Math.cos(spread) * 18,
            y: enemy.y + enemy.size,
            radius: 6,
            speed: 230,
            color: '#ff5c7a',
            dx: Math.sin(spread) * 120,
            dy: 220,
          });
        }
        enemy.cooldown = Math.max(0.5, 1.3 - wave * 0.04);
      }
    } else {
      enemy.x += enemy.speedX * dt;
      enemy.y += enemy.speedY * dt;
      enemy.x += Math.sin((enemy.y + performance.now() * 0.01) * 0.04) * enemy.drift * 20 * dt;
      enemy.cooldown -= dt;
      if (enemy.x < 22 || enemy.x > world.width - 22) {
        enemy.speedX *= -1;
      }
      if (enemy.cooldown <= 0) {
        enemyShoot(enemy);
        enemy.cooldown = randomBetween(0.9, 1.8);
      }
    }

    if (enemy.y > world.height + 40) {
      if (!enemy.boss) {
        state.player.lives -= 1;
        createExplosion(enemy.x, enemy.y, '#ffc857', 18);
        state.enemies.splice(i, 1);
        if (state.player.lives <= 0) endGame();
        updateHud();
        continue;
      }
    }

    if (enemy.hp <= 0) {
      const bonus = enemy.boss ? 350 : 100;
      score += bonus;
      createExplosion(enemy.x, enemy.y, enemy.boss ? '#ff66a3' : '#88ffd0', enemy.boss ? 40 : 20);
      state.enemies.splice(i, 1);
      if (enemy.boss) {
        bossActive = false;
        bossTimer = 0;
      }
      wave = Math.max(1, 1 + Math.floor(score / 1200));
      updateHud();
    }
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
}

function checkCollisions() {
  const p = state.player;
  if (!p) return;

  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const bullet = state.bullets[i];
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const enemy = state.enemies[j];
      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      const hitRadius = bullet.radius + enemy.size * 0.8;
      if (dist < hitRadius) {
        state.bullets.splice(i, 1);
        enemy.hp -= 1;
        createExplosion(bullet.x, bullet.y, '#7fe6ff', 8);
        break;
      }
    }
  }

  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const bullet = state.enemyBullets[i];
    const dx = bullet.x - p.x;
    const dy = bullet.y - p.y;
    if (Math.hypot(dx, dy) < bullet.radius + 18) {
      state.enemyBullets.splice(i, 1);
      if (p.invulnerable <= 0) {
        p.invulnerable = 1.2;
        p.lives -= 1;
        createExplosion(p.x, p.y, '#ff7e7e', 22);
        updateHud();
        if (p.lives <= 0) endGame();
      }
    }
  }

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    if (Math.hypot(dx, dy) < enemy.size + 16) {
      if (p.invulnerable <= 0) {
        p.invulnerable = 1.2;
        p.lives -= 1;
        createExplosion(p.x, p.y, '#ff7e7e', 26);
        state.enemies.splice(i, 1);
        updateHud();
        if (p.lives <= 0) endGame();
      }
    }
  }
}

function endGame() {
  gameRunning = false;
  gameOver = true;
  overlay.classList.add('visible');
  overlay.querySelector('h1').textContent = 'Juego terminado';
  overlay.querySelector('p').textContent = `Puntuación final: ${score}. Intenta superarte.`;
  overlay.querySelector('ul').innerHTML = `
    <li>Presiona <strong>Enter</strong> para jugar otra vez.</li>
    <li>Tu máximo nivel fue <strong>${wave}</strong>.</li>
  `;
  startButton.textContent = 'Jugar otra vez';
}

function startGame() {
  resetGame();
  gameRunning = true;
  gameOver = false;
  overlay.classList.remove('visible');
  startButton.textContent = 'Jugar';
  overlay.querySelector('h1').textContent = 'Starfall Defender';
  overlay.querySelector('p').textContent = 'Protege la base y derriba los escuadrones alienígenas.';
  overlay.querySelector('ul').innerHTML = `
    <li>Mueve la nave: <strong>WASD</strong> o <strong>Flechas</strong></li>
    <li>Dispara: <strong>Espacio</strong></li>
    <li>Reinicia: <strong>Enter</strong></li>
  `;
}

function renderBackground() {
  ctx.fillStyle = '#050816';
  ctx.fillRect(0, 0, world.width, world.height);

  for (const star of state.stars) {
    ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderPlayer() {
  const p = state.player;
  if (!p) return;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.strokeStyle = p.invulnerable > 0 ? '#fff2a8' : '#7fe7ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(14, 18);
  ctx.lineTo(0, 12);
  ctx.lineTo(-14, 18);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = '#6af7d7';
  ctx.fillRect(-3, 15, 6, 10);
  ctx.restore();
}

function renderEnemy(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.strokeStyle = enemy.boss ? '#ff7ca6' : '#ffca6b';
  ctx.fillStyle = enemy.boss ? 'rgba(255,130,176,0.26)' : 'rgba(255,214,110,0.22)';
  ctx.lineWidth = 2;
  if (enemy.boss) {
    ctx.beginPath();
    ctx.moveTo(-38, 0);
    ctx.lineTo(-18, -24);
    ctx.lineTo(18, -24);
    ctx.lineTo(38, 0);
    ctx.lineTo(20, 28);
    ctx.lineTo(-20, 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd2e0';
    ctx.fillRect(-10, -8, 20, 10);
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -enemy.size);
    ctx.lineTo(enemy.size, 0);
    ctx.lineTo(0, enemy.size);
    ctx.lineTo(-enemy.size, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function renderBullets() {
  for (const bullet of state.bullets) {
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const bullet of state.enemyBullets) {
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderParticles() {
  for (const particle of state.particles) {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = Math.max(0, particle.life * 1.2);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function update(dt) {
  if (!gameRunning) return;

  updateStars(dt);
  handleInput(dt);
  updateBullets(dt);
  updateEnemies(dt);
  updateParticles(dt);
  checkCollisions();

  if (score > 0 && score % 1200 === 0 && wave < 10) {
    wave = 1 + Math.floor(score / 1200);
    updateHud();
  }
}

function draw() {
  renderBackground();
  renderBullets();
  for (const enemy of state.enemies) renderEnemy(enemy);
  renderPlayer();
  renderParticles();
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.033);
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.add(key);

  if (event.code === 'Space') {
    event.preventDefault();
    if (gameRunning) shootPlayerBullet();
  }

  if (event.key === 'Enter' && !gameRunning) {
    startGame();
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

startButton.addEventListener('click', startGame);

for (const button of touchControls.querySelectorAll('button')) {
  const control = button.dataset.control;
  button.addEventListener('pointerdown', () => {
    if (control === 'left') keys.add('a');
    if (control === 'right') keys.add('d');
    if (control === 'shoot') {
      if (gameRunning) shootPlayerBullet();
    }
  });
  button.addEventListener('pointerup', () => {
    if (control === 'left') keys.delete('a');
    if (control === 'right') keys.delete('d');
  });
  button.addEventListener('pointerleave', () => {
    if (control === 'left') keys.delete('a');
    if (control === 'right') keys.delete('d');
  });
}

createStars();
resetGame();
startButton.textContent = 'Jugar';
requestAnimationFrame(gameLoop);
