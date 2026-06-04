import { eliteData } from "./data/elites.js?v=text-refactor-2";
import { Enemy } from "./Enemy.js";
import { normalize } from "./utils.js";

export class EliteEnemy extends Enemy {
  constructor(eliteId, x, y, modifier = {}) {
    const data = eliteData[eliteId];
    if (!data) {
      throw new Error(`Unknown elite id: ${eliteId}`);
    }

    super(data.baseEnemyType, x, y, {
      ...modifier,
      enemyHpMultiplier: (modifier.enemyHpMultiplier ?? 1) * data.hpMultiplier,
      enemySpeedMultiplier: (modifier.enemySpeedMultiplier ?? 1) * data.speedMultiplier,
      enemyDamageMultiplier: (modifier.enemyDamageMultiplier ?? 1) * data.damageMultiplier,
    });

    this.eliteId = eliteId;
    this.name = data.name;
    this.radius *= data.radiusMultiplier;
    this.color = data.color;
    this.ability = data.ability;
    this.eliteData = data;
    this.isElite = true;
    this.reward = data.reward;
    this.chargeTimer = data.chargeInterval ?? 0;
    this.chargeRemaining = 0;
    this.chargeDirection = { x: 0, y: 0 };
  }

  update(deltaTime, game) {
    if (this.ability === "charge") {
      this.updateCharge(deltaTime, game);
      return;
    }

    super.update(deltaTime, game);
  }

  updateCharge(deltaTime, game) {
    const escortTarget = game.getEscortObject?.();
    const target =
      escortTarget && Math.hypot(escortTarget.x - this.x, escortTarget.y - this.y) < 420
        ? escortTarget
        : game.player;
    this.contactCooldown = Math.max(0, this.contactCooldown - deltaTime);
    this.chargeTimer -= deltaTime;

    if (this.chargeRemaining <= 0 && this.chargeTimer <= 0) {
      this.chargeDirection = normalize(target.x - this.x, target.y - this.y);
      this.chargeRemaining = this.eliteData.chargeDuration;
      this.chargeTimer = this.eliteData.chargeInterval;
    }

    if (this.chargeRemaining > 0) {
      this.chargeRemaining -= deltaTime;
      this.x += this.chargeDirection.x * this.speed * this.eliteData.chargeSpeedMultiplier * deltaTime;
      this.y += this.chargeDirection.y * this.speed * this.eliteData.chargeSpeedMultiplier * deltaTime;
    } else {
      const direction = normalize(target.x - this.x, target.y - this.y);
      this.x += direction.x * this.speed * deltaTime;
      this.y += direction.y * this.speed * deltaTime;
    }

    const touchingPlayer =
      Math.hypot(this.x - game.player.x, this.y - game.player.y) <= this.radius + game.player.hitRadius;
    if (touchingPlayer && this.contactCooldown <= 0) {
      game.player.takeDamage(this.damage * (this.chargeRemaining > 0 ? 1.5 : 1));
      this.contactCooldown = 0.65;
    }

    const touchingEscort =
      escortTarget &&
      Math.hypot(this.x - escortTarget.x, this.y - escortTarget.y) <= this.radius + escortTarget.radius;
    if (touchingEscort && this.contactCooldown <= 0) {
      escortTarget.takeDamage(this.damage * (this.chargeRemaining > 0 ? 1.5 : 1), game, { source: "enemy" });
      this.contactCooldown = 0.65;
    }
  }

  render(ctx) {
    super.render(ctx);

    ctx.save();
    ctx.strokeStyle = this.ability === "aura" ? "rgba(255, 214, 92, 0.45)" : "rgba(255,255,255,0.34)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 7, 0, Math.PI * 2);
    ctx.stroke();

    if (this.ability === "aura") {
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#ffd65c";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.eliteData.auraRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
