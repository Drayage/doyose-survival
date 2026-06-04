import { mapObjectData } from "./data/mapObjects.js";
import { GoldOrb } from "./GoldOrb.js";
import { XPOrb } from "./XPOrb.js";
import { clamp, randomBetween } from "./utils.js";

export class MapObject {
  constructor(type, x, y) {
    const data = mapObjectData[type];
    if (!data) {
      throw new Error(`Unknown map object type: ${type}`);
    }

    this.type = type;
    this.name = data.name;
    this.x = x;
    this.y = y;
    this.maxHp = data.hp;
    this.hp = data.hp;
    this.radius = data.radius;
    this.color = data.color;
    this.data = data;
    this.age = 0;
    this.maxAge = data.maxAge ?? 150;
    this.hurtTimer = 0;
    this.isDead = false;
    this.rewardClaimed = false;
  }

  update(deltaTime, game) {
    this.age += deltaTime;
    this.hurtTimer = Math.max(0, this.hurtTimer - deltaTime);
    if (!this.data.collectible && !this.data.protected && this.age >= this.maxAge) {
      this.isDead = true;
      return;
    }

    if (!this.data.collectible) {
      return;
    }

    const distance = Math.hypot(this.x - game.player.x, this.y - game.player.y);
    if (distance <= this.radius + game.player.hitRadius + 8) {
      this.isDead = true;
      game.waveManager?.registerCollect?.();
      this.dropReward(game);
    }
  }

  takeDamage(amount, game, context = {}) {
    if (this.data.collectible) {
      return 0;
    }

    if (this.data.protected && context.source !== "enemy") {
      return 0;
    }

    const dealt = Math.min(this.hp, Math.max(0, amount));
    this.hp -= dealt;
    this.hurtTimer = 0.16;
    if (this.hp <= 0) {
      this.isDead = true;
      this.onDestroyed(game);
    }
    return dealt;
  }

  onDestroyed(game) {
    if (this.rewardClaimed) {
      return;
    }

    this.rewardClaimed = true;
    if (this.data.protected) {
      game.addDamageText(this.x, this.y - this.radius - 20, "호위 실패", "#ff6a55");
      game.setGameOver();
      return;
    }

    if (this.data.explosion) {
      game.explodeAt(this.x, this.y, this.data.explosion.radius, this.data.explosion.damage);
    }
    this.dropReward(game);
  }

  dropReward(game) {
    const reward = this.data.reward;
    if (!reward) {
      return;
    }

    const gold = this.rollRange(reward.gold);
    const exp = this.rollRange(reward.exp);
    const heal = this.rollRange(reward.heal);

    if (gold > 0) {
      game.goldOrbs.push(new GoldOrb(this.x + randomBetween(-10, 10), this.y + randomBetween(-10, 10), gold));
    }
    if (exp > 0) {
      game.xpOrbs.push(new XPOrb(this.x + randomBetween(-10, 10), this.y + randomBetween(-10, 10), exp));
    }
    if (heal > 0) {
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + heal);
      game.addDamageText(game.player.x, game.player.y - 54, `+${heal}`, "#8ee7c4");
    }
  }

  rollRange(range = [0, 0]) {
    return Math.round(randomBetween(range[0], range[1]));
  }

  render(ctx) {
    const hpRatio = clamp(this.hp / this.maxHp, 0, 1);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = "rgba(25, 22, 24, 0.22)";
    ctx.beginPath();
    ctx.ellipse(0, this.radius + 7, this.radius * 0.95, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.strokeStyle = "#17191f";
    ctx.lineWidth = 3;
    if (this.hurtTimer > 0) {
      ctx.shadowColor = "rgba(255,255,255,0.88)";
      ctx.shadowBlur = 14;
    }

    if (this.type === "barrel") {
      ctx.beginPath();
      ctx.roundRect(-this.radius * 0.72, -this.radius, this.radius * 1.44, this.radius * 1.8, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffd36c";
      ctx.strokeStyle = "#331414";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -this.radius * 0.62);
      ctx.lineTo(this.radius * 0.42, this.radius * 0.14);
      ctx.lineTo(-this.radius * 0.42, this.radius * 0.14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#351515";
      ctx.fillRect(-2, -this.radius * 0.34, 4, this.radius * 0.26);
      ctx.fillRect(-2, this.radius * 0.02, 4, 4);
      ctx.strokeStyle = "rgba(255,255,255,0.38)";
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.65, -this.radius * 0.2);
      ctx.lineTo(this.radius * 0.65, -this.radius * 0.2);
      ctx.moveTo(-this.radius * 0.65, this.radius * 0.45);
      ctx.lineTo(this.radius * 0.65, this.radius * 0.45);
      ctx.stroke();
    } else if (this.type === "oreVein") {
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, -2);
      ctx.lineTo(this.radius * 0.45, this.radius);
      ctx.lineTo(-this.radius * 0.8, this.radius * 0.72);
      ctx.lineTo(-this.radius, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.2, -this.radius * 0.65);
      ctx.lineTo(this.radius * 0.2, -this.radius * 0.08);
      ctx.lineTo(-this.radius * 0.05, this.radius * 0.62);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === "beacon") {
      ctx.beginPath();
      ctx.roundRect(-this.radius * 0.68, -this.radius * 0.62, this.radius * 1.36, this.radius * 1.2, 8);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#dffcf2";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -this.radius * 0.62);
      ctx.lineTo(0, -this.radius * 1.42);
      ctx.moveTo(-this.radius * 0.55, -this.radius * 1.0);
      ctx.quadraticCurveTo(0, -this.radius * 1.35, this.radius * 0.55, -this.radius * 1.0);
      ctx.moveTo(-this.radius * 0.35, -this.radius * 1.18);
      ctx.quadraticCurveTo(0, -this.radius * 1.4, this.radius * 0.35, -this.radius * 1.18);
      ctx.stroke();
    } else if (this.type === "cache") {
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, 0);
      ctx.lineTo(0, this.radius);
      ctx.lineTo(-this.radius, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff7b4";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.34, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.roundRect(-this.radius, -this.radius * 0.75, this.radius * 2, this.radius * 1.5, 7);
      ctx.fill();
      ctx.stroke();

      if (this.type === "chest") {
        ctx.strokeStyle = "#f8d796";
        ctx.lineWidth = 3;
        ctx.strokeRect(-this.radius * 0.58, -this.radius * 0.2, this.radius * 1.16, this.radius * 0.52);
        ctx.fillStyle = "#3b2616";
        ctx.beginPath();
        ctx.arc(0, this.radius * 0.05, this.radius * 0.14, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this.type === "supplyCrate") {
        ctx.fillStyle = "#e8fff5";
        ctx.fillRect(-this.radius * 0.18, -this.radius * 0.52, this.radius * 0.36, this.radius * 1.04);
        ctx.fillRect(-this.radius * 0.52, -this.radius * 0.18, this.radius * 1.04, this.radius * 0.36);
      }
    }

    if (this.hurtTimer > 0) {
      ctx.globalAlpha = Math.min(0.5, this.hurtTimer / 0.16);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (this.data.protected) {
      ctx.fillStyle = "#151922";
      ctx.fillRect(-this.radius, -this.radius - 13, this.radius * 2, 4);
      ctx.fillStyle = "#8ee7c4";
      ctx.fillRect(-this.radius, -this.radius - 13, this.radius * 2 * hpRatio, 4);
    }
    ctx.restore();
  }
}
