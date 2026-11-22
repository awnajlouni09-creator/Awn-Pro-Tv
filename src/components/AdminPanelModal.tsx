import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  PlusCircle,
  LayoutList,
  FolderPlus,
  Database,
  Search,
  Pencil,
  Trash2,
  Sparkles,
  Download,
  Upload,
  KeyRound,
  Check,
  AlertCircle,
  Youtube,
  Radio,
  Image as ImageIcon,
  RotateCcw,
  Save,
  Trophy,
  Clock,
  Play,
  Bell,
  Megaphone,
  Send,
  Flame,
  Radio as RadioIcon,
  HardDrive,
  Loader2,
  FileVideo,
  CreditCard,
  Gift,
  Lock,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  GripVertical
} from 'lucide-react';
import { Channel, TitleReview } from '../types/iptv';
import { MatchItem, MatchStatus, TournamentId } from '../types/matches';
import { AppNotification, BreakingTickerConfig, NotificationType } from '../types/notifications';
import { SubscriptionConfig, ActiveSubscription } from '../types/subscription';
import { TOURNAMENT_LIST, TOURNAMENT_THEMES } from '../data/defaultMatches';
import { ChannelThumbnail } from './ChannelThumbnail';
import {
  extractYouTubeVideoId,
  extractYouTubeEmbedUrl,
  detectMediaType,
  getYouTubeThumbnails
} from '../utils/mediaHelper';
import { formatFileSize } from '../utils/localMediaDb';
import {
  AdminTitleDetailsFields,
  TitleDetailsDraft,
  createEmptyTitleDetailsDraft,
  createDraftFromChannel,
  applyDraftToChannelFields
} from './AdminTitleDetailsFields';
import {
  readAllVisitorReviews,
  getVisitorReviewsForChannel,
  deleteVisitorReviewForChannel
} from '../utils/titleReviewsStorage';

type AdminTab = 'add' | 'manage' | 'matches' | 'notifications' | 'categories' | 'subscription' | 'backup';

