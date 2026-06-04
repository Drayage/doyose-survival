import { passiveLabels, weaponData, WEAPON_PART_SLOTS } from "./data/weapons.js?v=text-refactor-2";
import { duplicateEfficiency, partSynergyData } from "./data/parts.js";
import { Projectile } from "./Projectile.js";
import { normalize } from "./utils.js";

export class Weapon {
  constructor(id) {
    const data = weaponData[id];
    if (!data) {
      throw new Error(`Unknown weapon id: ${id}`);
    }

    this.id = id;
    this.name = data.name;
    this.type = data.type;
    this.level = 1;
    this.maxLevel = data.maxLevel;
    this.parts = [];
    this.maxPartSlots = WEAPON_PART_SLOTS;
    this.evolutionId = data.evolutionId ?? null;
    this.evolvedFrom = data.evolvedFrom ?? null;
    this.cooldownRemaining = Math.random() * data.cooldown;
    this.orbitAngle = 0;
  }

  get data() {
    return weaponData[this.id];
  }

  supportsPassive(stat) {
    return this.data.applicablePassives.includes(stat);
  }

  getPartModifiers() {
    const modifiers = {
      damageMultiplier: 1,
      cooldownMultiplier: 1,
      areaMultiplier: 1,
      projectileCountBonus: 0,
      projectileSpeedMultiplier: 1,
      orbitSpeedMultiplier: 1,
      bladeCountBonus: 0,
      explosionRadius: 0,
      chainCount: 0,
      pierceCount: 0,
      burnPower: 0,
      poisonPower: 0,
      trackingStrength: 0,
      firePoolReady: 0,
      secondaryExplosionReady: 0,
      chainNoPenaltyReady: 0,
      splitInheritReady: 0,
      poisonStackReady: 0,
    };

    const applyEffect = (effect, efficiency = 1) => {
      if (effect.op === "multiply") {
        modifiers[effect.stat] *= 1 + (effect.value - 1) * efficiency;
      } else if (effect.op === "add") {
        modifiers[effect.stat] += effect.value * efficiency;
      }
    };

    const duplicateCounts = new Map();
    for (const part of this.parts) {
      const duplicateIndex = duplicateCounts.get(part.id) ?? 0;
      duplicateCounts.set(part.id, duplicateIndex + 1);
      const efficiency = duplicateEfficiency[duplicateIndex] ?? duplicateEfficiency[duplicateEfficiency.length - 1];
      const effects = part.typeEffects?.[this.type] ?? part.effects ?? [];

      for (const effect of effects) {
        applyEffect(effect, efficiency);
      }
    }

    for (const synergy of this.getSynergies()) {
      for (const effect of synergy.effects) {
        applyEffect(effect);
      }
    }

    return modifiers;
  }

