import React, { useState, useRef } from 'react';
import {
  Plus,
  Pencil,
  Check,
  Trash2,
  X,
  Lock,
  Upload,
  Smile,
  KeyRound
} from 'lucide-react';
import { UserProfile } from '../types/profile';
import {
  AVAILABLE_AVATARS,
  AVAILABLE_AVATARS_WITH_KIDS,
  DEFAULT_KIDS_AVATAR_URL,
  DEFAULT_KIDS_EXIT_PIN
} from '../data/defaultProfiles';
import { PinPromptModal } from './PinPromptModal';

interface ProfileSelectionProps {
  profiles: UserProfile[];
  onSelectProfile: (profile: UserProfile) => void;
  onAddProfile: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  onLockSubscriptionGate?: () => void;
}

export const ProfileSelection: React.FC<ProfileSelectionProps> = ({
  profiles,
  onSelectProfile,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
  onLockSubscriptionGate
}) => {
  const [isManaging, setIsManaging] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [pendingLockedProfile, setPendingLockedProfile] = useState<UserProfile | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form states for Add / Edit
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
    setConfirmDeleteId(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (profile: UserProfile) => {
    setEditingProfile(profile);
    setFormName(profile.name);
    setFormAvatar(profile.avatar);
    setFormIsKids(profile.isKids);
    setFormPinEnabled(Boolean(profile.pin));
    setFormPin(profile.pin || (profile.isKids ? DEFAULT_KIDS_EXIT_PIN : ''));
    setConfirmDeleteId(null);
  };

  const handleProfileCardClick = (profile: UserProfile) => {
    if (isManaging) {
      openEditModal(profile);
      return;
    }

    // Kids profile ALWAYS enters directly without PIN (PIN is only required to exit Kids mode)
    if (profile.isKids) {
      onSelectProfile(profile);
      return;
    }

    // Standard profile with optional PIN lock prompts for PIN on entry
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
      pin: normalizedPin(),
      bgColor: formIsKids ? '#f59e0b' : '#E50914'
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !formName.trim()) return;

    onUpdateProfile({
      ...editingProfile,
      name: formName.trim(),
      avatar: formAvatar,
      isKids: formIsKids,
      pin: normalizedPin()
    });

    setEditingProfile(null);
  };

  const renderAvatarGallery = () => (
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
              className={`group/av relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer bg-zinc-900 ${
                isSelected
                  ? 'border-white scale-105 shadow-[0_0_16px_rgba(255,255,255,0.45)] ring-2 ring-[#E50914]'
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
  );

  const renderPinControl = (checkboxId: string) => (
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
                ? 'يدخل الأطفال مباشرة، ويُطلب هذا الرمز عند الخروج لشاشة الحسابات (الافتراضي 6767).'
                : 'اطلب رمزاً من 4 أرقام قبل الدخول إلى هذا الحساب.'}
            </span>
          </div>
        </div>

        {!formIsKids && (
          <input
            type="checkbox"
            id={checkboxId}
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
        <div className="pt-1">
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
          {!formIsKids && formPin.length > 0 && formPin.length < 4 && (
            <p className="text-[10px] text-amber-400 mt-1.5">
              يجب إدخال 4 أرقام كاملة لتفعيل القفل.
            </p>
          )}
        </div>
      )}
    </div>
  );

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
          من يشاهد الآن؟
        </h1>

        {/* Profiles Grid */}
        <div className="flex flex-wrap items-start justify-center gap-5 sm:gap-7 md:gap-9 mb-10 sm:mb-14">
          {profiles.map((profile) => {
            const fallbackUrl = AVAILABLE_AVATARS[0].fallbackUrl;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleProfileCardClick(profile)}
                className="group flex flex-col items-center cursor-pointer focus:outline-none active:scale-95 transition-transform duration-200"
              >
                {/* Avatar Box with Scale 1.08 + Bright White Ring on Hover */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-xl overflow-hidden border-[3px] border-transparent group-hover:border-white group-focus-visible:border-white group-hover:scale-[1.08] group-focus-visible:scale-[1.08] transition-all duration-200 ease-out bg-zinc-900 shadow-lg group-hover:shadow-[0_0_28px_rgba(255,255,255,0.28)]">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.src !== fallbackUrl) img.src = fallbackUrl;
                    }}
                    className="w-full h-full object-cover"
                  />

                  {/* Kids Badge overlay */}
                  {profile.isKids && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-black font-extrabold text-[10px] tracking-wide shadow flex items-center gap-1">
                      <Smile className="w-3 h-3" />
                      <span>أطفال</span>
                    </div>
                  )}

                  {/* PIN Protected indicator (shown on locked non-Kids profiles, or manage hint) */}
                  {!profile.isKids && profile.pin && (
                    <div
                      className="absolute bottom-2 left-2 p-1.5 rounded-md bg-black/75 text-white border border-white/20"
                      title="محمي برمز PIN"
                    >
                      <Lock className="w-3 h-3" />
                    </div>
                  )}

                  {/* Manage Mode Overlay */}
                  {isManaging && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity">
                      <div className="w-11 h-11 rounded-full bg-black/50 border-2 border-white flex items-center justify-center text-white shadow-xl">
                        <Pencil className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Name (Illuminates cleanly on hover) */}
                <span className="mt-3.5 text-sm sm:text-base md:text-lg font-medium text-zinc-400 group-hover:text-white group-focus-visible:text-white group-hover:font-bold group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.65)] transition-all duration-200 truncate max-w-[140px]">
                  {profile.name}
                </span>
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
              <span className="mt-3.5 text-sm sm:text-base md:text-lg font-medium text-zinc-400 group-hover:text-white group-hover:font-bold group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.65)] transition-all duration-200">
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

      {/* Hidden file input for uploading custom avatar */}
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
              {/* Profile Name & Selected Avatar Preview */}
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

              {/* 15 Avatars Gallery + Upload */}
              {renderAvatarGallery()}

              {/* Kids Option Checkbox */}
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

              {/* Optional 4-digit PIN lock */}
              {renderPinControl('pinLockAdd')}

              {/* Action Buttons */}
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

      {/* EDIT PROFILE MODAL */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-white/15 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative text-white animate-in fade-in zoom-in-95 duration-200 my-auto">
            <button
              type="button"
              onClick={() => setEditingProfile(null)}
              className="absolute top-5 left-5 p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">تعديل الملف الشخصي</h2>
            <p className="text-xs text-zinc-400 mb-5">
              عدّل الاسم أو اختر صورة رمزية جديدة أو فعّل القفل برمز PIN
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-right">
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
                    className="w-full h-11 bg-[#1e1e1e] text-white text-sm px-3.5 rounded-xl border border-white/15 focus:border-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* 15 Avatars Gallery + Upload */}
              {renderAvatarGallery()}

              {/* Kids Option */}
              <div className="p-3.5 bg-[#1a1a1a] rounded-2xl border border-white/10 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="isKidsEdit"
                  checked={formIsKids}
                  onChange={(e) => handleToggleKidsMode(e.target.checked)}
                  className="rounded accent-amber-400 w-5 h-5 mt-0.5 cursor-pointer"
                />
                <label htmlFor="isKidsEdit" className="cursor-pointer select-none">
                  <span className="text-xs font-bold text-white block">
                    حساب أطفال (Kids Profile)
                  </span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    حظر كل القنوات العامة وعرض كرتون الأطفال فقط.
                  </span>
                </label>
              </div>

              {/* Optional 4-digit PIN lock */}
              {renderPinControl('pinLockEdit')}

              {/* Actions & Inline Delete Confirm */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                {profiles.length > 1 ? (
                  confirmDeleteId === editingProfile.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteProfile(editingProfile.id);
                          setEditingProfile(null);
                          setConfirmDeleteId(null);
                        }}
                        className="px-3 py-2 bg-[#E50914] hover:bg-[#f6121d] text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        تأكيد الحذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-2 bg-white/10 text-zinc-300 rounded-xl text-xs cursor-pointer"
                      >
                        تراجع
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(editingProfile.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الملف</span>
                    </button>
                  )
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(null)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-7 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-colors"
                  >
                    حفظ التعديلات
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Optional Profile Entry PIN Prompt (For PIN-locked non-Kids profiles) */}
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
        title={pendingLockedProfile ? `حساب "${pendingLockedProfile.name}" محمي` : 'حساب محمي'}
        subtitle="أدخل رمز الحماية (PIN) المكون من 4 أرقام لفتح هذا الملف الشخصي"
        errorHint="رمز PIN غير صحيح. يرجى المحاولة مرة أخرى."
      />
    </div>
  );
};
