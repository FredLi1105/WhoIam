import { useEffect, useRef, useState } from "react";
import "./GalaxyDefense.css";

type GameStatus = "ready" | "playing" | "gameover";
type EquipmentType = "normal" | "spread" | "rapid";
type BuffType = "equipment" | "bullet";

interface Player {
  x: number;
  lives: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  damage: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  lives: number;
  maxLives: number;
}

interface Barrier {
  side: "left" | "right";
  x: number;
  y: number;
  width: number;
  height: number;
  lives: number;
  maxLives: number;
  active: boolean;
  respawnTimer: number;
}

interface Buff {
  side: "left" | "right";
  x: number;
  y: number;
  size: number;
  speed: number;
  type: BuffType;
  equipmentType?: EquipmentType;
  bulletRows?: number;
}

const WIDTH = 1100;
const HEIGHT = 650;

const LEFT_LANE_WIDTH = 180;
const RIGHT_LANE_WIDTH = 180;

const CENTER_LEFT = LEFT_LANE_WIDTH;
const CENTER_RIGHT = WIDTH - RIGHT_LANE_WIDTH;

const PLAYER_Y = HEIGHT - 70;
const PLAYER_RADIUS = 22;

const BULLET_SPEED = 700;

const NORMAL_FIRE_INTERVAL = 320;
const RAPID_FIRE_INTERVAL = 120;

const ENEMY_SPAWN_INTERVAL = 320;

const BARRIER_MAX_LIVES = 20;

const BARRIER_HIT_COOLDOWN = 100;

const BARRIER_RESPAWN_TIME = 5000;

const BUFF_FALL_SPEED = 65;

const ENEMY_SPEED_REDUCTION = 0.82;

const MAX_BULLET_ROWS = 3;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getEquipmentName(type: EquipmentType) {
  if (type === "spread") {
    return "SPREAD";
  }

  if (type === "rapid") {
    return "RAPID";
  }

  return "NORMAL";
}

function createEnemy(id: number, score: number): Enemy {
  const size = randomBetween(13, 25);

  const difficultyLevel = Math.floor(score / 300);

  const maxPossibleLives = Math.min(1 + difficultyLevel, 6);

  const maxLives = 1 + Math.floor(Math.random() * maxPossibleLives);

  const speed = randomBetween(10, 30) + difficultyLevel * 4;

  return {
    id,
    x: randomBetween(CENTER_LEFT + size, CENTER_RIGHT - size),
    y: -size,
    size,
    speed,
    lives: maxLives,
    maxLives,
  };
}

function createBarrier(side: "left" | "right"): Barrier {
  const width = 92;
  const height = 30;

  const x =
    side === "left" ? LEFT_LANE_WIDTH / 2 : WIDTH - RIGHT_LANE_WIDTH / 2;

  return {
    side,
    x,
    y: HEIGHT * 0.42,
    width,
    height,
    lives: BARRIER_MAX_LIVES,
    maxLives: BARRIER_MAX_LIVES,
    active: true,
    respawnTimer: 0,
  };
}

function createEquipmentBuff(side: "left" | "right"): Buff {
  const equipmentType: EquipmentType = Math.random() < 0.5 ? "spread" : "rapid";

  const x =
    side === "left" ? LEFT_LANE_WIDTH / 2 : WIDTH - RIGHT_LANE_WIDTH / 2;

  return {
    side,
    x,
    y: HEIGHT * 0.42,
    size: 24,
    speed: BUFF_FALL_SPEED,
    type: "equipment",
    equipmentType,
  };
}

