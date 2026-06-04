export const bossData = {
  ogreTitan: {
    id: "ogreTitan",
    name: "거대 오우거",
    hp: 1350,
    speed: 58,
    damage: 34,
    radius: 46,
    color: "#9d8062",
    reward: { type: "part", choices: 4, quality: 4, gold: 190, exp: 62 },
    patterns: [
      { type: "charge", interval: 3.8, duration: 1.05, speedMultiplier: 4.6 },
      { type: "shockwave", interval: 4.9, radius: 245, damage: 46 },
    ],
  },
  flameLord: {
    id: "flameLord",
    name: "화염 군주",
    hp: 1180,
    speed: 66,
    damage: 28,
    radius: 40,
    color: "#d9593d",
    reward: { type: "relic", choices: 4, quality: 4, gold: 175, exp: 66 },
    patterns: [
      { type: "firePool", interval: 2.7, radius: 86, damage: 15, duration: 5 },
      { type: "fireball", interval: 1.65, damage: 26, speed: 310 },
    ],
  },
  mechBattery: {
    id: "mechBattery",
    name: "기계 병기",
    hp: 1260,
    speed: 48,
    damage: 24,
    radius: 42,
    color: "#7c8fa3",
    reward: { type: "part", choices: 4, quality: 5, gold: 210, exp: 64 },
    patterns: [
      { type: "bulletRing", interval: 2.35, count: 16, damage: 16, speed: 275 },
      { type: "missile", interval: 3.35, damage: 42, radius: 56, duration: 1 },
    ],
  },
};
