
import { useEffect, useRef } from 'react';

/**
 * Transparent canvas: red + indigo particles drifting and linking
 * into a subtle network.
 *
 * Sits above the background glow and below the auth card.
 */
export default function ParticleNetwork({
  color = '139, 0, 0',       // primary dark red
  secondaryColor = '75, 0, 130', // indigo
  density = 1000,
  maxParticles = 300,
  maxDistance = 150,
  speed = 0.5,
  mouseRadius = 190,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const mouse = { x: null, y: null };

    let particles = [];
    let w = 0;
    let h = 0;
    let raf;

    const make = () => {
      const useSecondary = Math.random() > 0.6;

      return {
        x: Math.random() * w,
        y: Math.random() * h,

        vx: (Math.random() - 0.5) * speed * 2,
        vy: (Math.random() - 0.5) * speed * 2,

        r: Math.random() * 1.3 + 0.8,

        color: useSecondary ? secondaryColor : color,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      w = window.innerWidth;
      h = window.innerHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(
        Math.floor((w * h) / density),
        maxParticles
      );

      particles = Array.from(
        { length: count },
        make
      );
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      /* ---------- Particles ---------- */

      for (const p of particles) {
        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > w) {
            p.vx *= -1;
          }

          if (p.y < 0 || p.y > h) {
            p.vy *= -1;
          }

          /* Mouse interaction */
          if (mouse.x !== null) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const d = Math.hypot(dx, dy);

            if (d < mouseRadius && d > 0) {
              const f =
                (1 - d / mouseRadius) * 0.7;

              p.x += (dx / d) * f;
              p.y += (dy / d) * f;
            }
          }
        }

        ctx.beginPath();

        ctx.arc(
          p.x,
          p.y,
          p.r,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = `rgba(${p.color}, 0.7)`;
        ctx.fill();
      }

      /* ---------- Network connections ---------- */

      ctx.lineWidth = 1.7;

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];

          const dx = a.x - b.x;
          const dy = a.y - b.y;

          const d = Math.hypot(dx, dy);

          if (d < maxDistance) {
            const opacity =
              (1 - d / maxDistance) * 0.22;

            /*
             * Use the first particle's colour for the
             * connection. This keeps the network subtle.
             */
            ctx.strokeStyle =
              `rgba(${a.color}, ${opacity})`;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        /* ---------- Mouse connections ---------- */

        if (mouse.x !== null) {
          const dx = a.x - mouse.x;
          const dy = a.y - mouse.y;

          const d = Math.hypot(dx, dy);

          if (d < mouseRadius) {
            const opacity =
              (1 - d / mouseRadius) * 0.45;

            ctx.strokeStyle =
              `rgba(${a.color}, ${opacity})`;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      if (!reduceMotion) {
        raf = requestAnimationFrame(draw);
      }
    };

    /* ---------- Mouse / Touch ---------- */

    const onMove = (e) => {
      const t = e.touches
        ? e.touches[0]
        : e;

      mouse.x = t.clientX;
      mouse.y = t.clientY;
    };

    const onLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    /* ---------- Init ---------- */

    resize();
    draw();

    window.addEventListener(
      'resize',
      resize
    );

    window.addEventListener(
      'mousemove',
      onMove
    );

    window.addEventListener(
      'touchmove',
      onMove,
      { passive: true }
    );

    window.addEventListener(
      'mouseout',
      onLeave
    );

    window.addEventListener(
      'touchend',
      onLeave
    );

    return () => {
      cancelAnimationFrame(raf);

      window.removeEventListener(
        'resize',
        resize
      );

      window.removeEventListener(
        'mousemove',
        onMove
      );

      window.removeEventListener(
        'touchmove',
        onMove
      );

      window.removeEventListener(
        'mouseout',
        onLeave
      );

      window.removeEventListener(
        'touchend',
        onLeave
      );
    };
  }, [
    color,
    secondaryColor,
    density,
    maxParticles,
    maxDistance,
    speed,
    mouseRadius,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
