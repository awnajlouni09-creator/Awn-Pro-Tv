import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Star, 
  Tv, 
  Radio, 
  Film, 
  Flame, 
  Sparkles,
  Layers,
  ChevronRight,
  Play,
  Newspaper,
  BookOpen,
  Clapperboard,
  Compass,
  Trophy,
  Smile,
  MonitorPlay
} from 'lucide-react';
import { Channel } from '../types/iptv';

interface ChannelSidebarProps {
  channels: Channel[];
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  favorites: string[];
  onToggleFavorite: (channelId: string) => void;
  focusedIndex: number;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  channels,
  currentChannel,
  onSelectChannel,
  favorites,
  onToggleFavorite,
  focusedIndex
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Group icons helper
  const getGroupIcon = (group: string) => {
    switch (group) {
      case 'قنوات إخبارية':
        return <Newspaper className="w-3.5 h-3.5 text-[#ff4d4d]" />;
      case 'إسلاميات ودين':
        return <BookOpen className="w-3.5 h-3.5 text-emerald-400" />;
      case 'مسلسلات عربية':
        return <Clapperboard className="w-3.5 h-3.5 text-purple-400" />;
      case 'أفلام أجنبية':
        return <Film className="w-3.5 h-3.5 text-amber-400" />;
      case 'وثائقي وطبيعة':
        return <Compass className="w-3.5 h-3.5 text-cyan-400" />;
      case 'رياضة وسرعة':
        return <Trophy className="w-3.5 h-3.5 text-yellow-400" />;
      case 'أطفال وكرتون':
        return <Smile className="w-3.5 h-3.5 text-pink-400" />;
      case 'منصات ذكية':
        return <MonitorPlay className="w-3.5 h-3.5 text-[#E50914]" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  // Extract unique groups in clean deliberate order
  const priorityGroupOrder = [
    'قنوات إخبارية',
    'إسلاميات ودين',
    'مسلسلات عربية',
    'أفلام أجنبية',
    'وثائقي وطبيعة',
    'رياضة وسرعة',
    'أطفال وكرتون',
    'منصات ذكية'
  ];

  const groups = useMemo(() => {
    const set = new Set<string>();
    channels.forEach(ch => {
      if (ch.group) set.add(ch.group);
    });

    const existing = Array.from(set);
    return existing.sort((a, b) => {
      const idxA = priorityGroupOrder.indexOf(a);
      const idxB = priorityGroupOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [channels]);

  // Filter channels based on search query, group, or favorites
  const filteredChannels = useMemo(() => {
    return channels.filter(ch => {
      // Favorites filter
      if (selectedGroup === 'favorites') {
        if (!favorites.includes(ch.id)) return false;
      } else if (selectedGroup !== 'all') {
        if (ch.group !== selectedGroup) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = ch.name.toLowerCase().includes(q);
        const matchesGroup = ch.group.toLowerCase().includes(q);
        const matchesDesc = (ch.description || '').toLowerCase().includes(q);
        return matchesName || matchesGroup || matchesDesc;
      }

      return true;
    });
  }, [channels, selectedGroup, searchQuery, favorites]);

  // Auto-scroll when keyboard focus changes
  useEffect(() => {
    if (focusedIndex >= 0 && listContainerRef.current) {
      const activeEl = listContainerRef.current.querySelector(`[data-index="${focusedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedIndex]);

  return (
    <aside className="w-80 md:w-96 bg-[#141414] border-l border-[#262626] flex flex-col h-full shrink-0 select-none overflow-hidden z-20">
      {/* Sidebar Header & Search */}
      <div className="p-3.5 border-b border-[#262626] space-y-3 bg-[#161616]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#ff1a1a]" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              دليل القنوات والباقات
            </h2>
          </div>
          <span className="text-xs font-mono text-[#ff4d4d] bg-[#cc0000]/10 px-2 py-0.5 rounded border border-[#cc0000]/20">
            {filteredChannels.length} / {channels.length}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن قناة، مسلسل، فيلم، أو بالرقم..."
            className="w-full h-9 bg-[#1f1f1f] text-white text-xs pl-8 pr-8 rounded-lg border border-[#333333] focus:border-[#cc0000] focus:ring-1 focus:ring-[#cc0000] focus:outline-none transition-all placeholder:text-zinc-500"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute right-2.5 top-2.5 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-2.5 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category / Group Filter Tabs with Icons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
          <button
            onClick={() => setSelectedGroup('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedGroup === 'all'
                ? 'bg-[#cc0000] text-white shadow-sm shadow-[#cc0000]/30 font-bold'
                : 'bg-[#1f1f1f] text-zinc-400 hover:text-white hover:bg-[#282828]'
            }`}
          >
            <span>الكل ({channels.length})</span>
          </button>

          <button
            onClick={() => setSelectedGroup('favorites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedGroup === 'favorites'
                ? 'bg-amber-600 text-white shadow-sm font-bold'
                : 'bg-[#1f1f1f] text-zinc-400 hover:text-amber-400 hover:bg-[#282828]'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>المفضلة ({favorites.length})</span>
          </button>

          {groups.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedGroup === group
                  ? 'bg-[#cc0000] text-white shadow-sm font-bold'
                  : 'bg-[#1f1f1f] text-zinc-400 hover:text-white hover:bg-[#282828]'
              }`}
            >
              {getGroupIcon(group)}
              <span>{group}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Channels List */}
      <div 
        ref={listContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1.5 focus:outline-none"
        tabIndex={0}
      >
        {filteredChannels.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Radio className="w-8 h-8 text-zinc-600 mx-auto mb-2 animate-bounce" />
            <p className="text-xs text-zinc-400 font-medium">لم يتم العثور على محتوى يطابق البحث</p>
            <p className="text-[11px] text-zinc-600 mt-1">جرب مسح البحث أو اختيار باقة أخرى</p>
          </div>
        ) : (
          filteredChannels.map((channel, index) => {
            const isPlaying = currentChannel?.id === channel.id;
            const isFav = favorites.includes(channel.id);
            const isKeyboardFocused = focusedIndex === index;

            return (
              <div
                key={channel.id}
                data-index={index}
                onClick={() => onSelectChannel(channel)}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-gradient-to-r from-[#cc0000]/25 to-[#1c1c1c] border-[#cc0000] shadow-md shadow-[#cc0000]/10 text-white'
                    : isKeyboardFocused
                    ? 'bg-[#222222] border-[#ff1a1a] text-white scale-[0.99]'
                    : 'bg-[#181818] hover:bg-[#202020] border-[#242424] text-zinc-300 hover:text-white'
                }`}
              >
                {/* Left side: Channel number & Logo & Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Channel Number */}
                  <span className={`text-xs font-mono font-bold w-6 text-center shrink-0 ${
                    isPlaying ? 'text-[#ff4d4d]' : 'text-zinc-500'
                  }`}>
                    {(index + 1).toString().padStart(2, '0')}
                  </span>

                  {/* Channel Logo / Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border ${
                    isPlaying 
                      ? 'bg-[#cc0000]/30 border-[#cc0000]' 
                      : 'bg-[#222222] border-[#303030]'
                  }`}>
                    {channel.logo ? (
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      getGroupIcon(channel.group)
                    )}
                  </div>

                  {/* Channel Name & Category */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-bold truncate leading-tight ${
                        isPlaying ? 'text-white' : 'text-zinc-200'
                      }`}>
                        {channel.name}
                      </p>
                      {isPlaying && (
                        <span className="flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#ff1a1a] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#cc0000]"></span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                      <span className="truncate max-w-[120px]">{channel.group || 'عام'}</span>
                      {channel.resolution && (
                        <>
                          <span className="text-zinc-600">·</span>
                          <span className={`text-[10px] font-mono px-1 py-0.2 rounded font-semibold ${
                            channel.resolution === '4K'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : channel.resolution === 'FHD'
                              ? 'bg-[#cc0000]/20 text-[#ff4d4d]'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {channel.resolution}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center gap-1 shrink-0 mr-1">
                  {/* Favorite button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(channel.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isFav 
                        ? 'text-amber-400 hover:text-amber-300' 
                        : 'text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100'
                    }`}
                    title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  {/* Play Indicator / Shortcut */}
                  <div className={`p-1 rounded-md ${isPlaying ? 'text-[#ff4d4d]' : 'text-zinc-500 opacity-0 group-hover:opacity-100'}`}>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer Hint */}
      <div className="p-2.5 bg-[#121212] border-t border-[#262626] text-[11px] text-zinc-500 flex items-center justify-between">
        <span>استخدم الأسهم ⬆ ⬇ للتنقل</span>
        <span className="font-mono text-zinc-400">Enter للتشغيل</span>
      </div>
    </aside>
  );
};
