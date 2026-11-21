import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  FolderOpen,
  Film,
  Smartphone,
  Code2,
  Users,
  Smile,
  ChevronDown,
  Lock,
  LogOut,
  ShieldCheck,
  Trophy,
  Bell,
  Gamepad2,
  CheckCheck,
  Trash2,
  Flame,
  Megaphone,
  CreditCard,
  Download,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types/profile';
import { MatchThemeId } from '../types/matches';
import { AppNotification } from '../types/notifications';
import { TOURNAMENT_THEMES } from '../data/defaultMatches';
import { PWAInstallButton } from './PWAInstallButton';
import { playCyberClick, playCyberWhoosh } from '../utils/sciFiAudio';
import { AppThemeId } from './ParticleNebulaBg';

export type NavTab =
  | 'home'
  | 'news'
  | 'movies'
  | 'series'
  | 'anime'
  | 'music'
  | 'stories'
  | 'kids'
  | 'favorites'
  | 'matches'
  | 'games';

interface NetflixNavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeProfile: UserProfile | null;
  onRequestSwitchProfile: () => void;
  onLoadM3UFile: (file: File) => void;
  onLoadLocalVideo: (file: File) => void;
  onOpenRemoteModal: () => void;
  onOpenPythonModal: () => void;
  onOpenAdminPanel: () => void;
  favoritesCount: number;
  matchTheme?: MatchThemeId;
  liveMatchesCount?: number;
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAllNotificationsRead: () => void;
  onClearNotifications: () => void;
  onClickNotification: (notification: AppNotification) => void;
  subscriptionStatusText?: string;
  onLockSubscriptionGate?: () => void;
  onOpenUpdatesModal?: () => void;
  onOpenProfileManagement?: () => void;
  uiSoundsEnabled?: boolean;
  onToggleUiSounds?: () => void;
  charactersEnabled?: boolean;
  onToggleCharacters?: () => void;
  theme?: AppThemeId;
}

