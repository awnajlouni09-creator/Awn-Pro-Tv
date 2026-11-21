import React, { useEffect, useState } from 'react';
import { Activity, Zap } from 'lucide-react';

interface TelemetryHudProps {
  isPlaying?: boolean;
  hasMiniPlayer?: boolean;
}

export const TelemetryHud: React.FC<TelemetryHudProps> = ({
  isPlaying = false
}) => {
  const [pulseLevel, setPulseLevel] = useState(98.4);
  const [clockText, setClockText] = useState(() =>
    new Date().toLocaleTimeString('en-GB', { hour12: false })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setClockText(now.toLocaleTimeString('en-GB', { hour12: false }));
      const base = isPlaying ? 99.6 : 98.2;
      const wave = ((Math.sin(now.getSeconds() * 0.8) + 1) * 0.25);
      setPulseLevel(Number(Math.min(99.9, base + wave).toFixed(1)));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <div
      dir="ltr"
      aria-label="الشريط الزمني الكوني"
      className="fixed top-0 left-0 right-0 z-40 h-7 px-3 sm:px-8 md:px-12 bg-[#05030d]/92 backdrop-blur-xl border-b border-purple-500/25 flex items-center justify-between gap-2 text-[9px] sm:text-[10px] font-mono select-none pointer-events-none"
    >
      {/* Left Side: Temporal Year Readout */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <span className="inline-flex items-center gap-1.5 text-amber-300 font-bold tracking-wider truncate">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
          </span>
          <span className="truncate">YEAR: 9999999999999999</span>
        </span>
      </div>

      {/* Center: Cosmic Stream Status */}
      <div className="hidden md:flex items-center gap-2 text-purple-200 font-bold tracking-[0.12em]">
        <Zap className="w-3 h-3 text-[#E50914] drop-shadow-[0_0_6px_#E50914]" />
        <span>QUANTUM STREAM: 128K ULTRA</span>
      </div>

      {/* Right Side: Live Energy Pulse & Clock */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        <div className="flex items-center gap-1.5 text-rose-300 font-semibold tabular-nums">
          <Activity className="w-3 h-3 text-purple-400 animate-pulse" />
          <span className="hidden xs:inline sm:inline">ENERGY:</span>
          <span className="text-amber-300 font-bold">{pulseLevel}%</span>
        </div>

        <span className="hidden sm:inline h-3 w-px bg-purple-400/25" aria-hidden="true" />

        <span className="hidden sm:inline text-zinc-300 font-bold tabular-nums tracking-wider">
          {clockText}
        </span>
      </div>
    </div>
  );
};
