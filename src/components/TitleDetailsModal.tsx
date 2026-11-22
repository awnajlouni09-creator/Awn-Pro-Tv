import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Bookmark,
  Heart,
  Check,
  MoreHorizontal,
  Volume2,
  VolumeX,
  ImagePlus,
  Upload,
  RotateCcw,
  Link as LinkIcon,
  Server,
  Layers,
  Star,
  ThumbsUp,
  MessageSquare,
  Share2,
  Send,
  PenLine,
  Plus
} from 'lucide-react';
import { Channel, CastMember, TitleReview } from '../types/iptv';
import { ChannelThumbnail } from './ChannelThumbnail';
import {
  getChannelMaturityRating,
  getChannelYear,
  getFranchiseAndRelatedChannels,
  getMaturityBadgeLabel
} from '../utils/mediaMetadata';
import {
  LIKED_TITLES_STORAGE_KEY,
  WATCHED_TITLES_STORAGE_KEY,
  getVisitorReviewsForChannel,
  addVisitorReviewForChannel,
  readReviewLikesState,
  toggleReviewLikeState,
  addReplyToVisitorReview,
  readIdList,
  toggleIdInList,
  compressImageFileToDataUrl
} from '../utils/titleReviewsStorage';

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
  activeProfileName?: string;
  activeProfileAvatar?: string;
  onUpdateChannelReviews?: (channelId: string, reviews: TitleReview[]) => void;
}

const DEFAULT_PRIMARY_COLOR = '#59121a';
const DEFAULT_SECONDARY_COLOR = '#2a1c16';

const sanitizeHexColor = (val?: string, fallback = DEFAULT_PRIMARY_COLOR): string => {
  if (!val) return fallback;
  const trimmed = val.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
  return fallback;
};

