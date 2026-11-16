import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Film,
  Tv,
  Trophy
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { MatchItem } from '../types/matches';
import { BreakingTickerConfig } from '../types/notifications';

export interface InstalledAppVersionInfo {
  version: string;
  versionName: string;
  updatedAt?: string;
  notes?: string;
}

export interface UpdatePackagePayload {
  version: string;
  versionName: string;
  notes?: string;
  channels?: Channel[];
  categories?: string[];
  customCovers?: Record<string, string>;
  heroChannelIds?: string[];
  matches?: MatchItem[];
  tickerConfig?: BreakingTickerConfig;
}

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: InstalledAppVersionInfo;
  onApplyUpdate: (payload: UpdatePackagePayload) => {
    channelsCount: number;
    moviesAndSeriesCount: number;
    matchesCount: number;
  };
}

const normalizeChannelItem = (raw: unknown, fallbackGroup: string, index: number): Channel | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const name = typeof obj.name === 'string' ? obj.name.trim() : '';
  const url = typeof obj.url === 'string' ? obj.url.trim() : '';
  if (!name || (!url && !Array.isArray(obj.servers))) return null;

  return {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : `upd-ch-${Date.now()}-${index}`,
    name,
    url,
    group: typeof obj.group === 'string' && obj.group.trim() ? obj.group.trim() : fallbackGroup,
    logo: typeof obj.logo === 'string' ? obj.logo : undefined,
    poster: typeof obj.poster === 'string' ? obj.poster : undefined,
    backdrop: typeof obj.backdrop === 'string' ? obj.backdrop : undefined,
    badge: typeof obj.badge === 'string' ? obj.badge : undefined,
    resolution:
      obj.resolution === '4K' || obj.resolution === 'FHD' || obj.resolution === 'HD' || obj.resolution === 'SD'
        ? obj.resolution
        : 'HD',
    type:
      obj.type === 'hls' ||
      obj.type === 'live' ||
      obj.type === 'local' ||
      obj.type === 'netflix' ||
      obj.type === 'vod' ||
      obj.type === 'web' ||
      obj.type === 'youtube'
        ? obj.type
        : obj.type === 'mp4'
        ? 'vod'
        : undefined,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    youtubeId: typeof obj.youtubeId === 'string' ? obj.youtubeId : undefined,
    embedUrl: typeof obj.embedUrl === 'string' ? obj.embedUrl : undefined,
    servers: Array.isArray(obj.servers) ? (obj.servers as Channel['servers']) : undefined
  };
};

