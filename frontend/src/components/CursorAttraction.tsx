'use client';

import { useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════
   CURSOR ATTRACTION PARTICLES
   ═══════════════════════════════════════════════════════
   A full-page canvas overlay that renders particles which
   are gravitationally attracted to the mouse cursor.
   
   • Particles drift randomly when cursor is far
   • They accelerate toward cursor within attraction radius
   • Connected by lines when close enough (constellation)
   • Performance: requestAnimationFrame + hardware accel
   ═══════════════════════════════════════════════════════ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  radius: number;
  color: string;
  alpha: number;
}

const PARTICLE_COUNT = 70;
const ATTRACTION_RADIUS = 180;
const ATTRACTION_FORCE = 0.06;
const CONNECTION_DISTANCE = 120;
const RETURN_SPEED = 0.02;
const DRIFT_SPEED = 0.3;

const COLORS = [
  'rgba(139, 92, 246,',  // purple
  'rgba(0, 229, 168,',   // green/accent
  'rgba(59, 130, 246,',  // blue
  'rgba(124, 58, 237,',  // primary
];

export default function CursorAttraction() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animIdRef = useRef<number>(0);

  const initParticles = useCallback((w: number, h: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * DRIFT_SPEED,
        vy: (Math.random() - 0.5) * DRIFT_SPEED,
        baseX: x,
        baseY: y,
        radius: Math.random() * 2 + 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.5 + 0.3,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (particlesRef.current.length === 0) {
        initParticles(canvas.width, canvas.height);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const onMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;
      const particles = particlesRef.current;

      // Group connection lines by opacity bucket to batch draw calls
      const connectionBuckets: { [key: number]: [number, number, number, number][] } = {
        1: [], // alpha 0.04
        2: [], // alpha 0.08
        3: [], // alpha 0.12
      };

      const mouseBuckets: { [key: number]: [number, number, number, number][] } = {
        1: [], // alpha 0.08
        2: [], // alpha 0.16
        3: [], // alpha 0.24
      };

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Distance to mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ATTRACTION_RADIUS && mouse.x > 0) {
          // Attract toward cursor
          const force = (1 - dist / ATTRACTION_RADIUS) * ATTRACTION_FORCE;
          p.vx += dx * force;
          p.vy += dy * force;
        } else {
          // Return to base position with drift
          p.vx += (p.baseX - p.x) * RETURN_SPEED;
          p.vy += (p.baseY - p.y) * RETURN_SPEED;
        }

        // Damping
        p.vx *= 0.92;
        p.vy *= 0.92;

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.alpha})`;
        ctx.fill();

        // Accumulate connections to nearby particles into opacity buckets
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < CONNECTION_DISTANCE) {
            const ratio = 1 - cdist / CONNECTION_DISTANCE;
            const bucketKey = Math.min(3, Math.floor(ratio * 3) + 1);
            connectionBuckets[bucketKey].push([p.x, p.y, p2.x, p2.y]);
          }
        }

        // Accumulate mouse connections into opacity buckets
        if (dist < ATTRACTION_RADIUS && mouse.x > 0) {
          const ratio = 1 - dist / ATTRACTION_RADIUS;
          const bucketKey = Math.min(3, Math.floor(ratio * 3) + 1);
          mouseBuckets[bucketKey].push([p.x, p.y, mouse.x, mouse.y]);
        }
      }

      // Draw batched particle-to-particle connections
      ctx.lineWidth = 0.5;
      for (let b = 1; b <= 3; b++) {
        const lines = connectionBuckets[b];
        if (lines.length === 0) continue;
        ctx.beginPath();
        const alpha = b * 0.04;
        ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
        for (let k = 0; k < lines.length; k++) {
          const [x1, y1, x2, y2] = lines[k];
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();
      }

      // Draw batched mouse connections
      ctx.lineWidth = 0.6;
      for (let b = 1; b <= 3; b++) {
        const lines = mouseBuckets[b];
        if (lines.length === 0) continue;
        ctx.beginPath();
        const alpha = b * 0.08;
        ctx.strokeStyle = `rgba(0, 229, 168, ${alpha})`;
        for (let k = 0; k < lines.length; k++) {
          const [x1, y1, x2, y2] = lines[k];
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();
      }

      // Draw a subtle glow dot at cursor position
      if (mouse.x > 0) {
        const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 60);
        gradient.addColorStop(0, 'rgba(124, 58, 237, 0.12)');
        gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 60, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animIdRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    animIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animIdRef.current);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
}
