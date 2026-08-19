import { useEffect, useRef, useState } from "react";
import "./GalaxyDefense.css";

type GameStatus = "ready" | "playing" | "gameover";

interface Player {
  x: number;
  lives: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
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

interface Buff {
  x: number;
  y: number;
  size: number;
  speed: number;
}

const WIDTH = 900;
const HEIGHT = 600;

const PLAYER_Y = HEIGHT - 60;
const PLAYER_RADIUS = 24;

const BULLET_SPEED = 650;
const FIRE_INTERVAL = 300;
const ENEMY_SPAWN_INTERVAL = 900;

const BEST_SCORE_KEY = "galaxy-defense-best-score";

/*
 * =========================
 * Shape
 * =========================
 */

function getPolygonSides(lives: number): number | null {
  if (lives <= 1) {
    return null;
  }

  return lives + 1;
}

function drawHollowShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  lives: number,
) {
  const sides = getPolygonSides(lives);

  ctx.beginPath();

  if (sides === null) {
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  } else {
    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides - Math.PI / 2;

      const px = x + Math.cos(angle) * radius;

      const py = y + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();
  }

  ctx.stroke();
}

/*
 * =========================
 * Player
 * =========================
 */

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  ctx.save();

  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 3;

  drawHollowShape(ctx, player.x, PLAYER_Y, PLAYER_RADIUS, player.lives);

  ctx.restore();
}

/*
 * =========================
 * Enemy
 * =========================
 */

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  ctx.save();

  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 3;

  drawHollowShape(ctx, enemy.x, enemy.y, enemy.size, enemy.maxLives);

  ctx.restore();
}

/*
 * =========================
 * Bullet
 * =========================
 */

function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet) {
  ctx.save();

  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 3;

  ctx.beginPath();

  ctx.moveTo(bullet.x, bullet.y - 12);

  ctx.lineTo(bullet.x, bullet.y + 12);

  ctx.stroke();

  ctx.restore();
}

/*
 * =========================
 * Buff
 * =========================
 */

function drawBuff(ctx: CanvasRenderingContext2D, buff: Buff) {
  ctx.save();

  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 4;

  ctx.shadowColor = "#facc15";
  ctx.shadowBlur = 15;

  const size = buff.size;

  /*
   * Diamond
   */

  ctx.beginPath();

  ctx.moveTo(buff.x, buff.y - size);

  ctx.lineTo(buff.x + size, buff.y);

  ctx.lineTo(buff.x, buff.y + size);

  ctx.lineTo(buff.x - size, buff.y);

  ctx.closePath();

  ctx.stroke();

  /*
   * Plus sign
   */

  ctx.beginPath();

  ctx.moveTo(buff.x - size * 0.45, buff.y);

  ctx.lineTo(buff.x + size * 0.45, buff.y);

  ctx.moveTo(buff.x, buff.y - size * 0.45);

  ctx.lineTo(buff.x, buff.y + size * 0.45);

  ctx.stroke();

  ctx.restore();
}

/*
 * =========================
 * Enemy creation
 * =========================
 *
 * Difficulty increases every
 * 200 points.
 *
 * 0 - 199
 *   1 life
 *
 * 200 - 399
 *   1 ~ 2 lives
 *
 * 400 - 599
 *   1 ~ 3 lives
 *
 * 600 - 799
 *   1 ~ 4 lives
 *
 * 800 - 999
 *   1 ~ 5 lives
 *
 * 1000+
 *   1 ~ 6 lives
 */

function createEnemy(id: number, score: number): Enemy {
  const size = 20 + Math.random() * 12;

  const difficultyLevel = Math.floor(score / 200);

  const maxPossibleLives = Math.min(difficultyLevel + 1, 6);

  const maxLives = 1 + Math.floor(Math.random() * maxPossibleLives);

  const speed = 60 + Math.random() * 40 + difficultyLevel * 5;

  return {
    id,

    x: size + Math.random() * (WIDTH - size * 2),

    y: -size,

    size,

    speed,

    lives: maxLives,

    maxLives,
  };
}

/*
 * =========================
 * Buff creation
 * =========================
 */

function createBuff(): Buff {
  const size = 22;

  return {
    x: size + Math.random() * (WIDTH - size * 2),

    y: -size,

    size,

    speed: 90,
  };
}

/*
 * =========================
 * Game
 * =========================
 */

