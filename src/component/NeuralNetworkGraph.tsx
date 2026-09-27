import React, { useMemo, useRef, useState } from "react";

export type NodeCategory = "project" | "technology" | "tech-stack";

export interface Technology {
  id: string;
  name: string;
  category: "technology";
}

export interface TechStack {
  id: string;
  name: string;
  category: "tech-stack";
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  technologies: Technology[];
  techStack: TechStack[];
}

export interface NeuralNetworkData {
  projects: Project[];
}

interface GraphNode {
  id: string;
  label: string;
  category: NodeCategory;
  projectId?: string;
  x: number;
  y: number;
}

interface GraphConnection {
  id: string;
  source: string;
  target: string;
}

interface NeuralNetworkGraphProps {
  data: NeuralNetworkData;
  width?: number;
  height?: number;
  animated?: boolean;
  zoomable?: boolean;
  draggable?: boolean;
  onNodeClick?: (node: GraphNode) => void;
}

const NODE_RADIUS = {
  project: 32,
  technology: 23,
  "tech-stack": 20,
};

const NODE_STYLE = {
  project: {
    fill: "#111827",
    stroke: "#ffffff",
    text: "#ffffff",
  },
  technology: {
    fill: "#172554",
    stroke: "#60a5fa",
    text: "#bfdbfe",
  },
  "tech-stack": {
    fill: "#1f2937",
    stroke: "#34d399",
    text: "#a7f3d0",
  },
};

const NODE_LABEL_HEIGHT = 130;
const NODE_GAP = 16;
const PROJECT_NODE_GAP = 96;
const NODE_LABEL_HORIZONTAL_PADDING = 24;

function getNodeLabelWidth(node: GraphNode) {
  const fontSize = node.category === "project" ? 16 : 14;
  const estimatedTextWidth = node.label.length * fontSize * 0.55;

  return Math.max(
    NODE_RADIUS[node.category] * 2,
    Math.min(280, estimatedTextWidth + NODE_LABEL_HORIZONTAL_PADDING),
  );
}

function getNodeHalfWidth(node: GraphNode) {
  return Math.max(NODE_RADIUS[node.category], getNodeLabelWidth(node) / 2);
}

function overlaps(first: GraphNode, second: GraphNode) {
  const firstHalfWidth = getNodeHalfWidth(first);
  const secondHalfWidth = getNodeHalfWidth(second);
  const firstRadius = NODE_RADIUS[first.category];
  const secondRadius = NODE_RADIUS[second.category];
  const gap =
    first.category === "project" || second.category === "project"
      ? PROJECT_NODE_GAP
      : NODE_GAP;

  return (
    first.x - firstHalfWidth < second.x + secondHalfWidth + gap &&
    first.x + firstHalfWidth + gap > second.x - secondHalfWidth &&
    first.y - firstRadius < second.y + secondRadius + NODE_LABEL_HEIGHT + gap &&
    first.y + firstRadius + NODE_LABEL_HEIGHT + gap > second.y - secondRadius
  );
}

function createGridLayout(nodes: GraphNode[], width: number, height: number) {
  const largestRadius = Math.max(...Object.values(NODE_RADIUS));
  const largestHalfWidth = Math.max(
    largestRadius,
    ...nodes.map(getNodeHalfWidth),
  );
  const columns = Math.max(1, Math.floor(width / (largestHalfWidth * 2 + NODE_GAP)));
  const rows = Math.max(1, Math.ceil(nodes.length / columns));
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const cells = Array.from({ length: columns * rows }, (_, index) => index);

  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cells[index], cells[swapIndex]] = [cells[swapIndex], cells[index]];
  }

  return nodes.map((node, index) => {
    const cell = cells[index];
    const column = cell % columns;
    const row = Math.floor(cell / columns);
    const verticalPadding =
      (cellHeight - largestRadius * 2 - NODE_LABEL_HEIGHT - NODE_GAP * 2) / 2;

    return {
      ...node,
      x: (column + 0.5) * cellWidth,
      y: row * cellHeight + largestRadius + NODE_GAP + verticalPadding,
    };
  });
}

function createRandomLayout(nodes: GraphNode[], width: number, height: number) {
  const positioned: GraphNode[] = [];

  for (const node of nodes) {
    const radius = NODE_RADIUS[node.category];
    const halfWidth = getNodeHalfWidth(node);
    const minX = halfWidth + NODE_GAP;
    const maxX = width - halfWidth - NODE_GAP;
    const minY = radius + NODE_GAP;
    const maxY = height - radius - NODE_LABEL_HEIGHT - NODE_GAP;
    let placed: GraphNode | undefined;

    for (let attempt = 0; attempt < 500; attempt += 1) {
      const candidate = {
        ...node,
        x: minX + Math.random() * Math.max(0, maxX - minX),
        y: minY + Math.random() * Math.max(0, maxY - minY),
      };

      if (positioned.every((other) => !overlaps(candidate, other))) {
        placed = candidate;
        break;
      }
    }

    if (!placed) return createGridLayout(nodes, width, height);
    positioned.push(placed);
  }

  return positioned;
}

