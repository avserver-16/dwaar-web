import { useEffect, useRef } from 'react';

/**
 * Transparent canvas: cream particles drifting and linking into a network.
 * Sits above the gold glow and below the card, so the background colour
 * comes from CSS (see login.css).
 */
export default function ParticleNetwork({
  color = '255, 246, 220', // rgb of dots + lines
  density = 7000,          // px² per particle (lower = more particles)
  maxParticles = 200,
  maxDistance = 140,       // px, link distance
  speed = 0.4,
  mouseRadius = 190,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mouse = { x: null, y: null };
    let particles = [];
    let w = 0, h = 0, raf;

    const make = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * speed * 2,
      vy: (Math.random() - 0.5) * speed * 2,
      r: Math.random() * 1.3 + 1,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(Math.floor((w * h) / density), maxParticles);
      particles = Array.from({ length: count }, make);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;

          if (mouse.x !== null) {
            const dx = p.x - mouse.x, dy = p.y - mouse.y;
            const d = Math.hypot(dx, dy);
            if (d < mouseRadius && d > 0) {
              const f = (1 - d / mouseRadius) * 0.7;
              p.x += (dx / d) * f;
              p.y += (dy / d) * f;
            }
          }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, 0.95)`;
        ctx.fill();
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < maxDistance) {
            ctx.strokeStyle = `rgba(${color}, ${(1 - d / maxDistance) * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        if (mouse.x !== null) {
          const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
          if (d < mouseRadius) {
            ctx.strokeStyle = `rgba(${color}, ${(1 - d / mouseRadius) * 0.7})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };

    const onMove = (e) => {
      const t = e.touches ? e.touches[0] : e;
      mouse.x = t.clientX;
      mouse.y = t.clientY;
    };
    const onLeave = () => { mouse.x = mouse.y = null; };

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseout', onLeave);
    window.addEventListener('touchend', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseout', onLeave);
      window.removeEventListener('touchend', onLeave);
    };
  }, [color, density, maxParticles, maxDistance, speed, mouseRadius]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}