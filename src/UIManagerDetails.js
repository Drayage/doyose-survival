import { getRarity } from "./data/rarities.js";
import { UI_TEXT } from "./data/uiText.js";
import { getPartIconMarkup } from "./PartIcon.js";
import { getRelicIconMarkup } from "./RelicIcon.js";
import { formatSeconds } from "./utils.js";
import { getWeaponIconMarkup } from "./WeaponIcon.js?v=text-refactor-2";

const REWARD_TYPE_LABELS = UI_TEXT.rewards;

const STAT_LABELS = UI_TEXT.stats;

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
    this.targetModeButtons = [...document.querySelectorAll("[data-target-mode]")];
    this.targetLockButton = document.querySelector("#targetLockButton");
    this.objectivePanel = document.querySelector("#objectivePanel");
    this.bossBar = document.querySelector("#bossBar");
    this.bossName = document.querySelector("#bossName");
    this.bossHpText = document.querySelector("#bossHpText");
    this.bossHpFill = document.querySelector("#bossHpFill");
    this.tooltip = document.querySelector("#tooltip");
    this.debugPanel = document.querySelector("#debugPanel");
    this.weaponSignature = "";
    this.relicSignature = "";
    this.partSignature = "";

    document.addEventListener("click", (event) => {
      if (!event.target.closest("#weaponList, #relicList, #partList")) {
        this.hideTooltip();
      }
    });

    for (const button of this.targetModeButtons) {
      button.addEventListener("click", () => {
        this.game.setTargetMode(button.dataset.targetMode);
        this.updateTargetControls();
      });
    }

    this.targetLockButton?.addEventListener("click", () => {
      this.game.setTargetLockEnabled(!this.game.targetLockEnabled);
      this.updateTargetControls();
    });
  }

  showStart(onStart) {
    this.hud.classList.add("hidden");
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = UI_TEXT.app.title;
    this.overlayDescription.textContent = UI_TEXT.app.startDescription;
    this.choiceGrid.innerHTML = "";
    this.primaryButton.textContent = UI_TEXT.buttons.start;
    this.primaryButton.classList.remove("hidden");
    this.primaryButton.onclick = onStart;
  }

  showWaveChoices(choices, onChoose) {
    this.overlay.classList.remove("hidden");
    this.hud.classList.remove("hidden");
    this.overlayTitle.textContent = UI_TEXT.panels.waveSelectTitle;
    this.overlayDescription.textContent = UI_TEXT.panels.waveSelectDescription;
    this.primaryButton.classList.add("hidden");
    this.renderChoices(
      choices.map((wave) => ({
        rarity: wave.rarity,
        title: `W${wave.scaledWaveNumber}. ${wave.title}`,
        description: this.getWaveObjectivePreview(wave),
        detail: `등급: ${wave.rarity.label}\n적: ${wave.enemyTypes.join(", ")}${wave.elitePool?.length ? ` / 엘리트: ${wave.elitePool.join(", ")}` : ""}${wave.bossId ? ` / 보스: ${wave.bossId}` : ""}\n모디파이어: ${wave.modifier.name}\n효과: ${wave.modifier.description ?? "없음"}\n예상 난이도: ${wave.modifier.difficultyLabel}\n최대 동시 적: ${wave.maxAlive}\n보상: ${this.getWaveRewardLabel(wave)}`,
        payload: wave,
      })),
      onChoose,
    );
  }

  showLevelUpChoices(choices, onChoose) {
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = UI_TEXT.notifications.levelUp;
    this.overlayDescription.textContent = UI_TEXT.panels.levelUpDescription;
    this.primaryButton.classList.add("hidden");
    this.renderChoices(choices, onChoose);
  }

  showRewardChoices(choices, onChoose) {
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = UI_TEXT.notifications.waveReward;
    this.overlayDescription.textContent = UI_TEXT.panels.rewardDescription;
    this.primaryButton.classList.add("hidden");
    this.renderChoices(
      choices.map((reward) => ({
        rarity: reward.item.rarity,
        rewardType: reward.rewardType,
        icon: reward.rewardType === "part" ? getPartIconMarkup(reward.item.id) : getRelicIconMarkup(reward.item.id),
        title: reward.item.name,
        description: reward.item.description,
        detail: reward.rewardType === "part" ? this.getPartRewardDetail(reward.item) : this.getRelicRewardDetail(reward.item),
        payload: reward,
      })),
      onChoose,
    );
  }

  showPartAcquisitionChoices(part, onChoose) {
    const equipWeapons = this.game.partManager.getCompatibleWeapons(part);
    const exchangeOptions = this.game.partManager.getExchangeOptions(part);
    const canStore = this.game.partManager.storage.length < this.game.partManager.maxStorage;

    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = UI_TEXT.panels.partProcessTitle;
    this.overlayDescription.textContent = `${part.name}을 어떻게 사용할지 선택하세요. 같은 파츠는 중복 장착 가능하지만 수치 효율은 감소합니다.`;
    this.primaryButton.classList.add("hidden");
    this.renderChoices(
      [
        {
          icon: getPartIconMarkup(part.id),
          rewardType: "part",
          title: UI_TEXT.buttons.equip,
          description: "빈 슬롯이 있는 무기에 장착합니다.",
          detail: equipWeapons.length > 0 ? `가능: ${equipWeapons.map((weapon) => weapon.name).join(", ")}` : "빈 파츠 슬롯이 없습니다.",
          payload: "equip",
          disabled: equipWeapons.length === 0,
        },
        {
          icon: getPartIconMarkup(part.id),
          rewardType: "part",
          title: UI_TEXT.buttons.replace,
          description: "기존 파츠 하나와 바꿉니다.",
          detail: exchangeOptions.length > 0 ? `교체 후보: ${exchangeOptions.length}개` : "교체할 파츠가 없습니다.",
          payload: "replace",
          disabled: exchangeOptions.length === 0,
        },
        {
          icon: getPartIconMarkup(part.id),
          rewardType: "part",
          title: UI_TEXT.buttons.store,
          description: "파츠 보관함에 저장합니다.",
          detail: `보관함 ${this.game.partManager.storage.length} / ${this.game.partManager.maxStorage}`,
          payload: "store",
          disabled: !canStore,
        },
        {
          rewardType: "part",
          title: UI_TEXT.buttons.sell,
          description: "즉시 골드로 바꿉니다.",
          detail: `판매가: ${this.game.partManager.getSellValue(part)} 골드`,
          payload: "sell",
        },
      ],
      onChoose,
    );
  }

  showPartEquipChoices(part, weapons, onChoose) {
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = UI_TEXT.panels.partEquipTitle;
    this.overlayDescription.textContent = `${part.name}을 장착할 무기를 선택하세요. 모든 파츠는 모든 무기에 장착 가능하며 무기별로 효과가 변환됩니다.`;
    this.primaryButton.classList.add("hidden");
    this.renderChoices(
      weapons.map((weapon) => ({
        title: weapon.name,
        icon: getWeaponIconMarkup(weapon.id),
        rewardType: "part",
        description: `파츠 슬롯 ${weapon.parts.length} / ${weapon.maxPartSlots}`,
        detail: this.getWeaponPartPreview(weapon, part),
        payload: weapon,
      })),
      onChoose,
    );
  }

  showPartExchangeChoices(part, options, onChoose) {
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = UI_TEXT.panels.partReplaceTitle;
    this.overlayDescription.textContent = `${part.name}과 기존 파츠 하나를 교체하세요.`;
    this.primaryButton.classList.add("hidden");
    this.renderChoices(
      options.map((option) => ({
        title: option.weapon.name,
        icon: getWeaponIconMarkup(option.weapon.id),
        rewardType: "part",
        description: `${option.replacedPart.name} 교체`,
        detail: `나감: ${option.replacedPart.description}\n들어옴: ${part.description}\n태그: ${part.tags.join(", ")}`,
        payload: option,
      })),
      onChoose,
    );
  }

  showNoPartTarget(part, onContinue) {
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = UI_TEXT.panels.partUnavailableTitle;
    this.overlayDescription.textContent = `${part.name}을 장착, 교체, 보관할 수 없습니다.`;
    this.choiceGrid.innerHTML = "";
    this.primaryButton.textContent = UI_TEXT.buttons.nextWave;
    this.primaryButton.classList.remove("hidden");
    this.primaryButton.onclick = onContinue;
  }

  showGameOver(onRestart) {
    this.overlay.classList.remove("hidden");
    this.overlayTitle.textContent = UI_TEXT.notifications.gameOver;
    this.overlayDescription.textContent = "HP가 0이 되었습니다. 다시 시작할 수 있습니다.";
    this.choiceGrid.innerHTML = "";
    this.primaryButton.textContent = UI_TEXT.buttons.restart;
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
      button.disabled = Boolean(choice.disabled);
      button.className = [
        "choice-card",
        rarity ? `rarity-${rarity.id}` : "",
        rewardType ? `reward-${rewardType}` : "",
        choice.disabled ? "is-disabled" : "",
      ]
        .filter(Boolean)
        .join(" ");
      button.innerHTML = `
        <div class="choice-heading">
          ${choice.icon ?? ""}
          <h2>${choice.title}</h2>
          ${rewardType ? `<span class="type-badge type-${rewardType}">${REWARD_TYPE_LABELS[rewardType] ?? rewardType}</span>` : ""}
          ${rarity ? `<span class="rarity-badge rarity-${rarity.id}">${rarity.label}</span>` : ""}
        </div>
        <p>${choice.description}</p>
        <small>${String(choice.detail ?? "").replaceAll("\n", "<br />")}</small>
      `;
      button.addEventListener("click", () => {
        if (!choice.disabled) {
          onChoose(choice.payload ?? choice);
        }
      });
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
    this.updateBossBar();
    this.updateDebugPanel();
    this.updateTargetControls();

    const relicRows = relicManager.getOwnedRelicRows();
    const partRows = partManager.getPartRows();
    const storageRows = partManager.getStorageRows();
    const nextWeaponSignature = player.weapons
      .map((weapon) => `${weapon.id}:${weapon.level}:${weapon.parts.map((part) => part.id).join(",")}`)
      .join("|");
    const nextRelicSignature =
      relicRows.map((relic) => `${relic.id}:${relic.level}:${relic.rarity.id}:${relic.affectedWeapons}`).join("|") || "empty";
    const nextPartSignature =
      [
        ...partRows.map(
          (row) =>
            `${row.weapon.id}:${row.parts.map((part) => part.id).join(",")}:${row.synergies.map((synergy) => synergy.id).join(",")}:${row.evolution?.id ?? ""}`,
        ),
        `storage:${storageRows.map((row) => row.part.id).join(",")}`,
      ].join("|") || "empty";

    if (nextWeaponSignature !== this.weaponSignature) {
      this.weaponSignature = nextWeaponSignature;
      this.renderWeaponList(player.weapons);
    }

    if (nextRelicSignature !== this.relicSignature) {
      this.relicSignature = nextRelicSignature;
      this.renderRelicList(relicRows);
    }

    if (this.partList && nextPartSignature !== this.partSignature) {
      this.partSignature = nextPartSignature;
      this.renderPartList(partRows, storageRows);
    }
  }

  renderWeaponList(weapons) {
    this.weaponList.innerHTML = "";

    for (const weapon of weapons) {
      const item = document.createElement("li");
      item.className = "weapon-chip";
      item.tabIndex = 0;
      item.title = `${weapon.name} Lv.${weapon.level} / 클릭하면 상세 스펙`;
      item.innerHTML = `${getWeaponIconMarkup(weapon.id)}<span class="weapon-level">Lv.${weapon.level}</span>`;
      this.bindTooltip(item, (target) => this.showWeaponTooltip(weapon, target));
      this.weaponList.append(item);
    }
  }

  renderRelicList(relicRows) {
    this.relicList.innerHTML = "";
    this.relicList.closest(".weapon-panel")?.classList.toggle("is-empty", relicRows.length === 0);

    if (relicRows.length === 0) {
      const item = document.createElement("li");
      item.className = "empty-relic";
      item.textContent = UI_TEXT.empty.none;
      this.relicList.append(item);
      return;
    }

    for (const relic of relicRows) {
      const item = document.createElement("li");
      item.tabIndex = 0;
      item.className = `relic-item rarity-${relic.rarity.id}`;
      item.title = `${relic.name} Lv.${relic.level} / ${relic.description} / 적용: ${relic.affectedWeapons}`;
      item.innerHTML = `${getRelicIconMarkup(relic.id)}<span class="relic-level">Lv.${relic.level}</span>`;
      this.bindTooltip(item, (target) => this.showRelicTooltip(relic, target));
      this.relicList.append(item);
    }
  }

  renderPartList(partRows, storageRows) {
    this.partList.innerHTML = "";
    const equippedParts = partRows.flatMap((row) =>
      row.parts.map((part, index) => ({
        part,
        index,
        weapon: row.weapon,
        synergies: row.synergies,
        evolution: row.evolution,
        stored: false,
      })),
    );
    const entries = [
      ...equippedParts,
      ...storageRows.map((row) => ({ ...row, stored: true })),
    ];
    this.partList.closest(".weapon-panel")?.classList.toggle("is-empty", entries.length === 0);

    if (entries.length === 0) {
      const item = document.createElement("li");
      item.className = "empty-part";
      item.textContent = "없음";
      this.partList.append(item);
      return;
    }

    for (const entry of entries) {
      const rarity = this.normalizeRarity(entry.part.rarity);
      const item = document.createElement("li");
      item.tabIndex = 0;
      item.className = `part-item rarity-${rarity.id} ${entry.stored ? "is-stored" : "is-equipped"}`;
      item.title = entry.stored ? `${entry.part.name} / 보관함` : `${entry.part.name} / 장착: ${entry.weapon.name}`;
      item.innerHTML = `${getPartIconMarkup(entry.part.id)}<span class="part-level">${entry.stored ? "보관" : entry.weapon.name}</span>`;
      this.bindTooltip(item, (target) => this.showPartTooltip(entry, target));
      this.partList.append(item);
    }
  }

  bindTooltip(item, show) {
    item.addEventListener("click", (event) => show(event.currentTarget));
    item.addEventListener("mouseenter", (event) => show(event.currentTarget));
    item.addEventListener("mouseleave", () => this.hideTooltip());
    item.addEventListener("focus", (event) => show(event.currentTarget));
    item.addEventListener("blur", () => this.hideTooltip());
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        show(event.currentTarget);
      }
    });
  }

  showWeaponTooltip(weapon, target) {
    const stats = weapon.getComputedStats(this.game.player);
    const partRows =
      weapon.parts.length > 0
        ? weapon.parts
            .map((part, index) => {
              const duplicateIndex = weapon.parts.slice(0, index).filter((equipped) => equipped.id === part.id).length;
              const efficiency = [100, 60, 35][Math.min(duplicateIndex, 2)];
              return `<li><strong>${part.name} <small>${efficiency}% 효율</small></strong><span>${part.description}</span><small>${part.tags.join(", ")}</small></li>`;
            })
            .join("")
        : `<li class="empty-row">장착한 개조 파츠 없음</li>`;
    const synergyRows =
      weapon.getSynergies().length > 0
        ? weapon
            .getSynergies()
            .map((synergy) => `<li><strong>${synergy.name}</strong><span>${synergy.description}</span></li>`)
            .join("")
        : `<li class="empty-row">${UI_TEXT.empty.noSynergy}</li>`;
    const evolution = this.game.partManager.getEvolutionCandidate(weapon);
    const evolutionText = evolution
      ? `무기가 진화할 수 있습니다: ${evolution.name}`
      : "아직 숨겨진 진화 조건을 만족하지 못했습니다.";

    this.tooltip.innerHTML = `
      <strong>${weapon.name} Lv.${weapon.level}</strong>
      <em>무기 상세</em>
      <dl class="tooltip-stats">
        ${this.getWeaponStatRows(weapon, stats).map((row) => `<div><dt>${row.label}</dt><dd>${row.value}</dd></div>`).join("")}
      </dl>
      <section class="tooltip-section">
        <b>개조 파츠 ${weapon.parts.length} / ${weapon.maxPartSlots}</b>
        <ul>${partRows}</ul>
      </section>
      <section class="tooltip-section">
        <b>활성 태그 시너지</b>
        <ul>${synergyRows}</ul>
      </section>
      <section class="tooltip-section">
        <b>진화 감지</b>
        <p>${evolutionText}</p>
      </section>
    `;
    this.positionTooltip(target, 360, 470);
  }

  getWeaponStatRows(weapon, stats) {
    const rows = [
      { label: STAT_LABELS.damage, value: Math.round(stats.damage) },
      { label: STAT_LABELS.cooldown, value: `${stats.cooldown.toFixed(2)}초` },
    ];

    if (weapon.type === "orbit") {
      rows.push({ label: STAT_LABELS.bladeCount, value: stats.bladeCount });
      rows.push({ label: STAT_LABELS.orbitRadius, value: Math.round(stats.orbitRadius) });
      rows.push({ label: STAT_LABELS.bladeRadius, value: stats.bladeRadius.toFixed(1) });
      rows.push({ label: STAT_LABELS.orbitSpeed, value: stats.orbitSpeed.toFixed(2) });
    } else if (weapon.type === "drone") {
      rows.push({ label: "드론 수", value: stats.projectileCount });
      rows.push({ label: "추적 범위", value: Math.round(stats.droneRange) });
    } else if (weapon.type === "lightning") {
      rows.push({ label: "낙뢰 횟수", value: stats.projectileCount });
      rows.push({ label: "연쇄 범위", value: Math.round(stats.chainRange) });
    } else if (weapon.type === "pulse") {
      rows.push({ label: "자기장 범위", value: Math.round(stats.pulseRadius) });
      rows.push({ label: "당김", value: Math.round(stats.pullStrength) });
    } else {
      rows.push({ label: STAT_LABELS.projectileCount, value: stats.projectileCount });
      rows.push({ label: STAT_LABELS.projectileRadius, value: stats.projectileRadius.toFixed(1) });
      rows.push({ label: STAT_LABELS.projectileSpeed, value: Math.round(stats.projectileSpeed) });
      rows.push({ label: STAT_LABELS.pierceCount, value: stats.pierceCount.toFixed(1) });
    }

    for (const key of ["explosionRadius", "chainCount", "burnPower", "poisonPower", "trackingStrength"]) {
      if (stats[key] > 0) {
        rows.push({ label: STAT_LABELS[key], value: stats[key].toFixed(key === "explosionRadius" ? 0 : 1) });
      }
    }

    return rows;
  }

  showPartTooltip(entry, target) {
    const rarity = this.normalizeRarity(entry.part.rarity);
    const synergyRows =
      entry.synergies.length > 0
        ? entry.synergies.map((synergy) => `<li><strong>${synergy.name}</strong><span>${synergy.description}</span></li>`).join("")
        : `<li class="empty-row">${entry.weapon ? "이 무기에서 활성 시너지 없음" : "보관 중인 파츠"}</li>`;

    this.tooltip.innerHTML = `
      <strong>${entry.part.name}</strong>
      <em>${rarity.label} 개조 파츠</em>
      <p>${entry.part.description}</p>
      <small>${entry.weapon ? `장착 무기: ${entry.weapon.name}` : "상태: 보관함"}</small>
      <section class="tooltip-section part-tags">
        <b>태그</b>
        <div>${entry.part.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
      </section>
      <section class="tooltip-section">
        <b>현재 무기 시너지</b>
        <ul>${synergyRows}</ul>
      </section>
    `;
    this.positionTooltip(target, 320, 300);
  }

  getWeaponPartPreview(weapon, part) {
    const originalParts = weapon.parts;
    const before = weapon.getComputedStats(this.game.player);
    weapon.parts = [...weapon.parts, part];
    const after = weapon.getComputedStats(this.game.player);
    const synergies = weapon.getSynergies();
    const evolution = this.game.partManager.getEvolutionCandidate(weapon);
    weapon.parts = originalParts;

    const lines = [
      `공격력 ${Math.round(before.damage)} -> ${Math.round(after.damage)}`,
      `공격 간격 ${before.cooldown.toFixed(2)}초 -> ${after.cooldown.toFixed(2)}초`,
      weapon.type === "orbit"
        ? `회전 반경 ${Math.round(before.orbitRadius)} -> ${Math.round(after.orbitRadius)}`
        : `주요 개수 ${before.projectileCount} -> ${after.projectileCount}`,
      `활성 시너지: ${synergies.length > 0 ? synergies.map((synergy) => synergy.name).join(", ") : "없음"}`,
    ];

    if (evolution) {
      lines.push(`진화 가능: ${evolution.name}`);
    }

    return lines.join("\n");
  }

  getPartRewardDetail(part) {
    const equipWeapons = this.game.partManager.getCompatibleWeapons(part).map((weapon) => weapon.name);
    const exchangeOptions = this.game.partManager.getExchangeOptions(part);
    const equipText = equipWeapons.length > 0 ? equipWeapons.join(", ") : "빈 슬롯 없음";
    const exchangeText = exchangeOptions.length > 0 ? `${exchangeOptions.length}개 후보` : "교체 대상 없음";

    return `등급: ${this.normalizeRarity(part.rarity).label}\n태그: ${part.tags.join(", ")}\n빈 슬롯 장착: ${equipText}\n교체 가능: ${exchangeText}\n판매가: ${this.game.partManager.getSellValue(part)} 골드`;
  }

  getRelicRewardDetail(relic) {
    const currentLevel = this.game.relicManager.getRelicLevel(relic.id);
    const nextLevel = Math.min(currentLevel + 1, this.game.relicManager.maxRelicLevel);
    const levelText = currentLevel > 0 ? `Lv.${currentLevel} -> Lv.${nextLevel}` : "신규 획득 Lv.1";

    return `등급: ${getRarity(relic.rarity).label}\n성장: ${levelText}\n현재 적용 무기: ${this.game.relicManager.getAffectedWeaponText(relic)}`;
  }

  getWaveRewardLabel(wave) {
    const typeMap = {
      relic: `${UI_TEXT.rewards.relic} 선택`,
      part: `${UI_TEXT.rewards.part} 선택`,
      gold: UI_TEXT.rewards.gold,
      shopDiscount: UI_TEXT.rewards.shopDiscount,
      event: UI_TEXT.rewards.event,
    };
    return `${typeMap[wave.reward?.type] ?? UI_TEXT.rewards.fallback} ${wave.reward?.choices ?? 3}개`;
  }

  getWaveObjectivePreview(wave) {
    if (wave.type === "kill") return `섬멸: ${wave.targetKills} 처치`;
    if (wave.type === "survival") return `생존: ${wave.duration}초 버티기`;
    if (wave.type === "eliteHunt") return `엘리트 사냥: ${wave.targetElites} 처치`;
    if (wave.type === "treasure") return `보물: 수호 엘리트 ${wave.targetElites} 처치`;
    if (wave.type === "collect") return `수집: 보급품 ${wave.targetCollect}개`;
    if (wave.type === "escort") return `호위: ${wave.duration}초 신호기 보호`;
    if (wave.type === "boss") return "보스전: 보스 처치";
    return "특수 웨이브";
  }

  updateBossBar() {
    if (!this.bossBar) {
      return;
    }

    const boss = this.game.getLivingBoss();
    if (!boss) {
      this.bossBar.classList.add("hidden");
      return;
    }

    this.bossName.textContent = boss.name;
    this.bossHpText.textContent = `${Math.ceil(boss.hp)} / ${Math.ceil(boss.maxHp)}`;
    this.bossHpFill.style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
    this.bossBar.classList.remove("hidden");
  }

  updateDebugPanel() {
    if (!this.debugPanel) {
      return;
    }

    const totalDrops = this.game.xpOrbs.length + this.game.goldOrbs.length;
    this.debugPanel.innerHTML = `FPS ${this.game.fps || 0}<br>E ${this.game.enemies.length} P ${this.game.projectiles.length}<br>H ${this.game.hazards.length} O ${this.game.mapObjects.length} D ${totalDrops}`;
  }

  updateTargetControls() {
    for (const button of this.targetModeButtons) {
      button.classList.toggle("is-active", button.dataset.targetMode === this.game.targetMode);
    }

    if (this.targetLockButton) {
      this.targetLockButton.classList.toggle("is-active", this.game.targetLockEnabled);
      this.targetLockButton.setAttribute("aria-pressed", String(this.game.targetLockEnabled));
      this.targetLockButton.textContent = this.game.targetLockEnabled ? "고정 ON" : "고정 OFF";
    }
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


