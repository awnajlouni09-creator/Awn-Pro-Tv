import React, { useRef } from 'react';
import { Play, Plus, Check, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import { Channel } from '../types/iptv';
import { ChannelThumbnail } from './ChannelThumbnail';

interface Top10RowProps {
  title?: string;
  channels: Channel[];
  onPlayChannel: (channel: Channel) => void;
  onOpenDetails: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  favorites: string[];
  customCovers?: Record<string, string>;
  focusedChannelId?: string | null;
}

export const Top10Row: React.FC<Top10RowProps> = ({
  title = 'أفضل 10 أفلام اليوم',
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
    <section className="relative py-4 sm:py-6 px-4 sm:px-6 md:px-12 group/row select-none">
      {/* Row Header */}
      <div className="flex items-baseline justify-between mb-3 text-right">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-black tracking-wider text-[#E50914] font-['Outfit']">
            TOP 10
          </span>
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-wide">
            {title}
          </h2>
        </div>
      </div>

      {/* Horizontal Carousel with Hover-Only Side Arrows */}
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label="تمرير لليمين"
          className="hidden md:flex absolute -right-2 top-4 bottom-4 w-11 bg-black/75 hover:bg-black/90 text-white z-40 rounded-r-md items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer"
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

            return (
              <div
                key={channel.id}
                data-channel-id={channel.id}
                onClick={() => onOpenDetails(channel)}
                className="group/top10 relative flex-none flex items-end snap-start cursor-pointer"
              >
                {/* Giant Hollow Outlined Rank Numeral (1 - 10) */}
                <svg
                  viewBox={rank === 10 ? '0 0 156 160' : '0 0 98 160'}
                  aria-hidden="true"
                  className={`shrink-0 select-none pointer-events-none z-0 overflow-visible transition-transform duration-300 group-hover/top10:scale-105 ${
                    rank === 10
                      ? 'w-[104px] sm:w-[126px] md:w-[146px] h-[126px] sm:h-[152px] md:h-[180px] -ml-5 sm:-ml-6'
                      : 'w-[72px] sm:w-[88px] md:w-[104px] h-[126px] sm:h-[152px] md:h-[180px] -ml-4 sm:-ml-5'
                  }`}
                >
                  <text
                    x="50%"
                    y="144"
                    textAnchor="middle"
                    fill="#161616"
                    stroke="#7a7a7a"
                    strokeWidth="5.5"
                    strokeLinejoin="round"
                    paintOrder="stroke fill"
                    className="font-['Outfit'] font-black group-hover/top10:stroke-[#a3a3a3] transition-colors duration-300"
                    style={{
                      fontSize: rank === 10 ? '138px' : '158px',
                      letterSpacing: rank === 10 ? '-10px' : '0px'
                    }}
                  >
                    {rank}
                  </text>
                </svg>

                {/* Vertical Portrait Poster Card (Aspect Ratio 2:3) */}
                <div
                  className={`relative z-10 w-28 sm:w-32 md:w-36 aspect-[2/3] rounded-md overflow-hidden bg-[#181818] transition-all duration-300 ease-out ${
                    isFocused
                      ? 'ring-2 ring-[#E50914] scale-[1.08] z-30 shadow-[0_18px_42px_rgba(0,0,0,0.95)]'
                      : 'md:group-hover/top10:scale-[1.08] md:group-hover/top10:-translate-y-1.5 md:group-hover/top10:z-30 shadow-xl group-hover/top10:shadow-[0_20px_48px_rgba(0,0,0,0.95)]'
                  }`}
                >
                  <ChannelThumbnail
                    channel={channel}
                    customCover={customCover}
                    className="w-full h-full object-cover object-center"
                  />

                  {/* Subtle Bottom Scrim for Title + Red "أضيفت حديثاً" Tag */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent md:group-hover/top10:opacity-0 transition-opacity duration-200 pointer-events-none" />

                  <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center text-center md:group-hover/top10:opacity-0 transition-opacity pointer-events-none">
                    <p className="px-2 pb-1.5 text-[11px] font-bold text-white line-clamp-1 drop-shadow w-full">
                      {channel.name}
                    </p>
                    {showRecentlyAdded && (
                      <div className="bg-[#E50914] text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-t-sm shadow-md whitespace-nowrap">
                        أضيفت حديثاً
                      </div>
                    )}
                  </div>

                  {/* Hover Action Controls (Visible ONLY on Hover) */}
                  <div className="hidden md:flex flex-col justify-end absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/85 to-transparent opacity-0 group-hover/top10:opacity-100 transition-opacity duration-200 p-2.5 z-20">
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
                              ? 'bg-[#E50914] border-[#E50914] text-white'
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
          type="button"
          onClick={() => scroll('left')}
          aria-label="تمرير لليسار"
          className="hidden md:flex absolute -left-2 top-4 bottom-4 w-11 bg-black/75 hover:bg-black/90 text-white z-40 rounded-l-md items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      </div>
    </section>
  );
};
