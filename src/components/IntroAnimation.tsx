import React, { useEffect, useState } from 'react';

interface IntroAnimationProps {
  onComplete: () => void;
}

const SPECTRUM_RIBBONS = [
  { left: '12%', width: '10px', color: 'from-transparent via-[#e50914] to-transparent', delay: '0ms' },
  { left: '22%', width: '16px', color: 'from-transparent via-[#ff5500] to-transparent', delay: '60ms' },
  { left: '30%', width: '8px', color: 'from-transparent via-[#38bdf8]/80 to-transparent', delay: '120ms' },
  { left: '38%', width: '20px', color: 'from-transparent via-[#e50914] to-transparent', delay: '40ms' },
  { left: '47%', width: '14px', color: 'from-transparent via-[#fb923c] to-transparent', delay: '90ms' },
  { left: '54%', width: '22px', color: 'from-transparent via-[#e50914] to-transparent', delay: '20ms' },
  { left: '63%', width: '10px', color: 'from-transparent via-[#60a5fa]/85 to-transparent', delay: '140ms' },
  { left: '72%', width: '18px', color: 'from-transparent via-[#ff3b30] to-transparent', delay: '70ms' },
  { left: '82%', width: '12px', color: 'from-transparent via-[#fb923c]/90 to-transparent', delay: '110ms' },
  { left: '90%', width: '9px', color: 'from-transparent via-[#e50914]/80 to-transparent', delay: '150ms' }
];

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'enter' | 'ribbons' | 'zoom' | 'done'>('enter');

  useEffect(() => {
    // Cinematic "Tudum"-inspired deep dual-pulse bass synth via Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const playPulse = (start: number, freq: number, dur: number, vol: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.65, start + dur);
          gain.gain.setValueAtTime(0.001, start);
          gain.gain.linearRampToValueAtTime(vol, start + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + dur + 0.05);
        };

        playPulse(now + 0.08, 92, 0.24, 0.22);
        playPulse(now + 0.34, 72, 1.35, 0.28);
      }
    } catch {
      // Browser autoplay policy fallback
    }

    const t1 = setTimeout(() => setPhase('ribbons'), 850);
    const t2 = setTimeout(() => setPhase('zoom'), 2050);
    const t3 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#000000] flex flex-col items-center justify-center select-none overflow-hidden transition-opacity duration-500 ${
        phase === 'done' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient Radial Cinema Bloom behind the 3D A */}
      <div
        className={`absolute w-[520px] h-[520px] rounded-full blur-[130px] pointer-events-none transition-all duration-1000 ${
          phase === 'enter'
            ? 'bg-[#e50914]/15 scale-75 opacity-60'
            : phase === 'ribbons'
            ? 'bg-[#e50914]/35 scale-125 opacity-100'
            : 'bg-[#e50914]/50 scale-150 opacity-0'
        }`}
      />

      {/* Glowing Spectrum Light Ribbons (Red, Orange, Soft Blue) */}
      {(phase === 'ribbons' || phase === 'zoom') && (
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden transition-opacity duration-500 ${
            phase === 'zoom' ? 'opacity-90' : 'opacity-85'
          }`}
        >
          <div className="relative w-full max-w-3xl h-[85vh]">
            {SPECTRUM_RIBBONS.map((ribbon, idx) => (
              <div
                key={idx}
                className={`absolute top-0 bottom-0 bg-gradient-to-b ${ribbon.color} blur-[2px] animate-netflix-ribbon`}
                style={{
                  left: ribbon.left,
                  width: ribbon.width,
                  animationDelay: ribbon.delay
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Center 3D Netflix-Style Sculpted "A" Emblem */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center ${
          phase === 'zoom'
            ? 'animate-netflix-zoom-exit'
            : 'animate-netflix-a-reveal'
        }`}
      >
        <div className="relative w-44 h-52 sm:w-56 sm:h-64 md:w-64 md:h-72 flex items-center justify-center">
          {/* Deep 3D Shadow Extrusion */}
          <svg
            viewBox="0 0 220 260"
            className="w-full h-full drop-shadow-[0_24px_45px_rgba(229,9,20,0.45)]"
            aria-label="Awn Tv pro"
          >
            <defs>
              {/* Left Leg 3D Gradient */}
              <linearGradient id="aLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#99040c" />
                <stop offset="55%" stopColor="#c40812" />
                <stop offset="100%" stopColor="#680207" />
              </linearGradient>

              {/* Right Leg 3D Gradient */}
              <linearGradient id="aRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e50914" />
                <stop offset="50%" stopColor="#b20710" />
                <stop offset="100%" stopColor="#5c0206" />
              </linearGradient>

              {/* Crossbar Bright Center Ribbon */}
              <linearGradient id="aBarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff2e38" />
                <stop offset="50%" stopColor="#e50914" />
                <stop offset="100%" stopColor="#a3050d" />
              </linearGradient>

              {/* Apex Specular Highlight */}
              <linearGradient id="aHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#e50914" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Left 3D Extruded Pillar */}
            <polygon
              points="92,18 124,18 52,242 14,242"
              fill="url(#aLeftGrad)"
            />
            {/* Left Inner Shadow Edge */}
            <polygon
              points="116,18 124,18 52,242 42,242"
              fill="#3d0003"
              opacity="0.55"
            />

            {/* Right 3D Extruded Pillar */}
            <polygon
              points="96,18 128,18 206,242 168,242"
              fill="url(#aRightGrad)"
            />

            {/* 3D Crossbar Ribbon */}
            <polygon
              points="56,154 164,154 176,186 44,186"
              fill="url(#aBarGrad)"
            />
            {/* Crossbar Under-shadow for 3D depth */}
            <polygon
              points="44,186 176,186 172,193 48,193"
              fill="#2a0002"
              opacity="0.7"
            />

            {/* Bright Apex Fold Ribbon (Signature 3D Fold Effect) */}
            <polygon
              points="92,18 128,18 158,108 126,108"
              fill="url(#aHighlight)"
              opacity="0.38"
            />
          </svg>
        </div>

        {/* Brand Title reveal underneath before zoom */}
        <div
          className={`mt-2 text-center transition-all duration-700 ${
            phase === 'enter'
              ? 'opacity-0 translate-y-3'
              : phase === 'ribbons'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 scale-110'
          }`}
        >
          <p className="text-2xl sm:text-3xl font-black tracking-[0.2em] text-white font-['Outfit'] uppercase">
            Awn Tv <span className="text-[#e50914]">pro</span>
          </p>
        </div>
      </div>

      {/* Skip Button in bottom corner */}
      <button
        type="button"
        onClick={onComplete}
        className="absolute bottom-6 left-6 z-20 px-4 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white bg-black/60 hover:bg-white/10 border border-white/15 backdrop-blur-sm transition-all cursor-pointer"
      >
        تخطي المقدمة
      </button>
    </div>
  );
};
