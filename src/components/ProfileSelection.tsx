import React, { useState, useRef } from 'react';
import {
  Plus,
  Pencil,
  Check,
  X,
  Lock,
  Upload,
  Smile,
  KeyRound
} from 'lucide-react';
import { UserProfile } from '../types/profile';
import { ContinueWatchingItem } from '../types/history';
import {
  AVAILABLE_AVATARS,
  AVAILABLE_AVATARS_WITH_KIDS,
  DEFAULT_KIDS_AVATAR_URL,
  DEFAULT_KIDS_EXIT_PIN,
  DEFAULT_KIDS_PROFILE_PREFERENCES,
  DEFAULT_PROFILE_PREFERENCES
} from '../data/defaultProfiles';
import { PinPromptModal } from './PinPromptModal';
import { ProfileManagementModal } from './ProfileManagementModal';

interface ProfileSelectionProps {
  profiles: UserProfile[];
  onSelectProfile: (profile: UserProfile) => void;
  onAddProfile: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  onLockSubscriptionGate?: () => void;
  getProfileHistory?: (profileId: string) => ContinueWatchingItem[];
  onRemoveHistoryItem?: (profileId: string, channelId: string) => void;
  onClearHistory?: (profileId: string) => void;
  customCovers?: Record<string, string>;
}

