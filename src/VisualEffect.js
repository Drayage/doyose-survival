export class VisualEffect {
  constructor(options) {
    this.type = options.type;
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.from = options.from ?? { x: this.x, y: this.y };
    this.to = options.to ?? { x: this.x, y: this.y };
    this.radius = options.radius ?? 24;
    this.color = options.color ?? "#ffffff";
    this.secondaryColor = options.secondaryColor ?? "rgba(255,255,255,0.5)";
    this.duration = options.duration ?? 0.35;
    this.maxDuration = this.duration;
    this.width = options.width ?? 3;
    this.count = options.count ?? 8;
    this.seed = options.seed ?? Math.random() * 1000;
    this.isDead = false;
  }

  update(deltaTime) {
    this.duration -= deltaTime;
    if (this.duration <= 0) {
      this.isDead = true;
    }
  }

  render(ctx) {
    const t = 1 - this.duration / this.maxDuration;
    const alpha = Math.max(0, 1 - t);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.type === "ring" || this.type === "pulse") {
      this.renderRing(ctx, t);
    } else if (this.type === "bolt") {
      this.renderBolt(ctx, t);
    } else if (this.type === "droneStrike") {
      this.renderDroneStrike(ctx, t);
    } else if (this.type === "burst") {
      this.renderBurst(ctx, t);
    } else if (this.type === "smoke") {
      this.renderSmoke(ctx, t);
    }

    ctx.restore();
  }

  renderRing(ctx, t) {
    const radius = this.radius * (0.45 + t * 0.75);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width * (1 - t) + 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = this.secondaryColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius * 0.62, 0, Math.PI * 2);
    ctx.stroke();
  }

  renderBolt(ctx, t) {
    const points = this.makeJaggedPoints(this.from, this.to, 6, 12 * (1 - t));
    ctx.strokeStyle = this.secondaryColor;
    ctx.lineWidth = this.width + 4;
    this.strokePath(ctx, points);

    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    this.strokePath(ctx, points);
  }

  renderDroneStrike(ctx, t) {
    const dx = this.to.x - this.from.x;
    const dy = this.to.y - this.from.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.hypot(dx, dy);

    ctx.save();
    ctx.translate(this.from.x, this.from.y);
    ctx.rotate(angle);
    ctx.strokeStyle = this.secondaryColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(distance, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < this.count; i += 1) {
      const p = (i / this.count + t * 1.5) % 1;
      const bob = Math.sin((p * 9 + this.seed) * Math.PI) * 8;
      ctx.fillStyle = i % 2 === 0 ? this.color : this.secondaryColor;
      ctx.beginPath();
      ctx.ellipse(distance * p, bob, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderBurst(ctx, t) {
    ctx.fillStyle = this.secondaryColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * (0.25 + t * 0.55), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    for (let i = 0; i < this.count; i += 1) {
      const angle = (Math.PI * 2 * i) / this.count + this.seed;
      const inner = this.radius * (0.18 + t * 0.2);
      const outer = this.radius * (0.45 + t * 0.75);
      ctx.beginPath();
      ctx.moveTo(this.x + Math.cos(angle) * inner, this.y + Math.sin(angle) * inner);
      ctx.lineTo(this.x + Math.cos(angle) * outer, this.y + Math.sin(angle) * outer);
      ctx.stroke();
    }
  }

  renderSmoke(ctx, t) {
    ctx.fillStyle = this.color;
    for (let i = 0; i < this.count; i += 1) {
      const angle = this.seed + i * 1.7;
      const drift = this.radius * t * (0.35 + i / this.count);
      const r = this.radius * (0.12 + t * 0.08);
      ctx.beginPath();
      ctx.arc(this.x + Math.cos(angle) * drift, this.y + Math.sin(angle) * drift, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  makeJaggedPoints(from, to, segments, jitter) {
    const points = [];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;

    for (let i = 0; i <= segments; i += 1) {
      const p = i / segments;
      const offset = i === 0 || i === segments ? 0 : Math.sin((this.seed + i) * 12.9898) * jitter;
      points.push({
        x: from.x + dx * p + nx * offset,
        y: from.y + dy * p + ny * offset,
      });
    }

    return points;
  }

  strokePath(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }
}
