import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Power,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize,
  CornerDownLeft,
  ArrowRight,
  Tv
} from 'lucide-react';
import { Channel } from '../types/iptv';

interface RemoteControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNextChannel: () => void;
  onPrevChannel: () => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onBack: () => void;
  onToggleFullscreen: () => void;
  onVolumeChange: (newVol: number) => void;
  currentVolume: number;
  onToggleMute: () => void;
  isMuted: boolean;
  onSelectChannelByNumber: (num: number) => void;
  channels: Channel[];
  isPlayerActive: boolean;
  activeChannelName?: string;
  focusedChannelName?: string;
  onNavigateGrid?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onConfirmFocus?: () => void;
}

export const RemoteControlModal: React.FC<RemoteControlModalProps> = ({
  isOpen,
  onClose,
  onNextChannel,
  onPrevChannel,
  onTogglePlay,
  onStop,
  onBack,
  onToggleFullscreen,
  onVolumeChange,
  currentVolume,
  onToggleMute,
  isMuted,
  onSelectChannelByNumber,
  channels,
  isPlayerActive,
  activeChannelName,
  focusedChannelName,
  onNavigateGrid,
  onConfirmFocus
}) => {
  const [digits, setDigits] = useState('');
  const autoJumpTimerRef = useRef<NodeJS.Timeout | null>(null);

  const previewNum = digits ? parseInt(digits, 10) : null;
  const previewChannel =
    previewNum && previewNum > 0 && previewNum <= channels.length
      ? channels[previewNum - 1]
      : null;

  const commitDigits = useCallback(
    (numStr: string) => {
      const channelNum = parseInt(numStr, 10);
      if (!isNaN(channelNum) && channelNum > 0 && channelNum <= channels.length) {
        onSelectChannelByNumber(channelNum);
      }
      setDigits('');
    },
    [channels.length, onSelectChannelByNumber]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (autoJumpTimerRef.current) clearTimeout(autoJumpTimerRef.current);
      setDigits((prev) => {
        const next = (prev + digit).slice(-3);
        const channelNum = parseInt(next, 10);
        if (!isNaN(channelNum) && channelNum > 0 && channelNum <= channels.length) {
          autoJumpTimerRef.current = setTimeout(() => {
            commitDigits(next);
          }, 750);
        }
        return next;
      });
    },
    [channels.length, commitDigits]
  );

  const handleEnter = useCallback(() => {
    if (autoJumpTimerRef.current) clearTimeout(autoJumpTimerRef.current);
    if (digits) {
      commitDigits(digits);
    } else if (isPlayerActive) {
      onTogglePlay();
    } else if (onConfirmFocus) {
      onConfirmFocus();
    }
  }, [digits, commitDigits, isPlayerActive, onTogglePlay, onConfirmFocus]);

  const handleDpad = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      if (isPlayerActive) {
        if (dir === 'up') onNextChannel();
        else if (dir === 'down') onPrevChannel();
        else if (dir === 'right') onVolumeChange(Math.min(100, currentVolume + 10));
        else if (dir === 'left') onVolumeChange(Math.max(0, currentVolume - 10));
      } else {
        onNavigateGrid?.(dir);
      }
    },
    [isPlayerActive, onNextChannel, onPrevChannel, onVolumeChange, currentVolume, onNavigateGrid]
  );

  // Keyboard support while Smart Remote is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setDigits((d) => d.slice(0, -1));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleEnter();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleDpad('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDpad('down');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleDpad('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleDpad('right');
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        onVolumeChange(Math.min(100, currentVolume + 5));
      } else if (e.key === '-') {
        e.preventDefault();
        onVolumeChange(Math.max(0, currentVolume - 5));
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        onToggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onToggleFullscreen();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    handleDigit,
    handleEnter,
    handleDpad,
    onVolumeChange,
    currentVolume,
    onToggleMute,
    onToggleFullscreen,
    onClose
  ]);

  useEffect(() => {
    return () => {
      if (autoJumpTimerRef.current) clearTimeout(autoJumpTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121212] border border-[#2a2a2a] w-full max-w-xs rounded-3xl p-5 shadow-2xl relative flex flex-col items-center select-none text-white animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="إغلاق الريموت"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Remote Header Brand */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black tracking-widest text-zinc-400 font-['Outfit'] uppercase">
            <Tv className="w-3.5 h-3.5 text-[#e50914]" />
            <span>Awn Tv</span>
            <span className="text-[#ff1a1a]">pro</span>
          </div>
          <p className="text-[10px] text-zinc-500">الريموت الذكي (اللمس ولوحة المفاتيح)</p>
        </div>

        {/* Receiver LED Screen */}
        <div className="w-full bg-[#090909] rounded-2xl py-2.5 px-3 mb-3.5 border border-[#262626]">
          <div className="flex items-center justify-between font-mono">
            <span className="text-[10px] text-zinc-400">
              {digits ? 'CH NUMBER:' : isPlayerActive ? 'NOW PLAYING:' : 'BROWSE MODE:'}
            </span>
            <span className="text-base font-black text-[#ff4d4d] tracking-widest tabular-nums">
              {digits ? digits.padStart(2, '0') : `VOL ${isMuted ? 0 : currentVolume}%`}
            </span>
          </div>
          <p className="text-[11px] font-bold text-white truncate mt-1 text-right">
            {digits
              ? previewChannel
                ? `#${digits} · ${previewChannel.name}`
                : `لا توجد قناة برقم ${digits} (1-${channels.length})`
              : isPlayerActive
              ? activeChannelName || 'مشغل البث المباشر'
              : focusedChannelName
              ? `المحدد: ${focusedChannelName}`
              : 'استخدم الأسهم للتنقل و OK للتشغيل'}
          </p>
        </div>

        {/* Top Control Row: Power/Stop, Back, Fullscreen, Mute */}
        <div className="w-full grid grid-cols-4 gap-1.5 mb-3.5">
          <button
            onClick={onStop}
            className="h-10 rounded-xl bg-zinc-900 hover:bg-[#e50914] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="إيقاف البث"
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={onBack}
            className="h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="رجوع"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleFullscreen}
            className="h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="ملء الشاشة"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMute}
            className={`h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
              isMuted
                ? 'bg-[#e50914]/25 text-[#ff4d4d] border-[#e50914]/50'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
            }`}
            title="كتم الصوت"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Numeric Keypad (1 - 9, 0) */}
        <div dir="ltr" className="w-full grid grid-cols-3 gap-1.5 mb-3.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num.toString())}
              className="h-10 rounded-xl bg-[#1c1c1c] hover:bg-[#282828] active:bg-[#e50914] text-zinc-200 hover:text-white font-mono font-bold text-sm border border-[#292929] transition-all cursor-pointer flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setDigits('')}
            className="h-10 rounded-xl bg-[#181818] hover:bg-[#222222] text-zinc-400 hover:text-white text-[11px] font-bold border border-[#242424] cursor-pointer flex items-center justify-center"
          >
            مسح
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-10 rounded-xl bg-[#1c1c1c] hover:bg-[#282828] active:bg-[#e50914] text-zinc-200 hover:text-white font-mono font-bold text-sm border border-[#292929] transition-all cursor-pointer flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleEnter}
            className="h-10 rounded-xl bg-[#262626] hover:bg-[#e50914] text-zinc-200 hover:text-white text-xs border border-[#333333] cursor-pointer flex items-center justify-center font-bold transition-colors"
            title="انتقال للقناة"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Receiver Navigation D-Pad */}
        <div dir="ltr" className="relative w-44 h-44 rounded-full bg-[#181818] border-2 border-[#2b2b2b] p-2 flex items-center justify-center mb-3.5 shadow-inner">
          <button
            onClick={() => handleDpad('up')}
            className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-10 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
            title={isPlayerActive ? 'القناة التالية' : 'لأعلى'}
          >
            <ChevronUp className="w-6 h-6" />
          </button>

          <button
            onClick={() => handleDpad('down')}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-10 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
            title={isPlayerActive ? 'القناة السابقة' : 'لأسفل'}
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <button
            onClick={() => handleDpad('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-12 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
            title={isPlayerActive ? 'خفض الصوت' : 'لليسار'}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => handleDpad('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-12 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
            title={isPlayerActive ? 'رفع الصوت' : 'لليمين'}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <button
            onClick={handleEnter}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e50914] to-[#990000] text-white font-black text-xs flex items-center justify-center shadow-lg shadow-[#e50914]/35 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#ff4d4d]/40"
          >
            OK
          </button>
        </div>

        {/* Dedicated VOL+ / VOL- and CH+ / CH- Rockers */}
        <div dir="ltr" className="w-full grid grid-cols-2 gap-3">
          <div className="bg-[#181818] rounded-2xl p-2 border border-[#262626] flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 pl-1">VOL</span>
            <div className="flex gap-1">
              <button
                onClick={() => onVolumeChange(Math.max(0, currentVolume - 5))}
                className="w-8 h-8 rounded-lg bg-[#222222] hover:bg-[#e50914] text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                title="VOL-"
              >
                -
              </button>
              <button
                onClick={() => onVolumeChange(Math.min(100, currentVolume + 5))}
                className="w-8 h-8 rounded-lg bg-[#222222] hover:bg-[#e50914] text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                title="VOL+"
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-[#181818] rounded-2xl p-2 border border-[#262626] flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 pl-1">CH</span>
            <div className="flex gap-1">
              <button
                onClick={onPrevChannel}
                className="w-8 h-8 rounded-lg bg-[#222222] hover:bg-[#e50914] text-white flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                title="CH-"
              >
                ▼
              </button>
              <button
                onClick={onNextChannel}
                className="w-8 h-8 rounded-lg bg-[#222222] hover:bg-[#e50914] text-white flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                title="CH+"
              >
                ▲
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
