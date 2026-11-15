import React from 'react';
import { 
  Home, 
  Newspaper, 
  Clapperboard, 
  Smile, 
  User, 
  BookOpen,
  Sparkles,
  Music,
  Trophy,
  Gamepad2
} from 'lucide-react';
import { NavTab } from './NetflixNavbar';
import { UserProfile } from '../types/profile';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeProfile: UserProfile | null;
  onOpenProfileSwitcher: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  activeProfile,
  onOpenProfileSwitcher
}) => {
  const isKids = activeProfile?.isKids;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-zinc-800/80 px-1.5 py-1.5 md:hidden select-none safe-area-pb shadow-[0_-8px_25px_rgba(0,0,0,0.8)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}
    >
      <div className="flex items-center justify-between gap-0.5 max-w-lg mx-auto overflow-x-auto no-scrollbar">
        {/* 1. الرئيسية (Home) */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center min-w-[46px] flex-1 py-1 px-0.5 transition-all cursor-pointer relative ${
            activeTab === 'home'
              ? 'text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {activeTab === 'home' && (
            <span className="absolute -top-1.5 w-5 h-0.5 bg-[#e50914] rounded-full" />
          )}
          <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-[#e50914]' : ''}`} />
          <span className="text-[9px] mt-1 font-medium whitespace-nowrap">الرئيسية</span>
        </button>

        {/* 2. المباريات (Matches) - Only in standard mode */}
        {!isKids && (
          <button
            onClick={() => onSelectTab('matches')}
            className={`flex flex-col items-center justify-center min-w-[46px] flex-1 py-1 px-0.5 transition-all cursor-pointer relative ${
              activeTab === 'matches'
                ? 'text-emerald-400 font-bold'
                : 'text-zinc-500 hover:text-emerald-400'
            }`}
          >
            {activeTab === 'matches' && (
              <span className="absolute -top-1.5 w-5 h-0.5 bg-emerald-400 rounded-full" />
            )}
            <Trophy className={`w-4 h-4 ${activeTab === 'matches' ? 'text-emerald-400' : ''}`} />
            <span className="text-[9px] mt-1 font-medium whitespace-nowrap">المباريات</span>
          </button>
        )}

        {/* 3. الأخبار (News) - Only in standard mode */}
        {!isKids && (
          <button
            onClick={() => onSelectTab('news')}
            className={`flex flex-col items-center justify-center min-w-[46px] flex-1 py-1 px-0.5 transition-all cursor-pointer relative ${
              activeTab === 'news'
                ? 'text-white font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {activeTab === 'news' && (
              <span className="absolute -top-1.5 w-5 h-0.5 bg-[#e50914] rounded-full" />
            )}
            <div className="relative">
              <Newspaper className={`w-4 h-4 ${activeTab === 'news' ? 'text-[#e50914]' : ''}`} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#e50914] animate-pulse" />
            </div>
            <span className="text-[9px] mt-1 font-medium whitespace-nowrap">الأخبار</span>
          </button>
        )}

        {/* 3. المسلسلات (Series) - Only in standard mode */}
        {!isKids && (
          <button
            onClick={() => onSelectTab('series')}
            className={`flex flex-col items-center justify-center min-w-[46px] flex-1 py-1 px-0.5 transition-all cursor-pointer relative ${
              activeTab === 'series'
                ? 'text-white font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {activeTab === 'series' && (
              <span className="absolute -top-1.5 w-5 h-0.5 bg-[#e50914] rounded-full" />
            )}
            <Clapperboard className={`w-4 h-4 ${activeTab === 'series' ? 'text-[#e50914]' : ''}`} />
            <span className="text-[9px] mt-1 font-medium whitespace-nowrap">مسلسلات</span>
          </button>
        )}

        {/* 4. ملخصات أنمي (Anime Summaries) - Only in standard mode */}
        {!isKids && (
          <button
            onClick={() => onSelectTab('anime')}
            className={`flex flex-col items-center justify-center min-w-[46px] flex-1 py-1 px-0.5 transition-all cursor-pointer relative ${
              activeTab === 'anime'
                ? 'text-fuchsia-400 font-bold'
                : 'text-zinc-500 hover:text-fuchsia-400'
            }`}
          >
            {activeTab === 'anime' && (
              <span className="absolute -top-1.5 w-5 h-0.5 bg-fuchsia-500 rounded-full" />
            )}
            <Sparkles className={`w-4 h-4 ${activeTab === 'anime' ? 'text-fuchsia-400' : ''}`} />
            <span className="text-[9px] mt-1 font-medium whitespace-nowrap">أنمي</span>
          </button>
        )}

        {/* 5. الأغاني (Music) - Only in standard mode */}
        {!isKids && (
          <button
            onClick={() => onSelectTab('music')}
            className={`flex flex-col items-center justify-center min-w-[46px] flex-1 py-1 px-0.5 transition-all cursor-pointer relative ${
              activeTab === 'music'
                ? 'text-rose-400 font-bold'
                : 'text-zinc-500 hover:text-rose-400'
            }`}
          >
            {activeTab === 'music' && (
              <span className="absolute -top-1.5 w-5 h-0.5 bg-rose-500 rounded-full" />
            )}
            <Music className={`w-4 h-4 ${activeTab === 'music' ? 'text-rose-400' : ''}`} />
            <span className="text-[9px] mt-1 font-medium whitespace-nowrap">أغاني</span>
          </button>
        )}

        {/* 6. القصص (Stories) - Only in standard mode */}
        {!isKids && (
          <button
            onClick={() => onSelectTab('stories')}
            className={`flex flex-col items-center justify-center min-w-[46px] flex-1 py-1 px-0.5 transition-all cursor-pointer relative ${
              activeTab === 'stories'
                ? 'text-indigo-400 font-bold'
                : 'text-zinc-500 hover:text-indigo-400'
            }`}
          >
            {activeTab === 'stories' && (
              <span className="absolute -top-1.5 w-5 h-0.5 bg-indigo-500 rounded-full" />
            )}
            <BookOpen className={`w-4 h-4 ${activeTab === 'stories' ? 'text-indigo-400' : ''}`} />
            <span className="text-[9px] mt-1 font-medium whitespace-nowrap">القصص</span>
          </button>
        )}

        {/* 7. الأطفال (Kids) */}
        <button
          onClick={() => onSelectTab('kids')}
          className={`flex flex-col items-center justify-center min-w-[46px] flex-1 py-1 px-0.5 transition-all cursor-pointer relative ${
            activeTab === 'kids'
              ? 'text-amber-400 font-bold'
              : 'text-zinc-500 hover:text-amber-400'
          }`}
        >
          {activeTab === 'kids' && (
            <span className="absolute -top-1.5 w-5 h-0.5 bg-amber-400 rounded-full" />
          )}
          <Smile className={`w-4 h-4 ${activeTab === 'kids' ? 'text-amber-400 fill-amber-400/20' : ''}`} />
          <span className="text-[9px] mt-1 font-medium whitespace-nowrap">الأطفال</span>
        </button>

        {/* 7b. الألعاب (Mini-Games) */}
        <button
          onClick={() => onSelectTab('games')}
          className={`flex flex-col items-center justify-center min-w-[46px] flex-1 py-1 px-0.5 transition-all cursor-pointer relative ${
            activeTab === 'games'
              ? 'text-[#ff4d4d] font-bold'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          {activeTab === 'games' && (
            <span className="absolute -top-1.5 w-5 h-0.5 bg-[#e50914] rounded-full" />
          )}
          <Gamepad2 className={`w-4 h-4 ${activeTab === 'games' ? 'text-[#e50914]' : ''}`} />
          <span className="text-[9px] mt-1 font-medium whitespace-nowrap">الألعاب</span>
        </button>

        {/* 8. حسابي (My Profile) */}
        <button
          onClick={onOpenProfileSwitcher}
          className="flex flex-col items-center justify-center min-w-[46px] flex-1 py-1 px-0.5 text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          {activeProfile?.avatar ? (
            <div className="w-4.5 h-4.5 rounded-md overflow-hidden border border-zinc-600 bg-zinc-800">
              <img
                src={activeProfile.avatar}
                alt={activeProfile.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <User className="w-4 h-4" />
          )}
          <span className="text-[9px] mt-1 font-medium truncate max-w-[44px] whitespace-nowrap">
            {activeProfile?.name || 'حسابي'}
          </span>
        </button>
      </div>
    </nav>
  );
};
