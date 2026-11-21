import React, { useEffect, useRef } from 'react';

interface InteractiveCharactersProps {
  enabled: boolean;
  isHidden?: boolean;
}

const ACTION_HORROR_REGEX =
  /أكشن|مغامرات|رعب|إثارة|قتال|زومبي|حرب|خيال|أفلام|action|adventure|horror|thriller|zombie|fight|hero|spider|marvel|war|sci/i;

export const InteractiveCharacters: React.FC<InteractiveCharactersProps> = ({
  enabled,
  isHidden = false
}) => {
  // Direct DOM refs for zero-re-render 60 FPS animations
  const spideyGroupRef = useRef<HTMLDivElement>(null);
  const spideyHeadRef = useRef<SVGGElement>(null);
  const spideyWebThreadRef = useRef<SVGLineElement>(null);
  const spideyShotLineRef = useRef<SVGLineElement>(null);
  const spideyWebSplatterRef = useRef<SVGGElement>(null);

  const survivorGroupRef = useRef<HTMLDivElement>(null);
  const zombieGroupRef = useRef<HTMLDivElement>(null);
  const laserBeamRef = useRef<SVGLineElement>(null);
  const laserImpactRef = useRef<SVGGElement>(null);
  const muzzleFlashRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!enabled || isHidden) return;

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    const isMobile = () => vw < 640;

    const getPerchX = () => (isMobile() ? 58 : Math.min(200, vw * 0.16));
    const getPerchY = () => (isMobile() ? 98 : 116);

    const state = {
      mouseX: vw * 0.5,
      mouseY: vh * 0.45,
      spideyX: getPerchX(),
      spideyTargetX: getPerchX(),
      spideyY: 20, // drops in smoothly from top on mount!
      spideyTargetY: getPerchY(),
      spideyHeadAngle: 0,
      webTargetX: vw * 0.45,
      webTargetY: vh * 0.4,
      webAlpha: 0,
      webPulseUntil: performance.now() + 900,

      // Zombie & Survivor stage (bottom-left corner away from center content)
      zombieOffset: 10,
      zombieHitRecoil: 0,
      laserAlpha: 0,
      laserBurstModeUntil: performance.now() + 2200,
      lastShotAt: performance.now() - 1500
    };

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const handleResize = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
    };

    const triggerWebShoot = (clientX: number, clientY: number, durationMs = 780) => {
      state.webTargetX = clientX;
      state.webTargetY = clientY;
      state.webPulseUntil = performance.now() + durationMs;
      state.webAlpha = 1;

      const pad = isMobile() ? 46 : 76;
      state.spideyTargetX = clamp(clientX - 36, pad, Math.max(pad, vw - pad));
      state.spideyTargetY = clientY < vh * 0.5 ? 142 : 108;
    };

    const handlePointerInteract = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const playBtn = target.closest<HTMLElement>('[data-play-btn="true"]');
      if (playBtn) {
        const rect = playBtn.getBoundingClientRect();
        triggerWebShoot(rect.left + rect.width / 2, rect.top + rect.height / 2, 920);
        state.laserBurstModeUntil = performance.now() + 2200;
        return;
      }

      const card = target.closest<HTMLElement>('[data-channel-id], [data-interactive-target="true"]');
      if (card) {
        const group = card.getAttribute('data-channel-group') || '';
        const name = card.getAttribute('data-channel-name') || '';
        const isActionOrHorror = ACTION_HORROR_REGEX.test(`${group} ${name}`);
        const rect = card.getBoundingClientRect();

        if (isActionOrHorror || e.type === 'click') {
          triggerWebShoot(rect.left + rect.width * 0.5, rect.top + rect.height * 0.45, 780);
          state.laserBurstModeUntil = performance.now() + 2600;
        } else {
          const pad = isMobile() ? 46 : 76;
          state.spideyTargetX = clamp(rect.left + rect.width * 0.4, pad, Math.max(pad, vw - pad));
          state.spideyTargetY = 108;
          if (Math.random() < 0.45) {
            triggerWebShoot(rect.left + rect.width * 0.5, rect.top + rect.height * 0.35, 520);
          }
        }
        return;
      }

      if (e.type === 'click' && e.clientX > 0 && e.clientY > 0) {
        triggerWebShoot(e.clientX, e.clientY, 580);
        state.laserBurstModeUntil = performance.now() + 1400;
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handlePointerInteract, { passive: true });
    window.addEventListener('click', handlePointerInteract, { passive: true });

    let rafId = 0;

    const tick = (now: number) => {
      if (document.hidden) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const t = now * 0.001;

      // 1. Spider-Man smooth pendulum & leap kinematics
      const idleSwingX = Math.sin(t * 1.55) * (isMobile() ? 14 : 26);
      const idleBobY = Math.cos(t * 2.2) * 8;

      if (now > state.webPulseUntil + 950) {
        state.spideyTargetX = getPerchX();
        state.spideyTargetY = getPerchY();
      }

      state.spideyX += (state.spideyTargetX + idleSwingX - state.spideyX) * 0.08;
      state.spideyY += (state.spideyTargetY + idleBobY - state.spideyY) * 0.09;

      // Head rotates to track mouse cursor
      const dxHead = state.mouseX - state.spideyX;
      const dyHead = state.mouseY - state.spideyY;
      const targetAngle = clamp((Math.atan2(dyHead, dxHead) * 180) / Math.PI - 90, -28, 28);
      state.spideyHeadAngle += (targetAngle - state.spideyHeadAngle) * 0.16;

      if (spideyGroupRef.current) {
        const tilt = clamp((state.spideyTargetX - state.spideyX) * 0.14, -18, 18);
        spideyGroupRef.current.style.transform = `translate3d(${state.spideyX.toFixed(
          1
        )}px, ${state.spideyY.toFixed(1)}px, 0) rotate(${tilt.toFixed(1)}deg)`;
      }

      if (spideyHeadRef.current) {
        spideyHeadRef.current.style.transform = `rotate(${state.spideyHeadAngle.toFixed(1)}deg)`;
      }

      // Silk anchor thread from top screen border (y=0) down to Spider-Man
      if (spideyWebThreadRef.current) {
        const anchorX = state.spideyX + (state.spideyTargetX - state.spideyX) * 0.35;
        spideyWebThreadRef.current.setAttribute('x1', anchorX.toFixed(1));
        spideyWebThreadRef.current.setAttribute('y1', '0');
        spideyWebThreadRef.current.setAttribute('x2', state.spideyX.toFixed(1));
        spideyWebThreadRef.current.setAttribute('y2', Math.max(0, state.spideyY - 22).toFixed(1));
      }

      // Active web shot beam to hovered target / Play button
      if (now < state.webPulseUntil) {
        state.webAlpha = Math.min(1, state.webAlpha + 0.28);
      } else {
        state.webAlpha = Math.max(0, state.webAlpha - 0.07);
      }

      if (spideyShotLineRef.current && spideyWebSplatterRef.current) {
        if (state.webAlpha > 0.02) {
          spideyShotLineRef.current.setAttribute('x1', (state.spideyX + 14).toFixed(1));
          spideyShotLineRef.current.setAttribute('y1', (state.spideyY + 8).toFixed(1));
          spideyShotLineRef.current.setAttribute('x2', state.webTargetX.toFixed(1));
          spideyShotLineRef.current.setAttribute('y2', state.webTargetY.toFixed(1));
          spideyShotLineRef.current.style.opacity = state.webAlpha.toFixed(2);

          spideyWebSplatterRef.current.setAttribute(
            'transform',
            `translate(${state.webTargetX.toFixed(1)}, ${state.webTargetY.toFixed(1)}) scale(${(
              0.8 +
              state.webAlpha * 0.45
            ).toFixed(2)})`
          );
          spideyWebSplatterRef.current.style.opacity = state.webAlpha.toFixed(2);
        } else {
          spideyShotLineRef.current.style.opacity = '0';
          spideyWebSplatterRef.current.style.opacity = '0';
        }
      }

      // 2. Zombie & Survivor Action patrol at bottom-left corner (visible on mobile & desktop)
      const inBurst = now < state.laserBurstModeUntil;
      const fireInterval = inBurst ? 480 : 1450;

      const walkSpeed = inBurst ? 0.65 : 0.3;
      state.zombieOffset -= walkSpeed;

      if (state.zombieOffset < -72) {
        state.lastShotAt = now - fireInterval - 1;
      }

      if (now - state.lastShotAt >= fireInterval) {
        state.lastShotAt = now;
        state.laserAlpha = 1;
        state.zombieHitRecoil = 1;
        state.zombieOffset = Math.min(34, state.zombieOffset + 38);
      }

      state.laserAlpha = Math.max(0, state.laserAlpha - 0.075);
      state.zombieHitRecoil = Math.max(0, state.zombieHitRecoil - 0.065);

      const stageBottomY = isMobile() ? vh - 96 : vh - 52;
      const survivorX = isMobile() ? 28 : 48;
      const zombieGap = isMobile() ? 105 : 152;
      const zombieX = survivorX + zombieGap + state.zombieOffset;

      if (survivorGroupRef.current) {
        const recoilX = state.laserAlpha * -4;
        const breatheY = Math.sin(t * 3.4) * 2;
        survivorGroupRef.current.style.transform = `translate3d(${(
          survivorX + recoilX
        ).toFixed(1)}px, ${(stageBottomY + breatheY).toFixed(1)}px, 0)`;
      }

      if (zombieGroupRef.current) {
        const shambleRot = Math.sin(t * 5.6) * 5.5 + state.zombieHitRecoil * 16;
        const shambleY = Math.abs(Math.sin(t * 5.6)) * -3;
        zombieGroupRef.current.style.transform = `translate3d(${zombieX.toFixed(
          1
        )}px, ${(stageBottomY + shambleY).toFixed(1)}px, 0) rotate(${shambleRot.toFixed(1)}deg)`;
      }

      if (laserBeamRef.current && laserImpactRef.current && muzzleFlashRef.current) {
        const muzzleX = survivorX + (isMobile() ? 24 : 30);
        const muzzleY = stageBottomY - (isMobile() ? 8 : 10);
        const hitX = zombieX - 8;
        const hitY = stageBottomY - (isMobile() ? 10 : 12);

        if (state.laserAlpha > 0.03) {
          laserBeamRef.current.setAttribute('x1', muzzleX.toFixed(1));
          laserBeamRef.current.setAttribute('y1', muzzleY.toFixed(1));
          laserBeamRef.current.setAttribute('x2', hitX.toFixed(1));
          laserBeamRef.current.setAttribute('y2', hitY.toFixed(1));
          laserBeamRef.current.style.opacity = state.laserAlpha.toFixed(2);

          muzzleFlashRef.current.setAttribute('cx', muzzleX.toFixed(1));
          muzzleFlashRef.current.setAttribute('cy', muzzleY.toFixed(1));
          muzzleFlashRef.current.style.opacity = state.laserAlpha.toFixed(2);

          laserImpactRef.current.setAttribute(
            'transform',
            `translate(${hitX.toFixed(1)}, ${hitY.toFixed(1)}) scale(${(
              0.75 +
              state.laserAlpha * 0.75
            ).toFixed(2)})`
          );
          laserImpactRef.current.style.opacity = state.laserAlpha.toFixed(2);
        } else {
          laserBeamRef.current.style.opacity = '0';
          muzzleFlashRef.current.style.opacity = '0';
          laserImpactRef.current.style.opacity = '0';
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handlePointerInteract);
      window.removeEventListener('click', handlePointerInteract);
    };
  }, [enabled, isHidden]);

  if (!enabled || isHidden) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[45] pointer-events-none overflow-hidden select-none"
    >
      {/* Full-viewport lightweight SVG layer for Web Threads & Laser Beams */}
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <filter id="neonWebGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Top Silk Rope */}
        <line
          ref={spideyWebThreadRef}
          x1="180"
          y1="0"
          x2="180"
          y2="110"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2"
          strokeDasharray="4 2"
        />

        {/* Luminous Spider-Web Shot Beam */}
        <line
          ref={spideyShotLineRef}
          x1="180"
          y1="110"
          x2="360"
          y2="280"
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeDasharray="7 3"
          filter="url(#neonWebGlow)"
          style={{ opacity: 0 }}
        />

        {/* Spider-Web Impact Star on Hovered Target / Play Button */}
        <g ref={spideyWebSplatterRef} style={{ opacity: 0 }}>
          <circle cx="0" cy="0" r="18" fill="rgba(229,9,20,0.22)" stroke="rgba(255,255,255,0.92)" strokeWidth="1.5" />
          <path
            d="M-20 0 L20 0 M0 -20 L0 20 M-14 -14 L14 14 M-14 14 L14 -14"
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>

        {/* Survivor Blaster Muzzle Flash */}
        <circle
          ref={muzzleFlashRef}
          cx="78"
          cy="600"
          r="7"
          fill="#fef08a"
          filter="url(#neonWebGlow)"
          style={{ opacity: 0 }}
        />

        {/* Survivor Laser Bolt */}
        <line
          ref={laserBeamRef}
          x1="78"
          y1="600"
          x2="210"
          y2="600"
          stroke="#ff2e44"
          strokeWidth="3.8"
          strokeLinecap="round"
          filter="url(#neonWebGlow)"
          style={{ opacity: 0 }}
        />

        {/* Impact Spark on Zombie */}
        <g ref={laserImpactRef} style={{ opacity: 0 }}>
          <circle cx="0" cy="0" r="13" fill="rgba(255,60,72,0.42)" />
          <path
            d="M-12 -2 L12 2 M-2 -12 L2 12 M-9 -9 L9 9 M-9 9 L9 -9"
            stroke="#fde047"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {/* SPIDER-MAN SVG (Swinging from Top Border) */}
      <div
        ref={spideyGroupRef}
        className="absolute top-0 left-0 -ml-10 -mt-10 sm:-ml-12 sm:-mt-12 w-20 h-20 sm:w-24 sm:h-24 will-change-transform drop-shadow-[0_8px_20px_rgba(229,9,20,0.55)]"
      >
        <svg viewBox="0 0 80 80" className="w-full h-full overflow-visible">
          {/* Crouched Acrobatic Suit Body */}
          <path
            d="M27 42 C23 53, 25 63, 34 65 L46 65 C55 63, 57 53, 53 42 Z"
            fill="#16315e"
            stroke="#091020"
            strokeWidth="1.6"
          />
          <path d="M33 40 L47 40 L45 59 L35 59 Z" fill="#E50914" />
          {/* Tiny Chest Spider Emblem */}
          <circle cx="40" cy="48" r="2.6" fill="#09090b" />
          <path d="M36 45 L44 51 M44 45 L36 51" stroke="#09090b" strokeWidth="1.1" />

          {/* Left & Right Spider Legs */}
          <path
            d="M28 52 L14 63 L22 70"
            fill="none"
            stroke="#E50914"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M52 52 L66 63 L58 70"
            fill="none"
            stroke="#E50914"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Web-shooting Arm & Rope-holding Arm */}
          <path d="M49 44 L64 49" fill="none" stroke="#E50914" strokeWidth="5" strokeLinecap="round" />
          <path d="M31 44 L22 28" fill="none" stroke="#E50914" strokeWidth="4.8" strokeLinecap="round" />

          {/* Tracking Head */}
          <g ref={spideyHeadRef} style={{ transformOrigin: '40px 25px' }}>
            <ellipse cx="40" cy="25" rx="15" ry="16" fill="#E50914" stroke="#7f040b" strokeWidth="1.6" />
            <path
              d="M40 9 L40 41 M26 25 L54 25 M29 15 L51 35 M51 15 L29 35"
              stroke="rgba(15,10,14,0.48)"
              strokeWidth="1"
            />
            {/* Expressive White Lenses */}
            <path d="M28 21 Q34 18 38 25 Q33 30 28 21 Z" fill="#ffffff" stroke="#09090b" strokeWidth="1.8" />
            <path d="M52 21 Q46 18 42 25 Q47 30 52 21 Z" fill="#ffffff" stroke="#09090b" strokeWidth="1.8" />
          </g>
        </svg>
      </div>

      {/* SURVIVOR HERO SVG (Bottom Edge Defender — Visible on All Screens) */}
      <div
        ref={survivorGroupRef}
        className="absolute top-0 left-0 -ml-8 -mt-12 sm:-ml-10 sm:-mt-14 w-16 h-20 sm:w-20 sm:h-24 will-change-transform drop-shadow-[0_8px_18px_rgba(229,9,20,0.5)]"
      >
        <svg viewBox="0 0 64 72" className="w-full h-full overflow-visible">
          {/* Legs */}
          <path d="M24 48 L20 67 M35 48 L40 67" stroke="#27272a" strokeWidth="6" strokeLinecap="round" />
          {/* Tactical Armor */}
          <rect x="19" y="25" width="20" height="25" rx="6" fill="#18181b" stroke="#E50914" strokeWidth="1.8" />
          {/* Head + Glowing Crimson Visor */}
          <circle cx="29" cy="16" r="9.5" fill="#27272a" stroke="#71717a" strokeWidth="1.4" />
          <rect x="27" y="13" width="12" height="5" rx="2.5" fill="#ff2e44" />
          {/* Laser Blaster Aimed Right */}
          <path d="M35 33 L55 33" stroke="#e4e4e7" strokeWidth="5" strokeLinecap="round" />
          <circle cx="56" cy="33" r="3" fill="#ff2e44" />
        </svg>
      </div>

      {/* ZOMBIE SVG (Bottom Edge Target — Visible on All Screens) */}
      <div
        ref={zombieGroupRef}
        className="absolute top-0 left-0 -ml-8 -mt-12 sm:-ml-10 sm:-mt-14 w-16 h-20 sm:w-20 sm:h-24 will-change-transform drop-shadow-[0_8px_18px_rgba(132,204,22,0.42)]"
      >
        <svg viewBox="0 0 64 72" className="w-full h-full overflow-visible">
          {/* Shambling Legs */}
          <path d="M27 48 L24 67 M37 48 L41 67" stroke="#3f3f46" strokeWidth="5.5" strokeLinecap="round" />
          {/* Torn Coat */}
          <rect x="22" y="25" width="19" height="24" rx="5" fill="#4d7c0f" stroke="#1a2e05" strokeWidth="1.6" />
          {/* Outstretched Zombie Arms aiming Left */}
          <path d="M25 31 L8 34 M27 38 L10 41" stroke="#84cc16" strokeWidth="4.6" strokeLinecap="round" />
          {/* Zombie Head */}
          <circle cx="31" cy="16" r="9.5" fill="#84cc16" stroke="#365314" strokeWidth="1.5" />
          {/* Glowing Eyes */}
          <circle cx="26" cy="15" r="2.2" fill="#ef4444" />
          <circle cx="31" cy="15" r="1.8" fill="#ef4444" />
        </svg>
      </div>
    </div>
  );
};
