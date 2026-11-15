import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Channel } from './types/iptv';
import { UserProfile } from './types/profile';
import { MatchItem, MatchThemeId } from './types/matches';
import { ContinueWatchingItem } from './types/history';
import { AppNotification, BreakingTickerConfig, NotificationType } from './types/notifications';
import {
  SubscriptionConfig,
  ActiveSubscription,
  DEFAULT_SUBSCRIPTION_CONFIG
} from './types/subscription';
import { DEFAULT_CHANNELS } from './data/defaultChannels';
import {
  DEFAULT_PROFILES,
  DEFAULT_KIDS_EXIT_PIN,
  DEFAULT_KIDS_AVATAR_URL,
  AVAILABLE_AVATARS
} from './data/defaultProfiles';
import { DEFAULT_MATCHES } from './data/defaultMatches';
import { parseM3U } from './utils/m3uParser';
import { detectMediaType, extractYouTubeVideoId, extractYouTubeEmbedUrl } from './utils/mediaHelper';
import {
  HydratedLocalMedia,
  saveLocalMedia,
  updateLocalMediaRecord,
  deleteLocalMedia,
  hydrateAllLocalMedia,
  formatFileSize
} from './utils/localMediaDb';
import {
  playNotificationChime,
  requestBrowserNotificationPermission,
  triggerBrowserNotification
} from './utils/notificationSound';
import { NetflixNavbar, NavTab } from './components/NetflixNavbar';
import { NetflixHeroBanner } from './components/NetflixHeroBanner';
import { NetflixRow } from './components/NetflixRow';
import { Top10Row } from './components/Top10Row';
import { ContinueWatchingRow } from './components/ContinueWatchingRow';
import { CinemaPlayerModal } from './components/CinemaPlayerModal';
import { TitleDetailsModal } from './components/TitleDetailsModal';
import { IntroAnimation } from './components/IntroAnimation';
import { SubscriptionGate } from './components/SubscriptionGate';
import { ProfileSelection } from './components/ProfileSelection';
import { PinPromptModal } from './components/PinPromptModal';
import { RemoteControlModal } from './components/RemoteControlModal';
import { UrlImportModal } from './components/UrlImportModal';
import { PythonWindowsExportModal } from './components/PythonWindowsExportModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ChannelThumbnail } from './components/ChannelThumbnail';
import { AdminPanelModal, AdminBackupPayload } from './components/AdminPanelModal';
import { MatchesCenter } from './components/MatchesCenter';
import { GamesZone } from './components/GamesZone';
import { NotificationToast } from './components/NotificationToast';
import { BreakingNewsTicker } from './components/BreakingNewsTicker';
import { OfflineIndicator } from './components/PWAInstallButton';
import { 
  Newspaper, 
  Clapperboard, 
  Film, 
  Smile, 
  Compass, 
  BookOpen, 
  Trophy, 
  MonitorPlay,
  Search,
  Star,
  Sparkles,
  Music
} from 'lucide-react';

const PROFILES_STORAGE_KEY = 'awn_tv_profiles_v3';
const FAVORITES_STORAGE_KEY = 'awn_tv_favorites';
const CUSTOM_COVERS_KEY = 'awn_tv_custom_covers';
const CHANNELS_STORAGE_KEY = 'awn_tv_channels_v1';
const CATALOG_ENRICHED_KEY = 'awn_tv_catalog_enriched_v2';
const CATEGORIES_STORAGE_KEY = 'awn_tv_categories_v1';
const HERO_IDS_STORAGE_KEY = 'awn_tv_hero_ids_v1';
const ADMIN_PIN_STORAGE_KEY = 'awn_tv_admin_pin_v1';
const MATCHES_STORAGE_KEY = 'awn_tv_matches_v1';
const NOTIFICATIONS_STORAGE_KEY = 'awn_tv_notifications_v1';
const MATCH_REMINDERS_STORAGE_KEY = 'awn_tv_match_reminders_v1';
const TICKER_STORAGE_KEY = 'awn_tv_ticker_v1';
const SUBSCRIPTION_CONFIG_STORAGE_KEY = 'awn_tv_sub_config_v1';
const ACTIVE_SUBSCRIPTION_STORAGE_KEY = 'awn_tv_sub_status_v1';
const getContinueWatchingKey = (profileId: string) => `awn_tv_continue_watching_v1_${profileId}`;

const DEFAULT_TICKER: BreakingTickerConfig = {
  enabled: false,
  text: 'أهلاً بكم في Awn Tv pro — استمتعوا بالبث المباشر، مركز المباريات، مشغل الأغاني، وصالة الألعاب!',
  style: 'urgent'
};

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-welcome',
    title: 'مرحباً بك في Awn Tv pro',
    message: 'تمت إضافة قسم الألعاب المصغرة، الريموت الذكي، وميزة أكمل المشاهدة لكل حساب.',
    type: 'general',
    createdAt: Date.now(),
    read: false
  }
];

const DEFAULT_CATEGORIES = [
  'قنوات إخبارية',
  'أفلام أجنبية',
  'مسلسلات عربية',
  'ملخصات انمي',
  'أغاني وموسيقى',
  'قصص وروايات',
  'أطفال وكرتون',
  'وثائقيات أبو الصادق',
  'وثائقي وطبيعة',
  'إسلاميات ودين',
  'رياضة وسرعة',
  'منصات ذكية'
];

const DEFAULT_HERO_IDS = [
  'ch-news-aljazeera',
  'ch-series-bomb-14',
  'ch-movie-tears',
  'ch-doc-natgeo',
  'ch-islam-quran'
];

