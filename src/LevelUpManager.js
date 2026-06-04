import { weaponData } from "./data/weapons.js?v=text-refactor-2";
import { UI_TEXT } from "./data/uiText.js";
import { describeApplicablePassives, describeUpgrade, describeWeaponStats } from "./Weapon.js?v=text-refactor-2";
import { getWeaponIconMarkup } from "./WeaponIcon.js?v=text-refactor-2";

export class LevelUpManager {
  constructor(game) {
    this.game = game;
  }

  createChoices() {
    const choices = [];
    const ownedIds = this.game.player.weapons.map((weapon) => weapon.id);

    for (const weapon of this.game.player.weapons) {
      if (weapon.level < weapon.maxLevel) {
        choices.push({
          type: "upgrade",
          weaponId: weapon.id,
          icon: getWeaponIconMarkup(weapon.id),
          title: `${weapon.name} ${UI_TEXT.buttons.upgrade}`,
          description: `Lv.${weapon.level} → Lv.${weapon.level + 1}`,
          detail: describeUpgrade(weapon, this.game.player),
        });
      }
    }

    for (const data of Object.values(weaponData)) {
      if (!ownedIds.includes(data.id)) {
        choices.push({
          type: "newWeapon",
          weaponId: data.id,
          icon: getWeaponIconMarkup(data.id),
          title: `${data.name} ${UI_TEXT.buttons.acquire}`,
          description: data.description,
          detail: `${describeWeaponStats(data.id, this.game.player, 1)}\n${UI_TEXT.levelUp.applicablePassives}: ${describeApplicablePassives(data.id)}\n${UI_TEXT.levelUp.partSlots}: 0 / 3`,
        });
      }
    }

    return this.shuffle(choices).slice(0, 3);
  }

  applyChoice(choice) {
    if (choice.type === "upgrade") {
      this.game.player.getWeapon(choice.weaponId)?.upgrade();
      return;
    }

    if (choice.type === "newWeapon") {
      this.game.addWeapon(choice.weaponId);
    }
  }

  shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }
}
