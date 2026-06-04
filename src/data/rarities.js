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
  diamond: {
    id: "diamond",
    label: "다이아",
    color: "#68f2ff",
  },
};

export function getRarityByScore(score) {
  if (score >= 250) {
    return rarityData.diamond;
  }

  if (score >= 190) {
    return rarityData.gold;
  }

  if (score >= 145) {
    return rarityData.silver;
  }

  return rarityData.bronze;
}

export function getRarity(id) {
  return rarityData[id] ?? rarityData.bronze;
}