const hexToRgba = (hex: string, alpha: number): string => {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return `rgba(89, 18, 26, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const ActorAvatar: React.FC<{ member: CastMember }> = ({ member }) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [member.imageUrl]);

  if (member.imageUrl && !imgFailed) {
    return (
      <img
        src={member.imageUrl}
        alt={member.name}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/15 to-black/50 text-white/90 font-black text-lg sm:text-xl">
      {getInitials(member.name)}
    </div>
  );
};

const ReviewerAvatar: React.FC<{ name: string; avatar?: string }> = ({ name, avatar }) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [avatar]);

  if (avatar && !imgFailed) {
    return (
      <img
        src={avatar}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/20 to-white/5 text-white font-bold text-xs">
      {getInitials(name)}
    </div>
  );
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
  onToggleMute,
  activeProfileName,
  activeProfileAvatar,
  onUpdateChannelReviews
}) => {
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localMuted, setLocalMuted] = useState(isMuted);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const [likedIds, setLikedIds] = useState<string[]>(() => readIdList(LIKED_TITLES_STORAGE_KEY));
  const [watchedIds, setWatchedIds] = useState<string[]>(() => readIdList(WATCHED_TITLES_STORAGE_KEY));

  // Reviews interactive state
  const [visitorReviews, setVisitorReviews] = useState<TitleReview[]>([]);
  const [reviewLikes, setReviewLikes] = useState<Record<string, boolean>>(() =>
    readReviewLikesState()
  );
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [draftRating, setDraftRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [draftAuthorName, setDraftAuthorName] = useState('');
  const [draftComment, setDraftComment] = useState('');
  const [openReplyReviewId, setOpenReplyReviewId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const reviewsSectionRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    if (!isOpen || !channel) return;
    setIsEditingCover(false);
    setIsMoreMenuOpen(false);
    setShareCopied(false);
    setPreviewUrl(null);
    setInputUrl('');
    setIsReviewFormOpen(false);
    setDraftRating(5);
    setHoverRating(0);
    setDraftAuthorName(activeProfileName || '');
    setDraftComment('');
    setOpenReplyReviewId(null);
    setReplyDraft('');
    setVisitorReviews(getVisitorReviewsForChannel(channel.id));
    setReviewLikes(readReviewLikesState());
    modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [channel?.id, isOpen, activeProfileName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMoreMenuOpen) {
          setIsMoreMenuOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isMoreMenuOpen]);

  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreMenuOpen]);

  const { franchiseLabel, franchiseItems, relatedItems } = useMemo(() => {
    if (!channel) return { franchiseLabel: null, franchiseItems: [], relatedItems: [] };
    return getFranchiseAndRelatedChannels(channel, allChannels);
  }, [allChannels, channel]);

  const mergedReviews = useMemo<TitleReview[]>(() => {
    if (!channel) return [];
    const adminList = Array.isArray(channel.reviews) ? channel.reviews : [];
    const seen = new Set<string>();
    const combined: TitleReview[] = [];
    for (const r of [...visitorReviews, ...adminList]) {
      if (!r || !r.id || seen.has(r.id)) continue;
      seen.add(r.id);
      combined.push(r);
    }
    return combined;
  }, [channel, visitorReviews]);

  const averageUserRating = useMemo(() => {
    if (mergedReviews.length === 0) return null;
    const sum = mergedReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return sum / mergedReviews.length;
  }, [mergedReviews]);

  if (!isOpen || !channel) return null;

  const primaryColor = sanitizeHexColor(channel.primaryColor, DEFAULT_PRIMARY_COLOR);
  const secondaryColor = sanitizeHexColor(channel.secondaryColor, DEFAULT_SECONDARY_COLOR);

  const isLiked = likedIds.includes(channel.id);
  const isWatched = watchedIds.includes(channel.id);
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

  // Hide empty fields rule: only show fields that explicitly have data on the channel
  const explicitYear = channel.year?.trim() || '';
  const explicitDuration = channel.durationLabel?.trim() || '';
  const explicitMaturity = channel.maturityRating
    ? channel.maturityRating === 'عائلي'
      ? 'عائلي'
      : getMaturityBadgeLabel(channel.maturityRating)
    : '';
  const explicitGenres = Array.isArray(channel.genres)
    ? channel.genres.map((g) => g.trim()).filter(Boolean)
    : [];
  const explicitImdb = channel.imdbRating?.trim() || '';
  const explicitSynopsis =
    channel.description &&
    channel.description.trim().length > 0 &&
    !/\.(mp4|mkv|webm|avi|m3u8)$/i.test(channel.description.trim())
      ? channel.description.trim()
      : '';

  const metadataItems: string[] = [];
  if (explicitYear) metadataItems.push(explicitYear);
  if (explicitDuration) metadataItems.push(explicitDuration);
  if (explicitMaturity) metadataItems.push(explicitMaturity);
  if (explicitGenres.length > 0) metadataItems.push(explicitGenres.join('، '));
  if (channel.resolution) metadataItems.push(channel.resolution);

  // Cast & Crew: only show when explicitly populated (no fabricated defaults)
  const resolvedCastMembers: CastMember[] =
    channel.castMembers && channel.castMembers.length > 0
      ? channel.castMembers.filter((m) => m && m.name?.trim())
      : channel.cast && channel.cast.length > 0
      ? channel.cast
          .map((name, idx) => ({ id: `cast-legacy-${idx}`, name: name.trim() }))
          .filter((m) => m.name.length > 0)
      : [];

  const handleToggleLike = () => {
    setLikedIds(toggleIdInList(LIKED_TITLES_STORAGE_KEY, channel.id));
  };

  const handleToggleWatched = () => {
    setWatchedIds(toggleIdInList(WATCHED_TITLES_STORAGE_KEY, channel.id));
  };

  const handleMuteClick = () => {
    if (onToggleMute) {
      onToggleMute();
    } else {
      setLocalMuted((m) => !m);
    }
  };

  const handleShareTitle = async () => {
    const shareText = `${channel.name}${explicitYear ? ` (${explicitYear})` : ''} — Awn Tv pro`;
    try {
      if (navigator.share) {
        await navigator.share({ title: channel.name, text: shareText, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      }
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2200);
    } catch {
      // ignore user-cancelled share
    }
    setIsMoreMenuOpen(false);
  };

  const handleOpenRateReview = () => {
    setIsReviewFormOpen(true);
    setTimeout(() => {
      reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedComment = draftComment.trim();
    if (!cleanedComment) return;

    const newReview: TitleReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorName: draftAuthorName.trim() || activeProfileName || 'مشاهد Awn Tv',
      authorAvatar: activeProfileAvatar || undefined,
      date: new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      rating: Math.min(5, Math.max(1, draftRating)),
      comment: cleanedComment,
      likesCount: 0,
      repliesCount: 0,
      replies: [],
      source: 'visitor'
    };

    const nextVisitorList = addVisitorReviewForChannel(channel.id, newReview);
    setVisitorReviews(nextVisitorList);
    setDraftComment('');
    setDraftRating(5);
    setIsReviewFormOpen(false);
  };

  const handleToggleReviewLike = (reviewId: string) => {
    setReviewLikes(toggleReviewLikeState(reviewId));
  };

  const handleSubmitReply = (e: React.FormEvent, review: TitleReview) => {
    e.preventDefault();
    const txt = replyDraft.trim();
    if (!txt) return;
    const reply = {
      id: `rep-${Date.now()}`,
      authorName: activeProfileName || 'مشاهد',
      date: new Date().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
      text: txt
    };

    if (review.source === 'visitor' || visitorReviews.some((r) => r.id === review.id)) {
      const updatedVisitor = addReplyToVisitorReview(channel.id, review.id, reply);
      setVisitorReviews(updatedVisitor);
    } else if (onUpdateChannelReviews) {
      const updatedAdmin = (channel.reviews || []).map((r) => {
        if (r.id !== review.id) return r;
        const replies = [...(r.replies || []), reply];
        return { ...r, replies, repliesCount: replies.length };
      });
      onUpdateChannelReviews(channel.id, updatedAdmin);
    }

    setReplyDraft('');
  };

  const handleOpenCoverEditor = () => {
    setIsEditingCover((prev) => !prev);
    setInputUrl(customCover || '');
    setPreviewUrl(customCover || null);
    setSaveSuccess(false);
    setIsMoreMenuOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file, 960, 0.82);
      setPreviewUrl(compressed);
      setInputUrl('');
    } catch {
      // ignore error
    }
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
    const itemYear = item.year?.trim() || getChannelYear(item);
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
        className="bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl overflow-hidden cursor-pointer group/card transition-all flex flex-col shadow-lg"
      >
        <div className="relative h-32 sm:h-36 w-full bg-black overflow-hidden">
          <ChannelThumbnail
            channel={item}
            customCover={customCovers[item.id]}
            isBanner={false}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 opacity-80 group-hover/card:opacity-100 transition-opacity" />

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
            <div className="w-11 h-11 rounded-full bg-black/75 border border-white/80 flex items-center justify-center shadow-xl">
              <Play className="w-5 h-5 text-white fill-current ml-0.5" />
            </div>
          </div>

          <span className="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-zinc-200 border border-white/15">
            {item.resolution || 'HD'}
          </span>
        </div>

        <div className="p-3.5 flex-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-zinc-300">
              <span className="px-1.5 py-0.5 border border-white/25 rounded text-[10px] font-bold text-zinc-200 shrink-0">
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
                  : 'border-white/35 hover:border-white text-zinc-200 hover:text-white'
              }`}
            >
              {itemFav ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
          {item.description?.trim() && (
            <p className="text-xs text-white/65 leading-relaxed line-clamp-2">{item.description}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={onClose}
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center p-0 sm:p-4 md:p-6 overflow-y-auto select-none"
    >
      <div
        ref={modalScrollRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(148deg, ${primaryColor} 0%, ${secondaryColor} 56%, #110c0e 100%)`
        }}
        className="w-full max-w-[1060px] min-h-screen sm:min-h-0 sm:max-h-[94vh] sm:rounded-2xl overflow-y-auto shadow-[0_30px_90px_rgba(0,0,0,0.95)] border-0 sm:border border-white/15 relative text-white sm:my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* TOP ATMOSPHERIC TWO-TONE + WIDE BACKDROP HEADER */}
        <div className="relative overflow-hidden">
          {/* Wide Backdrop positioned on the upper-left corner (in RTL) with silky gradient fade */}
          <div className="absolute top-0 left-0 w-full md:w-[74%] h-[360px] sm:h-[440px] md:h-[500px] pointer-events-none overflow-hidden">
            <ChannelThumbnail
              channel={channel}
              customCover={previewUrl || customCover}
              isBanner={true}
              className="w-full h-full object-cover opacity-85"
            />
            {/* Smooth horizontal blend from right (primaryColor) into the wide image */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to left, ${primaryColor} 0%, ${hexToRgba(
                  primaryColor,
                  0.92
                )} 18%, ${hexToRgba(primaryColor, 0.55)} 48%, ${hexToRgba(
                  primaryColor,
                  0.12
                )} 85%, transparent 100%)`
              }}
            />
            {/* Smooth vertical blend downward into primaryColor/secondaryColor */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${secondaryColor} 0%, ${hexToRgba(
                  primaryColor,
                  0.78
                )} 28%, ${hexToRgba(primaryColor, 0.2)} 65%, rgba(0,0,0,0.35) 100%)`
              }}
            />
          </div>

          {/* Floating Top Controls (Close X + Quick Audio Mute) */}
          <div className="relative z-20 flex items-center justify-between px-5 sm:px-8 md:px-10 pt-4 sm:pt-6">
            <div className="flex items-center gap-2">
              {isLiveStream && (
                <span className="px-2.5 py-1 rounded-md bg-[#E50914] text-white text-[11px] font-black tracking-wide shadow">
                  مباشر LIVE
                </span>
              )}
              {channel.badge && !isLiveStream && (
                <span className="px-2.5 py-1 rounded-md bg-black/45 backdrop-blur-md border border-white/15 text-white/90 text-[11px] font-bold">
                  {channel.badge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMuteClick}
                aria-label={effectiveMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                title={effectiveMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                className="w-10 h-10 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md text-white/85 hover:text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                {effectiveMuted ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق النافذة"
                className="w-10 h-10 rounded-full bg-black/55 hover:bg-black/85 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-lg active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* HERO INFO BLOCK (Right-Aligned in RTL over soft gradient) */}
          <div className="relative z-10 px-5 sm:px-8 md:px-10 pt-24 sm:pt-32 md:pt-36 pb-6 max-w-3xl text-right space-y-4">
            {/* Large Bold Work Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-[1.15] tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.65)]">
              {channel.name}
            </h1>

            {/* Metadata Line (Year · Duration · Age Rating · Genres · Quality) - Only non-empty fields */}
            {(metadataItems.length > 0 || channel.director?.trim()) && (
              <div className="flex items-center gap-2.5 flex-wrap text-xs sm:text-sm text-white/85 font-medium">
                {metadataItems.map((item, idx) => (
                  <React.Fragment key={`${item}-${idx}`}>
                    {idx > 0 && (
                      <span aria-hidden="true" className="text-white/40">
                        ·
                      </span>
                    )}
                    <span className={/^\d{4}$/.test(item) ? 'font-mono tabular-nums font-bold' : ''}>
                      {item}
                    </span>
                  </React.Fragment>
                ))}
                {channel.director?.trim() && (
                  <>
                    {metadataItems.length > 0 && (
                      <span aria-hidden="true" className="text-white/40">
                        ·
                      </span>
                    )}
                    <span className="text-white/75">إخراج: {channel.director.trim()}</span>
                  </>
                )}
              </div>
            )}

            {/* Rating Badges + Quick "اكتب تقييماً" Button */}
            <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
              {explicitImdb && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/15 text-xs font-extrabold text-amber-300 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-mono tabular-nums">{explicitImdb}</span>
                </div>
              )}

              {averageUserRating !== null && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/15 text-xs font-bold text-white shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-mono tabular-nums">{averageUserRating.toFixed(1)}</span>
                  <span className="text-white/60 text-[11px] font-mono tabular-nums">
                    ({mergedReviews.length})
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleOpenRateReview}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold text-white transition-all cursor-pointer active:scale-95"
              >
                <PenLine className="w-3.5 h-3.5 text-amber-300" />
                <span>اكتب تقييماً</span>
              </button>
            </div>

            {/* Resume Watching Thin Progress Indicator (when applicable) */}
            {hasResume && resumeProgress > 0 && (
              <div className="max-w-xs space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] text-white/75 font-semibold">
                  <span>استئناف المشاهدة</span>
                  <span className="font-mono tabular-nums">{resumeProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${resumeProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Story Synopsis (Hidden completely if empty) */}
            {explicitSynopsis && (
              <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed max-w-2xl font-normal">
                {explicitSynopsis}
              </p>
            )}

            {/* Circular Action Buttons Row: Play · Bookmark · Like · Watched · More (...) */}
            <div className="flex items-center gap-3 sm:gap-3.5 flex-wrap pt-2">
              {/* 1. Circular Play Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPlay(channel, hasResume ? resumeTime : undefined);
                }}
                title={hasResume ? 'استئناف المشاهدة' : 'تشغيل'}
                aria-label={hasResume ? 'استئناف المشاهدة' : 'تشغيل'}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white hover:bg-white/90 text-black flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </button>

              {/* 2. Circular Bookmark / Save Button */}
              <button
                type="button"
                onClick={() => onToggleFavorite(channel.id)}
                title={isFavorite ? 'محفوظ في قائمتي (إزالة)' : 'حفظ في قائمتي'}
                aria-label={isFavorite ? 'إزالة من قائمتي' : 'حفظ في قائمتي'}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 backdrop-blur-md ${
                  isFavorite
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-black/35 hover:bg-white/15 text-white border-white/25 hover:border-white/60'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              {/* 3. Circular Like / Heart Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                title={isLiked ? 'أعجبني (إلغاء)' : 'إعجاب'}
                aria-label="إعجاب"
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 backdrop-blur-md ${
                  isLiked
                    ? 'bg-rose-500/90 text-white border-rose-400 shadow-lg shadow-rose-500/30'
                    : 'bg-black/35 hover:bg-white/15 text-white border-white/25 hover:border-white/60'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>

              {/* 4. Circular Watched Checkmark Button */}
              <button
                type="button"
                onClick={handleToggleWatched}
                title={isWatched ? 'تمت المشاهدة ✓' : 'تحديد كـ تمت المشاهدة'}
                aria-label={isWatched ? 'تمت المشاهدة' : 'تحديد كتمت المشاهدة'}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 backdrop-blur-md ${
                  isWatched
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/30'
                    : 'bg-black/35 hover:bg-white/15 text-white border-white/25 hover:border-white/60'
                }`}
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* 5. Circular More Options (...) Button */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                  title="خيارات إضافية"
                  aria-label="خيارات إضافية"
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 backdrop-blur-md ${
                    isMoreMenuOpen
                      ? 'bg-white/25 border-white text-white'
                      : 'bg-black/35 hover:bg-white/15 text-white border-white/25 hover:border-white/60'
                  }`}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#161314]/95 backdrop-blur-xl border border-white/15 rounded-xl p-1.5 shadow-2xl z-40 text-right space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={handleShareTitle}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-sky-400" />
                      <span>{shareCopied ? 'تم نسخ الرابط ✓' : 'مشاركة العمل'}</span>
                    </button>

                    {hasResume && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          onClose();
                          onPlay(channel, 0);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-amber-400" />
                        <span>تشغيل من البداية</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleOpenCoverEditor}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      <ImagePlus className="w-4 h-4 text-rose-400" />
                      <span>تغيير صورة الغلاف</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleMuteClick();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      {effectiveMuted ? (
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-zinc-400" />
                      )}
                      <span>{effectiveMuted ? 'تشغيل الصوت' : 'كتم الصوت'}</span>
                    </button>
                  </div>
                )}
              </div>

              {shareCopied && (
                <span className="text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full animate-in fade-in">
                  تم نسخ معلومات العمل للمشاركة ✓
                </span>
              )}
            </div>

            {channel.servers && channel.servers.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-white/65 pt-1">
                <Server className="w-3.5 h-3.5 text-white/80 shrink-0" />
                <span>
                  يتوفر {channel.servers.length} سيرفرات بث بديلة للتبديل الفوري داخل المشغل
                </span>
              </div>
            )}
          </div>
        </div>

        {/* MAIN LOWER SECTIONS */}
        <div className="px-5 sm:px-8 md:px-10 pb-10 pt-2 space-y-9 text-right">
          {/* Optional Inline Cover Editor */}
          {isEditingCover && (
            <div className="p-4 bg-black/50 backdrop-blur-md rounded-2xl border border-white/15 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <ImagePlus className="w-4 h-4 text-white" />
                  <span>تخصيص صورة الغلاف / الخلفية:</span>
                </span>
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>تم الحفظ بنجاح</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-xl px-3 py-2">
                <LinkIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="url"
                  placeholder="ألصق رابط الصورة المباشر (https://...)"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    setPreviewUrl(e.target.value);
                  }}
                  className="w-full bg-transparent text-white text-xs sm:text-sm focus:outline-none placeholder:text-zinc-500 font-mono text-left dir-ltr"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/15 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع صورة من الجهاز</span>
                </button>

                {customCover && (
                  <button
                    type="button"
                    onClick={handleResetCover}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/50 hover:bg-red-900/70 text-red-200 text-xs font-semibold rounded-lg border border-red-700/40 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الغلاف التلقائي</span>
                  </button>
                )}

                <div className="mr-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingCover(false)}
                    className="px-3 py-1.5 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCover}
                    className="flex items-center gap-1 px-4 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>حفظ الغلاف</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. CAST & CREW SECTION (Hidden completely if empty) */}
          {resolvedCastMembers.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  طاقم التمثيل
                </h2>
              </div>

              <div className="flex items-start gap-5 sm:gap-7 overflow-x-auto pb-2 no-scrollbar">
                {resolvedCastMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col items-center text-center shrink-0 w-24 sm:w-28 group"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-white/60 bg-black/40 shadow-xl transition-transform duration-200 group-hover:scale-105">
                      <ActorAvatar member={member} />
                    </div>
                    <p className="mt-2.5 text-xs sm:text-sm font-bold text-white line-clamp-1 w-full">
                      {member.name}
                    </p>
                    {member.character?.trim() && (
                      <p className="mt-0.5 text-[11px] text-white/60 line-clamp-1 w-full">
                        {member.character.trim()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. INTERACTIVE RATINGS & REVIEWS SECTION (Hidden if 0 reviews AND composer closed) */}
          {(mergedReviews.length > 0 || isReviewFormOpen) && (
            <section ref={reviewsSectionRef} className="space-y-4 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    التقييمات والآراء
                  </h2>
                  {mergedReviews.length > 0 && (
                    <span className="text-xs font-mono tabular-nums text-white/65">
                      ({mergedReviews.length})
                    </span>
                  )}
                </div>

                {!isReviewFormOpen && (
                  <button
                    type="button"
                    onClick={() => setIsReviewFormOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    <PenLine className="w-3.5 h-3.5 text-amber-300" />
                    <span>إضافة رأي وتقييم</span>
                  </button>
                )}
              </div>

              {/* Interactive User Review Form */}
              {isReviewFormOpen && (
                <form
                  onSubmit={handleSubmitReview}
                  className="p-4 sm:p-5 rounded-2xl bg-black/45 backdrop-blur-md border border-white/15 space-y-4 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      شاركنا تقييمك ورأيك حول "{channel.name}"
                    </span>

                    {/* 1-5 Star Selector */}
                    <div className="flex items-center gap-1" dir="ltr">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const active = (hoverRating || draftRating) >= starVal;
                        return (
                          <button
                            key={starVal}
                            type="button"
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setDraftRating(starVal)}
                            aria-label={`${starVal} نجوم`}
                            className="p-1 cursor-pointer transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-5 h-5 transition-colors ${
                                active
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-white/30 hover:text-white/60'
                              }`}
                            />
                          </button>
                        );
                      })}
                      <span className="ml-2 text-xs font-mono font-bold text-amber-300 tabular-nums">
                        {draftRating}/5
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-white/70 mb-1">
                        الاسم (اختياري)
                      </label>
                      <input
                        type="text"
                        value={draftAuthorName}
                        onChange={(e) => setDraftAuthorName(e.target.value)}
                        placeholder={activeProfileName || 'اسمك...'}
                        className="w-full h-10 bg-black/50 text-white text-xs px-3 rounded-xl border border-white/15 focus:border-white/50 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-white/70 mb-1">
                        رأيك في العمل *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={draftComment}
                        onChange={(e) => setDraftComment(e.target.value)}
                        placeholder="اكتب انطباعك عن القصة، التمثيل، والإخراج..."
                        className="w-full bg-black/50 text-white text-xs p-3 rounded-xl border border-white/15 focus:border-white/50 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white/80 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={!draftComment.trim()}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-white hover:bg-white/90 disabled:opacity-50 text-black text-xs font-black cursor-pointer shadow-lg"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>نشر التقييم</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Horizontal Dark Review Cards */}
              {mergedReviews.length > 0 && (
                <div className="flex items-stretch gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {mergedReviews.map((review) => {
                    const isReviewLiked = Boolean(reviewLikes[review.id]);
                    const displayedLikes = (review.likesCount || 0) + (isReviewLiked ? 1 : 0);
                    const repliesList = review.replies || [];
                    const displayedReplies =
                      repliesList.length > 0 ? repliesList.length : review.repliesCount || 0;
                    const isReplyOpen = openReplyReviewId === review.id;

                    return (
                      <div
                        key={review.id}
                        className="w-[295px] sm:w-[335px] shrink-0 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 p-4 flex flex-col justify-between gap-3 shadow-xl"
                      >
                        <div className="space-y-3">
                          {/* Reviewer Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-black/50 shrink-0">
                                <ReviewerAvatar
                                  name={review.authorName}
                                  avatar={review.authorAvatar}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-white truncate">
                                  {review.authorName}
                                </p>
                                <p className="text-[11px] text-white/50 truncate">{review.date}</p>
                              </div>
                            </div>

                            {/* 1-5 Stars */}
                            <div className="flex items-center gap-0.5 shrink-0" dir="ltr">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    s <= Math.round(review.rating)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-white/20'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Review Body */}
                          <p className="text-xs sm:text-[13px] text-white/85 leading-relaxed line-clamp-4">
                            {review.comment}
                          </p>

                          {/* Inline Replies Drawer when toggled */}
                          {isReplyOpen && (
                            <div className="pt-2 border-t border-white/10 space-y-2">
                              {repliesList.length > 0 && (
                                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                                  {repliesList.map((rep) => (
                                    <div
                                      key={rep.id}
                                      className="p-2 rounded-lg bg-white/5 text-[11px] space-y-0.5"
                                    >
                                      <div className="flex items-center justify-between text-white/70 font-bold">
                                        <span>{rep.authorName}</span>
                                        <span className="text-[10px] text-white/40">{rep.date}</span>
                                      </div>
                                      <p className="text-white/85">{rep.text}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <form
                                onSubmit={(e) => handleSubmitReply(e, review)}
                                className="flex items-center gap-1.5"
                              >
                                <input
                                  type="text"
                                  value={replyDraft}
                                  onChange={(e) => setReplyDraft(e.target.value)}
                                  placeholder="اكتب رداً..."
                                  className="flex-1 h-8 bg-black/50 text-white text-[11px] px-2.5 rounded-lg border border-white/15 focus:border-white/50 focus:outline-none"
                                />
                                <button
                                  type="submit"
                                  className="h-8 px-2.5 rounded-lg bg-white text-black text-[11px] font-bold cursor-pointer shrink-0"
                                >
                                  رد
                                </button>
                              </form>
                            </div>
                          )}
                        </div>

                        {/* Card Interaction Footer: Like + Counter & Replies */}
                        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/65">
                          <button
                            type="button"
                            onClick={() => handleToggleReviewLike(review.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              isReviewLiked
                                ? 'bg-white/15 text-amber-300 font-bold'
                                : 'hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <ThumbsUp
                              className={`w-3.5 h-3.5 ${isReviewLiked ? 'fill-current' : ''}`}
                            />
                            <span className="font-mono tabular-nums">{displayedLikes}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenReplyReviewId(isReplyOpen ? null : review.id);
                              setReplyDraft('');
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              isReplyOpen
                                ? 'bg-white/15 text-white font-bold'
                                : 'hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="font-mono tabular-nums">{displayedReplies}</span>
                            <span>ردود</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Explicit Episodes List if provided */}
          {channel.episodes && channel.episodes.length > 0 && (
            <section className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-white/80" />
                  <span>الحلقات ({channel.episodes.length})</span>
                </h3>
              </div>
              <div className="divide-y divide-white/10 rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
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
                    <span className="text-lg font-mono font-black text-white/45 w-7 text-center shrink-0">
                      {ep.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate">{ep.title}</span>
                        {ep.duration && (
                          <span className="text-xs font-mono text-white/60 shrink-0">
                            {ep.duration}
                          </span>
                        )}
                      </div>
                      {ep.description && (
                        <p className="text-xs text-white/60 line-clamp-1 mt-0.5">{ep.description}</p>
                      )}
                    </div>
                    <Play className="w-4 h-4 text-white shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Franchise / Collection Section ("باقة السلسلة") */}
          {franchiseItems.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-white/80" />
                  <span>{franchiseLabel || 'باقة السلسلة والأجزاء المرتبطة'}</span>
                </h3>
                <span className="text-xs text-white/60">({franchiseItems.length} أجزاء)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
                {franchiseItems.map(renderRelatedCard)}
              </div>
            </section>
          )}

          {/* Related Works Section ("أعمال ذات صلة") */}
          {relatedItems.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-lg sm:text-xl font-bold text-white">أعمال ذات صلة</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
                {relatedItems.map(renderRelatedCard)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
