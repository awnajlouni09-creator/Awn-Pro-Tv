import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Film,
  Tv,
  Trophy,
  ExternalLink
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
    const files = e.target.files;
    const file = files && files.length > 0 ? files.item(0) : null;
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#181818] border border-white/10 rounded-xl shadow-2xl overflow-hidden text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center text-[#E50914]">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">التحديثات</h2>
              <p className="text-xs text-zinc-400">تحديث مكتبة الأفلام والمسلسلات والقنوات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Current Installed Version Card */}
          <div className="p-4 bg-[#141414] border border-white/10 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">الإصدار الحالي المثبت</span>
              <span className="font-mono tabular-nums text-sm font-bold text-[#E50914]">
                v{currentVersion.version.replace(/^v/i, '')}
              </span>
            </div>
            <p className="text-base font-bold text-white">{currentVersion.versionName}</p>
          </div>

          <div className="p-4 bg-[#141414] border border-[#E50914]/35 rounded-lg flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white">آخر تحديث</span>
                <span className="font-mono text-[11px] font-semibold text-[#E50914] bg-[#E50914]/15 px-2 py-0.5 rounded">
                  2026-11-21
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed truncate" dir="ltr">
                awn-tv-pro-backup-2026-11-21 (5) (2).json
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                حمّل ملف آخر تحديث ثم اختره من الزر بالأسفل لتثبيته.
              </p>
            </div>

            <a
              href="https://www.mediafire.com/file/r47ehl8pzzpv43d/awn-tv-pro-backup-2026-11-21_%25285%2529_%25282%2529.json/file"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-lg bg-[#E50914]/15 hover:bg-[#E50914] text-[#ff4d56] hover:text-white border border-[#E50914]/40 font-bold text-xs flex items-center gap-2 shrink-0 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>تحميل آخر تحديث</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelected}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3.5 px-5 rounded-lg bg-[#E50914] hover:bg-[#f40612] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#E50914]/20 transition-all cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>تثبيت ملف التحديث (.json)</span>
          </button>

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-500/40 flex items-start gap-2.5 text-red-200 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {installedSummary && (
            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-2 text-emerald-100">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>تم تثبيت التحديث بنجاح ({installedSummary.versionName})</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
