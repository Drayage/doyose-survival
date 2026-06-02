import { getRarity } from "./data/rarities.js";
import { getPartIconMarkup } from "./PartIcon.js";
import { getRelicIconMarkup } from "./RelicIcon.js";
import { formatSeconds } from "./utils.js";
import { getWeaponIconMarkup } from "./WeaponIcon.js";

const REWARD_TYPE_LABELS = {
  relic: "유물",
  part: "개조 파츠",
};

export class UIManager {
  constructor(game) {
    this.game = game;
    this.hud = document.querySelector("#hud");
    this.overlay = document.querySelector("#overlay");
    this.overlayTitle = document.querySelector("#overlayTitle");
    this.overlayDescription = document.querySelector("#overlayDescription");
    this.choiceGrid = document.querySelector("#choiceGrid");
    this.primaryButton = document.querySelector("#primaryButton");
    this.hpText = document.querySelector("#hpText");
    this.hpFill = document.querySelector("#hpFill");
    this.xpText = document.querySelector("#xpText");
    this.xpFill = document.querySelector("#xpFill");
    this.levelText = document.querySelector("#levelText");
    this.goldText = document.querySelector("#goldText");
    this.waveText = document.querySelector("#waveText");
    this.killText = document.querySelector("#killText");
    this.timeText = document.querySelector("#timeText");
    this.positionText = document.querySelector("#positionText");
    this.weaponList = document.querySelector("#weaponList");
    this.relicList = document.querySelector("#relicList");
    this.partList = document.querySelector("#partList");
    this.objectivePanel = document.querySelector("#objectivePanel");
    this.tooltip = document.querySelector("#tooltip");
    this.weaponSignature = "";
    this.relicSignature = "";
    this.partSignature = "";

    document.addEventListener("click", (event) => {
      if (!event.target.closest("#weaponList, #relicList, #partList")) {
        this.hideTooltip();
      }
    });
  }

  showStart(onStart) {
    this.hud.classList.add("hidden");
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = "도요새 서바이버";
    this.overlayDescription.textContent =
      "웨이브를 선택하고 자동 공격 빌드를 키워 살아남으세요.";
    this.choiceGrid.innerHTML = "";
    this.primaryButton.textContent = "시작";
    this.primaryButton.classList.remove("hidden");
    this.primaryButton.onclick = onStart;
  }

  showWaveChoices(choices, onChoose) {
    this.overlay.classList.remove("hidden");
    this.hud.classList.remove("hidden");
    this.overlayTitle.textContent = "웨이브 선택";
    this.overlayDescription.textContent =
      "주어진 목표와 보상, 적 조합을 보고 다음 전투를 고르세요.";
    this.primaryButton.classList.add("hidden");
    this.renderChoices(
      choices.map((wave) => ({
        rarity: wave.rarity,
        title: `W${wave.scaledWaveNumber}. ${wave.title}`,
        description:
          wave.type === "kill"
            ? `섬멸: ${wave.targetKills} 처치`
            : `생존: ${wave.duration}초 버티기`,
        detail: `등급: ${wave.rarity.label}\n적: ${wave.enemyTypes.join(", ")}\n모디파이어: ${wave.modifier.name}, ${wave.modifier.difficultyLabel}\n최대 동시 적: ${wave.maxAlive}\n보상: ${this.getWaveRewardLabel(wave)}`,
        payload: wave,
      })),
      onChoose,
    );
  }

  showLevelUpChoices(choices, onChoose) {
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = "레벨업";
    this.overlayDescription.textContent = "무기 아이콘과 실제로 변하는 스탯을 확인하세요.";
    this.primaryButton.classList.add("hidden");
    this.renderChoices(choices, onChoose);
  }

  showRewardTypeChoices(types, onChoose) {
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = "웨이브 보상";
    this.overlayDescription.textContent = "이번 웨이브의 보상 종류를 먼저 선택하세요.";
    this.primaryButton.classList.add("hidden");
    this.renderChoices(
      types.map((type) => ({
        rewardType: type.rewardType,
        title: type.title,
        description: type.description,
        detail: type.detail,
        payload: type,
      })),
      onChoose,
    );
  }

