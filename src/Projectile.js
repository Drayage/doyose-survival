import { circleCollision } from "./utils.js";

export class Projectile {
  constructor({ x, y, vx, vy, damage, radius, life, color = "#f5e06f" }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = radius;
    this.life = life;
    this.color = color;
    this.isDead = false;
  }

  update(deltaTime, game) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;

    if (this.life <= 0 || Math.hypot(this.x - game.player.x, this.y - game.player.y) > 1800) {
      this.isDead = true;
      return;
    }

    for (const enemy of game.enemies) {
      if (!enemy.isDead && circleCollision(this, enemy)) {
        enemy.takeDamage(this.damage);
        game.addDamageText(enemy.x, enemy.y - enemy.radius, this.damage);
        this.isDead = true;
        break;
      }
    }
  }

  render(ctx) {
    const angle = Math.atan2(this.vy, this.vx);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.strokeStyle = "rgba(255,255,255,0.62)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
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
