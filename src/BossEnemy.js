import { bossData } from "./data/bosses.js?v=text-refactor-2";
import { Hazard, createProjectileHazard } from "./Hazard.js";
import { clamp, normalize } from "./utils.js";

export class BossEnemy {
  constructor(bossId, x, y, modifier = {}) {
    const data = bossData[bossId];
    if (!data) {
      throw new Error(`Unknown boss id: ${bossId}`);
    }

    this.type = bossId;
    this.bossId = bossId;
    this.name = data.name;
    this.x = x;
    this.y = y;
    this.maxHp = data.hp * (modifier.enemyHpMultiplier ?? 1);
    this.hp = this.maxHp;
    this.speed = data.speed * (modifier.enemySpeedMultiplier ?? 1);
    this.damage = data.damage * (modifier.enemyDamageMultiplier ?? 1);
    this.radius = data.radius;
    this.color = data.color;
    this.reward = data.reward;
    this.patterns = data.patterns.map((pattern) => ({ ...pattern, timer: pattern.interval * 0.5 }));
    this.isBoss = true;
    this.isElite = false;
    this.isDead = false;
    this.rewardClaimed = false;
    this.contactCooldown = 0;
    this.chargeRemaining = 0;
    this.chargeDirection = { x: 0, y: 0 };
  }

  update(deltaTime, game) {
    const escortTarget = game.getEscortObject?.();
    const target =
      escortTarget && Math.hypot(escortTarget.x - this.x, escortTarget.y - this.y) < 460
        ? escortTarget
        : game.player;
    this.contactCooldown = Math.max(0, this.contactCooldown - deltaTime);
    this.updatePatterns(deltaTime, game);

    if (this.chargeRemaining > 0) {
      this.chargeRemaining -= deltaTime;
      this.x += this.chargeDirection.x * this.speed * this.chargeSpeedMultiplier * deltaTime;
      this.y += this.chargeDirection.y * this.speed * this.chargeSpeedMultiplier * deltaTime;
    } else {
      const direction = normalize(target.x - this.x, target.y - this.y);
      this.x += direction.x * this.speed * deltaTime;
      this.y += direction.y * this.speed * deltaTime;
    }

    const touchingPlayer =
      Math.hypot(this.x - game.player.x, this.y - game.player.y) <= this.radius + game.player.hitRadius;
    if (touchingPlayer && this.contactCooldown <= 0) {
      game.player.takeDamage(this.damage);
      this.contactCooldown = 0.7;
    }

    const touchingEscort =
      escortTarget &&
      Math.hypot(this.x - escortTarget.x, this.y - escortTarget.y) <= this.radius + escortTarget.radius;
    if (touchingEscort && this.contactCooldown <= 0) {
      escortTarget.takeDamage(this.damage, game, { source: "enemy" });
      this.contactCooldown = 0.7;
    }
  }

  updatePatterns(deltaTime, game) {
    for (const pattern of this.patterns) {
      pattern.timer -= deltaTime;
      if (pattern.timer > 0) {
        continue;
      }

      this.triggerPattern(pattern, game);
      pattern.timer = pattern.interval;
    }
  }

  triggerPattern(pattern, game) {
    if (pattern.type === "charge") {
      this.chargeDirection = normalize(game.player.x - this.x, game.player.y - this.y);
      this.chargeRemaining = pattern.duration;
      this.chargeSpeedMultiplier = pattern.speedMultiplier;
      return;
    }

    if (pattern.type === "shockwave") {
      game.hazards.push(
        new Hazard({
          x: this.x,
          y: this.y,
          radius: pattern.radius,
          damage: pattern.damage,
          duration: 0.72,
          delay: 0.42,
          color: "rgba(213, 182, 125, 0.42)",
        }),
      );
      return;
    }

    if (pattern.type === "firePool") {
      game.hazards.push(
        new Hazard({
          x: game.player.x,
          y: game.player.y,
          radius: pattern.radius,
          damage: pattern.damage,
          duration: pattern.duration,
          delay: 0.55,
          color: "rgba(255, 92, 52, 0.5)",
        }),
      );
      return;
    }

    if (pattern.type === "fireball") {
      game.hazards.push(
        createProjectileHazard(this, game.player, {
          radius: 13,
          damage: pattern.damage,
          speed: pattern.speed,
          life: 4,
          color: "rgba(255, 112, 50, 0.78)",
        }),
      );
      return;
    }

    if (pattern.type === "bulletRing") {
      for (let i = 0; i < pattern.count; i += 1) {
        const angle = (Math.PI * 2 * i) / pattern.count;
        game.hazards.push(
          new Hazard({
            x: this.x,
            y: this.y,
            radius: 9,
            damage: pattern.damage,
            duration: 4,
            color: "rgba(144, 206, 255, 0.72)",
            type: "projectile",
            vx: Math.cos(angle) * pattern.speed,
            vy: Math.sin(angle) * pattern.speed,
          }),
        );
      }
      return;
    }

    if (pattern.type === "missile") {
      game.hazards.push(
        new Hazard({
          x: game.player.x,
          y: game.player.y,
          radius: pattern.radius,
          damage: pattern.damage,
          duration: 0.56,
          delay: pattern.duration,
          color: "rgba(255, 226, 95, 0.48)",
        }),
      );
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.isDead = true;
    }
    return amount;
  }

  render(ctx) {
    const hpRatio = clamp(this.hp / this.maxHp, 0, 1);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = "rgba(25, 21, 20, 0.3)";
    ctx.beginPath();
    ctx.ellipse(0, this.radius + 12, this.radius * 0.9, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.strokeStyle = "#17191f";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-this.radius * 0.78, -this.radius, this.radius * 1.56, this.radius * 1.75, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#10141c";
    ctx.beginPath();
    ctx.arc(-this.radius * 0.28, -this.radius * 0.38, 4, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.28, -this.radius * 0.38, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.roundRect(-this.radius * 0.46, -this.radius * 0.08, this.radius * 0.92, this.radius * 0.2, 5);
    ctx.fill();

    ctx.fillStyle = "#151922";
    ctx.fillRect(-this.radius, -this.radius - 22, this.radius * 2, 7);
    ctx.fillStyle = "#ff6a55";
    ctx.fillRect(-this.radius, -this.radius - 22, this.radius * 2 * hpRatio, 7);
    ctx.restore();
  }
}
