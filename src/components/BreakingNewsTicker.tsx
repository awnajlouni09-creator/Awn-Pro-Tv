import React from 'react';
import { Radio, Trophy } from 'lucide-react';
import { BreakingTickerConfig } from '../types/notifications';

interface BreakingNewsTickerProps {
  config: BreakingTickerConfig;
  hasMiniPlayer: boolean;
}

export const BreakingNewsTicker: React.FC<BreakingNewsTickerProps> = ({
  config,
  hasMiniPlayer
}) => {
  if (!config.enabled || !config.text.trim()) return null;

  const isSports = config.style === 'sports';

  // Responsive bottom offset so it never collides with MobileBottomNav or Spotify Mini Player
  const bottomClass = hasMiniPlayer
    ? 'bottom-[132px] md:bottom-[76px]'
    : 'bottom-[58px] md:bottom-0';

  return (
    <div
      className={`fixed left-0 right-0 ${bottomClass} z-35 h-8 sm:h-9 border-t backdrop-blur-md flex items-center overflow-hidden select-none transition-all duration-300 ${
        isSports
          ? 'bg-[#071a10]/95 border-emerald-500/40 text-emerald-50'
          : 'bg-[#1a0507]/95 border-[#e50914]/50 text-white'
      }`}
    >
      {/* Fixed Label Badge on RTL Right */}
      <div
        className={`h-full px-3 sm:px-4 flex items-center gap-1.5 font-black text-[10px] sm:text-xs shrink-0 z-10 shadow-lg ${
          isSports ? 'bg-emerald-500 text-black' : 'bg-[#e50914] text-white'
        }`}
      >
        {isSports ? <Trophy className="w-3.5 h-3.5 shrink-0" /> : <Radio className="w-3.5 h-3.5 animate-pulse shrink-0" />}
        <span className="whitespace-nowrap">{isSports ? 'أخبار الرياضة' : 'عاجل'}</span>
      </div>

      {/* Marquee Track */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div className="animate-ticker-rtl text-xs sm:text-[13px] font-bold tracking-wide px-4">
          <span>{config.text}</span>
          <span className="mx-10 opacity-40">•</span>
          <span>Awn Tv pro</span>
          <span className="mx-10 opacity-40">•</span>
          <span>{config.text}</span>
        </div>
      </div>
    </div>
  );
};
