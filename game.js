const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const statusText = document.querySelector("#game-status");
const restartButton = document.querySelector("#restart");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORLD_WIDTH = 2920;
const GRAVITY = 1800;
const MOVE_SPEED = 280;
const JUMP_SPEED = 650;

const platforms = [
  { x: 0, y: 460, width: 570, height: 100 },
  { x: 650, y: 460, width: 510, height: 100 },
  { x: 1240, y: 460, width: 570, height: 100 },
  { x: 1890, y: 460, width: 1030, height: 100 },
  { x: 230, y: 365, width: 150, height: 18 },
  { x: 475, y: 305, width: 145, height: 18 },
  { x: 770, y: 370, width: 170, height: 18 },
  { x: 1030, y: 305, width: 145, height: 18 },
  { x: 1330, y: 365, width: 160, height: 18 },
  { x: 1580, y: 300, width: 150, height: 18 },
  { x: 1980, y: 365, width: 170, height: 18 },
  { x: 2260, y: 305, width: 160, height: 18 },
];

const initialEnemies = [
  { x: 390, min: 365, max: 535, speed: 65 },
  { x: 870, min: 800, max: 1090, speed: 78 },
  { x: 1450, min: 1290, max: 1750, speed: 88 },
  { x: 2100, min: 1940, max: 2400, speed: 76 },
  { x: 2580, min: 2450, max: 2820, speed: 95 },
];

const keys = new Set();
const stars = Array.from({ length: 42 }, (_, index) => ({
  x: (index * 173 + 41) % WORLD_WIDTH,
  y: 28 + ((index * 67) % 190),
  size: 1 + (index % 3),
}));

let player;
let enemies;
let cameraX = 0;
let score = 0;
let gameState = "playing";
let lastTime = 0;

function resetGame() {
  player = {
    x: 54,
    y: 390,
    width: 30,
    height: 46,
    velocityX: 0,
    velocityY: 0,
    facing: 1,
    grounded: false,
    lives: 3,
    invulnerable: 0,
    attackCooldown: 0,
    attackTime: 0,
  };
  enemies = initialEnemies.map((enemy) => ({
    ...enemy,
    y: 430,
    width: 34,
    height: 30,
    direction: 1,
    alive: true,
  }));
  cameraX = 0;
  score = 0;
  gameState = "playing";
  statusText.textContent = "冒険が始まった！ゴールを目指そう。";
}

function isDown(...codes) {
  return codes.some((code) => keys.has(code));
}

function update(delta) {
  if (gameState !== "playing") return;

  const moveLeft = isDown("ArrowLeft", "KeyA");
  const moveRight = isDown("ArrowRight", "KeyD");
  player.velocityX = (Number(moveRight) - Number(moveLeft)) * MOVE_SPEED;
  if (player.velocityX !== 0) player.facing = Math.sign(player.velocityX);

  player.x += player.velocityX * delta;
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));

  if (player.invulnerable > 0) player.invulnerable -= delta;
  if (player.attackCooldown > 0) player.attackCooldown -= delta;
  if (player.attackTime > 0) player.attackTime -= delta;

  const previousBottom = player.y + player.height;
  player.velocityY += GRAVITY * delta;
  player.y += player.velocityY * delta;
  player.grounded = false;

  if (player.velocityY >= 0) {
    for (const platform of platforms) {
      const currentBottom = player.y + player.height;
      const overlapsX =
        player.x + player.width > platform.x &&
        player.x < platform.x + platform.width;
      if (
        overlapsX &&
        previousBottom <= platform.y &&
        currentBottom >= platform.y
      ) {
        player.y = platform.y - player.height;
        player.velocityY = 0;
        player.grounded = true;
        break;
      }
    }
  }

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemy.speed * enemy.direction * delta;
    if (enemy.x < enemy.min || enemy.x + enemy.width > enemy.max) {
      enemy.direction *= -1;
      enemy.x = Math.max(enemy.min, Math.min(enemy.max - enemy.width, enemy.x));
    }
  }

  if (player.attackTime > 0) {
    const attack = {
      x: player.facing > 0 ? player.x + player.width : player.x - 38,
      y: player.y + 7,
      width: 38,
      height: 34,
    };
    for (const enemy of enemies) {
      if (enemy.alive && overlaps(attack, enemy)) defeatEnemy(enemy);
    }
  }

  for (const enemy of enemies) {
    if (!enemy.alive || !overlaps(player, enemy)) continue;
    if (player.velocityY > 0 && previousBottom <= enemy.y + 8) {
      defeatEnemy(enemy);
      player.velocityY = -JUMP_SPEED * 0.55;
    } else if (player.invulnerable <= 0) {
      loseLife();
    }
  }

  if (player.y > HEIGHT + 80) loseLife();

  const targetCamera = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, player.x - WIDTH * 0.36));
  cameraX += (targetCamera - cameraX) * Math.min(1, delta * 7);

  if (player.x + player.width >= WORLD_WIDTH - 95) {
    gameState = "won";
    statusText.textContent = `ゴール！スコア ${score} 点。おめでとう！`;
  }
}

