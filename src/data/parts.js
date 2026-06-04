import { PART_TEXT } from "./partNames.js";
import { EVOLUTION_NAMES } from "./weaponNames.js";

export const PART_STORAGE_LIMIT = 12;

export const duplicateEfficiency = [1, 0.6, 0.35];

export const partData = {
  explosiveRounds: {
    id: "explosiveRounds",
    name: PART_TEXT.explosiveRounds.name,
    rarity: "silver",
    description: PART_TEXT.explosiveRounds.description,
    tags: ["explosive"],
    sellValue: 18,
    weight: 20,
    effects: [
      { stat: "damageMultiplier", op: "multiply", value: 1.1 },
      { stat: "areaMultiplier", op: "multiply", value: 1.08 },
      { stat: "explosionRadius", op: "add", value: 22 },
    ],
    typeEffects: {
      orbit: [
        { stat: "damageMultiplier", op: "multiply", value: 1.08 },
        { stat: "explosionRadius", op: "add", value: 18 },
      ],
    },
  },
  fireRounds: {
    id: "fireRounds",
    name: PART_TEXT.fireRounds.name,
    rarity: "bronze",
    description: PART_TEXT.fireRounds.description,
    tags: ["fire"],
    sellValue: 10,
    weight: 28,
    effects: [
      { stat: "damageMultiplier", op: "multiply", value: 1.08 },
      { stat: "burnPower", op: "add", value: 1 },
    ],
    typeEffects: {
      orbit: [
        { stat: "damageMultiplier", op: "multiply", value: 1.06 },
        { stat: "burnPower", op: "add", value: 1 },
      ],
    },
  },
  poisonCoat: {
    id: "poisonCoat",
    name: PART_TEXT.poisonCoat.name,
    rarity: "bronze",
    description: PART_TEXT.poisonCoat.description,
    tags: ["poison"],
    sellValue: 10,
    weight: 26,
    effects: [
      { stat: "damageMultiplier", op: "multiply", value: 1.05 },
      { stat: "poisonPower", op: "add", value: 1 },
    ],
    typeEffects: {
      orbit: [
        { stat: "damageMultiplier", op: "multiply", value: 1.04 },
        { stat: "poisonPower", op: "add", value: 1 },
      ],
    },
  },
  piercingCore: {
    id: "piercingCore",
    name: PART_TEXT.piercingCore.name,
    rarity: "silver",
    description: PART_TEXT.piercingCore.description,
    tags: ["pierce"],
    sellValue: 18,
    weight: 20,
    effects: [{ stat: "pierceCount", op: "add", value: 1 }],
    typeEffects: {
      orbit: [{ stat: "areaMultiplier", op: "multiply", value: 1.14 }],
    },
  },
  chainModule: {
    id: "chainModule",
    name: PART_TEXT.chainModule.name,
    rarity: "gold",
    description: PART_TEXT.chainModule.description,
    tags: ["chain"],
    sellValue: 32,
    weight: 11,
    effects: [
      { stat: "chainCount", op: "add", value: 1 },
      { stat: "projectileSpeedMultiplier", op: "multiply", value: 1.08 },
    ],
    typeEffects: {
      orbit: [
        { stat: "orbitSpeedMultiplier", op: "multiply", value: 1.08 },
        { stat: "chainCount", op: "add", value: 1 },
      ],
    },
  },
  splitNozzle: {
    id: "splitNozzle",
    name: PART_TEXT.splitNozzle.name,
    rarity: "silver",
    description: PART_TEXT.splitNozzle.description,
    tags: ["split"],
    sellValue: 18,
    weight: 20,
    effects: [{ stat: "projectileCountBonus", op: "add", value: 1 }],
    typeEffects: {
      orbit: [{ stat: "bladeCountBonus", op: "add", value: 1 }],
    },
  },
  speedCore: {
    id: "speedCore",
    name: PART_TEXT.speedCore.name,
    rarity: "bronze",
    description: PART_TEXT.speedCore.description,
    tags: ["speed"],
    sellValue: 10,
    weight: 28,
    effects: [
      { stat: "cooldownMultiplier", op: "multiply", value: 0.92 },
      { stat: "projectileSpeedMultiplier", op: "multiply", value: 1.14 },
    ],
    typeEffects: {
      orbit: [
        { stat: "cooldownMultiplier", op: "multiply", value: 0.94 },
        { stat: "orbitSpeedMultiplier", op: "multiply", value: 1.16 },
      ],
    },
  },
  heavySlug: {
    id: "heavySlug",
    name: PART_TEXT.heavySlug.name,
    rarity: "gold",
    description: PART_TEXT.heavySlug.description,
    tags: ["heavy"],
    sellValue: 32,
    weight: 11,
    effects: [
      { stat: "damageMultiplier", op: "multiply", value: 1.18 },
      { stat: "areaMultiplier", op: "multiply", value: 1.1 },
      { stat: "cooldownMultiplier", op: "multiply", value: 1.05 },
    ],
  },
  trackingModule: {
    id: "trackingModule",
    name: PART_TEXT.trackingModule.name,
    rarity: "diamond",
    description: PART_TEXT.trackingModule.description,
    tags: ["tracking"],
    sellValue: 55,
    weight: 5,
    effects: [
      { stat: "trackingStrength", op: "add", value: 1 },
      { stat: "projectileSpeedMultiplier", op: "multiply", value: 1.12 },
    ],
    typeEffects: {
      orbit: [
        { stat: "orbitSpeedMultiplier", op: "multiply", value: 1.1 },
        { stat: "trackingStrength", op: "add", value: 1 },
      ],
    },
  },
};

