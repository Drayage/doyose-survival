export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalize(x, y) {
  const length = Math.hypot(x, y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return { x: x / length, y: y / length };
}

export function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function circleCollision(a, b) {
  return distance(a, b) <= a.radius + b.radius;
}

export function formatSeconds(seconds) {
  return `${seconds.toFixed(1)}s`;
}
