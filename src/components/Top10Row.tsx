import React, { useRef, useCallback } from 'react';
import { Play, Plus, Check, ChevronRight, ChevronLeft, ChevronDown, Star } from 'lucide-react';
import { Channel } from '../types/iptv';
import { ChannelThumbnail } from './ChannelThumbnail';
import { playCyberClick } from '../utils/sciFiAudio';
import { AppThemeId } from './ParticleNebulaBg';

interface Top10RowProps {
  title?: string;
  channels: Channel[];
  onPlayChannel: (channel: Channel) => void;
  onOpenDetails: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  favorites: string[];
  customCovers?: Record<string, string>;
  focusedChannelId?: string | null;
  theme?: AppThemeId;
}

export const Top10Row: React.FC<Top10RowProps> = ({
  title = 'أفضل 10 أفلام اليوم',
  channels,
  onPlayChannel,
  onOpenDetails,
  onToggleFavorite,
  favorites,
  customCovers = {},
  focusedChannelId = null,
  theme = 'action'
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const top10 = channels.slice(0, 10);
  const isClassic = theme === 'netflix';

  const handlePosterMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isClassic) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 14;
      const rotateX = (0.5 - y) * 12;
      el.style.transform = `perspective(900px) translateY(-8px) translateZ(16px) rotateX(${rotateX.toFixed(
        2
      )}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.07)`;
      const sheen = el.querySelector<HTMLElement>('[data-holo-sheen]');
      if (sheen) {
        sheen.style.opacity = '1';
        const sheenTint =
          theme === 'galaxy'
            ? 'rgba(192, 132, 252, 0.22)'
            : theme === '2077'
            ? 'rgba(6, 182, 212, 0.22)'
            : 'rgba(229, 9, 20, 0.16)';
        sheen.style.background = `radial-gradient(circle at ${Math.round(x * 100)}% ${Math.round(
          y * 100
        )}%, rgba(255, 255, 255, 0.24) 0%, ${sheenTint} 42%, transparent 74%)`;
      }
    },
    [isClassic, theme]
  );

  const handlePosterLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transform = '';
    const sheen = el.querySelector<HTMLElement>('[data-holo-sheen]');
    if (sheen) sheen.style.opacity = '0';
  }, []);

  if (top10.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -440 : 440;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Per-Theme Numeral Palettes
  const numeralPalette =
    theme === 'galaxy'
      ? {
          fillStart: 'rgba(216, 180, 254, 0.22)',
          fillMid: 'rgba(18, 10, 38, 0.95)',
          fillEnd: 'rgba(251, 191, 36, 0.28)',
          strokeStart: '#c084fc',
          strokeMid: '#fbbf24',
          strokeEnd: '#ec4899',
          extrudeFill: 'rgba(168, 85, 247, 0.16)',
          extrudeStroke: 'rgba(251, 191, 36, 0.28)'
        }
      : theme === '2077'
      ? {
          fillStart: 'rgba(34, 211, 238, 0.22)',
          fillMid: 'rgba(8, 16, 34, 0.95)',
          fillEnd: 'rgba(244, 63, 94, 0.26)',
          strokeStart: '#22d3ee',
          strokeMid: '#06b6d4',
          strokeEnd: '#f43f5e',
          extrudeFill: 'rgba(6, 182, 212, 0.16)',
          extrudeStroke: 'rgba(244, 63, 94, 0.28)'
        }
      : {
          fillStart: 'rgba(255, 255, 255, 0.14)',
          fillMid: 'rgba(16, 16, 22, 0.94)',
          fillEnd: 'rgba(229, 9, 20, 0.24)',
          strokeStart: '#ffffff',
          strokeMid: '#E50914',
          strokeEnd: '#7f040b',
          extrudeFill: 'rgba(229, 9, 20, 0.12)',
          extrudeStroke: 'rgba(255, 255, 255, 0.18)'
        };

  const arrowBtnClass = isClassic
    ? 'hidden md:flex absolute top-4 bottom-4 w-11 bg-black/70 hover:bg-black/90 text-white z-40 items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer'
    : theme === 'galaxy'
    ? 'hidden md:flex absolute top-4 bottom-4 w-11 modern-glass border border-purple-400/30 hover:border-amber-400/65 text-white z-40 items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer'
    : theme === '2077'
    ? 'hidden md:flex absolute top-4 bottom-4 w-11 modern-glass border border-cyan-400/35 hover:border-rose-400/65 text-white z-40 items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer'
    : 'hidden md:flex absolute top-4 bottom-4 w-11 modern-glass border border-white/20 hover:border-[#E50914]/65 text-white z-40 items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer';

  return (
    <section className="relative py-4 sm:py-6 px-4 sm:px-6 md:px-12 group/row select-none">
      {/* Row Header */}
      <div className="flex items-baseline justify-between mb-3 text-right">
        <div className="flex items-center gap-2.5">
          {!isClassic && (
            <span
              className={`text-xs font-black tracking-wider font-['Outfit'] ${
                theme === 'galaxy'
                  ? 'text-amber-300'
                  : theme === '2077'
                  ? 'text-cyan-400'
                  : 'text-[#E50914]'
              }`}
            >
              TOP 10
            </span>
          )}
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-wide">
            {title}
          </h2>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            playCyberClick();
            scroll('right');
          }}
          aria-label="تمرير لليمين"
          className={`${arrowBtnClass} -right-2 ${isClassic ? 'rounded-r-md' : 'rounded-r-xl'}`}
        >
          <ChevronRight className="w-7 h-7" />
        </button>

        <div
          ref={rowRef}
          className="flex items-end gap-5 sm:gap-7 md:gap-8 overflow-x-auto overflow-y-visible py-6 -my-3 px-2 no-scrollbar scroll-smooth snap-x snap-mandatory touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {top10.map((channel, index) => {
            const rank = index + 1;
            const isFav = favorites.includes(channel.id);
            const customCover = customCovers[channel.id];
            const isFocused = focusedChannelId === channel.id;
            const isLive = Boolean(
              channel.badge?.toUpperCase().includes('LIVE') || channel.badge?.includes('مباشر')
            );
            const showRecentlyAdded =
              channel.isRecentlyAdded !== false &&
              (Boolean(channel.badge?.includes('جديد')) ||
                Boolean(channel.badge?.includes('حصري')) ||
                index < 6);
            const gradId = `themeRankGrad-${theme}-${rank}`;
            const strokeGradId = `themeRankStroke-${theme}-${rank}`;

            return (
              <div
                key={channel.id}
                data-channel-id={channel.id}
                data-channel-group={channel.group}
                data-channel-name={channel.name}
                onClick={() => {
                  playCyberClick();
                  onOpenDetails(channel);
                }}
                className="group/top10 relative flex-none flex items-end snap-start cursor-pointer"
              >
                {/* Theme-Responsive Top 10 Numeral (1 - 10) */}
                <svg
                  viewBox={rank === 10 ? '0 0 156 160' : '0 0 98 160'}
                  aria-hidden="true"
                  className={`top10-numeral shrink-0 select-none pointer-events-none z-0 overflow-visible transition-transform duration-300 group-hover/top10:scale-105 ${
                    rank === 10
                      ? 'w-[104px] sm:w-[126px] md:w-[146px] h-[126px] sm:h-[152px] md:h-[180px] -ml-5 sm:-ml-6'
                      : 'w-[72px] sm:w-[88px] md:w-[104px] h-[126px] sm:h-[152px] md:h-[180px] -ml-4 sm:-ml-5'
                  }`}
                >
                  {isClassic ? (
                    /* Classic Pre-Update Netflix Hollow Outlined Numerals */
                    <text
                      x="50%"
                      y="144"
                      textAnchor="middle"
                      fill="#000000"
                      stroke="#595959"
                      strokeWidth="4.5"
                      strokeLinejoin="round"
                      paintOrder="stroke fill"
                      className="font-['Outfit'] font-black"
                      style={{
                        fontSize: rank === 10 ? '138px' : '158px',
                        letterSpacing: rank === 10 ? '-10px' : '0px'
                      }}
                    >
                      {rank}
                    </text>
                  ) : (
                    <>
                      <defs>
                        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={numeralPalette.fillStart} />
                          <stop offset="55%" stopColor={numeralPalette.fillMid} />
                          <stop offset="100%" stopColor={numeralPalette.fillEnd} />
                        </linearGradient>
                        <linearGradient id={strokeGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={numeralPalette.strokeStart} />
                          <stop offset="50%" stopColor={numeralPalette.strokeMid} />
                          <stop offset="100%" stopColor={numeralPalette.strokeEnd} />
                        </linearGradient>
                      </defs>

                      {/* 3D Extruded Shadow Layer */}
                      <text
                        x="53%"
                        y="148"
                        textAnchor="middle"
                        fill={numeralPalette.extrudeFill}
                        stroke={numeralPalette.extrudeStroke}
                        strokeWidth="2.5"
                        className="font-['Outfit'] font-black"
                        style={{
                          fontSize: rank === 10 ? '138px' : '158px',
                          letterSpacing: rank === 10 ? '-10px' : '0px'
                        }}
                      >
                        {rank}
                      </text>

                      {/* Main Sculpted Numeral */}
                      <text
                        x="50%"
                        y="144"
                        textAnchor="middle"
                        fill={`url(#${gradId})`}
                        stroke={`url(#${strokeGradId})`}
                        strokeWidth="4.8"
                        strokeLinejoin="round"
                        paintOrder="stroke fill"
                        className="font-['Outfit'] font-black"
                        style={{
                          fontSize: rank === 10 ? '138px' : '158px',
                          letterSpacing: rank === 10 ? '-10px' : '0px'
                        }}
                      >
                        {rank}
                      </text>
                    </>
                  )}
                </svg>

                {/* Vertical Portrait Poster Card */}
                <div
                  onMouseMove={handlePosterMove}
                  onMouseLeave={handlePosterLeave}
                  className={`relative z-10 w-28 sm:w-32 md:w-36 aspect-[2/3] overflow-hidden transition-all duration-200 ease-out will-change-transform ${
                    isClassic
                      ? `rounded-md bg-[#181818] border border-white/10 ${
                          isFocused
                            ? 'ring-2 ring-[#E50914] scale-105 z-30 shadow-2xl'
                            : 'md:group-hover/top10:scale-105 md:group-hover/top10:z-30 shadow-lg'
                        }`
                      : `rounded-xl modern-glass glass-border-glow ${
                          isFocused
                            ? 'ring-2 ring-[#E50914] scale-[1.08] z-30 shadow-[0_18px_46px_rgba(229,9,20,0.4)]'
                            : 'md:group-hover/top10:z-30 shadow-xl group-hover/top10:shadow-[0_24px_54px_rgba(0,0,0,0.95),0_0_26px_rgba(229,9,20,0.24)]'
                        }`
                  }`}
                >
                  {!isClassic && (
                    <div
                      data-holo-sheen
                      className="absolute inset-0 opacity-0 transition-opacity duration-200 pointer-events-none z-30"
                    />
                  )}

                  <ChannelThumbnail
                    channel={channel}
                    customCover={customCover}
                    className="w-full h-full object-cover object-center"
                  />

                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${
                      isClassic ? 'from-black/90' : 'from-[#07070c]/95'
                    } via-black/15 to-transparent md:group-hover/top10:opacity-0 transition-opacity duration-200 pointer-events-none`}
                  />

                  <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center text-center md:group-hover/top10:opacity-0 transition-opacity pointer-events-none">
                    <p className="px-2 pb-1.5 text-[11px] font-bold text-white line-clamp-1 drop-shadow w-full">
                      {channel.name}
                    </p>
                    {showRecentlyAdded && (
                      <div
                        className={`bg-[#E50914] text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-t-sm whitespace-nowrap ${
                          isClassic ? '' : 'shadow-[0_0_14px_rgba(229,9,20,0.75)]'
                        }`}
                      >
                        أضيفت حديثاً
                      </div>
                    )}
                  </div>

                  <div
                    className={`hidden md:flex flex-col justify-between absolute inset-0 opacity-0 group-hover/top10:opacity-100 transition-opacity duration-200 p-2.5 z-20 ${
                      isClassic
                        ? 'bg-gradient-to-t from-black via-black/65 to-transparent'
                        : 'bg-gradient-to-t from-[#07070c] via-[#0e0e16]/82 to-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                      <span
                        className={
                          isClassic
                            ? 'text-zinc-200'
                            : theme === '2077'
                            ? 'text-cyan-300'
                            : theme === 'galaxy'
                            ? 'text-purple-300'
                            : 'text-[#ff4d58]'
                        }
                      >
                        {isLive ? 'LIVE' : channel.resolution || '4K'}
                      </span>
                      <span className="flex items-center gap-0.5 font-mono text-amber-300 tabular-nums">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        9.{Math.max(0, 9 - index)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            data-play-btn="true"
                            onClick={(e) => {
                              e.stopPropagation();
                              playCyberClick();
                              onPlayChannel(channel);
                            }}
                            aria-label={`تشغيل ${channel.name}`}
                            className="w-7 h-7 rounded-full bg-white hover:bg-[#E50914] text-black hover:text-white flex items-center justify-center shadow transition-transform hover:scale-110 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playCyberClick();
                              onToggleFavorite(channel.id);
                            }}
                            aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                              isFav
                                ? 'bg-[#E50914] border-[#E50914] text-white'
                                : 'bg-black/60 border-white/30 hover:border-white text-white'
                            }`}
                          >
                            {isFav ? <Check className="w-3 h-3" /> : <Plus className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playCyberClick();
                            onOpenDetails(channel);
                          }}
                          aria-label="المزيد من المعلومات"
                          className="w-7 h-7 rounded-full bg-black/60 border border-white/30 hover:border-white text-white flex items-center justify-center cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] font-extrabold text-white truncate text-right">
                        {channel.name}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-300 mt-0.5 truncate">
                        <span className="truncate">{channel.group}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            playCyberClick();
            scroll('left');
          }}
          aria-label="تمرير لليسار"
          className={`${arrowBtnClass} -left-2 ${isClassic ? 'rounded-l-md' : 'rounded-l-xl'}`}
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      </div>
    </section>
  );
};
