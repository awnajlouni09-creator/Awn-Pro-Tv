import React, { useRef } from 'react';
import { Play, Plus, Check, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import { Channel } from '../types/iptv';
import { ChannelThumbnail } from './ChannelThumbnail';

interface Top10RowProps {
  channels: Channel[];
  onPlayChannel: (channel: Channel) => void;
  onOpenDetails: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  favorites: string[];
  customCovers?: Record<string, string>;
  focusedChannelId?: string | null;
}

export const Top10Row: React.FC<Top10RowProps> = ({
  channels,
  onPlayChannel,
  onOpenDetails,
  onToggleFavorite,
  favorites,
  customCovers = {},
  focusedChannelId = null
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const top10 = channels.slice(0, 10);

  if (top10.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -440 : 440;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-3 sm:py-5 px-4 sm:px-6 md:px-12 group/row select-none">
      {/* Row Header */}
      <div className="flex items-baseline justify-between mb-3 text-right">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-black tracking-wider text-[#e50914] font-['Outfit']">
            TOP 10
          </span>
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-wide">
            أفضل 10 في Awn Tv pro اليوم
          </h2>
        </div>
      </div>

      {/* Horizontal Carousel with Hover-Only Side Arrows */}
      <div className="relative">
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute -right-2 top-4 bottom-4 w-11 bg-black/70 hover:bg-black/90 text-white z-40 rounded-r-md items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer"
          title="تمرير لليمين"
        >
          <ChevronRight className="w-7 h-7" />
        </button>

        <div
          ref={rowRef}
          className="flex items-end gap-4 sm:gap-6 md:gap-7 overflow-x-auto overflow-y-visible py-6 -my-3 px-2 no-scrollbar scroll-smooth snap-x snap-mandatory touch-pan-x"
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

            return (
              <div
                key={channel.id}
                data-channel-id={channel.id}
                onClick={() => onPlayChannel(channel)}
                className="group/top10 relative flex-none flex items-end snap-start cursor-pointer"
              >
                {/* SVG Hollowed Outlined Rank Numeral (1 - 10) */}
                <svg
                  viewBox={rank === 10 ? '0 0 138 150' : '0 0 92 150'}
                  aria-hidden="true"
                  className={`shrink-0 select-none pointer-events-none z-0 overflow-visible transition-transform duration-300 group-hover/top10:scale-105 ${
                    rank === 10
                      ? 'w-[96px] sm:w-[116px] md:w-[132px] h-[116px] sm:h-[144px] md:h-[168px] -ml-5 sm:-ml-6'
                      : 'w-[68px] sm:w-[82px] md:w-[96px] h-[116px] sm:h-[144px] md:h-[168px] -ml-4 sm:-ml-5'
                  }`}
                >
                  <text
                    x="50%"
                    y="136"
                    textAnchor="middle"
                    fill="#141414"
                    strokeWidth="4.5"
                    strokeLinejoin="round"
                    className="font-['Outfit'] font-black stroke-[#595959] group-hover/top10:stroke-[#e50914] transition-colors duration-300"
                    style={{
                      fontSize: rank === 10 ? '132px' : '152px',
                      letterSpacing: rank === 10 ? '-8px' : '0px'
                    }}
                  >
                    {rank}
                  </text>
                </svg>

                {/* Vertical Portrait Poster Card (Aspect Ratio 2:3) */}
                <div
                  className={`relative z-10 w-28 sm:w-32 md:w-36 aspect-[2/3] rounded-md overflow-hidden bg-[#181818] transition-all duration-300 ease-out ${
                    isFocused
                      ? 'ring-2 ring-[#e50914] scale-[1.08] z-30 shadow-[0_18px_42px_rgba(0,0,0,0.95)]'
                      : 'md:group-hover/top10:scale-[1.08] md:group-hover/top10:-translate-y-1.5 md:group-hover/top10:z-30 shadow-xl group-hover/top10:shadow-[0_20px_48px_rgba(0,0,0,0.95)]'
                  }`}
                >
                  <ChannelThumbnail
                    channel={channel}
                    customCover={customCover}
                    className="w-full h-full object-cover object-center"
                  />

                  {/* Subtle bottom vignette for readable title on idle without extra clutter */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent md:group-hover/top10:opacity-0 transition-opacity duration-200 pointer-events-none" />

                  <div className="absolute bottom-0 left-0 right-0 p-2 text-right md:group-hover/top10:opacity-0 transition-opacity pointer-events-none">
                    <p className="text-[11px] font-bold text-white line-clamp-1 drop-shadow">
                      {channel.name}
                    </p>
                  </div>

                  {/* Hover Action Controls (Visible ONLY on Hover) */}
                  <div className="hidden md:flex flex-col justify-end absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent opacity-0 group-hover/top10:opacity-100 transition-opacity duration-200 p-2.5 z-20">
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayChannel(channel);
                          }}
                          aria-label={`تشغيل ${channel.name}`}
                          className="w-7 h-7 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow transition-transform hover:scale-110 cursor-pointer"
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
                          className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                            isFav
                              ? 'bg-[#e50914] border-[#e50914] text-white'
                              : 'bg-[#2a2a2a]/85 border-zinc-400 hover:border-white text-white'
                          }`}
                        >
                          {isFav ? <Check className="w-3 h-3" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(channel);
                        }}
                        aria-label="المزيد من المعلومات"
                        className="w-7 h-7 rounded-full bg-[#2a2a2a]/85 border border-zinc-400 hover:border-white text-white flex items-center justify-center cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] font-extrabold text-white truncate text-right">
                      {channel.name}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-300 mt-0.5 truncate">
                      <span className="text-emerald-400 font-bold">
                        {isLive ? 'LIVE' : channel.resolution || 'HD'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{channel.group}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute -left-2 top-4 bottom-4 w-11 bg-black/70 hover:bg-black/90 text-white z-40 rounded-l-md items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer"
          title="تمرير لليسار"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      </div>
    </section>
  );
};
