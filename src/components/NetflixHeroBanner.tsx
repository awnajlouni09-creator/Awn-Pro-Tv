import React, { useState, useEffect } from 'react';
import { Play, Info, Star } from 'lucide-react';
import { Channel } from '../types/iptv';
import { extractYouTubeVideoId, getYouTubeThumbnails } from '../utils/mediaHelper';
import { AppThemeId } from './ParticleNebulaBg';

interface NetflixHeroBannerProps {
  featuredChannels: Channel[];
  onPlayChannel: (channel: Channel) => void;
  onOpenDetails: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  favorites: string[];
  customCovers?: Record<string, string>;
  theme?: AppThemeId;
}

const sanitizeDescription = (raw?: string): string => {
  if (!raw) {
    return 'بث مباشر عالي الجودة متواصل على مدار 24 ساعة بأعلى دقة وبدون أي تقطيع.';
  }
  if (/\.(mp4|mkv|webm|avi|m3u8)\b/i.test(raw) || /\b\d+(\.\d+)?\s?(MB|GB)\b/i.test(raw)) {
    return 'عرض سينمائي عالي الدقة جاهز للتشغيل الفوري بجودة فائقة.';
  }
  return raw;
};

export const NetflixHeroBanner: React.FC<NetflixHeroBannerProps> = ({
  featuredChannels,
  onPlayChannel,
  onOpenDetails,
  onToggleFavorite,
  favorites,
  customCovers = {},
  theme = 'action'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!featuredChannels || featuredChannels.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredChannels.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [featuredChannels]);

  if (!featuredChannels || featuredChannels.length === 0) return null;

  const current = featuredChannels[currentIndex % featuredChannels.length];
  const isFav = favorites.includes(current.id);
  const isClassic = theme === 'netflix';

  const baseHex =
    theme === 'galaxy'
      ? '#04020f'
      : theme === '2077'
      ? '#050914'
      : isClassic
      ? '#141414'
      : '#07070c';

  const baseRgb =
    theme === 'galaxy'
      ? '4,2,15'
      : theme === '2077'
      ? '5,9,20'
      : isClassic
      ? '20,20,20'
      : '7,7,12';

  const youtubeId =
    current.youtubeId ||
    extractYouTubeVideoId(current.url) ||
    extractYouTubeVideoId(current.embedUrl) ||
    (current.servers && current.servers.length > 0
      ? extractYouTubeVideoId(current.servers[0].url)
      : null);

  const customCover = customCovers[current.id];

  const getHeroImageSrc = () => {
    if (customCover) return customCover;
    if (youtubeId) return getYouTubeThumbnails(youtubeId).maxres;
    if (current.backdrop) return current.backdrop;
    if (current.poster) return current.poster;
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1920&auto=format&fit=crop&q=90';
  };

  const [imgSrc, setImgSrc] = useState(getHeroImageSrc());

  useEffect(() => {
    setImgSrc(getHeroImageSrc());
  }, [current.id, customCover, youtubeId]);

  const handleImgError = () => {
    if (youtubeId) {
      const thumbs = getYouTubeThumbnails(youtubeId);
      if (imgSrc === thumbs.maxres) {
        setImgSrc(thumbs.sd);
        return;
      }
      if (imgSrc === thumbs.sd) {
        setImgSrc(thumbs.hq);
        return;
      }
    }
    if (current.backdrop && imgSrc !== current.backdrop) {
      setImgSrc(current.backdrop);
    } else if (current.poster && imgSrc !== current.poster) {
      setImgSrc(current.poster);
    }
  };

  return (
    <section
      className="relative w-full h-[76vh] sm:h-[82vh] max-h-[880px] min-h-[500px] overflow-hidden select-none"
      style={{ backgroundColor: baseHex }}
    >
      {/* Crystal-Clear Background Hero Artwork */}
      <div className="absolute inset-0 z-0">
        <img
          key={current.id + (customCover || '')}
          src={imgSrc}
          alt={current.name}
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            if (youtubeId && e.currentTarget.naturalWidth <= 120 && e.currentTarget.naturalHeight <= 90) {
              handleImgError();
            }
          }}
          onError={handleImgError}
          className="w-full h-full object-cover object-center animate-in fade-in duration-700"
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${baseHex} 0%, rgba(${baseRgb},0.74) 24%, rgba(${baseRgb},0) 60%)`
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to left, rgba(${baseRgb},0.85) 0%, rgba(${baseRgb},0.38) 38%, rgba(${baseRgb},0) 72%)`
          }}
        />
      </div>

      {/* Hero Typography & Actions (RTL Right Aligned) */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 flex flex-col justify-end pb-16 sm:pb-24 md:pb-28">
        <div className="max-w-xl space-y-3 sm:space-y-4 text-right">
          {/* Clean Category & Quality Line */}
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-zinc-200">
            <span
              className={`font-black tracking-wide font-['Outfit'] ${
                theme === '2077'
                  ? 'text-cyan-400'
                  : theme === 'galaxy'
                  ? 'text-amber-300'
                  : 'text-[#E50914]'
              }`}
            >
              {current.resolution || '4K ULTRA'}
            </span>
            <span aria-hidden="true" className="text-zinc-500">·</span>
            <span className="text-zinc-200">{current.group}</span>
          </div>

          {/* Bold Hero Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
            {current.name}
          </h1>

          {/* Clean Synopsis */}
          <p className="text-xs sm:text-sm md:text-base text-zinc-200/95 leading-relaxed max-w-lg line-clamp-2 sm:line-clamp-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            {sanitizeDescription(current.description)}
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              data-play-btn="true"
              onClick={() => onPlayChannel(current)}
              className={`flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm md:text-base font-black shadow-[0_12px_32px_rgba(0,0,0,0.65)] transition-all cursor-pointer active:scale-95 ${
                isClassic ? 'rounded-md' : 'rounded-xl'
              }`}
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
              <span>تشغيل</span>
            </button>

            <button
              onClick={() => onOpenDetails(current)}
              className={
                isClassic
                  ? 'flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 bg-[#6d6d6e]/70 hover:bg-[#6d6d6e]/50 text-white text-xs sm:text-sm md:text-base font-bold rounded-md transition-all cursor-pointer active:scale-95'
                  : 'flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 modern-glass glass-border-glow text-white text-xs sm:text-sm md:text-base font-bold rounded-xl transition-all cursor-pointer active:scale-95'
              }
            >
              <Info className={`w-4 h-4 sm:w-5 sm:h-5 ${isClassic ? 'text-white' : 'text-[#E50914]'}`} />
              <span>المزيد من المعلومات</span>
            </button>

            <button
              onClick={() => onToggleFavorite(current.id)}
              className={`p-2.5 sm:p-3 border transition-all cursor-pointer active:scale-95 ${
                isClassic ? 'rounded-md' : 'rounded-xl'
              } ${
                isFav
                  ? 'bg-[#e50914]/30 border-[#e50914] text-[#ff4d4d]'
                  : isClassic
                  ? 'bg-black/55 border-white/30 text-white hover:border-white'
                  : 'modern-glass border-white/20 text-white hover:border-[#E50914]/65'
              }`}
              title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            >
              <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
