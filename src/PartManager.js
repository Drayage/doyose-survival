import { hiddenEvolutionData, partData, PART_STORAGE_LIMIT, partSynergyData } from "./data/parts.js";
import { getRarity } from "./data/rarities.js";

export class PartManager {
  constructor(game) {
    this.game = game;
    this.storage = [];
    this.maxStorage = PART_STORAGE_LIMIT;
    this.evolutionNotices = new Set();
  }

  createChoices(count = 3) {
    const pool = Object.values(partData);
    const choices = [];
    const used = new Set();

    while (choices.length < Math.min(count, pool.length) && used.size < pool.length) {
      const part = this.pickWeightedPart(pool.filter((candidate) => !used.has(candidate.id)));
      used.add(part.id);
      choices.push(part);
    }

    return choices;
  }

  pickWeightedPart(pool) {
    const total = pool.reduce((sum, part) => sum + (part.weight ?? 10), 0);
    let roll = Math.random() * total;

    for (const part of pool) {
      roll -= part.weight ?? 10;
      if (roll <= 0) {
        return part;
      }
    }

    return pool[pool.length - 1];
  }

  getCompatibleWeapons() {
    return this.game.player.weapons.filter((weapon) => weapon.parts.length < weapon.maxPartSlots);
  }

  equipPart(part, weapon) {
    if (!weapon || weapon.parts.length >= weapon.maxPartSlots) {
      return false;
    }

    weapon.parts.push(this.normalizePart(part));
    this.checkEvolutionNotice(weapon);
    return true;
  }

  getExchangeOptions() {
    return this.game.player.weapons
      .filter((weapon) => weapon.parts.length > 0)
      .flatMap((weapon) =>
        weapon.parts.map((replacedPart, index) => ({
          weapon,
          replacedPart,
          index,
        })),
      );
  }

  replacePart(part, weapon, index) {
    if (!weapon || index < 0 || index >= weapon.parts.length) {
      return false;
    }

    weapon.parts.splice(index, 1, this.normalizePart(part));
    this.checkEvolutionNotice(weapon);
    return true;
  }

  storePart(part) {
    if (this.storage.length >= this.maxStorage) {
      return false;
    }

    this.storage.push(this.normalizePart(part));
    return true;
  }

  sellPart(part) {
    this.game.player.gold += this.getSellValue(part);
    return true;
  }

  getSellValue(part) {
    const rarity = this.normalizeRarity(part.rarity);
    const rarityMultiplier = {
      bronze: 1,
      silver: 1.6,
      gold: 2.8,
      diamond: 4.5,
    };

    return Math.round((part.sellValue ?? 10) * (rarityMultiplier[rarity.id] ?? 1));
  }

  getSynergiesForWeapon(weapon) {
    const counts = this.getTagCounts(weapon);
    return partSynergyData.filter((synergy) => (counts.get(synergy.tag) ?? 0) >= synergy.minCount);
  }

  getTagCounts(weapon) {
    const counts = new Map();
    for (const part of weapon.parts) {
      for (const tag of part.tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return counts;
  }

  getEvolutionCandidate(weapon) {
    const tagCounts = this.getTagCounts(weapon);
    return hiddenEvolutionData.find((evolution) => {
      if (evolution.weaponId !== weapon.id) {
        return false;
      }

      const remaining = new Map(tagCounts);
      return evolution.requiredTags.every((tag) => {
        const count = remaining.get(tag) ?? 0;
        if (count <= 0) {
          return false;
        }
        remaining.set(tag, count - 1);
        return true;
      });
    });
  }

  checkEvolutionNotice(weapon) {
    const evolution = this.getEvolutionCandidate(weapon);
    if (!evolution || this.evolutionNotices.has(`${weapon.id}:${evolution.id}`)) {
      return;
    }

    this.evolutionNotices.add(`${weapon.id}:${evolution.id}`);
    this.game.addDamageText(this.game.player.x, this.game.player.y - 72, "진화 가능!", "#ffdb9b");
  }

  getPartRows() {
    return this.game.player.weapons.map((weapon) => ({
      weapon,
      parts: weapon.parts,
      tagCounts: this.getTagCounts(weapon),
      synergies: this.getSynergiesForWeapon(weapon),
      evolution: this.getEvolutionCandidate(weapon),
    }));
  }

  getStorageRows() {
    return this.storage.map((part, index) => ({
      part,
      index,
      weapon: null,
      synergies: [],
      evolution: null,
    }));
  }

  decoratePart(part) {
    return {
      ...this.normalizePart(part),
      rarity: this.normalizeRarity(part.rarity),
    };
  }

  normalizePart(part) {
    const source = partData[part.id] ?? part;
    return {
      ...source,
      rarity: typeof part.rarity === "object" ? part.rarity.id : (part.rarity ?? source.rarity),
    };
  }

  normalizeRarity(rarity) {
    return typeof rarity === "string" ? getRarity(rarity) : rarity;
  }
}
