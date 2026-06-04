import { getRarityByScore } from "./data/rarities.js";
import { modifierData } from "./data/modifiers.js";
import { waveData } from "./data/waves.js?v=combat-content";
import { pickRandom } from "./utils.js";

export class WaveManager {
  constructor() {
    this.waveNumber = 0;
    this.currentWave = null;
    this.killsThisWave = 0;
    this.elitesKilled = 0;
    this.collected = 0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.eliteTimer = 0;
    this.bossSpawned = false;
    this.hasLivingBoss = false;
    this.escortSpawned = false;
    this.farmRewardCutoff = 240;
  }

  createWaveChoices(count = 3) {
    const choices = [];
    const startIndex = this.waveNumber % waveData.length;
    for (let i = 0; i < count; i += 1) {
      const baseWave = waveData[(startIndex + i) % waveData.length];
      choices.push(this.createScaledWavePreview(baseWave, this.waveNumber + 1));
    }
    return choices;
  }

  createScaledWavePreview(baseWave, waveNumber) {
    const difficulty = waveNumber - 1;
    const baseModifier = modifierData[baseWave.modifierId] ?? baseWave.modifier ?? modifierData.standard;
    const modifier = {
      ...baseModifier,
      enemyHpMultiplier: (baseModifier.enemyHpMultiplier ?? 1) * (1 + difficulty * 0.34),
      enemyDamageMultiplier: (baseModifier.enemyDamageMultiplier ?? 1) * (1 + difficulty * 0.22),
      enemySpeedMultiplier: (baseModifier.enemySpeedMultiplier ?? 1) * (1 + difficulty * 0.06),
      rewardExpMultiplier: 1 + difficulty * 0.08,
      goldMultiplier: (baseModifier.goldMultiplier ?? 1) * (1 + difficulty * 0.06),
      difficultyLabel: `난이도 x${(1 + difficulty * 0.32).toFixed(2)}`,
    };
    const maxAliveMultiplier = modifier.maxAliveMultiplier ?? 1;
    const spawnRateMultiplier = modifier.spawnRateMultiplier ?? 1;

    const scaledWave = {
      ...baseWave,
      targetKills: baseWave.targetKills
        ? Math.round(baseWave.targetKills * (1 + difficulty * 0.18))
        : undefined,
      duration: baseWave.duration ? Math.round(baseWave.duration * (1 + difficulty * 0.08)) : undefined,
      targetElites: baseWave.targetElites ? Math.round(baseWave.targetElites + Math.floor(difficulty / 3)) : undefined,
      targetCollect: baseWave.targetCollect ? Math.round(baseWave.targetCollect + Math.floor(difficulty / 2)) : undefined,
      spawnInterval: Math.max(0.22, baseWave.spawnInterval / ((1 + difficulty * 0.1) * spawnRateMultiplier)),
      maxAlive: Math.round((baseWave.maxAlive + difficulty * 3) * maxAliveMultiplier),
      modifier,
      scaledWaveNumber: waveNumber,
    };

    const objectivePressure =
      scaledWave.type === "kill"
        ? scaledWave.targetKills * 1.2
        : scaledWave.type === "boss"
          ? 115
          : scaledWave.type === "eliteHunt" || scaledWave.type === "treasure"
            ? (scaledWave.targetElites ?? 1) * 52
            : scaledWave.type === "collect"
              ? (scaledWave.targetCollect ?? 1) * 18
              : scaledWave.duration * 0.85;
    const spawnPressure = scaledWave.maxAlive * 1.35 + (1 / scaledWave.spawnInterval) * 8;
    const modifierPressure =
      (modifier.enemyHpMultiplier - 1) * 30 +
      (modifier.enemyDamageMultiplier - 1) * 24 +
      (modifier.enemySpeedMultiplier - 1) * 20 +
      (modifier.difficulty - 1) * 44;
    const rewardPressure = (scaledWave.reward?.quality ?? 1) * 10 + (scaledWave.reward?.choices ?? 3) * 3;
    const rarityScore = objectivePressure + spawnPressure + modifierPressure + rewardPressure;

    return {
      ...scaledWave,
      rarityScore,
      rarity: getRarityByScore(rarityScore),
    };
  }

  startWave(wave) {
    this.waveNumber += 1;
    this.currentWave =
      wave.scaledWaveNumber === this.waveNumber ? wave : this.createScaledWavePreview(wave, this.waveNumber);
    this.killsThisWave = 0;
    this.elitesKilled = 0;
    this.collected = 0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.eliteTimer = 1.2;
    this.bossSpawned = false;
    this.hasLivingBoss = false;
    this.escortSpawned = false;
    this.farmRewardCutoff = this.getFarmRewardCutoff(this.currentWave);
  }

