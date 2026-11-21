import React, { useRef } from 'react';
import { History, Play, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { ContinueWatchingItem } from '../types/history';
import { Channel } from '../types/iptv';
import { ChannelThumbnail } from './ChannelThumbnail';

interface ContinueWatchingRowProps {
  items: ContinueWatchingItem[];
  onPlayChannel: (channel: Channel, resumeTime?: number) => void;
  onRemoveItem: (channelId: string) => void;
  customCovers?: Record<string, string>;
  focusedChannelId?: string | null;
}

export const ContinueWatchingRow: React.FC<ContinueWatchingRowProps> = ({
  items,
  onPlayChannel,
  onRemoveItem,
  customCovers = {},
  focusedChannelId = null
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative py-3 sm:py-4 px-4 sm:px-6 md:px-12 group/row select-none">
      {/* Row Header */}
      <div className="flex items-baseline justify-between mb-2.5 sm:mb-3 text-right">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="text-[#e50914]">
            <History className="w-5 h-5" />
          </span>
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-wide">
            أكمل المشاهدة
          </h2>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div className="relative">
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute -right-2 top-5 bottom-5 w-11 bg-black/70 hover:bg-black/90 text-white z-40 rounded-r-md items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer"
          title="تمرير لليمين"
        >
          <ChevronRight className="w-7 h-7" />
        </button>

        <div
          ref={rowRef}
          className="flex items-center gap-2.5 sm:gap-3 md:gap-3.5 overflow-x-auto overflow-y-visible py-5 sm:py-6 -my-3 px-1 no-scrollbar scroll-smooth snap-x snap-mandatory touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((item) => {
            const { channel, progressPercent, currentTime } = item;
            const customCover = customCovers[channel.id];
            const isFocused = focusedChannelId === channel.id;
            const clampedProgress = Math.max(8, Math.min(100, Math.round(progressPercent || 12)));

            return (
              <div
                key={channel.id}
                data-channel-id={channel.id}
                onClick={() => onPlayChannel(channel, currentTime > 5 ? currentTime : undefined)}
                className={`group/card relative flex-none w-48 sm:w-56 md:w-64 lg:w-72 snap-start aspect-video rounded-md overflow-hidden bg-[#181818] transition-all duration-300 ease-out cursor-pointer ${
                  isFocused
                    ? 'ring-2 ring-[#e50914] scale-[1.08] z-30 shadow-[0_18px_42px_rgba(0,0,0,0.95)]'
                    : 'md:hover:scale-[1.08] md:hover:-translate-y-1 md:hover:z-30 shadow-md hover:shadow-[0_20px_45px_rgba(0,0,0,0.95)]'
                }`}
              >
                <div className="w-full h-full relative overflow-hidden bg-zinc-900">
                  <ChannelThumbnail
                    channel={channel}
                    customCover={customCover}
                    className="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
                  />

                  {/* Subtle Bottom Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

                  {/* Quick Remove (X) Button — Revealed ONLY on Hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(channel.id);
                    }}
                    className="opacity-0 group-hover/card:opacity-100 absolute top-2 left-2 w-7 h-7 rounded-full bg-black/80 hover:bg-[#e50914] text-white border border-white/25 flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer z-20"
                    title="إزالة من أكمل المشاهدة"
                    aria-label={`إزالة ${channel.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Circular White Play Button — Revealed ONLY on Hover */}
                  <div className="hidden md:flex absolute inset-0 items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Clean Card Bottom Title */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 text-right z-10 pointer-events-none">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate leading-tight drop-shadow">
                      {channel.name}
                    </h3>
                  </div>

                  {/* Netflix Red Progress Bar Along Bottom Edge */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700/80 z-20">
                    <div
                      className="h-full bg-[#e50914] transition-all duration-300"
                      style={{ width: `${clampedProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute -left-2 top-5 bottom-5 w-11 bg-black/70 hover:bg-black/90 text-white z-40 rounded-l-md items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer"
          title="تمرير لليسار"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