export default function App() {
  // 1. Intro Animation State
  const [showIntro, setShowIntro] = useState<boolean>(true);

  // 2. Profiles System State
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: UserProfile) =>
            p.id === 'profile-kids' && p.avatar === AVAILABLE_AVATARS[14]?.url
              ? { ...p, avatar: DEFAULT_KIDS_AVATAR_URL }
              : p
          );
        }
      }
    } catch (e) {}
    return DEFAULT_PROFILES;
  });

  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);

  // 3. Channels & Categories State (Persisted in LocalStorage)
  const [allChannels, setAllChannels] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem(CHANNELS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (localStorage.getItem(CATALOG_ENRICHED_KEY) !== '1') {
            const defaultsMap = new Map(DEFAULT_CHANNELS.map((c) => [c.id, c]));
            const enriched = parsed.map((ch: Channel) => {
              const def = defaultsMap.get(ch.id);
              if (!def) return ch;
              return {
                ...ch,
                name: def.name,
                description: def.description,
                badge: def.badge || ch.badge
              };
            });
            try {
              localStorage.setItem(CATALOG_ENRICHED_KEY, '1');
            } catch (e) {}
            return enriched;
          }
          return parsed;
        }
      }
      localStorage.setItem(CATALOG_ENRICHED_KEY, '1');
    } catch (e) {}
    return DEFAULT_CHANNELS;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CATEGORIES;
  });

  const [heroChannelIds, setHeroChannelIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(HERO_IDS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return DEFAULT_HERO_IDS;
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_PIN_STORAGE_KEY);
      if (saved && /^\d{4}$/.test(saved)) return saved;
    } catch (e) {}
    return '6767';
  });

  const [matches, setMatches] = useState<MatchItem[]>(() => {
    try {
      const saved = localStorage.getItem(MATCHES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_MATCHES;
  });

  const [matchTheme, setMatchTheme] = useState<MatchThemeId>('default');

  // Notifications, Reminders & Breaking News Ticker State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return DEFAULT_NOTIFICATIONS;
  });

  const [remindedMatchIds, setRemindedMatchIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(MATCH_REMINDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [tickerConfig, setTickerConfig] = useState<BreakingTickerConfig>(() => {
    try {
      const saved = localStorage.getItem(TICKER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_TICKER;
  });

  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const firedMatchAlertsRef = useRef<Set<string>>(new Set());

  // Continue Watching (Per Active Profile)
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [initialSeekTime, setInitialSeekTime] = useState<number | undefined>(undefined);

  // Player & Remote Sync State
  const [playingChannel, setPlayingChannel] = useState<Channel | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [isPlayerPlaying, setIsPlayerPlaying] = useState(true);
  const [playerVolume, setPlayerVolume] = useState(85);
  const [playerMuted, setPlayerMuted] = useState(false);
  const [remotePlaySignal, setRemotePlaySignal] = useState(0);
  const [remoteFullscreenSignal, setRemoteFullscreenSignal] = useState(0);
  const [focusedChannelIndex, setFocusedChannelIndex] = useState<number | null>(null);
  const [detailsChannel, setDetailsChannel] = useState<Channel | null>(null);

  // Navigation, Search & Favorites State
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  // 4. Custom Cover Images (Saved in LocalStorage) & Local IndexedDB Media
  const [customCovers, setCustomCovers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_COVERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });
  const [localMediaMap, setLocalMediaMap] = useState<Record<string, HydratedLocalMedia>>({});

  // Auxiliary & Admin Modals
  const [isRemoteModalOpen, setIsRemoteModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Subscription Gate & PayPal ($2/month) / Gift Code (911) State
  const [subscriptionConfig, setSubscriptionConfig] = useState<SubscriptionConfig>(() => {
    try {
      const saved = localStorage.getItem(SUBSCRIPTION_CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.paypalEmail === 'string' && Array.isArray(parsed.giftCodes)) {
          return {
            enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
            monthlyPriceUsd: Number(parsed.monthlyPriceUsd) > 0 ? Number(parsed.monthlyPriceUsd) : 2,
            paypalEmail: parsed.paypalEmail || DEFAULT_SUBSCRIPTION_CONFIG.paypalEmail,
            giftCodes: parsed.giftCodes.length > 0 ? parsed.giftCodes : ['911']
          };
        }
      }
    } catch (e) {}
    return DEFAULT_SUBSCRIPTION_CONFIG;
  });

  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_SUBSCRIPTION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ActiveSubscription;
        if (parsed && typeof parsed.isActive === 'boolean') return parsed;
      }
    } catch (e) {}
    return null;
  });

  // Hydrate persistent local movies & posters from IndexedDB on startup
  useEffect(() => {
    let active = true;
    hydrateAllLocalMedia()
      .then((map) => {
        if (!active) return;
        setLocalMediaMap(map);

        // Recover any IndexedDB movies missing from localStorage (e.g. if quota exceeded)
        const records = Object.values(map);
        if (records.length > 0) {
          setAllChannels((prev) => {
            const existingIds = new Set(prev.map((c) => c.localMediaId || c.id));
            const recovered: Channel[] = [];
            for (const rec of records) {
              if (!existingIds.has(rec.id)) {
                recovered.push({
                  id: rec.id,
                  name: rec.channelMeta?.name || rec.fileName.replace(/\.[^/.]+$/, '') || rec.fileName,
                  url: '',
                  group: rec.channelMeta?.group || 'أفلام أجنبية',
                  type: 'local',
                  resolution: rec.channelMeta?.resolution || 'FHD',
                  badge: rec.channelMeta?.badge || 'ملف محلي',
                  isLocalSaved: true,
                  localMediaId: rec.id,
                  fileName: rec.fileName,
                  fileSizeBytes: rec.size,
                  description:
                    rec.channelMeta?.description ||
                    `فيلم محلي محفوظ (${formatFileSize(rec.size)}) — ${rec.fileName}`
                });
              }
            }
            return recovered.length > 0 ? [...recovered, ...prev] : prev;
          });
        }

        setPlayingChannel((curr) => {
          if (!curr || !curr.isLocalSaved) return curr;
          const media = map[curr.localMediaId || curr.id];
          return media ? { ...curr, url: media.videoUrl } : curr;
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Persist channels, categories, hero IDs, and admin PIN to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(allChannels));
    } catch (e) {}
  }, [allChannels]);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(HERO_IDS_STORAGE_KEY, JSON.stringify(heroChannelIds));
    } catch (e) {}
  }, [heroChannelIds]);

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_PIN_STORAGE_KEY, adminPin);
    } catch (e) {}
  }, [adminPin]);

  useEffect(() => {
    try {
      localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
    } catch (e) {}
  }, [matches]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(MATCH_REMINDERS_STORAGE_KEY, JSON.stringify(remindedMatchIds));
    } catch (e) {}
  }, [remindedMatchIds]);

  useEffect(() => {
    try {
      localStorage.setItem(TICKER_STORAGE_KEY, JSON.stringify(tickerConfig));
    } catch (e) {}
  }, [tickerConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(SUBSCRIPTION_CONFIG_STORAGE_KEY, JSON.stringify(subscriptionConfig));
    } catch (e) {}
  }, [subscriptionConfig]);

  useEffect(() => {
    try {
      if (activeSubscription) {
        localStorage.setItem(ACTIVE_SUBSCRIPTION_STORAGE_KEY, JSON.stringify(activeSubscription));
      } else {
        localStorage.removeItem(ACTIVE_SUBSCRIPTION_STORAGE_KEY);
      }
    } catch (e) {}
  }, [activeSubscription]);

  // Load Continue Watching independently for each active profile
  useEffect(() => {
    if (!activeProfile) {
      setContinueWatching([]);
      return;
    }
    try {
      const saved = localStorage.getItem(getContinueWatchingKey(activeProfile.id));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setContinueWatching(parsed);
          return;
        }
      }
    } catch (e) {}
    setContinueWatching([]);
  }, [activeProfile]);

  // Save profiles
  useEffect(() => {
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {}
  }, [profiles]);

  // Load favorites
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch (e) {}
  }, []);

  // Dispatch Notification (Toast + Bell + Audio Chime + Web Notification)
  const dispatchNotification = useCallback(
    (title: string, message: string, type: NotificationType, matchId?: string) => {
      const item: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        message,
        type,
        createdAt: Date.now(),
        read: false,
        matchId
      };
      setNotifications((prev) => [item, ...prev].slice(0, 40));
      setActiveToast(item);
      playNotificationChime(type === 'urgent' || type === 'match_alert');
      triggerBrowserNotification(title, message);
      setTimeout(() => {
        setActiveToast((curr) => (curr?.id === item.id ? null : curr));
      }, 6500);
    },
    []
  );

  // Automatic Match Reminder Monitor (Triggers audio + visual notification on Live or Kickoff)
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      matches.forEach((m) => {
        if (!remindedMatchIds.includes(m.id)) return;
        if (firedMatchAlertsRef.current.has(m.id)) return;

        const reachedKickoff = m.kickoffTimestamp && m.kickoffTimestamp <= now;
        if (m.status === 'live' || reachedKickoff) {
          firedMatchAlertsRef.current.add(m.id);
          if (m.status !== 'live' && reachedKickoff) {
            setMatches((prev) =>
              prev.map((item) => (item.id === m.id ? { ...item, status: 'live' } : item))
            );
          }
          dispatchNotification(
            '⚽ انطلقت المباراة الآن!',
            `${m.homeTeam} × ${m.awayTeam} — البث متوفر الآن عبر ${m.channelName}`,
            'match_alert',
            m.id
          );
        }
      });
    };

    checkReminders();
    const timer = setInterval(checkReminders, 1000);
    return () => clearInterval(timer);
  }, [matches, remindedMatchIds, dispatchNotification]);

  // Update Custom Cover Image handler
  const handleUpdateCover = (channelId: string, newCoverUrl: string | null) => {
    setCustomCovers(prev => {
      const updated = { ...prev };
      if (newCoverUrl) {
        updated[channelId] = newCoverUrl;
      } else {
        delete updated[channelId];
      }
      try {
        localStorage.setItem(CUSTOM_COVERS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Effective covers map combining URL customCovers + IndexedDB local movie posters
  const effectiveCovers = useMemo(() => {
    const merged: Record<string, string> = { ...customCovers };
    Object.values(localMediaMap).forEach((media) => {
      if (media.posterUrl && !merged[media.id]) {
        merged[media.id] = media.posterUrl;
      }
    });
    return merged;
  }, [customCovers, localMediaMap]);

  // Resolve allChannels with live IndexedDB blob URLs + fallback recovery for local saved movies
  const resolvedAllChannels = useMemo(() => {
    const seenMediaIds = new Set<string>();
    const mapped = allChannels.map((ch) => {
      if (!ch.isLocalSaved) return ch;
      const mediaId = ch.localMediaId || ch.id;
      seenMediaIds.add(mediaId);
      const media = localMediaMap[mediaId];
      if (!media) return ch;
      return {
        ...ch,
        url: media.videoUrl,
        fileName: media.fileName || ch.fileName,
        fileSizeBytes: media.size || ch.fileSizeBytes
      };
    });

    const recovered: Channel[] = [];
    Object.values(localMediaMap).forEach((media) => {
      if (!seenMediaIds.has(media.id)) {
        recovered.push({
          id: media.id,
          name: media.channelMeta?.name || media.fileName.replace(/\.[^/.]+$/, '') || media.fileName,
          url: media.videoUrl,
          group: media.channelMeta?.group || 'أفلام أجنبية',
          type: 'local',
          resolution: media.channelMeta?.resolution || 'FHD',
          badge: media.channelMeta?.badge || 'ملف محلي',
          isLocalSaved: true,
          localMediaId: media.id,
          fileName: media.fileName,
          fileSizeBytes: media.size,
          description:
            media.channelMeta?.description ||
            `فيلم محلي محفوظ (${formatFileSize(media.size)}) — ${media.fileName}`
        });
      }
    });

    return recovered.length > 0 ? [...recovered, ...mapped] : mapped;
  }, [allChannels, localMediaMap]);

  // Admin CRUD handlers
  const handleAdminAddChannel = (channel: Channel, customCoverUrl?: string) => {
    setAllChannels(prev => [channel, ...prev]);
    if (customCoverUrl) {
      handleUpdateCover(channel.id, customCoverUrl);
    }
    if (!categories.includes(channel.group)) {
      setCategories(prev => [...prev, channel.group]);
    }
  };

  const handleAdminAddLocalMovie = async (params: {
    name: string;
    group: string;
    badge?: string;
    resolution: '4K' | 'FHD' | 'HD' | 'SD';
    videoFile: File;
    posterFile?: File | null;
    posterUrl?: string;
    description?: string;
  }): Promise<Channel> => {
    const id = `ch-local-${Date.now()}`;
    const safeMime = params.videoFile.type || 'video/mp4';
    const safeVideoBlob = params.videoFile.slice(0, params.videoFile.size, safeMime);
    const safePosterBlob = params.posterFile
      ? params.posterFile.slice(0, params.posterFile.size, params.posterFile.type || 'image/jpeg')
      : null;

    const channelMeta = {
      name: params.name.trim(),
      group: params.group,
      badge: params.badge?.trim() || 'ملف محلي',
      resolution: params.resolution,
      description:
        params.description?.trim() ||
        'عرض سينمائي عالي الدقة محفوظ في مكتبتك الخاصة مع دعم التقديم والتأخير والاستئناف التلقائي.'
    };

    await saveLocalMedia({
      id,
      videoBlob: safeVideoBlob,
      posterBlob: safePosterBlob,
      fileName: params.videoFile.name,
      mimeType: safeMime,
      size: params.videoFile.size,
      createdAt: Date.now(),
      channelMeta
    });

    const videoUrl = URL.createObjectURL(safeVideoBlob);
    const posterUrl = safePosterBlob ? URL.createObjectURL(safePosterBlob) : undefined;

    setLocalMediaMap((prev) => ({
      ...prev,
      [id]: {
        id,
        videoUrl,
        posterUrl,
        fileName: params.videoFile.name,
        mimeType: safeMime,
        size: params.videoFile.size,
        createdAt: Date.now(),
        channelMeta
      }
    }));

    const newChannel: Channel = {
      id,
      name: channelMeta.name,
      url: '', // Hydrated dynamically from IndexedDB
      group: params.group,
      type: 'local',
      resolution: params.resolution,
      badge: channelMeta.badge,
      isLocalSaved: true,
      localMediaId: id,
      fileName: params.videoFile.name,
      fileSizeBytes: params.videoFile.size,
      description: channelMeta.description
    };

    setAllChannels((prev) => [newChannel, ...prev]);
    if (!params.posterFile && params.posterUrl?.trim()) {
      handleUpdateCover(id, params.posterUrl.trim());
    }
    if (!categories.includes(params.group)) {
      setCategories((prev) => [...prev, params.group]);
    }
    return { ...newChannel, url: videoUrl };
  };

  const handleAdminUpdateChannel = async (
    updated: Channel,
    customCoverUrl?: string | null,
    localUpdates?: {
      newVideoFile?: File | null;
      newPosterFile?: File | null;
      clearLocalPoster?: boolean;
    }
  ) => {
    let finalChannel = updated;

    if (updated.isLocalSaved) {
      const mediaId = updated.localMediaId || updated.id;
      const nextVideoBlob = localUpdates?.newVideoFile
        ? localUpdates.newVideoFile.slice(
            0,
            localUpdates.newVideoFile.size,
            localUpdates.newVideoFile.type || 'video/mp4'
          )
        : undefined;
      const nextPosterBlob = localUpdates?.newPosterFile
        ? localUpdates.newPosterFile.slice(
            0,
            localUpdates.newPosterFile.size,
            localUpdates.newPosterFile.type || 'image/jpeg'
          )
        : localUpdates?.clearLocalPoster
        ? null
        : undefined;

      const updatedMeta = {
        name: updated.name,
        group: updated.group,
        badge: updated.badge,
        resolution: updated.resolution,
        description: localUpdates?.newVideoFile
          ? `فيلم محلي محفوظ (${formatFileSize(localUpdates.newVideoFile.size)}) — ${localUpdates.newVideoFile.name}`
          : updated.description
      };

      const savedRec = await updateLocalMediaRecord(mediaId, {
        videoBlob: nextVideoBlob,
        fileName: localUpdates?.newVideoFile?.name,
        mimeType: localUpdates?.newVideoFile?.type || undefined,
        size: localUpdates?.newVideoFile?.size,
        posterBlob: nextPosterBlob,
        channelMeta: updatedMeta
      });

      if (savedRec) {
        setLocalMediaMap((prev) => {
          const old = prev[mediaId];
          let nextVideoUrl = old?.videoUrl || '';
          let nextPosterUrl = old?.posterUrl;

          if (localUpdates?.newVideoFile) {
            if (old?.videoUrl?.startsWith('blob:')) URL.revokeObjectURL(old.videoUrl);
            nextVideoUrl = URL.createObjectURL(savedRec.videoBlob);
          }
          if (localUpdates?.newPosterFile) {
            if (old?.posterUrl?.startsWith('blob:')) URL.revokeObjectURL(old.posterUrl);
            nextPosterUrl = savedRec.posterBlob ? URL.createObjectURL(savedRec.posterBlob) : undefined;
          } else if (localUpdates?.clearLocalPoster) {
            if (old?.posterUrl?.startsWith('blob:')) URL.revokeObjectURL(old.posterUrl);
            nextPosterUrl = undefined;
          }

          return {
            ...prev,
            [mediaId]: {
              id: mediaId,
              videoUrl: nextVideoUrl,
              posterUrl: nextPosterUrl,
              fileName: savedRec.fileName,
              mimeType: savedRec.mimeType,
              size: savedRec.size,
              createdAt: savedRec.createdAt,
              channelMeta: savedRec.channelMeta
            }
          };
        });

        if (localUpdates?.newVideoFile) {
          finalChannel = {
            ...updated,
            url: '',
            fileName: savedRec.fileName,
            fileSizeBytes: savedRec.size,
            description: updatedMeta.description
          };
        }
      }
      // Keep localStorage copy free of ephemeral blob URLs
      finalChannel = { ...finalChannel, url: '' };
    }

    setAllChannels((prev) => prev.map((ch) => (ch.id === finalChannel.id ? finalChannel : ch)));
    if (customCoverUrl !== undefined) {
      handleUpdateCover(finalChannel.id, customCoverUrl);
    }
    if (playingChannel?.id === finalChannel.id) {
      const media = finalChannel.isLocalSaved
        ? localMediaMap[finalChannel.localMediaId || finalChannel.id]
        : undefined;
      setPlayingChannel(media ? { ...finalChannel, url: media.videoUrl } : finalChannel);
    }
  };

  const handleAdminDeleteChannel = async (channelId: string) => {
    const target = allChannels.find((ch) => ch.id === channelId);
    if (target?.isLocalSaved) {
      const mediaId = target.localMediaId || target.id;
      const existingMedia = localMediaMap[mediaId];
      if (existingMedia?.videoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(existingMedia.videoUrl);
      }
      if (existingMedia?.posterUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(existingMedia.posterUrl);
      }
      setLocalMediaMap((prev) => {
        const next = { ...prev };
        delete next[mediaId];
        return next;
      });
      await deleteLocalMedia(mediaId).catch(() => {});
    }

    setAllChannels((prev) => prev.filter((ch) => ch.id !== channelId));
    setHeroChannelIds((prev) => prev.filter((id) => id !== channelId));
    handleUpdateCover(channelId, null);
    setFavorites((prev) => prev.filter((id) => id !== channelId));
    setContinueWatching((prev) => {
      const updated = prev.filter((item) => item.channelId !== channelId);
      if (activeProfile) {
        try {
          localStorage.setItem(getContinueWatchingKey(activeProfile.id), JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
    if (playingChannel?.id === channelId) {
      setIsPlayerOpen(false);
      setIsPlayerMinimized(false);
      setPlayingChannel(null);
    }
  };

  const handleToggleHeroChannel = (channelId: string) => {
    setHeroChannelIds(prev => {
      if (prev.includes(channelId)) {
        return prev.filter(id => id !== channelId);
      }
      return [channelId, ...prev];
    });
  };

  const handleAddCategory = (categoryName: string) => {
    setCategories(prev => (prev.includes(categoryName) ? prev : [...prev, categoryName]));
  };

  const handleDeleteCategory = (categoryName: string) => {
    setCategories(prev => prev.filter(c => c !== categoryName));
  };

  const handleReorderCategories = (nextCategories: string[]) => {
    setCategories(nextCategories);
  };

  const handleImportBackup = (payload: AdminBackupPayload) => {
    setAllChannels(payload.channels);
    setCategories(payload.categories);
    setCustomCovers(payload.customCovers);
    try {
      localStorage.setItem(CUSTOM_COVERS_KEY, JSON.stringify(payload.customCovers));
    } catch (e) {}
    setHeroChannelIds(payload.heroChannelIds);
    if (payload.matches) {
      setMatches(payload.matches);
    }
    if (payload.tickerConfig) {
      setTickerConfig(payload.tickerConfig);
    }
    if (payload.adminPin) {
      setAdminPin(payload.adminPin);
    }
  };

  const handleResetDefaults = () => {
    setAllChannels(DEFAULT_CHANNELS);
    setCategories(DEFAULT_CATEGORIES);
    setHeroChannelIds(DEFAULT_HERO_IDS);
    setMatches(DEFAULT_MATCHES);
    setTickerConfig(DEFAULT_TICKER);
    setCustomCovers({});
    try {
      localStorage.removeItem(CUSTOM_COVERS_KEY);
    } catch (e) {}
  };

  const handleToggleRemindMatch = async (match: MatchItem) => {
    const alreadyReminded = remindedMatchIds.includes(match.id);
    if (!alreadyReminded) {
      await requestBrowserNotificationPermission();
      setRemindedMatchIds((prev) => [...prev, match.id]);
      firedMatchAlertsRef.current.delete(match.id);
      playNotificationChime(false);
      setActiveToast({
        id: `remind-toast-${Date.now()}`,
        title: 'تم تفعيل التذكير للمباراة ⏰',
        message: `سننبهك صوتياً وبصرياً فور انطلاق ${match.homeTeam} × ${match.awayTeam}`,
        type: 'sports',
        createdAt: Date.now(),
        read: true
      });
      setTimeout(() => {
        setActiveToast((curr) => (curr?.id.startsWith('remind-toast-') ? null : curr));
      }, 4000);
    } else {
      setRemindedMatchIds((prev) => prev.filter((id) => id !== match.id));
    }
  };

  // Match Admin & Watch Handlers
  const handleAddMatch = (match: MatchItem) => {
    setMatches(prev => [match, ...prev]);
  };

  const handleUpdateMatch = (updated: MatchItem) => {
    setMatches(prev => prev.map(m => (m.id === updated.id ? updated : m)));
  };

  const handleDeleteMatch = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));
  };

  const handleToggleMatchStatus = (matchId: string) => {
    setMatches(prev =>
      prev.map(m =>
        m.id === matchId
          ? { ...m, status: m.status === 'live' ? 'upcoming' : 'live' }
          : m
      )
    );
  };

  const handleWatchMatch = (match: MatchItem) => {
    const rawUrl = match.streamUrl || 'https://www.youtube.com/live/2lJZPT6OljI';
    const ytId = extractYouTubeVideoId(rawUrl);
    const detected = detectMediaType(rawUrl);
    const matchChannel: Channel = {
      id: `live-match-${match.id}`,
      name: `${match.homeTeam} × ${match.awayTeam} (${match.channelName})`,
      url: rawUrl,
      group: 'رياضة وسرعة',
      type: detected === 'youtube' ? 'youtube' : detected === 'hls' ? 'hls' : 'live',
      youtubeId: ytId || undefined,
      embedUrl: ytId ? extractYouTubeEmbedUrl(rawUrl) || undefined : undefined,
      resolution: 'FHD',
      badge: 'مباشر الآن'
    };
    setPlayingChannel(matchChannel);
    setIsPlayerOpen(true);
    setIsPlayerMinimized(false);
    setIsPlayerPlaying(true);
  };

  // Filter channels according to active profile (Kids profile filters to kids & cartoons only)
  const visibleChannels = useMemo(() => {
    if (activeProfile?.isKids) {
      return resolvedAllChannels.filter(ch => ch.group === 'أطفال وكرتون');
    }
    return resolvedAllChannels;
  }, [resolvedAllChannels, activeProfile]);

  // Featured Hero Channels (Uses Admin-selected Hero Banner IDs first, fallback to defaults)
  const featuredChannels = useMemo(() => {
    if (activeProfile?.isKids) {
      return visibleChannels.filter(ch => ch.group === 'أطفال وكرتون');
    }
    const spotlights = heroChannelIds
      .map(id => visibleChannels.find(c => c.id === id))
      .filter(Boolean) as Channel[];

    return spotlights.length > 0 ? spotlights : visibleChannels.slice(0, 4);
  }, [visibleChannels, activeProfile, heroChannelIds]);

  // Row Categories Grouping
  const newsChannels = useMemo(() => visibleChannels.filter(c => c.group === 'قنوات إخبارية'), [visibleChannels]);
  const seriesChannels = useMemo(() => visibleChannels.filter(c => c.group === 'مسلسلات عربية'), [visibleChannels]);
  const moviesChannels = useMemo(() => visibleChannels.filter(c => c.group === 'أفلام أجنبية'), [visibleChannels]);
  const kidsChannels = useMemo(() => visibleChannels.filter(c => c.group === 'أطفال وكرتون'), [visibleChannels]);
  const docChannels = useMemo(() => visibleChannels.filter(c => c.group === 'وثائقي وطبيعة'), [visibleChannels]);
  const abuSadiqChannels = useMemo(() => visibleChannels.filter(c => c.group === 'وثائقيات أبو الصادق'), [visibleChannels]);
  const storiesChannels = useMemo(() => visibleChannels.filter(c => c.group === 'قصص وروايات'), [visibleChannels]);
  const animeChannels = useMemo(() => visibleChannels.filter(c => c.group === 'ملخصات انمي'), [visibleChannels]);
  const musicChannels = useMemo(() => visibleChannels.filter(c => c.group === 'أغاني وموسيقى'), [visibleChannels]);
  const islamChannels = useMemo(() => visibleChannels.filter(c => c.group === 'إسلاميات ودين'), [visibleChannels]);
  const sportsChannels = useMemo(() => visibleChannels.filter(c => c.group === 'رياضة وسرعة'), [visibleChannels]);
  const platformChannels = useMemo(() => visibleChannels.filter(c => c.group === 'منصات ذكية'), [visibleChannels]);

  // Curated Top 10 Trending across categories (respects Kids mode via visibleChannels)
  const top10Channels = useMemo(() => {
    const picked: Channel[] = [];
    const seen = new Set<string>();
    const pushUnique = (ch?: Channel) => {
      if (ch && !seen.has(ch.id) && picked.length < 10) {
        seen.add(ch.id);
        picked.push(ch);
      }
    };

    featuredChannels.forEach(pushUnique);
    const pools = [
      seriesChannels,
      moviesChannels,
      newsChannels,
      animeChannels,
      docChannels,
      abuSadiqChannels,
      kidsChannels
    ];
    for (let i = 0; i < 4 && picked.length < 10; i++) {
      for (const pool of pools) {
        pushUnique(pool[i]);
      }
    }
    for (const ch of visibleChannels) {
      if (picked.length >= 10) break;
      pushUnique(ch);
    }
    return picked;
  }, [
    featuredChannels,
    seriesChannels,
    moviesChannels,
    newsChannels,
    animeChannels,
    docChannels,
    abuSadiqChannels,
    kidsChannels,
    visibleChannels
  ]);

  // Favorite channels
  const favoriteChannels = useMemo(() => {
    return visibleChannels.filter(c => favorites.includes(c.id));
  }, [visibleChannels, favorites]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return visibleChannels.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.group.toLowerCase().includes(q) || 
      (c.description || '').toLowerCase().includes(q)
    );
  }, [visibleChannels, searchQuery]);

  // Record / Update Continue Watching for active profile
  const upsertContinueWatching = useCallback(
    (channel: Channel, currentTime: number, duration: number) => {
      if (!activeProfile) return;
      const computedProgress =
        duration > 0 ? Math.min(98, Math.max(8, Math.round((currentTime / duration) * 100))) : 15;

      setContinueWatching((prev) => {
        const existing = prev.find((item) => item.channelId === channel.id);
        const entry: ContinueWatchingItem = {
          channelId: channel.id,
          channel,
          progressPercent:
            duration > 0 ? computedProgress : existing?.progressPercent || 15,
          currentTime: currentTime > 0 ? currentTime : existing?.currentTime || 0,
          duration: duration > 0 ? duration : existing?.duration || 0,
          lastWatchedAt: Date.now()
        };
        const updated = [entry, ...prev.filter((i) => i.channelId !== channel.id)].slice(0, 15);
        try {
          localStorage.setItem(getContinueWatchingKey(activeProfile.id), JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    },
    [activeProfile]
  );

  const handleRemoveContinueWatching = useCallback(
    (channelId: string) => {
      if (!activeProfile) return;
      setContinueWatching((prev) => {
        const updated = prev.filter((item) => item.channelId !== channelId);
        try {
          localStorage.setItem(getContinueWatchingKey(activeProfile.id), JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    },
    [activeProfile]
  );

  // Resolve Continue Watching items with live IndexedDB URLs & updated metadata
  const resolvedContinueWatching = useMemo(() => {
    const channelMap = new Map(resolvedAllChannels.map((c) => [c.id, c]));
    return continueWatching.map((item) => {
      const liveChannel = channelMap.get(item.channelId);
      return liveChannel ? { ...item, channel: liveChannel } : item;
    });
  }, [continueWatching, resolvedAllChannels]);

  // Play handler (Music plays directly in Spotify Mini Player so user can keep browsing)
  const handlePlayChannel = useCallback(
    (channel: Channel, resumeTime?: number) => {
      const liveChannel = resolvedAllChannels.find((c) => c.id === channel.id) || channel;
      const isMusic = liveChannel.group === 'أغاني وموسيقى';
      setInitialSeekTime(resumeTime);
      setPlayingChannel(liveChannel);
      setIsPlayerOpen(true);
      setIsPlayerMinimized(isMusic);
      setIsPlayerPlaying(true);
      upsertContinueWatching(liveChannel, resumeTime || 0, 0);
    },
    [upsertContinueWatching, resolvedAllChannels]
  );

  // Profile handlers
  const handleSelectProfile = (profile: UserProfile) => {
    if (profile.isKids && playingChannel && playingChannel.group !== 'أطفال وكرتون') {
      setIsPlayerOpen(false);
      setIsPlayerMinimized(false);
      setPlayingChannel(null);
    }
    setActiveProfile(profile);
    setActiveTab('home');
    setSearchQuery('');
  };

  const handleRequestSwitchProfile = () => {
    if (activeProfile?.isKids) {
      setIsPinPromptOpen(true);
    } else {
      setActiveProfile(null);
    }
  };

  const handleAddProfile = (newProfileData: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const newProfile: UserProfile = {
      ...newProfileData,
      id: `profile-${Date.now()}`,
      createdAt: Date.now()
    };
    setProfiles(prev => [...prev, newProfile]);
    handleSelectProfile(newProfile);
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    if (activeProfile?.id === updatedProfile.id) {
      setActiveProfile(updatedProfile);
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    if (activeProfile?.id === profileId) {
      setActiveProfile(null);
    }
  };

  const handleToggleFavorite = (channelId: string) => {
    setFavorites(prev => {
      const next = prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Smart Playback Queue (Keep music inside musicChannels for continuous Spotify Auto-Play Next)
  const playbackQueue = useMemo(() => {
    if (playingChannel?.group === 'أغاني وموسيقى' && musicChannels.length > 0) {
      return musicChannels;
    }
    return visibleChannels;
  }, [playingChannel, musicChannels, visibleChannels]);

  // Next / Prev channel in player
  const handleNextChannel = () => {
    if (!playingChannel || playbackQueue.length === 0) return;
    const idx = playbackQueue.findIndex(c => c.id === playingChannel.id);
    const nextIdx = idx === -1 ? 0 : (idx + 1) % playbackQueue.length;
    const nextCh = playbackQueue[nextIdx];
    setInitialSeekTime(undefined);
    setPlayingChannel(nextCh);
    setIsPlayerPlaying(true);
    upsertContinueWatching(nextCh, 0, 0);
  };

  const handlePrevChannel = () => {
    if (!playingChannel || playbackQueue.length === 0) return;
    const idx = playbackQueue.findIndex(c => c.id === playingChannel.id);
    const prevIdx = idx === -1 ? 0 : (idx - 1 + playbackQueue.length) % playbackQueue.length;
    const prevCh = playbackQueue[prevIdx];
    setInitialSeekTime(undefined);
    setPlayingChannel(prevCh);
    setIsPlayerPlaying(true);
    upsertContinueWatching(prevCh, 0, 0);
  };

  // Remote Grid Navigation when player is closed
  const handleRemoteNavigateGrid = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (visibleChannels.length === 0) return;
    setFocusedChannelIndex((prev) => {
      const cur = prev === null ? 0 : prev;
      let next = cur;
      if (direction === 'left' || direction === 'down') {
        next = Math.min(visibleChannels.length - 1, cur + (direction === 'down' ? 4 : 1));
      } else {
        next = Math.max(0, cur - (direction === 'up' ? 4 : 1));
      }
      const targetCh = visibleChannels[next];
      if (targetCh) {
        setTimeout(() => {
          const el = document.querySelector(`[data-channel-id="${targetCh.id}"]`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }, 20);
      }
      return next;
    });
  };

  const handleRemoteConfirmFocus = () => {
    const idx = focusedChannelIndex ?? 0;
    const target = visibleChannels[idx];
    if (target) {
      handlePlayChannel(target);
    }
  };

  // File loading
  const handleLoadM3UFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const parsed = parseM3U(content);
        if (parsed.length > 0) {
          const platforms = DEFAULT_CHANNELS.filter(c => c.type === 'netflix' || c.type === 'web');
          setAllChannels([...platforms, ...parsed]);
          handlePlayChannel(parsed[0]);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleLoadLocalVideo = async (file: File) => {
    const targetGroup = activeProfile?.isKids ? 'أطفال وكرتون' : 'أفلام أجنبية';
    const title = file.name.replace(/\.[^/.]+$/, '') || file.name;
    try {
      const savedChannel = await handleAdminAddLocalMovie({
        name: title,
        group: targetGroup,
        badge: 'ملف محلي',
        resolution: '4K',
        videoFile: file
      });
      handlePlayChannel(savedChannel);
    } catch {
      dispatchNotification(
        'تنبيه مساحة التخزين',
        'تم فتح الفيديو للمشاهدة المؤقتة فقط — مساحة المتصفح قد لا تكفي لحفظه بشكل دائم.',
        'general'
      );
      const blobUrl = URL.createObjectURL(file);
      const localChannel: Channel = {
        id: `local-${Date.now()}`,
        name: title,
        url: blobUrl,
        group: targetGroup,
        resolution: '4K',
        type: 'local',
        badge: 'مؤقت'
      };
      setAllChannels(prev => [localChannel, ...prev]);
      handlePlayChannel(localChannel);
    }
  };

  const handleLoadM3uFromUrl = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('فشل جلب ملف القنوات من الرابط');
    const text = await res.text();
    const parsed = parseM3U(text);
    if (parsed.length > 0) {
      const platforms = DEFAULT_CHANNELS.filter(c => c.type === 'netflix' || c.type === 'web');
      setAllChannels([...platforms, ...parsed]);
      handlePlayChannel(parsed[0]);
    }
  };

  const handleAddChannel = (channel: Channel) => {
    setAllChannels(prev => [channel, ...prev]);
    handlePlayChannel(channel);
  };

  // Subscription Helpers & Gate Check
  const isSubscriptionExpired = Boolean(
    activeSubscription &&
      activeSubscription.expiresAt !== null &&
      Date.now() > activeSubscription.expiresAt
  );
  const hasValidSubscription =
    !subscriptionConfig.enabled ||
    Boolean(activeSubscription?.isActive && !isSubscriptionExpired);

  const handleActivatePayPal = (details: { payerEmail?: string; reference?: string }) => {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    setActiveSubscription({
      isActive: true,
      method: 'paypal',
      activatedAt: Date.now(),
      expiresAt: Date.now() + thirtyDaysMs,
      payerEmail: details.payerEmail,
      paypalReference: details.reference
    });
  };

  const handleActivateGiftCode = (code: string) => {
    setActiveSubscription({
      isActive: true,
      method: 'gift_code',
      activatedAt: Date.now(),
      expiresAt: null,
      giftCodeUsed: code
    });
  };

  const handleLockSubscriptionGate = () => {
    setIsPlayerOpen(false);
    setIsPlayerMinimized(false);
    setPlayingChannel(null);
    setSubscriptionConfig((prev) => ({ ...prev, enabled: true }));
    setActiveSubscription(null);
  };

  const subscriptionStatusText = useMemo(() => {
    if (!subscriptionConfig.enabled) return 'مفتوح';
    if (!activeSubscription?.isActive) return 'مقفل';
    if (activeSubscription.method === 'gift_code') return 'هدية مجانية';
    if (activeSubscription.method === 'admin') return 'إدارة';
    if (activeSubscription.expiresAt) {
      const daysLeft = Math.max(
        1,
        Math.ceil((activeSubscription.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
      );
      return `${daysLeft} يوم`;
    }
    return 'نشط';
  }, [subscriptionConfig.enabled, activeSubscription]);

  // 1. Cinematic Intro Screen
  if (showIntro) {
    return <IntroAnimation onComplete={() => setShowIntro(false)} />;
  }

  // 1b. Monthly Subscription ($2 PayPal) & Gift Code (911) Gate
  if (!hasValidSubscription) {
    return (
      <>
        <SubscriptionGate
          config={subscriptionConfig}
          expiredNotice={isSubscriptionExpired}
          onActivatePayPal={handleActivatePayPal}
          onActivateGiftCode={handleActivateGiftCode}
          onRequestAdminAccess={() => setIsAdminPinOpen(true)}
        />
        <PinPromptModal
          isOpen={isAdminPinOpen}
          onClose={() => setIsAdminPinOpen(false)}
          onSuccess={() => {
            setIsAdminPinOpen(false);
            setActiveSubscription({
              isActive: true,
              method: 'admin',
              activatedAt: Date.now(),
              expiresAt: null
            });
            setIsAdminPanelOpen(true);
          }}
          expectedPin={adminPin}
          title="دخول لوحة تحكم المسؤول"
          subtitle="أدخل الرمز السري المكون من 4 أرقام للوصول إلى إدارة التطبيق والاشتراك"
          errorHint="الرمز السري غير صحيح. يرجى المحاولة مرة أخرى."
        />
      </>
    );
  }

  // 2. Profile Selection Screen ("من يشاهد الآن؟")
  if (!activeProfile) {
    return (
      <ProfileSelection
        profiles={profiles}
        onSelectProfile={handleSelectProfile}
        onAddProfile={handleAddProfile}
        onUpdateProfile={handleUpdateProfile}
        onDeleteProfile={handleDeleteProfile}
        onLockSubscriptionGate={handleLockSubscriptionGate}
      />
    );
  }

  const currentChannelIndex = playingChannel
    ? Math.max(0, playbackQueue.findIndex(c => c.id === playingChannel.id))
    : 0;
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const focusedChannelId =
    focusedChannelIndex !== null && visibleChannels[focusedChannelIndex]
      ? visibleChannels[focusedChannelIndex].id
      : null;

  // 3. Main Netflix-Style UI
  return (
    <div className="min-h-screen w-full bg-[#141414] text-white select-none font-sans overflow-x-hidden">
      {/* Offline Indicator & Floating Notification Toast */}
      <OfflineIndicator />
      <NotificationToast
        notification={activeToast}
        onDismiss={() => setActiveToast(null)}
        onAction={(notif) => {
          setActiveToast(null);
          if (notif.matchId && !activeProfile.isKids) {
            setActiveTab('matches');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      {/* Netflix Top Navigation Bar */}
      <NetflixNavbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeProfile={activeProfile}
        onRequestSwitchProfile={handleRequestSwitchProfile}
        onLoadM3UFile={handleLoadM3UFile}
        onLoadLocalVideo={handleLoadLocalVideo}
        onOpenRemoteModal={() => setIsRemoteModalOpen(true)}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        onOpenAdminPanel={() => setIsAdminPinOpen(true)}
        favoritesCount={favorites.length}
        matchTheme={matchTheme}
        liveMatchesCount={matches.filter(m => m.status === 'live').length}
        notifications={notifications}
        unreadCount={unreadNotificationsCount}
        onMarkAllNotificationsRead={() =>
          setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        }
        onClearNotifications={() => setNotifications([])}
        onClickNotification={(notif) => {
          setNotifications(prev =>
            prev.map(n => (n.id === notif.id ? { ...n, read: true } : n))
          );
          if (notif.matchId && !activeProfile.isKids) {
            setActiveTab('matches');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        subscriptionStatusText={subscriptionStatusText}
        onLockSubscriptionGate={handleLockSubscriptionGate}
      />

      {/* Main Content Area (With extra bottom padding when Spotify Mini Player or Ticker is active) */}
      <main
        className={
          isPlayerOpen && isPlayerMinimized
            ? tickerConfig.enabled
              ? 'pb-48 md:pb-40'
              : 'pb-40 md:pb-32'
            : tickerConfig.enabled
            ? 'pb-32 sm:pb-36'
            : 'pb-24 sm:pb-28'
        }
      >
        {/* If user is actively searching: Show Search Results Grid */}
        {searchQuery.trim() ? (
          <div className="pt-20 sm:pt-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Search className="w-5 h-5 text-[#e50914]" />
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white">
                نتائج البحث عن: "{searchQuery}"
              </h1>
              <span className="text-xs text-zinc-400">({searchResults.length} نتيجة)</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-24 text-zinc-500">
                <p className="text-base font-semibold">لم يتم العثور على أي قناة أو مسلسل يطابق بحثك.</p>
                <p className="text-xs mt-1">جرب البحث بكلمات أخرى مثل "الجزيرة", "شباب البومب", "مستر بين", أو "أكشن".</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    data-channel-id={item.id}
                    onClick={() => handlePlayChannel(item)}
                    className={`group relative aspect-video rounded-xl overflow-hidden bg-[#161616] border cursor-pointer transition-all hover:scale-105 shadow-lg ${
                      focusedChannelId === item.id
                        ? 'border-[#e50914] ring-2 ring-[#e50914] scale-105'
                        : 'border-[#2b2b2b] hover:border-[#e50914]'
                    }`}
                  >
                      <ChannelThumbnail
                      channel={item}
                      customCover={effectiveCovers[item.id]}
                      className="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                    <div className="absolute bottom-2 right-2 left-2 text-right">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <span className="text-[10px] text-zinc-400">{item.group}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'games' ? (
          /* Mini-Games Zone */
          <GamesZone />
        ) : activeTab === 'matches' && !activeProfile.isKids ? (
          /* Matches Center View with Dynamic Tournament Themes */
          <MatchesCenter
            matches={matches}
            activeTheme={matchTheme}
            onSelectTheme={setMatchTheme}
            onWatchMatch={handleWatchMatch}
            remindedMatchIds={remindedMatchIds}
            onToggleRemindMatch={handleToggleRemindMatch}
          />
        ) : (
          /* Standard Netflix Flow */
          <>
            {/* Hero Billboard (When in Home or active category) */}
            <NetflixHeroBanner
              featuredChannels={featuredChannels}
              onPlayChannel={handlePlayChannel}
              onOpenDetails={setDetailsChannel}
              onToggleFavorite={handleToggleFavorite}
              favorites={favorites}
              customCovers={effectiveCovers}
            />

            {/* Netflix Content Rows Container */}
            <div className="-mt-10 sm:-mt-14 md:-mt-20 relative z-20 space-y-2 sm:space-y-3">
              {/* Continue Watching Row (Per-Profile, shown on Home) */}
              {activeTab === 'home' && resolvedContinueWatching.length > 0 && (
                <ContinueWatchingRow
                  items={resolvedContinueWatching}
                  onPlayChannel={handlePlayChannel}
                  onRemoveItem={handleRemoveContinueWatching}
                  customCovers={effectiveCovers}
                  focusedChannelId={focusedChannelId}
                />
              )}

              {/* Netflix-Style "أفضل 10 في Awn Tv pro اليوم" Row */}
              {activeTab === 'home' && top10Channels.length > 0 && (
                <Top10Row
                  channels={top10Channels}
                  onPlayChannel={handlePlayChannel}
                  onOpenDetails={setDetailsChannel}
                  onToggleFavorite={handleToggleFavorite}
                  favorites={favorites}
                  customCovers={effectiveCovers}
                  focusedChannelId={focusedChannelId}
                />
              )}

              {/* If in Kids mode: Showcase ONLY Kids content rows */}
              {activeProfile.isKids ? (
                <>
                  <NetflixRow
                    title="عالم الأطفال والكرتون المرح 🧸"
                    icon={<Smile className="w-5 h-5 text-amber-400" />}
                    subtitle="محتوى ترفيهي آمن وممتع"
                    channels={kidsChannels}
                    onPlayChannel={handlePlayChannel}
                    onOpenDetails={setDetailsChannel}
                    onToggleFavorite={handleToggleFavorite}
                    favorites={favorites}
                    customCovers={effectiveCovers}
                    focusedChannelId={focusedChannelId}
                  />
                  {favoriteChannels.length > 0 && (
                    <NetflixRow
                      title="قائمتي المفضلة للأطفال ⭐"
                      icon={<Star className="w-5 h-5 text-amber-400" />}
                      channels={favoriteChannels}
                      onPlayChannel={handlePlayChannel}
                      onOpenDetails={setDetailsChannel}
                      onToggleFavorite={handleToggleFavorite}
                      favorites={favorites}
                      customCovers={effectiveCovers}
                      focusedChannelId={focusedChannelId}
                    />
                  )}
                </>
              ) : (
                /* Adult / Full Netflix Experience */
                <>
                  {/* Tab: Favorites */}
                  {activeTab === 'favorites' && (
                    <NetflixRow
                      title="قائمتي المفضلة ⭐"
                      icon={<Star className="w-5 h-5 text-amber-400" />}
                      subtitle="القنوات والمسلسلات التي أضفتها"
                      channels={favoriteChannels}
                      onPlayChannel={handlePlayChannel}
                      onOpenDetails={setDetailsChannel}
                      onToggleFavorite={handleToggleFavorite}
                      favorites={favorites}
                      customCovers={effectiveCovers}
                      focusedChannelId={focusedChannelId}
                    />
                  )}

                  {/* Dedicated Single-Category Tabs */}
                  {activeTab === 'news' && (
                    <NetflixRow
                      title="البث الإخباري المباشر 🔴"
                      icon={<Newspaper className="w-5 h-5" />}
                      subtitle="تغطيات إخبارية حية متواصلة 24/7"
                      channels={newsChannels}
                      onPlayChannel={handlePlayChannel}
                      onOpenDetails={setDetailsChannel}
                      onToggleFavorite={handleToggleFavorite}
                      favorites={favorites}
                      customCovers={effectiveCovers}
                      focusedChannelId={focusedChannelId}
                    />
                  )}

                  {activeTab === 'series' && (
                    <NetflixRow
                      title="قنوات ومسلسلات عربية مشهورة 🎭"
                      icon={<Clapperboard className="w-5 h-5" />}
                      subtitle="قناة MBC 1 المباشرة ومواسم شباب البومب الأكثر مشاهدة"
                      channels={seriesChannels}
                      onPlayChannel={handlePlayChannel}
                      onOpenDetails={setDetailsChannel}
                      onToggleFavorite={handleToggleFavorite}
                      favorites={favorites}
                      customCovers={effectiveCovers}
                      focusedChannelId={focusedChannelId}
                    />
                  )}

                  {activeTab === 'anime' && (
                    <NetflixRow
                      title="ملخصات أنمي مشوقة ⚔️"
                      icon={<Sparkles className="w-5 h-5 text-fuchsia-400" />}
                      subtitle="أقوى ملخصات الأنمي والقتالات والحكايات الكاملة"
                      channels={animeChannels}
                      onPlayChannel={handlePlayChannel}
                      onOpenDetails={setDetailsChannel}
                      onToggleFavorite={handleToggleFavorite}
                      favorites={favorites}
                      customCovers={effectiveCovers}
                      focusedChannelId={focusedChannelId}
                    />
                  )}

                  {activeTab === 'music' && (
                    <NetflixRow
                      title="قائمة الأغاني والموسيقى 🎵"
                      icon={<Music className="w-5 h-5 text-[#e50914]" />}
                      subtitle="استمع للأغاني أثناء التصفح بتجربة سبوتيفاي متواصلة"
                      channels={musicChannels}
                      onPlayChannel={handlePlayChannel}
                      onOpenDetails={setDetailsChannel}
                      onToggleFavorite={handleToggleFavorite}
                      favorites={favorites}
                      customCovers={effectiveCovers}
                      variant="spotify"
                      layout="grid"
                      activeChannelId={isPlayerOpen ? playingChannel?.id : null}
                      isPlayerPlaying={isPlayerPlaying}
                      focusedChannelId={focusedChannelId}
                    />
                  )}

                  {activeTab === 'stories' && (
                    <NetflixRow
                      title="قصص وروايات واقعية وغامضة 📖"
                      icon={<BookOpen className="w-5 h-5 text-indigo-400" />}
                      subtitle="أغرب القصص الواقعية والتحقيقات والاعترافات المشوقة"
                      channels={storiesChannels}
                      onPlayChannel={handlePlayChannel}
                      onOpenDetails={setDetailsChannel}
                      onToggleFavorite={handleToggleFavorite}
                      favorites={favorites}
                      customCovers={effectiveCovers}
                      focusedChannelId={focusedChannelId}
                    />
                  )}

                  {activeTab === 'movies' && (
                    <NetflixRow
                      title="أفلام وسينما أجنبية مختارة 🎬"
                      icon={<Film className="w-5 h-5" />}
                      subtitle="أقوى أفلام الأكشن والخيال العلمي 4K"
                      channels={moviesChannels}
                      onPlayChannel={handlePlayChannel}
                      onOpenDetails={setDetailsChannel}
                      onToggleFavorite={handleToggleFavorite}
                      favorites={favorites}
                      customCovers={effectiveCovers}
                      focusedChannelId={focusedChannelId}
                    />
                  )}

                  {activeTab === 'kids' && (
                    <NetflixRow
                      title="عالم الأطفال والكرتون 🧸"
                      icon={<Smile className="w-5 h-5 text-pink-400" />}
                      subtitle="كرتون نتورك، وقت المغامرة، سبونج بوب، غامبول، ومستر بين"
                      channels={kidsChannels}
                      onPlayChannel={handlePlayChannel}
                      onOpenDetails={setDetailsChannel}
                      onToggleFavorite={handleToggleFavorite}
                      favorites={favorites}
                      customCovers={effectiveCovers}
                      focusedChannelId={focusedChannelId}
                    />
                  )}

                  {/* Home Page: Render ALL Category Rows in Admin-Configured Order */}
                  {activeTab === 'home' &&
                    categories.map((cat) => {
                      const rowConfigs: Record<
                        string,
                        {
                          title: string;
                          icon: React.ReactNode;
                          subtitle?: string;
                          channels: Channel[];
                          variant?: 'netflix' | 'spotify';
                        }
                      > = {
                        'قنوات إخبارية': {
                          title: 'البث الإخباري المباشر 🔴',
                          icon: <Newspaper className="w-5 h-5" />,
                          subtitle: 'تغطيات إخبارية حية متواصلة 24/7',
                          channels: newsChannels
                        },
                        'مسلسلات عربية': {
                          title: 'قنوات ومسلسلات عربية مشهورة 🎭',
                          icon: <Clapperboard className="w-5 h-5" />,
                          subtitle: 'قناة MBC 1 المباشرة ومواسم شباب البومب الأكثر مشاهدة',
                          channels: seriesChannels
                        },
                        'ملخصات انمي': {
                          title: 'ملخصات أنمي مشوقة ⚔️',
                          icon: <Sparkles className="w-5 h-5 text-fuchsia-400" />,
                          subtitle: 'أقوى ملخصات الأنمي والقتالات والحكايات الكاملة',
                          channels: animeChannels
                        },
                        'أغاني وموسيقى': {
                          title: 'قائمة الأغاني والموسيقى 🎵',
                          icon: <Music className="w-5 h-5 text-[#e50914]" />,
                          subtitle: 'استمع للأغاني أثناء التصفح بتجربة سبوتيفاي متواصلة',
                          channels: musicChannels,
                          variant: 'spotify'
                        },
                        'قصص وروايات': {
                          title: 'قصص وروايات واقعية وغامضة 📖',
                          icon: <BookOpen className="w-5 h-5 text-indigo-400" />,
                          subtitle: 'أغرب القصص الواقعية والتحقيقات والاعترافات المشوقة',
                          channels: storiesChannels
                        },
                        'أفلام أجنبية': {
                          title: 'أفلام وسينما أجنبية مختارة 🎬',
                          icon: <Film className="w-5 h-5" />,
                          subtitle: 'أقوى أفلام الأكشن والخيال العلمي 4K',
                          channels: moviesChannels
                        },
                        'أطفال وكرتون': {
                          title: 'عالم الأطفال والكرتون 🧸',
                          icon: <Smile className="w-5 h-5 text-pink-400" />,
                          subtitle: 'كرتون نتورك، وقت المغامرة، سبونج بوب، غامبول، ومستر بين',
                          channels: kidsChannels
                        },
                        'وثائقيات أبو الصادق': {
                          title: 'وثائقيات وتحقيقات أبو الصادق 🔍',
                          icon: <Compass className="w-5 h-5 text-amber-500" />,
                          subtitle: 'كشف الأسرار والألغاز وتحليل الأدلة الحصرية',
                          channels: abuSadiqChannels
                        },
                        'وثائقي وطبيعة': {
                          title: 'وثائقيات وعلوم واستكشاف 🌍',
                          icon: <Compass className="w-5 h-5 text-cyan-400" />,
                          subtitle: 'أفلام وثائقية عالمية، ناشيونال جيوغرافيك والجزيرة الوثائقية وفضاء ناسا',
                          channels: docChannels
                        },
                        'إسلاميات ودين': {
                          title: 'إسلاميات وقنوات مكة المكرمة 🕋',
                          icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
                          subtitle: 'بث مباشر للقرآن الكريم والحرم المكي الشريف',
                          channels: islamChannels
                        },
                        'رياضة وسرعة': {
                          title: 'رياضة وسرعة وإثارة ⚽',
                          icon: <Trophy className="w-5 h-5 text-yellow-400" />,
                          subtitle: 'بي إن سبورتس الإخبارية وسباقات السيارات',
                          channels: sportsChannels
                        },
                        'منصات ذكية': {
                          title: 'منصات وتطبيقات ذكية 🍿',
                          icon: <MonitorPlay className="w-5 h-5 text-[#e50914]" />,
                          subtitle: 'منصة نتفلكس جو التطبيق ومنصة شاهد VIP',
                          channels: platformChannels
                        }
                      };

                      const builtIn = rowConfigs[cat];
                      if (builtIn) {
                        if (builtIn.variant === 'spotify') {
                          return (
                            <NetflixRow
                              key={cat}
                              title={builtIn.title}
                              icon={builtIn.icon}
                              subtitle={builtIn.subtitle}
                              channels={builtIn.channels}
                              onPlayChannel={handlePlayChannel}
                              onOpenDetails={setDetailsChannel}
                              onToggleFavorite={handleToggleFavorite}
                              favorites={favorites}
                              customCovers={effectiveCovers}
                              variant="spotify"
                              layout="row"
                              activeChannelId={isPlayerOpen ? playingChannel?.id : null}
                              isPlayerPlaying={isPlayerPlaying}
                              focusedChannelId={focusedChannelId}
                            />
                          );
                        }
                        return (
                          <NetflixRow
                            key={cat}
                            title={builtIn.title}
                            icon={builtIn.icon}
                            subtitle={builtIn.subtitle}
                            channels={builtIn.channels}
                            onPlayChannel={handlePlayChannel}
                            onOpenDetails={setDetailsChannel}
                            onToggleFavorite={handleToggleFavorite}
                            favorites={favorites}
                            customCovers={effectiveCovers}
                            focusedChannelId={focusedChannelId}
                          />
                        );
                      }

                      const customCatChannels = visibleChannels.filter((c) => c.group === cat);
                      if (customCatChannels.length === 0) return null;
                      return (
                        <NetflixRow
                          key={cat}
                          title={cat}
                          icon={<Sparkles className="w-5 h-5 text-[#e50914]" />}
                          channels={customCatChannels}
                          onPlayChannel={handlePlayChannel}
                          onOpenDetails={setDetailsChannel}
                          onToggleFavorite={handleToggleFavorite}
                          favorites={favorites}
                          customCovers={effectiveCovers}
                          focusedChannelId={focusedChannelId}
                        />
                      );
                    })}
                </>
              )}
            </div>
          </>
        )}
      </main>

      {/* 3b. Breaking News Ticker Bar (Controlled from Admin Panel 6767) */}
      <BreakingNewsTicker
        config={tickerConfig}
        hasMiniPlayer={isPlayerOpen && isPlayerMinimized}
      />

      {/* 4. Fixed Mobile Bottom Navigation Bar (Phone only) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeProfile={activeProfile}
        onOpenProfileSwitcher={handleRequestSwitchProfile}
      />

      {/* 5. Cinema Video Player + Spotify Sticky Mini Player */}
      <CinemaPlayerModal
        channel={playingChannel}
        isOpen={isPlayerOpen}
        isMinimized={isPlayerMinimized}
        onMinimize={() => setIsPlayerMinimized(true)}
        onMaximize={() => setIsPlayerMinimized(false)}
        onClose={() => {
          setIsPlayerOpen(false);
          setIsPlayerMinimized(false);
          setPlayingChannel(null);
        }}
        onNextChannel={handleNextChannel}
        onPrevChannel={handlePrevChannel}
        totalChannels={playbackQueue.length}
        channelIndex={currentChannelIndex}
        customCovers={effectiveCovers}
        onPlayingStateChange={setIsPlayerPlaying}
        externalVolume={playerVolume}
        onExternalVolumeChange={(v) => {
          setPlayerVolume(v);
          if (v > 0 && playerMuted) setPlayerMuted(false);
        }}
        externalMuted={playerMuted}
        onExternalMutedToggle={() => setPlayerMuted((m) => !m)}
        externalPlaySignal={remotePlaySignal}
        externalFullscreenSignal={remoteFullscreenSignal}
        initialSeekTime={initialSeekTime}
        onProgressUpdate={upsertContinueWatching}
        onOpenRemote={() => setIsRemoteModalOpen(true)}
      />

      {/* 6. Title Details Modal (Netflix Synopsis & Info & Manual Cover Change) */}
      {(() => {
        const detailsContinueItem = detailsChannel
          ? resolvedContinueWatching.find((cw) => cw.channelId === detailsChannel.id)
          : undefined;
        return (
          <TitleDetailsModal
            channel={detailsChannel}
            isOpen={!!detailsChannel}
            onClose={() => setDetailsChannel(null)}
            onPlay={handlePlayChannel}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={detailsChannel ? favorites.includes(detailsChannel.id) : false}
            customCover={detailsChannel ? effectiveCovers[detailsChannel.id] : null}
            onUpdateCover={handleUpdateCover}
            allChannels={visibleChannels}
            favorites={favorites}
            customCovers={effectiveCovers}
            resumeTime={detailsContinueItem?.currentTime || 0}
            resumeDuration={detailsContinueItem?.duration || 0}
            onSelectChannel={setDetailsChannel}
            isMuted={playerMuted}
            onToggleMute={() => setPlayerMuted((m) => !m)}
          />
        );
      })()}

      {/* 7. PIN Prompt Modal for Kids Exit Protection */}
      <PinPromptModal
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onSuccess={() => {
          setIsPinPromptOpen(false);
          setActiveProfile(null);
        }}
        expectedPin={activeProfile.pin || DEFAULT_KIDS_EXIT_PIN}
        title="رمز الحماية الأبوي"
        subtitle={`أدخل رمز PIN للخروج من وضع الأطفال والعودة إلى شاشة الحسابات (الافتراضي: ${DEFAULT_KIDS_EXIT_PIN})`}
        errorHint={`رمز PIN غير صحيح. الرمز الافتراضي للخروج هو ${DEFAULT_KIDS_EXIT_PIN}`}
      />

      {/* 7b. PIN Prompt Modal for Admin Panel Access (Default: 6767) */}
      <PinPromptModal
        isOpen={isAdminPinOpen}
        onClose={() => setIsAdminPinOpen(false)}
        onSuccess={() => {
          setIsAdminPinOpen(false);
          setIsAdminPanelOpen(true);
        }}
        expectedPin={adminPin}
        title="دخول لوحة تحكم المسؤول"
        subtitle="أدخل الرمز السري المكون من 4 أرقام للوصول إلى إدارة القنوات والباقات"
        errorHint="الرمز السري غير صحيح. يرجى المحاولة مرة أخرى."
      />

      {/* 7c. Admin Panel Dashboard Modal */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        channels={resolvedAllChannels}
        categories={categories}
        customCovers={effectiveCovers}
        heroChannelIds={heroChannelIds}
        matches={matches}
        notifications={notifications}
        tickerConfig={tickerConfig}
        adminPin={adminPin}
        onAddChannel={handleAdminAddChannel}
        onAddLocalMovie={handleAdminAddLocalMovie}
        onPlayChannel={(ch) => {
          setIsAdminPanelOpen(false);
          handlePlayChannel(ch);
        }}
        onUpdateChannel={handleAdminUpdateChannel}
        onDeleteChannel={handleAdminDeleteChannel}
        onToggleHeroChannel={handleToggleHeroChannel}
        onAddMatch={handleAddMatch}
        onUpdateMatch={handleUpdateMatch}
        onDeleteMatch={handleDeleteMatch}
        onToggleMatchStatus={handleToggleMatchStatus}
        onSendNotification={(title, message, type) =>
          dispatchNotification(title, message, type)
        }
        onDeleteNotification={(id) =>
          setNotifications((prev) => prev.filter((n) => n.id !== id))
        }
        onUpdateTickerConfig={setTickerConfig}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        onReorderCategories={handleReorderCategories}
        onUpdateAdminPin={setAdminPin}
        subscriptionConfig={subscriptionConfig}
        activeSubscription={activeSubscription}
        onUpdateSubscriptionConfig={setSubscriptionConfig}
        onLockSubscriptionGate={handleLockSubscriptionGate}
        onImportBackup={handleImportBackup}
        onResetDefaults={handleResetDefaults}
      />

      {/* 8. Smart Virtual Remote Modal (Works with Touch & Keyboard + Live CH Switching) */}
      <RemoteControlModal
        isOpen={isRemoteModalOpen}
        onClose={() => setIsRemoteModalOpen(false)}
        onNextChannel={handleNextChannel}
        onPrevChannel={handlePrevChannel}
        onTogglePlay={() => setRemotePlaySignal((s) => s + 1)}
        onStop={() => {
          setIsPlayerOpen(false);
          setIsPlayerMinimized(false);
          setPlayingChannel(null);
        }}
        onBack={() => {
          if (isPlayerOpen && !isPlayerMinimized) {
            setIsPlayerOpen(false);
            setPlayingChannel(null);
          } else {
            setIsRemoteModalOpen(false);
          }
        }}
        onToggleFullscreen={() => {
          if (isPlayerOpen && !isPlayerMinimized) {
            setRemoteFullscreenSignal((s) => s + 1);
          } else if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        }}
        onVolumeChange={(v) => {
          setPlayerVolume(v);
          if (v > 0 && playerMuted) setPlayerMuted(false);
        }}
        currentVolume={playerVolume}
        onToggleMute={() => setPlayerMuted((m) => !m)}
        isMuted={playerMuted}
        onSelectChannelByNumber={(num) => {
          const ch = visibleChannels[num - 1];
          if (ch) handlePlayChannel(ch);
        }}
        channels={visibleChannels}
        isPlayerActive={isPlayerOpen}
        activeChannelName={playingChannel?.name}
        focusedChannelName={
          focusedChannelIndex !== null ? visibleChannels[focusedChannelIndex]?.name : undefined
        }
        onNavigateGrid={handleRemoteNavigateGrid}
        onConfirmFocus={handleRemoteConfirmFocus}
      />

      {/* 9. URL Import Modal */}
      <UrlImportModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onAddChannel={handleAddChannel}
        onLoadM3uFromUrl={handleLoadM3uFromUrl}
      />

      {/* 10. Python Windows Standalone Modal */}
      <PythonWindowsExportModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />
    </div>
  );
}