export default function NeuralNetworkGraph({
  data,
  width = 1600,
  height = 900,
  animated = true,
  zoomable = true,
  draggable = true,
  onNodeClick,
}: NeuralNetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });

  const [dragging, setDragging] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const dragStart = useRef({
    x: 0,
    y: 0,
    transformX: 0,
    transformY: 0,
  });

  /*
   * ----------------------------------------------------
   * Generate nodes
   * ----------------------------------------------------
   */

  const nodes = useMemo<GraphNode[]>(() => {
    const result = new Map<string, GraphNode>();

    data.projects.forEach((project) => {
      const projectNodeId = `project:${project.id}`;
      if (!result.has(projectNodeId)) {
        result.set(projectNodeId, {
          id: projectNodeId,
          label: project.name,
          category: "project",
          x: 0,
          y: 0,
        });
      }

      /*
       * Tech Stack
       */

      project.techStack.forEach((stack) => {
        const nodeId = `stack:${stack.id}`;
        if (!result.has(nodeId)) {
          result.set(nodeId, {
            id: nodeId,
            label: stack.name,
            category: "tech-stack",
            projectId: project.id,
            x: 0,
            y: 0,
          });
        }
      });
    });

    return createRandomLayout([...result.values()], width, height);
  }, [data, height, width]);

  /*
   * ----------------------------------------------------
   * Generate connections automatically
   * ----------------------------------------------------
   *
   * Project
   *    |
   *    +---- Technology
   *    |
   *    +---- Tech Stack
   *
   */

  const connections = useMemo<GraphConnection[]>(() => {
    const result: GraphConnection[] = [];

    data.projects.forEach((project) => {
      const projectNode = `project:${project.id}`;

      project.techStack.forEach((stack) => {
        result.push({
          id: `${project.id}-stack-${stack.id}`,
          source: projectNode,
          target: `stack:${stack.id}`,
        });
      });
    });

    return result;
  }, [data]);

  const nodeMap = useMemo(() => {
    return new Map(nodes.map((node) => [node.id, node]));
  }, [nodes]);

  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return null;

    const hoveredNode = nodeMap.get(hoveredNodeId);
    if (hoveredNode?.category === "project") {
      const projectNodeIds = new Set([hoveredNodeId]);
      connections.forEach(({ source, target }) => {
        if (source === hoveredNodeId) projectNodeIds.add(target);
      });
      return projectNodeIds;
    }

    const adjacency = new Map<string, string[]>();
    connections.forEach(({ source, target }) => {
      adjacency.set(source, [...(adjacency.get(source) ?? []), target]);
      adjacency.set(target, [...(adjacency.get(target) ?? []), source]);
    });

    const visited = new Set([hoveredNodeId]);
    const queue = [hoveredNodeId];

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      adjacency.get(current)?.forEach((neighbor) => {
        if (visited.has(neighbor)) return;
        visited.add(neighbor);
        queue.push(neighbor);
      });
    }

    return visited;
  }, [connections, hoveredNodeId, nodeMap]);

  /*
   * ----------------------------------------------------
   * Drag
   * ----------------------------------------------------
   */

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!draggable) return;

    setDragging(true);

    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      transformX: transform.x,
      transformY: transform.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging || !draggable) return;

    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;

    setTransform((current) => ({
      ...current,
      x: dragStart.current.transformX + dx,
      y: dragStart.current.transformY + dy,
    }));
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    setDragging(false);

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore pointer capture errors
    }
  };

  /*
   * ----------------------------------------------------
   * Reset View
   * ----------------------------------------------------
   */

  const resetView = () => {
    setTransform({
      x: 0,
      y: 0,
      scale: 1,
    });
  };

  return (
    <div className="neural-network-graph relative w-full h-full overflow-hidden bg-slate-950">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full h-full ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        } block`}
      >
        <defs>
          {/* Connection glow */}

          <filter
            id="neural-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />

            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Animated gradient */}

          <linearGradient
            id="connection-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#64748b" />

            <stop offset="50%" stopColor="#60a5fa" />

            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        <g
          transform={`
            translate(${transform.x} ${transform.y})
            scale(${transform.scale})
          `}
        >
          {/* =================================================
              Connections
          ================================================= */}

          <g>
            {connections.map((connection) => {
              if (
                connectedNodeIds &&
                (!connectedNodeIds.has(connection.source) ||
                  !connectedNodeIds.has(connection.target))
              ) {
                return null;
              }

              const source = nodeMap.get(connection.source);

              const target = nodeMap.get(connection.target);

              if (!source || !target) {
                return null;
              }

              const pathId = `path-${connection.id}`;

              const dx = target.x - source.x;
              const dy = target.y - source.y;

              const distance = Math.sqrt(dx * dx + dy * dy);

              const unitX = dx / distance;
              const unitY = dy / distance;

              const sourceRadius = NODE_RADIUS[source.category];

              const targetRadius = NODE_RADIUS[target.category];

              const x1 = source.x + unitX * sourceRadius;

              const y1 = source.y + unitY * sourceRadius;

              const x2 = target.x - unitX * targetRadius;

              const y2 = target.y - unitY * targetRadius;

              /*
               * Slight curve instead of straight line.
               */

              const curveOffset = 25;

              const cx = (x1 + x2) / 2 - unitY * curveOffset;

              const cy = (y1 + y2) / 2 + unitX * curveOffset;

              const path = `
                M ${x1} ${y1}
                Q ${cx} ${cy}
                ${x2} ${y2}
              `;

              return (
                <g key={connection.id}>
                  {/* Main connection */}

                  <path
                    id={pathId}
                    d={path}
                    fill="none"
                    stroke="url(#connection-gradient)"
                    strokeWidth="1.5"
                    opacity="0.45"
                  />

                  {/* Glow */}

                  <path
                    d={path}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="5"
                    opacity="0.05"
                    filter="url(#neural-glow)"
                  />

                  {/* Moving particle */}

                  {animated && (
                    <circle r="4" fill="#ffffff" filter="url(#neural-glow)">
                      <animateMotion
                        dur="3.5s"
                        repeatCount="indefinite"
                        rotate="auto"
                      >
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })}
          </g>

          {/* =================================================
              Nodes
          ================================================= */}

          <g>
            {nodes.map((node) => {
              if (connectedNodeIds && !connectedNodeIds.has(node.id)) return null;

              const radius = NODE_RADIUS[node.category];

              const style = NODE_STYLE[node.category];
              const isHoveredNode = hoveredNodeId === node.id;
              const isHighlightedProject =
                isHoveredNode && node.category === "project";
              const glowRadius = isHighlightedProject ? 12 : 8;
              const pulseRadius = isHighlightedProject ? 18 : 13;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x} ${node.y})`}
                  onPointerEnter={() => setHoveredNodeId(node.id)}
                  onPointerLeave={() => setHoveredNodeId(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onNodeClick?.(node);
                  }}
                  className="cursor-pointer"
                >
                  {/* Outer glow */}

                  <circle
                    r={radius + glowRadius}
                    fill="none"
                    stroke={style.stroke}
                    strokeWidth={isHoveredNode ? (isHighlightedProject ? 3 : 2) : 1}
                    opacity={isHoveredNode ? 0.9 : 0.15}
                    filter={isHoveredNode ? "url(#neural-glow)" : undefined}
                  >
                    {isHoveredNode && (
                      <>
                        <animate
                          attributeName="opacity"
                          values="0.35;1;0.35"
                          dur="1.4s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="r"
                          values={`${radius + 5};${radius + pulseRadius};${radius + 5}`}
                          dur={isHighlightedProject ? "1.4s" : "1.7s"}
                          repeatCount="indefinite"
                        />
                      </>
                    )}
                  </circle>

                  {/* Node */}

                  <circle
                    r={radius}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={node.category === "project" ? 2 : 1.5}
                  />

                  {/* Inner point */}

                  <circle r={4} fill={style.stroke} opacity="0.8" />

                  {/* Label */}

                  <foreignObject
                    x={-getNodeLabelWidth(node) / 2}
                    y={radius + 10}
                    width={getNodeLabelWidth(node)}
                    height={NODE_LABEL_HEIGHT - 10}
                    style={{ overflow: "visible" }}
                  >
                    <div
                      className="text-center select-none"
                      style={{
                        overflow: "visible",
                        overflowWrap: "anywhere",
                        color: style.text,
                        fontSize: node.category === "project" ? "16px" : "14px",
                        fontWeight: node.category === "project" ? 600 : 400,
                        lineHeight: "20px",
                      }}
                    >
                      {node.label}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Controls */}

      <div className="absolute top-4 right-4 flex gap-2">
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          disabled={!zoomable}
          onClick={() =>
            setTransform((current) => ({
              ...current,
              scale: Math.min(3, current.scale * 1.2),
            }))
          }
          className="arcade-game-button graph-control-button disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="arcade-game-button-content">
            <span className="arcade-game-icon">+</span>
          </span>
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          disabled={!zoomable}
          onClick={() =>
            setTransform((current) => ({
              ...current,
              scale: Math.max(0.35, current.scale / 1.2),
            }))
          }
          className="arcade-game-button graph-control-button disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="arcade-game-button-content">
            <span className="arcade-game-icon">−</span>
          </span>
        </button>
        <button
          type="button"
          aria-label="Reset view"
          title="Reset view"
          onClick={resetView}
          className="arcade-game-button graph-control-button graph-control-button--reset"
        >
          <span className="arcade-game-button-content">
            <span className="arcade-game-icon">✦</span>
            <span>RESET</span>
          </span>
        </button>
      </div>
    </div>
  );
}
