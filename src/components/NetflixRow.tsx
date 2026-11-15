import React, { useRef } from 'react';
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
}

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
  isPlayerPlaying = false
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  if (!channels || channels.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const renderSpotifyCard = (channel: Channel, isGrid: boolean) => {
    const isFav = favorites.includes(channel.id);
    const customCover = customCovers[channel.id];
    const isCurrentTrack = activeChannelId === channel.id;
    const isFocused = focusedChannelId === channel.id;

    return (
      <div
        key={channel.id}
        data-channel-id={channel.id}
        onClick={() => onPlayChannel(channel)}
        className={`group relative rounded-xl p-3 sm:p-3.5 transition-all duration-300 cursor-pointer border ${
          isGrid ? 'w-full' : 'flex-none w-40 sm:w-44 md:w-48 snap-start'
        } ${
          isFocused
            ? 'bg-[#2a1618] border-[#ff1a1a] ring-2 ring-[#ff1a1a] scale-[1.03] shadow-xl z-20'
            : isCurrentTrack
            ? 'bg-[#262626] border-[#e50914]/60 shadow-xl shadow-[#e50914]/10'
            : 'bg-[#181818] hover:bg-[#282828] border-white/5 hover:border-white/15 shadow-lg'
        }`}
      >
        {/* 1:1 Square Album Art */}
        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-900 shadow-md mb-3">
          <ChannelThumbnail
            channel={channel}
            customCover={customCover}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Subtle dark vignette at bottom for button contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          {/* Active Playing Badge */}
          {isCurrentTrack && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm border border-[#e50914]/50 flex items-center gap-1.5 z-10">
              <span className="flex items-end gap-[2px] h-2.5">
                <span className={`w-[2px] bg-[#e50914] rounded-full ${isPlayerPlaying ? 'h-2.5 animate-pulse' : 'h-1'}`} />
                <span className={`w-[2px] bg-[#e50914] rounded-full ${isPlayerPlaying ? 'h-1.5 animate-bounce' : 'h-1'}`} />
                <span className={`w-[2px] bg-[#e50914] rounded-full ${isPlayerPlaying ? 'h-2 animate-pulse' : 'h-1'}`} />
              </span>
              <span className="text-[9px] font-bold text-white">يعمل الآن</span>
            </div>
          )}

          {/* Spotify Floating Red Play Button in Corner */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlayChannel(channel);
            }}
            aria-label={`تشغيل ${channel.name}`}
            className={`absolute bottom-2.5 left-2.5 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#e50914] hover:bg-[#ff1a1a] hover:scale-110 text-white flex items-center justify-center shadow-2xl shadow-black/80 transition-all duration-300 z-10 cursor-pointer ${
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

        {/* Clean Title & Music Subtitle Below Album Art */}
        <div className="text-right">
          <h3
            className={`text-xs sm:text-sm font-bold truncate leading-snug mb-1 transition-colors ${
              isCurrentTrack ? 'text-[#ff4d4d]' : 'text-white'
            }`}
          >
            {channel.name}
          </h3>

          <div className="flex items-center justify-between gap-1 text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <Music className="w-3 h-3 text-[#e50914] shrink-0" />
              <span className="truncate">{channel.group}</span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(channel.id);
                }}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isFav ? 'text-amber-400' : 'text-zinc-500 hover:text-white'
                }`}
                title={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              >
                <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
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

    return (
      <div
        key={channel.id}
        data-channel-id={channel.id}
        className={`group/card relative rounded-md overflow-hidden bg-[#181818] transition-all duration-300 ease-out cursor-pointer ${
          isGrid ? 'w-full' : 'flex-none w-48 sm:w-56 md:w-64 lg:w-72 snap-start'
        } ${
          isFocused
            ? 'ring-2 ring-[#e50914] scale-[1.08] z-30 shadow-[0_18px_42px_rgba(0,0,0,0.95)]'
            : 'md:hover:scale-[1.08] md:hover:-translate-y-1 md:hover:z-30 shadow-md hover:shadow-[0_20px_45px_rgba(0,0,0,0.95)]'
        }`}
        onClick={() => onPlayChannel(channel)}
      >
        {/* Pure Clean 16:9 Artwork */}
        <div className="aspect-video w-full relative overflow-hidden bg-zinc-900">
          <ChannelThumbnail
            channel={channel}
            customCover={customCover}
            className="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
          />

          {/* Subtle Bottom Scrim for Title Contrast when Idle */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:group-hover/card:opacity-0 transition-opacity duration-300 pointer-events-none" />

          {/* Clean Single-Line Title when Idle (No overlapping corner pills/icons) */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5 text-right md:group-hover/card:opacity-0 transition-opacity duration-200 z-10 pointer-events-none">
            <h3 className="text-xs sm:text-sm font-bold text-white truncate drop-shadow">
              {channel.name}
            </h3>
          </div>

          {/* Netflix Hover Mini-Drawer Overlay (Reveals ONLY on Hover) */}
          <div className="hidden md:flex flex-col justify-end absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/85 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 p-3 z-20">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayChannel(channel);
                  }}
                  aria-label={`تشغيل ${channel.name}`}
                  className="w-8 h-8 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(channel.id);
                  }}
                  aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  title={isFav ? 'في قائمتي المفضلة' : 'إضافة إلى قائمتي (+)'}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                    isFav
                      ? 'bg-[#e50914] border-[#e50914] text-white'
                      : 'bg-[#2a2a2a]/80 hover:border-white border-zinc-400 text-white'
                  }`}
                >
                  {isFav ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(channel);
                }}
                aria-label="المزيد من المعلومات"
                title="المزيد من المعلومات"
                className="w-8 h-8 rounded-full bg-[#2a2a2a]/80 border border-zinc-400 hover:border-white text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-xs font-extrabold text-white truncate text-right leading-snug">
              {channel.name}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-300 mt-0.5 truncate">
              <span className="text-emerald-400 font-extrabold">
                {isLive ? 'LIVE' : channel.resolution || 'HD'}
              </span>
              <span aria-hidden="true" className="text-zinc-500">·</span>
              <span className="truncate">{channel.group}</span>
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
          {icon && <span className="text-[#e50914]">{icon}</span>}
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-wide">
            {title}
          </h2>
          {subtitle && (
            <span className="text-[11px] sm:text-xs text-zinc-400 hidden sm:inline">
              · {subtitle}
            </span>
          )}
        </div>
        <span className="text-[11px] sm:text-xs font-mono text-zinc-500">
          {channels.length} {variant === 'spotify' ? 'أغنية' : 'عناصر'}
        </span>
      </div>

      {/* Grid Layout (e.g. dedicated Spotify Music Tab) */}
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
        /* Horizontal Carousel Layout */
        <div className="relative">
          {/* Right Scroll Arrow (Reveals only on Row Hover) */}
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute -right-2 top-5 bottom-5 w-11 bg-black/70 hover:bg-black/90 text-white z-40 rounded-r-md items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer backdrop-blur-sm"
            title="تمرير لليمين"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          {/* Scrollable Container (Extra vertical breathing room for scale-up hover cards) */}
          <div
            ref={rowRef}
            className="flex items-center gap-2.5 sm:gap-3 md:gap-3.5 overflow-x-auto overflow-y-visible py-5 sm:py-6 -my-3 px-1 no-scrollbar scroll-smooth snap-x snap-mandatory touch-pan-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {channels.map((ch) =>
              variant === 'spotify' ? renderSpotifyCard(ch, false) : renderNetflixCard(ch, false)
            )}
          </div>

          {/* Left Scroll Arrow (Reveals only on Row Hover) */}
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute -left-2 top-5 bottom-5 w-11 bg-black/70 hover:bg-black/90 text-white z-40 rounded-l-md items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer backdrop-blur-sm"
            title="تمرير لليسار"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        </div>
      )}
    </div>
  );
};
