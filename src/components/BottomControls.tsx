import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Maximize, 
  Clock, 
  Tv, 
  Radio, 
  Sparkles 
} from 'lucide-react';
import { Channel } from '../types/iptv';

interface BottomControlsProps {
  currentChannel: Channel | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  onNextChannel: () => void;
  onPrevChannel: () => void;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onOpenRemote: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  currentChannel,
  isPlaying,
  onTogglePlay,
  onStop,
  onNextChannel,
  onPrevChannel,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onOpenRemote
}) => {
  // Sleep Timer state
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null);

  // Sleep timer interval
  useEffect(() => {
    if (sleepTimerMinutes === null) {
      setSleepTimeRemaining(null);
      return;
    }

    setSleepTimeRemaining(sleepTimerMinutes * 60);

    const interval = setInterval(() => {
      setSleepTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          onStop();
          setSleepTimerMinutes(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  const cycleSleepTimer = () => {
    if (sleepTimerMinutes === null) setSleepTimerMinutes(15);
    else if (sleepTimerMinutes === 15) setSleepTimerMinutes(30);
    else if (sleepTimerMinutes === 30) setSleepTimerMinutes(60);
    else setSleepTimerMinutes(null);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-4 h-4 text-zinc-500" />;
    if (volume < 50) return <Volume1 className="w-4 h-4 text-zinc-300" />;
    return <Volume2 className="w-4 h-4 text-zinc-200" />;
  };

  return (
    <footer className="h-16 bg-[#121212] border-t border-[#262626] px-4 md:px-6 flex items-center justify-between gap-4 select-none shrink-0 z-30">
      {/* Playback Controls Zone (Right in Arabic layout / Start) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Previous Channel */}
        <button
          onClick={onPrevChannel}
          className="p-2 text-zinc-400 hover:text-white hover:bg-[#222222] rounded-lg transition-colors cursor-pointer"
          title="القناة السابقة (السهم لأعلى)"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Play / Pause Primary Button */}
        <button
          onClick={onTogglePlay}
          className="w-10 h-10 rounded-xl bg-[#cc0000] hover:bg-[#ff1a1a] text-white flex items-center justify-center shadow-lg shadow-[#cc0000]/25 transition-all cursor-pointer active:scale-95"
          title={isPlaying ? 'إيقاف مؤقت (مسافة)' : 'تشغيل (مسافة)'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Stop Button */}
        <button
          onClick={onStop}
          className="p-2 text-zinc-400 hover:text-white hover:bg-[#222222] rounded-lg transition-colors cursor-pointer"
          title="إيقاف البث تماماً"
        >
          <Square className="w-4 h-4" />
        </button>

        {/* Next Channel */}
        <button
          onClick={onNextChannel}
          className="p-2 text-zinc-400 hover:text-white hover:bg-[#222222] rounded-lg transition-colors cursor-pointer"
          title="القناة التالية (السهم لأسفل)"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Middle Channel Info Zone */}
      <div className="flex-1 min-w-0 max-w-md hidden sm:flex items-center gap-3 px-3 py-1.5 bg-[#181818] rounded-xl border border-[#262626]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#cc0000] shrink-0 animate-pulse"></div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate leading-tight">
            {currentChannel ? currentChannel.name : 'جاهز للتشغيل'}
          </p>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
            {currentChannel ? (currentChannel.group || 'باقة عامة') : 'Awn Tv pro Receiver Ready'}
          </p>
        </div>
      </div>

      {/* Right Tools & Volume Zone */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Sleep Timer */}
        <button
          onClick={cycleSleepTimer}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
            sleepTimerMinutes !== null
              ? 'bg-[#cc0000]/20 text-[#ff4d4d] border-[#cc0000]/40 shadow-sm'
              : 'bg-[#1a1a1a] text-zinc-400 hover:text-white border-[#2c2c2c]'
          }`}
          title="مؤقت النوم التلقائي للرسيفر (15، 30، 60 دقيقة)"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{sleepTimeRemaining !== null ? formatTimer(sleepTimeRemaining) : 'مؤقت نوم'}</span>
        </button>

        {/* Volume Slider & Mute */}
        <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-xl border border-[#2c2c2c]">
          <button
            onClick={onToggleMute}
            className="text-zinc-400 hover:text-white cursor-pointer"
            title={isMuted ? 'إلغاء كتم الصوت (M)' : 'كتم الصوت (M)'}
          >
            {getVolumeIcon()}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              onVolumeChange(Number(e.target.value));
            }}
            className="w-16 md:w-24 h-1.5 bg-zinc-700 rounded-lg accent-[#cc0000] cursor-pointer"
          />
          <span className="text-xs font-mono text-zinc-400 w-8 text-left tabular-nums">
            {isMuted ? '0%' : `${volume}%`}
          </span>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 bg-[#1a1a1a] hover:bg-[#262626] text-zinc-300 hover:text-white rounded-lg border border-[#2c2c2c] transition-all cursor-pointer"
          title="شاشة كاملة (F11 أو Esc للخروج)"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