function overlaps(first, second) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function defeatEnemy(enemy) {
  enemy.alive = false;
  score += 100;
}

function loseLife() {
  if (player.invulnerable > 0 || gameState !== "playing") return;
  player.lives -= 1;
  if (player.lives <= 0) {
    gameState = "lost";
    statusText.textContent = `ゲームオーバー。スコア ${score} 点。もう一度挑戦しよう！`;
    return;
  }
  player.x = Math.max(54, player.x - 130);
  player.y = 390;
  player.velocityX = 0;
  player.velocityY = 0;
  player.invulnerable = 1.5;
  statusText.textContent = `ぶつかった！残り ${player.lives} 回。あきらめずに進もう。`;
}

function drawBackground() {
  const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#10142f");
  sky.addColorStop(0.58, "#29204d");
  sky.addColorStop(1, "#8a3c68");
  context.fillStyle = sky;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  for (const star of stars) {
    const x = star.x - cameraX * 0.18;
    const wrappedX = ((x % (WIDTH + 80)) + WIDTH + 80) % (WIDTH + 80) - 40;
    context.fillStyle = "rgba(215, 225, 255, 0.7)";
    context.shadowColor = "#9aaaff";
    context.shadowBlur = 8;
    context.beginPath();
    context.arc(wrappedX, star.y, star.size, 0, Math.PI * 2);
    context.fill();
  }
  context.shadowBlur = 0;

  const moonX = 755 - cameraX * 0.06;
  context.fillStyle = "rgba(255, 197, 230, 0.12)";
  context.beginPath();
  context.arc(moonX, 112, 61, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffd6e8";
  context.beginPath();
  context.arc(moonX, 112, 42, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#e9aaca";
  context.beginPath();
  context.arc(moonX - 11, 101, 5, 0, Math.PI * 2);
  context.arc(moonX + 13, 124, 8, 0, Math.PI * 2);
  context.fill();

  drawCityLayer("#20203f", 0.16, 34, 120);
  drawHillLayer("#34305d", 390, 0.2, 120);
  drawHillLayer("#263653", 430, 0.38, 180);
  drawCityLayer("#1d3047", 0.48, 26, 92);
}

function drawCityLayer(color, parallax, minHeight, spacing) {
  const offset = cameraX * parallax;
  const firstBuilding = Math.floor(offset / spacing) - 1;
  context.fillStyle = color;
  for (let index = firstBuilding; index < firstBuilding + Math.ceil(WIDTH / spacing) + 3; index += 1) {
    const worldX = index * spacing;
    const buildingWidth = spacing * (0.48 + ((Math.abs(index * 7) % 4) + 1) * 0.08);
    const buildingHeight = minHeight + ((Math.abs(index * 37) % 7) + 1) * 13;
    const x = worldX - offset;
    const y = 440 - buildingHeight;
    context.fillRect(x, y, buildingWidth, buildingHeight);
    context.fillStyle = "rgba(143, 179, 232, 0.18)";
    for (let windowY = y + 12; windowY < 430; windowY += 18) {
      context.fillRect(x + 8, windowY, 3, 5);
      if (buildingWidth > 54) context.fillRect(x + 19, windowY, 3, 5);
    }
    context.fillStyle = color;
  }
}

function drawHillLayer(color, baseY, parallax, spacing) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, HEIGHT);
  context.lineTo(0, baseY);
  for (let x = -spacing; x <= WIDTH + spacing; x += spacing) {
    const worldX = x + cameraX * parallax;
    const peakY = baseY - 28 - Math.abs(Math.sin(worldX * 0.004)) * 55;
    context.quadraticCurveTo(x + spacing / 2, peakY, x + spacing, baseY);
  }
  context.lineTo(WIDTH, HEIGHT);
  context.closePath();
  context.fill();
}

