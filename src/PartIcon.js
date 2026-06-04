export function getPartIconMarkup(partId) {
  const icon = partIcons[partId] ?? partIcons.default;
  return `<span class="part-icon part-icon-${partId}" aria-hidden="true">${icon}</span>`;
}

const partIcons = {
  explosiveRounds: `
    <svg viewBox="0 0 48 48" focusable="false">
      <circle class="part-shell" cx="24" cy="24" r="15"></circle>
      <path class="part-core heat" d="M24 9 29 21l12 3-10 7 2 12-9-7-10 7 2-12-10-7 12-3z"></path>
      <path class="part-line" d="M11 12 16 17M37 12 32 17M11 36l5-5M37 36l-5-5"></path>
    </svg>`,
  fireRounds: `
    <svg viewBox="0 0 48 48" focusable="false">
      <rect class="part-shell" x="9" y="15" width="30" height="19" rx="5"></rect>
      <path class="part-core heat" d="M16 25c4-9 11-9 15 0 2 5-1 10-7 10s-10-5-8-10z"></path>
      <path class="part-line" d="M15 18h18M14 32h20"></path>
    </svg>`,
  poisonCoat: `
    <svg viewBox="0 0 48 48" focusable="false">
      <path class="part-shell" d="M14 12h20l-3 11 8 12c2 3 0 6-4 6H13c-4 0-6-3-4-6l8-12z"></path>
      <circle class="part-core poison" cx="20" cy="31" r="4"></circle>
      <circle class="part-core poison" cx="29" cy="34" r="3"></circle>
      <path class="part-line" d="M17 12h14M20 20h8"></path>
    </svg>`,
  piercingCore: `
    <svg viewBox="0 0 48 48" focusable="false">
      <path class="part-shell" d="M6 25 32 8l10 16-26 17z"></path>
      <path class="part-core edge" d="M14 25 31 15l4 7-17 11z"></path>
      <path class="part-line" d="M9 13h9M6 35h11M32 7l10 16"></path>
    </svg>`,
  chainModule: `
    <svg viewBox="0 0 48 48" focusable="false">
      <path class="part-shell" d="M19 15a8 8 0 0 1 11 0l3 3-5 5-3-3a2 2 0 0 0-3 0l-3 3a2 2 0 0 0 0 3l3 3-5 5-3-3a8 8 0 0 1 0-11z"></path>
      <path class="part-core electric" d="M29 14 20 29h7l-4 11 12-17h-7z"></path>
    </svg>`,
  splitNozzle: `
    <svg viewBox="0 0 48 48" focusable="false">
      <path class="part-shell" d="M9 21h16l11-8 4 6-9 6 9 6-4 6-11-8H9z"></path>
      <path class="part-line" d="M17 21v8M25 19v12"></path>
      <circle class="part-core" cx="37" cy="19" r="3"></circle>
      <circle class="part-core" cx="37" cy="31" r="3"></circle>
    </svg>`,
  speedCore: `
    <svg viewBox="0 0 48 48" focusable="false">
      <circle class="part-shell" cx="24" cy="24" r="15"></circle>
      <path class="part-core electric" d="M27 8 15 26h8l-2 14 13-20h-8z"></path>
      <path class="part-line" d="M8 17h9M6 24h8M8 31h9"></path>
    </svg>`,
  heavySlug: `
    <svg viewBox="0 0 48 48" focusable="false">
      <rect class="part-shell" x="8" y="14" width="32" height="22" rx="8"></rect>
      <circle class="part-core" cx="24" cy="25" r="8"></circle>
      <path class="part-line" d="M13 14v22M35 14v22"></path>
    </svg>`,
  trackingModule: `
    <svg viewBox="0 0 48 48" focusable="false">
      <circle class="part-shell" cx="24" cy="24" r="15"></circle>
      <circle class="part-core" cx="24" cy="24" r="5"></circle>
      <path class="part-line" d="M24 7v9M24 32v9M7 24h9M32 24h9M13 13l6 6M35 13l-6 6M13 35l6-6M35 35l-6-6"></path>
    </svg>`,
  hotChamber: `
    <svg viewBox="0 0 48 48" focusable="false">
      <rect class="part-shell" x="9" y="15" width="30" height="19" rx="5"></rect>
      <path class="part-core heat" d="M16 25c4-9 11-9 15 0 2 5-1 10-7 10s-10-5-8-10z"></path>
      <path class="part-line" d="M15 18h18M14 32h20"></path>
    </svg>`,
  splitNozzle: `
    <svg viewBox="0 0 48 48" focusable="false">
      <path class="part-shell" d="M9 21h16l11-8 4 6-9 6 9 6-4 6-11-8H9z"></path>
      <path class="part-line" d="M17 21v8M25 19v12"></path>
      <circle class="part-core" cx="37" cy="19" r="3"></circle>
      <circle class="part-core" cx="37" cy="31" r="3"></circle>
    </svg>`,
  lightBolt: `
    <svg viewBox="0 0 48 48" focusable="false">
      <circle class="part-shell" cx="24" cy="24" r="15"></circle>
      <path class="part-core electric" d="M27 8 15 26h8l-2 14 13-20h-8z"></path>
    </svg>`,
  longBarrel: `
    <svg viewBox="0 0 48 48" focusable="false">
      <rect class="part-shell" x="7" y="19" width="34" height="10" rx="4"></rect>
      <rect class="part-core" x="30" y="16" width="10" height="16" rx="3"></rect>
      <path class="part-line" d="M11 24h18"></path>
    </svg>`,
  orbitGyro: `
    <svg viewBox="0 0 48 48" focusable="false">
      <circle class="part-shell" cx="24" cy="24" r="14"></circle>
      <circle class="part-core" cx="24" cy="24" r="5"></circle>
      <path class="part-line" d="M24 7v9M24 32v9M7 24h9M32 24h9"></path>
    </svg>`,
  keenEdge: `
    <svg viewBox="0 0 48 48" focusable="false">
      <path class="part-shell" d="M26 5 39 18 18 40 9 42l2-10z"></path>
      <path class="part-core edge" d="M28 12 33 18 17 34l-4 1 1-4z"></path>
      <path class="part-line" d="M30 26 22 18"></path>
    </svg>`,
  default: `
    <svg viewBox="0 0 48 48" focusable="false">
      <rect class="part-shell" x="10" y="10" width="28" height="28" rx="6"></rect>
      <circle class="part-core" cx="24" cy="24" r="7"></circle>
      <path class="part-line" d="M24 7v8M24 33v8M7 24h8M33 24h8"></path>
    </svg>`,
};
