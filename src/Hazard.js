import { circleCollision, normalize } from "./utils.js";

export class Hazard {
  constructor({ x, y, radius, damage, duration = 0.7, delay = 0, color = "#ff835f", type = "zone", vx = 0, vy = 0 }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.damage = damage;
    this.duration = duration;
    this.maxDuration = duration;
    this.delay = delay;
    this.color = color;
    this.type = type;
    this.vx = vx;
    this.vy = vy;
    this.hitCooldown = 0;
    this.isDead = false;
  }

  update(deltaTime, game) {
    if (this.delay > 0) {
      this.delay -= deltaTime;
      return;
    }

    this.duration -= deltaTime;
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.hitCooldown = Math.max(0, this.hitCooldown - deltaTime);

    if (circleCollision(this, game.player) && this.hitCooldown <= 0) {
      game.player.takeDamage(this.damage);
      this.hitCooldown = this.type === "zone" ? 0.55 : 999;
      if (this.type === "projectile") {
        this.isDead = true;
      }
    }

    if (this.duration <= 0) {
      this.isDead = true;
    }
  }

  render(ctx) {
    const active = this.delay <= 0;
    const alpha = active ? Math.max(0.18, this.duration / this.maxDuration) : 0.22;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export function createProjectileHazard(from, to, options) {
  const direction = normalize(to.x - from.x, to.y - from.y);
  return new Hazard({
    x: from.x,
    y: from.y,
    radius: options.radius ?? 10,
    damage: options.damage,
    duration: options.life ?? 4,
    color: options.color,
    type: "projectile",
    vx: direction.x * options.speed,
    vy: direction.y * options.speed,
  });
}