function createBulletBuff(): Buff {
  return {
    side: "right",
    x: WIDTH - RIGHT_LANE_WIDTH / 2,
    y: HEIGHT * 0.42,
    size: 24,
    speed: BUFF_FALL_SPEED,
    type: "bullet",
    bulletRows: 1,
  };
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  ctx.save();

  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 3;

  ctx.shadowColor = "#4ade80";
  ctx.shadowBlur = 12;

  ctx.beginPath();

  ctx.moveTo(player.x, PLAYER_Y - PLAYER_RADIUS);

  ctx.lineTo(player.x - PLAYER_RADIUS, PLAYER_Y + PLAYER_RADIUS);

  ctx.lineTo(player.x + PLAYER_RADIUS, PLAYER_Y + PLAYER_RADIUS);

  ctx.closePath();

  ctx.stroke();

  ctx.restore();
}

function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet) {
  ctx.save();

  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 3;

  ctx.shadowColor = "#facc15";
  ctx.shadowBlur = 8;

  ctx.beginPath();

  ctx.moveTo(bullet.x, bullet.y - 10);

  ctx.lineTo(bullet.x - bullet.vx * 0.015, bullet.y + 10);

  ctx.stroke();

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  ctx.save();

  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 2.5;

  ctx.shadowColor = "#ef4444";
  ctx.shadowBlur = 6;

  ctx.beginPath();

  const sides = enemy.maxLives <= 1 ? 0 : enemy.maxLives + 1;

  if (sides === 0) {
    ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
  } else {
    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides - Math.PI / 2;

      const x = enemy.x + Math.cos(angle) * enemy.size;

      const y = enemy.y + Math.sin(angle) * enemy.size;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
  }

  ctx.stroke();

  ctx.restore();
}

function drawBarrier(ctx: CanvasRenderingContext2D, barrier: Barrier) {
  if (!barrier.active) {
    return;
  }

  ctx.save();

  const ratio = barrier.lives / barrier.maxLives;

  ctx.strokeStyle = ratio > 0.5 ? "#60a5fa" : "#f97316";

  ctx.lineWidth = 4;

  ctx.shadowColor = ctx.strokeStyle;

  ctx.shadowBlur = 15;

  ctx.strokeRect(
    barrier.x - barrier.width / 2,
    barrier.y - barrier.height / 2,
    barrier.width,
    barrier.height,
  );

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#07111f";

  ctx.fillRect(
    barrier.x - barrier.width / 2 + 5,
    barrier.y - barrier.height / 2 + 5,
    barrier.width - 10,
    barrier.height - 10,
  );

  ctx.fillStyle = "#ffffff";

  ctx.font = "bold 12px Arial";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(`${barrier.lives}/${barrier.maxLives}`, barrier.x, barrier.y);

  ctx.restore();
}

function drawBuff(ctx: CanvasRenderingContext2D, buff: Buff) {
  ctx.save();

  if (buff.type === "equipment") {
    if (buff.equipmentType === "spread") {
      ctx.strokeStyle = "#c084fc";
    } else {
      ctx.strokeStyle = "#38bdf8";
    }
  } else {
    ctx.strokeStyle = "#facc15";
  }

  ctx.lineWidth = 4;

  ctx.shadowColor = ctx.strokeStyle;

  ctx.shadowBlur = 20;

  ctx.beginPath();

  ctx.moveTo(buff.x, buff.y - buff.size);

  ctx.lineTo(buff.x + buff.size, buff.y);

  ctx.lineTo(buff.x, buff.y + buff.size);

  ctx.lineTo(buff.x - buff.size, buff.y);

  ctx.closePath();

  ctx.stroke();

  ctx.fillStyle = "rgba(15,23,42,0.7)";

  ctx.fill();

  ctx.fillStyle = ctx.strokeStyle;

  ctx.font = "bold 10px Arial";

  ctx.textAlign = "center";

  ctx.textBaseline = "middle";

  if (buff.type === "equipment") {
    ctx.fillText(buff.equipmentType === "spread" ? "S" : "R", buff.x, buff.y);
  } else {
    ctx.fillText("+1", buff.x, buff.y);
  }

  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#07111f";

  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#111827";

  ctx.fillRect(0, 0, LEFT_LANE_WIDTH, HEIGHT);

  ctx.fillRect(WIDTH - RIGHT_LANE_WIDTH, 0, RIGHT_LANE_WIDTH, HEIGHT);

  ctx.strokeStyle = "#334155";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(LEFT_LANE_WIDTH, 0);

  ctx.lineTo(LEFT_LANE_WIDTH, HEIGHT);

  ctx.moveTo(WIDTH - RIGHT_LANE_WIDTH, 0);

  ctx.lineTo(WIDTH - RIGHT_LANE_WIDTH, HEIGHT);

  ctx.stroke();

  ctx.strokeStyle = "#172033";

  ctx.lineWidth = 1;

  for (let y = 0; y < HEIGHT; y += 50) {
    ctx.beginPath();

    ctx.moveTo(CENTER_LEFT, y);

    ctx.lineTo(CENTER_RIGHT, y);

    ctx.stroke();
  }

  ctx.fillStyle = "#94a3b8";

  ctx.font = "bold 13px Arial";

  ctx.textAlign = "center";

  ctx.fillText("EQUIPMENT ZONE", LEFT_LANE_WIDTH / 2, 30);

  ctx.fillText("ENEMY ZONE", WIDTH / 2, 30);

  ctx.fillText("UPGRADE ZONE", WIDTH - RIGHT_LANE_WIDTH / 2, 30);
}