export default function GalaxyDefense() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const playerRef = useRef<Player>({
    x: WIDTH / 2,
    lives: 1,
  });

  const targetXRef = useRef(WIDTH / 2);

  const bulletsRef = useRef<Bullet[]>([]);

  const enemiesRef = useRef<Enemy[]>([]);

  const buffRef = useRef<Buff | null>(null);

  const bulletIdRef = useRef(0);

  const enemyIdRef = useRef(0);

  const scoreRef = useRef(0);

  /*
   * Last 500 point threshold
   * that generated a buff.
   */

  const lastBuffScoreRef = useRef(0);

  const lastTimeRef = useRef(0);

  const lastShotRef = useRef(0);

  const lastSpawnRef = useRef(0);

  const [gameStatus, setGameStatus] = useState<GameStatus>("ready");

  const [score, setScore] = useState(0);

  const [lives, setLives] = useState(1);

  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem(BEST_SCORE_KEY);

    return saved ? Number(saved) : 0;
  });

  const [buffVisible, setBuffVisible] = useState(false);

  /*
   * =========================
   * Mouse
   * =========================
   */

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

  /*
   * =========================
   * Touch
   * =========================
   */

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length === 0) {
      return;
    }

    updateTargetX(event.touches[0].clientX);
  };

  /*
   * =========================
   * Start
   * =========================
   */

  const startGame = () => {
    playerRef.current = {
      x: WIDTH / 2,
      lives: 1,
    };

    targetXRef.current = WIDTH / 2;

    bulletsRef.current = [];

    enemiesRef.current = [];

    buffRef.current = null;

    bulletIdRef.current = 0;

    enemyIdRef.current = 0;

    scoreRef.current = 0;

    lastBuffScoreRef.current = 0;

    lastTimeRef.current = 0;

    lastShotRef.current = 0;

    lastSpawnRef.current = 0;

    setScore(0);

    setLives(1);

    setBuffVisible(false);

    setGameStatus("playing");
  };

  /*
   * =========================
   * Finish
   * =========================
   */

  const finishGame = () => {
    const finalScore = scoreRef.current;

    if (finalScore > bestScore) {
      localStorage.setItem(BEST_SCORE_KEY, String(finalScore));

      setBestScore(finalScore);
    }

    buffRef.current = null;

    setBuffVisible(false);

    setGameStatus("gameover");
  };

  /*
   * =========================
   * Collect Buff
   * =========================
   */

  const collectBuff = () => {
    playerRef.current.lives += 1;

    setLives(playerRef.current.lives);

    buffRef.current = null;

    setBuffVisible(false);
  };

  /*
   * =========================
   * Game Loop
   * =========================
   */

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

    const gameLoop = (time: number) => {
      const deltaTime =
        lastTimeRef.current === 0 ? 0 : (time - lastTimeRef.current) / 1000;

      lastTimeRef.current = time;

      /*
       * Background
       */

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = "#07111f";

      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      const player = playerRef.current;

      /*
       * =========================
       * Player movement
       * =========================
       */

      player.x += (targetXRef.current - player.x) * Math.min(1, deltaTime * 12);

      /*
       * =========================
       * Auto fire
       * =========================
       */

      if (time - lastShotRef.current >= FIRE_INTERVAL) {
        bulletsRef.current.push({
          id: bulletIdRef.current++,

          x: player.x,

          y: PLAYER_Y - PLAYER_RADIUS,
        });

        lastShotRef.current = time;
      }

      /*
       * =========================
       * Spawn enemy
       * =========================
       */

      if (time - lastSpawnRef.current >= ENEMY_SPAWN_INTERVAL) {
        enemiesRef.current.push(
          createEnemy(enemyIdRef.current++, scoreRef.current),
        );

        lastSpawnRef.current = time;
      }

      /*
       * =========================
       * Buff every 500 points
       * =========================
       */

      const currentScore = scoreRef.current;

      const nextBuffScore = lastBuffScoreRef.current + 500;

      if (currentScore >= nextBuffScore && buffRef.current === null) {
        buffRef.current = createBuff();

        lastBuffScoreRef.current = Math.floor(currentScore / 500) * 500;

        setBuffVisible(true);
      }

      /*
       * =========================
       * Bullet movement
       * =========================
       */

      for (const bullet of bulletsRef.current) {
        bullet.y -= BULLET_SPEED * deltaTime;
      }

      bulletsRef.current = bulletsRef.current.filter(
        (bullet) => bullet.y > -30,
      );

      /*
       * =========================
       * Enemy movement
       * =========================
       */

      for (const enemy of enemiesRef.current) {
        enemy.y += enemy.speed * deltaTime;
      }

      /*
       * =========================
       * Buff movement
       * =========================
       */

      if (buffRef.current) {
        buffRef.current.y += buffRef.current.speed * deltaTime;

        if (buffRef.current.y > HEIGHT + buffRef.current.size) {
          buffRef.current = null;

          setBuffVisible(false);
        }
      }

      /*
       * =========================
       * Bullet / Enemy collision
       * =========================
       */

      const deadEnemies = new Set<number>();

      const usedBullets = new Set<number>();

      for (const bullet of bulletsRef.current) {
        for (const enemy of enemiesRef.current) {
          if (deadEnemies.has(enemy.id)) {
            continue;
          }

          if (usedBullets.has(bullet.id)) {
            continue;
          }

          const dx = bullet.x - enemy.x;

          const dy = bullet.y - enemy.y;

          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < enemy.size + 8) {
            usedBullets.add(bullet.id);

            /*
             * Score is based
             * on enemy max lives.
             */

            const enemyScore = enemy.maxLives * 10;

            enemy.lives -= 1;

            if (enemy.lives <= 0) {
              deadEnemies.add(enemy.id);

              scoreRef.current += enemyScore;

              setScore(scoreRef.current);
            }

            break;
          }
        }
      }

      /*
       * Remove bullets
       */

      bulletsRef.current = bulletsRef.current.filter(
        (bullet) => !usedBullets.has(bullet.id),
      );

      /*
       * Remove enemies
       */

      enemiesRef.current = enemiesRef.current.filter(
        (enemy) => !deadEnemies.has(enemy.id),
      );

      /*
       * =========================
       * Enemy reaches player
       * =========================
       */

      const hitEnemies = enemiesRef.current.filter(
        (enemy) => enemy.y + enemy.size >= PLAYER_Y - PLAYER_RADIUS,
      );

      if (hitEnemies.length > 0) {
        const hitIds = new Set(hitEnemies.map((enemy) => enemy.id));

        enemiesRef.current = enemiesRef.current.filter(
          (enemy) => !hitIds.has(enemy.id),
        );

        player.lives -= hitEnemies.length;

        setLives(player.lives);

        if (player.lives <= 0) {
          finishGame();

          return;
        }
      }

      /*
       * =========================
       * Buff collision
       * =========================
       */

      const buff = buffRef.current;

      if (buff) {
        const dx = player.x - buff.x;

        const dy = PLAYER_Y - buff.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < PLAYER_RADIUS + buff.size) {
          collectBuff();
        }
      }

      /*
       * =========================
       * Draw
       * =========================
       */

      for (const bullet of bulletsRef.current) {
        drawBullet(ctx, bullet);
      }

      for (const enemy of enemiesRef.current) {
        drawEnemy(ctx, enemy);
      }

      if (buffRef.current) {
        drawBuff(ctx, buffRef.current);
      }

      drawPlayer(ctx, player);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameStatus, bestScore]);

  /*
   * =========================
   * Ready screen
   * =========================
   */

  if (gameStatus === "ready") {
    return (
      <div className="game-page">
        <MeteorBackground />

        <div className="game-content">
          <div className="game-start-card">
            <div className="game-title">GALAXY DEFENSE</div>

            <div className="game-description">
              Move your mouse or finger to move.
            </div>

            <div className="game-description">Destroy enemies and survive.</div>

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

  /*
   * =========================
   * Game page
   * =========================
   */

  return (
    <div className="game-page">
      <MeteorBackground />

      <div className="game-content">
        <div className="game-wrapper">
          {/* HUD */}

          <div className="game-hud">
            <div className="game-stats">
              <span>SCORE: {score}</span>

              <span>LIFE: {lives}</span>

              <span>BEST: {bestScore}</span>
            </div>

            <button className="game-quit-button" onClick={finishGame}>
              QUIT
            </button>
          </div>

          {/* Canvas */}

          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="game-canvas"
          />

          {/* Buff indicator */}

          {buffVisible && <div className="buff-indicator">+1 LIFE</div>}

          {/* Game Over */}

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

/*
 * =========================
 * Meteor Background
 * =========================
 */

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
