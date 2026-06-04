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

  if (weaponId === "smg") {
    return `
      <svg viewBox="0 0 48 48" focusable="false">
        <path class="metal" d="M8 26h27l5 5H10z" />
        <path class="dark" d="M15 31h10l-2 11h-8z" />
        <path class="wood" d="M7 30h9l-5 9H5z" />
        <path class="metal alt" d="M22 18h20v6H20z" />
        <circle class="muzzle" cx="42" cy="21" r="2.5" />
        <path class="shine" d="M12 27h18M24 20h13" />
      </svg>`;
  }

  if (weaponId === "railLance") {
    return `
      <svg viewBox="0 0 48 48" focusable="false">
        <path class="aura" d="M8 33c8-3 23-3 32 0-8 5-23 5-32 0z" />
        <path class="metal" d="M8 21 30 12l11 11-23 9z" />
        <path class="dark" d="M13 29 7 39l12-5z" />
        <path class="blade" d="M31 12 45 7l-5 15z" />
        <circle class="muzzle" cx="30" cy="23" r="5" />
        <path class="shine" d="M14 23 29 17" />
      </svg>`;
  }

  if (weaponId === "droneHive") {
    return `
      <svg viewBox="0 0 48 48" focusable="false">
        <path class="aura" d="M12 18c4-8 20-8 24 0 5 10-1 22-12 24C13 40 7 28 12 18z" />
        <circle class="core" cx="24" cy="24" r="7" />
        <path class="blade" d="M14 16c-7-6-12 5-5 10 5 3 8-3 5-10z" />
        <path class="blade alt" d="M34 16c7-6 12 5 5 10-5 3-8-3-5-10z" />
        <path class="metal" d="M20 26h8l3 10H17z" />
        <path class="shine" d="M19 21h10M21 29h6" />
      </svg>`;
  }

  if (weaponId === "lightningGenerator") {
    return `
      <svg viewBox="0 0 48 48" focusable="false">
        <path class="aura" d="M10 24a14 14 0 1 0 28 0 14 14 0 0 0-28 0z" />
        <path class="blade" d="M28 4 13 27h10l-4 17 16-25H25z" />
        <circle class="core" cx="24" cy="24" r="4" />
        <path class="shine" d="M17 25h8M23 13l-5 9" />
      </svg>`;
  }

  if (weaponId === "magneticField") {
    return `
      <svg viewBox="0 0 48 48" focusable="false">
        <path class="aura" d="M24 6a18 18 0 1 0 0 36 18 18 0 0 0 0-36z" />
        <path class="metal" d="M15 14h7v13c0 4-3 7-7 7s-7-3-7-7V14h7v13c0 1 1 2 2 2s2-1 2-2z" />
        <path class="metal alt" d="M33 14h7v13c0 4-3 7-7 7s-7-3-7-7V14h7v13c0 1 1 2 2 2s2-1 2-2z" />
        <path class="shine" d="M12 14h8M28 14h8" />
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
