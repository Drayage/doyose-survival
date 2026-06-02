export function getPartIconMarkup(partId) {
  const icon = partIcons[partId] ?? partIcons.default;
  return `<span class="part-icon part-icon-${partId}" aria-hidden="true">${icon}</span>`;
}

const partIcons = {
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
