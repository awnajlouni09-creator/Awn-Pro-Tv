import React, { useState, useRef } from 'react';
import {
  Palette,
  Users,
  Plus,
  Trash2,
  Upload,
  Star,
  MessageSquare,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { CastMember, Channel, TitleReview } from '../types/iptv';
import { compressImageFileToDataUrl } from '../utils/titleReviewsStorage';

export interface TitleDetailsDraft {
  primaryColor: string;
  secondaryColor: string;
  backdrop: string;
  year: string;
  durationLabel: string;
  maturityRating: '' | NonNullable<Channel['maturityRating']>;
  genresText: string;
  imdbRating: string;
  director: string;
  castMembers: CastMember[];
  reviews: TitleReview[];
}

export const createEmptyTitleDetailsDraft = (): TitleDetailsDraft => ({
  primaryColor: '',
  secondaryColor: '',
  backdrop: '',
  year: '',
  durationLabel: '',
  maturityRating: '',
  genresText: '',
  imdbRating: '',
  director: '',
  castMembers: [],
  reviews: []
});

export const createDraftFromChannel = (ch: Channel): TitleDetailsDraft => ({
  primaryColor: ch.primaryColor || '',
  secondaryColor: ch.secondaryColor || '',
  backdrop: ch.backdrop || '',
  year: ch.year || '',
  durationLabel: ch.durationLabel || '',
  maturityRating: ch.maturityRating || '',
  genresText: Array.isArray(ch.genres) ? ch.genres.join(', ') : '',
  imdbRating: ch.imdbRating || '',
  director: ch.director || '',
  castMembers: Array.isArray(ch.castMembers)
    ? ch.castMembers.map((m) => ({ ...m }))
    : Array.isArray(ch.cast)
    ? ch.cast.map((name, idx) => ({ id: `cast-init-${idx}`, name, character: '', imageUrl: '' }))
    : [],
  reviews: Array.isArray(ch.reviews) ? ch.reviews.map((r) => ({ ...r })) : []
});

export const applyDraftToChannelFields = (
  draft: TitleDetailsDraft
): Pick<
  Channel,
  | 'primaryColor'
  | 'secondaryColor'
  | 'backdrop'
  | 'year'
  | 'durationLabel'
  | 'maturityRating'
  | 'genres'
  | 'imdbRating'
  | 'director'
  | 'castMembers'
  | 'cast'
  | 'reviews'
> => {
  const genres = draft.genresText
    .split(/[,،]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const castMembers = draft.castMembers
    .map((m) => ({
      id: m.id || `cast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: m.name.trim(),
      character: m.character?.trim() || undefined,
      imageUrl: m.imageUrl?.trim() || undefined
    }))
    .filter((m) => m.name.length > 0);

  const reviews = draft.reviews
    .map((r) => ({
      ...r,
      authorName: r.authorName.trim() || 'مقيّم',
      comment: r.comment.trim(),
      rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
      likesCount: Math.max(0, Number(r.likesCount) || 0)
    }))
    .filter((r) => r.comment.length > 0);

  return {
    primaryColor: draft.primaryColor.trim() || undefined,
    secondaryColor: draft.secondaryColor.trim() || undefined,
    backdrop: draft.backdrop.trim() || undefined,
    year: draft.year.trim() || undefined,
    durationLabel: draft.durationLabel.trim() || undefined,
    maturityRating: draft.maturityRating || undefined,
    genres: genres.length > 0 ? genres : undefined,
    imdbRating: draft.imdbRating.trim() || undefined,
    director: draft.director.trim() || undefined,
    castMembers: castMembers.length > 0 ? castMembers : undefined,
    cast: undefined,
    reviews: reviews.length > 0 ? reviews : undefined
  };
};

const COLOR_PRESETS: Array<{ label: string; primary: string; secondary: string }> = [
  { label: 'عنابي وبني دافئ', primary: '#59121a', secondary: '#2a1c16' },
  { label: 'أزرق ليلي ورمادي', primary: '#102840', secondary: '#1c1f29' },
  { label: 'زمردي داكن', primary: '#0f3328', secondary: '#1a2420' },
  { label: 'بنفسجي وذهبي داكن', primary: '#331542', secondary: '#292015' },
  { label: 'أسود سينمائي', primary: '#1c1c20', secondary: '#111114' }
];

interface AdminTitleDetailsFieldsProps {
  draft: TitleDetailsDraft;
  onChange: (next: TitleDetailsDraft) => void;
  visitorReviews?: TitleReview[];
  onDeleteVisitorReview?: (reviewId: string) => void;
}

export const AdminTitleDetailsFields: React.FC<AdminTitleDetailsFieldsProps> = ({
  draft,
  onChange,
  visitorReviews = [],
  onDeleteVisitorReview
}) => {
  const backdropFileRef = useRef<HTMLInputElement>(null);
  const reviewAvatarFileRef = useRef<HTMLInputElement>(null);
  const castFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Draft for adding a new admin review
  const [newRevAuthor, setNewRevAuthor] = useState('');
  const [newRevAvatar, setNewRevAvatar] = useState('');
  const [newRevDate, setNewRevDate] = useState(() =>
    new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
  );
  const [newRevRating, setNewRevRating] = useState(5);
  const [newRevComment, setNewRevComment] = useState('');
  const [newRevLikes, setNewRevLikes] = useState('0');

  const handleBackdropUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 1080, 0.8);
      onChange({ ...draft, backdrop: dataUrl });
    } catch {
      // ignore
    }
  };

  const handleAddActor = () => {
    const nextMember: CastMember = {
      id: `cast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      character: '',
      imageUrl: ''
    };
    onChange({ ...draft, castMembers: [...draft.castMembers, nextMember] });
  };

  const handleUpdateActor = (id: string, patch: Partial<CastMember>) => {
    onChange({
      ...draft,
      castMembers: draft.castMembers.map((m) => (m.id === id ? { ...m, ...patch } : m))
    });
  };

  const handleActorImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 320, 0.78);
      handleUpdateActor(id, { imageUrl: dataUrl });
    } catch {
      // ignore
    }
  };

  const handleRemoveActor = (id: string) => {
    onChange({
      ...draft,
      castMembers: draft.castMembers.filter((m) => m.id !== id)
    });
  };

  const handleReviewAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 220, 0.78);
      setNewRevAvatar(dataUrl);
    } catch {
      // ignore
    }
  };

  const handleAddReview = () => {
    if (!newRevComment.trim()) return;
    const rev: TitleReview = {
      id: `rev-admin-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      authorName: newRevAuthor.trim() || 'مراجعة Awn Tv',
      authorAvatar: newRevAvatar.trim() || undefined,
      date:
        newRevDate.trim() ||
        new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }),
      rating: newRevRating,
      comment: newRevComment.trim(),
      likesCount: Math.max(0, parseInt(newRevLikes, 10) || 0),
      repliesCount: 0,
      replies: [],
      source: 'admin'
    };
    onChange({ ...draft, reviews: [rev, ...draft.reviews] });
    setNewRevAuthor('');
    setNewRevAvatar('');
    setNewRevComment('');
    setNewRevRating(5);
    setNewRevLikes('0');
  };

  const handleDeleteAdminReview = (reviewId: string) => {
    onChange({
      ...draft,
      reviews: draft.reviews.filter((r) => r.id !== reviewId)
    });
  };

  return (
    <div className="space-y-5 pt-3 border-t border-white/10">
      {/* 1. TWO-TONE COLOR SYSTEM & WIDE BACKDROP */}
      <div className="p-4 rounded-2xl bg-[#111111] border border-[#282828] space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#e50914]" />
            <span>ألوان صفحة العمل المزدوجة (Two-Tone) وصورة الخلفية</span>
          </h4>

          {(draft.primaryColor || draft.secondaryColor) && (
            <button
              type="button"
              onClick={() => onChange({ ...draft, primaryColor: '', secondaryColor: '' })}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة للافتراضي</span>
            </button>
          )}
        </div>

        {/* Color Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
              اللون الأساسي (Primary Color)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(draft.primaryColor) ? draft.primaryColor : '#59121a'}
                onChange={(e) => onChange({ ...draft, primaryColor: e.target.value })}
                className="w-11 h-10 rounded-xl bg-transparent border border-[#333333] cursor-pointer shrink-0 p-0.5"
              />
              <input
                type="text"
                value={draft.primaryColor}
                onChange={(e) => onChange({ ...draft, primaryColor: e.target.value })}
                placeholder="#59121a"
                dir="ltr"
                className="flex-1 h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
              اللون الثانوي (Secondary Color)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(draft.secondaryColor) ? draft.secondaryColor : '#2a1c16'}
                onChange={(e) => onChange({ ...draft, secondaryColor: e.target.value })}
                className="w-11 h-10 rounded-xl bg-transparent border border-[#333333] cursor-pointer shrink-0 p-0.5"
              />
              <input
                type="text"
                value={draft.secondaryColor}
                onChange={(e) => onChange({ ...draft, secondaryColor: e.target.value })}
                placeholder="#2a1c16"
                dir="ltr"
                className="flex-1 h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Quick Cinema Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-zinc-400">قوالب سريعة:</span>
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() =>
                onChange({
                  ...draft,
                  primaryColor: preset.primary,
                  secondaryColor: preset.secondary
                })
              }
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1b1b1b] hover:bg-[#252525] border border-[#303030] text-[11px] text-zinc-200 cursor-pointer transition-colors"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/25"
                style={{
                  background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`
                }}
              />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        {/* Wide Backdrop Image */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
            صورة الخلفية العريضة للعمل (Backdrop — اختياري)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={draft.backdrop.startsWith('data:') ? '' : draft.backdrop}
              onChange={(e) => onChange({ ...draft, backdrop: e.target.value })}
              placeholder={
                draft.backdrop.startsWith('data:')
                  ? 'تم رفع صورة خلفية من الجهاز ✓'
                  : 'رابط صورة الخلفية العريضة (يستخدم الغلاف تلقائياً إذا تُرك فارغاً)'
              }
              dir="ltr"
              className="flex-1 h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono"
            />
            <input
              ref={backdropFileRef}
              type="file"
              accept="image/*"
              onChange={handleBackdropUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => backdropFileRef.current?.click()}
              className="h-10 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-600 text-[11px] font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#ff4d4d]" />
              <span>رفع خلفية</span>
            </button>
            {draft.backdrop && (
              <button
                type="button"
                onClick={() => onChange({ ...draft, backdrop: '' })}
                className="h-10 px-3 rounded-xl bg-red-950/40 hover:bg-[#e50914] text-red-300 hover:text-white text-[11px] font-bold shrink-0 cursor-pointer"
              >
                مسح
              </button>
            )}
          </div>
          {draft.backdrop && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-400">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <img
                src={draft.backdrop}
                alt="معاينة الخلفية"
                className="h-10 w-20 rounded object-cover border border-white/15"
              />
              <span>معاينة الخلفية العريضة المفعّلة</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. METADATA FIELDS (Year, Duration, Age Rating, Genres, IMDb Rating, Director) */}
      <div className="p-4 rounded-2xl bg-[#111111] border border-[#282828] space-y-3">
        <p className="text-xs font-extrabold text-white">
          بيانات العمل التفصيلية (اترك أي حقل فارغاً لإخفائه تلقائياً في صفحة الفيلم)
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">السنة</label>
            <input
              type="text"
              value={draft.year}
              onChange={(e) => onChange({ ...draft, year: e.target.value })}
              placeholder="مثال: 2025"
              className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">المدة</label>
            <input
              type="text"
              value={draft.durationLabel}
              onChange={(e) => onChange({ ...draft, durationLabel: e.target.value })}
              placeholder="مثال: 2h 15m"
              className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              التصنيف العمري
            </label>
            <select
              value={draft.maturityRating}
              onChange={(e) =>
                onChange({
                  ...draft,
                  maturityRating: e.target.value as TitleDetailsDraft['maturityRating']
                })
              }
              className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-2.5 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none cursor-pointer"
            >
              <option value="">(فارغ / مخفي)</option>
              <option value="عائلي">عائلي</option>
              <option value="7+">+7</option>
              <option value="13+">+13 (PG-13)</option>
              <option value="16+">+16</option>
              <option value="18+">+18</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              تقييم IMDb / النجوم
            </label>
            <input
              type="text"
              value={draft.imdbRating}
              onChange={(e) => onChange({ ...draft, imdbRating: e.target.value })}
              placeholder="مثال: 8.6"
              className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              النوع / التصنيفات (مفصولة بفاصلة)
            </label>
            <input
              type="text"
              value={draft.genresText}
              onChange={(e) => onChange({ ...draft, genresText: e.target.value })}
              placeholder="Action, Adventure, Fantasy"
              className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              المخرج (اختياري)
            </label>
            <input
              type="text"
              value={draft.director}
              onChange={(e) => onChange({ ...draft, director: e.target.value })}
              placeholder="اسم المخرج..."
              className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. CAST & CREW BUILDER */}
      <div className="p-4 rounded-2xl bg-[#111111] border border-[#282828] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>طاقم التمثيل (Cast & Crew) ({draft.castMembers.length})</span>
          </h4>

          <button
            type="button"
            onClick={handleAddActor}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#e50914] hover:bg-[#ff1a1a] text-white text-[11px] font-extrabold cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ إضافة ممثل</span>
          </button>
        </div>

        {draft.castMembers.length === 0 ? (
          <p className="text-[11px] text-zinc-500">
            لم تتم إضافة ممثلين بعد — سيختفي قسم طاقم التمثيل تلقائياً من صفحة الفيلم حتى تضيف ممثلاً.
          </p>
        ) : (
          <div className="space-y-2.5">
            {draft.castMembers.map((member, idx) => (
              <div
                key={member.id}
                className="p-3 rounded-xl bg-[#181818] border border-[#2c2c2c] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-white/20 bg-zinc-900 flex items-center justify-center shrink-0">
                    {member.imageUrl ? (
                      <img
                        src={member.imageUrl}
                        alt={member.name || `ممثل ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>

                  <input
                    ref={(el) => {
                      castFileInputRefs.current[member.id] = el;
                    }}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleActorImageUpload(member.id, e)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => castFileInputRefs.current[member.id]?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    title="رفع صورة الممثل"
                  >
                    <Upload className="w-3 h-3" />
                    <span>صورة</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => handleUpdateActor(member.id, { name: e.target.value })}
                    placeholder="اسم الممثل *"
                    className="h-9 bg-[#111] text-white text-xs px-2.5 rounded-lg border border-[#333] focus:border-[#e50914] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={member.character || ''}
                    onChange={(e) => handleUpdateActor(member.id, { character: e.target.value })}
                    placeholder="اسم الشخصية في العمل"
                    className="h-9 bg-[#111] text-white text-xs px-2.5 rounded-lg border border-[#333] focus:border-[#e50914] focus:outline-none"
                  />
                  <input
                    type="url"
                    value={(member.imageUrl || '').startsWith('data:') ? '' : member.imageUrl || ''}
                    onChange={(e) => handleUpdateActor(member.id, { imageUrl: e.target.value })}
                    placeholder={
                      (member.imageUrl || '').startsWith('data:')
                        ? 'صورة مرفوعة من الجهاز ✓'
                        : 'أو رابط صورة الممثل URL'
                    }
                    dir="ltr"
                    className="h-9 bg-[#111] text-white text-[11px] px-2.5 rounded-lg border border-[#333] focus:border-[#e50914] focus:outline-none font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveActor(member.id)}
                  className="p-2 rounded-lg bg-red-950/40 hover:bg-[#e50914] text-[#ff4d4d] hover:text-white border border-[#e50914]/30 self-end sm:self-center cursor-pointer"
                  title="حذف الممثل"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. RATINGS & REVIEWS MANAGER */}
      <div className="p-4 rounded-2xl bg-[#111111] border border-[#282828] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>
              إدارة التقييمات والآراء ({draft.reviews.length + visitorReviews.length})
            </span>
          </h4>
        </div>

        {/* Add Review Mini Form */}
        <div className="p-3 rounded-xl bg-[#181818] border border-[#2c2c2c] space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-300">إضافة تقييم / رأي يدوياً:</span>
            <div className="flex items-center gap-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewRevRating(s)}
                  className="p-0.5 cursor-pointer"
                >
                  <Star
                    className={`w-4 h-4 ${
                      s <= newRevRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newRevAuthor}
              onChange={(e) => setNewRevAuthor(e.target.value)}
              placeholder="اسم المقيّم"
              className="h-9 bg-[#111] text-white text-xs px-2.5 rounded-lg border border-[#333] focus:border-[#e50914] focus:outline-none"
            />
            <input
              type="text"
              value={newRevDate}
              onChange={(e) => setNewRevDate(e.target.value)}
              placeholder="التاريخ (مثال: 2026)"
              className="h-9 bg-[#111] text-white text-xs px-2.5 rounded-lg border border-[#333] focus:border-[#e50914] focus:outline-none"
            />
            <div className="flex gap-1.5">
              <input
                type="url"
                value={newRevAvatar.startsWith('data:') ? '' : newRevAvatar}
                onChange={(e) => setNewRevAvatar(e.target.value)}
                placeholder={newRevAvatar.startsWith('data:') ? 'صورة مرفوعة ✓' : 'رابط صورة المقيّم'}
                dir="ltr"
                className="flex-1 h-9 bg-[#111] text-white text-[11px] px-2 rounded-lg border border-[#333] focus:border-[#e50914] focus:outline-none font-mono"
              />
              <input
                ref={reviewAvatarFileRef}
                type="file"
                accept="image/*"
                onChange={handleReviewAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => reviewAvatarFileRef.current?.click()}
                className="h-9 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newRevComment}
              onChange={(e) => setNewRevComment(e.target.value)}
              placeholder="نص التقييم أو الرأي..."
              className="flex-1 h-9 bg-[#111] text-white text-xs px-3 rounded-lg border border-[#333] focus:border-[#e50914] focus:outline-none"
            />
            <input
              type="number"
              min={0}
              value={newRevLikes}
              onChange={(e) => setNewRevLikes(e.target.value)}
              title="عدد الإعجابات"
              placeholder="إعجابات"
              className="w-20 h-9 bg-[#111] text-white text-xs px-2 rounded-lg border border-[#333] focus:border-[#e50914] focus:outline-none font-mono text-center"
            />
            <button
              type="button"
              onClick={handleAddReview}
              disabled={!newRevComment.trim()}
              className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-extrabold shrink-0 cursor-pointer"
            >
              + إضافة التقييم
            </button>
          </div>
        </div>

        {/* Existing Admin + Visitor Reviews List */}
        {(draft.reviews.length > 0 || visitorReviews.length > 0) && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {draft.reviews.map((r) => (
              <div
                key={r.id}
                className="p-2.5 rounded-xl bg-[#181818] border border-[#2c2c2c] flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span>{r.authorName}</span>
                    <span className="text-amber-400 font-mono text-[11px]">★ {r.rating}</span>
                    <span className="text-[10px] text-zinc-500">{r.date}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                      إدارة
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{r.comment}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAdminReview(r.id)}
                  className="p-1.5 rounded-lg bg-red-950/40 hover:bg-[#e50914] text-[#ff4d4d] hover:text-white cursor-pointer shrink-0"
                  title="حذف التقييم"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {visitorReviews.map((r) => (
              <div
                key={r.id}
                className="p-2.5 rounded-xl bg-[#181818] border border-emerald-500/20 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span>{r.authorName}</span>
                    <span className="text-amber-400 font-mono text-[11px]">★ {r.rating}</span>
                    <span className="text-[10px] text-zinc-500">{r.date}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      زائر
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{r.comment}</p>
                </div>
                {onDeleteVisitorReview && (
                  <button
                    type="button"
                    onClick={() => onDeleteVisitorReview(r.id)}
                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-[#e50914] text-[#ff4d4d] hover:text-white cursor-pointer shrink-0"
                    title="حذف تعليق الزائر"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
