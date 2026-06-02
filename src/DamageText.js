export class DamageText {
  constructor(x, y, value, color = "#ffe15a") {
    this.x = x;
    this.y = y;
    this.value = Math.round(value);
    this.color = color;
    this.life = 0.62;
    this.maxLife = 0.62;
    this.vx = (Math.random() - 0.5) * 36;
    this.vy = -78 - Math.random() * 24;
    this.isDead = false;
  }

  update(deltaTime) {
    this.life -= deltaTime;
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.vy += 70 * deltaTime;

    if (this.life <= 0) {
      this.isDead = true;
    }
  }

  render(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "800 20px Segoe UI, sans-serif";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(24, 21, 20, 0.9)";
    ctx.fillStyle = this.color;
    ctx.strokeText(this.value, this.x, this.y);
    ctx.fillText(this.value, this.x, this.y);
    ctx.restore();
  }
}
