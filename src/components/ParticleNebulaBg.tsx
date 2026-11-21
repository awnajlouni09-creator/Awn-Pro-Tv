import React, { useEffect, useRef } from 'react';

export type AppThemeId = 'action' | 'galaxy' | '2077' | 'netflix';

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  tone: 'primary' | 'secondary';
  depth: number;
}

interface ParticleNebulaBgProps {
  theme?: AppThemeId;
}

export const ParticleNebulaBg: React.FC<ParticleNebulaBgProps> = ({ theme = 'action' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    if (theme === 'netflix') {
      // Classic Netflix: pure dark cinema surface (#141414) without particles
      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, width, height);
      const handleClassicResize = () => {
        resize();
        ctx.fillStyle = '#141414';
        ctx.fillRect(0, 0, width, height);
      };
      window.addEventListener('resize', handleClassicResize, { passive: true });
      return () => window.removeEventListener('resize', handleClassicResize);
    }

    const count =
      theme === 'galaxy'
        ? Math.min(54, Math.max(24, Math.floor((width * height) / 30000)))
        : Math.min(42, Math.max(18, Math.floor((width * height) / 40000)));

    const particles: AmbientParticle[] = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.14 - 0.03,
      radius: i % 3 === 0 ? 1.2 + Math.random() * 1.2 : 0.7 + Math.random() * 0.85,
      alpha: 0.22 + Math.random() * 0.48,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.018 + Math.random() * 0.022,
      tone: i % 3 === 0 ? 'primary' : 'secondary',
      depth: 0.4 + Math.random() * 0.7
    }));

    const mouse = {
      x: width * 0.5,
      y: height * 0.35,
      targetX: width * 0.5,
      targetY: height * 0.35
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let rafId = 0;

    const baseBg =
      theme === 'galaxy' ? '#04020f' : theme === '2077' ? '#050914' : '#07070c';

    const render = () => {
      if (document.hidden) {
        rafId = requestAnimationFrame(render);
        return;
      }

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.fillStyle = baseBg;
      ctx.fillRect(0, 0, width, height);

      const shiftX = (mouse.x - width * 0.5) * 0.04;
      const shiftY = (mouse.y - height * 0.5) * 0.04;

      if (theme === 'galaxy') {
        // Cosmic Violet + Celestial Gold Nebulae
        const g1 = ctx.createRadialGradient(
          width * 0.78 + shiftX,
          height * 0.22 + shiftY,
          0,
          width * 0.78 + shiftX,
          height * 0.22 + shiftY,
          Math.max(width, height) * 0.58
        );
        g1.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
        g1.addColorStop(0.45, 'rgba(109, 40, 217, 0.08)');
        g1.addColorStop(1, 'rgba(4, 2, 15, 0)');
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, width, height);

        const g2 = ctx.createRadialGradient(
          width * 0.2 - shiftX,
          height * 0.72 - shiftY,
          0,
          width * 0.2 - shiftX,
          height * 0.72 - shiftY,
          Math.max(width, height) * 0.5
        );
        g2.addColorStop(0, 'rgba(245, 158, 11, 0.14)');
        g2.addColorStop(0.55, 'rgba(229, 9, 20, 0.06)');
        g2.addColorStop(1, 'rgba(4, 2, 15, 0)');
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, width, height);
      } else if (theme === '2077') {
        // Electric Cyan + Cyber Crimson HUD Glow
        const c1 = ctx.createRadialGradient(
          width * 0.76 + shiftX,
          height * 0.2 + shiftY,
          0,
          width * 0.76 + shiftX,
          height * 0.2 + shiftY,
          Math.max(width, height) * 0.54
        );
        c1.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
        c1.addColorStop(0.5, 'rgba(14, 116, 144, 0.06)');
        c1.addColorStop(1, 'rgba(5, 9, 20, 0)');
        ctx.fillStyle = c1;
        ctx.fillRect(0, 0, width, height);

        const c2 = ctx.createRadialGradient(
          width * 0.22 - shiftX,
          height * 0.72 - shiftY,
          0,
          width * 0.22 - shiftX,
          height * 0.72 - shiftY,
          Math.max(width, height) * 0.5
        );
        c2.addColorStop(0, 'rgba(244, 63, 94, 0.15)');
        c2.addColorStop(1, 'rgba(5, 9, 20, 0)');
        ctx.fillStyle = c2;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Live Action Obsidian + Ruby Crimson Spotlight
        const redX = width * 0.78 + shiftX;
        const redY = height * 0.2 + shiftY;
        const redGrad = ctx.createRadialGradient(
          redX,
          redY,
          0,
          redX,
          redY,
          Math.max(width, height) * 0.52
        );
        redGrad.addColorStop(0, 'rgba(229, 9, 20, 0.14)');
        redGrad.addColorStop(0.5, 'rgba(130, 8, 22, 0.05)');
        redGrad.addColorStop(1, 'rgba(7, 7, 12, 0)');
        ctx.fillStyle = redGrad;
        ctx.fillRect(0, 0, width, height);

        const silkX = width * 0.22 - shiftX;
        const silkY = height * 0.28 - shiftY;
        const silkGrad = ctx.createRadialGradient(
          silkX,
          silkY,
          0,
          silkX,
          silkY,
          Math.max(width, height) * 0.48
        );
        silkGrad.addColorStop(0, 'rgba(255, 255, 255, 0.045)');
        silkGrad.addColorStop(0.55, 'rgba(160, 160, 190, 0.015)');
        silkGrad.addColorStop(1, 'rgba(7, 7, 12, 0)');
        ctx.fillStyle = silkGrad;
        ctx.fillRect(0, 0, width, height);
      }

      const pShiftX = (mouse.x - width * 0.5) * 0.02;
      const pShiftY = (mouse.y - height * 0.5) * 0.02;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!prefersReducedMotion) {
          p.x += p.vx * p.depth;
          p.y += p.vy * p.depth;
          p.twinklePhase += p.twinkleSpeed;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
        }

        const px = p.x - pShiftX * p.depth;
        const py = p.y - pShiftY * p.depth;
        const alpha = p.alpha * (0.65 + 0.35 * Math.sin(p.twinklePhase));

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        if (theme === 'galaxy') {
          ctx.fillStyle =
            p.tone === 'primary'
              ? `rgba(251, 191, 36, ${alpha})`
              : `rgba(216, 180, 254, ${alpha * 0.85})`;
        } else if (theme === '2077') {
          ctx.fillStyle =
            p.tone === 'primary'
              ? `rgba(34, 211, 238, ${alpha})`
              : `rgba(244, 63, 94, ${alpha * 0.8})`;
        } else {
          ctx.fillStyle =
            p.tone === 'primary'
              ? `rgba(229, 9, 20, ${alpha})`
              : `rgba(244, 244, 248, ${alpha * 0.75})`;
        }
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none select-none"
    />
  );
};
