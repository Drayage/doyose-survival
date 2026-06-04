import { circleCollision } from "./utils.js";

export class Projectile {
  constructor({
    x,
    y,
    vx,
    vy,
    damage,
    radius,
    life,
    color = "#f5e06f",
    damageType = "projectile",
    pierce = 0,
    target = null,
    explosionRadius = 0,
    explosionDamage = 0,
    effectType = "bullet",
  }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = radius;
    this.life = life;
    this.color = color;
    this.damageType = damageType;
    this.pierce = pierce;
    this.target = target;
    this.explosionRadius = explosionRadius;
    this.explosionDamage = explosionDamage;
    this.effectType = effectType;
    this.trailTimer = 0;
    this.isDead = false;
  }

  update(deltaTime, game) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;
    this.trailTimer -= deltaTime;

    if (this.trailTimer <= 0) {
      this.emitTrail(game);
      this.trailTimer = this.effectType === "missile" ? 0.045 : 0.08;
    }

    if (this.life <= 0 || Math.hypot(this.x - game.player.x, this.y - game.player.y) > 1800) {
      this.isDead = true;
      return;
    }

    if (this.target && this.isTargetHittable(this.target, game) && circleCollision(this, this.target)) {
      this.hitTarget(this.target, game);
      return;
    }

    for (const enemy of game.enemies) {
      if (!enemy.isDead && circleCollision(this, enemy)) {
        this.hitTarget(enemy, game);
        if (this.isDead) break;
      }
    }

    if (this.isDead) {
      return;
    }

    for (const object of game.mapObjects ?? []) {
      if (!object.isDead && !object.data.collectible && circleCollision(this, object)) {
        this.hitTarget(object, game);
        break;
      }
    }
  }

  isTargetHittable(target, game) {
    if (!target || target.isDead) {
      return false;
    }

    if (target.data) {
      return (game.mapObjects ?? []).includes(target) && !target.data.collectible;
    }

    return (game.enemies ?? []).includes(target) && !target.isGhost;
  }

  hitTarget(target, game) {
    if (target.data) {
      const dealt = target.takeDamage(this.damage, game) ?? this.damage;
      if (dealt > 0) {
        game.addDamageText(target.x, target.y - target.radius, dealt, "#f2c84b");
      }
      this.explode(game, target);
      this.isDead = true;
      return;
    }

    const dealt = target.takeDamage(this.damage, {
      source: "projectile",
      damageType: this.damageType,
      vx: this.vx,
      vy: this.vy,
      originX: game.player.x,
      originY: game.player.y,
    });
    game.addDamageText(target.x, target.y - target.radius, dealt);
    this.explode(game, target);
    if (this.pierce > 0) {
      this.pierce -= 1;
    } else {
      this.isDead = true;
    }
  }

  explode(game, excludedTarget = null) {
    if (this.explosionRadius <= 0 || this.explosionDamage <= 0) {
      return;
    }

    game.damageEnemiesInRadius?.(
      this.x,
      this.y,
      this.explosionRadius,
      this.explosionDamage,
      { source: "explosion", damageType: "explosive" },
      excludedTarget,
      "#ffbf75",
    );
    game.addVisualEffect?.({
      type: "burst",
      x: this.x,
      y: this.y,
      radius: this.explosionRadius,
      color: "#ffcf6b",
      secondaryColor: "rgba(255,96,62,0.36)",
      duration: 0.38,
      width: 4,
      count: 14,
    });
  }

  emitTrail(game) {
    if (this.effectType === "missile") {
      game.addVisualEffect?.({
        type: "smoke",
        x: this.x - this.vx * 0.018,
        y: this.y - this.vy * 0.018,
        radius: 20,
        color: "rgba(80,86,94,0.42)",
        duration: 0.42,
        count: 4,
      });
    } else if (this.effectType === "smg") {
      game.addVisualEffect?.({
        type: "smoke",
        x: this.x - this.vx * 0.012,
        y: this.y - this.vy * 0.012,
        radius: 10,
        color: "rgba(190,236,255,0.2)",
        duration: 0.18,
        count: 2,
      });
    }
  }

  render(ctx) {
    const angle = Math.atan2(this.vy, this.vx);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    if (this.effectType === "missile") {
      ctx.strokeStyle = "rgba(255,222,128,0.72)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-28, 0);
      ctx.lineTo(-8, 0);
      ctx.stroke();

      ctx.fillStyle = this.color;
      ctx.strokeStyle = "#322733";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.radius + 12, 0);
      ctx.lineTo(0, -this.radius);
      ctx.lineTo(-this.radius - 6, -this.radius * 0.6);
      ctx.lineTo(-this.radius - 2, 0);
      ctx.lineTo(-this.radius - 6, this.radius * 0.6);
      ctx.lineTo(0, this.radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ff9b45";
      ctx.beginPath();
      ctx.moveTo(-this.radius - 7, 0);
      ctx.lineTo(-this.radius - 18, -4);
      ctx.lineTo(-this.radius - 18, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.strokeStyle = this.effectType === "smg" ? "rgba(155,226,255,0.58)" : "rgba(255,255,255,0.62)";
    ctx.lineWidth = this.effectType === "smg" ? 2 : 3;
    ctx.beginPath();
    ctx.moveTo(this.effectType === "smg" ? -14 : -20, 0);
    ctx.lineTo(-6, 0);
    ctx.stroke();

    ctx.fillStyle = this.color;
    ctx.strokeStyle = "#4d3422";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.radius + 7, 0);
    ctx.lineTo(-this.radius, -this.radius);
    ctx.lineTo(-this.radius + 2, 0);
    ctx.lineTo(-this.radius, this.radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