  showRewardChoices(choices, onChoose) {
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = "웨이브 보상";
    this.overlayDescription.textContent = "유물 또는 개조 파츠 하나를 선택하세요.";
    this.primaryButton.classList.add("hidden");
    this.renderChoices(
      choices.map((reward) => ({
        rarity: reward.item.rarity,
        rewardType: reward.rewardType,
        icon:
          reward.rewardType === "part"
            ? getPartIconMarkup(reward.item.id)
            : getRelicIconMarkup(reward.item.id),
        title: reward.item.name,
        description: reward.item.description,
        detail:
          reward.rewardType === "part"
            ? this.getPartRewardDetail(reward.item)
            : this.getRelicRewardDetail(reward.item),
        payload: reward,
      })),
      onChoose,
    );
  }

  showPartEquipChoices(part, weapons, onChoose) {
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = "파츠 장착";
    this.overlayDescription.textContent = `${part.name}을 장착할 무기를 선택하세요. 무기당 파츠 슬롯은 3개입니다.`;
    this.primaryButton.classList.add("hidden");
    this.renderChoices(
      weapons.map((weapon) => ({
        title: weapon.name,
        icon: getWeaponIconMarkup(weapon.id),
        rewardType: "part",
        description: `파츠 슬롯 ${weapon.parts.length} / ${weapon.maxPartSlots}`,
        detail: `현재 파츠: ${
          weapon.parts.length > 0 ? weapon.parts.map((equipped) => equipped.name).join(", ") : "없음"
        }\n현재 시너지: ${
          weapon.getSynergies().length > 0 ? weapon.getSynergies().map((synergy) => synergy.name).join(", ") : "없음"
        }`,
        payload: weapon,
      })),
      onChoose,
    );
  }

  showPartExchangeChoices(part, options, onChoose) {
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = "파츠 교환";
    this.overlayDescription.textContent = `${part.name}을 장착할 빈 슬롯이 없습니다. 기존 파츠 하나와 교환하세요.`;
    this.primaryButton.classList.add("hidden");
    this.renderChoices(
      options.map((option) => ({
        title: option.weapon.name,
        icon: getWeaponIconMarkup(option.weapon.id),
        rewardType: "part",
        description: `${option.replacedPart.name} 교체`,
        detail: `나감: ${option.replacedPart.description}\n들어옴: ${part.description}\n새 태그: ${part.tags.join(", ")}`,
        payload: option,
      })),
      onChoose,
    );
  }

  showNoPartTarget(part, onContinue) {
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = "장착 불가";
    this.overlayDescription.textContent = `${part.name}을 장착하거나 교환할 수 있는 무기가 없습니다.`;
    this.choiceGrid.innerHTML = "";
    this.primaryButton.textContent = "다음 웨이브";
    this.primaryButton.classList.remove("hidden");
    this.primaryButton.onclick = onContinue;
  }

  showGameOver(onRestart) {
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = "게임오버";
    this.overlayDescription.textContent = "HP가 0이 되었습니다. 다시 시작할 수 있습니다.";
    this.choiceGrid.innerHTML = "";
    this.primaryButton.textContent = "다시 시작";
    this.primaryButton.classList.remove("hidden");
    this.primaryButton.onclick = onRestart;
  }

  hideOverlay() {
    this.overlay.classList.add("hidden");
    this.primaryButton.onclick = null;
    this.hideTooltip();
  }

