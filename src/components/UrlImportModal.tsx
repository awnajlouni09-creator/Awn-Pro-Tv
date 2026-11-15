import React, { useState } from 'react';
import { X, Link2, Plus, Sparkles, Check } from 'lucide-react';
import { Channel } from '../types/iptv';

interface UrlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChannel: (channel: Channel) => void;
  onLoadM3uFromUrl: (url: string) => Promise<void>;
}

export const UrlImportModal: React.FC<UrlImportModalProps> = ({
  isOpen,
  onClose,
  onAddChannel,
  onLoadM3uFromUrl
}) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('قنوات مخصصة');
  const [isPlaylist, setIsPlaylist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      if (isPlaylist || url.includes('.m3u')) {
        await onLoadM3uFromUrl(url.trim());
        onClose();
      } else {
        const newChannel: Channel = {
          id: `custom-${Date.now()}`,
          name: name.trim() || 'قناة مخصصة',
          url: url.trim(),
          group: group.trim() || 'قنوات مخصصة',
          resolution: 'FHD',
          type: url.includes('.mp4') ? 'vod' : 'live'
        };
        onAddChannel(newChannel);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل الرابط');
    } finally {
      setIsLoading(false);
    }
  };

  // Sample quick test streams
  const sampleStreams = [
    {
      title: 'بث الجزيرة مباشر (M3U8)',
      url: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8',
      group: 'أخبار'
    },
    {
      title: 'بث ناسا الفضائي HD (M3U8)',
      url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
      group: 'فضاء'
    },
    {
      title: 'فيلم سينمائي تجريبي 4K (MP4)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      group: 'أفلام'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#2b2b2b] w-full max-w-lg rounded-2xl p-6 shadow-2xl relative text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#cc0000]/20 border border-[#cc0000]/40 flex items-center justify-center text-[#ff4d4d]">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">إضافة رابط بث مباشر أو ملف M3U</h3>
            <p className="text-xs text-zinc-400">يدعم روابط .m3u8 و .mp4 و روابط البث المباشر وقوائم IPTV</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              رابط البث أو القائمة (URL) *
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => {
                const val = e.target.value;
                setUrl(val);
                if (val.includes('.m3u')) setIsPlaylist(true);
              }}
              placeholder="https://example.com/stream.m3u8 أو https://example.com/playlist.m3u"
              className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#cc0000] focus:outline-none transition-all dir-ltr text-left"
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-[#1a1a1a] rounded-xl border border-[#282828]">
            <input
              type="checkbox"
              id="isPlaylist"
              checked={isPlaylist}
              onChange={(e) => setIsPlaylist(e.target.checked)}
              className="rounded accent-[#cc0000] w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isPlaylist" className="text-xs text-zinc-300 cursor-pointer select-none">
              هذا الرابط هو ملف قائمة قنوات كاملة (.m3u / .m3u8) لتحليلها واستخراج القنوات
            </label>
          </div>

          {!isPlaylist && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">اسم القناة</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: قناة الرياضة 1 HD"
                  className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#cc0000] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">اسم الباقة (Group)</label>
                <input
                  type="text"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="مثال: رياضة، أخبار..."
                  className="w-full h-10 bg-[#1e1e1e] text-white text-xs px-3 rounded-xl border border-[#333333] focus:border-[#cc0000] focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Quick presets */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 mb-2">روابط تجريبية سريعة:</p>
            <div className="space-y-1.5">
              {sampleStreams.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUrl(s.url);
                    setName(s.title);
                    setGroup(s.group);
                    setIsPlaylist(false);
                  }}
                  className="w-full text-right p-2 bg-[#1b1b1b] hover:bg-[#242424] rounded-lg text-xs text-zinc-300 flex items-center justify-between border border-[#262626] cursor-pointer transition-all"
                >
                  <span className="font-medium text-white">{s.title}</span>
                  <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[140px]">{s.url}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl cursor-pointer transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#cc0000] hover:bg-[#ff1a1a] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#cc0000]/25 cursor-pointer transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isLoading ? 'جاري التحميل...' : 'إضافة وتشغيل'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
