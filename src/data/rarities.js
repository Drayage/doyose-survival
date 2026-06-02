export const rarityData = {
  bronze: {
    id: "bronze",
    label: "브론즈",
    color: "#c8864a",
  },
  silver: {
    id: "silver",
    label: "실버",
    color: "#c9d4df",
  },
  gold: {
    id: "gold",
    label: "골드",
    color: "#f2c84b",
  },
};

export function getRarityByScore(score) {
  if (score >= 150) {
    return rarityData.gold;
  }

  if (score >= 120) {
    return rarityData.silver;
  }

  return rarityData.bronze;
}

export function getRarity(id) {
  return rarityData[id] ?? rarityData.bronze;
}