export const UpdatesModal: React.FC<UpdatesModalProps> = ({
  isOpen,
  onClose,
  currentVersion,
  onApplyUpdate
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [installedSummary, setInstalledSummary] = useState<{
    version: string;
    versionName: string;
    channelsCount: number;
    moviesAndSeriesCount: number;
    matchesCount: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMessage(null);
    setInstalledSummary(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rawText = ev.target?.result;
        if (typeof rawText !== 'string') {
          setErrorMessage('تعذر قراءة محتوى الملف.');
          return;
        }
        const parsed = JSON.parse(rawText) as Record<string, unknown>;
        if (!parsed || typeof parsed !== 'object') {
          setErrorMessage('صيغة ملف التحديث غير صالحة.');
          return;
        }

        // Collect channels from `channels`, and optionally merge `movies` / `series` if provided separately
        const mergedChannels: Channel[] = [];
        const seenIds = new Set<string>();

        const pushList = (list: unknown, defaultGroup: string) => {
          if (!Array.isArray(list)) return;
          list.forEach((item, idx) => {
            const normalized = normalizeChannelItem(item, defaultGroup, idx);
            if (normalized && !seenIds.has(normalized.id)) {
              seenIds.add(normalized.id);
              mergedChannels.push(normalized);
            }
          });
        };

        pushList(parsed.channels, 'قنوات إخبارية');
        pushList(parsed.movies, 'أفلام أجنبية');
        pushList(parsed.series, 'مسلسلات عربية');

        const parsedMatches = Array.isArray(parsed.matches)
          ? (parsed.matches as MatchItem[])
          : undefined;

        if (mergedChannels.length === 0 && (!parsedMatches || parsedMatches.length === 0)) {
          setErrorMessage(
            'ملف التحديث لا يحتوي على قنوات أو أفلام أو مسلسلات أو مباريات صالحة.'
          );
          return;
        }

        const rawVersion =
          parsed.versionNumber ?? parsed.appVersion ?? parsed.version ?? currentVersion.version;
        const nextVersion =
          typeof rawVersion === 'number'
            ? `${rawVersion}.0.0`
            : typeof rawVersion === 'string' && rawVersion.trim()
            ? rawVersion.trim()
            : 'جديد';

        const nextVersionName =
          (typeof parsed.versionName === 'string' && parsed.versionName.trim()) ||
          (typeof parsed.updateName === 'string' && parsed.updateName.trim()) ||
          (typeof parsed.title === 'string' && parsed.title.trim()) ||
          (typeof parsed.name === 'string' && parsed.name.trim()) ||
          `تحديث مكتبة Awn Tv pro (${nextVersion})`;

        const nextNotes =
          (typeof parsed.releaseNotes === 'string' && parsed.releaseNotes.trim()) ||
          (typeof parsed.notes === 'string' && parsed.notes.trim()) ||
          (typeof parsed.description === 'string' && parsed.description.trim()) ||
          undefined;

        const payload: UpdatePackagePayload = {
          version: nextVersion,
          versionName: nextVersionName,
          notes: nextNotes,
          channels: mergedChannels.length > 0 ? mergedChannels : undefined,
          categories: Array.isArray(parsed.categories)
            ? parsed.categories.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
            : undefined,
          customCovers:
            parsed.customCovers && typeof parsed.customCovers === 'object'
              ? (parsed.customCovers as Record<string, string>)
              : undefined,
          heroChannelIds: Array.isArray(parsed.heroChannelIds)
            ? parsed.heroChannelIds.filter((id): id is string => typeof id === 'string')
            : undefined,
          matches: parsedMatches,
          tickerConfig:
            parsed.tickerConfig && typeof parsed.tickerConfig === 'object'
              ? (parsed.tickerConfig as BreakingTickerConfig)
              : undefined
        };

        const stats = onApplyUpdate(payload);
        setInstalledSummary({
          version: nextVersion,
          versionName: nextVersionName,
          channelsCount: stats.channelsCount,
          moviesAndSeriesCount: stats.moviesAndSeriesCount,
          matchesCount: stats.matchesCount
        });
      } catch {
        setErrorMessage('تعذر قراءة ملف JSON. يرجى التأكد من أن الملف سليم وبصيغة .json صحيحة.');
      }
    };
    reader.readAsText(file);
  };

  const formattedUpdatedAt = currentVersion.updatedAt
    ? new Date(currentVersion.updatedAt).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#181818] border border-white/10 rounded-xl shadow-[0_24px_80px_rgba(0,0,0,0.92)] overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200 my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#141414] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-[#E50914]" />
            <h2 className="text-lg font-bold text-white">تحديثات Awn Tv pro</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة التحديثات"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-right">
          {/* Current Installed Version Card */}
          <div className="p-4 sm:p-5 bg-[#141414] border border-white/10 rounded-lg space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-zinc-400">الإصدار الحالي المثبت</span>
              <span className="font-mono tabular-nums text-sm font-bold text-[#E50914]">
                v{currentVersion.version.replace(/^v/i, '')}
              </span>
            </div>
            <p className="text-base font-bold text-white">{currentVersion.versionName}</p>
            {formattedUpdatedAt && (
              <p className="text-xs text-zinc-400">
                آخر تثبيت: {formattedUpdatedAt}
              </p>
            )}
            {currentVersion.notes && (
              <p className="text-xs text-zinc-300 leading-relaxed pt-2 border-t border-white/10">
                {currentVersion.notes}
              </p>
            )}
          </div>

          {/* Primary Upload / Install New Version CTA */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelected}
            className="hidden"
          />

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-6 bg-[#E50914] hover:bg-[#f40612] text-white font-bold text-sm sm:text-base rounded-lg shadow-lg shadow-[#E50914]/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99]"
            >
              <Download className="w-5 h-5" />
              <span>تحميل وتثبيت إصدار جديد</span>
            </button>
            <p className="text-xs text-zinc-400 leading-relaxed text-center">
              اختر ملف التحديث (<span className="font-mono text-zinc-300">.json</span>) من جهازك لتحديث جميع الأفلام، المسلسلات، القنوات، والمباريات فوراً.
            </p>
          </div>

          {/* Confirmation Message */}
          {installedSummary && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/35 rounded-lg space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-300">
                    تم تثبيت الإصدار الجديد بنجاح!
                  </p>
                  <p className="text-xs text-white font-semibold">
                    {installedSummary.versionName}{' '}
                    <span className="font-mono text-emerald-300">
                      (v{installedSummary.version.replace(/^v/i, '')})
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20 text-center">
                <div className="p-2 bg-black/30 rounded">
                  <Film className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs font-mono font-bold text-white tabular-nums">
                    {installedSummary.moviesAndSeriesCount}
                  </p>
                  <p className="text-[11px] text-zinc-400">أفلام ومسلسلات</p>
                </div>
                <div className="p-2 bg-black/30 rounded">
                  <Tv className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs font-mono font-bold text-white tabular-nums">
                    {installedSummary.channelsCount}
                  </p>
                  <p className="text-[11px] text-zinc-400">إجمالي الباقات</p>
                </div>
                <div className="p-2 bg-black/30 rounded">
                  <Trophy className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs font-mono font-bold text-white tabular-nums">
                    {installedSummary.matchesCount}
                  </p>
                  <p className="text-[11px] text-zinc-400">مباريات</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Feedback */}
          {errorMessage && (
            <div className="p-3.5 bg-red-950/40 border border-[#E50914]/40 rounded-lg flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