  getSynergies() {
    const counts = new Map();
    for (const part of this.parts) {
      for (const tag of part.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    return partSynergyData.filter((synergy) => (counts.get(synergy.tag) ?? 0) >= synergy.minCount);
  }

  getComputedStats(player, level = this.level) {
    const data = this.data;
    const part = this.getPartModifiers();
    const damage =
      (data.baseDamage + (level - 1) * 4) *
      player.passives.damageMultiplier *
      part.damageMultiplier;
    const cooldown = Math.max(
      0.08,
      (data.cooldown / player.passives.attackSpeedMultiplier) * part.cooldownMultiplier,
    );
    const projectileBonus = this.supportsPassive("projectileCountBonus")
      ? player.passives.projectileCountBonus
      : 0;
    const area =
      (this.supportsPassive("areaMultiplier") ? player.passives.areaMultiplier : 1) *
      part.areaMultiplier;
    const projectileSpeed = data.projectileSpeed
      ? data.projectileSpeed * player.passives.projectileSpeedMultiplier * part.projectileSpeedMultiplier
      : 0;

    return {
      damage,
      cooldown,
      projectileCount: Math.max(
        1,
        (data.pelletCount ?? data.bladeCount ?? 1) +
          Math.floor((level - 1) / 2) +
          projectileBonus +
          Math.floor(part.projectileCountBonus),
      ),
      projectileRadius: data.projectileRadius ? data.projectileRadius * area : 0,
      projectileSpeed,
      orbitRadius: data.orbitRadius ? data.orbitRadius * area : 0,
      bladeRadius: data.bladeRadius ? data.bladeRadius * area : 0,
      bladeCount: data.bladeCount ? data.bladeCount + Math.floor((level - 1) / 2) + Math.floor(part.bladeCountBonus) : 0,
      orbitSpeed: data.orbitSpeed ? data.orbitSpeed * part.orbitSpeedMultiplier : 0,
      explosionRadius: (data.explosionRadius ? data.explosionRadius * area : 0) + part.explosionRadius,
      explosionDamage: damage * (data.explosionDamageMultiplier ?? 0),
      chainCount: part.chainCount,
      pierceCount: part.pierceCount,
      chainRange: data.chainRange ? data.chainRange * area : 0,
      droneRange: data.droneRange ? data.droneRange * area : 0,
      pulseRadius: data.pulseRadius ? data.pulseRadius * area : 0,
      pullStrength: data.pullStrength ?? 0,
      burnPower: part.burnPower,
      poisonPower: part.poisonPower,
      trackingStrength: part.trackingStrength,
      firePoolReady: part.firePoolReady,
      secondaryExplosionReady: part.secondaryExplosionReady,
      chainNoPenaltyReady: part.chainNoPenaltyReady,
      splitInheritReady: part.splitInheritReady,
      poisonStackReady: part.poisonStackReady,
    };
  }

  getDamage(player) {
    return this.getComputedStats(player).damage;
  }

  getCooldown(player) {
    return this.getComputedStats(player).cooldown;
  }

  upgrade() {
    this.level = Math.min(this.maxLevel, this.level + 1);
  }

  update(deltaTime, game) {
    if (this.type === "orbit") {
      this.updateOrbit(deltaTime, game);
      return;
    }

    if (this.type === "drone") {
      this.orbitAngle += deltaTime * 4.2;
    }

    this.cooldownRemaining -= deltaTime;
    if (this.cooldownRemaining > 0) {
      return;
    }

    if (this.type === "pulse") {
      this.updatePulse(game);
      return;
    }

    if (this.type === "lightning") {
      this.updateLightning(game);
      return;
    }

    if (this.type === "drone") {
      this.updateDrone(game);
      return;
    }

    const target =
      this.type === "missile"
        ? game.getStrongestEnemy(game.player.x, game.player.y, game.getAutoAttackRange()) ??
          game.getAutoAttackTarget(game.player.x, game.player.y)
        : game.getAutoAttackTarget(game.player.x, game.player.y);
    if (!target) {
      return;
    }

    const stats = this.getComputedStats(game.player);
    const pelletCount = stats.projectileCount;
    const spread = this.type === "spread" ? this.data.spread : this.data.spread * (pelletCount - 1);
    const start = -spread / 2;
    const step = pelletCount > 1 ? spread / (pelletCount - 1) : 0;

    for (let i = 0; i < pelletCount; i += 1) {
      this.fireProjectileAt(target, game, start + step * i, stats);
    }

    this.cooldownRemaining = stats.cooldown;
  }

  fireProjectileAt(target, game, angleOffset, stats) {
    const baseAngle = Math.atan2(target.y - game.player.y, target.x - game.player.x);
    const angle = baseAngle + angleOffset;
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    const muzzle = {
      x: game.player.x + direction.x * (game.player.radius + 8),
      y: game.player.y + direction.y * (game.player.radius + 8),
    };

    game.addVisualEffect?.({
      type: "burst",
      x: muzzle.x,
      y: muzzle.y,
      radius: this.type === "missile" ? 22 : this.id === "smg" ? 9 : 13,
      color: this.type === "missile" ? "#ffba55" : "#fff4a8",
      secondaryColor: this.type === "missile" ? "rgba(255,94,52,0.25)" : "rgba(255,255,255,0.2)",
      duration: this.type === "missile" ? 0.16 : 0.09,
      width: 2,
      count: this.type === "spread" ? 6 : 4,
    });

    game.projectiles.push(
      new Projectile({
        x: muzzle.x,
        y: muzzle.y,
        vx: direction.x * stats.projectileSpeed,
        vy: direction.y * stats.projectileSpeed,
        damage: stats.damage,
        radius: stats.projectileRadius,
        life: this.data.projectileLife,
        color: this.data.projectileColor ?? (this.type === "spread" ? "#ffbf75" : "#f5e06f"),
        damageType: stats.pierceCount > 0 ? "pierce" : "projectile",
        pierce: Math.floor(stats.pierceCount),
        target,
        explosionRadius: stats.explosionRadius,
        explosionDamage: stats.explosionDamage,
        effectType: this.type === "missile" ? "missile" : this.id === "smg" ? "smg" : "bullet",
      }),
    );
  }

  updateDrone(game) {
    const stats = this.getComputedStats(game.player);
    const targets = this.getTargetsInRange(game, stats.droneRange)
      .sort((a, b) => Math.hypot(a.x - game.player.x, a.y - game.player.y) - Math.hypot(b.x - game.player.x, b.y - game.player.y))
      .slice(0, stats.projectileCount);

    for (const target of targets) {
      const dealt = target.takeDamage(stats.damage, { source: "drone", damageType: "projectile" });
      game.addDamageText(target.x, target.y - target.radius, dealt, "#b9f86d");
      game.addVisualEffect?.({
        type: "droneStrike",
        from: {
          x: game.player.x + Math.cos(this.orbitAngle + targets.indexOf(target)) * 34,
          y: game.player.y + Math.sin(this.orbitAngle + targets.indexOf(target)) * 34,
        },
        to: { x: target.x, y: target.y },
        color: "#b9f86d",
        secondaryColor: "rgba(118,255,185,0.34)",
        duration: 0.34,
        count: 5,
      });
    }

    this.cooldownRemaining = stats.cooldown;
  }

  updateLightning(game) {
    const stats = this.getComputedStats(game.player);
    const targets = this.getTargetsInRange(game, Math.max(game.getViewWidth(), game.getViewHeight()) * 0.75);
    const startTarget = targets[Math.floor(Math.random() * targets.length)];
    if (!startTarget) {
      return;
    }

    let current = startTarget;
    let previousTarget = null;
    const hit = new Set();
    const jumps = stats.projectileCount + Math.floor(stats.chainCount);
    for (let i = 0; i < jumps && current; i += 1) {
      hit.add(current);
      const dealt = current.takeDamage(stats.damage * Math.max(0.45, 1 - i * 0.18), {
        source: "lightning",
        damageType: "projectile",
      });
      game.addDamageText(current.x, current.y - current.radius, dealt, "#8fe8ff");
      game.addVisualEffect?.({
        type: "bolt",
        from: previousTarget ? { x: previousTarget.x, y: previousTarget.y } : { x: game.player.x, y: game.player.y - 18 },
        to: { x: current.x, y: current.y },
        color: "#dff8ff",
        secondaryColor: "rgba(72,201,255,0.45)",
        duration: 0.22,
        width: 3,
      });
      previousTarget = current;
      current = this.getNearestChainTarget(game, current, stats.chainRange, hit);
    }

    this.cooldownRemaining = stats.cooldown;
  }

  updatePulse(game) {
    const stats = this.getComputedStats(game.player);
    for (const enemy of game.enemies) {
      if (enemy.isDead || enemy.isGhost) {
        continue;
      }

      const distance = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
      if (distance > stats.pulseRadius + enemy.radius) {
        continue;
      }

      const dealt = enemy.takeDamage(stats.damage, { source: "pulse", damageType: "projectile" });
      game.addDamageText(enemy.x, enemy.y - enemy.radius, dealt, "#b78cff");
      const direction = normalize(game.player.x - enemy.x, game.player.y - enemy.y);
      const strength = Math.max(0.25, 1 - distance / stats.pulseRadius) * stats.pullStrength;
      enemy.x += direction.x * strength;
      enemy.y += direction.y * strength;
    }

    game.addVisualEffect?.({
      type: "pulse",
      x: game.player.x,
      y: game.player.y,
      radius: stats.pulseRadius,
      color: "rgba(190,120,255,0.84)",
      secondaryColor: "rgba(100,220,255,0.35)",
      duration: 0.48,
      width: 4,
    });

    this.cooldownRemaining = stats.cooldown;
  }

  getTargetsInRange(game, range) {
    return game.enemies.filter(
      (enemy) =>
        !enemy.isDead &&
        !enemy.isGhost &&
        Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y) <= range + enemy.radius,
    );
  }

  getNearestChainTarget(game, from, range, excluded) {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const enemy of game.enemies) {
      if (enemy.isDead || enemy.isGhost || excluded.has(enemy)) {
        continue;
      }

      const distance = Math.hypot(enemy.x - from.x, enemy.y - from.y);
      if (distance <= range && distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  updateOrbit(deltaTime, game) {
    const stats = this.getComputedStats(game.player);
    this.orbitAngle += stats.orbitSpeed * deltaTime;
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - deltaTime);

    if (this.cooldownRemaining > 0) {
      return;
    }

    for (let i = 0; i < stats.bladeCount; i += 1) {
      const angle = this.orbitAngle + (Math.PI * 2 * i) / stats.bladeCount;
      const blade = {
        x: game.player.x + Math.cos(angle) * stats.orbitRadius,
        y: game.player.y + Math.sin(angle) * stats.orbitRadius,
        radius: stats.bladeRadius,
      };

      for (const enemy of game.enemies) {
        if (enemy.isDead) {
          continue;
        }

        const direction = normalize(enemy.x - blade.x, enemy.y - blade.y);
        const hit = Math.hypot(enemy.x - blade.x, enemy.y - blade.y) <= enemy.radius + blade.radius;
        if (hit) {
          const dealt = enemy.takeDamage(stats.damage, { source: "orbit", damageType: "melee" });
          game.addDamageText(enemy.x, enemy.y - enemy.radius, dealt ?? stats.damage, "#f8f3ff");
          enemy.x += direction.x * 18;
          enemy.y += direction.y * 18;
        }
      }

      for (const object of game.mapObjects ?? []) {
        if (object.isDead || object.data.collectible) {
          continue;
        }
        const hit = Math.hypot(object.x - blade.x, object.y - blade.y) <= object.radius + blade.radius;
        if (hit) {
          const dealt = object.takeDamage(stats.damage, game) ?? stats.damage;
          if (dealt > 0) {
            game.addDamageText(object.x, object.y - object.radius, dealt, "#f2c84b");
          }
        }
      }
    }

    this.cooldownRemaining = stats.cooldown;
  }

  render(ctx, game) {
    if (this.type === "drone") {
      this.renderDrones(ctx, game);
      return;
    }

    if (this.type !== "orbit") {
      return;
    }

    const stats = this.getComputedStats(game.player);
    ctx.save();
    ctx.fillStyle = "#d9d7ff";
    ctx.strokeStyle = "rgba(217,215,255,0.22)";
    ctx.beginPath();
    ctx.arc(game.player.x, game.player.y, stats.orbitRadius, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < stats.bladeCount; i += 1) {
      const angle = this.orbitAngle + (Math.PI * 2 * i) / stats.bladeCount;
      ctx.beginPath();
      ctx.arc(
        game.player.x + Math.cos(angle) * stats.orbitRadius,
        game.player.y + Math.sin(angle) * stats.orbitRadius,
        stats.bladeRadius,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }

  renderDrones(ctx, game) {
    const stats = this.getComputedStats(game.player);
    const droneCount = Math.min(6, stats.projectileCount + 1);

    ctx.save();
    for (let i = 0; i < droneCount; i += 1) {
      const angle = this.orbitAngle + (Math.PI * 2 * i) / droneCount;
      const bob = Math.sin(Date.now() / 130 + i) * 2;
      const x = game.player.x + Math.cos(angle) * 38;
      const y = game.player.y + Math.sin(angle) * 30 + bob;

      ctx.fillStyle = "rgba(55, 255, 164, 0.18)";
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#b9f86d";
      ctx.strokeStyle = "#152c26";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, 7, 5, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#d9fff0";
      ctx.beginPath();
      ctx.ellipse(x - 5, y - 4, 5, 3, -0.6, 0, Math.PI * 2);
      ctx.ellipse(x + 5, y - 4, 5, 3, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function describeApplicablePassives(weaponId) {
  return weaponData[weaponId].applicablePassives.map((stat) => passiveLabels[stat]).join(", ");
}

export function describeWeaponStats(weaponId, player, level = 1) {
  const preview = new Weapon(weaponId);
  preview.level = level;
  const stats = preview.getComputedStats(player, level);
  const data = weaponData[weaponId];

  if (data.type === "orbit") {
    return `피해 ${Math.round(stats.damage)}, 쿨타임 ${stats.cooldown.toFixed(2)}초, 칼날 ${stats.bladeCount}개, 궤도 ${Math.round(stats.orbitRadius)}`;
  }

  if (data.type === "missile") {
    return `피해 ${Math.round(stats.damage)}, 쿨타임 ${stats.cooldown.toFixed(2)}초, 미사일 ${stats.projectileCount}발, 폭발 ${Math.round(stats.explosionRadius)}`;
  }

  if (data.type === "drone") {
    return `피해 ${Math.round(stats.damage)}, 쿨타임 ${stats.cooldown.toFixed(2)}초, 드론 ${stats.projectileCount}기, 범위 ${Math.round(stats.droneRange)}`;
  }

  if (data.type === "lightning") {
    return `피해 ${Math.round(stats.damage)}, 쿨타임 ${stats.cooldown.toFixed(2)}초, 낙뢰 ${stats.projectileCount}회, 연쇄 ${Math.round(stats.chainRange)}`;
  }

  if (data.type === "pulse") {
    return `피해 ${Math.round(stats.damage)}, 쿨타임 ${stats.cooldown.toFixed(2)}초, 자기장 ${Math.round(stats.pulseRadius)}`;
  }

  return `피해 ${Math.round(stats.damage)}, 쿨타임 ${stats.cooldown.toFixed(2)}초, 투사체 ${stats.projectileCount}개, 탄 크기 ${stats.projectileRadius.toFixed(1)}`;
}

export function describeUpgrade(weapon, player) {
  const current = weapon.getComputedStats(player, weapon.level);
  const next = weapon.getComputedStats(player, weapon.level + 1);
  const changes = [
    `피해 ${Math.round(current.damage)} → ${Math.round(next.damage)}`,
    `쿨타임 ${current.cooldown.toFixed(2)}초`,
  ];

  if (weapon.type === "orbit") {
    changes.push(`칼날 ${current.bladeCount} → ${next.bladeCount}`);
    changes.push(`범위 ${Math.round(current.orbitRadius)}`);
  } else if (weapon.type === "missile") {
    changes.push(`미사일 ${current.projectileCount} → ${next.projectileCount}`);
    changes.push(`폭발 범위 ${Math.round(current.explosionRadius)} → ${Math.round(next.explosionRadius)}`);
  } else if (weapon.type === "drone") {
    changes.push(`드론 ${current.projectileCount} → ${next.projectileCount}`);
    changes.push(`추적 범위 ${Math.round(current.droneRange)}`);
  } else if (weapon.type === "lightning") {
    changes.push(`낙뢰 ${current.projectileCount} → ${next.projectileCount}`);
    changes.push(`연쇄 범위 ${Math.round(current.chainRange)}`);
  } else if (weapon.type === "pulse") {
    changes.push(`자기장 범위 ${Math.round(current.pulseRadius)}`);
    changes.push(`당김 ${Math.round(current.pullStrength)}`);
  } else {
    changes.push(`투사체 ${current.projectileCount} → ${next.projectileCount}`);
    changes.push(`탄 크기 ${current.projectileRadius.toFixed(1)}`);
  }

  return changes.join("\n");
}
