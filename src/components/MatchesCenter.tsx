import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Clock,
  Tv,
  Play,
  RotateCcw,
  Sparkles,
  Shield,
  Crown,
  Flame,
  Radio,
  Info,
  X,
  Bell,
  BellRing
} from 'lucide-react';
import { MatchItem, MatchThemeId, TournamentId } from '../types/matches';
import { TOURNAMENT_LIST, TOURNAMENT_THEMES } from '../data/defaultMatches';

interface MatchesCenterProps {
  matches: MatchItem[];
  activeTheme: MatchThemeId;
  onSelectTheme: (theme: MatchThemeId) => void;
  onWatchMatch: (match: MatchItem) => void;
  remindedMatchIds: string[];
  onToggleRemindMatch: (match: MatchItem) => void;
}

const TEAM_COLORS = [
  'from-red-600 to-rose-900',
  'from-blue-600 to-indigo-900',
  'from-emerald-600 to-teal-900',
  'from-amber-500 to-orange-800',
  'from-purple-600 to-violet-900',
  'from-cyan-600 to-sky-900'
];

function getTeamGradient(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return TEAM_COLORS[sum % TEAM_COLORS.length];
}

function getTeamInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return 'FC';
  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`;
  }
  return cleaned.slice(0, 2);
}

const TournamentEmblem: React.FC<{ id: MatchThemeId; className?: string }> = ({ id, className = 'w-6 h-6' }) => {
  switch (id) {
    case 'ucl':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 2l2.4 5.2 5.6.7-4.1 3.9 1 5.6L12 14.7l-4.9 2.7 1-5.6L4 7.9l5.6-.7L12 2z" />
          <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 2" />
        </svg>
      );
    case 'laliga':
      return <Flame className={className} />;
    case 'epl':
      return <Crown className={className} />;
    case 'saudi':
      return <Trophy className={className} />;
    default:
      return <Tv className={className} />;
  }
};

// Twinkling stars positions for Champions League backdrop
const UCL_STARS = [
  { top: '8%', left: '12%', size: 12, delay: '0s' },
  { top: '15%', left: '78%', size: 16, delay: '0.4s' },
  { top: '24%', left: '34%', size: 10, delay: '0.9s' },
  { top: '18%', left: '90%', size: 14, delay: '0.2s' },
  { top: '42%', left: '8%', size: 14, delay: '0.7s' },
  { top: '55%', left: '86%', size: 12, delay: '1.1s' },
  { top: '70%', left: '22%', size: 16, delay: '0.5s' },
  { top: '76%', left: '66%', size: 11, delay: '1.3s' },
  { top: '35%', left: '58%', size: 10, delay: '0.8s' },
  { top: '86%', left: '44%', size: 14, delay: '0.3s' }
];

export const MatchesCenter: React.FC<MatchesCenterProps> = ({
  matches,
  activeTheme,
  onSelectTheme,
  onWatchMatch,
  remindedMatchIds,
  onToggleRemindMatch
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming'>('all');
  const [upcomingNotice, setUpcomingNotice] = useState<MatchItem | null>(null);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (targetTs?: number) => {
    if (!targetTs) return null;
    const diff = targetTs - nowTs;
    if (diff <= 0) return 'ينطلق الآن';
    const totalSec = Math.floor(diff / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const theme = TOURNAMENT_THEMES[activeTheme];

  const displayedMatches = useMemo(() => {
    return matches.filter((m) => {
      const matchesTournament = activeTheme === 'default' || m.tournament === activeTheme;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesTournament && matchesStatus;
    });
  }, [matches, activeTheme, statusFilter]);

  const liveCount = useMemo(
    () =>
      matches.filter(
        (m) => m.status === 'live' && (activeTheme === 'default' || m.tournament === activeTheme)
      ).length,
    [matches, activeTheme]
  );

  const handleUpcomingClick = (match: MatchItem) => {
    setUpcomingNotice(match);
    setTimeout(() => {
      setUpcomingNotice((prev) => (prev?.id === match.id ? null : prev));
    }, 4500);
  };

  return (
    <section
      className="relative min-h-screen pt-20 sm:pt-24 pb-28 px-4 sm:px-6 md:px-12 overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: theme.bgHex }}
    >
      {/* Dynamic Ambient Background Layers */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700 opacity-75"
        style={{
          background: `radial-gradient(circle at 20% 15%, ${theme.accentHex}38 0%, transparent 45%), radial-gradient(circle at 85% 25%, ${theme.accentHex}24 0%, transparent 50%)`
        }}
      />

      {/* Champions League Animated Stars Effect */}
      {activeTheme === 'ucl' && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden animate-in fade-in duration-700">
          {UCL_STARS.map((star, idx) => (
            <Sparkles
              key={idx}
              className="absolute text-blue-300/45 animate-pulse"
              style={{
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: star.delay
              }}
            />
          ))}
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Dynamic Tournament Hero Header */}
        <div
          className="rounded-3xl p-5 sm:p-8 border backdrop-blur-xl shadow-2xl mb-6 sm:mb-8 transition-all duration-700 relative overflow-hidden"
          style={{
            backgroundColor: `${theme.secondaryHex}cc`,
            borderColor: `${theme.accentHex}55`,
            boxShadow: `0 20px 60px -15px ${theme.accentHex}35`
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Emblem & Title */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-xl transition-all duration-700 border"
                style={{
                  backgroundColor: theme.accentHex,
                  color: theme.buttonTextHex,
                  borderColor: 'rgba(255,255,255,0.25)'
                }}
              >
                <TournamentEmblem id={activeTheme} className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors duration-500"
                    style={{
                      backgroundColor: `${theme.accentHex}28`,
                      color: activeTheme === 'epl' || activeTheme === 'saudi' ? theme.accentHex : '#ffffff',
                      border: `1px solid ${theme.accentHex}66`
                    }}
                  >
                    {theme.shortName}
                  </span>
                  {liveCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-black flex items-center gap-1.5 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>{liveCount} مباشر الآن</span>
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-3xl font-black text-white mt-1.5 tracking-wide">
                  {activeTheme === 'default' ? 'مركز المباريات المباشرة' : theme.name}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 mt-1">{theme.tagline}</p>
              </div>
            </div>

            {/* Reset to Default Awn Tv pro Theme Button */}
            {activeTheme !== 'default' && (
              <button
                onClick={() => onSelectTheme('default')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black/50 hover:bg-[#e50914] text-white border border-white/20 hover:border-[#e50914] text-xs font-extrabold transition-all cursor-pointer shadow-lg self-start lg:self-center shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>العودة للثيم الافتراضي (Awn Tv pro)</span>
              </button>
            )}
          </div>

          {/* Tournament Switcher Buttons */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-[11px] font-bold text-zinc-300 mb-3">
              اختر البطولة لتغيير الثيم وعرض المباريات:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {TOURNAMENT_LIST.map((t) => {
                const isSelected = activeTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTheme(t.id as TournamentId)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-right transition-all duration-300 cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'scale-[1.02] shadow-xl'
                        : 'bg-black/35 hover:bg-black/55 border-white/10 hover:border-white/25'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: t.accentHex,
                            color: t.buttonTextHex,
                            borderColor: '#ffffff80',
                            boxShadow: `0 10px 30px -5px ${t.accentHex}88`
                          }
                        : undefined
                    }
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        backgroundColor: isSelected ? 'rgba(0,0,0,0.22)' : `${t.accentHex}28`,
                        color: isSelected ? t.buttonTextHex : t.accentHex
                      }}
                    >
                      <TournamentEmblem id={t.id} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-black truncate ${
                          isSelected ? '' : 'text-white'
                        }`}
                      >
                        {t.name}
                      </p>
                      <p
                        className={`text-[10px] truncate mt-0.5 ${
                          isSelected ? 'opacity-85 font-semibold' : 'text-zinc-400'
                        }`}
                      >
                        {t.shortName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Polite Upcoming Match Notice Toast */}
        {upcomingNotice && (
          <div
            className="mb-6 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-300"
            style={{
              backgroundColor: `${theme.secondaryHex}ee`,
              borderColor: theme.accentHex
            }}
          >
            <div className="flex items-center gap-3 text-right">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${theme.accentHex}30`, color: theme.accentHex }}
              >
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-white">
                  البث المباشر سيتوفر فور انطلاق المباراة
                </p>
                <p className="text-[11px] text-zinc-300 mt-0.5">
                  {upcomingNotice.homeTeam} × {upcomingNotice.awayTeam} — {upcomingNotice.matchTime} عبر {upcomingNotice.channelName}
                </p>
              </div>
            </div>
            <button
              onClick={() => setUpcomingNotice(null)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Status Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'جميع المباريات' },
              { id: 'live', label: 'مباشر الآن 🔴' },
              { id: 'upcoming', label: 'قريباً ⏱️' }
            ].map((item) => {
              const active = statusFilter === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setStatusFilter(item.id as 'all' | 'live' | 'upcoming')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    active
                      ? 'shadow-md'
                      : 'bg-black/35 text-zinc-300 hover:text-white border-white/10'
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: theme.accentHex,
                          color: theme.buttonTextHex,
                          borderColor: theme.accentHex
                        }
                      : undefined
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-mono text-zinc-300">
            عرض {displayedMatches.length} مباراة
          </span>
        </div>

        {/* Matches Grid */}
        {displayedMatches.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-black/35 border border-white/10">
            <Trophy className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-white">لا توجد مباريات في هذا التصنيف حالياً</p>
            <p className="text-xs text-zinc-400 mt-1">
              يمكنك إضافة مباريات جديدة أو تغيير حالتها من لوحة التحكم (Admin).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {displayedMatches.map((match) => {
              const matchTournament = TOURNAMENT_THEMES[match.tournament];
              const cardAccent = activeTheme === 'default' ? matchTournament.accentHex : theme.accentHex;
              const cardBtnText = activeTheme === 'default' ? matchTournament.buttonTextHex : theme.buttonTextHex;
              const isLive = match.status === 'live';

              return (
                <div
                  key={match.id}
                  className="rounded-2xl p-4 sm:p-5 border backdrop-blur-md shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col justify-between gap-4"
                  style={{
                    backgroundColor: `${theme.secondaryHex}d9`,
                    borderColor: isLive ? `${cardAccent}88` : 'rgba(255,255,255,0.12)',
                    boxShadow: isLive ? `0 12px 35px -12px ${cardAccent}55` : undefined
                  }}
                >
                  {/* Card Top: Tournament Name + Live/Upcoming Status */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cardAccent}28`, color: cardAccent }}
                      >
                        <TournamentEmblem id={match.tournament} className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[11px] font-bold text-zinc-200 truncate">
                        {matchTournament.name}
                      </span>
                    </div>

                    {isLive ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center gap-1.5 shrink-0 shadow">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span>مباشر الآن</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 text-[10px] font-bold flex items-center gap-1 shrink-0 border border-white/10">
                        <Clock className="w-3 h-3" />
                        <span>قريباً</span>
                      </span>
                    )}
                  </div>

                  {/* Card Middle: Teams Matchup (Home vs Away) */}
                  <div className="flex items-center justify-between gap-2 py-2">
                    {/* Home Team */}
                    <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getTeamGradient(
                          match.homeTeam
                        )} flex items-center justify-center border border-white/20 shadow-lg relative`}
                      >
                        <Shield className="w-7 h-7 text-white/25 absolute" />
                        <span className="text-sm font-black text-white relative z-10">
                          {getTeamInitials(match.homeTeam)}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-white line-clamp-2">
                        {match.homeTeam}
                      </h3>
                    </div>

                    {/* VS Divider */}
                    <div className="flex flex-col items-center justify-center px-2 shrink-0">
                      <span
                        className="px-2.5 py-1 rounded-xl text-xs font-black tracking-wider border"
                        style={{
                          backgroundColor: `${cardAccent}22`,
                          color: cardAccent,
                          borderColor: `${cardAccent}55`
                        }}
                      >
                        VS
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getTeamGradient(
                          match.awayTeam
                        )} flex items-center justify-center border border-white/20 shadow-lg relative`}
                      >
                        <Shield className="w-7 h-7 text-white/25 absolute" />
                        <span className="text-sm font-black text-white relative z-10">
                          {getTeamInitials(match.awayTeam)}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-white line-clamp-2">
                        {match.awayTeam}
                      </h3>
                    </div>
                  </div>

                  {/* Card Info: Time (Jordan/Makkah) & Broadcaster Channel */}
                  <div className="space-y-1.5 text-[11px] text-zinc-300 bg-black/30 rounded-xl p-2.5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: cardAccent }} />
                      <span className="truncate">{match.matchTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tv className="w-3.5 h-3.5 shrink-0" style={{ color: cardAccent }} />
                      <span className="truncate font-semibold text-white">{match.channelName}</span>
                    </div>
                  </div>

                  {/* Smart Watch Button (Live vs Upcoming + Countdown & Remind Me) */}
                  {isLive ? (
                    <button
                      onClick={() => onWatchMatch(match)}
                      className="w-full h-11 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer hover:brightness-110 active:scale-95"
                      style={{
                        backgroundColor: cardAccent,
                        color: cardBtnText,
                        boxShadow: `0 8px 25px -5px ${cardAccent}88`
                      }}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>مشاهدة المباراة</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {match.kickoffTimestamp && (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-[11px]">
                          <span className="text-zinc-400">يبدأ خلال:</span>
                          <span
                            className="font-mono font-black tracking-wider tabular-nums"
                            style={{ color: cardAccent }}
                          >
                            {formatCountdown(match.kickoffTimestamp)}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpcomingClick(match)}
                          className="h-10 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/15 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>قريباً</span>
                        </button>

                        <button
                          onClick={() => onToggleRemindMatch(match)}
                          className={`h-10 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                            remindedMatchIds.includes(match.id)
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                              : 'bg-black/40 hover:bg-white/10 text-zinc-200 border-white/15'
                          }`}
                        >
                          {remindedMatchIds.includes(match.id) ? (
                            <>
                              <BellRing className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                              <span>مفعّل ✓</span>
                            </>
                          ) : (
                            <>
                              <Bell className="w-3.5 h-3.5" />
                              <span>ذكّرني</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
