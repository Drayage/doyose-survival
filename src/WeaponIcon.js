export function getWeaponIconMarkup(weaponId) {
  return `<span class="weapon-icon weapon-icon-${weaponId}" aria-hidden="true">${getWeaponIconSvg(weaponId)}</span>`;
}

export function getWeaponIconSvg(weaponId) {
  if (weaponId === "shotgun") {
    return `
      <svg viewBox="0 0 48 48" focusable="false">
        <path class="wood" d="M8 30h14l-5 10H6z" />
        <path class="metal" d="M14 23h28v7H12z" />
        <path class="metal alt" d="M15 14h26v6H13z" />
        <path class="dark" d="M26 28h8l-3 8h-8z" />
        <path class="shine" d="M17 16h20M18 25h20" />
      </svg>`;
  }

  if (weaponId === "orbitBlade") {
    return `
      <svg viewBox="0 0 48 48" focusable="false">
        <path class="aura" d="M24 7a17 17 0 1 0 0 34 17 17 0 0 0 0-34z" />
        <path class="blade" d="M24 3 31 20 24 26 17 20z" />
        <path class="blade alt" d="M45 24 28 31 22 24 28 17z" />
        <path class="blade" d="M24 45 17 28 24 22 31 28z" />
        <circle class="core" cx="24" cy="24" r="5" />
      </svg>`;
  }

  return `
    <svg viewBox="0 0 48 48" focusable="false">
      <path class="metal" d="M10 28 27 17h9l-3 8-15 10H9z" />
      <path class="dark" d="M9 32h11l-4 10H7z" />
      <path class="wood" d="M28 16h10l3 5-8 5z" />
      <circle class="muzzle" cx="37" cy="21" r="3" />
      <path class="shine" d="M14 28 29 19" />
    </svg>`;
}