function drawPlatforms() {
  for (const platform of platforms) {
    const x = platform.x - cameraX;
    if (x + platform.width < -5 || x > WIDTH + 5) continue;

    const ground = context.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
    ground.addColorStop(0, "#293e59");
    ground.addColorStop(1, "#18243a");
    context.fillStyle = ground;
    context.fillRect(x, platform.y, platform.width, platform.height);
    context.fillStyle = "#55f0d0";
    context.shadowColor = "#39e3c2";
    context.shadowBlur = 10;
    context.fillRect(x, platform.y, platform.width, 3);
    context.shadowBlur = 0;
    context.fillStyle = "rgba(136, 178, 219, 0.18)";
    context.fillRect(x, platform.y + 3, platform.width, 2);
    for (let detailX = x + 15; detailX < x + platform.width - 10; detailX += 42) {
      context.fillStyle = "rgba(157, 189, 226, 0.19)";
      context.fillRect(detailX, platform.y + 18, 16, 2);
      context.fillRect(detailX + 5, platform.y + 28, 7, 2);
    }
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const x = enemy.x - cameraX;
    if (x + enemy.width < -10 || x > WIDTH + 10) continue;
    context.save();
    context.shadowColor = "#ff4d9b";
    context.shadowBlur = 13;
    const shell = context.createLinearGradient(x, enemy.y, x, enemy.y + enemy.height);
    shell.addColorStop(0, "#ff719e");
    shell.addColorStop(1, "#a72e73");
    context.fillStyle = shell;
    context.beginPath();
    context.roundRect(x, enemy.y, enemy.width, enemy.height, [12, 12, 6, 6]);
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = "#fff1fa";
    context.fillRect(x + (enemy.direction > 0 ? 20 : 8), enemy.y + 8, 7, 8);
    context.fillStyle = "#451d52";
    context.fillRect(x + (enemy.direction > 0 ? 23 : 10), enemy.y + 10, 3, 4);
    context.fillStyle = "#ffb2d2";
    context.fillRect(x + 6, enemy.y + 25, 8, 5);
    context.fillRect(x + 22, enemy.y + 25, 8, 5);
    context.restore();
  }
}

function drawPlayer() {
  const x = player.x - cameraX;
  if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) {
    return;
  }

  context.save();
  context.globalAlpha = player.invulnerable > 0 ? 0.78 : 1;
  context.fillStyle = "rgba(7, 12, 28, 0.42)";
  context.beginPath();
  context.ellipse(x + 15, player.y + 47, 17, 4, 0, 0, Math.PI * 2);
  context.fill();

  const direction = player.facing;
  const cape = context.createLinearGradient(x, player.y + 15, x, player.y + 43);
  cape.addColorStop(0, "#9c4dff");
  cape.addColorStop(1, "#452d9f");
  context.fillStyle = cape;
  context.beginPath();
  context.moveTo(x + 8, player.y + 16);
  context.lineTo(x + 15 - direction * 20, player.y + 39);
  context.lineTo(x + 24, player.y + 33);
  context.lineTo(x + 22, player.y + 17);
  context.closePath();
  context.fill();

  context.shadowColor = "#6d68ff";
  context.shadowBlur = 12;
  const suit = context.createLinearGradient(x + 3, player.y + 18, x + 27, player.y + 42);
  suit.addColorStop(0, "#384e86");
  suit.addColorStop(1, "#182440");
  context.fillStyle = suit;
  context.beginPath();
  context.roundRect(x + 4, player.y + 16, 22, 28, 7);
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = "#55f0d0";
  context.fillRect(x + 5, player.y + 18, 20, 3);
  context.fillRect(x + (direction > 0 ? 19 : 7), player.y + 27, 5, 3);

  context.fillStyle = "#e7a8ff";
  context.beginPath();
  context.roundRect(x + 6, player.y + 2, 19, 20, 7);
  context.fill();
  context.fillStyle = "#b875fa";
  context.beginPath();
  context.moveTo(x + 4, player.y + 10);
  context.lineTo(x + 7, player.y - 2);
  context.lineTo(x + 16, player.y + 5);
  context.lineTo(x + 24, player.y - 1);
  context.lineTo(x + 28, player.y + 11);
  context.closePath();
  context.fill();
  context.fillStyle = "#fff2fb";
  context.fillRect(x + (direction > 0 ? 17 : 8), player.y + 10, 6, 4);
  context.fillStyle = "#55f0d0";
  context.fillRect(x + (direction > 0 ? 20 : 9), player.y + 11, 3, 2);

  context.fillStyle = "#1a2441";
  context.fillRect(x + 3, player.y + 40, 10, 6);
  context.fillRect(x + 17, player.y + 40, 10, 6);

  if (player.attackTime > 0) {
    context.shadowColor = "#55f0d0";
    context.shadowBlur = 17;
    context.strokeStyle = "#a7fff0";
    context.lineWidth = 4;
    context.beginPath();
    const handX = x + (player.facing > 0 ? player.width : 0);
    context.arc(handX, player.y + 23, 30, -0.9, 0.9, player.facing < 0);
    context.stroke();
  }
  context.restore();
}

