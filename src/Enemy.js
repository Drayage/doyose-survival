import { enemyData } from "./data/enemies.js";
import { clamp, normalize } from "./utils.js";

export class Enemy {
  constructor(type, x, y, modifier = {}) {
    const data = enemyData[type];
    if (!data) {
      throw new Error(`Unknown enemy type: ${type}`);
    }

    this.type = type;
    this.name = data.name;
    this.x = x;
    this.y = y;
    this.maxHp = data.hp * (modifier.enemyHpMultiplier ?? 1);
    this.hp = this.maxHp;
    this.speed = data.speed * (modifier.enemySpeedMultiplier ?? 1);
    this.damage = data.damage * (modifier.enemyDamageMultiplier ?? 1);
    this.radius = data.radius;
    this.rewardExp = Math.max(1, Math.round(data.rewardExp * (modifier.rewardExpMultiplier ?? 1)));
    this.rewardGold = Math.max(1, Math.round(data.rewardGold * (modifier.goldMultiplier ?? 1)));
    this.goldDropChance = data.goldDropChance;
    this.color = data.color;
    this.modifier = modifier;
    this.contactCooldown = 0;
    this.isDead = false;
    this.isGhost = Boolean(modifier.isGhost);
  }

  update(deltaTime, game) {
    const escortTarget = game.getEscortObject?.();
    const target =
      escortTarget && Math.hypot(escortTarget.x - this.x, escortTarget.y - this.y) < 420
        ? escortTarget
        : game.player;
    const direction = normalize(target.x - this.x, target.y - this.y);
    const hpMissingRatio = 1 - clamp(this.hp / this.maxHp, 0, 1);
    const frenzySpeed = 1 + hpMissingRatio * (this.modifier.lowHpSpeedBoost ?? 0);
    const auraSpeed = game.getEnemyMoveAuraMultiplier?.(this) ?? 1;
    this.x += direction.x * this.speed * frenzySpeed * auraSpeed * deltaTime;
    this.y += direction.y * this.speed * frenzySpeed * auraSpeed * deltaTime;
    this.contactCooldown = Math.max(0, this.contactCooldown - deltaTime);

    const touchingPlayer =
      Math.hypot(this.x - game.player.x, this.y - game.player.y) <=
      this.radius + game.player.hitRadius;
    const touchingEscort =
      escortTarget &&
      Math.hypot(this.x - escortTarget.x, this.y - escortTarget.y) <= this.radius + escortTarget.radius;

    if (!this.isGhost && touchingPlayer && this.contactCooldown <= 0) {
      game.player.takeDamage(this.damage);
      if (this.modifier.lifeStealOnHit) {
        this.hp = Math.min(this.maxHp, this.hp + this.damage * this.modifier.lifeStealOnHit);
      }
      this.contactCooldown = 0.65;
    }

    if (!this.isGhost && touchingEscort && this.contactCooldown <= 0) {
      escortTarget.takeDamage(this.damage, game, { source: "enemy" });
      this.contactCooldown = 0.65;
    }
  }

  takeDamage(amount, context = {}) {
    let finalAmount = amount;
    const modifier = this.modifier ?? {};

    if (context.source === "projectile" && modifier.frontalProjectileReduction) {
      const incomingX = context.vx ?? 0;
      const incomingY = context.vy ?? 0;
      const toPlayer = normalize(context.originX - this.x, context.originY - this.y);
      const incoming = normalize(incomingX, incomingY);
      const dot = incoming.x * toPlayer.x + incoming.y * toPlayer.y;
      if (dot > 0.35) {
        finalAmount *= modifier.frontalProjectileReduction;
      }
    }

    if (context.damageType === "explosive" && modifier.explosiveDamageTakenMultiplier) {
      finalAmount *= modifier.explosiveDamageTakenMultiplier;
    }

    if (modifier.genericDamageTakenMultiplier && context.damageType !== "pierce") {
      finalAmount *= modifier.genericDamageTakenMultiplier;
    }

    if (context.damageType === "pierce" && modifier.pierceDamageTakenMultiplier) {
      finalAmount *= modifier.pierceDamageTakenMultiplier;
    }

    this.hp -= finalAmount;
    if (this.hp <= 0) {
      this.isDead = true;
    }

    return finalAmount;
  }

  becomeGhost() {
    this.isGhost = true;
    this.maxHp = 1;
    this.hp = 1;
    this.damage = 0;
    this.rewardExp = 0;
    this.rewardGold = 0;
    this.goldDropChance = 0;
    this.speed *= 0.42;
  }

  render(ctx) {
    const hpRatio = clamp(this.hp / this.maxHp, 0, 1);
    const bob = Math.sin((this.x + this.y) * 0.04) * 2;

    ctx.save();
    if (this.isGhost) {
      ctx.globalAlpha = 0.38;
    }
    ctx.translate(this.x, this.y + bob);

    ctx.fillStyle = "rgba(45, 38, 45, 0.25)";
    ctx.beginPath();
    ctx.ellipse(0, this.radius + 7, this.radius * 0.9, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === "runner") {
      this.renderButterfly(ctx);
    } else {
      this.renderWalker(ctx);
    }

    if (!this.isGhost) {
      ctx.fillStyle = "#151922";
      ctx.fillRect(-this.radius, -this.radius - 13, this.radius * 2, 5);
      ctx.fillStyle = "#55e173";
      ctx.fillRect(-this.radius, -this.radius - 13, this.radius * 2 * hpRatio, 5);
    }
    ctx.restore();
  }

  renderWalker(ctx) {
    const scale = this.radius / 16;
    ctx.save();
    ctx.scale(scale, scale);
    ctx.fillStyle = this.color ?? (this.type === "brute" ? "#8d9d89" : "#9ec08e");
    ctx.strokeStyle = "#24242a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-12, -18, 24, 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#28394e";
    ctx.fillRect(-12, 2, 24, 16);
    ctx.strokeRect(-12, 2, 24, 16);

    ctx.fillStyle = "#d9272d";
    ctx.fillRect(-10, 15, 8, 4);
    ctx.fillRect(2, 15, 8, 4);

    ctx.fillStyle = "#1a1d23";
    ctx.beginPath();
    ctx.arc(-5, -8, 2.2, 0, Math.PI * 2);
    ctx.arc(5, -8, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f4efe6";
    ctx.fillRect(-5, -1, 10, 2);
    ctx.restore();
  }

  renderButterfly(ctx) {
    const scale = this.radius / 13;
    ctx.save();
    ctx.scale(scale, scale);
    ctx.fillStyle = "#9be5ff";
    ctx.strokeStyle = "#22608a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-8, -5, 7, 12, -0.3, 0, Math.PI * 2);
    ctx.ellipse(8, -5, 7, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#5aa8ee";
    ctx.beginPath();
    ctx.ellipse(-6, -4, 3, 7, -0.3, 0, Math.PI * 2);
    ctx.ellipse(6, -4, 3, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#25334b";
    ctx.beginPath();
    ctx.roundRect(-3, -12, 6, 20, 5);
    ctx.fill();
    ctx.restore();
  }
}
