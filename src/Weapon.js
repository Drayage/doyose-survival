import { passiveLabels, weaponData, WEAPON_PART_SLOTS } from "./data/weapons.js";
import { partSynergyData } from "./data/parts.js";
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
    };

    const applyEffect = (effect) => {
      if (effect.op === "multiply") {
        modifiers[effect.stat] *= effect.value;
      } else if (effect.op === "add") {
        modifiers[effect.stat] += effect.value;
      }
    };

    for (const part of this.parts) {
      for (const effect of part.effects) {
        applyEffect(effect);
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

    return Object.values(partSynergyData).filter(
      (synergy) => (counts.get(synergy.tag) ?? 0) >= synergy.minCount,
    );
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
          part.projectileCountBonus,
      ),
      projectileRadius: data.projectileRadius ? data.projectileRadius * area : 0,
      projectileSpeed,
      orbitRadius: data.orbitRadius ? data.orbitRadius * area : 0,
      bladeRadius: data.bladeRadius ? data.bladeRadius * area : 0,
      bladeCount: data.bladeCount ? data.bladeCount + Math.floor((level - 1) / 2) : 0,
      orbitSpeed: data.orbitSpeed ? data.orbitSpeed * part.orbitSpeedMultiplier : 0,
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

    this.cooldownRemaining -= deltaTime;
    if (this.cooldownRemaining > 0) {
      return;
    }

    const target = game.getNearestEnemy(game.player.x, game.player.y);
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

    game.projectiles.push(
      new Projectile({
        x: game.player.x + direction.x * (game.player.radius + 8),
        y: game.player.y + direction.y * (game.player.radius + 8),
        vx: direction.x * stats.projectileSpeed,
        vy: direction.y * stats.projectileSpeed,
        damage: stats.damage,
        radius: stats.projectileRadius,
        life: this.data.projectileLife,
        color: this.type === "spread" ? "#ffbf75" : "#f5e06f",
      }),
    );
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
          enemy.takeDamage(stats.damage);
          game.addDamageText(enemy.x, enemy.y - enemy.radius, stats.damage, "#f8f3ff");
          enemy.x += direction.x * 18;
          enemy.y += direction.y * 18;
        }
      }
    }

    this.cooldownRemaining = stats.cooldown;
  }

  render(ctx, game) {
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
  } else {
    changes.push(`투사체 ${current.projectileCount} → ${next.projectileCount}`);
    changes.push(`탄 크기 ${current.projectileRadius.toFixed(1)}`);
  }

  return changes.join("\n");
}