  renderChoices(choices, onChoose) {
    this.choiceGrid.innerHTML = "";

    for (const choice of choices) {
      const button = document.createElement("button");
      button.type = "button";
      const rarity = typeof choice.rarity === "string" ? getRarity(choice.rarity) : choice.rarity;
      const rewardType = choice.rewardType;
      button.className = [
        "choice-card",
        rarity ? `rarity-${rarity.id}` : "",
        rewardType ? `reward-${rewardType}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      button.innerHTML = `
        <div class="choice-heading">
          ${choice.icon ?? ""}
          <h2>${choice.title}</h2>
          ${rewardType ? `<span class="type-badge type-${rewardType}">${REWARD_TYPE_LABELS[rewardType]}</span>` : ""}
          ${rarity ? `<span class="rarity-badge rarity-${rarity.id}">${rarity.label}</span>` : ""}
        </div>
        <p>${choice.description}</p>
        <small>${String(choice.detail ?? "").replaceAll("\n", "<br />")}</small>
      `;
      button.addEventListener("click", () => onChoose(choice.payload ?? choice));
      this.choiceGrid.append(button);
    }
  }

  updateHud() {
    const { player, waveManager, relicManager, partManager } = this.game;
    const hpRatio = player.hp / player.maxHp;
    const xpRatio = player.exp / player.expToNext;

    this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    this.hpFill.style.width = `${Math.max(0, hpRatio) * 100}%`;
    this.xpText.textContent = `${player.exp} / ${player.expToNext}`;
    this.xpFill.style.width = `${Math.max(0, xpRatio) * 100}%`;
    this.levelText.textContent = player.level;
    this.goldText.textContent = player.gold;
    this.waveText.textContent = waveManager.waveNumber;
    this.killText.textContent = waveManager.killsThisWave;
    this.timeText.textContent = formatSeconds(waveManager.elapsed);
    this.positionText.textContent = `${Math.round(player.x)}, ${Math.round(player.y)}`;
    this.updateObjectivePanel();

    const relicRows = relicManager.getOwnedRelicRows();
    const partRows = partManager.getPartRows();
    const nextWeaponSignature = player.weapons
      .map((weapon) => `${weapon.id}:${weapon.level}:${weapon.parts.map((part) => part.id).join(",")}`)
      .join("|");
    const nextRelicSignature =
      relicRows.map((relic) => `${relic.id}:${relic.level}:${relic.rarity.id}:${relic.affectedWeapons}`).join("|") || "empty";
    const nextPartSignature =
      partRows
        .map(
          (row) =>
            `${row.weapon.id}:${row.parts.map((part) => part.id).join(",")}:${row.synergies
              .map((synergy) => synergy.tag)
              .join(",")}`,
        )
        .join("|") || "empty";

    if (nextWeaponSignature !== this.weaponSignature) {
      this.weaponSignature = nextWeaponSignature;
      this.weaponList.innerHTML = "";

      for (const weapon of player.weapons) {
        const item = document.createElement("li");
        item.className = "weapon-chip";
        item.tabIndex = 0;
        item.title = `${weapon.name} Lv.${weapon.level} / 클릭하면 상세 스펙`;
        item.innerHTML = `${getWeaponIconMarkup(weapon.id)}<span class="weapon-level">Lv.${weapon.level}</span>`;
        item.addEventListener("click", (event) => this.showWeaponTooltip(weapon, event.currentTarget));
        item.addEventListener("mouseenter", (event) => this.showWeaponTooltip(weapon, event.currentTarget));
        item.addEventListener("mouseleave", () => this.hideTooltip());
        item.addEventListener("focus", (event) => this.showWeaponTooltip(weapon, event.currentTarget));
        item.addEventListener("blur", () => this.hideTooltip());
        item.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            this.showWeaponTooltip(weapon, event.currentTarget);
          }
        });
        this.weaponList.append(item);
      }
    }

    if (nextRelicSignature !== this.relicSignature) {
      this.relicSignature = nextRelicSignature;
      this.relicList.innerHTML = "";

      if (relicRows.length === 0) {
        const item = document.createElement("li");
        item.className = "empty-relic";
        item.textContent = "없음";
        this.relicList.append(item);
      } else {
        for (const relic of relicRows) {
          const item = document.createElement("li");
          item.tabIndex = 0;
          item.className = `relic-item rarity-${relic.rarity.id}`;
          item.title = `${relic.name} Lv.${relic.level} / ${relic.description} / 적용: ${relic.affectedWeapons}`;
          item.innerHTML = `${getRelicIconMarkup(relic.id)}<span class="relic-level">Lv.${relic.level}</span>`;
          item.addEventListener("click", (event) => this.showRelicTooltip(relic, event.currentTarget));
          item.addEventListener("mouseenter", (event) => this.showRelicTooltip(relic, event.currentTarget));
          item.addEventListener("mouseleave", () => this.hideTooltip());
          item.addEventListener("focus", (event) => this.showRelicTooltip(relic, event.currentTarget));
          item.addEventListener("blur", () => this.hideTooltip());
          item.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              this.showRelicTooltip(relic, event.currentTarget);
            }
          });
          this.relicList.append(item);
        }
      }
    }

    if (this.partList && nextPartSignature !== this.partSignature) {
      this.partSignature = nextPartSignature;
      this.partList.innerHTML = "";

      const equippedParts = partRows.flatMap((row) =>
        row.parts.map((part) => ({
          part,
          weapon: row.weapon,
          synergies: row.synergies,
        })),
      );

      if (equippedParts.length === 0) {
        const item = document.createElement("li");
        item.className = "empty-part";
        item.textContent = "없음";
        this.partList.append(item);
        return;
      }

      for (const entry of equippedParts) {
        const rarity = this.normalizeRarity(entry.part.rarity);
        const item = document.createElement("li");
        item.tabIndex = 0;
        item.className = `part-item rarity-${rarity.id}`;
        item.title = `${entry.part.name} / 장착: ${entry.weapon.name}`;
        item.innerHTML = `${getPartIconMarkup(entry.part.id)}<span class="part-level">${entry.weapon.name}</span>`;
        item.addEventListener("click", (event) => this.showPartTooltip(entry, event.currentTarget));
        item.addEventListener("mouseenter", (event) => this.showPartTooltip(entry, event.currentTarget));
        item.addEventListener("mouseleave", () => this.hideTooltip());
        item.addEventListener("focus", (event) => this.showPartTooltip(entry, event.currentTarget));
        item.addEventListener("blur", () => this.hideTooltip());
        item.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            this.showPartTooltip(entry, event.currentTarget);
          }
        });
        this.partList.append(item);
      }
    }
  }

  showWeaponTooltip(weapon, target) {
    const stats = weapon.getComputedStats(this.game.player);
    const statRows = this.getWeaponStatRows(weapon, stats);
    const partRows =
      weapon.parts.length > 0
        ? weapon.parts
            .map(
              (part) =>
                `<li><strong>${part.name}</strong><span>${part.description}</span><small>${part.tags.join(", ")}</small></li>`,
            )
            .join("")
        : `<li class="empty-row">장착된 개조 파츠 없음</li>`;
    const synergyRows =
      weapon.getSynergies().length > 0
        ? weapon
            .getSynergies()
            .map((synergy) => `<li><strong>${synergy.name}</strong><span>${synergy.description}</span></li>`)
            .join("")
        : `<li class="empty-row">활성 시너지 없음</li>`;

    this.tooltip.innerHTML = `
      <strong>${weapon.name} Lv.${weapon.level}</strong>
      <em>무기 스펙</em>
      <dl class="tooltip-stats">
        ${statRows.map((row) => `<div><dt>${row.label}</dt><dd>${row.value}</dd></div>`).join("")}
      </dl>
      <section class="tooltip-section">
        <b>개조 파츠 ${weapon.parts.length} / ${weapon.maxPartSlots}</b>
        <ul>${partRows}</ul>
      </section>
      <section class="tooltip-section">
        <b>파츠 시너지</b>
        <ul>${synergyRows}</ul>
      </section>
    `;
    this.positionTooltip(target, 340, 330);
  }

  getWeaponStatRows(weapon, stats) {
    const rows = [
      { label: "피해", value: Math.round(stats.damage) },
      { label: "공격 간격", value: `${stats.cooldown.toFixed(2)}초` },
    ];

    if (weapon.type === "orbit") {
      rows.push({ label: "검 개수", value: stats.bladeCount });
      rows.push({ label: "회전 반경", value: Math.round(stats.orbitRadius) });
      rows.push({ label: "검 크기", value: stats.bladeRadius.toFixed(1) });
      rows.push({ label: "회전 속도", value: stats.orbitSpeed.toFixed(2) });
      return rows;
    }

    rows.push({ label: "투사체 수", value: stats.projectileCount });
    rows.push({ label: "투사체 크기", value: stats.projectileRadius.toFixed(1) });
    rows.push({ label: "탄속", value: Math.round(stats.projectileSpeed) });
    return rows;
  }

  showPartTooltip(entry, target) {
    const rarity = this.normalizeRarity(entry.part.rarity);
    const synergyRows =
      entry.synergies.length > 0
        ? entry.synergies
            .map((synergy) => `<li><strong>${synergy.name}</strong><span>${synergy.description}</span></li>`)
            .join("")
        : `<li class="empty-row">이 무기에서 활성 시너지 없음</li>`;

    this.tooltip.innerHTML = `
      <strong>${entry.part.name}</strong>
      <em>${rarity.label} 개조 파츠</em>
      <p>${entry.part.description}</p>
      <small>장착 무기: ${entry.weapon.name}</small>
      <section class="tooltip-section part-tags">
        <b>태그</b>
        <div>${entry.part.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
      </section>
      <section class="tooltip-section">
        <b>현재 무기 시너지</b>
        <ul>${synergyRows}</ul>
      </section>
    `;
    this.positionTooltip(target, 320, 260);
  }

  getPartRewardDetail(part) {
    const equipWeapons = this.game.partManager.getCompatibleWeapons(part).map((weapon) => weapon.name);
    const exchangeOptions = this.game.partManager.getExchangeOptions(part);
    const exchangeWeapons = [...new Set(exchangeOptions.map((option) => option.weapon.name))];
    const equipText = equipWeapons.length > 0 ? equipWeapons.join(", ") : "빈 슬롯 없음";
    const exchangeText = exchangeWeapons.length > 0 ? exchangeWeapons.join(", ") : "교환 대상 없음";

    return `태그: ${part.tags.join(", ")}\n빈 슬롯 장착: ${equipText}\n교환 가능: ${exchangeText}`;
  }

  getRelicRewardDetail(relic) {
    const currentLevel = this.game.relicManager.getRelicLevel(relic.id);
    const nextLevel = Math.min(currentLevel + 1, this.game.relicManager.maxRelicLevel);
    const levelText = currentLevel > 0 ? `Lv.${currentLevel} -> Lv.${nextLevel}` : `신규 획득 Lv.1`;

    return `등급: ${getRarity(relic.rarity).label}\n성장: ${levelText}\n현재 적용 무기: ${this.game.relicManager.getAffectedWeaponText(relic)}`;
  }

  getWaveRewardLabel(wave) {
    const typeLabel = wave.reward?.type === "part" ? "파츠 선택" : "유물 선택";
    return `${typeLabel} ${wave.reward?.choices ?? 3}개`;
  }

  showRelicTooltip(relic, target) {
    this.tooltip.innerHTML = `
      <strong>${relic.name} Lv.${relic.level}</strong>
      <em>${relic.rarity.label} 유물</em>
      <p>${relic.description}</p>
      <small>적용 무기: ${relic.affectedWeapons}</small>
    `;
    this.positionTooltip(target, 280, 150);
  }

  positionTooltip(target, width = 280, height = 180) {
    const rect = target.getBoundingClientRect();
    this.tooltip.style.left = `${Math.min(window.innerWidth - width, Math.max(12, rect.left))}px`;
    this.tooltip.style.top = `${Math.min(window.innerHeight - height, rect.bottom + 8)}px`;
    this.tooltip.classList.remove("hidden");
  }

  hideTooltip() {
    this.tooltip.classList.add("hidden");
  }

  updateObjectivePanel() {
    if (!this.objectivePanel) {
      return;
    }

    if (this.game.state !== "playing" || !this.game.waveManager.currentWave) {
      this.objectivePanel.classList.add("hidden");
      return;
    }

    this.objectivePanel.textContent = this.game.waveManager.getObjectiveText();
    this.objectivePanel.classList.remove("hidden");
  }

  normalizeRarity(rarity) {
    return typeof rarity === "string" ? getRarity(rarity) : rarity;
  }
}