export const partSynergyData = [
  {
    id: "fire-2",
    tag: "fire",
    minCount: 2,
    name: "화염 증폭",
    description: "화상 피해 계수 +2",
    effects: [{ stat: "burnPower", op: "add", value: 2 }],
  },
  {
    id: "fire-3",
    tag: "fire",
    minCount: 3,
    name: "화염 장판 예열",
    description: "화상 적 사망 시 화염 장판 진화 조건을 만족합니다.",
    effects: [{ stat: "firePoolReady", op: "add", value: 1 }],
  },
  {
    id: "explosive-2",
    tag: "explosive",
    minCount: 2,
    name: "폭압 확장",
    description: "폭발 범위 +28",
    effects: [{ stat: "explosionRadius", op: "add", value: 28 }],
  },
  {
    id: "explosive-3",
    tag: "explosive",
    minCount: 3,
    name: "2차 폭발",
    description: "2차 폭발 진화 조건을 만족합니다.",
    effects: [{ stat: "secondaryExplosionReady", op: "add", value: 1 }],
  },
  {
    id: "chain-2",
    tag: "chain",
    minCount: 2,
    name: "연쇄 증폭",
    description: "연쇄 횟수 +1",
    effects: [{ stat: "chainCount", op: "add", value: 1 }],
  },
  {
    id: "chain-3",
    tag: "chain",
    minCount: 3,
    name: "완전 전도",
    description: "연쇄 피해 감소 제거 진화 조건을 만족합니다.",
    effects: [{ stat: "chainNoPenaltyReady", op: "add", value: 1 }],
  },
  {
    id: "split-2",
    tag: "split",
    minCount: 2,
    name: "분열 증폭",
    description: "분열 투사체 +1",
    effects: [{ stat: "projectileCountBonus", op: "add", value: 1 }],
  },
  {
    id: "split-3",
    tag: "split",
    minCount: 3,
    name: "파츠 계승",
    description: "분열 투사체도 파츠 효과를 계승할 수 있습니다.",
    effects: [{ stat: "splitInheritReady", op: "add", value: 1 }],
  },
  {
    id: "poison-2",
    tag: "poison",
    minCount: 2,
    name: "독 지속",
    description: "독 피해 계수 +2",
    effects: [{ stat: "poisonPower", op: "add", value: 2 }],
  },
  {
    id: "poison-3",
    tag: "poison",
    minCount: 3,
    name: "독 중첩",
    description: "독 중첩 진화 조건을 만족합니다.",
    effects: [{ stat: "poisonStackReady", op: "add", value: 1 }],
  },
];

export const hiddenEvolutionData = [
  {
    id: "railgun",
    weaponId: "pistol",
    name: EVOLUTION_NAMES.railgun,
    requiredTags: ["pierce", "chain", "speed"],
  },
  {
    id: "napalmLauncher",
    weaponId: "shotgun",
    name: EVOLUTION_NAMES.napalmLauncher,
    requiredTags: ["fire", "fire", "explosive"],
  },
  {
    id: "bladeStorm",
    weaponId: "orbitBlade",
    name: EVOLUTION_NAMES.bladeStorm,
    requiredTags: ["heavy", "speed", "split"],
  },
  {
    id: "tacticalWarhead",
    weaponId: "railLance",
    name: EVOLUTION_NAMES.tacticalWarhead,
    requiredTags: ["explosive", "tracking", "heavy"],
  },
  {
    id: "queenSwarm",
    weaponId: "droneHive",
    name: EVOLUTION_NAMES.queenSwarm,
    requiredTags: ["poison", "chain", "tracking"],
  },
  {
    id: "teslaNetwork",
    weaponId: "lightningGenerator",
    name: EVOLUTION_NAMES.teslaNetwork,
    requiredTags: ["chain", "speed", "tracking"],
  },
  {
    id: "electroStorm",
    weaponId: "magneticField",
    name: EVOLUTION_NAMES.electroStorm,
    requiredTags: ["heavy", "explosive", "chain"],
  },
];