export const NetflixNavbar: React.FC<NetflixNavbarProps> = ({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  activeProfile,
  onRequestSwitchProfile,
  onLoadM3UFile,
  onLoadLocalVideo,
  onOpenRemoteModal,
  onOpenPythonModal,
  onOpenAdminPanel,
  favoritesCount,
  matchTheme = 'default',
  liveMatchesCount = 0,
  notifications,
  unreadCount,
  onMarkAllNotificationsRead,
  onClearNotifications,
  onClickNotification,
  subscriptionStatusText,
  onLockSubscriptionGate,
  onOpenUpdatesModal,
  onOpenProfileManagement,
  uiSoundsEnabled = true,
  onToggleUiSounds,
  charactersEnabled = true,
  onToggleCharacters,
  theme = 'action'
}) => {
  const isClassic = theme === 'netflix';
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const m3uInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleM3UChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadM3UFile(file);
      e.target.value = '';
      setIsProfileMenuOpen(false);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadLocalVideo(file);
      e.target.value = '';
      setIsProfileMenuOpen(false);
    }
  };

  const isKids = activeProfile?.isKids;
  const isMatchesThemed = activeTab === 'matches' && matchTheme !== 'default';
  const activeMatchThemeObj = TOURNAMENT_THEMES[matchTheme];

  const navLinks: { id: NavTab; label: string; dot?: boolean }[] = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'news', label: 'الأخبار المباشرة' },
    { id: 'movies', label: 'الأفلام' },
    { id: 'series', label: 'المسلسلات' },
    { id: 'anime', label: 'الأنمي' },
    { id: 'music', label: 'الأغاني' },
    { id: 'stories', label: 'القصص' },
    { id: 'kids', label: 'الأطفال' },
    { id: 'matches', label: 'المباريات', dot: liveMatchesCount > 0 },
    { id: 'games', label: 'الألعاب' },
    {
      id: 'favorites',
      label: favoritesCount > 0 ? `المفضلة (${favoritesCount})` : 'المفضلة'
    }
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 h-16 px-4 sm:px-8 md:px-12 flex items-center justify-between gap-4 select-none transition-all duration-500 ${
        isClassic
          ? isScrolled || isMatchesThemed
            ? 'bg-[#141414]/95 border-b border-white/10 shadow-lg'
            : 'bg-gradient-to-b from-black/85 via-black/40 to-transparent'
          : isScrolled || isMatchesThemed
          ? 'backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.78)]'
          : 'bg-gradient-to-b from-[#07070c]/90 via-[#07070c]/45 to-transparent backdrop-blur-sm'
      }`}
      style={
        isMatchesThemed
          ? {
              backgroundColor: `${activeMatchThemeObj.bgHex}e6`,
              borderBottom: `1px solid ${activeMatchThemeObj.accentHex}55`
            }
          : !isClassic && isScrolled
          ? {
              background:
                theme === 'galaxy'
                  ? 'linear-gradient(180deg, rgba(16, 10, 34, 0.9) 0%, rgba(4, 2, 15, 0.88) 100%)'
                  : theme === '2077'
                  ? 'linear-gradient(180deg, rgba(8, 18, 34, 0.9) 0%, rgba(5, 9, 20, 0.88) 100%)'
                  : 'linear-gradient(180deg, rgba(18, 18, 26, 0.88) 0%, rgba(7, 7, 12, 0.85) 100%)',
              borderBottom:
                theme === 'galaxy'
                  ? '1px solid rgba(192, 132, 252, 0.28)'
                  : theme === '2077'
                  ? '1px solid rgba(34, 211, 238, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)'
            }
          : undefined
      }
    >
      {/* Right Zone (RTL): Wordmark + Clean Navigation Links */}
      <div className="flex items-center gap-6 lg:gap-8 min-w-0">
        <button
          type="button"
          onClick={() => {
            playCyberClick();
            onSelectTab('home');
          }}
          className="cursor-pointer shrink-0 transition-transform duration-200 hover:scale-[1.03]"
          aria-label="Awn Tv pro الرئيسية"
        >
          <span
            className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight font-['Outfit'] whitespace-nowrap"
            style={{
              color: isMatchesThemed ? activeMatchThemeObj.accentHex : '#E50914',
              textShadow: isClassic
                ? 'none'
                : '0 0 22px rgba(229,9,20,0.5), 0 2px 10px rgba(0,0,0,0.85)'
            }}
          >
            Awn Tv pro
          </span>
        </button>

        {/* Primary Desktop Links with comfortable spacing */}
        {!isKids ? (
          <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-[13px] whitespace-nowrap">
            {navLinks.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    playCyberClick();
                    onSelectTab(item.id);
                  }}
                  className={`relative transition-colors duration-200 cursor-pointer py-1 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-[#e5e5e5]/80 hover:text-white font-medium'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.dot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse shadow-[0_0_8px_#E50914]" />
                  )}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full shadow-[0_0_10px_rgba(229,9,20,0.75)]"
                      style={{
                        background: isMatchesThemed
                          ? activeMatchThemeObj.accentHex
                          : 'linear-gradient(90deg, #E50914, #ff4d58)'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-amber-400" />
              <span>بوابة الأطفال الآمنة</span>
            </span>
            <button
              onClick={() => {
                playCyberClick();
                onSelectTab(activeTab === 'games' ? 'home' : 'games');
              }}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-zinc-200 hover:text-white cursor-pointer"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>الألعاب</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden File Inputs (triggered via Profile Menu) */}
      <input
        type="file"
        ref={m3uInputRef}
        onChange={handleM3UChange}
        accept=".m3u,.m3u8,.txt"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoChange}
        accept="video/*,.mp4,.mkv,.avi,.mov,.webm,.ts,.m4v"
        className="hidden"
      />

      {/* Left Zone (RTL): Search, Notifications, Quantum Sound Toggle, Updates, Admin, Profile Avatar */}
      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
        {/* 1. Search */}
        <div className="relative flex items-center">
          {isSearchOpen ? (
            <div className="flex items-center modern-glass border border-white/25 rounded-xl px-2.5 py-1 text-xs w-44 sm:w-60 transition-all shadow-lg">
              <Search className="w-4 h-4 text-[#E50914] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="عناوين، قنوات، أفلام..."
                className="w-full bg-transparent text-white px-2 py-0.5 focus:outline-none placeholder:text-zinc-400 text-xs"
                autoFocus
              />
              <button
                onClick={() => {
                  playCyberClick();
                  onSearchChange('');
                  setIsSearchOpen(false);
                }}
                className="text-zinc-400 hover:text-white cursor-pointer"
                aria-label="إغلاق البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                playCyberClick();
                setIsSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="p-1.5 text-white/90 hover:text-[#E50914] transition-all hover:scale-110 cursor-pointer"
              title="بحث"
              aria-label="بحث"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Notifications Bell */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              playCyberClick();
              setIsNotificationsOpen((prev) => !prev);
              setIsProfileMenuOpen(false);
            }}
            className="relative p-1.5 text-white/90 hover:text-[#E50914] transition-all hover:scale-110 cursor-pointer"
            title="الإشعارات"
            aria-label="الإشعارات"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#E50914] text-white text-[10px] font-black flex items-center justify-center shadow ring-2 ring-[#07070c] tabular-nums">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute left-0 top-full mt-3 w-72 sm:w-88 modern-glass glass-border-glow rounded-xl shadow-2xl z-50 overflow-hidden text-right animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2.5 bg-[#0d0d14]/90 border-b border-white/10 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-[#E50914]" />
                  <span>الإشعارات ({notifications.length})</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-zinc-200 flex items-center gap-1 cursor-pointer"
                      title="تحديد الكل كمقروء"
                    >
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                      <span>قراءة الكل</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={onClearNotifications}
                      className="p-1 rounded bg-white/10 hover:bg-[#E50914] text-zinc-300 hover:text-white cursor-pointer"
                      title="مسح السجل"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-xs text-zinc-500">
                    لا توجد إشعارات حالياً
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        playCyberClick();
                        onClickNotification(n);
                        setIsNotificationsOpen(false);
                      }}
                      className={`w-full p-3 text-right hover:bg-white/5 transition-colors flex items-start gap-2.5 cursor-pointer ${
                        !n.read ? 'bg-[#E50914]/10' : ''
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                          n.type === 'urgent'
                            ? 'bg-[#E50914]/25 text-[#ff4d4d]'
                            : n.type === 'sports' || n.type === 'match_alert'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/10 text-white'
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-white truncate">{n.title}</p>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-[#E50914] shrink-0" />}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2b. Compact Interactive Characters Toggle */}
        {onToggleCharacters && (
          <button
            type="button"
            onClick={() => {
              playCyberClick();
              onToggleCharacters();
            }}
            title={charactersEnabled ? 'إيقاف الشخصيات' : 'تفعيل الشخصيات'}
            aria-label="الشخصيات"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              charactersEnabled
                ? 'bg-[#E50914]/15 border-[#E50914]/55 text-white hover:bg-[#E50914]/25'
                : 'bg-white/5 border-white/15 text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className={`w-3 h-3 ${charactersEnabled ? 'text-[#ff4d58]' : 'text-zinc-400'}`} />
            <span className="hidden sm:inline">الشخصيات</span>
          </button>
        )}

        {/* 2c. UI Audio Mute/Unmute Toggle */}
        {onToggleUiSounds && (
          <button
            type="button"
            onClick={onToggleUiSounds}
            title={uiSoundsEnabled ? 'كتم أصوات الواجهة' : 'تفعيل أصوات الواجهة'}
            aria-label={uiSoundsEnabled ? 'كتم أصوات الواجهة' : 'تفعيل أصوات الواجهة'}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
              uiSoundsEnabled
                ? 'modern-glass border-white/25 text-white hover:border-[#E50914]/60'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            {uiSoundsEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        )}

        {/* 3. Updates Button (التحديثات) */}
        {onOpenUpdatesModal && (
          <button
            type="button"
            onClick={() => {
              playCyberWhoosh();
              setIsNotificationsOpen(false);
              setIsProfileMenuOpen(false);
              onOpenUpdatesModal();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg modern-glass border border-white/20 hover:border-[#E50914]/65 text-white/95 hover:text-white text-[11px] sm:text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap"
            title="التحديثات"
            aria-label="التحديثات"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E50914]" />
            <span>التحديثات</span>
          </button>
        )}

        {/* 4. Admin Panel Icon */}
        <button
          onClick={() => {
            playCyberWhoosh();
            onOpenAdminPanel();
          }}
          className="p-1.5 text-white/90 hover:text-[#E50914] transition-transform hover:scale-110 cursor-pointer shrink-0"
          title="لوحة التحكم (Admin)"
          aria-label="لوحة التحكم"
        >
          <ShieldCheck className="w-5 h-5" />
        </button>

        {/* 5. User Profile Avatar & Menu */}
        {activeProfile && (
          <div className="relative">
            <button
              onClick={() => {
                playCyberClick();
                setIsProfileMenuOpen((prev) => !prev);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-1.5 cursor-pointer group"
              aria-label="قائمة الحساب"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/25 group-hover:border-[#E50914] transition-colors bg-zinc-900 shadow-md">
                <img
                  src={activeProfile.avatar}
                  alt={activeProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${
                  isProfileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isProfileMenuOpen && (
              <div
                className="absolute left-0 top-full mt-3 w-60 quantum-crystal plasma-border rounded-xl p-2 shadow-2xl z-50 text-right animate-in fade-in zoom-in-95 space-y-0.5"
                onMouseLeave={() => setIsProfileMenuOpen(false)}
              >
                <div className="px-2.5 py-2 border-b border-white/10 mb-1">
                  <p className="text-xs font-bold text-white">{activeProfile.name}</p>
                  <p className="text-[11px] text-zinc-400">
                    {isKids ? 'وضع الأطفال نشط' : 'الحساب الشخصي'}
                  </p>
                </div>

                {/* Quick Mobile Tabs & Tools preserved inside clean Profile Menu */}
                {!isKids && (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onSelectTab('matches');
                    }}
                    className="lg:hidden w-full flex items-center justify-between p-2 hover:bg-white/10 rounded text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-emerald-400" />
                      <span>مركز المباريات المباشرة</span>
                    </span>
                    {liveMatchesCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenRemoteModal();
                  }}
                  className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>الريموت الذكي للتحكم</span>
                </button>

                {!isKids && (
                  <>
                    <button
                      onClick={() => m3uInputRef.current?.click()}
                      className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4 text-[#E50914]" />
                      <span>استيراد قائمة M3U</span>
                    </button>

                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <Film className="w-4 h-4 text-[#ff4d4d]" />
                      <span>تشغيل فيديو من الجهاز</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenPythonModal();
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <Code2 className="w-4 h-4 text-amber-400" />
                      <span>نسخة سطح المكتب (.exe)</span>
                    </button>
                  </>
                )}

                <div className="px-1 py-1">
                  <PWAInstallButton compact />
                </div>

                <div className="border-t border-white/10 pt-1 mt-1 space-y-0.5">
                  {onOpenProfileManagement && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenProfileManagement();
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded text-xs font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-[#E50914]" />
                      <span>إدارة الملف الشخصي والتفضيلات</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onRequestSwitchProfile();
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-white/10 rounded text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#E50914]" />
                      <span>تبديل الحساب</span>
                    </span>
                    {isKids && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onRequestSwitchProfile();
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>إدارة الحسابات / خروج</span>
                  </button>

                  {onLockSubscriptionGate && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLockSubscriptionGate();
                      }}
                      className="w-full flex items-center justify-between gap-2 p-2 border-t border-white/10 mt-1 hover:bg-white/10 rounded text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>بوابة الاشتراك</span>
                      </span>
                      {subscriptionStatusText && (
                        <span className="text-[10px] text-zinc-400 truncate max-w-[75px]">
                          {subscriptionStatusText}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