export default function GalaxyDefense() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const playerRef = useRef<Player>({
    x: WIDTH / 2,
    lives: 3,
  });

  const targetXRef = useRef(WIDTH / 2);

  const bulletsRef = useRef<Bullet[]>([]);

  const enemiesRef = useRef<Enemy[]>([]);

  const barriersRef = useRef<Barrier[]>([
    createBarrier("left"),
    createBarrier("right"),
  ]);

  const buffsRef = useRef<Buff[]>([]);

  const bulletIdRef = useRef(0);

  const enemyIdRef = useRef(0);

  const scoreRef = useRef(0);

  const lastTimeRef = useRef(0);

  const lastShotRef = useRef(0);

  const lastSpawnRef = useRef(0);

  const lastBarrierHitRef = useRef({
    left: 0,
    right: 0,
  });

  const enemySpeedMultiplierRef = useRef(1);

  const equipmentRef = useRef<EquipmentType>("normal");

  const bulletRowsRef = useRef(1);

  const [gameStatus, setGameStatus] = useState<GameStatus>("ready");

  const [score, setScore] = useState(0);

  const [lives, setLives] = useState(3);

  const [bestScore, setBestScore] = useState(0);

  const [equipment, setEquipment] = useState<EquipmentType>("normal");

  const [bulletRows, setBulletRows] = useState(1);

  const [leftBarrierLives, setLeftBarrierLives] = useState(BARRIER_MAX_LIVES);

  const [rightBarrierLives, setRightBarrierLives] = useState(BARRIER_MAX_LIVES);

  const [enemySpeedPercent, setEnemySpeedPercent] = useState(100);

  const updateTargetX = (clientX: number) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();

    const scaleX = WIDTH / rect.width;

    const x = (clientX - rect.left) * scaleX;

    targetXRef.current = Math.max(
      PLAYER_RADIUS,
      Math.min(WIDTH - PLAYER_RADIUS, x),
    );
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    updateTargetX(event.clientX);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length === 0) {
      return;
    }

    updateTargetX(event.touches[0].clientX);
  };

  const startGame = () => {
    playerRef.current = {
      x: WIDTH / 2,
      lives: 3,
    };

    targetXRef.current = WIDTH / 2;

    bulletsRef.current = [];

    enemiesRef.current = [];

    barriersRef.current = [createBarrier("left"), createBarrier("right")];

    buffsRef.current = [];

    bulletIdRef.current = 0;

    enemyIdRef.current = 0;

    scoreRef.current = 0;

    lastTimeRef.current = 0;

    lastShotRef.current = 0;

    lastSpawnRef.current = 0;

    lastBarrierHitRef.current = {
      left: 0,
      right: 0,
    };

    enemySpeedMultiplierRef.current = 1;

    equipmentRef.current = "normal";

    bulletRowsRef.current = 1;

    setEquipment("normal");

    setBulletRows(1);

    setScore(0);

    setLives(3);

    setLeftBarrierLives(BARRIER_MAX_LIVES);

    setRightBarrierLives(BARRIER_MAX_LIVES);

    setEnemySpeedPercent(100);

    setGameStatus("playing");
  };

  const finishGame = () => {
    const finalScore = scoreRef.current;

    if (finalScore > bestScore) {
      setBestScore(finalScore);
    }

    setGameStatus("gameover");
  };

  const collectBuff = (buff: Buff) => {
    if (buff.type === "equipment" && buff.equipmentType) {
      equipmentRef.current = buff.equipmentType;

      setEquipment(buff.equipmentType);
    }

    if (buff.type === "bullet") {
      if (bulletRowsRef.current < MAX_BULLET_ROWS) {
        bulletRowsRef.current += 1;

        setBulletRows(bulletRowsRef.current);
      }
    }

    enemySpeedMultiplierRef.current *= ENEMY_SPEED_REDUCTION;

    setEnemySpeedPercent(
      Math.max(10, Math.round(enemySpeedMultiplierRef.current * 100)),
    );
  };

  useEffect(() => {
    if (gameStatus !== "playing") {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    let animationId = 0;

    const fire = () => {
      const currentEquipment = equipmentRef.current;

      const rows = bulletRowsRef.current;

      if (currentEquipment === "spread") {
        const spreadAngles = [-0.35, -0.17, 0, 0.17, 0.35];

        for (let row = 0; row < rows; row++) {
          const rowOffset = (row - (rows - 1) / 2) * 15;

          for (const angle of spreadAngles) {
            bulletsRef.current.push({
              id: bulletIdRef.current++,
              x: playerRef.current.x + rowOffset,
              y: PLAYER_Y - PLAYER_RADIUS,
              vx: Math.sin(angle) * BULLET_SPEED,
              damage: 1,
            });
          }
        }

        return;
      }

      for (let row = 0; row < rows; row++) {
        const offset = (row - (rows - 1) / 2) * 16;

        bulletsRef.current.push({
          id: bulletIdRef.current++,
          x: playerRef.current.x + offset,
          y: PLAYER_Y - PLAYER_RADIUS,
          vx: 0,
          damage: 1,
        });
      }
    };

    const gameLoop = (time: number) => {
      const deltaTime =
        lastTimeRef.current === 0
          ? 0
          : Math.min((time - lastTimeRef.current) / 1000, 0.05);

      lastTimeRef.current = time;

      drawBackground(ctx);

      const player = playerRef.current;

      player.x += (targetXRef.current - player.x) * Math.min(1, deltaTime * 12);

      const fireInterval =
        equipmentRef.current === "rapid"
          ? RAPID_FIRE_INTERVAL
          : NORMAL_FIRE_INTERVAL;

      if (time - lastShotRef.current >= fireInterval) {
        fire();

        lastShotRef.current = time;
      }

      if (time - lastSpawnRef.current >= ENEMY_SPAWN_INTERVAL) {
        enemiesRef.current.push(
          createEnemy(enemyIdRef.current++, scoreRef.current),
        );

        lastSpawnRef.current = time;
      }

      for (const barrier of barriersRef.current) {
        if (!barrier.active) {
          barrier.respawnTimer -= deltaTime * 1000;

          if (barrier.respawnTimer <= 0) {
            barrier.active = true;

            barrier.lives = barrier.maxLives;

            if (barrier.side === "left") {
              setLeftBarrierLives(barrier.maxLives);
            } else {
              setRightBarrierLives(barrier.maxLives);
            }
          }
        }
      }

      for (const bullet of bulletsRef.current) {
        bullet.x += bullet.vx * deltaTime;

        bullet.y -= BULLET_SPEED * deltaTime;
      }

      for (const enemy of enemiesRef.current) {
        enemy.y += enemy.speed * enemySpeedMultiplierRef.current * deltaTime;
      }

      for (const buff of buffsRef.current) {
        buff.y += buff.speed * deltaTime;
      }

      const usedBullets = new Set<number>();

      const deadEnemies = new Set<number>();

      for (const bullet of bulletsRef.current) {
        if (usedBullets.has(bullet.id)) {
          continue;
        }

        for (const enemy of enemiesRef.current) {
          if (deadEnemies.has(enemy.id)) {
            continue;
          }

          const dx = bullet.x - enemy.x;

          const dy = bullet.y - enemy.y;

          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < enemy.size + 7) {
            usedBullets.add(bullet.id);

            enemy.lives -= bullet.damage;

            if (enemy.lives <= 0) {
              deadEnemies.add(enemy.id);

              scoreRef.current += enemy.maxLives * 10;

              setScore(scoreRef.current);
            }

            break;
          }
        }
      }

      for (const bullet of bulletsRef.current) {
        if (usedBullets.has(bullet.id)) {
          continue;
        }

        for (const barrier of barriersRef.current) {
          if (!barrier.active) {
            continue;
          }

          const left = barrier.x - barrier.width / 2;

          const right = barrier.x + barrier.width / 2;

          const top = barrier.y - barrier.height / 2;

          const bottom = barrier.y + barrier.height / 2;

          if (
            bullet.x >= left &&
            bullet.x <= right &&
            bullet.y >= top &&
            bullet.y <= bottom
          ) {
            usedBullets.add(bullet.id);

            if (
              time - lastBarrierHitRef.current[barrier.side] >=
              BARRIER_HIT_COOLDOWN
            ) {
              lastBarrierHitRef.current[barrier.side] = time;

              barrier.lives -= 1;

              if (barrier.lives <= 0) {
                barrier.lives = 0;

                barrier.active = false;

                barrier.respawnTimer = BARRIER_RESPAWN_TIME;

                if (barrier.side === "left") {
                  const buff = createEquipmentBuff("left");

                  buffsRef.current.push(buff);

                  setLeftBarrierLives(0);
                } else {
                  const buff = createBulletBuff();

                  buffsRef.current.push(buff);

                  setRightBarrierLives(0);
                }
              } else {
                if (barrier.side === "left") {
                  setLeftBarrierLives(barrier.lives);
                } else {
                  setRightBarrierLives(barrier.lives);
                }
              }
            }

            break;
          }
        }
      }

      bulletsRef.current = bulletsRef.current.filter(
        (bullet) =>
          !usedBullets.has(bullet.id) &&
          bullet.y > -60 &&
          bullet.x > -60 &&
          bullet.x < WIDTH + 60,
      );

      enemiesRef.current = enemiesRef.current.filter(
        (enemy) => !deadEnemies.has(enemy.id),
      );

      const hitEnemies = enemiesRef.current.filter(
        (enemy) => enemy.y - enemy.size >= PLAYER_Y - PLAYER_RADIUS,
      );

      if (hitEnemies.length > 0) {
        const hitIds = new Set(hitEnemies.map((enemy) => enemy.id));

        enemiesRef.current = enemiesRef.current.filter(
          (enemy) => !hitIds.has(enemy.id),
        );

        player.lives -= hitEnemies.length;

        setLives(Math.max(0, player.lives));

        if (player.lives <= 0) {
          finishGame();
          return;
        }
      }

      const collectedBuffs = new Set<Buff>();

      for (const buff of buffsRef.current) {
        const dx = player.x - buff.x;

        const dy = PLAYER_Y - buff.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < PLAYER_RADIUS + buff.size) {
          collectBuff(buff);

          collectedBuffs.add(buff);
        }
      }

      buffsRef.current = buffsRef.current.filter(
        (buff) => !collectedBuffs.has(buff) && buff.y < HEIGHT + buff.size,
      );

      for (const enemy of enemiesRef.current) {
        drawEnemy(ctx, enemy);
      }

      for (const bullet of bulletsRef.current) {
        drawBullet(ctx, bullet);
      }

      for (const barrier of barriersRef.current) {
        drawBarrier(ctx, barrier);
      }

      for (const buff of buffsRef.current) {
        drawBuff(ctx, buff);
      }

      drawPlayer(ctx, player);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameStatus, bestScore]);

  if (gameStatus === "ready") {
    return (
      <div className="game-page">
        <MeteorBackground />

        <div className="game-content">
          <div className="game-start-card">
            <div className="game-title">GALAXY DEFENSE</div>

            <div className="game-description">THREE LANE DEFENSE SYSTEM</div>

            <div className="game-description">
              Move freely between all zones.
            </div>

            <div className="game-description">
              Destroy side barriers to obtain upgrades.
            </div>

            <div className="game-description">
              Left: random equipment. Right: additional bullets.
            </div>

            <div className="game-best-score">
              BEST SCORE <span>{bestScore}</span>
            </div>

            <button className="game-start-button" onClick={startGame}>
              START GAME
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <MeteorBackground />

      <div className="game-content">
        <div className="game-wrapper">
          <div className="game-hud">
            <div className="game-stats">
              <span>SCORE: {score}</span>

              <span>LIFE: {lives}</span>

              <span>EQUIPMENT: {getEquipmentName(equipment)}</span>

              <span>
                BULLETS: {bulletRows}/{MAX_BULLET_ROWS}
              </span>

              <span>ENEMY SPEED: {enemySpeedPercent}%</span>

              <span>BEST: {bestScore}</span>
            </div>

            <button className="game-quit-button" onClick={finishGame}>
              QUIT
            </button>
          </div>

          <div className="game-instructions">
            <span>MOVE THROUGH ALL THREE ZONES</span>

            <span>LEFT = EQUIPMENT &nbsp;&nbsp;|&nbsp;&nbsp; RIGHT = BULLETS</span>
          </div>

          <div className="barrier-status">
            <div
              className={
                leftBarrierLives === 0
                  ? "barrier-label destroyed"
                  : "barrier-label"
              }
            >
              LEFT BARRIER:{" "}
              {leftBarrierLives === 0
                ? "RESPAWNING..."
                : `${leftBarrierLives}/${BARRIER_MAX_LIVES}`}
            </div>

            <div
              className={
                rightBarrierLives === 0
                  ? "barrier-label destroyed"
                  : "barrier-label"
              }
            >
              RIGHT BARRIER:{" "}
              {rightBarrierLives === 0
                ? "RESPAWNING..."
                : `${rightBarrierLives}/${BARRIER_MAX_LIVES}`}
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="game-canvas"
          />

          <div className="buff-status">
            <span className="spread-info">LEFT: RANDOM SPREAD / RAPID</span>

            <span className="bullet-info">RIGHT: +1 BULLET ROW</span>
          </div>

          {gameStatus === "gameover" && (
            <div className="game-over">
              <div className="game-over-title">GAME OVER</div>

              <div className="game-over-score">SCORE: {score}</div>

              <div className="game-over-score">BEST: {bestScore}</div>

              {score === bestScore && score > 0 && (
                <div className="new-record">✦ NEW HIGH SCORE ✦</div>
              )}

              <button className="game-start-button" onClick={startGame}>
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MeteorBackground() {
  return (
    <div className="meteor-background">
      <span className="meteor meteor-1" />
      <span className="meteor meteor-2" />
      <span className="meteor meteor-3" />
      <span className="meteor meteor-4" />
      <span className="meteor meteor-5" />
      <span className="meteor meteor-6" />
      <span className="meteor meteor-7" />
      <span className="meteor meteor-8" />
    </div>
  );
}
