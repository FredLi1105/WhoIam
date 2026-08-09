import React, { useEffect, useRef, useState } from "react";
import "../style/ConstellationReveal.css";

interface Point {
  x: number;
  y: number;
}

interface Star {
  start: Point;
  target: Point;
}

export interface MovementContext {
  starIndex: number;
  start: Point;
  target: Point;
  progress: number;
}

export type MovementStrategy = (context: MovementContext) => Point;

interface ConstellationRevealProps {
  movementStrategy?: MovementStrategy;
  duration?: number;
  lineDelay?: number;
  revealDelay?: number;
  text?: string;
}

const WIDTH = 420;
const HEIGHT = 360;

const TARGET_POINTS: Point[] = [
  { x: 210, y: 60 },
  { x: 340, y: 135 },
  { x: 340, y: 265 },
  { x: 210, y: 340 },
  { x: 80, y: 265 },
  { x: 80, y: 135 },
];

const DEFAULT_STARS: Point[] = [
  { x: 42, y: 40 },
  { x: 370, y: 55 },
  { x: 30, y: 175 },
  { x: 390, y: 190 },
  { x: 80, y: 330 },
  { x: 355, y: 320 },
];

const clamp = (value: number, min: number, max: number) => {
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

const ConstellationReveal: React.FC<ConstellationRevealProps> = ({
  movementStrategy = gravityStrategy,
  duration = 3000,
  lineDelay = 500,
  revealDelay = 400,
  text = "You found me.",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const [progress, setProgress] = useState(0);

  const [connectedCount, setConnectedCount] = useState(0);

  const [showText, setShowText] = useState(false);

  const animationRef = useRef<number | null>(null);

  const startTimeRef = useRef<number | null>(null);

  const timersRef = useRef<number[]>([]);

  const stars: Star[] = DEFAULT_STARS.map((start, index) => ({
    start,
    target: TARGET_POINTS[index],
  }));

  const clearTimers = () => {
    timersRef.current.forEach((timer) => {
      window.clearTimeout(timer);
    });

    timersRef.current = [];
  };

  useEffect(() => {
    if (!isHovered) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);

        animationRef.current = null;
      }

      clearTimers();

      startTimeRef.current = null;

      setProgress(0);
      setConnectedCount(0);
      setShowText(false);

      return;
    }

    setProgress(0);
    setConnectedCount(0);
    setShowText(false);

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;

      const nextProgress = clamp(elapsed / duration, 0, 1);

      setProgress(nextProgress);

      if (nextProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);

        return;
      }

      animationRef.current = null;

      const startTimer = window.setTimeout(() => {
        for (let i = 1; i <= 6; i++) {
          const timer = window.setTimeout(
            () => {
              setConnectedCount(i);
            },
            (i - 1) * lineDelay,
          );

          timersRef.current.push(timer);
        }

        const textTimer = window.setTimeout(
          () => {
            setShowText(true);
          },
          5 * lineDelay + revealDelay,
        );

        timersRef.current.push(textTimer);
      }, revealDelay);

      timersRef.current.push(startTimer);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      clearTimers();
    };
  }, [isHovered, duration, lineDelay, revealDelay]);

  const getStarPosition = (star: Star, index: number): Point => {
    if (!isHovered) {
      return star.start;
    }

    return movementStrategy({
      starIndex: index,
      start: star.start,
      target: star.target,
      progress,
    });
  };

  const getLineStyle = (index: number): React.CSSProperties => {
    const start = TARGET_POINTS[index];

    const end = TARGET_POINTS[(index + 1) % 6];

    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const length = Math.sqrt(dx * dx + dy * dy);

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return {
      left: start.x,
      top: start.y,
      width: length,
      transform: `rotate(${angle}deg)`,
    };
  };

  return (
    <div
      className={`constellation-reveal ${
        isHovered ? "constellation-reveal--active" : ""
      }`}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      <div className="constellation-reveal__stage">
        {TARGET_POINTS.map((_, index) => {
          const visible = index < connectedCount;

          return (
            <div
              key={`line-${index}`}
              className={`constellation-reveal__line ${
                visible ? "constellation-reveal__line--visible" : ""
              }`}
              style={getLineStyle(index)}
            />
          );
        })}

        <svg
          className="constellation-reveal__svg"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        >
          {stars.map((star, index) => {
            const position = getStarPosition(star, index);

            const formed = isHovered && progress >= 0.95;

            return (
              <g
                key={`star-${index}`}
                className={
                  formed
                    ? "constellation-reveal__star constellation-reveal__star--formed"
                    : "constellation-reveal__star"
                }
                transform={`translate(${position.x}, ${position.y})`}
              >
                <circle
                  className="constellation-reveal__star-glow"
                  r={formed ? 8 : isHovered ? 5 : 2.5}
                />

                <circle
                  className="constellation-reveal__star-core"
                  r={formed ? 2.5 : isHovered ? 2 : 1.5}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div
        className={`constellation-reveal__text ${
          showText ? "constellation-reveal__text--visible" : ""
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default ConstellationReveal;
