import { Enemy } from "./Enemy.js";
import { DamageText } from "./DamageText.js";
import { GoldOrb } from "./GoldOrb.js";
import { LevelUpManager } from "./LevelUpManager.js";
import { PartManager } from "./PartManager.js";
import { Player } from "./Player.js";
import { RelicManager } from "./RelicManager.js";
import { UIManager } from "./UIManagerDetails.js";
import { WaveManager } from "./WaveManager.js?v=mobile-pages";
import { Weapon } from "./Weapon.js";
import { XPOrb } from "./XPOrb.js";
import { circleCollision, randomBetween } from "./utils.js";

export const GameState = {
  START: "start",
  WAVE_SELECT: "waveSelect",
  PLAYING: "playing",
  LEVEL_UP: "levelUp",
  REWARD_SELECT: "rewardSelect",
  REWARD_TYPE_SELECT: "rewardTypeSelect",
  PART_EQUIP_SELECT: "partEquipSelect",
  GAME_OVER: "gameOver",
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = 0;
    this.height = 0;
    this.state = GameState.START;
    this.lastTime = 0;
    this.camera = { x: 0, y: 0 };
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      touchX: 0,
      touchY: 0,
    };

    this.ui = new UIManager(this);
    this.resize();
    this.resetRun();
    this.bindEvents();
    this.bindTouchControls();
  }

  resetRun() {
    this.player = new Player(this);
    this.enemies = [];
    this.projectiles = [];
    this.damageTexts = [];
    this.xpOrbs = [];
    this.goldOrbs = [];
    this.waveManager = new WaveManager();
    this.levelUpManager = new LevelUpManager(this);
    this.relicManager = new RelicManager(this);
    this.partManager = new PartManager(this);
    this.pendingLevelUps = 0;
    this.waveRewardPending = false;
    this.addWeapon("pistol");
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (event) => this.setKey(event.code, true));
    window.addEventListener("keyup", (event) => this.setKey(event.code, false));
  }

  bindTouchControls() {
    const stick = document.querySelector("#touchStick");
    const knob = document.querySelector("#touchKnob");
    if (!stick || !knob) {
      return;
    }

    const maxDistance = 45;
    const resetStick = () => {
      const pointerId = this.activeTouchPointerId;
      this.input.touchX = 0;
      this.input.touchY = 0;
      knob.style.transform = "translate(-50%, -50%)";
      this.activeTouchPointerId = null;
      if (pointerId !== null && pointerId !== undefined && stick.hasPointerCapture?.(pointerId)) {
        stick.releasePointerCapture(pointerId);
      }
    };

    const updateStick = (event) => {
      if (this.activeTouchPointerId !== event.pointerId) {
        return;
      }

      const rect = stick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rawX = event.clientX - centerX;
      const rawY = event.clientY - centerY;
      const distance = Math.hypot(rawX, rawY);
      const scale = distance > maxDistance ? maxDistance / distance : 1;
      const x = rawX * scale;
      const y = rawY * scale;

      this.input.touchX = x / maxDistance;
      this.input.touchY = y / maxDistance;
      knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      event.preventDefault();
    };

    stick.addEventListener("pointerdown", (event) => {
      if (this.activeTouchPointerId !== null && this.activeTouchPointerId !== undefined) {
        return;
      }

      document.body.classList.add("touch-active");
      this.activeTouchPointerId = event.pointerId;
      stick.setPointerCapture?.(event.pointerId);
      updateStick(event);
    });
    stick.addEventListener("pointermove", updateStick);
    stick.addEventListener("pointerup", resetStick);
    stick.addEventListener("pointercancel", resetStick);
    stick.addEventListener("lostpointercapture", resetStick);
  }

  setKey(code, isDown) {
    if (["KeyW", "ArrowUp"].includes(code)) this.input.up = isDown;
    if (["KeyS", "ArrowDown"].includes(code)) this.input.down = isDown;
    if (["KeyA", "ArrowLeft"].includes(code)) this.input.left = isDown;
    if (["KeyD", "ArrowRight"].includes(code)) this.input.right = isDown;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (this.player) {
      this.updateCamera();
    }
  }

  start() {
    this.ui.showStart(() => this.showWaveSelect());
    requestAnimationFrame((time) => this.loop(time));
  }

  restart() {
    this.resetRun();
    this.showWaveSelect();
  }

  showWaveSelect() {
    this.state = GameState.WAVE_SELECT;
    this.prepareWaveTransitionEntities();
    this.pruneDistantPickups();
    this.ui.showWaveChoices(this.waveManager.createWaveChoices(), (wave) => this.startWave(wave));
    this.ui.updateHud();
  }

  startWave(wave) {
    this.state = GameState.PLAYING;
    this.clearCombatEntities({ keepPickups: true, keepGhosts: true });
    this.pruneDistantPickups();
    this.waveManager.startWave(wave);
    this.ui.hideOverlay();
  }

  clearCombatEntities({ keepPickups = false, keepGhosts = false } = {}) {
    this.enemies = keepGhosts ? this.enemies.filter((enemy) => enemy.isGhost) : [];
    this.projectiles = [];
    this.damageTexts = [];
    if (!keepPickups) {
      this.xpOrbs = [];
      this.goldOrbs = [];
    }
  }

  prepareWaveTransitionEntities() {
    const maxGhosts = 18;
    const keepRadius = 760;
    const ghosts = [];

    for (const enemy of this.enemies) {
      const distance = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      const shouldKeep =
        distance <= keepRadius && ghosts.length < maxGhosts && Math.random() < Math.max(0.22, 0.78 - ghosts.length * 0.03);

      if (shouldKeep) {
        enemy.becomeGhost();
        ghosts.push(enemy);
      }
    }

    this.enemies = ghosts;
    this.projectiles = [];
    this.damageTexts = [];
  }

  pruneDistantPickups(maxDistance = 1400) {
    this.xpOrbs = this.xpOrbs.filter(
      (orb) => Math.hypot(orb.x - this.player.x, orb.y - this.player.y) <= maxDistance,
    );
    this.goldOrbs = this.goldOrbs.filter(
      (orb) => Math.hypot(orb.x - this.player.x, orb.y - this.player.y) <= maxDistance,
    );
  }

  addWeapon(id) {
    if (this.player.getWeapon(id)) {
      return;
    }
    this.player.addWeapon(new Weapon(id));
  }

  addDamageText(x, y, value, color) {
    this.damageTexts.push(new DamageText(x, y, value, color));
  }

  requestLevelUp() {
    this.pendingLevelUps += 1;
  }

  openLevelUp() {
    this.state = GameState.LEVEL_UP;
    const choices = this.levelUpManager.createChoices();

    if (choices.length === 0) {
      this.pendingLevelUps = 0;
      this.state = GameState.PLAYING;
      this.ui.hideOverlay();
      return;
    }

    this.ui.showLevelUpChoices(choices, (choice) => {
      this.levelUpManager.applyChoice(choice);
      this.pendingLevelUps -= 1;
      if (this.pendingLevelUps > 0) {
        this.openLevelUp();
      } else if (this.waveManager.isComplete()) {
        this.openRewardSelect();
      } else {
        this.state = GameState.PLAYING;
        this.ui.hideOverlay();
      }
    });
  }

  openRewardSelect() {
    this.state = GameState.REWARD_SELECT;
    const reward = this.waveManager.currentWave?.reward ?? { type: "relic", choices: 3 };
    this.clearCombatEntities({ keepPickups: true });
    this.pruneDistantPickups();

    if (reward.type === "part") {
      const partChoices = this.partManager.createChoices(reward.choices ?? 3);
      if (partChoices.length > 0) {
        this.openPartRewardSelect(partChoices);
        return;
      }

      const fallbackRelics = this.relicManager.createChoices(reward.choices ?? 3);
      if (fallbackRelics.length > 0) {
        this.openRelicRewardSelect(fallbackRelics);
        return;
      }

      this.showWaveSelect();
      return;
    }

    const relicChoices = this.relicManager.createChoices(reward.choices ?? 3);
    if (relicChoices.length > 0) {
      this.openRelicRewardSelect(relicChoices);
      return;
    }

    const fallbackParts = this.partManager.createChoices(reward.choices ?? 3);
    if (fallbackParts.length > 0) {
      this.openPartRewardSelect(fallbackParts);
      return;
      }

    this.showWaveSelect();
  }

  openRelicRewardSelect(choices) {
    this.state = GameState.REWARD_SELECT;
    this.ui.showRewardChoices(
      choices.map((choice) => ({ rewardType: "relic", item: choice })),
      (reward) => {
        this.relicManager.applyRelic(reward.item);
        this.showWaveSelect();
      },
    );
  }

  openPartRewardSelect(choices) {
    this.state = GameState.REWARD_SELECT;
    this.ui.showRewardChoices(
      choices.map((choice) => ({ rewardType: "part", item: this.partManager.decoratePart(choice) })),
      (reward) => this.openPartEquipSelect(reward.item),
    );
  }

  openPartEquipSelect(part) {
    this.state = GameState.PART_EQUIP_SELECT;
    const weapons = this.partManager.getCompatibleWeapons(part);

    if (weapons.length === 0) {
      this.openPartExchangeSelect(part);
      return;
    }

    this.ui.showPartEquipChoices(part, weapons, (weapon) => {
      this.partManager.equipPart(part, weapon);
      this.showWaveSelect();
    });
  }

  openPartExchangeSelect(part) {
    this.state = GameState.PART_EQUIP_SELECT;
    const options = this.partManager.getExchangeOptions(part);

    if (options.length === 0) {
      this.ui.showNoPartTarget(part, () => this.showWaveSelect());
      return;
    }

    this.ui.showPartExchangeChoices(part, options, (option) => {
      this.partManager.replacePart(part, option.weapon, option.index);
      this.showWaveSelect();
    });
  }

  setGameOver() {
    if (this.state === GameState.GAME_OVER) {
      return;
    }

    this.state = GameState.GAME_OVER;
    this.ui.showGameOver(() => this.restart());
  }

  spawnEnemy(type, modifier) {
    const margin = 80;
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    const left = this.camera.x;
    const right = this.camera.x + this.width;
    const top = this.camera.y;
    const bottom = this.camera.y + this.height;

    if (side === 0) {
      x = randomBetween(left, right);
      y = top - margin;
    } else if (side === 1) {
      x = right + margin;
      y = randomBetween(top, bottom);
    } else if (side === 2) {
      x = randomBetween(left, right);
      y = bottom + margin;
    } else {
      x = left - margin;
      y = randomBetween(top, bottom);
    }

    this.enemies.push(new Enemy(type, x, y, modifier));
  }

  getNearestEnemy(x, y) {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const enemy of this.enemies) {
      if (enemy.isDead || enemy.isGhost) {
        continue;
      }

      const dist = Math.hypot(enemy.x - x, enemy.y - y);
      if (dist < nearestDistance) {
        nearest = enemy;
        nearestDistance = dist;
      }
    }

    return nearest;
  }

  getActiveEnemyCount() {
    return this.enemies.filter((enemy) => !enemy.isGhost).length;
  }

  loop(timestamp) {
    const deltaTime = Math.min(0.05, (timestamp - this.lastTime) / 1000 || 0);
    this.lastTime = timestamp;

    if (this.state === GameState.PLAYING) {
      this.update(deltaTime);
    }

    this.recoverHiddenPausedOverlay();
    this.updateCamera();
    this.render();
    this.ui.updateHud();
    requestAnimationFrame((time) => this.loop(time));
  }

  update(deltaTime) {
    this.player.update(deltaTime, this.input, this);
    this.waveManager.update(deltaTime, this);

    for (const enemy of this.enemies) enemy.update(deltaTime, this);
    for (const projectile of this.projectiles) projectile.update(deltaTime, this);
    for (const orb of this.xpOrbs) orb.update(deltaTime, this);
    for (const orb of this.goldOrbs) orb.update(deltaTime, this);
    for (const text of this.damageTexts) text.update(deltaTime);

    this.collectDeaths();

    if (this.state !== GameState.PLAYING) {
      return;
    }

    if (this.pendingLevelUps > 0) {
      this.openLevelUp();
      return;
    }

    if (this.waveManager.isComplete()) {
      this.openRewardSelect();
    }
  }

  collectDeaths() {
    for (const enemy of this.enemies) {
      if (!enemy.isDead || enemy.rewardClaimed) {
        continue;
      }

      enemy.rewardClaimed = true;
      if (!enemy.isGhost) {
        this.waveManager.registerKill();
        this.xpOrbs.push(new XPOrb(enemy.x, enemy.y, enemy.rewardExp));

        if (Math.random() <= enemy.goldDropChance) {
          this.goldOrbs.push(new GoldOrb(enemy.x + randomBetween(-8, 8), enemy.y + randomBetween(-8, 8), enemy.rewardGold));
        }
      }
    }

    this.enemies = this.enemies.filter((enemy) => !enemy.isDead);
    this.projectiles = this.projectiles.filter((projectile) => !projectile.isDead);
    this.xpOrbs = this.xpOrbs.filter((orb) => !orb.isDead);
    this.goldOrbs = this.goldOrbs.filter((orb) => !orb.isDead);
    this.damageTexts = this.damageTexts.filter((text) => !text.isDead);

    for (const enemy of this.enemies) {
      const touchingHitbox =
        Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) <=
        enemy.radius + this.player.hitRadius;
      if (touchingHitbox && this.player.hp <= 0) {
        this.setGameOver();
      }
    }
  }

  render() {
    const renderCamera = this.getRenderCamera();
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.renderArena(renderCamera);

    this.ctx.save();
    this.ctx.translate(-renderCamera.x, -renderCamera.y);
    for (const orb of this.xpOrbs) orb.render(this.ctx);
    for (const orb of this.goldOrbs) orb.render(this.ctx);
    for (const projectile of this.projectiles) projectile.render(this.ctx);
    for (const enemy of this.enemies) enemy.render(this.ctx);

    this.player.render(this.ctx);
    for (const text of this.damageTexts) text.render(this.ctx);
    this.ctx.restore();
  }

  renderArena(renderCamera = this.getRenderCamera()) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "#b8abae";
    ctx.fillRect(0, 0, this.width, this.height);

    const grid = 54;
    const startX = -(((renderCamera.x % grid) + grid) % grid);
    const startY = -(((renderCamera.y % grid) + grid) % grid);

    for (let y = startY - grid; y < this.height + grid; y += grid) {
      for (let x = startX - grid; x < this.width + grid; x += grid) {
        const worldX = Math.floor((x + renderCamera.x) / grid);
        const worldY = Math.floor((y + renderCamera.y) / grid);
        const offset = (worldX + worldY) % 2 === 0 ? 0 : 9;
        this.drawStoneTile(ctx, x + offset, y, grid, worldX, worldY);
      }
    }

    if (this.waveManager.currentWave) {
      this.renderObjectivePanel(ctx);
    }
    ctx.restore();
  }

  drawStoneTile(ctx, x, y, size, worldX, worldY) {
    const jitter = ((worldX * 17 + worldY * 11) % 7) - 3;
    ctx.save();
    ctx.fillStyle = "rgba(210, 199, 198, 0.48)";
    ctx.strokeStyle = "rgba(126, 111, 116, 0.38)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 5 + jitter, size - 9, size - 10, 10);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 9 + jitter, size - 18, size - 20, 8);
    ctx.stroke();
    ctx.restore();
  }

  renderObjectivePanel(ctx) {
    const text = this.waveManager.getObjectiveText();
    const x = 18;
    const y = Math.min(this.height - 74, 236);
    const width = Math.min(420, this.width - 36);
    const height = 42;

    ctx.save();
    ctx.fillStyle = "rgba(20, 25, 34, 0.86)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 17px Segoe UI, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + 14, y + height / 2);
    ctx.restore();
  }

  updateCamera() {
    if (!this.player) {
      return;
    }

    this.camera.x = this.player.x - this.width / 2;
    this.camera.y = this.player.y - this.height / 2;
  }

  getRenderCamera() {
    return {
      x: Math.round(this.camera.x),
      y: Math.round(this.camera.y),
    };
  }

  recoverHiddenPausedOverlay() {
    if (!this.ui.overlay.classList.contains("hidden")) {
      return;
    }

    if (this.state === GameState.LEVEL_UP && this.pendingLevelUps > 0) {
      this.openLevelUp();
      return;
    }

    if (this.state === GameState.REWARD_SELECT) {
      this.openRewardSelect();
    }
  }
}
