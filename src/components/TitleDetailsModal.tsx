import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Plus,
  Check,
  ThumbsUp,
  Volume2,
  VolumeX,
  ImagePlus,
  Upload,
  RotateCcw,
  Link as LinkIcon,
  Server,
  Layers
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { ChannelThumbnail } from './ChannelThumbnail';
import {
  getChannelCast,
  getChannelDurationLabel,
  getChannelMaturityRating,
  getChannelYear,
  getFranchiseAndRelatedChannels,
  getMaturityBadgeLabel
} from '../utils/mediaMetadata';

const LIKED_STORAGE_KEY = 'awn_tv_liked_titles_v1';

interface TitleDetailsModalProps {
  channel: Channel | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (channel: Channel, resumeTime?: number) => void;
  onToggleFavorite: (channelId: string) => void;
  isFavorite: boolean;
  customCover?: string | null;
  onUpdateCover: (channelId: string, newCoverUrl: string | null) => void;
  allChannels?: Channel[];
  favorites?: string[];
  customCovers?: Record<string, string>;
  resumeTime?: number;
  resumeDuration?: number;
  onSelectChannel?: (channel: Channel) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

const cleanSynopsis = (ch: Channel): string => {
  if (ch.description && !/\.(mp4|mkv|webm|avi|m3u8)\b/i.test(ch.description)) {
    return ch.description;
  }
  switch (ch.group) {
    case 'أفلام أجنبية':
      return 'عمل سينمائي متكامل جاهز للمشاهدة المباشرة بأعلى دقة ممكنة وصوت نقي مع تحكم كامل بتقديم وتأخير المشاهد.';
    case 'مسلسلات عربية':
      return 'حلقات درامية وكوميدية متميزة بجودة عالية وتجربة مشاهدة ممتعة لجميع أفراد العائلة.';
    case 'ملخصات انمي':
    case 'أطفال وكرتون':
      return 'مغامرات ممتعة وشيقة بجودة فائقة الوضوح ومناسبة للمشاهدة الممتعة في أي وقت.';
    case 'وثائقي وطبيعة':
    case 'وثائقيات أبو الصادق':
      return 'استكشاف عميق للحقائق والعلوم وأسرار الطبيعة والتاريخ بتصوير عالي الدقة.';
    case 'رياضة وسرعة':
      return 'تغطية رياضية مباشرة لأقوى البطولات والسباقات بجودة بث فائقة واستقرار عالٍ.';
    case 'إسلاميات ودين':
      return 'بث مباشر متواصل للقرآن الكريم والحرمين الشريفين بجودة نقية على مدار الساعة.';
    default:
      return 'بث مباشر ومحتوى ترفيهي عالي الجودة متواصل على مدار الساعة بأعلى دقة، متوافق مع كافة الأجهزة وشاشات التلفزيون الذكية.';
  }
};

const getClassificationLabel = (group: string): string => {
  if (group === 'أفلام أجنبية') return 'أفلام وسينما عالمية';
  if (group === 'مسلسلات عربية') return 'دراما ومسلسلات';
  if (group === 'أطفال وكرتون' || group === 'ملخصات انمي') return 'رسوم متحركة وأنمي';
  if (group === 'وثائقي وطبيعة' || group === 'وثائقيات أبو الصادق') return 'وثائقي وتحقيقات';
  if (group === 'رياضة وسرعة') return 'رياضة وبث مباشر';
  if (group === 'إسلاميات ودين') return 'قنوات دينية';
  if (group === 'أغاني وموسيقى') return 'موسيقى وصوتيات';
  if (group === 'قصص وروايات') return 'قصص وتجارب واقعية';
  return 'ترفيه وبث مباشر';
};

export const TitleDetailsModal: React.FC<TitleDetailsModalProps> = ({
  channel,
  isOpen,
  onClose,
  onPlay,
  onToggleFavorite,
  isFavorite,
  customCover,
  onUpdateCover,
  allChannels = [],
  favorites = [],
  customCovers = {},
  resumeTime = 0,
  resumeDuration = 0,
  onSelectChannel,
  isMuted = false,
  onToggleMute
}) => {
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localMuted, setLocalMuted] = useState(isMuted);
  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LIKED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    if (!isOpen) return;
    setIsEditingCover(false);
    setPreviewUrl(null);
    setInputUrl('');
    modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [channel?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const { franchiseLabel, franchiseItems, relatedItems } = useMemo(() => {
    if (!channel) return { franchiseLabel: null, franchiseItems: [], relatedItems: [] };
    return getFranchiseAndRelatedChannels(channel, allChannels);
  }, [allChannels, channel]);

  if (!isOpen || !channel) return null;

  const isLiked = likedIds.includes(channel.id);
  const hasResume = resumeTime > 5;
  const resumeProgress =
    hasResume && resumeDuration > 0
      ? Math.min(96, Math.max(4, Math.round((resumeTime / resumeDuration) * 100)))
      : 0;
  const effectiveMuted = onToggleMute ? isMuted : localMuted;
  const isLiveStream =
    channel.url?.includes('.m3u8') ||
    channel.type === 'hls' ||
    channel.badge?.toUpperCase().includes('LIVE') ||
    channel.badge?.includes('مباشر');

  const releaseYear = getChannelYear(channel);
  const durationLabel = getChannelDurationLabel(channel, resumeDuration);
  const maturityLabel = getMaturityBadgeLabel(getChannelMaturityRating(channel));
  const castList = getChannelCast(channel);

  const handleToggleLike = () => {
    setLikedIds((prev) => {
      const next = prev.includes(channel.id)
        ? prev.filter((id) => id !== channel.id)
        : [...prev, channel.id];
      try {
        localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const handleMuteClick = () => {
    if (onToggleMute) {
      onToggleMute();
    } else {
      setLocalMuted((m) => !m);
    }
  };

  const handleOpenCoverEditor = () => {
    setIsEditingCover((prev) => !prev);
    setInputUrl(customCover || '');
    setPreviewUrl(customCover || null);
    setSaveSuccess(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 960;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setPreviewUrl(compressed);
            setInputUrl('');
            return;
          }
        } catch {
          // Fallback to original dataUrl
        }
        setPreviewUrl(dataUrl);
        setInputUrl('');
      };
      img.onerror = () => {
        setPreviewUrl(dataUrl);
        setInputUrl('');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCover = () => {
    const chosenCover = previewUrl || inputUrl.trim();
    if (chosenCover) {
      onUpdateCover(channel.id, chosenCover);
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditingCover(false);
        setSaveSuccess(false);
      }, 900);
    }
  };

  const handleResetCover = () => {
    onUpdateCover(channel.id, null);
    setPreviewUrl(null);
    setInputUrl('');
    setSaveSuccess(true);
    setTimeout(() => {
      setIsEditingCover(false);
      setSaveSuccess(false);
    }, 900);
  };

  const renderRelatedCard = (item: Channel) => {
    const itemFav = favorites.includes(item.id);
    const itemMaturity = getMaturityBadgeLabel(getChannelMaturityRating(item));
    const itemYear = getChannelYear(item);
    return (
      <div
        key={item.id}
        onClick={() => {
          if (onSelectChannel) {
            onSelectChannel(item);
          } else {
            onClose();
            onPlay(item);
          }
        }}
        className="bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-lg overflow-hidden cursor-pointer group/card transition-colors flex flex-col shadow-md"
      >
        <div className="relative h-32 sm:h-36 w-full bg-black overflow-hidden">
          <ChannelThumbnail
            channel={item}
            customCover={customCovers[item.id]}
            isBanner={false}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 opacity-80 group-hover/card:opacity-100 transition-opacity" />

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
            <div className="w-11 h-11 rounded-full bg-black/75 border border-white/80 flex items-center justify-center shadow-xl">
              <Play className="w-5 h-5 text-white fill-current ml-0.5" />
            </div>
          </div>

          <span className="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-zinc-200 border border-white/15">
            {item.resolution || 'HD'}
          </span>
        </div>

        <div className="p-3.5 flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-zinc-300">
              <span className="px-1.5 py-0.5 border border-zinc-500 rounded text-[10px] font-bold text-zinc-200 shrink-0">
                {itemMaturity}
              </span>
              <span className="font-mono tabular-nums">{itemYear}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item.id);
              }}
              title={itemFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              aria-label={itemFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-90 ${
                itemFav
                  ? 'border-white bg-white/20 text-white'
                  : 'border-zinc-400/80 hover:border-white text-zinc-200 hover:text-white'
              }`}
            >
              {itemFav ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>

          <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
            {cleanSynopsis(item)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-2 sm:p-5 md:p-8 overflow-y-auto select-none"
    >
      <div
        ref={modalScrollRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[900px] bg-[#181818] rounded-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.92)] border border-white/10 relative text-white my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Hero Image Section */}
        <div className="relative h-64 sm:h-80 md:h-[420px] w-full overflow-hidden bg-black">
          <ChannelThumbnail
            channel={channel}
            customCover={previewUrl || customCover}
            isBanner={true}
            className="w-full h-full object-cover"
          />

          {/* Smooth Netflix Bottom Gradient Merge into #181818 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, #181818 0%, rgba(24,24,24,0.78) 28%, rgba(24,24,24,0.22) 65%, transparent 100%)'
            }}
          />

          {/* Circular Close (X) Button - Top Left */}
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 z-20 w-10 h-10 rounded-full bg-[#181818]/85 hover:bg-[#181818] text-white flex items-center justify-center transition-all cursor-pointer border border-white/15 shadow-lg active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Mute / Unmute Audio Button - Bottom Left of Hero */}
          <button
            type="button"
            onClick={handleMuteClick}
            aria-label={effectiveMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            title={effectiveMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            className="absolute bottom-6 left-4 sm:bottom-8 sm:left-8 z-20 w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 text-zinc-200 hover:text-white border border-white/40 hover:border-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            {effectiveMuted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          {/* Title & Main Netflix Action Buttons over Gradient */}
          <div className="absolute bottom-5 sm:bottom-8 right-4 sm:right-8 left-16 sm:left-24 z-10 text-right space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              {channel.name}
            </h2>

            {hasResume && resumeProgress > 0 && (
              <div className="max-w-[260px] space-y-1">
                <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E50914] rounded-full"
                    style={{ width: `${resumeProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {/* Prominent White Play / Resume Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPlay(channel, hasResume ? resumeTime : undefined);
                }}
                className="flex items-center gap-2 px-7 py-2.5 bg-white hover:bg-white/85 text-black font-black text-sm sm:text-base rounded-md shadow-xl transition-all cursor-pointer active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{hasResume ? 'استئناف' : 'تشغيل'}</span>
              </button>

              {/* Circular Add/Remove Favorite Button (+) */}
              <button
                type="button"
                onClick={() => onToggleFavorite(channel.id)}
                title={isFavorite ? 'إزالة من قائمتي' : 'إضافة إلى قائمتي'}
                aria-label={isFavorite ? 'إزالة من قائمتي' : 'إضافة إلى قائمتي'}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isFavorite
                    ? 'bg-white/20 border-white text-white'
                    : 'bg-[#2a2a2a]/75 hover:bg-[#2a2a2a] border-zinc-400 hover:border-white text-white'
                }`}
              >
                {isFavorite ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>

              {/* Circular Like Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                title={isLiked ? 'أعجبني' : 'إعجاب'}
                aria-label="إعجاب"
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isLiked
                    ? 'bg-white/20 border-white text-white'
                    : 'bg-[#2a2a2a]/75 hover:bg-[#2a2a2a] border-zinc-400 hover:border-white text-white'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>

              {/* Cover Customize Button */}
              <button
                type="button"
                onClick={handleOpenCoverEditor}
                title="تغيير صورة الغلاف"
                aria-label="تغيير صورة الغلاف"
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isEditingCover
                    ? 'bg-[#E50914]/25 border-[#E50914] text-white'
                    : 'bg-[#2a2a2a]/75 hover:bg-[#2a2a2a] border-zinc-400 hover:border-white text-zinc-200 hover:text-white'
                }`}
              >
                <ImagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="px-4 sm:px-8 md:px-10 pb-8 pt-3 space-y-8 text-right">
          {/* Optional Cover Editor Panel */}
          {isEditingCover && (
            <div className="p-4 bg-[#222222] rounded-xl border border-white/15 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <ImagePlus className="w-4 h-4 text-[#E50914]" />
                  <span>تخصيص صورة الغلاف:</span>
                </span>
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>تم الحفظ بنجاح</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 bg-black/60 border border-zinc-700 rounded-lg px-3 py-2">
                <LinkIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="url"
                  placeholder="ألصق رابط الصورة المباشر (https://...)"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    setPreviewUrl(e.target.value);
                  }}
                  className="w-full bg-transparent text-white text-xs sm:text-sm focus:outline-none placeholder:text-zinc-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-600 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع صورة من الجهاز</span>
                </button>

                {customCover && (
                  <button
                    type="button"
                    onClick={handleResetCover}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-950/70 text-red-300 text-xs font-semibold rounded-lg border border-red-800/40 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الغلاف التلقائي</span>
                  </button>
                )}

                <div className="mr-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingCover(false)}
                    className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCover}
                    className="flex items-center gap-1 px-4 py-1.5 bg-[#E50914] hover:bg-[#f40612] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>حفظ الغلاف</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Two-Column Netflix Info Section (65% Right / 35% Left in RTL) */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Right Column (~65%): Production Year, Maturity, Duration, Quality & Story Synopsis */}
            <div className="w-full md:w-[65%] space-y-3.5">
              <div className="flex items-center gap-2.5 flex-wrap text-xs sm:text-sm text-zinc-200">
                <span className="text-emerald-400 font-bold">مناسب لك</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="font-mono font-bold tabular-nums">{releaseYear}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="px-1.5 py-0.5 border border-zinc-500 rounded text-[11px] font-bold text-zinc-200">
                  {maturityLabel}
                </span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="font-medium text-zinc-300">{durationLabel}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="px-1.5 py-0.5 border border-zinc-500 rounded text-[11px] font-bold text-zinc-200">
                  {channel.resolution || 'HD'}
                </span>
                {isLiveStream && (
                  <span className="px-2 py-0.5 rounded bg-[#E50914] text-white text-[10px] font-black tracking-wide">
                    LIVE
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-zinc-400">نبذة القصة</h3>
                <p className="text-sm sm:text-[15px] text-zinc-100 leading-relaxed font-normal">
                  {cleanSynopsis(channel)}
                </p>
              </div>

              {channel.servers && channel.servers.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 pt-1">
                  <Server className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
                  <span>
                    يتوفر {channel.servers.length} سيرفرات بث بديلة للتبديل الفوري داخل المشغل.
                  </span>
                </div>
              )}
            </div>

            {/* Left Column (~35%): Cast & Structured Metadata */}
            <div className="w-full md:w-[35%] space-y-2.5 text-xs sm:text-[13px] leading-relaxed">
              <div>
                <span className="text-zinc-400">طاقم التمثيل: </span>
                <span className="text-white font-medium">{castList.join('، ')}</span>
              </div>
              {channel.director && (
                <div>
                  <span className="text-zinc-400">الإخراج: </span>
                  <span className="text-white font-medium">{channel.director}</span>
                </div>
              )}
              <div>
                <span className="text-zinc-400">الباقة: </span>
                <span className="text-white font-medium">{channel.group}</span>
              </div>
              <div>
                <span className="text-zinc-400">التصنيف: </span>
                <span className="text-white font-medium">{getClassificationLabel(channel.group)}</span>
              </div>
              <div>
                <span className="text-zinc-400">الجودة: </span>
                <span className="text-white font-medium">{channel.resolution || 'HD'}</span>
              </div>
            </div>
          </div>

          {/* Explicit Episodes List if provided */}
          {channel.episodes && channel.episodes.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#E50914]" />
                  <span>الحلقات ({channel.episodes.length})</span>
                </h3>
              </div>
              <div className="divide-y divide-white/10 rounded-xl bg-[#141414] border border-white/10 overflow-hidden">
                {channel.episodes.map((ep) => (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onPlay({
                        ...channel,
                        name: `${channel.name} - ${ep.title}`,
                        url: ep.url
                      });
                    }}
                    className="w-full p-3.5 flex items-center gap-4 hover:bg-white/5 text-right transition-colors cursor-pointer"
                  >
                    <span className="text-lg font-mono font-black text-zinc-500 w-7 text-center shrink-0">
                      {ep.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate">{ep.title}</span>
                        {ep.duration && (
                          <span className="text-xs font-mono text-zinc-400 shrink-0">{ep.duration}</span>
                        )}
                      </div>
                      {ep.description && (
                        <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{ep.description}</p>
                      )}
                    </div>
                    <Play className="w-4 h-4 text-white shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Franchise / Collection Section ("باقة السلسلة") */}
          {franchiseItems.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#E50914]" />
                  <span>{franchiseLabel || 'باقة السلسلة والأجزاء المرتبطة'}</span>
                </h3>
                <span className="text-xs text-zinc-400">({franchiseItems.length} أجزاء)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
                {franchiseItems.map(renderRelatedCard)}
              </div>
            </div>
          )}

          {/* Related Works Section ("أعمال ذات صلة") */}
          {relatedItems.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-lg sm:text-xl font-bold text-white">أعمال ذات صلة</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
                {relatedItems.map(renderRelatedCard)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
