import { relicData } from "./data/relics.js";
import { getRarity } from "./data/rarities.js";

export class RelicManager {
  constructor(game) {
    this.game = game;
    this.relics = [];
    this.maxRelicLevel = 3;
  }

  createChoices(count = 3) {
    const available = Object.values(relicData).filter(
      (relic) => this.getRelicLevel(relic.id) < this.maxRelicLevel,
    );
    return this.shuffle(available).slice(0, Math.min(count, available.length));
  }

  applyRelic(relic) {
    const owned = this.relics.find((ownedRelic) => ownedRelic.id === relic.id);
    if (owned && owned.level >= this.maxRelicLevel) {
      return false;
    }

    const player = this.game.player;
    const previousMaxHp = player.maxHp;
    const { stat, op, value } = relic.effect;

    if (op === "multiply") {
      player.passives[stat] *= value;
    } else if (op === "add" && stat === "maxHp") {
      player.maxHp += value;
      player.healToNewMax(previousMaxHp);
    } else if (op === "add") {
      player.passives[stat] += value;
    }

    if (owned) {
      owned.level += 1;
    } else {
      this.relics.push({
        ...relic,
        level: 1,
      });
    }

    return true;
  }

  getRelicLevel(relicId) {
    return this.relics.find((relic) => relic.id === relicId)?.level ?? 0;
  }

  getAffectedWeaponsForRelic(relic) {
    const stat = relic.effect.stat;
    return this.game.player.weapons.filter((weapon) => weapon.supportsPassive(stat));
  }

  getAffectedWeaponText(relic) {
    const weapons = this.getAffectedWeaponsForRelic(relic);
    if (weapons.length === 0) {
      return "직접 적용 무기 없음";
    }

    return weapons.map((weapon) => weapon.name).join(", ");
  }

  getOwnedRelicRows() {
    return this.relics.map((relic) => ({
      id: relic.id,
      name: relic.name,
      description: relic.description,
      level: relic.level,
      rarity: getRarity(relic.rarity),
      affectedWeapons:
        this.getAffectedWeaponsForRelic(relic).length > 0
          ? this.getAffectedWeaponsForRelic(relic)
              .map((weapon) => weapon.name)
              .join(", ")
          : "직접 적용 무기 없음",
    }));
  }

  shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }
}