function drawHud() {
  context.fillStyle = "rgba(20, 32, 55, 0.72)";
  context.beginPath();
  context.roundRect(18, 17, 162, 40, 9);
  context.fill();

  context.font = "700 14px Manrope, sans-serif";
  context.textBaseline = "middle";
  context.fillStyle = "#ffffff";
  context.fillText(`SCORE  ${String(score).padStart(4, "0")}`, 31, 37);
  context.fillStyle = "rgba(20, 32, 55, 0.72)";
  context.beginPath();
  context.roundRect(785, 17, 155, 40, 9);
  context.fill();
  context.fillStyle = "#fff2a8";
  context.fillText("♥".repeat(Math.max(0, player.lives)), 802, 37);

  const barWidth = 126;
  const progress = Math.min(1, player.x / (WORLD_WIDTH - player.width));
  context.fillStyle = "rgba(20, 32, 55, 0.45)";
  context.fillRect(WIDTH / 2 - barWidth / 2, 27, barWidth, 5);
  context.fillStyle = "#fff2a8";
  context.fillRect(WIDTH / 2 - barWidth / 2, 27, barWidth * progress, 5);
}

function drawEndOverlay() {
  if (gameState === "playing") return;
  context.fillStyle = "rgba(18, 27, 47, 0.64)";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.textAlign = "center";
  context.fillStyle = "#ffffff";
  context.font = "800 42px Manrope, sans-serif";
  context.fillText(gameState === "won" ? "STAGE CLEAR!" : "GAME OVER", WIDTH / 2, HEIGHT / 2 - 14);
  context.fillStyle = "#e1e8f6";
  context.font = "500 16px 'Noto Sans JP', sans-serif";
  context.fillText("下のボタンからもう一度遊べます", WIDTH / 2, HEIGHT / 2 + 25);
  context.textAlign = "start";
}

function render() {
  drawBackground();
  drawPlatforms();
  drawEnemies();
  drawPlayer();
  drawHud();
  drawEndOverlay();
}

function frame(timestamp) {
  const delta = Math.min((timestamp - lastTime) / 1000 || 0, 0.033);
  lastTime = timestamp;
  update(delta);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)
  ) {
    event.preventDefault();
  }
  keys.add(event.code);

  if (
    (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") &&
    player.grounded &&
    gameState === "playing"
  ) {
    player.velocityY = -JUMP_SPEED;
    player.grounded = false;
  }

  if (
    ["KeyJ", "KeyX"].includes(event.code) &&
    player.attackCooldown <= 0 &&
    gameState === "playing"
  ) {
    player.attackCooldown = 0.34;
    player.attackTime = 0.16;
  }
});

window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", () => keys.clear());
restartButton.addEventListener("click", resetGame);

resetGame();
requestAnimationFrame(frame);
