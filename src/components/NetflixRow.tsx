import React, { useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Info,
  Star,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Music
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { ChannelThumbnail } from './ChannelThumbnail';
import { isMovieOrSeriesChannel } from '../utils/mediaMetadata';
import { playCyberClick } from '../utils/sciFiAudio';
import { AppThemeId } from './ParticleNebulaBg';

interface NetflixRowProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  channels: Channel[];
  onPlayChannel: (channel: Channel) => void;
  onOpenDetails: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  favorites: string[];
  customCovers?: Record<string, string>;
  variant?: 'netflix' | 'spotify';
  layout?: 'row' | 'grid';
  activeChannelId?: string | null;
  focusedChannelId?: string | null;
  isPlayerPlaying?: boolean;
  theme?: AppThemeId;
}

const getCardRating = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const tenths = Math.abs(hash) % 15;
  return (8.5 + tenths * 0.1).toFixed(1);
};

export const NetflixRow: React.FC<NetflixRowProps> = ({
  title,
  icon,
  subtitle,
  channels,
  onPlayChannel,
  onOpenDetails,
  onToggleFavorite,
  favorites,
  customCovers = {},
  variant = 'netflix',
  layout = 'row',
  activeChannelId = null,
  focusedChannelId = null,
  isPlayerPlaying = false,
  theme = 'action'
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const isClassic = theme === 'netflix';

  const handleCardMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isClassic) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 14;
      const rotateX = (0.5 - y) * 12;

      el.style.transform = `perspective(950px) translateY(-8px) translateZ(16px) rotateX(${rotateX.toFixed(
        2
      )}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.06)`;
      const sheen = el.querySelector<HTMLElement>('[data-holo-sheen]');
      if (sheen) {
        sheen.style.opacity = '1';
        const sheenTint =
          theme === 'galaxy'
            ? 'rgba(192, 132, 252, 0.22)'
            : theme === '2077'
            ? 'rgba(6, 182, 212, 0.22)'
            : 'rgba(229, 9, 20, 0.14)';
        sheen.style.background = `radial-gradient(circle at ${Math.round(x * 100)}% ${Math.round(
          y * 100
        )}%, rgba(255, 255, 255, 0.22) 0%, ${sheenTint} 38%, transparent 74%)`;
      }
    },
    [isClassic, theme]
  );

  const handleCardMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transform = '';
    const sheen = el.querySelector<HTMLElement>('[data-holo-sheen]');
    if (sheen) {
      sheen.style.opacity = '0';
    }
  }, []);

  if (!channels || channels.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const arrowBtnClass = isClassic
    ? 'hidden md:flex absolute top-5 bottom-5 w-11 bg-black/70 hover:bg-black/90 text-white z-40 items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer'
    : theme === 'galaxy'
    ? 'hidden md:flex absolute top-5 bottom-5 w-11 modern-glass border border-purple-400/30 hover:border-amber-400/65 text-white z-40 items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer'
    : theme === '2077'
    ? 'hidden md:flex absolute top-5 bottom-5 w-11 modern-glass border border-cyan-400/35 hover:border-rose-400/65 text-white z-40 items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer'
    : 'hidden md:flex absolute top-5 bottom-5 w-11 modern-glass border border-white/20 hover:border-[#E50914]/65 text-white z-40 items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer';

  const renderSpotifyCard = (channel: Channel, isGrid: boolean) => {
    const isFav = favorites.includes(channel.id);
    const customCover = customCovers[channel.id];
    const isCurrentTrack = activeChannelId === channel.id;
    const isFocused = focusedChannelId === channel.id;

    return (
      <div
        key={channel.id}
        data-channel-id={channel.id}
        data-channel-group={channel.group}
        data-channel-name={channel.name}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        onClick={() => {
          playCyberClick();
          onPlayChannel(channel);
        }}
        className={`group relative p-3 sm:p-3.5 transition-all duration-300 ease-out cursor-pointer will-change-transform ${
          isClassic
            ? 'rounded-md bg-[#181818] hover:bg-[#242424] border border-white/10'
            : 'rounded-xl modern-glass glass-border-glow'
        } ${isGrid ? 'w-full' : 'flex-none w-40 sm:w-44 md:w-48 snap-start'} ${
          isFocused
            ? 'ring-2 ring-[#E50914] scale-[1.03] shadow-[0_0_32px_rgba(229,9,20,0.4)] z-20'
            : isCurrentTrack
            ? 'ring-1 ring-[#E50914] shadow-[0_14px_34px_rgba(229,9,20,0.3)]'
            : 'hover:z-20'
        }`}
      >
        {!isClassic && (
          <div
            data-holo-sheen
            className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 pointer-events-none z-20"
          />
        )}

        {/* 1:1 Square Album Art */}
        <div
          className={`relative aspect-square w-full overflow-hidden shadow-md mb-3 ${
            isClassic
              ? 'rounded bg-zinc-900'
              : 'rounded-lg bg-[#0a0a12] border border-white/15'
          }`}
        >
          <ChannelThumbnail
            channel={channel}
            customCover={customCover}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

          {isCurrentTrack && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 border border-[#E50914]/60 flex items-center gap-1.5 z-10">
              <span className="flex items-end gap-[2px] h-2.5">
                <span className={`w-[2px] bg-[#E50914] rounded-full ${isPlayerPlaying ? 'h-2.5 animate-pulse' : 'h-1'}`} />
                <span className={`w-[2px] bg-white rounded-full ${isPlayerPlaying ? 'h-1.5 animate-bounce' : 'h-1'}`} />
                <span className={`w-[2px] bg-[#E50914] rounded-full ${isPlayerPlaying ? 'h-2 animate-pulse' : 'h-1'}`} />
              </span>
              <span className="text-[9px] font-bold text-white">يعمل الآن</span>
            </div>
          )}

          <button
            type="button"
            data-play-btn="true"
            onClick={(e) => {
              e.stopPropagation();
              playCyberClick();
              onPlayChannel(channel);
            }}
            aria-label={`تشغيل ${channel.name}`}
            className={`absolute bottom-2.5 left-2.5 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#e50914] hover:bg-[#ff2633] hover:scale-110 text-white flex items-center justify-center shadow-[0_0_22px_rgba(229,9,20,0.65)] transition-all duration-300 z-10 cursor-pointer ${
              isCurrentTrack
                ? 'opacity-100 translate-y-0'
                : 'opacity-100 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0'
            }`}
          >
            {isCurrentTrack && isPlayerPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        <div className="text-right relative z-10">
          <h3
            className={`text-xs sm:text-sm font-bold truncate leading-snug mb-1 transition-colors ${
              isCurrentTrack ? 'text-[#ff4d58]' : 'text-white'
            }`}
          >
            {channel.name}
          </h3>

          <div className="flex items-center justify-between gap-1 text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <Music className="w-3 h-3 text-[#E50914] shrink-0" />
              <span className="truncate">{channel.group}</span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playCyberClick();
                  onToggleFavorite(channel.id);
                }}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isFav ? 'text-[#E50914]' : 'text-zinc-500 hover:text-white'
                }`}
                title={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              >
                <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playCyberClick();
                  onOpenDetails(channel);
                }}
                className="p-1 rounded-md text-zinc-500 hover:text-white cursor-pointer"
                title="تفاصيل وتغيير الغلاف"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNetflixCard = (channel: Channel, isGrid: boolean) => {
    const isFav = favorites.includes(channel.id);
    const customCover = customCovers[channel.id];
    const isFocused = focusedChannelId === channel.id;
    const isLive = Boolean(channel.badge?.toUpperCase().includes('LIVE') || channel.badge?.includes('مباشر'));
    const qualityLabel = isLive
      ? 'LIVE HD'
      : channel.resolution === '4K'
      ? '4K HDR'
      : channel.resolution || 'ULTRA HD';
    const ratingScore = getCardRating(channel.id);

    return (
      <div
        key={channel.id}
        data-channel-id={channel.id}
        data-channel-group={channel.group}
        data-channel-name={channel.name}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        className={`group/card relative overflow-hidden transition-all duration-200 ease-out cursor-pointer will-change-transform ${
          isClassic
            ? `rounded-md bg-[#181818] border border-white/10 ${
                isFocused
                  ? 'ring-2 ring-[#E50914] scale-105 z-30 shadow-2xl'
                  : 'md:hover:scale-105 md:hover:z-30 shadow-md'
              }`
            : `rounded-xl modern-glass glass-border-glow ${
                isFocused
                  ? 'ring-2 ring-[#E50914] scale-[1.06] z-30 shadow-[0_20px_50px_rgba(229,9,20,0.4)]'
                  : 'md:hover:z-30 hover:shadow-[0_24px_56px_rgba(0,0,0,0.95),0_0_28px_rgba(229,9,20,0.24)]'
              }`
        } ${isGrid ? 'w-full' : 'flex-none w-48 sm:w-56 md:w-64 lg:w-72 snap-start'}`}
        onClick={() => {
          playCyberClick();
          isMovieOrSeriesChannel(channel) ? onOpenDetails(channel) : onPlayChannel(channel);
        }}
      >
        {!isClassic && (
          <div
            data-holo-sheen
            className="absolute inset-0 opacity-0 transition-opacity duration-200 pointer-events-none z-30"
          />
        )}

        {/* 16:9 Artwork */}
        <div className="aspect-video w-full relative overflow-hidden bg-[#101014]">
          <ChannelThumbnail
            channel={channel}
            customCover={customCover}
            className="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent md:group-hover/card:opacity-0 transition-opacity duration-300 pointer-events-none" />

          <div className="absolute bottom-0 left-0 right-0 p-2.5 text-right md:group-hover/card:opacity-0 transition-opacity duration-200 z-10 pointer-events-none">
            <h3 className="text-xs sm:text-sm font-bold text-white truncate drop-shadow">
              {channel.name}
            </h3>
          </div>

          {/* Hover Overlay */}
          <div
            className={`hidden md:flex flex-col justify-between absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 p-3 z-20 ${
              isClassic
                ? 'bg-gradient-to-t from-black via-black/75 to-black/20'
                : 'bg-gradient-to-t from-[#07070c] via-[#0e0e16]/82 to-[#0e0e16]/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
              <span
                className={`font-['Outfit'] tracking-wide ${
                  isClassic
                    ? 'text-zinc-200'
                    : theme === '2077'
                    ? 'text-cyan-300'
                    : theme === 'galaxy'
                    ? 'text-purple-300'
                    : 'text-[#ff4d58]'
                }`}
              >
                {qualityLabel}
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-mono tabular-nums">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{ratingScore}</span>
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
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
                    className="w-8 h-8 rounded-full bg-white hover:bg-[#E50914] text-black hover:text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer"
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
                    title={isFav ? 'في قائمتي المفضلة' : 'إضافة إلى قائمتي (+)'}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                      isFav
                        ? 'bg-[#e50914] border-[#e50914] text-white'
                        : 'bg-black/60 hover:border-white border-white/30 text-white'
                    }`}
                  >
                    {isFav ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
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
                  title="المزيد من المعلومات"
                  className="w-8 h-8 rounded-full bg-black/60 border border-white/30 hover:border-white text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-xs font-extrabold text-white truncate text-right leading-snug">
                {channel.name}
              </h3>
              <p className="text-[10px] text-zinc-300/90 truncate text-right mt-0.5">
                {channel.description || channel.group}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative py-3 sm:py-4 px-4 sm:px-6 md:px-12 group/row select-none">
      {/* Row Header */}
      <div className="flex items-baseline justify-between mb-2.5 sm:mb-3 text-right">
        <div className="flex items-center gap-2 sm:gap-2.5">
          {icon && (
            <span className={isClassic ? 'text-[#e50914]' : 'text-[#e50914] drop-shadow-[0_0_10px_rgba(229,9,20,0.7)]'}>
              {icon}
            </span>
          )}
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-wide">
            {title}
          </h2>
          {subtitle && (
            <span className="text-[11px] sm:text-xs text-zinc-400 hidden sm:inline">
              · {subtitle}
            </span>
          )}
        </div>
        <span
          className={`text-[11px] sm:text-xs font-mono ${
            isClassic
              ? 'text-zinc-400'
              : theme === '2077'
              ? 'text-cyan-300/80'
              : theme === 'galaxy'
              ? 'text-purple-300/85'
              : 'text-zinc-400'
          }`}
        >
          {channels.length} {variant === 'spotify' ? 'أغنية' : 'عناصر'}
        </span>
      </div>

      {/* Grid Layout */}
      {layout === 'grid' ? (
        <div
          className={
            variant === 'spotify'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4'
              : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4'
          }
        >
          {channels.map((ch) =>
            variant === 'spotify' ? renderSpotifyCard(ch, true) : renderNetflixCard(ch, true)
          )}
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => {
              playCyberClick();
              scroll('right');
            }}
            className={`${arrowBtnClass} -right-2 ${isClassic ? 'rounded-r-md' : 'rounded-r-xl'}`}
            title="تمرير لليمين"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          <div
            ref={rowRef}
            className="flex items-center gap-2.5 sm:gap-3 md:gap-3.5 overflow-x-auto overflow-y-visible py-6 sm:py-7 -my-4 px-1 no-scrollbar scroll-smooth snap-x snap-mandatory touch-pan-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {channels.map((ch) =>
              variant === 'spotify' ? renderSpotifyCard(ch, false) : renderNetflixCard(ch, false)
            )}
          </div>

          <button
            onClick={() => {
              playCyberClick();
              scroll('left');
            }}
            className={`${arrowBtnClass} -left-2 ${isClassic ? 'rounded-l-md' : 'rounded-l-xl'}`}
            title="تمرير لليسار"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        </div>
      )}
    </div>
  );
};