  update(deltaTime, game) {
    if (!this.currentWave) {
      return;
    }

    this.elapsed += deltaTime;
    this.spawnTimer -= deltaTime;
    this.eliteTimer -= deltaTime;

    if (this.currentWave.type === "boss" && !this.bossSpawned) {
      game.spawnBoss(this.currentWave.bossId, this.currentWave.modifier);
      this.bossSpawned = true;
    }

    if (this.currentWave.type === "collect") {
      const remainingCollectibles = Math.max(0, this.currentWave.targetCollect - this.collected - game.getCollectibleCount());
      if (remainingCollectibles > 0) {
        game.spawnCollectibleCache(remainingCollectibles);
      }
    }

    if (this.currentWave.type === "escort" && !this.escortSpawned) {
      game.spawnEscortObject();
      this.escortSpawned = true;
    }

    if (
      this.eliteTimer <= 0 &&
      this.currentWave.elitePool?.length > 0 &&
      game.getActiveEliteCount() < 2 &&
      !this.isComplete()
    ) {
      const mustSpawn =
        (this.currentWave.type === "eliteHunt" || this.currentWave.type === "treasure") &&
        game.getActiveEliteCount() + this.elitesKilled < (this.currentWave.targetElites ?? 1);
      const randomSpawn = Math.random() < (this.currentWave.eliteChance ?? 0.12);
      if (mustSpawn || randomSpawn) {
        game.spawnElite(this.currentWave.requiredElite ?? pickRandom(this.currentWave.elitePool), this.currentWave.modifier);
      }
      this.eliteTimer = mustSpawn ? 2.4 : 8 + Math.random() * 7;
    }

    while (
      this.spawnTimer <= 0 &&
      game.getActiveEnemyCount() < this.currentWave.maxAlive &&
      !this.isComplete()
    ) {
      const type = pickRandom(this.currentWave.enemyTypes);
      game.spawnEnemy(type, this.currentWave.modifier);
      this.spawnTimer += this.currentWave.spawnInterval;
    }
  }

  registerKill() {
    this.killsThisWave += 1;
  }

  registerEliteKill() {
    this.elitesKilled += 1;
  }

  registerCollect() {
    this.collected += 1;
  }

  isUntimedMission(wave = this.currentWave) {
    return ["kill", "eliteHunt", "collect", "treasure", "boss"].includes(wave?.type);
  }

  getFarmRewardCutoff(wave = this.currentWave) {
    const base = wave?.type === "boss" ? 300 : 240;
    return base + Math.max(0, this.waveNumber - 1) * 15;
  }

  shouldSuppressFarmingRewards() {
    return this.isUntimedMission() && this.elapsed >= this.farmRewardCutoff;
  }

  isComplete() {
    if (!this.currentWave) {
      return false;
    }

    if (this.currentWave.type === "kill") {
      return this.killsThisWave >= this.currentWave.targetKills;
    }

    if (this.currentWave.type === "survival") {
      return this.elapsed >= this.currentWave.duration;
    }

    if (this.currentWave.type === "eliteHunt" || this.currentWave.type === "treasure") {
      return this.elitesKilled >= (this.currentWave.targetElites ?? 1);
    }

    if (this.currentWave.type === "collect") {
      return this.collected >= (this.currentWave.targetCollect ?? 1);
    }

    if (this.currentWave.type === "escort") {
      return this.elapsed >= this.currentWave.duration;
    }

    if (this.currentWave.type === "boss") {
      return this.bossSpawned && !this.hasLivingBoss;
    }

    return false;
  }

  getObjectiveText(wave = this.currentWave) {
    if (!wave) {
      return "";
    }

    if (wave.type === "kill") {
      const current = wave === this.currentWave ? this.killsThisWave : 0;
      return `목표: ${wave.targetKills} 처치 (${current}/${wave.targetKills})${this.getFarmLimitText(wave)}`;
    }

    if (wave.type === "survival") {
      const current = wave === this.currentWave ? this.elapsed : 0;
      return `목표: ${wave.duration}초 생존 (${current.toFixed(1)}초)`;
    }

    if (wave.type === "eliteHunt") {
      const current = wave === this.currentWave ? this.elitesKilled : 0;
      return `목표: 엘리트 ${wave.targetElites} 처치 (${current}/${wave.targetElites})${this.getFarmLimitText(wave)}`;
    }

    if (wave.type === "treasure") {
      const current = wave === this.currentWave ? this.elitesKilled : 0;
      return `목표: 보물 수호 엘리트 ${wave.targetElites} 처치 (${current}/${wave.targetElites})${this.getFarmLimitText(wave)}`;
    }

    if (wave.type === "collect") {
      const current = wave === this.currentWave ? this.collected : 0;
      return `목표: 보급품 ${wave.targetCollect}개 수집 (${current}/${wave.targetCollect})${this.getFarmLimitText(wave)}`;
    }

    if (wave.type === "escort") {
      const current = wave === this.currentWave ? this.elapsed : 0;
      return `목표: 신호기 ${wave.duration}초 호위 (${current.toFixed(1)}초)`;
    }

    if (wave.type === "boss") {
      return `목표: 보스 ${wave.title} 처치${this.getFarmLimitText(wave)}`;
    }

    return "";
  }

  setBossAlive(isAlive) {
    this.hasLivingBoss = isAlive;
  }

  getFarmLimitText(wave = this.currentWave) {
    if (wave !== this.currentWave || !this.shouldSuppressFarmingRewards()) {
      return "";
    }

    return " · 처치 보상 중지";
  }
}