export const ProfileSelection: React.FC<ProfileSelectionProps> = ({
  profiles,
  onSelectProfile,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
  onLockSubscriptionGate,
  getProfileHistory,
  onRemoveHistoryItem,
  onClearHistory,
  customCovers = {}
}) => {
  const [isManaging, setIsManaging] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [pendingLockedProfile, setPendingLockedProfile] = useState<UserProfile | null>(null);
  const [, setHistoryRefreshTick] = useState(0);

  // Add Profile form states
  const [formName, setFormName] = useState('');
  const [formAvatar, setFormAvatar] = useState(AVAILABLE_AVATARS[0].url);
  const [formIsKids, setFormIsKids] = useState(false);
  const [formPinEnabled, setFormPinEnabled] = useState(false);
  const [formPin, setFormPin] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAddModal = () => {
    const nextAvatarIndex = profiles.length % AVAILABLE_AVATARS.length;
    setFormName('');
    setFormAvatar(AVAILABLE_AVATARS[nextAvatarIndex].url);
    setFormIsKids(false);
    setFormPinEnabled(false);
    setFormPin('');
    setIsAddModalOpen(true);
  };

  const handleProfileCardClick = (profile: UserProfile) => {
    if (isManaging) {
      setEditingProfile(profile);
      return;
    }

    // Kids profile enters directly without PIN (PIN is required to exit Kids mode)
    if (profile.isKids) {
      onSelectProfile(profile);
      return;
    }

    // Locked standard profile prompts for 4-digit PIN in 4 Netflix-style boxes
    if (profile.pin && /^\d{4}$/.test(profile.pin)) {
      setPendingLockedProfile(profile);
      return;
    }

    onSelectProfile(profile);
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleToggleKidsMode = (checked: boolean) => {
    setFormIsKids(checked);
    if (checked) {
      setFormAvatar(DEFAULT_KIDS_AVATAR_URL);
      if (!formPin) {
        setFormPinEnabled(true);
        setFormPin(DEFAULT_KIDS_EXIT_PIN);
      }
    }
  };

  const normalizedPin = () => {
    const digits = formPin.replace(/\D/g, '').slice(0, 4);
    if (formIsKids) {
      return digits.length === 4 ? digits : DEFAULT_KIDS_EXIT_PIN;
    }
    if (!formPinEnabled || digits.length !== 4) return undefined;
    return digits;
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    onAddProfile({
      name: formName.trim(),
      avatar: formAvatar,
      isKids: formIsKids,
      isPrimary: false,
      pin: normalizedPin(),
      bgColor: formIsKids ? '#f59e0b' : '#E50914',
      preferences: formIsKids
        ? { ...DEFAULT_KIDS_PROFILE_PREFERENCES }
        : { ...DEFAULT_PROFILE_PREFERENCES }
    });

    setIsAddModalOpen(false);
  };

  const isProfilePrimaryProtected = (profile: UserProfile): boolean => {
    if (profiles.length <= 1) return true;
    if (profile.isPrimary) return true;
    const anyExplicitPrimary = profiles.some((p) => p.isPrimary);
    return !anyExplicitPrimary && profiles[0]?.id === profile.id;
  };

  const readWatchHistoryForProfile = (profileId: string): ContinueWatchingItem[] => {
    if (getProfileHistory) return getProfileHistory(profileId);
    try {
      const raw = localStorage.getItem(`awn_tv_continue_watching_v1_${profileId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  };

  const removeHistoryItemForProfile = (profileId: string, channelId: string) => {
    if (onRemoveHistoryItem) {
      onRemoveHistoryItem(profileId, channelId);
    } else {
      try {
        const current = readWatchHistoryForProfile(profileId).filter(
          (item) => item.channelId !== channelId
        );
        localStorage.setItem(`awn_tv_continue_watching_v1_${profileId}`, JSON.stringify(current));
      } catch {}
    }
    setHistoryRefreshTick((t) => t + 1);
  };

  const clearHistoryForProfile = (profileId: string) => {
    if (onClearHistory) {
      onClearHistory(profileId);
    } else {
      try {
        localStorage.removeItem(`awn_tv_continue_watching_v1_${profileId}`);
      } catch {}
    }
    setHistoryRefreshTick((t) => t + 1);
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#141414] flex flex-col items-center justify-center p-6 select-none overflow-y-auto">
      {/* Subtle top atmospheric vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(229,9,20,0.10)_0%,transparent_55%)] pointer-events-none" />

      {/* Brand Header */}
      <div className="absolute top-5 right-5 sm:top-8 sm:right-10 left-5 sm:left-10 flex items-center justify-between gap-2 z-10">
        <span
          className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight font-['Outfit'] text-[#E50914]"
          style={{ textShadow: '0 2px 14px rgba(0,0,0,0.65)' }}
        >
          Awn Tv pro
        </span>

        {onLockSubscriptionGate && (
          <button
            type="button"
            onClick={onLockSubscriptionGate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-[#E50914]" />
            <span>بوابة الاشتراك</span>
          </button>
        )}
      </div>

      {/* Main Content Box */}
      <div className="relative z-10 flex flex-col items-center max-w-5xl w-full text-center py-8 sm:py-12 animate-in fade-in zoom-in-95 duration-300">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-9 sm:mb-12">
          {isManaging ? 'إدارة الملفات الشخصية:' : 'من يشاهد الآن؟'}
        </h1>

        {/* Profiles Grid */}
        <div className="flex flex-wrap items-start justify-center gap-5 sm:gap-7 md:gap-9 mb-10 sm:mb-14">
          {profiles.map((profile) => {
            const fallbackUrl = AVAILABLE_AVATARS[0].fallbackUrl;
            const isLocked = Boolean(!profile.isKids && profile.pin && /^\d{4}$/.test(profile.pin));

            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleProfileCardClick(profile)}
                className="group flex flex-col items-center cursor-pointer focus:outline-none active:scale-95 transition-transform duration-200"
              >
                {/* Avatar Box */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-xl overflow-hidden border-[3px] border-transparent group-hover:border-white group-focus-visible:border-white group-hover:scale-[1.08] group-focus-visible:scale-[1.08] transition-all duration-200 ease-out bg-zinc-900 shadow-lg group-hover:shadow-[0_0_28px_rgba(255,255,255,0.28)]">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.src !== fallbackUrl) img.src = fallbackUrl;
                    }}
                    className={`w-full h-full object-cover transition-opacity ${
                      isManaging ? 'opacity-55' : 'opacity-100'
                    }`}
                  />

                  {/* Kids Badge overlay */}
                  {profile.isKids && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-400 text-black font-extrabold text-[10px] tracking-wide shadow flex items-center gap-1">
                      <Smile className="w-3 h-3" />
                      <span>أطفال</span>
                    </div>
                  )}

                  {/* Manage Mode Pencil Overlay */}
                  {isManaging && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-black/60 border-2 border-white flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                        <Pencil className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Name */}
                <span className="mt-3.5 text-sm sm:text-base md:text-lg font-medium text-zinc-400 group-hover:text-white group-focus-visible:text-white group-hover:font-bold transition-all duration-200 truncate max-w-[140px]">
                  {profile.name}
                </span>

                {/* Small Lock Icon UNDER the account photo & name (Netflix Style) */}
                {isLocked && (
                  <div
                    className="mt-1.5 text-zinc-500 group-hover:text-white transition-colors flex items-center justify-center"
                    title="محمي برمز PIN"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}

          {/* Add Profile Card */}
          {profiles.length < 6 && (
            <button
              type="button"
              onClick={openAddModal}
              className="group flex flex-col items-center cursor-pointer focus:outline-none active:scale-95 transition-transform duration-200"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-xl border-[3px] border-dashed border-zinc-700 group-hover:border-white group-focus-visible:border-white flex items-center justify-center text-zinc-400 group-hover:text-white transition-all duration-200 ease-out group-hover:scale-[1.08] group-focus-visible:scale-[1.08] bg-zinc-900/50 group-hover:bg-zinc-800/80 group-hover:shadow-[0_0_28px_rgba(255,255,255,0.22)]">
                <Plus className="w-10 h-10 md:w-12 md:h-12 transition-transform duration-200 group-hover:scale-110" />
              </div>
              <span className="mt-3.5 text-sm sm:text-base md:text-lg font-medium text-zinc-400 group-hover:text-white group-hover:font-bold transition-all duration-200">
                إضافة ملف شخصي
              </span>
            </button>
          )}
        </div>

        {/* Manage Profiles Toggle Button */}
        <button
          type="button"
          onClick={() => setIsManaging((prev) => !prev)}
          className={`px-8 py-2.5 rounded text-xs sm:text-sm font-bold tracking-wider transition-all cursor-pointer border ${
            isManaging
              ? 'bg-white text-black border-white shadow-lg hover:bg-zinc-200'
              : 'bg-transparent text-zinc-400 hover:text-white border-zinc-600 hover:border-white'
          }`}
        >
          {isManaging ? 'تم' : 'إدارة الملفات الشخصية'}
        </button>
      </div>

      {/* Hidden file input for Add Profile custom avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCustomAvatarUpload}
        accept="image/*"
        className="hidden"
      />

      {/* ADD PROFILE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-white/15 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative text-white animate-in fade-in zoom-in-95 duration-200 my-auto">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 left-5 p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">إضافة ملف شخصي</h2>
            <p className="text-xs text-zinc-400 mb-5">
              أنشئ حساباً جديداً واختر اسمك وصورتك الرمزية المفضلة
            </p>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-right">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-white shrink-0 bg-zinc-900 shadow-lg">
                  <img
                    src={formAvatar}
                    alt="الصورة المختارة"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    اسم الملف الشخصي *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="اكتب اسمك هنا..."
                    className="w-full h-11 bg-[#1e1e1e] text-white text-sm px-3.5 rounded-xl border border-white/15 focus:border-white focus:outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-zinc-200">
                    اختر صورة شخصية من المعرض ({AVAILABLE_AVATARS_WITH_KIDS.length} شخصية):
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-semibold text-white bg-white/10 hover:bg-[#E50914] px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صورة من الجهاز</span>
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2.5 p-3 bg-[#1a1a1a] rounded-2xl border border-white/10 max-h-60 overflow-y-auto">
                  {AVAILABLE_AVATARS_WITH_KIDS.map((av) => {
                    const isSelected = formAvatar === av.url;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        title={av.label}
                        onClick={() => setFormAvatar(av.url)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer bg-zinc-900 ${
                          isSelected
                            ? 'border-white scale-105 ring-2 ring-[#E50914]'
                            : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105 hover:border-white/60'
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
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-[#E50914] flex items-center justify-center shadow-lg">
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 bg-[#1a1a1a] rounded-2xl border border-white/10 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="isKidsAdd"
                  checked={formIsKids}
                  onChange={(e) => handleToggleKidsMode(e.target.checked)}
                  className="rounded accent-amber-400 w-5 h-5 mt-0.5 cursor-pointer"
                />
                <label htmlFor="isKidsAdd" className="cursor-pointer select-none">
                  <span className="text-xs font-bold text-white block">
                    حساب مخصص للأطفال (Kids Profile)
                  </span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5 leading-relaxed">
                    يدخل مباشرة لبوابة الأطفال والكرتون الآمنة، ويحجب القنوات الإخبارية والأفلام العامة.
                  </span>
                </label>
              </div>

              <div className="p-3.5 bg-[#1a1a1a] rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-4 h-4 text-[#E50914] shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {formIsKids ? 'رمز الخروج من وضع الأطفال (PIN)' : 'قفل الحساب برمز سري (PIN اختياري)'}
                      </span>
                      <span className="text-[11px] text-zinc-400 block">
                        {formIsKids
                          ? 'يدخل الأطفال مباشرة، ويُطلب هذا الرمز عند الخروج (الافتراضي 6767).'
                          : 'اطلب رمزاً من 4 أرقام قبل الدخول إلى هذا الحساب.'}
                      </span>
                    </div>
                  </div>
                  {!formIsKids && (
                    <input
                      type="checkbox"
                      checked={formPinEnabled}
                      onChange={(e) => {
                        setFormPinEnabled(e.target.checked);
                        if (!e.target.checked) setFormPin('');
                      }}
                      className="rounded accent-[#E50914] w-5 h-5 cursor-pointer shrink-0"
                    />
                  )}
                </div>

                {(formPinEnabled || formIsKids) && (
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder={formIsKids ? 'الافتراضي: 6767' : 'أدخل 4 أرقام (مثال: 2025)'}
                    dir="ltr"
                    className="w-full h-10 bg-[#121212] text-white text-sm px-3.5 rounded-xl border border-white/15 focus:border-white focus:outline-none transition-all font-mono tracking-[0.45em] text-center"
                  />
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!formName.trim()}
                  className="px-7 py-2.5 bg-[#E50914] hover:bg-[#f6121d] text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer disabled:opacity-50 transition-colors"
                >
                  متابعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE PROFILE MANAGEMENT & PREFERENCES MODAL */}
      <ProfileManagementModal
        profile={editingProfile}
        isOpen={Boolean(editingProfile)}
        onClose={() => setEditingProfile(null)}
        onSaveProfile={(updated) => {
          onUpdateProfile(updated);
          setEditingProfile(null);
        }}
        onDeleteProfile={(id) => {
          onDeleteProfile(id);
          setEditingProfile(null);
        }}
        isPrimaryProtected={editingProfile ? isProfilePrimaryProtected(editingProfile) : true}
        watchHistory={editingProfile ? readWatchHistoryForProfile(editingProfile.id) : []}
        onRemoveHistoryItem={removeHistoryItemForProfile}
        onClearHistory={clearHistoryForProfile}
        customCovers={customCovers}
      />

      {/* 4-BOX NETFLIX PIN PROMPT FOR LOCKED PROFILES */}
      <PinPromptModal
        isOpen={Boolean(pendingLockedProfile)}
        onClose={() => setPendingLockedProfile(null)}
        onSuccess={() => {
          if (pendingLockedProfile) {
            const target = pendingLockedProfile;
            setPendingLockedProfile(null);
            onSelectProfile(target);
          }
        }}
        expectedPin={pendingLockedProfile?.pin || ''}
        title={pendingLockedProfile ? `قفل الملف الشخصي: ${pendingLockedProfile.name}` : 'حساب محمي'}
        subtitle="أدخل رمز الحماية (PIN) المكون من 4 أرقام للدخول إلى هذا الملف الشخصي"
        errorHint="رمز PIN غير صحيح. يرجى المحاولة مرة أخرى."
      />
    </div>
  );
};
