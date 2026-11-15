import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Newspaper, 
  Clapperboard, 
  Film, 
  Smile, 
  BookOpen, 
  Trophy, 
  Compass,
  Radio,
  Music,
  Sparkles
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { extractYouTubeVideoId, getYouTubeThumbnails } from '../utils/mediaHelper';

interface ChannelThumbnailProps {
  channel: Channel;
  customCover?: string | null;
  className?: string;
  isBanner?: boolean;
  alt?: string;
}

export const ChannelThumbnail: React.FC<ChannelThumbnailProps> = ({
  channel,
  customCover,
  className = '',
  isBanner = false,
  alt
}) => {
  // Extract potential YouTube ID
  const youtubeId = channel.youtubeId || 
    extractYouTubeVideoId(channel.url) || 
    extractYouTubeVideoId(channel.embedUrl) ||
    (channel.servers && channel.servers.length > 0 ? extractYouTubeVideoId(channel.servers[0].url) : null);

  // Determine initial image source
  const getInitialSrc = (): string | null => {
    if (customCover) return customCover;
    if (youtubeId) {
      return getYouTubeThumbnails(youtubeId).maxres;
    }
    if (isBanner && channel.backdrop) return channel.backdrop;
    if (channel.poster) return channel.poster;
    if (channel.backdrop) return channel.backdrop;
    if (channel.logo) return channel.logo;
    return null;
  };

  const [imgSrc, setImgSrc] = useState<string | null>(getInitialSrc());
  const [hasError, setHasError] = useState(false);
  const [attemptLevel, setAttemptLevel] = useState<number>(0);

  // Sync if channel or customCover changes
  useEffect(() => {
    setImgSrc(getInitialSrc());
    setHasError(false);
    setAttemptLevel(0);
  }, [channel.id, channel.url, customCover, youtubeId]);

  const handleImageError = () => {
    if (youtubeId) {
      if (attemptLevel === 0) {
        setAttemptLevel(1);
        setImgSrc(getYouTubeThumbnails(youtubeId).sd);
        return;
      } else if (attemptLevel === 1) {
        setAttemptLevel(2);
        setImgSrc(getYouTubeThumbnails(youtubeId).hq);
        return;
      } else if (attemptLevel === 2) {
        setAttemptLevel(3);
        setImgSrc(getYouTubeThumbnails(youtubeId).mq);
        return;
      }
    }

    // Next fallback: try channel poster / backdrop / logo if different from current
    if (channel.poster && imgSrc !== channel.poster) {
      setImgSrc(channel.poster);
      return;
    }
    if (channel.backdrop && imgSrc !== channel.backdrop) {
      setImgSrc(channel.backdrop);
      return;
    }
    if (channel.logo && imgSrc !== channel.logo) {
      setImgSrc(channel.logo);
      return;
    }

    // All image sources failed, render themed fallback card
    setHasError(true);
  };

  // Helper for category styled luxury card
  const getCategoryTheme = (group: string) => {
    switch (group) {
      case 'قنوات إخبارية':
        return {
          gradient: 'from-[#380b0b] via-[#1a0505] to-[#0a0a0a]',
          border: 'border-red-900/40',
          accent: 'text-[#ff3b3b]',
          icon: <Newspaper className="w-8 h-8 md:w-10 md:h-10 text-[#ff3b3b]" />,
          tag: 'بث إخباري'
        };
      case 'مسلسلات عربية':
        return {
          gradient: 'from-[#2e0854] via-[#150426] to-[#0a0a0a]',
          border: 'border-purple-900/40',
          accent: 'text-purple-400',
          icon: <Clapperboard className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />,
          tag: 'دراما ومسلسلات'
        };
      case 'أفلام أجنبية':
        return {
          gradient: 'from-[#0b2447] via-[#051329] to-[#0a0a0a]',
          border: 'border-blue-900/40',
          accent: 'text-blue-400',
          icon: <Film className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />,
          tag: 'سينما وأفلام'
        };
      case 'أطفال وكرتون':
        return {
          gradient: 'from-[#452205] via-[#211102] to-[#0a0a0a]',
          border: 'border-amber-700/40',
          accent: 'text-amber-400',
          icon: <Smile className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />,
          tag: 'أطفال وعائلة'
        };
      case 'إسلاميات ودين':
        return {
          gradient: 'from-[#063b2c] via-[#021c15] to-[#0a0a0a]',
          border: 'border-emerald-800/40',
          accent: 'text-emerald-400',
          icon: <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" />,
          tag: 'قنوات دينية'
        };
      case 'رياضة وسرعة':
        return {
          gradient: 'from-[#4d1d05] via-[#260f02] to-[#0a0a0a]',
          border: 'border-orange-800/40',
          accent: 'text-orange-400',
          icon: <Trophy className="w-8 h-8 md:w-10 md:h-10 text-orange-400" />,
          tag: 'رياضة مباشرة'
        };
      case 'وثائقي وطبيعة':
        return {
          gradient: 'from-[#0b3634] via-[#041d1c] to-[#0a0a0a]',
          border: 'border-teal-800/40',
          accent: 'text-teal-400',
          icon: <Compass className="w-8 h-8 md:w-10 md:h-10 text-teal-400" />,
          tag: 'وثائقيات'
        };
      case 'وثائقيات أبو الصادق':
        return {
          gradient: 'from-[#292524] via-[#1c1917] to-[#0a0a0a]',
          border: 'border-amber-900/40',
          accent: 'text-amber-500',
          icon: <Compass className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />,
          tag: 'تحقيقات أبو الصادق'
        };
      case 'قصص وروايات':
        return {
          gradient: 'from-[#1e1b4b] via-[#0f0e26] to-[#0a0a0a]',
          border: 'border-indigo-800/40',
          accent: 'text-indigo-400',
          icon: <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-indigo-400" />,
          tag: 'قصص وروايات'
        };
      case 'ملخصات انمي':
        return {
          gradient: 'from-[#3b0764] via-[#1a032e] to-[#0a0a0a]',
          border: 'border-fuchsia-800/40',
          accent: 'text-fuchsia-400',
          icon: <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-fuchsia-400" />,
          tag: 'ملخصات أنمي'
        };
      case 'أغاني وموسيقى':
        return {
          gradient: 'from-[#4c0519] via-[#26020d] to-[#0a0a0a]',
          border: 'border-rose-800/40',
          accent: 'text-rose-400',
          icon: <Music className="w-8 h-8 md:w-10 md:h-10 text-rose-400" />,
          tag: 'أغاني وموسيقى'
        };
      default:
        return {
          gradient: 'from-[#1c1c1c] via-[#121212] to-[#0a0a0a]',
          border: 'border-zinc-800',
          accent: 'text-zinc-400',
          icon: <Tv className="w-8 h-8 md:w-10 md:h-10 text-zinc-400" />,
          tag: channel.group || 'قناة فضائية'
        };
    }
  };

  // If no error and we have an image URL
  if (imgSrc && !hasError) {
    return (
      <img
        src={imgSrc}
        alt={alt || channel.name}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={(e) => {
          // Catch YouTube's 120x90 grey missing-thumbnail placeholder
          if (youtubeId && e.currentTarget.naturalWidth <= 120 && e.currentTarget.naturalHeight <= 90) {
            handleImageError();
          }
        }}
        onError={handleImageError}
        className={`w-full h-full object-cover object-center transition-transform duration-500 ${className}`}
      />
    );
  }

  // Fallback: Luxury branded card with channel details
  const theme = getCategoryTheme(channel.group);

  return (
    <div
      className={`w-full h-full relative overflow-hidden bg-gradient-to-br ${theme.gradient} flex flex-col justify-between p-4 md:p-6 text-right select-none ${className}`}
    >
      {/* Decorative ambient corner glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      {/* Top row: Category tag & Channel Logo / Icon */}
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-zinc-300">
          {theme.tag}
        </span>
        <div className="p-2 rounded-xl bg-black/40 border border-white/10 shadow-inner">
          {theme.icon}
        </div>
      </div>

      {/* Center Channel Name in clear large typography */}
      <div className="relative z-10 space-y-1 my-auto">
        <h4 className="text-sm sm:text-base md:text-lg font-black text-white leading-tight drop-shadow-md line-clamp-2">
          {channel.name}
        </h4>
        <p className="text-[11px] text-zinc-400 line-clamp-1">
          {channel.description || 'بث مباشر عالي الجودة'}
        </p>
      </div>

      {/* Bottom strip */}
      <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-zinc-400 font-mono">
        <span className="text-amber-400 font-bold">{channel.resolution || 'FHD'}</span>
        <span className="truncate max-w-[120px]">{channel.group}</span>
      </div>
    </div>
  );
};
