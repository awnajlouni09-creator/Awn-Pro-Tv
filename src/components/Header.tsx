import React, { useRef, useState } from 'react';
import { 
  Tv, 
  FolderOpen, 
  Film, 
  Link2, 
  Smartphone, 
  Download, 
  Code2, 
  Sparkles,
  Info,
  LogIn,
  Users,
  Smile,
  ChevronDown,
  LogOut,
  Lock
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { UserProfile } from '../types/profile';

interface HeaderProps {
  onLoadM3UFile: (file: File) => void;
  onLoadLocalVideo: (file: File) => void;
  onOpenUrlModal: () => void;
  onOpenRemoteModal: () => void;
  onOpenPythonModal: () => void;
  onOpenNetflix: () => void;
  onExportM3U: () => void;
  channelCount: number;
  activeProfile: UserProfile | null;
  onRequestSwitchProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadM3UFile,
  onLoadLocalVideo,
  onOpenUrlModal,
  onOpenRemoteModal,
  onOpenPythonModal,
  onOpenNetflix,
  onExportM3U,
  channelCount,
  activeProfile,
  onRequestSwitchProfile
}) => {
  const m3uInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleM3UChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadM3UFile(file);
      e.target.value = '';
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadLocalVideo(file);
      e.target.value = '';
    }
  };

  const isKids = activeProfile?.isKids;

  return (
    <header className={`h-16 border-b px-4 md:px-6 flex items-center justify-between gap-4 select-none shrink-0 z-30 transition-colors ${
      isKids 
        ? 'bg-[#181a20] border-amber-500/40' 
        : 'bg-[#121212] border-[#262626]'
    }`}>
      {/* Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border ${
          isKids
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30 border-amber-400/50'
            : 'bg-gradient-to-br from-[#cc0000] to-[#800000] shadow-[#cc0000]/30 border-[#ff1a1a]/40'
        }`}>
          {isKids ? (
            <Smile className="w-5 h-5 text-white animate-bounce" />
          ) : (
            <Tv className="w-5 h-5 text-white animate-pulse" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-wider text-white font-['Outfit']">
              Awn Tv <span className={isKids ? 'text-amber-400' : 'text-[#ff1a1a]'}>pro</span>
            </span>
            {isKids ? (
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-black shadow">
                KIDS أطفال
              </span>
            ) : (
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#cc0000]/20 text-[#ff4d4d] border border-[#cc0000]/30">
                IPTV 4K
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 hidden sm:block">
            {isKids ? 'وضع الأطفال الآمن والمحتوى الترفيهي الممتع' : 'رسيفر ذكي ومشغل وسائط وبث مباشر متكامل'}
          </p>
        </div>
      </div>

      {/* Hidden file inputs */}
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

      {/* Quick Actions Zone */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {/* Netflix Direct Button (Hidden in Kids Mode for safety) */}
        {!isKids && (
          <button
            onClick={onOpenNetflix}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-[#E50914]/25 cursor-pointer whitespace-nowrap active:scale-95 border border-[#ff3333]/30"
            title="فتح منصة نتفلكس جو التطبيق وتسجيل الدخول بحسابك"
          >
            <span className="font-['Outfit'] font-black">NETFLIX</span>
            <span>جو التطبيق</span>
          </button>
        )}

        {/* Load M3U Button */}
        {!isKids && (
          <button
            onClick={() => m3uInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-[#cc0000] hover:bg-[#ff1a1a] text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-[#cc0000]/20 cursor-pointer whitespace-nowrap active:scale-95"
            title="فتح ملف قنوات بصيغة .m3u أو .m3u8 من جهازك"
          >
            <FolderOpen className="w-4 h-4" />
            <span>فتح قائمة M3U</span>
          </button>
        )}

        {/* Load Local Movie Button */}
        <button
          onClick={() => videoInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 bg-[#1f1f1f] hover:bg-[#2b2b2b] text-zinc-200 hover:text-white text-xs font-medium rounded-lg border border-[#333333] transition-all cursor-pointer whitespace-nowrap active:scale-95"
          title="تشغيل فيلم أو مقطع فيديو من القرصل الصلب"
        >
          <Film className="w-4 h-4 text-[#ff4d4d]" />
          <span>{isKids ? 'تشغيل كرتون محلي' : 'فيلم محلي'}</span>
        </button>

        {/* Add URL stream */}
        {!isKids && (
          <button
            onClick={onOpenUrlModal}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] hover:bg-[#262626] text-zinc-300 hover:text-white text-xs font-medium rounded-lg border border-[#2d2d2d] transition-all cursor-pointer whitespace-nowrap active:scale-95"
            title="إضافة رابط بث يوتيوب أو IPTV مباشر"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">رابط مباشر</span>
          </button>
        )}

        {/* Virtual TV Remote */}
        <button
          onClick={onOpenRemoteModal}
          className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] hover:bg-[#262626] text-zinc-300 hover:text-white text-xs font-medium rounded-lg border border-[#2d2d2d] transition-all cursor-pointer whitespace-nowrap active:scale-95"
          title="فتح ريموت الرسيفر التفاعلي الذكي"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#ff4d4d]" />
          <span className="hidden lg:inline">الريموت</span>
        </button>

        {/* Python Standalone Desktop App Export Modal */}
        {!isKids && (
          <button
            onClick={onOpenPythonModal}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600/20 to-orange-600/20 hover:from-amber-600/30 hover:to-orange-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-95"
            title="تحميل كود بايثون وطريقة تحويله لملف مستقل (.exe) للويندوز"
          >
            <Code2 className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">نسخة الويندوز (.exe)</span>
          </button>
        )}

        {/* ACTIVE USER PROFILE CAPSULE (Netflix Profile Header) */}
        {activeProfile && (
          <div className="relative shrink-0 mr-1">
            <button
              onClick={() => setIsProfileMenuOpen(prev => !prev)}
              className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                isKids
                  ? 'bg-amber-500/20 border-amber-400 hover:bg-amber-500/30 text-amber-300'
                  : 'bg-[#1c1c1c] hover:bg-[#252525] border-[#333333] text-white'
              }`}
            >
              {/* Profile Avatar */}
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/30 shrink-0 bg-zinc-800">
                <img
                  src={activeProfile.avatar}
                  alt={activeProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Name & Badge */}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-none truncate max-w-[80px]">
                  {activeProfile.name}
                </p>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  {isKids ? 'حساب أطفال 🧸' : 'حساب المشاهدة'}
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div
                className="absolute left-0 top-full mt-2 w-52 bg-[#181818] border border-[#2b2b2b] rounded-2xl p-2 shadow-2xl z-50 text-right animate-in fade-in zoom-in-95"
                onMouseLeave={() => setIsProfileMenuOpen(false)}
              >
                <div className="p-2 border-b border-[#262626] mb-1">
                  <p className="text-xs font-bold text-white">{activeProfile.name}</p>
                  <p className="text-[11px] text-zinc-400">
                    {isKids ? 'مفعل: حماية الأطفال والكرتون' : 'الحساب النشط حالياً'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onRequestSwitchProfile();
                  }}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-[#252525] rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#ff1a1a]" />
                    <span>تبديل الحساب</span>
                  </span>
                  {isKids && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onRequestSwitchProfile();
                  }}
                  className="w-full flex items-center gap-2 p-2.5 hover:bg-[#252525] rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>الخروج إلى شاشة الدخول</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
