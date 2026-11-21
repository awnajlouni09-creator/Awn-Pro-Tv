import React, { useEffect, useState } from 'react';
import { playBiometricScanChime } from '../utils/sciFiAudio';
import { AppThemeId } from './ParticleNebulaBg';

interface IntroAnimationProps {
  onComplete: () => void;
  theme?: AppThemeId;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({
  onComplete,
  theme = 'action'
}) => {
  const [phase, setPhase] = useState<'reveal' | 'glow' | 'done'>('reveal');
  const isClassic = theme === 'netflix';

  useEffect(() => {
    if (!isClassic) {
      playBiometricScanChime();
    }

    const t1 = setTimeout(() => setPhase('glow'), 680);
    const t2 = setTimeout(() => setPhase('done'), 940);
    const t3 = setTimeout(() => {
      onComplete();
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete, isClassic]);

  if (isClassic) {
    return (
      <div
        className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden transition-opacity duration-250 ${
          phase === 'done' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div
          className={`flex flex-col items-center justify-center ${
            phase === 'done' ? 'animate-netflix-zoom-exit' : 'animate-netflix-a-reveal'
          }`}
        >
          <svg viewBox="0 0 220 260" className="w-36 h-44 sm:w-44 sm:h-52" aria-label="Awn Tv pro">
            <polygon points="92,18 124,18 52,242 14,242" fill="#B1060F" />
            <polygon points="96,18 128,18 206,242 168,242" fill="#E50914" />
            <polygon points="56,154 164,154 176,186 44,186" fill="#E50914" />
          </svg>
          <p className="mt-5 text-2xl sm:text-3xl font-black tracking-tight text-[#E50914] font-['Outfit']">
            Awn Tv pro
          </p>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="absolute bottom-6 left-6 z-20 px-4 py-2 rounded-md text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 border border-white/15 cursor-pointer"
        >
          تخطي
        </button>
      </div>
    );
  }

  const auraBg =
    theme === 'galaxy'
      ? 'bg-[radial-gradient(circle,rgba(168,85,247,0.34)_0%,rgba(245,158,11,0.12)_45%,transparent_76%)]'
      : theme === '2077'
      ? 'bg-[radial-gradient(circle,rgba(6,182,212,0.34)_0%,rgba(244,63,94,0.14)_45%,transparent_76%)]'
      : 'bg-[radial-gradient(circle,rgba(229,9,20,0.28)_0%,rgba(229,9,20,0.1)_42%,transparent_76%)]';

  const frameBorder =
    theme === 'galaxy'
      ? 'border-purple-400/55 shadow-[0_24px_80px_rgba(0,0,0,0.9),0_0_65px_rgba(168,85,247,0.42)]'
      : theme === '2077'
      ? 'border-cyan-400/60 shadow-[0_24px_80px_rgba(0,0,0,0.9),0_0_65px_rgba(6,182,212,0.42)]'
      : 'border-[#E50914]/55 shadow-[0_24px_80px_rgba(0,0,0,0.9),0_0_65px_rgba(229,9,20,0.4)]';

  const scanBeam =
    theme === 'galaxy'
      ? 'via-amber-300 shadow-[0_0_20px_4px_rgba(251,191,36,0.9)]'
      : theme === '2077'
      ? 'via-cyan-300 shadow-[0_0_20px_4px_rgba(34,211,238,0.95)]'
      : 'via-[#E50914] shadow-[0_0_20px_4px_rgba(229,9,20,0.9)]';

  return (
    <div
      data-theme={theme}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden transition-opacity duration-250 ${
        theme === 'galaxy'
          ? 'bg-[#04020f]'
          : theme === '2077'
          ? 'bg-[#050914]'
          : 'bg-[#07070c]'
      } ${phase === 'done' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Ambient Cinematic Aura */}
      <div className={`absolute w-[540px] h-[540px] rounded-full ${auraBg} blur-[72px] pointer-events-none`} />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <div
          className={`relative flex items-center justify-center ${
            phase === 'done' ? 'animate-netflix-zoom-exit' : 'animate-netflix-a-reveal'
          }`}
        >
          {/* Modern 3D Frosted Glass Frame */}
          <div
            className={`relative w-48 h-56 sm:w-56 sm:h-64 flex items-center justify-center rounded-3xl modern-glass border overflow-hidden ${frameBorder}`}
          >
            <div
              aria-hidden="true"
              className="absolute -inset-6 bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-12 pointer-events-none"
            />

            <div
              className={`animate-biometric-scan absolute left-3 right-3 h-[2px] bg-gradient-to-r from-transparent to-transparent z-20 pointer-events-none ${scanBeam}`}
            />

            <svg
              viewBox="0 0 220 260"
              className="w-36 h-44 sm:w-44 sm:h-52 drop-shadow-[0_0_28px_rgba(229,9,20,0.65)]"
              aria-label="Awn Tv pro"
            >
              <defs>
                <linearGradient id="aModernLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={theme === 'galaxy' ? '#c084fc' : theme === '2077' ? '#22d3ee' : '#ff4d58'} />
                  <stop offset="55%" stopColor={theme === 'galaxy' ? '#7c3aed' : theme === '2077' ? '#0891b2' : '#E50914'} />
                  <stop offset="100%" stopColor={theme === 'galaxy' ? '#3b0764' : theme === '2077' ? '#0f172a' : '#7f040b'} />
                </linearGradient>
                <linearGradient id="aModernRight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
                  <stop offset="35%" stopColor={theme === 'galaxy' ? '#fbbf24' : theme === '2077' ? '#f43f5e' : '#ff2e3a'} />
                  <stop offset="100%" stopColor={theme === 'galaxy' ? '#9333ea' : theme === '2077' ? '#9f1239' : '#99060e'} />
                </linearGradient>
                <linearGradient id="aModernBar" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={theme === 'galaxy' ? '#9333ea' : theme === '2077' ? '#06b6d4' : '#b0060f'} />
                  <stop offset="50%" stopColor={theme === 'galaxy' ? '#fbbf24' : theme === '2077' ? '#f43f5e' : '#ff4d58'} />
                  <stop offset="100%" stopColor={theme === 'galaxy' ? '#ec4899' : theme === '2077' ? '#22d3ee' : '#E50914'} />
                </linearGradient>
              </defs>

              <polygon points="92,18 124,18 52,242 14,242" fill="url(#aModernLeft)" />
              <polygon points="96,18 128,18 206,242 168,242" fill="url(#aModernRight)" />
              <polygon points="56,154 164,154 176,186 44,186" fill="url(#aModernBar)" />
            </svg>
          </div>
        </div>

        {/* Brand Wordmark */}
        <div className="mt-6 text-center space-y-1.5">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Outfit'] drop-shadow-[0_0_24px_rgba(229,9,20,0.65)]">
            Awn Tv{' '}
            <span
              className={
                theme === 'galaxy'
                  ? 'text-amber-300'
                  : theme === '2077'
                  ? 'text-cyan-400'
                  : 'text-[#E50914]'
              }
            >
              pro
            </span>
          </p>
          <p
            className={`text-xs font-semibold tracking-wide transition-colors duration-300 ${
              phase === 'glow' ? 'text-white' : 'text-zinc-400'
            }`}
          >
            أفلام ومسلسلات حصرية
          </p>
        </div>
      </div>

      {/* Quick Skip Button */}
      <button
        type="button"
        onClick={onComplete}
        className="absolute bottom-6 left-6 z-20 px-4 py-2 rounded-xl text-xs font-bold text-zinc-200 hover:text-white modern-glass border border-white/15 hover:border-[#E50914]/60 transition-all cursor-pointer"
      >
        تخطي
      </button>
    </div>
  );
};
