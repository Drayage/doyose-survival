import { partData, partSynergyData } from "./data/parts.js";
import { getRarity } from "./data/rarities.js";

export class PartManager {
  constructor(game) {
    this.game = game;
  }

  createChoices(count = 2) {
    const available = Object.values(partData).filter(
      (part) => this.getCompatibleWeapons(part).length > 0 || this.getExchangeOptions(part).length > 0,
    );
    return this.shuffle(available).slice(0, Math.min(count, available.length));
  }

  getCompatibleWeapons(part) {
    return this.game.player.weapons.filter(
      (weapon) =>
        weapon.parts.length < weapon.maxPartSlots &&
        part.compatibleTypes.includes(weapon.type) &&
        !weapon.parts.some((equipped) => equipped.id === part.id),
    );
  }

  equipPart(part, weapon) {
    if (!weapon || weapon.parts.length >= weapon.maxPartSlots) {
      return false;
    }

    if (!part.compatibleTypes.includes(weapon.type)) {
      return false;
    }

    if (weapon.parts.some((equipped) => equipped.id === part.id)) {
      return false;
    }

    weapon.parts.push(part);
    return true;
  }

  getExchangeOptions(part) {
    return this.game.player.weapons
      .filter(
        (weapon) =>
          part.compatibleTypes.includes(weapon.type) &&
          weapon.parts.length > 0 &&
          !weapon.parts.some((equipped) => equipped.id === part.id),
      )
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

    if (!part.compatibleTypes.includes(weapon.type)) {
      return false;
    }

    if (weapon.parts.some((equipped) => equipped.id === part.id)) {
      return false;
    }

    weapon.parts.splice(index, 1, part);
    return true;
  }

  getSynergiesForWeapon(weapon) {
    const counts = new Map();
    for (const part of weapon.parts) {
      for (const tag of part.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    return Object.values(partSynergyData).filter(
      (synergy) => (counts.get(synergy.tag) ?? 0) >= synergy.minCount,
    );
  }

  getPartRows() {
    return this.game.player.weapons.map((weapon) => ({
      weapon,
      parts: weapon.parts,
      synergies: this.getSynergiesForWeapon(weapon),
    }));
  }

  decoratePart(part) {
    return {
      ...part,
      rarity: getRarity(part.rarity),
    };
  }

  shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }
}
