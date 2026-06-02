import { circleCollision, normalize } from "./utils.js";

export class GoldOrb {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 6;
    this.isDead = false;
  }

  update(deltaTime, game) {
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= 90) {
      const direction = normalize(dx, dy);
      this.x += direction.x * 240 * deltaTime;
      this.y += direction.y * 240 * deltaTime;
    }

    if (circleCollision(this, game.player)) {
      game.player.gold += this.value;
      this.isDead = true;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = "#f8cf43";
    ctx.strokeStyle = "#9d6420";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff1a8";
    ctx.beginPath();
    ctx.arc(this.x - 2, this.y - 2, this.radius * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
