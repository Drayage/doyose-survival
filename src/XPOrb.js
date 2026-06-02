import { circleCollision, normalize } from "./utils.js";

export class XPOrb {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 7;
    this.isDead = false;
  }

  update(deltaTime, game) {
    const pickupRadius = game.player.getXpPickupRadius();
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= pickupRadius) {
      const direction = normalize(dx, dy);
      const speed = dist < 28 ? 580 : 280;
      this.x += direction.x * speed * deltaTime;
      this.y += direction.y * speed * deltaTime;
    }

    if (circleCollision(this, game.player)) {
      game.player.gainExp(this.value);
      this.isDead = true;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = "#59ff30";
    ctx.strokeStyle = "#159e32";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius - 3);
    ctx.lineTo(this.radius + 4, 0);
    ctx.lineTo(0, this.radius + 5);
    ctx.lineTo(-this.radius - 4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.moveTo(-2, -this.radius + 1);
    ctx.lineTo(3, 0);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
