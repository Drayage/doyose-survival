export function getRelicIconMarkup(relicId) {
  return `<span class="relic-icon relic-icon-${relicId}" aria-hidden="true">${getRelicIconSvg(relicId)}</span>`;
}

export function getRelicIconSvg(relicId) {
  const icons = {
    powerCore: `
      <svg viewBox="0 0 48 48" focusable="false">
        <path class="plate" d="M24 5 39 14v20L24 43 9 34V14z" />
        <path class="glow" d="M24 13 32 18v12l-8 5-8-5V18z" />
        <path class="spark" d="M24 15v18M15 24h18" />
      </svg>`,
    quickGear: `
      <svg viewBox="0 0 48 48" focusable="false">
        <path class="gear" d="M24 6 28 11l6-1 2 6 5 3-3 6 2 6-6 3-3 6-7-2-6 2-3-6-6-3 2-6-3-6 5-3 2-6 6 1z" />
        <circle class="core" cx="24" cy="24" r="7" />
      </svg>`,
    wideLens: `
      <svg viewBox="0 0 48 48" focusable="false">
        <circle class="lens" cx="22" cy="22" r="12" />
        <path class="handle" d="M31 31 41 41" />
        <path class="spark" d="M16 19h12M22 13v18" />
      </svg>`,
    splitter: `
      <svg viewBox="0 0 48 48" focusable="false">
        <path class="plate" d="M12 8h24v32H12z" />
        <path class="spark" d="M24 12v24M17 18h14M17 25h14M17 32h14" />
        <circle class="gold-dot" cx="36" cy="12" r="5" />
      </svg>`,
    lightBoots: `
      <svg viewBox="0 0 48 48" focusable="false">
        <path class="boot" d="M13 13h11v16h9l3 7H10l3-8z" />
        <path class="spark" d="M30 9 25 18h8l-6 11" />
      </svg>`,
    bloodCharm: `
      <svg viewBox="0 0 48 48" focusable="false">
        <path class="heart" d="M24 39S10 30 10 18c0-6 8-9 14-2 6-7 14-4 14 2 0 12-14 21-14 21z" />
        <path class="spark" d="M24 18v12M18 24h12" />
      </svg>`,
    magnetStone: `
      <svg viewBox="0 0 48 48" focusable="false">
        <path class="magnet" d="M13 12h8v14a3 3 0 0 0 6 0V12h8v15a11 11 0 0 1-22 0z" />
        <path class="spark" d="M12 12h9M27 12h9" />
      </svg>`,
  };

  return icons[relicId] ?? icons.powerCore;
}
