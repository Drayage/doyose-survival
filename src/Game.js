import { Enemy } from "./Enemy.js";
import { DamageText } from "./DamageText.js";
import { BossEnemy } from "./BossEnemy.js?v=text-refactor-2";
import { EliteEnemy } from "./EliteEnemy.js?v=text-refactor-2";
import { GoldOrb } from "./GoldOrb.js";
import { Hazard } from "./Hazard.js";
import { LevelUpManager } from "./LevelUpManager.js?v=text-refactor-2";
import { MapObject } from "./MapObject.js";
import { PartManager } from "./PartManager.js";
import { Player } from "./Player.js";
import { RelicManager } from "./RelicManager.js";
import { UIManager } from "./UIManagerDetails.js?v=weapon-effects-1";
import { VisualEffect } from "./VisualEffect.js?v=weapon-effects-1";
import { WaveManager } from "./WaveManager.js?v=text-refactor-2";
import { Weapon } from "./Weapon.js?v=weapon-effects-1";
import { XPOrb } from "./XPOrb.js";
import { randomBetween } from "./utils.js";
import { mapObjectData } from "./data/mapObjects.js";

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
    this.targetMode = "nearest";
    this.targetLockEnabled = false;
    this.lockedTarget = null;
    this.currentAutoAttackTarget = null;
    this.fps = 0;
    this.frameAccumulator = 0;
    this.frameCount = 0;
    this.limits = {
      maxProjectiles: 240,
      maxHazards: 90,
      maxXpOrbs: 180,
      maxGoldOrbs: 140,
      maxMapObjects: 34,
      maxVisualEffects: 160,
    };
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
    this.hazards = [];
    this.mapObjects = [];
    this.visualEffects = [];
    this.damageTexts = [];
    this.xpOrbs = [];
    this.goldOrbs = [];
    this.waveManager = new WaveManager();
    this.levelUpManager = new LevelUpManager(this);
    this.relicManager = new RelicManager(this);
    this.partManager = new PartManager(this);
    this.pendingLevelUps = 0;
    this.waveRewardPending = false;
    this.lockedTarget = null;
    this.currentAutoAttackTarget = null;
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
    this.pruneDistantMapObjects();
    this.ui.showWaveChoices(this.waveManager.createWaveChoices(), (wave) => this.startWave(wave));
    this.ui.updateHud();
  }

  startWave(wave) {
    this.state = GameState.PLAYING;
    this.clearCombatEntities({ keepPickups: true, keepGhosts: true });
    this.pruneDistantPickups();
    this.pruneDistantMapObjects();
    this.waveManager.startWave(wave);
    this.spawnAmbientObjects();
    this.ui.hideOverlay();
  }

  clearCombatEntities({ keepPickups = false, keepGhosts = false } = {}) {
    this.enemies = keepGhosts ? this.enemies.filter((enemy) => enemy.isGhost) : [];
    this.projectiles = [];
    this.hazards = [];
    this.visualEffects = [];
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
    this.hazards = [];
    this.visualEffects = [];
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

  pruneDistantMapObjects(maxDistance = 1600) {
    this.mapObjects = this.mapObjects.filter(
      (object) => object.data.protected || Math.hypot(object.x - this.player.x, object.y - this.player.y) <= maxDistance,
    );
  }

  addWeapon(id) {
    if (this.player.getWeapon(id)) {
      return;
    }
    this.player.addWeapon(new Weapon(id));
  }

  addDamageText(x, y, value, color) {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === "number" && !Number.isFinite(value)) {
      return;
    }

    this.damageTexts.push(new DamageText(x, y, value, color));
  }

  addVisualEffect(options) {
    this.visualEffects.push(new VisualEffect(options));
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

    if (reward.type === "gold") {
      this.player.gold += reward.amount ?? 80 + this.waveManager.waveNumber * 12;
      this.showWaveSelect();
      return;
    }

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
      (reward) => this.openPartAcquisitionSelect(reward.item),
    );
  }

  openPartAcquisitionSelect(part) {
    this.state = GameState.PART_EQUIP_SELECT;
    this.ui.showPartAcquisitionChoices(part, (action) => {
      if (action === "equip") {
        this.openPartEquipSelect(part);
        return;
      }

      if (action === "replace") {
        this.openPartExchangeSelect(part);
        return;
      }

      if (action === "store") {
        this.partManager.storePart(part);
        this.showWaveSelect();
        return;
      }

      if (action === "sell") {
        this.partManager.sellPart(part);
        this.showWaveSelect();
      }
    });
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
    const viewWidth = this.getViewWidth();
    const viewHeight = this.getViewHeight();
    const left = this.camera.x;
    const right = this.camera.x + viewWidth;
    const top = this.camera.y;
    const bottom = this.camera.y + viewHeight;

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

  spawnElite(eliteId, modifier) {
    const position = this.getEdgeSpawnPosition(120);
    this.enemies.push(new EliteEnemy(eliteId, position.x, position.y, modifier));
  }

  spawnBoss(bossId, modifier) {
    const position = this.getEdgeSpawnPosition(220);
    this.enemies.push(new BossEnemy(bossId, position.x, position.y, modifier));
    this.waveManager.setBossAlive(true);
    this.addDamageText(this.player.x, this.player.y - 96, "보스 등장!", "#ff6a55");
  }

  getEdgeSpawnPosition(margin = 80) {
    const side = Math.floor(Math.random() * 4);
    const viewWidth = this.getViewWidth();
    const viewHeight = this.getViewHeight();
    const left = this.camera.x;
    const right = this.camera.x + viewWidth;
    const top = this.camera.y;
    const bottom = this.camera.y + viewHeight;

    if (side === 0) return { x: randomBetween(left, right), y: top - margin };
    if (side === 1) return { x: right + margin, y: randomBetween(top, bottom) };
    if (side === 2) return { x: randomBetween(left, right), y: bottom + margin };
    return { x: left - margin, y: randomBetween(top, bottom) };
  }

  spawnAmbientObjects() {
    const desired = Math.min(10, 4 + this.waveManager.waveNumber);
    const weighted = Object.values(mapObjectData).filter((object) => object.spawnWeight > 0);
    while (this.mapObjects.length < desired) {
      this.spawnMapObject(this.pickWeightedMapObject(weighted));
    }
  }

  pickWeightedMapObject(objects) {
    const total = objects.reduce((sum, object) => sum + object.spawnWeight, 0);
    let roll = Math.random() * total;
    for (const object of objects) {
      roll -= object.spawnWeight;
      if (roll <= 0) return object.id;
    }
    return objects[0].id;
  }

  spawnMapObject(type, nearPlayer = false) {
    const distance = nearPlayer ? randomBetween(160, 360) : randomBetween(340, 1100);
    const angle = Math.random() * Math.PI * 2;
    this.mapObjects.push(new MapObject(type, this.player.x + Math.cos(angle) * distance, this.player.y + Math.sin(angle) * distance));
  }

  spawnCollectibleCache(count = 1) {
    const existingCaches = this.mapObjects.filter((object) => object.type === "cache" && !object.isDead);
    for (let i = 0; i < count; i += 1) {
      const cacheIndex = existingCaches.length + i;
      const angle = (Math.PI * 2 * cacheIndex) / Math.max(count + existingCaches.length, 5) + randomBetween(-0.22, 0.22);
      const distance = randomBetween(620, 1250) + (cacheIndex % 2) * 220;
      const x = this.player.x + Math.cos(angle) * distance;
      const y = this.player.y + Math.sin(angle) * distance;
      const tooClose = this.mapObjects.some((object) => object.type === "cache" && Math.hypot(object.x - x, object.y - y) < 360);
      if (tooClose) {
        this.mapObjects.push(new MapObject("cache", x + Math.cos(angle + 0.9) * 340, y + Math.sin(angle + 0.9) * 340));
      } else {
        this.mapObjects.push(new MapObject("cache", x, y));
      }
    }
  }

  spawnEscortObject() {
    this.mapObjects.push(new MapObject("beacon", this.player.x + 120, this.player.y - 80));
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

  setTargetMode(mode) {
    if (!["nearest", "object", "strongest"].includes(mode)) {
      return;
    }

    this.targetMode = mode;
    this.lockedTarget = null;
    this.currentAutoAttackTarget = null;
  }

  setTargetLockEnabled(isEnabled) {
    this.targetLockEnabled = isEnabled;
    if (!isEnabled) {
      this.lockedTarget = null;
      this.currentAutoAttackTarget = null;
    }
  }

  getAutoAttackTarget(x = this.player.x, y = this.player.y) {
    if (this.targetLockEnabled && this.isTargetValid(this.lockedTarget)) {
      this.currentAutoAttackTarget = this.lockedTarget;
      return this.lockedTarget;
    }

    const target = this.pickAutoAttackTarget(x, y);
    if (this.targetLockEnabled) {
      this.lockedTarget = target;
    }
    this.currentAutoAttackTarget = target;
    return target;
  }

  pickAutoAttackTarget(x, y) {
    const range = this.getAutoAttackRange();
    if (this.targetMode === "object") {
      return this.getNearestMapObject(x, y, range) ?? this.getNearestEnemy(x, y);
    }

    if (this.targetMode === "strongest") {
      return this.getStrongestEnemy(x, y, range) ?? this.getNearestEnemy(x, y);
    }

    return this.getNearestEnemy(x, y);
  }

  isTargetValid(target) {
    if (!target || target.isDead) {
      return false;
    }

    if (target.targetKind === "object" || target.data) {
      return (
        this.mapObjects.includes(target) &&
        !target.data.collectible &&
        (this.targetMode !== "object" || this.isInsideAutoAttackRange(target))
      );
    }

    return (
      this.enemies.includes(target) &&
      !target.isGhost &&
      (this.targetMode !== "strongest" || this.isInsideAutoAttackRange(target))
    );
  }

  getAutoAttackRange() {
    const ranges = this.player.weapons
      .filter((weapon) => weapon.type !== "orbit")
      .map((weapon) => {
        const stats = weapon.getComputedStats(this.player);
        return (stats.projectileSpeed || 0) * (weapon.data.projectileLife || 0) + 120;
      })
      .filter((range) => range > 0);

    return ranges.length > 0 ? Math.max(...ranges) : 520;
  }

  isInsideAutoAttackRange(target) {
    return Math.hypot(target.x - this.player.x, target.y - this.player.y) <= this.getAutoAttackRange();
  }

  getNearestMapObject(x, y, maxDistance = Infinity) {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const object of this.mapObjects) {
      if (object.isDead || object.data.collectible || object.data.protected) {
        continue;
      }

      const dist = Math.hypot(object.x - x, object.y - y);
      if (dist > maxDistance) {
        continue;
      }

      if (dist < nearestDistance) {
        nearest = object;
        nearestDistance = dist;
      }
    }

    return nearest;
  }

  getStrongestEnemy(x, y, maxDistance = Infinity) {
    let strongest = null;
    let bestScore = -Infinity;

    for (const enemy of this.enemies) {
      if (enemy.isDead || enemy.isGhost) {
        continue;
      }

      const dist = Math.hypot(enemy.x - x, enemy.y - y);
      if (dist > maxDistance) {
        continue;
      }

      const rank = enemy.isBoss ? 100000 : enemy.isElite ? 50000 : 0;
      const score = rank + enemy.hp + enemy.maxHp * 0.35 - dist * 0.02;
      if (score > bestScore) {
        bestScore = score;
        strongest = enemy;
      }
    }

    return strongest;
  }

  getActiveEnemyCount() {
    return this.enemies.filter((enemy) => !enemy.isGhost).length;
  }

  getActiveEliteCount() {
    return this.enemies.filter((enemy) => enemy.isElite && !enemy.isDead).length;
  }

  getCollectibleCount() {
    return this.mapObjects.filter((object) => object.data.collectible && !object.isDead).length;
  }

  getEscortObject() {
    return this.mapObjects.find((object) => object.data.protected && !object.isDead);
  }

  getLivingBoss() {
    return this.enemies.find((enemy) => enemy.isBoss && !enemy.isDead);
  }

  getEnemyMoveAuraMultiplier(enemy) {
    let multiplier = 1;
    for (const other of this.enemies) {
      if (!other.isElite || other.ability !== "aura" || other === enemy || other.isDead) {
        continue;
      }
      if (Math.hypot(other.x - enemy.x, other.y - enemy.y) <= other.eliteData.auraRadius) {
        multiplier = Math.max(multiplier, other.eliteData.auraSpeedMultiplier ?? 1);
      }
    }
    return multiplier;
  }

  loop(timestamp) {
    const deltaTime = Math.min(0.05, (timestamp - this.lastTime) / 1000 || 0);
    this.lastTime = timestamp;
    this.updatePerformanceStats(deltaTime);

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
    for (const hazard of this.hazards) hazard.update(deltaTime, this);
    for (const object of this.mapObjects) object.update(deltaTime, this);
    for (const effect of this.visualEffects) effect.update(deltaTime);
    for (const orb of this.xpOrbs) orb.update(deltaTime, this);
    for (const orb of this.goldOrbs) orb.update(deltaTime, this);
    for (const text of this.damageTexts) text.update(deltaTime);

    this.collectDeaths();
    this.cleanupEntityOverflow();

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

  updatePerformanceStats(deltaTime) {
    this.frameAccumulator += deltaTime;
    this.frameCount += 1;
    if (this.frameAccumulator >= 0.5) {
      this.fps = Math.round(this.frameCount / this.frameAccumulator);
      this.frameAccumulator = 0;
      this.frameCount = 0;
    }
  }

  cleanupEntityOverflow() {
    this.projectiles = this.projectiles.slice(-this.limits.maxProjectiles);
    this.hazards = this.hazards.slice(-this.limits.maxHazards);
    this.xpOrbs = this.xpOrbs.slice(-this.limits.maxXpOrbs);
    this.goldOrbs = this.goldOrbs.slice(-this.limits.maxGoldOrbs);
    this.visualEffects = this.visualEffects.slice(-this.limits.maxVisualEffects);

    const protectedObjects = this.mapObjects.filter((object) => object.data.protected || object.data.collectible);
    const ambientObjects = this.mapObjects.filter((object) => !object.data.protected && !object.data.collectible);
    const ambientLimit = Math.max(0, this.limits.maxMapObjects - protectedObjects.length);
    this.mapObjects = [...protectedObjects, ...ambientObjects.slice(-ambientLimit)];
  }

  collectDeaths() {
    for (const enemy of this.enemies) {
      if (!enemy.isDead || enemy.rewardClaimed) {
        continue;
      }

      enemy.rewardClaimed = true;
      if (!enemy.isGhost) {
        if (enemy.isElite) {
          this.waveManager.registerEliteKill();
          this.dropEliteReward(enemy);
        } else if (enemy.isBoss) {
          this.waveManager.setBossAlive(false);
          this.dropBossReward(enemy);
        } else {
          this.waveManager.registerKill();
          if (!this.waveManager.shouldSuppressFarmingRewards()) {
            this.xpOrbs.push(new XPOrb(enemy.x, enemy.y, enemy.rewardExp));

            if (Math.random() <= enemy.goldDropChance) {
              this.goldOrbs.push(new GoldOrb(enemy.x + randomBetween(-8, 8), enemy.y + randomBetween(-8, 8), enemy.rewardGold));
            }
          }

          if (enemy.modifier?.splitOnDeath && enemy.radius > 9) {
            this.spawnSplitEnemies(enemy);
          }
        }

        if (enemy.ability === "deathExplosion") {
          this.explodeAt(enemy.x, enemy.y, enemy.eliteData.explosionRadius, enemy.eliteData.explosionDamage);
        }
      }
    }

    this.enemies = this.enemies.filter((enemy) => !enemy.isDead);
    this.projectiles = this.projectiles.filter((projectile) => !projectile.isDead);
    this.hazards = this.hazards.filter((hazard) => !hazard.isDead);
    this.mapObjects = this.mapObjects.filter((object) => !object.isDead);
    this.visualEffects = this.visualEffects.filter((effect) => !effect.isDead);
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

  spawnSplitEnemies(enemy) {
    const count = 2;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const child = new Enemy("runner", enemy.x + Math.cos(angle) * 24, enemy.y + Math.sin(angle) * 24, {
        ...enemy.modifier,
        enemyHpMultiplier: (enemy.modifier.enemyHpMultiplier ?? 1) * 0.42,
        enemyDamageMultiplier: (enemy.modifier.enemyDamageMultiplier ?? 1) * 0.72,
        enemySpeedMultiplier: (enemy.modifier.enemySpeedMultiplier ?? 1) * 1.2,
      });
      child.radius = Math.max(8, child.radius * 0.72);
      child.rewardExp = 1;
      child.rewardGold = 0;
      child.goldDropChance = 0;
      this.enemies.push(child);
    }
  }

  dropEliteReward(enemy) {
    const reward = enemy.reward ?? {};
    const exp = reward.exp ?? 10;
    const gold = reward.gold ?? 30;
    if (!this.waveManager.shouldSuppressFarmingRewards()) {
      this.xpOrbs.push(new XPOrb(enemy.x, enemy.y, exp));
      this.goldOrbs.push(new GoldOrb(enemy.x + 10, enemy.y + 8, gold));
    }
    if (!this.waveManager.shouldSuppressFarmingRewards() && (enemy.reward?.type === "part" || enemy.reward?.type === "relic")) {
      this.mapObjects.push(new MapObject("supplyCrate", enemy.x - 18, enemy.y + 20));
    }
    this.addDamageText(enemy.x, enemy.y - enemy.radius - 18, "엘리트 보상", "#ffdb9b");
  }

  dropBossReward(enemy) {
    const reward = enemy.reward ?? {};
    this.player.gold += reward.gold ?? 120;
    this.xpOrbs.push(new XPOrb(enemy.x, enemy.y, reward.exp ?? 40));
    this.addDamageText(enemy.x, enemy.y - enemy.radius - 24, "보스 처치!", "#68f2ff");

    if (this.waveManager.currentWave?.reward) {
      this.waveManager.currentWave.reward = {
        ...this.waveManager.currentWave.reward,
        choices: Math.max(this.waveManager.currentWave.reward.choices ?? 3, reward.choices ?? 4),
        quality: Math.max(this.waveManager.currentWave.reward.quality ?? 1, reward.quality ?? 4),
      };
    }
  }

  explodeAt(x, y, radius, damage) {
    this.hazards.push(
      new Hazard({
        x,
        y,
        radius,
        damage: Math.round(damage * 0.35),
        duration: 0.32,
        color: "rgba(255, 183, 74, 0.42)",
      }),
    );

    for (const enemy of this.enemies) {
      if (!enemy.isDead && Math.hypot(enemy.x - x, enemy.y - y) <= enemy.radius + radius) {
        const dealt = enemy.takeDamage(damage, { source: "explosion", damageType: "explosive" });
        this.addDamageText(enemy.x, enemy.y - enemy.radius, dealt, "#ffbf75");
      }
    }
  }

  damageEnemiesInRadius(x, y, radius, damage, context = {}, excluded = null, color = "#ffbf75") {
    let hitCount = 0;
    for (const enemy of this.enemies) {
      if (enemy.isDead || enemy === excluded) {
        continue;
      }

      if (Math.hypot(enemy.x - x, enemy.y - y) <= enemy.radius + radius) {
        const dealt = enemy.takeDamage(damage, context);
        this.addDamageText(enemy.x, enemy.y - enemy.radius, dealt, color);
        hitCount += 1;
      }
    }
    return hitCount;
  }

  render() {
    const renderScale = this.getRenderScale();
    const renderCamera = this.getRenderCamera();
    const viewWidth = this.getViewWidth();
    const viewHeight = this.getViewHeight();
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.scale(renderScale, renderScale);
    this.renderArena(renderCamera, viewWidth, viewHeight);
    this.ctx.translate(-renderCamera.x, -renderCamera.y);
    for (const orb of this.xpOrbs) orb.render(this.ctx);
    for (const orb of this.goldOrbs) orb.render(this.ctx);
    for (const object of this.mapObjects) object.render(this.ctx);
    for (const hazard of this.hazards) hazard.render(this.ctx);
    for (const projectile of this.projectiles) projectile.render(this.ctx);
    for (const enemy of this.enemies) enemy.render(this.ctx);
    for (const effect of this.visualEffects) effect.render(this.ctx);

    this.player.render(this.ctx);
    for (const text of this.damageTexts) text.render(this.ctx);
    this.ctx.restore();
    this.renderObjectiveIndicators(renderCamera, renderScale);
  }

  renderObjectiveIndicators(renderCamera, renderScale) {
    if (this.waveManager.currentWave?.type !== "collect") {
      return;
    }

    const caches = this.mapObjects.filter((object) => object.type === "cache" && !object.isDead);
    if (caches.length === 0) {
      return;
    }

    const margin = 28;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const ctx = this.ctx;

    for (const cache of caches) {
      const screenX = (cache.x - renderCamera.x) * renderScale;
      const screenY = (cache.y - renderCamera.y) * renderScale;
      const isVisible =
        screenX >= margin &&
        screenX <= this.width - margin &&
        screenY >= margin &&
        screenY <= this.height - margin;

      if (isVisible) {
        continue;
      }

      const angle = Math.atan2(screenY - centerY, screenX - centerX);
      const edgeX = Math.min(this.width - margin, Math.max(margin, centerX + Math.cos(angle) * this.width));
      const edgeY = Math.min(this.height - margin, Math.max(margin, centerY + Math.sin(angle) * this.height));

      ctx.save();
      ctx.translate(edgeX, edgeY);
      ctx.rotate(angle);
      ctx.fillStyle = "rgba(242, 200, 75, 0.94)";
      ctx.strokeStyle = "rgba(30, 24, 10, 0.92)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-9, -11);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-9, 11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.rotate(-angle);
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 3;
      ctx.font = "800 12px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const distance = Math.round(Math.hypot(cache.x - this.player.x, cache.y - this.player.y) / 10) * 10;
      ctx.strokeText(`${distance}`, 0, 13);
      ctx.fillText(`${distance}`, 0, 13);
      ctx.restore();
    }
  }

  renderArena(renderCamera = this.getRenderCamera(), viewWidth = this.getViewWidth(), viewHeight = this.getViewHeight()) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "#b8abae";
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    const grid = 54;
    const startX = -(((renderCamera.x % grid) + grid) % grid);
    const startY = -(((renderCamera.y % grid) + grid) % grid);

    for (let y = startY - grid; y < viewHeight + grid; y += grid) {
      for (let x = startX - grid; x < viewWidth + grid; x += grid) {
        const worldX = Math.floor((x + renderCamera.x) / grid);
        const worldY = Math.floor((y + renderCamera.y) / grid);
        const offset = (worldX + worldY) % 2 === 0 ? 0 : 9;
        this.drawStoneTile(ctx, x + offset, y, grid, worldX, worldY);
      }
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

  updateCamera() {
    if (!this.player) {
      return;
    }

    this.camera.x = this.player.x - this.getViewWidth() / 2;
    this.camera.y = this.player.y - this.getViewHeight() / 2;
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

  getRenderScale() {
    return this.width <= 720 ? 0.72 : 1;
  }

  getViewWidth() {
    return this.width / this.getRenderScale();
  }

  getViewHeight() {
    return this.height / this.getRenderScale();
  }
}
