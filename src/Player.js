import { normalize } from "./utils.js";

export class Player {
  constructor(game) {
    this.game = game;
    this.x = 0;
    this.y = 0;
    this.radius = 18;
    this.hitRadius = 13;
    this.baseSpeed = 220;
    this.maxHp = 100;
    this.hp = this.maxHp;
    this.level = 1;
    this.exp = 0;
    this.expToNext = 8;
    this.gold = 0;
    this.weapons = [];
    this.facingAngle = -Math.PI / 2;
    this.aimAngle = -Math.PI / 2;
    this.visualDirection = { x: 0, y: -1 };
    this.hurtTimer = 0;
    this.passives = {
      damageMultiplier: 1,
      attackSpeedMultiplier: 1,
      moveSpeedMultiplier: 1,
      xpPickupMultiplier: 1,
      areaMultiplier: 1,
      projectileCountBonus: 0,
      projectileSpeedMultiplier: 1,
    };
  }

  update(deltaTime, input, game) {
    const xAxis = Number(input.right) - Number(input.left) + input.touchX;
    const yAxis = Number(input.down) - Number(input.up) + input.touchY;
    const direction = normalize(xAxis, yAxis);
    const speed = this.baseSpeed * this.passives.moveSpeedMultiplier;

    this.x += direction.x * speed * deltaTime;
    this.y += direction.y * speed * deltaTime;
    this.hurtTimer = Math.max(0, this.hurtTimer - deltaTime);

    if (direction.x !== 0 || direction.y !== 0) {
      this.facingAngle = Math.atan2(direction.y, direction.x);
      this.visualDirection = direction;
    }

    const target = game.getAutoAttackTarget(this.x, this.y);
    const isPriorityTarget = target?.data || target?.isElite || target?.isBoss;
    const targetDistance = target ? Math.hypot(target.x - this.x, target.y - this.y) : 0;
    const aimDeadZone = isPriorityTarget ? 0 : this.radius + (target?.radius ?? 0) + 18;
    if (target && targetDistance > aimDeadZone) {
      this.aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
    } else if (!target) {
      this.aimAngle = this.facingAngle;
    }

    for (const weapon of this.weapons) {
      weapon.update(deltaTime, game);
    }
  }

  addWeapon(weapon) {
    this.weapons.push(weapon);
  }

  getWeapon(id) {
    return this.weapons.find((weapon) => weapon.id === id);
  }

  gainExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level += 1;
      this.expToNext = Math.floor(this.expToNext * 1.28 + 5);
      this.game.requestLevelUp();
    }
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.hurtTimer = 0.28;
    if (this.hp <= 0) {
      this.game.setGameOver();
    }
  }

  healToNewMax(previousMaxHp) {
    const gainedMax = this.maxHp - previousMaxHp;
    if (gainedMax > 0) {
      this.hp = Math.min(this.maxHp, this.hp + gainedMax);
    }
  }

  getXpPickupRadius() {
    return 72 * this.passives.xpPickupMultiplier;
  }

  render(ctx) {
    const hurtRatio = this.hurtTimer / 0.28;
    const shakeX = hurtRatio > 0 ? (Math.random() - 0.5) * 5 * hurtRatio : 0;
    const shakeY = hurtRatio > 0 ? (Math.random() - 0.5) * 5 * hurtRatio : 0;

    ctx.save();
    ctx.fillStyle = "rgba(30, 27, 28, 0.28)";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius + 8, this.radius * 1.05, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(this.x + shakeX, this.y + shakeY);
    ctx.fillStyle = "#f3f0e8";
    ctx.strokeStyle = "#17191f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-12, -26, 24, 17, 6);
    ctx.fill();
    ctx.stroke();

    const visorOffsetX = this.visualDirection.x * 4;
    const visorOffsetY = this.visualDirection.y * 4;
    ctx.fillStyle = "#d9f6ff";
    ctx.beginPath();
    ctx.roundRect(-6 + visorOffsetX, -21 + visorOffsetY, 13, 9, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#b73535";
    ctx.beginPath();
    ctx.roundRect(-14, -9, 28, 26, 5);
    ctx.fill();
    ctx.stroke();

    if (hurtRatio > 0) {
      ctx.fillStyle = `rgba(255, 66, 66, ${0.36 * hurtRatio})`;
      ctx.beginPath();
      ctx.roundRect(-16, -27, 32, 54, 8);
      ctx.fill();
    }

    ctx.fillStyle = "#222832";
    ctx.fillRect(-10, 17, 8, 8);
    ctx.fillRect(2, 17, 8, 8);

    ctx.restore();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);
    ctx.fillStyle = "#2f3544";
    ctx.strokeStyle = "#11151d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(5, -5, 30, 10, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#d7dde8";
    ctx.beginPath();
    ctx.roundRect(28, -4, 12, 8, 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f1a33d";
    ctx.beginPath();
    ctx.moveTo(42, 0);
    ctx.lineTo(50, -3);
    ctx.lineTo(50, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    const hpRatio = this.hp / this.maxHp;
    ctx.fillStyle = "#0f1218";
    ctx.fillRect(this.x - 24, this.y + 32, 48, 8);
    ctx.fillStyle = "#e6d849";
    ctx.fillRect(this.x - 22, this.y + 34, 44 * hpRatio, 4);
    ctx.strokeStyle = "#080a0d";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x - 24, this.y + 32, 48, 8);
    ctx.restore();

    if (hurtRatio > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 74, 74, ${0.8 * hurtRatio})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 12 + (1 - hurtRatio) * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const weapon of this.weapons) {
      weapon.render(ctx, this.game);
    }
  }
}
