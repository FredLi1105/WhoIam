import { useEffect, useRef } from "react";

const STAR_COUNT = 320;

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  bright: boolean;
  twinkle: number;
  twinkleSpeed: number;
}

function Background() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrame = 0;

    const mouse = {
      x: -1000,
      y: -1000,
      previousX: -1000,
      previousY: -1000,
      active: false,
    };

    const stars: Star[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const createStar = (): Star => {
      const bright = Math.random() < 0.08;

      return {
        x: Math.random() * width,
        y: Math.random() * height,

        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,

        size: bright ? 1.2 + Math.random() * 1.4 : 0.5 + Math.random() * 0.9,

        alpha: bright
          ? 0.65 + Math.random() * 0.25
          : 0.3 + Math.random() * 0.35,

        bright,

        twinkle: Math.random() * Math.PI * 2,

        twinkleSpeed: 0.003 + Math.random() * 0.008,
      };
    };

    const createStars = () => {
      stars.length = 0;

      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push(createStar());
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.previousX = mouse.x;
      mouse.previousY = mouse.y;

      mouse.x = event.clientX;
      mouse.y = event.clientY;

      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;

      mouse.x = -1000;
      mouse.y = -1000;
    };

    const updateStars = () => {
      const radius = 100;

      stars.forEach((star) => {
        /*
         * Very slow natural movement
         */
        star.x += star.vx;
        star.y += star.vy;

        /*
         * Mouse interaction
         */
        if (mouse.active) {
          const dx = star.x - mouse.x;
          const dy = star.y - mouse.y;

          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < radius) {
            const force = 1 - distance / radius;

            const safeDistance = Math.max(distance, 1);

            /*
             * Push away from cursor
             */
            const push = force * 0.08;

            star.vx += (dx / safeDistance) * push;

            star.vy += (dy / safeDistance) * push;

            /*
             * Swirl
             *
             * This makes the stars curve
             * around the cursor instead of
             * simply being pushed away.
             */
            const swirl = force * 0.035;

            star.vx += (-dy / safeDistance) * swirl;

            star.vy += (dx / safeDistance) * swirl;
          }
        }

        /*
         * Friction
         */
        star.vx *= 0.985;
        star.vy *= 0.985;

        /*
         * Keep stars within reasonable speed
         */
        const maxSpeed = 1.4;

        star.vx = Math.max(-maxSpeed, Math.min(maxSpeed, star.vx));

        star.vy = Math.max(-maxSpeed, Math.min(maxSpeed, star.vy));

        /*
         * Screen wrapping
         */
        if (star.x < -20) {
          star.x = width + 20;
        }

        if (star.x > width + 20) {
          star.x = -20;
        }

        if (star.y < -20) {
          star.y = height + 20;
        }

        if (star.y > height + 20) {
          star.y = -20;
        }

        star.twinkle += star.twinkleSpeed;
      });
    };

    const drawStar = (star: Star) => {
      const twinkle = 0.85 + Math.sin(star.twinkle) * 0.15;

      const alpha = star.alpha * twinkle;

      /*
       * Bright stars get a subtle glow
       */
      if (star.bright) {
        const glow = ctx.createRadialGradient(
          star.x,
          star.y,
          0,
          star.x,
          star.y,
          star.size * 6,
        );

        glow.addColorStop(0, `rgba(180, 195, 255, ${alpha * 0.4})`);

        glow.addColorStop(1, "rgba(180, 195, 255, 0)");

        ctx.fillStyle = glow;

        ctx.beginPath();

        ctx.arc(star.x, star.y, star.size * 6, 0, Math.PI * 2);

        ctx.fill();
      }

      /*
       * Star itself
       */
      ctx.beginPath();

      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);

      ctx.fillStyle = `rgba(225, 230, 255, ${alpha})`;

      ctx.fill();
    };

    const drawBackground = () => {
      /*
       * Base background
       */
      const background = ctx.createRadialGradient(
        width * 0.5,
        height * 0.35,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height),
      );

      background.addColorStop(0, "#11152A");

      background.addColorStop(0.45, "#080B17");

      background.addColorStop(1, "#03040A");

      ctx.fillStyle = background;

      ctx.fillRect(0, 0, width, height);

      /*
       * Purple nebula
       */
      const purple = ctx.createRadialGradient(
        width * 0.2,
        height * 0.2,
        0,
        width * 0.2,
        height * 0.2,
        width * 0.55,
      );

      purple.addColorStop(0, "rgba(90, 70, 170, 0.12)");

      purple.addColorStop(1, "rgba(90, 70, 170, 0)");

      ctx.fillStyle = purple;

      ctx.fillRect(0, 0, width, height);

      /*
       * Blue-nebula
       */
      const blue = ctx.createRadialGradient(
        width * 0.8,
        height * 0.7,
        0,
        width * 0.8,
        height * 0.7,
        width * 0.5,
      );

      blue.addColorStop(0, "rgba(45, 80, 170, 0.10)");

      blue.addColorStop(1, "rgba(45, 80, 170, 0)");

      ctx.fillStyle = blue;

      ctx.fillRect(0, 0, width, height);
    };

    const render = () => {
      drawBackground();

      updateStars();

      stars.forEach(drawStar);

      animationFrame = requestAnimationFrame(render);
    };

    resize();
    createStars();
    render();

    window.addEventListener("resize", resize);

    window.addEventListener("mousemove", handleMouseMove);

    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener("resize", resize);

      window.removeEventListener("mousemove", handleMouseMove);

      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="background-canvas" aria-hidden="true" />
  );
}

export default Background;
