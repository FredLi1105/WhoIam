export interface Point {
  x: number;
  y: number;
}

export interface MovementContext {
  starIndex: number;
  start: Point;
  target: Point;
  progress: number;
}

export type MovementStrategy = (context: MovementContext) => Point;

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const easeInOut = (t: number) => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

export const gravityStrategy: MovementStrategy = ({
  starIndex,
  start,
  target,
  progress,
}) => {
  const t = easeInOut(clamp(progress, 0, 1));

  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    return target;
  }

  const perpendicularX = -dy / distance;
  const perpendicularY = dx / distance;
  const curveStrength =
    Math.min(distance * 0.18, 55) * (starIndex % 2 === 0 ? 1 : -1);
  const curve = Math.sin(Math.PI * t) * curveStrength;

  return {
    x: start.x + dx * t + perpendicularX * curve,
    y: start.y + dy * t + perpendicularY * curve,
  };
};