export interface AdminBackupPayload {
  version: number;
  exportedAt: string;
  channels: Channel[];
  categories: string[];
  customCovers: Record<string, string>;
  heroChannelIds: string[];
  matches?: MatchItem[];
  tickerConfig?: BreakingTickerConfig;
  adminPin?: string;
  titleReviews?: Record<string, TitleReview[]>;
}

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  categories: string[];
  customCovers: Record<string, string>;
  heroChannelIds: string[];
  matches: MatchItem[];
  notifications: AppNotification[];
  tickerConfig: BreakingTickerConfig;
  adminPin: string;
  onAddChannel: (channel: Channel, customCoverUrl?: string) => void;
  onAddLocalMovie: (params: {
    name: string;
    group: string;
    badge?: string;
    resolution: '4K' | 'FHD' | 'HD' | 'SD';
    videoFile: File;
    posterFile?: File | null;
    posterUrl?: string;
    description?: string;
    extraFields?: Partial<Channel>;
  }) => Promise<Channel>;
  onPlayChannel?: (channel: Channel) => void;
  onUpdateChannel: (
    channel: Channel,
    customCoverUrl?: string | null,
    localUpdates?: {
      newVideoFile?: File | null;
      newPosterFile?: File | null;
      clearLocalPoster?: boolean;
    }
  ) => void | Promise<void>;
  onDeleteChannel: (channelId: string) => void | Promise<void>;
  onToggleHeroChannel: (channelId: string) => void;
  onAddMatch: (match: MatchItem) => void;
  onUpdateMatch: (match: MatchItem) => void;
  onDeleteMatch: (matchId: string) => void;
  onToggleMatchStatus: (matchId: string) => void;
  onSendNotification: (title: string, message: string, type: NotificationType) => void;
  onDeleteNotification: (id: string) => void;
  onUpdateTickerConfig: (config: BreakingTickerConfig) => void;
  onAddCategory: (categoryName: string) => void;
  onDeleteCategory: (categoryName: string) => void;
  onReorderCategories: (nextCategories: string[]) => void;
  onUpdateAdminPin: (newPin: string) => void;
  subscriptionConfig: SubscriptionConfig;
  activeSubscription: ActiveSubscription | null;
  onUpdateSubscriptionConfig: (config: SubscriptionConfig) => void;
  onLockSubscriptionGate: () => void;
  onImportBackup: (payload: AdminBackupPayload) => void;
  onResetDefaults: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  'قنوات إخبارية': 'الأخبار المباشرة (قنوات إخبارية)',
  'أفلام أجنبية': 'الأفلام (أفلام أجنبية)',
  'مسلسلات عربية': 'المسلسلات (مسلسلات عربية)',
  'ملخصات انمي': 'ملخصات أنمي',
  'أغاني وموسيقى': 'الأغاني والموسيقى',
  'قصص وروايات': 'القصص والروايات',
  'أطفال وكرتون': 'الأطفال والكرتون',
  'وثائقيات أبو الصادق': 'وثائقيات أبو الصادق',
  'وثائقي وطبيعة': 'وثائقي وطبيعة',
  'إسلاميات ودين': 'إسلاميات ودين',
  'رياضة وسرعة': 'رياضة وسرعة',
  'منصات ذكية': 'منصات ذكية'
};

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  channels,
  categories,
  customCovers,
  heroChannelIds,
  matches,
  notifications,
  tickerConfig,
  adminPin,
  onAddChannel,
  onAddLocalMovie,
  onPlayChannel,
  onUpdateChannel,
  onDeleteChannel,
  onToggleHeroChannel,
  onAddMatch,
  onUpdateMatch,
  onDeleteMatch,
  onToggleMatchStatus,
  onSendNotification,
  onDeleteNotification,
  onUpdateTickerConfig,
  onAddCategory,
  onDeleteCategory,
  onReorderCategories,
  onUpdateAdminPin,
  subscriptionConfig,
  activeSubscription,
  onUpdateSubscriptionConfig,
  onLockSubscriptionGate,
  onImportBackup,
  onResetDefaults
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('add');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Form State (Supports URL stream OR Local Device Video via IndexedDB)
  const [addSourceType, setAddSourceType] = useState<'url' | 'local'>('url');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newGroup, setNewGroup] = useState(categories[0] || 'قنوات إخبارية');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newResolution, setNewResolution] = useState<'4K' | 'FHD' | 'HD' | 'SD'>('FHD');
  const [newDescription, setNewDescription] = useState('');
  const [addDetailsDraft, setAddDetailsDraft] = useState<TitleDetailsDraft>(createEmptyTitleDetailsDraft);
  const [localVideoFile, setLocalVideoFile] = useState<File | null>(null);
  const [localPosterFile, setLocalPosterFile] = useState<File | null>(null);
  const [localPosterPreview, setLocalPosterPreview] = useState<string | null>(null);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [lastSavedLocalChannel, setLastSavedLocalChannel] = useState<Channel | null>(null);
  const localVideoInputRef = useRef<HTMLInputElement>(null);
  const localPosterInputRef = useRef<HTMLInputElement>(null);

  // Manage Tab State
  const [manageSearch, setManageSearch] = useState('');
  const [manageFilterGroup, setManageFilterGroup] = useState<string>('ALL');
  const [manageOnlyLocal, setManageOnlyLocal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editBadge, setEditBadge] = useState('');
  const [editResolution, setEditResolution] = useState<'4K' | 'FHD' | 'HD' | 'SD'>('FHD');
  const [editDescription, setEditDescription] = useState('');
  const [editDetailsDraft, setEditDetailsDraft] = useState<TitleDetailsDraft>(createEmptyTitleDetailsDraft);
  const [editVisitorReviews, setEditVisitorReviews] = useState<TitleReview[]>([]);
  const [editLocalVideoFile, setEditLocalVideoFile] = useState<File | null>(null);
  const [editLocalPosterFile, setEditLocalPosterFile] = useState<File | null>(null);
  const [editLocalPosterPreview, setEditLocalPosterPreview] = useState<string | null>(null);
  const [clearEditPoster, setClearEditPoster] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editLocalVideoInputRef = useRef<HTMLInputElement>(null);
  const editLocalPosterInputRef = useRef<HTMLInputElement>(null);

  // Matches Tab State
  const [matchTournament, setMatchTournament] = useState<TournamentId>('ucl');
  const [matchHomeTeam, setMatchHomeTeam] = useState('');
  const [matchAwayTeam, setMatchAwayTeam] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [matchCountdownMins, setMatchCountdownMins] = useState('45');
  const [matchChannelName, setMatchChannelName] = useState('beIN Sports 1 HD');
  const [matchStreamUrl, setMatchStreamUrl] = useState('');
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('upcoming');
  const [editingMatch, setEditingMatch] = useState<MatchItem | null>(null);
  const [confirmDeleteMatchId, setConfirmDeleteMatchId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Notifications & Breaking News Ticker State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<NotificationType>('urgent');
  const [tickerDraft, setTickerDraft] = useState<BreakingTickerConfig>(tickerConfig);

  useEffect(() => {
    setTickerDraft(tickerConfig);
  }, [tickerConfig]);

  // Categories Tab State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);
  const [draggedCategoryIdx, setDraggedCategoryIdx] = useState<number | null>(null);
  const [dragOverCategoryIdx, setDragOverCategoryIdx] = useState<number | null>(null);

  // Subscription Settings State
  const [subDraft, setSubDraft] = useState<SubscriptionConfig>(subscriptionConfig);
  const [newGiftCodeInput, setNewGiftCodeInput] = useState('');

  useEffect(() => {
    setSubDraft(subscriptionConfig);
  }, [subscriptionConfig]);

  // Backup & PIN Tab State
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // YouTube & Local Poster auto-preview for Add Form
  const addYoutubeId = useMemo(() => extractYouTubeVideoId(newUrl), [newUrl]);
  const addMediaType = useMemo(() => detectMediaType(newUrl), [newUrl]);
  const addPreviewImg = useMemo(() => {
    if (localPosterPreview) return localPosterPreview;
    if (newCoverUrl.trim()) return newCoverUrl.trim();
    if (addSourceType === 'url' && addYoutubeId) return getYouTubeThumbnails(addYoutubeId).hq;
    return null;
  }, [localPosterPreview, newCoverUrl, addYoutubeId, addSourceType]);

  const localMoviesCount = useMemo(
    () => channels.filter((ch) => ch.isLocalSaved).length,
    [channels]
  );

  // Filtered channels for Manage tab
  const filteredManageChannels = useMemo(() => {
    const q = manageSearch.toLowerCase().trim();
    return channels.filter((ch) => {
      const matchesGroup = manageFilterGroup === 'ALL' || ch.group === manageFilterGroup;
      const matchesLocal = !manageOnlyLocal || !!ch.isLocalSaved;
      const matchesQuery =
        !q ||
        ch.name.toLowerCase().includes(q) ||
        ch.group.toLowerCase().includes(q) ||
        ch.url.toLowerCase().includes(q) ||
        (ch.fileName || '').toLowerCase().includes(q);
      return matchesGroup && matchesLocal && matchesQuery;
    });
  }, [channels, manageSearch, manageFilterGroup, manageOnlyLocal]);

  if (!isOpen) return null;

  const buildChannelFromInputs = (
    id: string,
    name: string,
    rawUrl: string,
    group: string,
    badge?: string,
    resolution: '4K' | 'FHD' | 'HD' | 'SD' = 'FHD',
    existing?: Channel,
    description?: string
  ): Channel => {
    const trimmedUrl = rawUrl.trim();
    const ytId = extractYouTubeVideoId(trimmedUrl);
    const detected = detectMediaType(trimmedUrl);
    const mappedType: Channel['type'] =
      detected === 'youtube'
        ? 'youtube'
        : detected === 'hls'
        ? 'hls'
        : detected === 'netflix'
        ? 'netflix'
        : detected === 'web'
        ? 'web'
        : existing?.type || 'live';

    const cleanedDescription =
      description !== undefined ? description.trim() || undefined : existing?.description;

    return {
      ...existing,
      id,
      name: name.trim(),
      url: trimmedUrl,
      group,
      type: mappedType,
      youtubeId: ytId || undefined,
      embedUrl: ytId ? extractYouTubeEmbedUrl(trimmedUrl) || undefined : undefined,
      resolution: existing ? resolution : resolution,
      badge: badge?.trim() || undefined,
      description: cleanedDescription,
      logo: undefined
    };
  };

  const handleSelectLocalVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalVideoFile(file);
    if (!newName.trim()) {
      setNewName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSelectLocalPosterFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localPosterPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(localPosterPreview);
    }
    setLocalPosterFile(file);
    setLocalPosterPreview(URL.createObjectURL(file));
    setNewCoverUrl('');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetGroup = newGroup || categories[0] || 'أفلام أجنبية';

    if (addSourceType === 'local') {
      if (!localVideoFile) {
        showToast('يرجى اختيار ملف الفيلم من جهازك أولاً.', 'error');
        return;
      }
      if (!newName.trim()) {
        showToast('يرجى كتابة اسم الفيلم.', 'error');
        return;
      }

      setIsSavingLocal(true);
      try {
        const createdChannel = await onAddLocalMovie({
          name: newName,
          group: targetGroup,
          badge: newBadge,
          resolution: newResolution,
          videoFile: localVideoFile,
          posterFile: localPosterFile,
          posterUrl: newCoverUrl.trim() || undefined,
          description: newDescription.trim() || undefined,
          extraFields: applyDraftToChannelFields(addDetailsDraft)
        });

        if (localPosterPreview?.startsWith('blob:')) {
          URL.revokeObjectURL(localPosterPreview);
        }
        const savedTitle = newName.trim();
        setLastSavedLocalChannel(createdChannel);
        setNewName('');
        setNewCoverUrl('');
        setNewBadge('');
        setNewDescription('');
        setAddDetailsDraft(createEmptyTitleDetailsDraft());
        setLocalVideoFile(null);
        setLocalPosterFile(null);
        setLocalPosterPreview(null);
        if (localVideoInputRef.current) localVideoInputRef.current.value = '';
        if (localPosterInputRef.current) localPosterInputRef.current.value = '';
        showToast(
          `تم حفظ الفيلم "${savedTitle}" في قاعدة بيانات التطبيق وباقة "${CATEGORY_LABELS[targetGroup] || targetGroup}" بنجاح!`
        );
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'تعذر حفظ الفيلم في قاعدة بيانات المتصفح.',
          'error'
        );
      } finally {
        setIsSavingLocal(false);
      }
      return;
    }

    if (!newName.trim() || !newUrl.trim()) return;

    const id = `ch-admin-${Date.now()}`;
    const baseChannel = buildChannelFromInputs(
      id,
      newName,
      newUrl,
      targetGroup,
      newBadge,
      newResolution,
      undefined,
      newDescription
    );
    const channel: Channel = {
      ...baseChannel,
      ...applyDraftToChannelFields(addDetailsDraft)
    };

    onAddChannel(channel, newCoverUrl.trim() || undefined);
    setNewName('');
    setNewUrl('');
    setNewCoverUrl('');
    setNewBadge('');
    setNewDescription('');
    setAddDetailsDraft(createEmptyTitleDetailsDraft());
    showToast(`تمت إضافة "${channel.name}" إلى باقة "${CATEGORY_LABELS[channel.group] || channel.group}" بنجاح`);
  };

  const openEditChannel = (ch: Channel) => {
    setEditingChannel(ch);
    setEditName(ch.name);
    setEditUrl(ch.url);
    setEditGroup(ch.group);
    const existingCover = customCovers[ch.id] || ch.logo || '';
    setEditCoverUrl(existingCover.startsWith('blob:') ? '' : existingCover);
    setEditLocalPosterPreview(existingCover.startsWith('blob:') ? existingCover : null);
    setEditLocalPosterFile(null);
    setEditLocalVideoFile(null);
    setClearEditPoster(false);
    setEditBadge(ch.badge || '');
    setEditResolution(ch.resolution || 'FHD');
    setEditDescription(ch.description || '');
    setEditDetailsDraft(createDraftFromChannel(ch));
    setEditVisitorReviews(getVisitorReviewsForChannel(ch.id));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel || !editName.trim()) return;

    if (editingChannel.isLocalSaved) {
      setIsSavingEdit(true);
      try {
        const updated: Channel = {
          ...editingChannel,
          name: editName.trim(),
          group: editGroup,
          badge: editBadge.trim() || undefined,
          resolution: editResolution,
          description: editDescription.trim() || undefined,
          ...applyDraftToChannelFields(editDetailsDraft)
        };

        // Determine cover update precedence: uploaded file vs URL vs cleared
        let coverUrlUpdate: string | null | undefined = undefined;
        let clearLocalPoster = clearEditPoster;

        if (editLocalPosterFile) {
          coverUrlUpdate = null;
          clearLocalPoster = false;
        } else if (editCoverUrl.trim()) {
          coverUrlUpdate = editCoverUrl.trim();
          clearLocalPoster = true;
        } else if (clearEditPoster) {
          coverUrlUpdate = null;
          clearLocalPoster = true;
        }

        await onUpdateChannel(updated, coverUrlUpdate, {
          newVideoFile: editLocalVideoFile,
          newPosterFile: editLocalPosterFile,
          clearLocalPoster
        });

        setEditingChannel(null);
        setEditLocalVideoFile(null);
        setEditLocalPosterFile(null);
        setEditLocalPosterPreview(null);
        if (editLocalVideoInputRef.current) editLocalVideoInputRef.current.value = '';
        if (editLocalPosterInputRef.current) editLocalPosterInputRef.current.value = '';
        showToast(`تم تحديث الفيلم المحلي "${updated.name}" بنجاح`);
      } catch {
        showToast('حدث خطأ أثناء تحديث ملف الفيلم المحلي.', 'error');
      } finally {
        setIsSavingEdit(false);
      }
      return;
    }

    if (!editUrl.trim()) return;

    const baseUpdated = buildChannelFromInputs(
      editingChannel.id,
      editName,
      editUrl,
      editGroup,
      editBadge,
      editResolution,
      editingChannel,
      editDescription
    );
    const updated: Channel = {
      ...baseUpdated,
      ...applyDraftToChannelFields(editDetailsDraft)
    };

    await onUpdateChannel(updated, editCoverUrl.trim() || null);
    setEditingChannel(null);
    showToast(`تم تحديث "${updated.name}" وحفظ التغييرات`);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newCategoryName.trim();
    if (!cleaned) return;
    if (categories.includes(cleaned)) {
      showToast('هذه الباقة موجودة بالفعل!', 'error');
      return;
    }
    onAddCategory(cleaned);
    setNewCategoryName('');
    showToast(`تمت إضافة الباقة الجديدة "${cleaned}"`);
  };

  const handleAddMatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchHomeTeam.trim() || !matchAwayTeam.trim()) return;

    const mins = parseInt(matchCountdownMins, 10);
    const kickoffTimestamp =
      matchStatus === 'upcoming' && !isNaN(mins) && mins > 0
        ? Date.now() + mins * 60 * 1000
        : undefined;

    const newMatch: MatchItem = {
      id: `match-${Date.now()}`,
      tournament: matchTournament,
      homeTeam: matchHomeTeam.trim(),
      awayTeam: matchAwayTeam.trim(),
      matchTime: matchTime.trim() || 'اليوم · توقيت مكة والأردن',
      channelName: matchChannelName.trim() || 'beIN Sports 1 HD',
      streamUrl: matchStreamUrl.trim(),
      status: matchStatus,
      kickoffTimestamp
    };

    onAddMatch(newMatch);
    setMatchHomeTeam('');
    setMatchAwayTeam('');
    setMatchTime('');
    setMatchStreamUrl('');
    showToast(`تمت إضافة مباراة "${newMatch.homeTeam} × ${newMatch.awayTeam}" بنجاح`);
  };

  const handleSaveEditMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch || !editingMatch.homeTeam.trim() || !editingMatch.awayTeam.trim()) return;
    onUpdateMatch({
      ...editingMatch,
      homeTeam: editingMatch.homeTeam.trim(),
      awayTeam: editingMatch.awayTeam.trim(),
      matchTime: editingMatch.matchTime.trim(),
      channelName: editingMatch.channelName.trim(),
      streamUrl: editingMatch.streamUrl.trim()
    });
    setEditingMatch(null);
    showToast('تم حفظ تعديلات المباراة بنجاح');
  };

  const handleSendNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    onSendNotification(notifTitle.trim(), notifMessage.trim(), notifType);
    setNotifTitle('');
    setNotifMessage('');
    showToast('تم إرسال الإشعار لجميع المستخدمين فوراً!');
  };

  const handleSaveTickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTickerConfig(tickerDraft);
    showToast(
      tickerDraft.enabled
        ? 'تم تفعيل وحفظ شريط الأخبار العاجلة بنجاح'
        : 'تم إيقاف شريط الأخبار العاجلة'
    );
  };

  const handleExportJson = () => {
    const titleReviews = readAllVisitorReviews();
    const payload: AdminBackupPayload = {
      version: 4,
      exportedAt: new Date().toISOString(),
      channels,
      categories,
      customCovers,
      heroChannelIds,
      matches,
      tickerConfig,
      adminPin,
      titleReviews
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `awn-tv-pro-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('تم تصدير النسخة الاحتياطية (JSON) بنجاح');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed || !Array.isArray(parsed.channels)) {
          showToast('ملف النسخة الاحتياطية غير صالح.', 'error');
          return;
        }
        onImportBackup({
          version: parsed.version || 1,
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          channels: parsed.channels,
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : categories,
          customCovers: parsed.customCovers && typeof parsed.customCovers === 'object' ? parsed.customCovers : {},
          heroChannelIds: Array.isArray(parsed.heroChannelIds) ? parsed.heroChannelIds : [],
          matches: Array.isArray(parsed.matches) ? parsed.matches : undefined,
          tickerConfig: parsed.tickerConfig && typeof parsed.tickerConfig === 'object' ? parsed.tickerConfig : undefined,
          adminPin: typeof parsed.adminPin === 'string' && /^\d{4}$/.test(parsed.adminPin) ? parsed.adminPin : undefined,
          titleReviews:
            parsed.titleReviews && typeof parsed.titleReviews === 'object' && !Array.isArray(parsed.titleReviews)
              ? (parsed.titleReviews as Record<string, TitleReview[]>)
              : undefined
        });
        showToast(`تم استيراد ${parsed.channels.length} قناة والإعدادات بنجاح!`);
      } catch {
        showToast('تعذر قراءة ملف JSON. تأكد من سلامة الملف.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pinInput)) {
      showToast('يجب أن يتكون الرمز السري من 4 أرقام فقط.', 'error');
      return;
    }
    if (pinInput !== pinConfirm) {
      showToast('الرمز الجديد وتأكيده غير متطابقين.', 'error');
      return;
    }
    onUpdateAdminPin(pinInput);
    setPinInput('');
    setPinConfirm('');
    showToast('تم تغيير الرمز السري للوحة التحكم بنجاح!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 select-none">
      <div className="bg-[#0e0e0e] border border-[#2a2a2a] w-full max-w-5xl h-[92vh] sm:h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-l from-[#1a0507] via-[#141414] to-[#141414] border-b border-[#262626] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e50914] to-[#800000] flex items-center justify-center shadow-lg shadow-[#e50914]/30 border border-[#ff4d4d]/40">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="text-right">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>لوحة تحكم المسؤول</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#e50914]/20 text-[#ff4d4d] border border-[#e50914]/40">
                  ADMIN
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                إدارة القنوات، الباقات، البانر الرئيسي والنسخ الاحتياطي (حفظ تلقائي)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-[#e50914] text-zinc-300 hover:text-white border border-zinc-700 hover:border-[#e50914] text-xs font-bold transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">إغلاق وتحديث الواجهة</span>
          </button>
        </div>

        {/* Toast Notification Banner */}
        {toast && (
          <div
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b shrink-0 animate-in fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/60 border-[#e50914]/40 text-[#ff4d4d]'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 bg-[#121212] border-b border-[#242424] flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
              activeTab === 'add'
                ? 'bg-[#1b1b1b] text-white border-[#e50914]'
                : 'text-zinc-400 hover:text-white border-transparent'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-[#e50914]" />
            <span>إضافة محتوى جديد</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
              activeTab === 'manage'
                ? 'bg-[#1b1b1b] text-white border-[#e50914]'
                : 'text-zinc-400 hover:text-white border-transparent'
            }`}
          >
            <LayoutList className="w-4 h-4 text-[#ff4d4d]" />
            <span>إدارة المحتوى الحالي ({channels.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
              activeTab === 'matches'
                ? 'bg-[#1b1b1b] text-white border-[#e50914]'
                : 'text-zinc-400 hover:text-white border-transparent'
            }`}
          >
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>إدارة المباريات ({matches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
              activeTab === 'notifications'
                ? 'bg-[#1b1b1b] text-white border-[#e50914]'
                : 'text-zinc-400 hover:text-white border-transparent'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>مركز الإشعارات والرسائل</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
              activeTab === 'categories'
                ? 'bg-[#1b1b1b] text-white border-[#e50914]'
                : 'text-zinc-400 hover:text-white border-transparent'
            }`}
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>إدارة الباقات ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
              activeTab === 'subscription'
                ? 'bg-[#1b1b1b] text-white border-[#e50914]'
                : 'text-zinc-400 hover:text-white border-transparent'
            }`}
          >
            <CreditCard className="w-4 h-4 text-sky-400" />
            <span>الاشتراك و PayPal</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
              activeTab === 'backup'
                ? 'bg-[#1b1b1b] text-white border-[#e50914]'
                : 'text-zinc-400 hover:text-white border-transparent'
            }`}
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>النسخ الاحتياطي والإعدادات</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: ADD NEW CONTENT (STREAM URL OR LOCAL DEVICE MOVIE) */}
          {activeTab === 'add' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-[#151515] border border-[#282828] rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white mb-1 flex items-center gap-2">
                      <PlusCircle className="w-5 h-5 text-[#e50914]" />
                      <span>إضافة قناة، فيلم، مسلسل، أو أغنية جديدة</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      أضف بثاً عبر رابط مباشر/يوتيوب أو ارفع أفلاماً من جهازك لحفظها دائماً في قاعدة بيانات التطبيق.
                    </p>
                  </div>
                </div>

                {/* Source Type Toggle Switch */}
                <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#0c0c0c] border border-[#272727] mb-5">
                  <button
                    type="button"
                    onClick={() => setAddSourceType('url')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      addSourceType === 'url'
                        ? 'bg-[#e50914] text-white shadow-lg shadow-[#e50914]/30'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Youtube className="w-4 h-4" />
                    <span>رابط بث / يوتيوب</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAddSourceType('local');
                      if (newGroup === 'قنوات إخبارية' && categories.includes('أفلام أجنبية')) {
                        setNewGroup('أفلام أجنبية');
                      }
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      addSourceType === 'local'
                        ? 'bg-[#e50914] text-white shadow-lg shadow-[#e50914]/30'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>رفع فيلم من الجهاز</span>
                    <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded bg-black/30 border border-white/20">
                      IndexedDB
                    </span>
                  </button>
                </div>

                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        {addSourceType === 'local' ? 'اسم الفيلم أو الفيديو *' : 'اسم القناة أو البرنامج *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={
                          addSourceType === 'local'
                            ? 'مثال: فيلم الأكشن المفضل، حلقة خاصة...'
                            : 'مثال: قناة الجزيرة، أغنية جديدة، شباب البومب...'
                        }
                        className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none transition-all"
                      />
                    </div>

                    {/* Category Dropdown */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        اختر الباقة (التصنيف) *
                      </label>
                      <select
                        value={newGroup}
                        onChange={(e) => setNewGroup(e.target.value)}
                        className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none cursor-pointer"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {CATEGORY_LABELS[cat] || cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* SOURCE MODE 1: URL INPUT */}
                  {addSourceType === 'url' ? (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        رابط البث أو فيديو يوتيوب *
                      </label>
                      <input
                        type="url"
                        required
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... أو https://.../stream.m3u8"
                        className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono text-left dir-ltr"
                      />
                      {newUrl.trim() && (
                        <div className="mt-2 flex items-center gap-2 text-[11px]">
                          {addYoutubeId ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/60 border border-[#e50914]/40 text-[#ff6666] font-semibold">
                              <Youtube className="w-3.5 h-3.5" />
                              <span>تم التعرف على يوتيوب ({addYoutubeId}) وسحب الصورة المصغرة تلقائياً</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
                              <Radio className="w-3.5 h-3.5 text-emerald-400" />
                              <span>نوع الرابط المكتشف: {addMediaType.toUpperCase()}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SOURCE MODE 2: UPLOAD LOCAL VIDEO FILE (IndexedDB) */
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        ملف الفيلم من جهازك (MP4, MKV, WebM, AVI) *
                      </label>
                      <input
                        ref={localVideoInputRef}
                        type="file"
                        accept="video/mp4,video/x-matroska,video/webm,video/x-msvideo,.mp4,.mkv,.webm,.avi,video/*"
                        onChange={handleSelectLocalVideoFile}
                        className="hidden"
                      />
                      <div
                        onClick={() => localVideoInputRef.current?.click()}
                        className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 ${
                          localVideoFile
                            ? 'bg-emerald-950/20 border-emerald-500/50 hover:border-emerald-400'
                            : 'bg-[#1a1a1a] border-[#383838] hover:border-[#e50914] hover:bg-[#1f1315]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                              localVideoFile
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-[#e50914]/15 text-[#ff4d4d]'
                            }`}
                          >
                            <FileVideo className="w-5 h-5" />
                          </div>
                          <div className="text-right min-w-0">
                            {localVideoFile ? (
                              <>
                                <p className="text-xs font-extrabold text-white truncate max-w-[260px] sm:max-w-md">
                                  {localVideoFile.name}
                                </p>
                                <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                                  جاهز للحفظ في IndexedDB · الحجم: {formatFileSize(localVideoFile.size)}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs font-bold text-white">
                                  اضغط هنا لاختيار ملف الفيديو من جهازك
                                </p>
                                <p className="text-[11px] text-zinc-400 mt-0.5">
                                  يدعم MP4, MKV, WebM, AVI — يُحفظ داخلياً ليعمل حتى بعد إغلاق التطبيق
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        <span className="px-4 py-2 rounded-xl bg-[#e50914] text-white text-[11px] font-bold shrink-0">
                          {localVideoFile ? 'تغيير الملف' : 'اختيار ملف فيديو'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Poster Cover (URL + Device Image Upload) + Badge + Resolution */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-xs font-semibold text-zinc-300">
                        صورة الغلاف / البوستر (رابط أو رفع من الجهاز)
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          value={newCoverUrl}
                          onChange={(e) => {
                            setNewCoverUrl(e.target.value);
                            if (localPosterFile) {
                              if (localPosterPreview?.startsWith('blob:')) {
                                URL.revokeObjectURL(localPosterPreview);
                              }
                              setLocalPosterFile(null);
                              setLocalPosterPreview(null);
                            }
                          }}
                          placeholder={
                            addSourceType === 'local'
                              ? 'ألصق رابط صورة البوستر أو ارفع صورة من الزر...'
                              : 'اتركه فارغاً لاستخدام صورة يوتيوب التلقائية...'
                          }
                          className="flex-1 h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono text-left dir-ltr"
                        />
                        <input
                          ref={localPosterInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleSelectLocalPosterFile}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => localPosterInputRef.current?.click()}
                          className="h-11 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-600 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#ff4d4d]" />
                          <span>{localPosterFile ? 'تغيير البوستر' : 'رفع بوستر'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-2">شارة (اختياري)</label>
                        <input
                          type="text"
                          value={newBadge}
                          onChange={(e) => setNewBadge(e.target.value)}
                          placeholder={addSourceType === 'local' ? 'فيلم محلي' : 'LIVE / جديد'}
                          className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-2">الجودة</label>
                        <select
                          value={newResolution}
                          onChange={(e) => setNewResolution(e.target.value as '4K' | 'FHD' | 'HD' | 'SD')}
                          className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-2 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none cursor-pointer"
                        >
                          <option value="4K">4K</option>
                          <option value="FHD">FHD</option>
                          <option value="HD">HD</option>
                          <option value="SD">SD</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Synopsis / Description */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      نبذة / وصف العمل (اختياري)
                    </label>
                    <textarea
                      rows={2}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="اكتب نبذة مختصرة وجذابة عن قصة الفيلم أو المسلسل أو محتوى القناة..."
                      className="w-full bg-[#1e1e1e] text-white text-xs p-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Two-Tone Colors, Backdrop, Metadata, Cast & Reviews */}
                  <AdminTitleDetailsFields
                    draft={addDetailsDraft}
                    onChange={setAddDetailsDraft}
                  />

                  {/* Live Cover Preview */}
                  {addPreviewImg && (
                    <div className="p-3 bg-[#101010] border border-[#252525] rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={addPreviewImg}
                          alt="معاينة الغلاف"
                          referrerPolicy="no-referrer"
                          className="w-28 aspect-video rounded-lg object-cover border border-white/10"
                        />
                        <div className="text-xs text-zinc-300">
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-[#e50914]" />
                            <span>معاينة صورة الغلاف</span>
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {localPosterFile
                              ? `صورة مرفوعة من الجهاز (${localPosterFile.name})`
                              : newCoverUrl.trim()
                              ? 'صورة غلاف مخصصة عبر رابط'
                              : 'صورة مصغرة تلقائية من يوتيوب'}
                          </p>
                        </div>
                      </div>
                      {localPosterFile && (
                        <button
                          type="button"
                          onClick={() => {
                            if (localPosterPreview?.startsWith('blob:')) {
                              URL.revokeObjectURL(localPosterPreview);
                            }
                            setLocalPosterFile(null);
                            setLocalPosterPreview(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold cursor-pointer"
                        >
                          إزالة
                        </button>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    {lastSavedLocalChannel && addSourceType === 'local' ? (
                      <div className="flex flex-wrap items-center gap-2 bg-emerald-950/40 border border-emerald-500/35 px-3 py-2 rounded-xl text-xs">
                        <span className="text-emerald-300 font-bold">
                          تم حفظ "{lastSavedLocalChannel.name}" ✓
                        </span>
                        {onPlayChannel && (
                          <button
                            type="button"
                            onClick={() => onPlayChannel(lastSavedLocalChannel)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] cursor-pointer flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>تشغيل الآن</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('manage');
                            setManageOnlyLocal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          إدارة أفلام الجهاز
                        </button>
                      </div>
                    ) : (
                      <div />
                    )}
                    <button
                      type="submit"
                      disabled={isSavingLocal}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#e50914] hover:bg-[#ff1a1a] disabled:opacity-60 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-[#e50914]/30 transition-all cursor-pointer active:scale-95"
                    >
                      {isSavingLocal ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري الحفظ في قاعدة البيانات...</span>
                        </>
                      ) : addSourceType === 'local' ? (
                        <>
                          <HardDrive className="w-4 h-4" />
                          <span>حفظ الفيلم في التطبيق</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4" />
                          <span>إضافة وحفظ المحتوى</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE EXISTING CONTENT */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              {/* Search & Filter Header */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manageSearch}
                    onChange={(e) => setManageSearch(e.target.value)}
                    placeholder="ابحث عن قناة، فيلم، فيلم محلي، أغنية، أو رابط..."
                    className="w-full h-11 bg-[#181818] text-white text-xs pr-10 pl-4 rounded-xl border border-[#2c2c2c] focus:border-[#e50914] focus:outline-none"
                  />
                </div>
                <select
                  value={manageFilterGroup}
                  onChange={(e) => setManageFilterGroup(e.target.value)}
                  className="h-11 bg-[#181818] text-white text-xs px-3.5 rounded-xl border border-[#2c2c2c] focus:border-[#e50914] focus:outline-none cursor-pointer sm:w-56"
                >
                  <option value="ALL">جميع الباقات ({channels.length})</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat] || cat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setManageOnlyLocal((prev) => !prev)}
                  className={`h-11 px-3.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                    manageOnlyLocal
                      ? 'bg-[#e50914] text-white border-[#e50914]'
                      : 'bg-[#181818] text-zinc-300 border-[#2c2c2c] hover:border-[#e50914]/60'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>أفلام الجهاز ({localMoviesCount})</span>
                </button>
              </div>

              {/* Channels List */}
              <div className="space-y-2.5">
                {filteredManageChannels.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500 text-xs">
                    لا توجد عناصر مطابقة لبحثك.
                  </div>
                ) : (
                  filteredManageChannels.map((ch) => {
                    const isHero = heroChannelIds.includes(ch.id);
                    const isDeleting = confirmDeleteId === ch.id;

                    return (
                      <div
                        key={ch.id}
                        className={`p-3 rounded-2xl bg-[#151515] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isHero ? 'border-[#e50914]/50 bg-[#1a1012]' : 'border-[#252525] hover:border-[#383838]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-24 aspect-video rounded-lg overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                            <ChannelThumbnail
                              channel={ch}
                              customCover={customCovers[ch.id]}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 text-right">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[220px] sm:max-w-sm">
                                {ch.name}
                              </h4>
                              {ch.isLocalSaved && (
                                <span className="px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 text-[10px] font-extrabold flex items-center gap-1">
                                  <HardDrive className="w-2.5 h-2.5" />
                                  <span>ملف محلي محفوظ</span>
                                </span>
                              )}
                              {isHero && (
                                <span className="px-2 py-0.5 rounded-full bg-[#e50914] text-white text-[10px] font-black flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>بانر رئيسي</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                {CATEGORY_LABELS[ch.group] || ch.group}
                              </span>
                              <span className="font-mono text-zinc-500 uppercase">
                                {ch.isLocalSaved
                                  ? `LOCAL · ${formatFileSize(ch.fileSizeBytes)}`
                                  : ch.type || 'stream'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
                          <button
                            onClick={() => {
                              onToggleHeroChannel(ch.id);
                              showToast(
                                isHero
                                  ? `تمت إزالة "${ch.name}" من البانر الرئيسي`
                                  : `تم تعيين "${ch.name}" في البانر الرئيسي!`
                              );
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                              isHero
                                ? 'bg-[#e50914] text-white border-[#e50914]'
                                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
                            }`}
                            title="تعيين كبانر رئيسي (Hero Banner)"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isHero ? 'بانر رئيسي ✓' : 'تعيين كبانر رئيسي'}</span>
                          </button>

                          <button
                            onClick={() => openEditChannel(ch)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>

                          {isDeleting ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={async () => {
                                  await onDeleteChannel(ch.id);
                                  setConfirmDeleteId(null);
                                  showToast(
                                    ch.isLocalSaved
                                      ? `تم حذف "${ch.name}" وإزالته نهائياً من قاعدة البيانات لتوفير المساحة`
                                      : `تم حذف "${ch.name}"`
                                  );
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-[#e50914] text-white text-[11px] font-bold cursor-pointer"
                              >
                                {ch.isLocalSaved ? 'حذف نهائي' : 'تأكيد الحذف'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-[11px] cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(ch.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-[#e50914] text-[#ff4d4d] hover:text-white border border-[#e50914]/30 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2B: MANAGE MATCHES */}
          {activeTab === 'matches' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Add Match Form */}
              <div className="bg-[#151515] border border-[#282828] rounded-2xl p-4 sm:p-5 shadow-xl">
                <h3 className="text-sm sm:text-base font-extrabold text-white mb-1 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>إضافة مباراة جديدة</span>
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  أضف مباراة وحدد البطولة ورابط البث المباشر وحالتها (قريباً / مباشر الآن).
                </p>

                <form onSubmit={handleAddMatchSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">البطولة *</label>
                      <select
                        value={matchTournament}
                        onChange={(e) => setMatchTournament(e.target.value as TournamentId)}
                        className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none cursor-pointer"
                      >
                        {TOURNAMENT_LIST.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">الفريق الأول (المستضيف) *</label>
                      <input
                        type="text"
                        required
                        value={matchHomeTeam}
                        onChange={(e) => setMatchHomeTeam(e.target.value)}
                        placeholder="مثال: ريال مدريد"
                        className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">الفريق الثاني (الضيف) *</label>
                      <input
                        type="text"
                        required
                        value={matchAwayTeam}
                        onChange={(e) => setMatchAwayTeam(e.target.value)}
                        placeholder="مثال: برشلونة"
                        className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">وقت المباراة (الأردن / مكة)</label>
                      <input
                        type="text"
                        value={matchTime}
                        onChange={(e) => setMatchTime(e.target.value)}
                        placeholder="اليوم 10:00 مساءً"
                        className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">العد التنازلي (بالدقائق)</label>
                      <input
                        type="number"
                        min={1}
                        max={2880}
                        value={matchCountdownMins}
                        onChange={(e) => setMatchCountdownMins(e.target.value)}
                        placeholder="45"
                        className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">اسم القناة الناقلة</label>
                      <input
                        type="text"
                        value={matchChannelName}
                        onChange={(e) => setMatchChannelName(e.target.value)}
                        placeholder="beIN Sports 1 HD"
                        className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">حالة المباراة</label>
                      <select
                        value={matchStatus}
                        onChange={(e) => setMatchStatus(e.target.value as MatchStatus)}
                        className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none cursor-pointer"
                      >
                        <option value="upcoming">قريباً (لم يبدأ البث بعد)</option>
                        <option value="live">مباشر الآن (تفعيل مشاهدة المباراة)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">رابط البث المباشر أو يوتيوب</label>
                      <input
                        type="url"
                        value={matchStreamUrl}
                        onChange={(e) => setMatchStreamUrl(e.target.value)}
                        placeholder="https://www.youtube.com/live/... أو https://.../stream.m3u8"
                        className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono text-left dir-ltr"
                      />
                    </div>

                    <button
                      type="submit"
                      className="h-10 px-5 bg-[#e50914] hover:bg-[#ff1a1a] text-white text-xs font-extrabold rounded-xl shadow-lg cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ إضافة المباراة</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Matches List with One-Click Quick Toggle */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-300">
                  المباريات المسجلة ({matches.length}) — تبديل الحالة بضغطة واحدة:
                </h4>

                {matches.map((m) => {
                  const tInfo = TOURNAMENT_THEMES[m.tournament];
                  const isLive = m.status === 'live';
                  const isDeleting = confirmDeleteMatchId === m.id;

                  return (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-[#151515] border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="text-right min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{ backgroundColor: `${tInfo.accentHex}28`, color: tInfo.accentHex }}
                          >
                            {tInfo.name}
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-white">
                            {m.homeTeam} × {m.awayTeam}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          {m.matchTime} · {m.channelName}
                        </p>
                      </div>

                      {/* Quick Toggle + Edit + Delete */}
                      <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                        <button
                          onClick={() => {
                            if (!isLive && !m.streamUrl.trim()) {
                              showToast('يرجى إضافة رابط البث عبر زر "تعديل" أولاً قبل تفعيل المشاهدة المباشرة.', 'error');
                              setEditingMatch(m);
                              return;
                            }
                            onToggleMatchStatus(m.id);
                            showToast(
                              isLive
                                ? `تم تحويل المباراة إلى حالة "قريباً"`
                                : `تم تفعيل البث المباشر للمباراة ("مشاهدة المباراة")!`
                            );
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border ${
                            isLive
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                              : 'bg-[#e50914] hover:bg-[#ff1a1a] text-white border-[#e50914] shadow-md'
                          }`}
                          title={isLive ? 'تحويل لحالة قريباً' : 'تفعيل فوري لزر مشاهدة المباراة'}
                        >
                          {isLive ? (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>مباشر الآن ✓ (تحويل لقريباً)</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>تفعيل مشاهدة المباراة</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setEditingMatch(m)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        {isDeleting ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                onDeleteMatch(m.id);
                                setConfirmDeleteMatchId(null);
                                showToast('تم حذف المباراة');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#e50914] text-white text-[11px] font-bold cursor-pointer"
                            >
                              تأكيد
                            </button>
                            <button
                              onClick={() => setConfirmDeleteMatchId(null)}
                              className="px-2 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-[11px] cursor-pointer"
                            >
                              لا
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteMatchId(m.id)}
                            className="p-1.5 rounded-xl bg-red-950/40 hover:bg-[#e50914] text-[#ff4d4d] hover:text-white border border-[#e50914]/30 cursor-pointer"
                            title="حذف المباراة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2C: NOTIFICATIONS & BREAKING NEWS TICKER */}
          {activeTab === 'notifications' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* 1. Send Custom Notification Form */}
              <div className="bg-[#151515] border border-[#282828] rounded-2xl p-4 sm:p-6 shadow-xl">
                <h3 className="text-sm sm:text-base font-extrabold text-white mb-1 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>إرسال إشعار ورسالة مخصصة للجميع</span>
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  سيظهر الإشعار فوراً كشريط منبثق على الشاشة وفي جرس التنبيهات لجميع المستخدمين.
                </p>

                <form onSubmit={handleSendNotificationSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">عنوان الإشعار *</label>
                      <input
                        type="text"
                        required
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        placeholder="مثال: انطلاق البث المباشر / حلقات جديدة..."
                        className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">نوع الإشعار *</label>
                      <select
                        value={notifType}
                        onChange={(e) => setNotifType(e.target.value as NotificationType)}
                        className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none cursor-pointer"
                      >
                        <option value="urgent">🔴 تنبيه عاجل أحمر</option>
                        <option value="sports">⚽ خبر رياضي</option>
                        <option value="general">📢 إعلان عام</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">نص الرسالة *</label>
                    <textarea
                      required
                      rows={3}
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      placeholder="اكتب تفاصيل الرسالة أو التنبيه الذي سيصل للمشاهدين..."
                      className="w-full bg-[#1e1e1e] text-white text-xs p-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#e50914] hover:bg-[#ff1a1a] text-white text-xs font-extrabold rounded-xl shadow-lg shadow-[#e50914]/30 transition-all cursor-pointer active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      <span>إرسال الإشعار فوراً</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* 2. Breaking News Ticker Control Card */}
              <div className="bg-[#151515] border border-[#282828] rounded-2xl p-4 sm:p-6 shadow-xl">
                <h3 className="text-sm sm:text-base font-extrabold text-white mb-1 flex items-center gap-2">
                  <RadioIcon className="w-4 h-4 text-[#ff4d4d]" />
                  <span>شريط الأخبار العاجلة المتحرك (أسفل الشاشة)</span>
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  فعّل شريطاً متحركاً لكتابة أي خبر عاجل أو رسالة ترحيبية باسم Awn Tv pro.
                </p>

                <form onSubmit={handleSaveTickerSubmit} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#1b1b1b] border border-[#2c2c2c]">
                    <div>
                      <p className="text-xs font-bold text-white">حالة الشريط الإخباري</p>
                      <p className="text-[11px] text-zinc-400">
                        {tickerDraft.enabled ? 'مفعّل ويظهر حالياً في أسفل الشاشة' : 'متوقف حالياً'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTickerDraft((prev) => ({ ...prev, enabled: !prev.enabled }))}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        tickerDraft.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {tickerDraft.enabled ? 'مفعّل ✓ (اضغط للإيقاف)' : 'معطّل (اضغط للتفعيل)'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">نص الشريط المتحرك</label>
                      <input
                        type="text"
                        value={tickerDraft.text}
                        onChange={(e) => setTickerDraft((prev) => ({ ...prev, text: e.target.value }))}
                        placeholder="أهلاً بكم في Awn Tv pro — تابعوا أبرز المباريات والملخصات..."
                        className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">لون الشريط</label>
                      <select
                        value={tickerDraft.style}
                        onChange={(e) =>
                          setTickerDraft((prev) => ({
                            ...prev,
                            style: e.target.value as 'urgent' | 'sports'
                          }))
                        }
                        className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none cursor-pointer"
                      >
                        <option value="urgent">🔴 عاجل (أحمر وأسود)</option>
                        <option value="sports">🟢 رياضي (أخضر زمردي)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ وتطبيق الشريط</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* 3. Sent Notifications History */}
              <div className="bg-[#151515] border border-[#282828] rounded-2xl p-4 sm:p-5">
                <h4 className="text-xs font-bold text-zinc-300 mb-3">
                  سجل الإشعارات المرسلة ({notifications.length})
                </h4>
                {notifications.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">لم يتم إرسال إشعارات بعد.</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl bg-[#1b1b1b] border border-[#282828] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              n.type === 'urgent'
                                ? 'bg-[#e50914]/20 text-[#ff4d4d]'
                                : n.type === 'sports' || n.type === 'match_alert'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-400/20 text-amber-300'
                            }`}
                          >
                            {n.type === 'urgent' ? (
                              <Flame className="w-4 h-4" />
                            ) : n.type === 'sports' || n.type === 'match_alert' ? (
                              <Trophy className="w-4 h-4" />
                            ) : (
                              <Megaphone className="w-4 h-4" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{n.title}</p>
                            <p className="text-[11px] text-zinc-400 truncate">{n.message}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onDeleteNotification(n.id);
                            showToast('تم حذف الإشعار');
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-[#ff4d4d] hover:bg-red-950/40 cursor-pointer shrink-0"
                          title="حذف الإشعار"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Add Category Box */}
              <div className="bg-[#151515] border border-[#282828] rounded-2xl p-4 sm:p-5">
                <h3 className="text-sm font-extrabold text-white mb-1 flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-amber-400" />
                  <span>إضافة باقة جديدة</span>
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  أنشئ باقة مخصصة جديدة (مثل: بودكاست، برامج طبخ، مسرحيات) لإضافة المحتوى بداخلها.
                </p>

                <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="اكتب اسم الباقة الجديدة..."
                    className="flex-1 h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-6 h-11 bg-[#e50914] hover:bg-[#ff1a1a] text-white text-xs font-extrabold rounded-xl shadow-lg cursor-pointer shrink-0"
                  >
                    + إضافة الباقة
                  </button>
                </form>
              </div>

              {/* Categories List & Display Order */}
              <div className="bg-[#151515] border border-[#282828] rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      ترتيب وظهور الباقات في الواجهة الرئيسية ({categories.length})
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      تحكم بالترتيب من الأعلى للأسفل عبر الأسهم أو السحب والإفلات (مثلاً: ارفع الأفلام فوق الأنمي).
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {categories.map((cat, idx) => {
                    const count = channels.filter((c) => c.group === cat).length;
                    const isDeleting = confirmDeleteCat === cat;
                    const isFirst = idx === 0;
                    const isLast = idx === categories.length - 1;
                    const isDragged = draggedCategoryIdx === idx;
                    const isDragOver = dragOverCategoryIdx === idx && draggedCategoryIdx !== idx;

                    const moveCategory = (targetIdx: number) => {
                      if (targetIdx < 0 || targetIdx >= categories.length || targetIdx === idx) return;
                      const next = [...categories];
                      const [moved] = next.splice(idx, 1);
                      next.splice(targetIdx, 0, moved);
                      onReorderCategories(next);
                      showToast(`تم نقل "${CATEGORY_LABELS[cat] || cat}" إلى المركز #${targetIdx + 1}`);
                    };

                    return (
                      <div
                        key={cat}
                        draggable
                        onDragStart={() => setDraggedCategoryIdx(idx)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverCategoryIdx !== idx) setDragOverCategoryIdx(idx);
                        }}
                        onDragLeave={() => {
                          if (dragOverCategoryIdx === idx) setDragOverCategoryIdx(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedCategoryIdx !== null && draggedCategoryIdx !== idx) {
                            const next = [...categories];
                            const [moved] = next.splice(draggedCategoryIdx, 1);
                            next.splice(idx, 0, moved);
                            onReorderCategories(next);
                            showToast(`تم تحديث ترتيب "${CATEGORY_LABELS[moved] || moved}" في الواجهة الرئيسية`);
                          }
                          setDraggedCategoryIdx(null);
                          setDragOverCategoryIdx(null);
                        }}
                        onDragEnd={() => {
                          setDraggedCategoryIdx(null);
                          setDragOverCategoryIdx(null);
                        }}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isDragged
                            ? 'opacity-50 bg-[#252525] border-[#e50914]/60'
                            : isDragOver
                            ? 'bg-[#221517] border-[#e50914] scale-[1.01]'
                            : 'bg-[#1c1c1c] border-[#2c2c2c] hover:border-[#3f3f3f]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="p-1 text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing shrink-0"
                            title="اسحب لإعادة الترتيب"
                          >
                            <GripVertical className="w-4 h-4" />
                          </span>

                          <span
                            className={`w-7 h-7 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0 font-mono ${
                              isFirst
                                ? 'bg-[#e50914] text-white shadow shadow-[#e50914]/40'
                                : 'bg-[#282828] text-zinc-300 border border-[#3a3a3a]'
                            }`}
                          >
                            {idx + 1}
                          </span>

                          <div className="min-w-0 text-right">
                            <p className="text-xs font-bold text-white truncate">
                              {CATEGORY_LABELS[cat] || cat}
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{count} عنصر</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!isFirst && (
                            <button
                              type="button"
                              onClick={() => moveCategory(0)}
                              className="p-1.5 rounded-lg bg-[#252525] hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-[#333333] transition-colors cursor-pointer"
                              title="تثبيت في أعلى القائمة (#1)"
                            >
                              <ChevronsUp className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => moveCategory(idx - 1)}
                            className="p-1.5 rounded-lg bg-[#252525] hover:bg-[#e50914] disabled:opacity-30 disabled:hover:bg-[#252525] text-zinc-200 hover:text-white border border-[#333333] transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="تحريك للأعلى"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => moveCategory(idx + 1)}
                            className="p-1.5 rounded-lg bg-[#252525] hover:bg-[#e50914] disabled:opacity-30 disabled:hover:bg-[#252525] text-zinc-200 hover:text-white border border-[#333333] transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="تحريك للأسفل"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {categories.length > 1 && (
                            isDeleting ? (
                              <div className="flex items-center gap-1 mr-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteCategory(cat);
                                    setConfirmDeleteCat(null);
                                    showToast(`تم حذف الباقة "${cat}"`);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-[#e50914] text-white text-[10px] font-bold cursor-pointer"
                                >
                                  تأكيد
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCat(null)}
                                  className="px-2 py-1 rounded-lg bg-zinc-700 text-zinc-300 text-[10px] cursor-pointer"
                                >
                                  لا
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCat(cat)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-[#ff4d4d] hover:bg-red-950/40 transition-colors cursor-pointer mr-0.5"
                                title="حذف الباقة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3B: SUBSCRIPTION & PAYPAL / GIFT CODES */}
          {activeTab === 'subscription' && (
            <div className="max-w-3xl mx-auto space-y-5">
              {/* PayPal & Price Configuration */}
              <div className="bg-[#151515] border border-[#282828] rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-sky-400" />
                      <span>إعدادات الاشتراك الشهري ومحفظة PayPal</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      تحكم في تفعيل بوابة الدفع عند الدخول، قيمة الاشتراك الشهري، وبريد PayPal المستلم.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...subDraft, enabled: !subDraft.enabled };
                      setSubDraft(next);
                      onUpdateSubscriptionConfig(next);
                      showToast(
                        next.enabled
                          ? 'تم تفعيل بوابة الاشتراك والدفع بنجاح'
                          : 'تم إيقاف بوابة الدفع مؤقتاً (دخول مفتوح للجميع)'
                      );
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      subDraft.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {subDraft.enabled ? 'البوابة مفعّلة ✓' : 'البوابة متوقفة'}
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!subDraft.paypalEmail.trim()) {
                      showToast('يرجى كتابة بريد محفظة PayPal.', 'error');
                      return;
                    }
                    const price = Number(subDraft.monthlyPriceUsd);
                    if (isNaN(price) || price <= 0) {
                      showToast('يرجى كتابة سعر اشتراك صحيح.', 'error');
                      return;
                    }
                    onUpdateSubscriptionConfig({
                      ...subDraft,
                      paypalEmail: subDraft.paypalEmail.trim(),
                      monthlyPriceUsd: price
                    });
                    showToast('تم حفظ إعدادات PayPal والاشتراك الشهري بنجاح!');
                  }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      بريد محفظة PayPal المستلم *
                    </label>
                    <input
                      type="email"
                      required
                      value={subDraft.paypalEmail}
                      onChange={(e) =>
                        setSubDraft((prev) => ({ ...prev, paypalEmail: e.target.value }))
                      }
                      className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-sky-500 focus:outline-none font-mono text-left dir-ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      سعر الاشتراك الشهري ($ USD)
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      required
                      value={subDraft.monthlyPriceUsd}
                      onChange={(e) =>
                        setSubDraft((prev) => ({
                          ...prev,
                          monthlyPriceUsd: parseFloat(e.target.value) || 2
                        }))
                      }
                      className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-sky-500 focus:outline-none font-mono text-center"
                    />
                  </div>

                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0070ba] hover:bg-[#0086dd] text-white text-xs font-extrabold rounded-xl cursor-pointer shadow"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ إعدادات PayPal</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Gift Codes Manager */}
              <div className="bg-[#151515] border border-[#282828] rounded-2xl p-4 sm:p-6 space-y-4">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#ff4d4d]" />
                    <span>أكواد الهدايا للدخول المجاني</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    أي شخص يضع أحد هذه الأكواد في شاشة الدفع يدخل إلى التطبيق مجاناً بدون دفع شهري.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const cleaned = newGiftCodeInput.trim();
                    if (!cleaned) return;
                    if (
                      subDraft.giftCodes.some(
                        (c) => c.toLowerCase() === cleaned.toLowerCase()
                      )
                    ) {
                      showToast('رمز الهدية هذا موجود مسبقاً.', 'error');
                      return;
                    }
                    const updated = {
                      ...subDraft,
                      giftCodes: [...subDraft.giftCodes, cleaned]
                    };
                    setSubDraft(updated);
                    onUpdateSubscriptionConfig(updated);
                    setNewGiftCodeInput('');
                    showToast(`تمت إضافة رمز الهدية "${cleaned}" بنجاح!`);
                  }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="text"
                    value={newGiftCodeInput}
                    onChange={(e) => setNewGiftCodeInput(e.target.value)}
                    placeholder="اكتب رمز هدية جديد (مثال: VIP2026)..."
                    className="flex-1 h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono"
                  />
                  <button
                    type="submit"
                    className="h-11 px-5 bg-[#e50914] hover:bg-[#ff1a1a] text-white text-xs font-extrabold rounded-xl cursor-pointer shrink-0"
                  >
                    + إضافة رمز هدية
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {subDraft.giftCodes.map((code) => (
                    <div
                      key={code}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1e1e1e] border border-[#333333] text-xs font-mono font-bold text-white"
                    >
                      <Gift className="w-3.5 h-3.5 text-[#ff4d4d]" />
                      <span>{code}</span>
                      {subDraft.giftCodes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...subDraft,
                              giftCodes: subDraft.giftCodes.filter((c) => c !== code)
                            };
                            setSubDraft(updated);
                            onUpdateSubscriptionConfig(updated);
                            showToast(`تم حذف رمز الهدية "${code}"`);
                          }}
                          className="text-zinc-400 hover:text-[#ff4d4d] cursor-pointer"
                          title="حذف الرمز"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Device Subscription & Preview Gate */}
              <div className="bg-[#151515] border border-[#282828] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-right">
                  <h4 className="text-xs font-bold text-white">حالة الاشتراك على هذا الجهاز</h4>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {activeSubscription?.isActive
                      ? activeSubscription.method === 'gift_code'
                        ? `مفعّل مجاناً عبر رمز الهدية (${activeSubscription.giftCodeUsed || '911'})`
                        : activeSubscription.method === 'paypal'
                        ? `مفعّل عبر PayPal حتى ${
                            activeSubscription.expiresAt
                              ? new Date(activeSubscription.expiresAt).toLocaleDateString('ar-JO')
                              : 'مدى الحياة'
                          }`
                        : 'مفعّل بصلاحية الإدارة'
                      : 'غير مفعّل'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLockSubscriptionGate();
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-[#e50914] text-white border border-zinc-700 hover:border-[#e50914] text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>قفل التطبيق ومعاينة شاشة الدفع</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & ADMIN SETTINGS */}
          {activeTab === 'backup' && (
            <div className="max-w-3xl mx-auto space-y-5">
              {/* Export / Import Card */}
              <div className="bg-[#151515] border border-[#282828] rounded-2xl p-4 sm:p-6">
                <h3 className="text-sm font-extrabold text-white mb-1 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>النسخ الاحتياطي واستعادة البيانات (JSON)</span>
                </h3>
                <p className="text-xs text-zinc-400 mb-5">
                  احفظ جميع القنوات، الباقات، الأغلفة المخصصة، وإعدادات البانر الرئيسي في ملف على جهازك أو استعدها في أي وقت.
                </p>

                <input
                  type="file"
                  ref={importInputRef}
                  onChange={handleImportJson}
                  accept=".json,application/json"
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleExportJson}
                    className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#e50914] hover:bg-[#ff1a1a] text-white text-xs font-extrabold shadow-lg shadow-[#e50914]/25 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير البيانات (Export JSON)</span>
                  </button>

                  <button
                    onClick={() => importInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 text-xs font-extrabold transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>استيراد البيانات (Import JSON)</span>
                  </button>
                </div>
              </div>

              {/* Change Admin PIN Card */}
              <div className="bg-[#151515] border border-[#282828] rounded-2xl p-4 sm:p-6">
                <h3 className="text-sm font-extrabold text-white mb-1 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>تغيير الرمز السري للوحة التحكم (PIN)</span>
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  الرمز الحالي: <span className="font-mono text-white">••••</span> (الافتراضي عند أول تشغيل هو 6767)
                </p>

                <form onSubmit={handleChangePinSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      الرمز الجديد (4 أرقام)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full h-11 bg-[#1e1e1e] text-white text-sm px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono tracking-widest text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      تأكيد الرمز الجديد
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pinConfirm}
                      onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full h-11 bg-[#1e1e1e] text-white text-sm px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono tracking-widest text-center"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-11 bg-white hover:bg-zinc-200 text-black text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                  >
                    حفظ الرمز السري
                  </button>
                </form>
              </div>

              {/* Restore Factory Defaults */}
              <div className="bg-[#151515] border border-red-900/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-right">
                  <h4 className="text-xs font-bold text-white">استعادة القنوات الافتراضية</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    إرجاع قائمة القنوات والباقات الأصلية للتطبيق.
                  </p>
                </div>
                {confirmReset ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onResetDefaults();
                        setConfirmReset(false);
                        showToast('تمت استعادة القنوات الافتراضية بنجاح');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#e50914] text-white text-xs font-bold cursor-pointer"
                    >
                      تأكيد الاستعادة
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-950/50 hover:bg-[#e50914] text-[#ff4d4d] hover:text-white border border-[#e50914]/30 text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الافتراضي</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT CHANNEL OVERLAY MODAL */}
      {editingChannel && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#161616] border border-[#303030] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white animate-in fade-in zoom-in-95 my-auto">
            <button
              onClick={() => setEditingChannel(null)}
              className="absolute top-4 left-4 p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[#e50914]" />
              <span>تعديل: {editingChannel.name}</span>
              {editingChannel.isLocalSaved && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 text-[10px] font-extrabold">
                  ملف محلي محفوظ
                </span>
              )}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">الاسم *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">الباقة *</label>
                <select
                  value={editGroup}
                  onChange={(e) => setEditGroup(e.target.value)}
                  className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat] || cat}
                    </option>
                  ))}
                </select>
              </div>

              {editingChannel.isLocalSaved ? (
                <div className="p-3 rounded-xl bg-[#101010] border border-[#2a2a2a] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 text-right">
                      <p className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>ملف الفيديو المحفوظ في قاعدة البيانات</span>
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {editLocalVideoFile
                          ? `${editLocalVideoFile.name} (${formatFileSize(editLocalVideoFile.size)})`
                          : `${editingChannel.fileName || 'فيلم محلي'} · ${formatFileSize(editingChannel.fileSizeBytes)}`}
                      </p>
                    </div>
                    <input
                      ref={editLocalVideoInputRef}
                      type="file"
                      accept="video/mp4,video/x-matroska,video/webm,video/x-msvideo,.mp4,.mkv,.webm,.avi,video/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setEditLocalVideoFile(f);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editLocalVideoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      استبدال الفيديو
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">الرابط *</label>
                  <input
                    type="url"
                    required
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="w-full h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono text-left dir-ltr"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  صورة الغلاف (رابط أو رفع من الجهاز)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editCoverUrl}
                    onChange={(e) => {
                      setEditCoverUrl(e.target.value);
                      setEditLocalPosterFile(null);
                      setEditLocalPosterPreview(null);
                      setClearEditPoster(false);
                    }}
                    placeholder="اتركه فارغاً للصورة التلقائية"
                    className="flex-1 h-11 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono text-left dir-ltr"
                  />
                  {editingChannel.isLocalSaved && (
                    <>
                      <input
                        ref={editLocalPosterInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (editLocalPosterPreview?.startsWith('blob:') && editLocalPosterFile) {
                            URL.revokeObjectURL(editLocalPosterPreview);
                          }
                          setEditLocalPosterFile(file);
                          setEditLocalPosterPreview(URL.createObjectURL(file));
                          setEditCoverUrl('');
                          setClearEditPoster(false);
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => editLocalPosterInputRef.current?.click()}
                        className="h-11 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#ff4d4d]" />
                        <span>رفع صورة</span>
                      </button>
                    </>
                  )}
                </div>

                {(editLocalPosterPreview || editCoverUrl.trim()) && (
                  <div className="mt-2 flex items-center justify-between gap-2 p-2 rounded-xl bg-[#111] border border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={editLocalPosterPreview || editCoverUrl.trim()}
                        alt="معاينة البوستر"
                        className="w-16 aspect-video rounded-md object-cover border border-white/10"
                      />
                      <span className="text-[11px] text-zinc-400 truncate">
                        {editLocalPosterFile ? editLocalPosterFile.name : 'صورة الغلاف الحالية'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditCoverUrl('');
                        setEditLocalPosterFile(null);
                        setEditLocalPosterPreview(null);
                        setClearEditPoster(true);
                      }}
                      className="text-[10px] text-zinc-400 hover:text-[#ff4d4d] px-2 py-1 rounded bg-zinc-800 cursor-pointer"
                    >
                      إزالة الغلاف
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">الشارة (اختياري)</label>
                  <input
                    type="text"
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                    placeholder="LIVE / جديد"
                    className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">الجودة</label>
                  <select
                    value={editResolution}
                    onChange={(e) => setEditResolution(e.target.value as '4K' | 'FHD' | 'HD' | 'SD')}
                    className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none cursor-pointer"
                  >
                    <option value="4K">4K</option>
                    <option value="FHD">FHD</option>
                    <option value="HD">HD</option>
                    <option value="SD">SD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  نبذة / وصف العمل
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="اكتب نبذة جذابة عن قصة الفيلم أو المسلسل أو محتوى القناة..."
                  className="w-full bg-[#1e1e1e] text-white text-xs p-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Two-Tone Colors, Backdrop, Metadata, Cast & Reviews */}
              <AdminTitleDetailsFields
                draft={editDetailsDraft}
                onChange={setEditDetailsDraft}
                visitorReviews={editVisitorReviews}
                onDeleteVisitorReview={(reviewId) => {
                  const next = deleteVisitorReviewForChannel(editingChannel.id, reviewId);
                  setEditVisitorReviews(next);
                  showToast('تم حذف تقييم الزائر');
                }}
              />

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#e50914] hover:bg-[#ff1a1a] disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                >
                  {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EDIT MATCH OVERLAY MODAL */}
      {editingMatch && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-[#303030] w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white animate-in fade-in zoom-in-95">
            <button
              onClick={() => setEditingMatch(null)}
              className="absolute top-4 left-4 p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>تعديل المباراة</span>
            </h3>

            <form onSubmit={handleSaveEditMatch} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">البطولة</label>
                <select
                  value={editingMatch.tournament}
                  onChange={(e) => setEditingMatch({ ...editingMatch, tournament: e.target.value as TournamentId })}
                  className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none cursor-pointer"
                >
                  {TOURNAMENT_LIST.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">الفريق الأول *</label>
                  <input
                    type="text"
                    required
                    value={editingMatch.homeTeam}
                    onChange={(e) => setEditingMatch({ ...editingMatch, homeTeam: e.target.value })}
                    className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">الفريق الثاني *</label>
                  <input
                    type="text"
                    required
                    value={editingMatch.awayTeam}
                    onChange={(e) => setEditingMatch({ ...editingMatch, awayTeam: e.target.value })}
                    className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">الوقت</label>
                  <input
                    type="text"
                    value={editingMatch.matchTime}
                    onChange={(e) => setEditingMatch({ ...editingMatch, matchTime: e.target.value })}
                    className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">القناة</label>
                  <input
                    type="text"
                    value={editingMatch.channelName}
                    onChange={(e) => setEditingMatch({ ...editingMatch, channelName: e.target.value })}
                    className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">رابط البث المباشر / يوتيوب</label>
                <input
                  type="url"
                  value={editingMatch.streamUrl}
                  onChange={(e) => setEditingMatch({ ...editingMatch, streamUrl: e.target.value })}
                  className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono text-left dir-ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">الحالة</label>
                <select
                  value={editingMatch.status}
                  onChange={(e) => setEditingMatch({ ...editingMatch, status: e.target.value as MatchStatus })}
                  className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none cursor-pointer"
                >
                  <option value="upcoming">قريباً</option>
                  <option value="live">مباشر الآن (مشاهدة المباراة)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#e50914] hover:bg-[#ff1a1a] text-white text-xs font-bold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
