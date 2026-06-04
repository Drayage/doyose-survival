import { RELIC_TEXT } from "./relicNames.js";

export const relicData = {
  powerCore: {
    id: "powerCore",
    name: RELIC_TEXT.powerCore.name,
    rarity: "silver",
    description: RELIC_TEXT.powerCore.description,
    effect: { stat: "damageMultiplier", op: "multiply", value: 1.15 },
  },
  quickGear: {
    id: "quickGear",
    name: RELIC_TEXT.quickGear.name,
    rarity: "silver",
    description: RELIC_TEXT.quickGear.description,
    effect: { stat: "attackSpeedMultiplier", op: "multiply", value: 1.15 },
  },
  wideLens: {
    id: "wideLens",
    name: RELIC_TEXT.wideLens.name,
    rarity: "silver",
    description: RELIC_TEXT.wideLens.description,
    effect: { stat: "areaMultiplier", op: "multiply", value: 1.18 },
  },
  splitter: {
    id: "splitter",
    name: RELIC_TEXT.splitter.name,
    rarity: "gold",
    description: RELIC_TEXT.splitter.description,
    effect: { stat: "projectileCountBonus", op: "add", value: 1 },
  },
  lightBoots: {
    id: "lightBoots",
    name: RELIC_TEXT.lightBoots.name,
    rarity: "bronze",
    description: RELIC_TEXT.lightBoots.description,
    effect: { stat: "moveSpeedMultiplier", op: "multiply", value: 1.12 },
  },
  bloodCharm: {
    id: "bloodCharm",
    name: RELIC_TEXT.bloodCharm.name,
    rarity: "bronze",
    description: RELIC_TEXT.bloodCharm.description,
    effect: { stat: "maxHp", op: "add", value: 25 },
  },
  magnetStone: {
    id: "magnetStone",
    name: RELIC_TEXT.magnetStone.name,
    rarity: "bronze",
    description: RELIC_TEXT.magnetStone.description,
    effect: { stat: "xpPickupMultiplier", op: "multiply", value: 1.35 },
  },
};
