import React, { useEffect, useState } from "react";
import "../style/ProjectExpansion.css";

export interface ProjectData {
  name: string;
  description: string;
  component: ProjectComponent[];
}

export interface ProjectComponent {
  name: string;
  description: string;
  technology: string[];
}

interface ProjectExpansionProps {
  project: ProjectData;
  duration?: number;
}

const CARD_WIDTH = 260;
const CARD_HEIGHT = 180;
const CARD_GAP = 18;
const COMPACT_BREAKPOINT = "(max-width: 900px)";

const isCompactViewport = () =>
  typeof window !== "undefined" &&
  window.matchMedia(COMPACT_BREAKPOINT).matches;

const ProjectExpansion: React.FC<ProjectExpansionProps> = ({
  project,
  duration = 1000,
}) => {
  const components = project.component ?? [];

  const [isHovered, setIsHovered] = useState(isCompactViewport);
  const [visibleCount, setVisibleCount] = useState(() =>
    isCompactViewport() ? components.length : 1,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(COMPACT_BREAKPOINT);

    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsHovered(event.matches);
      setVisibleCount(event.matches ? components.length : 1);
    };

    mediaQuery.addEventListener("change", handleViewportChange);

    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, [components.length]);

  useEffect(() => {
    if (!isHovered || visibleCount >= components.length) {
      return;
    }

    const timer = window.setTimeout(() => {
      setVisibleCount((prev) => prev + 1);
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isHovered, visibleCount, components.length, duration]);

  const handleMouseEnter = () => {
    setIsHovered(true);

    if (components.length > 1) {
      setVisibleCount(2);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setVisibleCount(1);
  };

  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") {
      handleMouseEnter();
    }
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") {
      handleMouseLeave();
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      setIsHovered((isExpanded) => !isExpanded);
      setVisibleCount((count) =>
        count > 1 ? 1 : Math.min(2, components.length),
      );
    }
  };

  if (!components.length) {
    return null;
  }

  return (
    <div
      className="project-expansion"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      style={
        {
          "--expanded-height": `${
            visibleCount * CARD_HEIGHT +
            Math.max(0, visibleCount - 1) * CARD_GAP
          }px`,
        } as React.CSSProperties
      }
    >
      <div className="project-expansion__stage">
        {components.slice(0, visibleCount).map((component, index) => {
          const offset = index * (CARD_WIDTH + CARD_GAP);

          return (
            <div
              key={`${component.name}-${index}`}
              className={`project-component-card ${
                index === 0
                  ? "project-component-card--anchor"
                  : "project-component-card--animated"
              }`}
              style={
                {
                  "--card-offset": `${offset}px`,
                  "--card-index": index,
                  "--animation-duration": `${duration}ms`,
                } as React.CSSProperties
              }
            >
              <div className="project-component-card__name">
                {component.name}
              </div>

              <div className="project-component-card__description">
                {component.description}
              </div>

              <div className="project-component-card__technologies">
                {component.technology.map((technology) => (
                  <span
                    key={technology}
                    className="project-component-card__technology"
                  >
                    {technology}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectExpansion;
