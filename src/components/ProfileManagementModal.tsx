import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ArrowRight,
  User,
  Lock,
  Unlock,
  SlidersHorizontal,
  History,
  Trash2,
  Check,
  Upload,
  ShieldCheck,
  Smile,
  Globe,
  Subtitles,
  PlayCircle
} from 'lucide-react';
import {
  UserProfile,
  ProfilePreferences,
  MaturityRating,
  ProfileLanguage,
  SubtitleLanguage,
  SubtitleSize
} from '../types/profile';
import { ContinueWatchingItem } from '../types/history';
import {
  AVAILABLE_AVATARS,
  AVAILABLE_AVATARS_WITH_KIDS,
  DEFAULT_KIDS_AVATAR_URL,
  DEFAULT_KIDS_EXIT_PIN,
  DEFAULT_KIDS_PROFILE_PREFERENCES,
  DEFAULT_PROFILE_PREFERENCES
} from '../data/defaultProfiles';
import { ChannelThumbnail } from './ChannelThumbnail';

interface ProfileManagementModalProps {
  profile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (updated: UserProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  isPrimaryProtected: boolean;
  watchHistory: ContinueWatchingItem[];
  onRemoveHistoryItem: (profileId: string, channelId: string) => void;
  onClearHistory: (profileId: string) => void;
  customCovers?: Record<string, string>;
}

type ManagementSection = 'profile' | 'lock' | 'preferences' | 'history';

const MATURITY_OPTIONS: Array<{ value: MaturityRating; label: string; desc: string }> = [
  { value: 'kids', label: 'وضع الأطفال', desc: 'كرتون وبرامج آمنة للأطفال فقط' },
  { value: '7+', label: '+7', desc: 'مناسب للأطفال من عمر 7 سنوات فأكثر' },
  { value: '13+', label: '+13', desc: 'مناسب للمراهقين من 13 عاماً فأكثر' },
  { value: '16+', label: '+16', desc: 'محتوى درامي وأكشن للفئات فوق 16' },
  { value: '18+', label: '+18 الكل', desc: 'عرض جميع الأفلام والمسلسلات والقنوات بدون قيود' }
];

export const ProfileManagementModal: React.FC<ProfileManagementModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSaveProfile,
  onDeleteProfile,
  isPrimaryProtected,
  watchHistory,
  onRemoveHistoryItem,
  onClearHistory,
  customCovers = {}
}) => {
  const [activeSection, setActiveSection] = useState<ManagementSection>('profile');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVAILABLE_AVATARS[0].url);
  const [isKids, setIsKids] = useState(false);

  // 4-Digit PIN Boxes State
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '']);
  const [pinSavedNotice, setPinSavedNotice] = useState(false);

  // Viewing Preferences State
  const [prefs, setPrefs] = useState<ProfilePreferences>({ ...DEFAULT_PROFILE_PREFERENCES });

  // Delete / Clear History Confirmations
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pinInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!isOpen || !profile) return;
    setActiveSection('profile');
    setName(profile.name);
    setAvatar(profile.avatar);
    setIsKids(profile.isKids);

    const effectivePin = profile.pin || (profile.isKids ? DEFAULT_KIDS_EXIT_PIN : '');
    setPinEnabled(Boolean(effectivePin && /^\d{4}$/.test(effectivePin)));
    setPinDigits(
      effectivePin && /^\d{4}$/.test(effectivePin)
        ? effectivePin.split('')
        : ['', '', '', '']
    );
    setPinSavedNotice(false);
    setConfirmDeleteProfile(false);
    setConfirmClearHistory(false);

    const basePrefs = profile.isKids
      ? DEFAULT_KIDS_PROFILE_PREFERENCES
      : DEFAULT_PROFILE_PREFERENCES;
    setPrefs({
      ...basePrefs,
      ...(profile.preferences || {}),
      maturityRating: profile.isKids
        ? 'kids'
        : profile.preferences?.maturityRating || basePrefs.maturityRating
    });
  }, [isOpen, profile]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !profile) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setAvatar(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleKids = (checked: boolean) => {
    setIsKids(checked);
    if (checked) {
      setAvatar(DEFAULT_KIDS_AVATAR_URL);
      setPrefs((p) => ({ ...p, maturityRating: 'kids' }));
      setPinEnabled(true);
      if (pinDigits.join('').length !== 4) {
        setPinDigits(DEFAULT_KIDS_EXIT_PIN.split(''));
      }
    } else if (prefs.maturityRating === 'kids') {
      setPrefs((p) => ({ ...p, maturityRating: '18+' }));
    }
  };

  const handlePinDigitChange = (idx: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    setPinDigits((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    setPinSavedNotice(false);
    if (digit && idx < 3) {
      pinInputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePinKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[idx] && idx > 0) {
      pinInputRefs.current[idx - 1]?.focus();
    }
  };

  const handleDisablePin = () => {
    if (isKids) return;
    setPinEnabled(false);
    setPinDigits(['', '', '', '']);
    setPinSavedNotice(false);
  };

  const resolvedPin = (): string | undefined => {
    const joined = pinDigits.join('');
    if (isKids) {
      return /^\d{4}$/.test(joined) ? joined : DEFAULT_KIDS_EXIT_PIN;
    }
    if (!pinEnabled) return undefined;
    return /^\d{4}$/.test(joined) ? joined : profile.pin;
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    const nextIsKids = isKids || prefs.maturityRating === 'kids';
    onSaveProfile({
      ...profile,
      name: name.trim(),
      avatar,
      isKids: nextIsKids,
      pin: resolvedPin(),
      preferences: {
        ...prefs,
        maturityRating: nextIsKids ? 'kids' : prefs.maturityRating
      }
    });
    onClose();
  };

  const formatWatchDate = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'تمت المشاهدة مؤخراً';
    }
  };

  const sections: Array<{ id: ManagementSection; label: string; icon: React.ReactNode }> = [
    { id: 'profile', label: 'المعلومات والصورة', icon: <User className="w-4 h-4" /> },
    { id: 'lock', label: 'قفل الملف الشخصي', icon: <Lock className="w-4 h-4" /> },
    { id: 'preferences', label: 'تفضيلات العرض والرقابة', icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: 'history', label: `محفوظات المشاهدة (${watchHistory.length})`, icon: <History className="w-4 h-4" /> }
  ];

  const pinValue = pinDigits.join('');

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#07070c]/85 backdrop-blur-md flex items-start justify-center p-0 sm:p-4 md:p-8 overflow-y-auto select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl modern-glass glass-border-glow sm:rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(229,9,20,0.16)] overflow-hidden text-white my-auto min-h-screen sm:min-h-0 flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Bar */}
        <div className="px-5 sm:px-8 py-5 bg-black/50 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="رجوع"
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 text-zinc-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="min-w-0 text-right">
              <h2 className="text-lg sm:text-xl font-black text-white truncate">
                إدارة الملف الشخصي والتفضيلات
              </h2>
              <p className="text-xs text-zinc-400 truncate">
                {profile.name} {isPrimaryProtected ? '· الحساب الرئيسي' : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 sm:px-8 py-3 bg-[#141414]/60 border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#E50914] text-white'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                }`}
              >
                {sec.icon}
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-8 space-y-6 flex-1 text-right">
          {/* SECTION 1: PROFILE INFO & AVATAR */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-white/10">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-white/80 shrink-0 bg-zinc-900 shadow-lg">
                  <img
                    src={avatar}
                    alt={name || 'الصورة الرمزية'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 w-full space-y-2">
                  <label className="block text-xs font-bold text-zinc-300">
                    اسم الملف الشخصي *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخل اسم الملف الشخصي..."
                    className="w-full h-11 bg-[#121212] text-white text-sm px-4 rounded-lg border border-white/15 focus:border-white focus:outline-none transition-colors"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-zinc-400">
                      {isPrimaryProtected
                        ? 'هذا هو الملف الشخصي الرئيسي للحساب.'
                        : 'يمكنك تخصيص الاسم والصورة في أي وقت.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة من الجهاز</span>
                    </button>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />

              {/* Avatars Grid */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-zinc-300">
                  اختر الصورة الرمزية ({AVAILABLE_AVATARS_WITH_KIDS.length} شخصية متاحة)
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-60 overflow-y-auto p-1">
                  {AVAILABLE_AVATARS_WITH_KIDS.map((av) => {
                    const selected = avatar === av.url;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setAvatar(av.url)}
                        title={av.label}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-zinc-900 ${
                          selected
                            ? 'border-white ring-2 ring-[#E50914] scale-105'
                            : 'border-transparent opacity-75 hover:opacity-100 hover:border-white/50'
                        }`}
                      >
                        <img
                          src={av.url}
                          alt={av.label}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (img.src !== av.fallbackUrl) img.src = av.fallbackUrl;
                          }}
                          className="w-full h-full object-cover"
                        />
                        {selected && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-[#E50914] flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kids Profile Mode Toggle */}
              {!isPrimaryProtected && (
                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Smile className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-white">وضع الأطفال (Kids Profile)</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        يعرض كرتون وبرامج الأطفال فقط ويطلب رمز PIN عند الخروج.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isKids}
                    onChange={(e) => handleToggleKids(e.target.checked)}
                    aria-label="تفعيل وضع الأطفال"
                    className="w-5 h-5 accent-amber-400 cursor-pointer shrink-0"
                  />
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: PROFILE LOCK (4-DIGIT PIN) */}
          {activeSection === 'lock' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 pb-6 border-b border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center text-[#E50914] shrink-0">
                    {pinEnabled ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {isKids ? 'رمز الخروج من حساب الأطفال (PIN)' : 'قفل الملف الشخصي برمز PIN'}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {isKids
                        ? 'يدخل الأطفال مباشرة، ويُطلب هذا الرمز المكون من 4 أرقام عند الخروج لشاشة الملفات الشخصية.'
                        : 'قم بتفعيل رمز PIN المكون من 4 أرقام لمنع الآخرين من الدخول إلى ملفك الشخصي. يظهر رمز القفل الصغير أسفل صورتك في شاشة الحسابات.'}
                    </p>
                  </div>
                </div>

                {!isKids && (
                  <button
                    type="button"
                    onClick={() => {
                      if (pinEnabled) {
                        handleDisablePin();
                      } else {
                        setPinEnabled(true);
                        setTimeout(() => pinInputRefs.current[0]?.focus(), 50);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      pinEnabled
                        ? 'bg-white/10 hover:bg-red-950/60 text-zinc-200 hover:text-red-300'
                        : 'bg-[#E50914] hover:bg-[#f40612] text-white'
                    }`}
                  >
                    {pinEnabled ? 'إلغاء القفل' : 'تفعيل القفل'}
                  </button>
                )}
              </div>

              {(pinEnabled || isKids) ? (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-zinc-300">
                    أدخل أو غيّر رمز PIN المكون من 4 أرقام:
                  </p>

                  <div dir="ltr" className="flex items-center justify-start gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          pinInputRefs.current[idx] = el;
                        }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={pinDigits[idx]}
                        onChange={(e) => handlePinDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(idx, e)}
                        aria-label={`الرقم ${idx + 1} من رمز PIN`}
                        className="w-14 h-16 rounded-xl bg-[#121212] border-2 border-zinc-700 focus:border-white text-center text-2xl font-mono font-black text-white focus:outline-none transition-colors"
                      />
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        if (pinValue.length === 4) {
                          setPinSavedNotice(true);
                        }
                      }}
                      disabled={pinValue.length !== 4}
                      className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-bold text-white cursor-pointer transition-colors"
                    >
                      تطبيق الرمز
                    </button>
                  </div>

                  {pinValue.length > 0 && pinValue.length < 4 && (
                    <p className="text-xs text-amber-400">
                      يرجى إكمال إدخال الأرقام الأربعة لتفعيل القفل.
                    </p>
                  )}

                  {pinSavedNotice && pinValue.length === 4 && (
                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>تم تجهيز الرمز الجديد — اضغط "حفظ التغييرات" بالأسفل لتثبيته.</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-zinc-400 bg-[#141414] rounded-xl border border-white/5">
                  قفل الملف الشخصي غير مفعّل حالياً. اضغط على "تفعيل القفل" لإعداد رمز حماية من 4 أرقام.
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: VIEWING PREFERENCES & PARENTAL CONTROLS */}
          {activeSection === 'preferences' && (
            <div className="space-y-6">
              {/* Language Selection */}
              <div className="space-y-2.5 pb-5 border-b border-white/10">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Globe className="w-4 h-4 text-[#E50914]" />
                  <span>لغة واجهة العرض</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'ar', label: 'العربية' },
                      { id: 'en', label: 'English' },
                      { id: 'fr', label: 'Français' },
                      { id: 'tr', label: 'Türkçe' }
                    ] as Array<{ id: ProfileLanguage; label: string }>
                  ).map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setPrefs((p) => ({ ...p, language: lang.id }))}
                      className={`py-2.5 px-4 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        prefs.language === lang.id
                          ? 'bg-white text-black border-white'
                          : 'bg-[#141414] text-zinc-300 border-white/10 hover:border-white/40'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parental Controls (Maturity Rating) */}
              <div className="space-y-2.5 pb-5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-[#E50914]" />
                    <span>مستوى الرقابة الأبوية (تصنيف الأعمار)</span>
                  </div>
                  <span className="text-xs text-zinc-400 font-semibold">
                    الحد المختار: {MATURITY_OPTIONS.find((o) => o.value === prefs.maturityRating)?.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {MATURITY_OPTIONS.map((opt) => {
                    const active = prefs.maturityRating === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isPrimaryProtected && opt.value === 'kids'}
                        onClick={() => {
                          setPrefs((p) => ({ ...p, maturityRating: opt.value }));
                          if (opt.value === 'kids' && !isPrimaryProtected) {
                            setIsKids(true);
                          } else if (opt.value !== 'kids' && isKids) {
                            setIsKids(false);
                          }
                        }}
                        title={opt.desc}
                        className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer disabled:opacity-40 ${
                          active
                            ? 'bg-[#E50914] text-white border-[#E50914]'
                            : 'bg-[#141414] text-zinc-300 border-white/10 hover:border-white/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-zinc-400">
                  {MATURITY_OPTIONS.find((o) => o.value === prefs.maturityRating)?.desc}
                </p>
              </div>

              {/* Subtitles & Autoplay Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Subtitles className="w-4 h-4 text-[#E50914]" />
                    <span>إعدادات الترجمة الافتراضية</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'ar', label: 'العربية' },
                        { id: 'en', label: 'English' },
                        { id: 'fr', label: 'الفرنسية' },
                        { id: 'none', label: 'بدون ترجمة' }
                      ] as Array<{ id: SubtitleLanguage; label: string }>
                    ).map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setPrefs((p) => ({ ...p, subtitleLanguage: sub.id }))}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                          prefs.subtitleLanguage === sub.id
                            ? 'bg-white text-black border-white'
                            : 'bg-[#141414] text-zinc-300 border-white/10 hover:border-white/40'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-zinc-400">حجم الخط:</span>
                    {(
                      [
                        { id: 'small', label: 'صغير' },
                        { id: 'medium', label: 'متوسط' },
                        { id: 'large', label: 'كبير' }
                      ] as Array<{ id: SubtitleSize; label: string }>
                    ).map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setPrefs((p) => ({ ...p, subtitleSize: sz.id }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                          prefs.subtitleSize === sz.id
                            ? 'bg-[#E50914] text-white'
                            : 'bg-white/5 text-zinc-300 hover:bg-white/15'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <PlayCircle className="w-4 h-4 text-[#E50914]" />
                    <span>عناصر التحكم في التشغيل التلقائي</span>
                  </div>

                  <label className="flex items-center justify-between gap-3 p-3 bg-[#141414] rounded-lg border border-white/10 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        تشغيل الحلقة التالية تلقائياً في السلاسل
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        الانتقال تلقائياً للحلقة أو الجزء التالي بعد انتهاء المشاهدة
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.autoplayNext}
                      onChange={(e) => setPrefs((p) => ({ ...p, autoplayNext: e.target.checked }))}
                      className="w-5 h-5 accent-[#E50914] cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 p-3 bg-[#141414] rounded-lg border border-white/10 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        تشغيل المعاينات تلقائياً أثناء التصفح
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        عرض نبض المعاينة عند التوقف على الأعمال في الصفحة الرئيسية
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.autoplayPreviews}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, autoplayPreviews: e.target.checked }))
                      }
                      className="w-5 h-5 accent-[#E50914] cursor-pointer shrink-0"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: WATCH HISTORY */}
          {activeSection === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    محفوظات المشاهدة الخاصة بـ {profile.name}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    سجل الأفلام والمسلسلات والقنوات التي تمت مشاهدتها على هذا الملف الشخصي
                  </p>
                </div>

                {watchHistory.length > 0 && (
                  confirmClearHistory ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClearHistory(profile.id);
                          setConfirmClearHistory(false);
                        }}
                        className="px-3.5 py-2 rounded-lg bg-[#E50914] hover:bg-[#f40612] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                      >
                        تأكيد مسح الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearHistory(false)}
                        className="px-3 py-2 rounded-lg bg-white/10 text-zinc-300 text-xs font-semibold cursor-pointer"
                      >
                        تراجع
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearHistory(true)}
                      className="px-3.5 py-2 rounded-lg bg-red-950/40 hover:bg-[#E50914] text-red-300 hover:text-white border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>مسح السجل بالكامل</span>
                    </button>
                  )
                )}
              </div>

              {watchHistory.length === 0 ? (
                <div className="py-12 text-center space-y-2 bg-[#141414] rounded-xl border border-white/5">
                  <History className="w-8 h-8 text-zinc-500 mx-auto" />
                  <p className="text-sm font-bold text-zinc-300">سجل المشاهدة فارغ حالياً</p>
                  <p className="text-xs text-zinc-500">
                    ستظهر هنا جميع الأفلام والمسلسلات التي يشاهدها هذا الملف الشخصي مع تاريخ المشاهدة.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10 max-h-80 overflow-y-auto bg-[#141414] rounded-xl border border-white/10">
                  {watchHistory.map((item) => (
                    <div
                      key={item.channelId}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-20 h-12 rounded-md overflow-hidden bg-black shrink-0 border border-white/10">
                          <ChannelThumbnail
                            channel={item.channel}
                            customCover={customCovers[item.channelId]}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">
                            {item.channel.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 flex-wrap">
                            <span>{item.channel.group}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{formatWatchDate(item.lastWatchedAt)}</span>
                            {item.progressPercent > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-[#E50914] font-semibold tabular-nums">
                                  {item.progressPercent}% مكتمل
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveHistoryItem(profile.id, item.channelId)}
                        aria-label={`حذف ${item.channel.name} من السجل`}
                        title="حذف من سجل المشاهدة"
                        className="min-w-[40px] min-h-[40px] rounded-lg bg-white/5 hover:bg-red-950/70 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer: Delete Profile (with Primary Protection) + Save */}
          <div className="pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            {isPrimaryProtected ? (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>الملف الرئيسي محمي من الحذف</span>
              </div>
            ) : confirmDeleteProfile ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteProfile(profile.id);
                    onClose();
                  }}
                  className="px-4 py-2.5 bg-[#E50914] hover:bg-[#f40612] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  تأكيد حذف الملف الشخصي
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteProfile(false)}
                  className="px-3.5 py-2.5 bg-white/10 text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteProfile(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 bg-red-950/25 hover:bg-red-950/60 text-red-400 hover:text-red-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف الملف الشخصي</span>
              </button>
            )}

            <div className="flex items-center gap-3 mr-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-zinc-200 text-xs sm:text-sm font-semibold rounded-lg cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-7 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm font-black rounded-lg shadow-lg cursor-pointer disabled:opacity-40 transition-colors"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
