import { getRarityByScore } from "./data/rarities.js";
import { waveData } from "./data/waves.js?v=wave-reward-type-relic-level";
import { pickRandom } from "./utils.js";

export class WaveManager {
  constructor() {
    this.waveNumber = 0;
    this.currentWave = null;
    this.killsThisWave = 0;
    this.elapsed = 0;
    this.spawnTimer = 0;
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
    const modifier = {
      ...baseWave.modifier,
      enemyHpMultiplier: (baseWave.modifier.enemyHpMultiplier ?? 1) * (1 + difficulty * 0.32),
      enemyDamageMultiplier: (baseWave.modifier.enemyDamageMultiplier ?? 1) * (1 + difficulty * 0.2),
      enemySpeedMultiplier: (baseWave.modifier.enemySpeedMultiplier ?? 1) * (1 + difficulty * 0.055),
      rewardExpMultiplier: 1 + difficulty * 0.08,
      goldMultiplier: (baseWave.modifier.goldMultiplier ?? 1) * (1 + difficulty * 0.06),
      difficultyLabel: `난이도 x${(1 + difficulty * 0.32).toFixed(2)}`,
    };

    const scaledWave = {
      ...baseWave,
      targetKills: baseWave.targetKills
        ? Math.round(baseWave.targetKills * (1 + difficulty * 0.18))
        : undefined,
      duration: baseWave.duration ? Math.round(baseWave.duration * (1 + difficulty * 0.08)) : undefined,
      spawnInterval: Math.max(0.28, baseWave.spawnInterval / (1 + difficulty * 0.1)),
      maxAlive: baseWave.maxAlive + difficulty * 3,
      modifier,
      scaledWaveNumber: waveNumber,
    };

    const objectivePressure =
      scaledWave.type === "kill" ? scaledWave.targetKills * 1.2 : scaledWave.duration * 0.85;
    const spawnPressure = scaledWave.maxAlive * 1.35 + (1 / scaledWave.spawnInterval) * 8;
    const modifierPressure =
      (modifier.enemyHpMultiplier - 1) * 30 +
      (modifier.enemyDamageMultiplier - 1) * 24 +
      (modifier.enemySpeedMultiplier - 1) * 20;
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
    this.elapsed = 0;
    this.spawnTimer = 0;
  }

  update(deltaTime, game) {
    if (!this.currentWave) {
      return;
    }

    this.elapsed += deltaTime;
    this.spawnTimer -= deltaTime;

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

    return false;
  }

  getObjectiveText(wave = this.currentWave) {
    if (!wave) {
      return "";
    }

    if (wave.type === "kill") {
      const current = wave === this.currentWave ? this.killsThisWave : 0;
      return `목표: ${wave.targetKills} 처치 (${current}/${wave.targetKills})`;
    }

    const current = wave === this.currentWave ? this.elapsed : 0;
    return `목표: ${wave.duration}초 생존 (${current.toFixed(1)}초)`;
  }
}
