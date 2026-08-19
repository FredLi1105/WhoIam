import { useEffect, useMemo, useState, type CSSProperties } from "react";
import "../style/SkillRadar.css";

const DEFAULT_SKILLS = [
  { label: "Frontend", value: 100 },
  { label: "Backend", value: 100 },
  { label: "Deployment", value: 100 },
  { label: "Design", value: 100 },
  { label: "Creativity", value: 130 },
  { label: "Testing", value: 100 },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface Point {
  x: number;
  y: number;
}

type TextAnchor = "start" | "middle" | "end";

function getPoint(center: number, radius: number, angle: number) {
  const radians = (angle - 90) * (Math.PI / 180);

  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

function pointsToString(points: Point[]) {
  return points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
}

export default function SkillRadar({
  skills = DEFAULT_SKILLS,
  size = 520,
  maxValue = 140,
  duration = 3000,
}) {
  const [progress, setProgress] = useState(0);
  const [animationFinished, setAnimationFinished] = useState(false);

  const center = size / 2;

  // 留出空间给标签
  const radius = size * 0.31;

  const angles = useMemo(
    () => skills.map((_, index) => (360 / skills.length) * index),
    [skills],
  );

  /**
   * 重新开始动画
   */
  useEffect(() => {
    let animationFrame: number | null = null;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const rawProgress = clamp(elapsed / duration, 0, 1);

      setProgress(easeOutCubic(rawProgress));

      if (rawProgress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setAnimationFinished(true);
      }
    };

    animationFrame = requestAnimationFrame((timestamp) => {
      startTime = timestamp;
      setProgress(0);
      setAnimationFinished(false);
      animate(timestamp);
    });

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [skills, duration]);

  /**
   * 外层参考网格
   */
  const gridLevels = [0.33, 0.66, 1];

  const gridPolygons = gridLevels.map((level) => {
    const gridRadius = radius * level;

    return angles.map((angle) => getPoint(center, gridRadius, angle));
  });

  /**
   * 轴线
   */
  const axisPoints = angles.map((angle) => getPoint(center, radius, angle));

  /**
   * 实际能力值
   *
   * 注意：
   * value 可以超过 100
   * 例如 Creativity = 130
   */
  const targetPoints = skills.map((skill, index) => {
    const normalizedValue = clamp(skill.value / maxValue, 0, 1);

    const targetRadius = radius * normalizedValue;

    const point = getPoint(center, targetRadius, angles[index]);

    return {
      ...point,
      label: skill.label,
      value: skill.value,
    };
  });

  /**
   * 动画中的点
   *
   * 每个点都是从 center 开始。
   */
  const animatedPoints = targetPoints.map((targetPoint, index) => {
    /**
     * 给每个方向一点点 stagger。
     *
     * 第一个最快，
     * 后面的逐渐延迟。
     */
    const delay = index * 0.045;

    const localProgress = clamp((progress - delay) / (1 - delay), 0, 1);

    const easedProgress = easeOutCubic(localProgress);

    return {
      x: center + (targetPoint.x - center) * easedProgress,

      y: center + (targetPoint.y - center) * easedProgress,
    };
  });

  /**
   * 标签位置
   *
   * 标签永远使用最大半径，
   * 所以不会随着动画移动。
   */
  const labelPoints = angles.map((angle) =>
    getPoint(center, radius * 1.28, angle),
  );

  return (
    <div
      className={`skill-radar ${animationFinished ? "is-finished" : ""}`}
      style={
        {
          "--radar-size": `${size}px`,
        } as CSSProperties
      }
    >
      <svg
        className="skill-radar__svg"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Skills radar chart"
      >
        <defs>
          {/* 能力区域渐变 */}
          <linearGradient id="skillAreaGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.30" />

            <stop offset="100%" stopColor="currentColor" stopOpacity="0.06" />
          </linearGradient>

          {/* Glow */}
          <filter id="skillGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />

            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ========================= */}
        {/* Background Grid */}
        {/* ========================= */}

        <g className="skill-radar__grid">
          {gridPolygons.map((points, index) => (
            <polygon
              key={`grid-${index}`}
              points={pointsToString(points)}
              className={
                index === gridPolygons.length - 1
                  ? "skill-radar__grid-line skill-radar__grid-line--outer"
                  : "skill-radar__grid-line"
              }
            />
          ))}
        </g>

        {/* ========================= */}
        {/* Axis */}
        {/* ========================= */}

        <g className="skill-radar__axis">
          {axisPoints.map((point, index) => (
            <line
              key={`axis-${index}`}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
            />
          ))}
        </g>

        {/* ========================= */}
        {/* 100% boundary */}
        {/* ========================= */}

        <polygon
          points={pointsToString(
            angles.map((angle) => getPoint(center, radius, angle)),
          )}
          className="skill-radar__boundary"
        />

        {/* ========================= */}
        {/* Animated Skill Area */}
        {/* ========================= */}

        <polygon
          points={pointsToString(animatedPoints)}
          className="skill-radar__area"
          fill="url(#skillAreaGradient)"
        />

        {/* ========================= */}
        {/* Animated Outline */}
        {/* ========================= */}

        <polygon
          points={pointsToString(animatedPoints)}
          className="skill-radar__outline"
          filter="url(#skillGlow)"
        />

        {/* ========================= */}
        {/* Skill Points */}
        {/* ========================= */}

        <g className="skill-radar__points">
          {animatedPoints.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              className="skill-radar__point"
            />
          ))}
        </g>

        {/* ========================= */}
        {/* Center */}
        {/* ========================= */}

        <circle cx={center} cy={center} r="3" className="skill-radar__center" />

        {/* ========================= */}
        {/* Labels */}
        {/* ========================= */}

        <g className="skill-radar__labels">
          {labelPoints.map((point, index) => {
            const skill = skills[index];

            const angle = angles[index];

            let textAnchor: TextAnchor = "middle";

            if (angle > 15 && angle < 165) {
              textAnchor = "start";
            }

            if (angle > 195 && angle < 345) {
              textAnchor = "end";
            }

            return (
              <g key={`label-${skill.label}`} className="skill-radar__label">
                <text
                  x={point.x}
                  y={point.y}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                >
                  {skill.label}
                </text>

                <text
                  x={point.x}
                  y={point.y + 19}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                  className={
                    skill.value > 100
                      ? "skill-radar__value skill-radar__value--over"
                      : "skill-radar__value"
                  }
                >
                  {skill.value}%
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
