import React, { useState } from 'react';
import { ExternalLink, Tv, ShieldCheck, Maximize2, RefreshCw } from 'lucide-react';
import { Channel } from '../types/iptv';

interface WebPlatformHubProps {
  channel: Channel;
}

export const WebPlatformHub: React.FC<WebPlatformHubProps> = ({ channel }) => {
  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);

  const handleOpenPlatform = () => {
    window.open(channel.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full h-full relative bg-black flex flex-col items-center justify-center select-none overflow-hidden">
      {/* 1. In-app iframe player */}
      {!iframeError ? (
        <div className="w-full h-full relative flex flex-col">
          <iframe
            key={iframeKey}
            src={channel.url}
            title={channel.name}
            className="w-full h-full border-0 flex-1 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            onError={() => setIframeError(true)}
          />

          {/* Floating Quick Action Bar */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/85 backdrop-blur-md border border-white/20 p-2 rounded-2xl shadow-2xl">
            <button
              onClick={() => setIframeKey(k => k + 1)}
              className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="إعادة تحميل البث"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenPlatform}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#e50914] hover:bg-[#ff1a1a] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح في نافذة كاملة</span>
            </button>
          </div>
        </div>
      ) : (
        /* 2. Fallback Hub Card when iframe is restricted */
        <div className="max-w-md bg-[#181818] border border-[#2b2b2b] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-4 m-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#222222] border border-[#333333] flex items-center justify-center p-2 shadow-xl">
            {channel.logo ? (
              <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain" />
            ) : (
              <Tv className="w-8 h-8 sm:w-10 sm:h-10 text-[#e50914]" />
            )}
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">{channel.name}</h2>
            <p className="text-xs text-zinc-400 mt-1.5 max-w-sm leading-relaxed">
              {channel.description || 'بث مباشر عالي الجودة متوافق مع كافة الأجهزة وشاشات التلفزيون.'}
            </p>
          </div>

          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-center gap-2 text-right">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>يتطلب هذا البث فتحه في نافذة مباشرة لضمان أعلى جودة وسرعة استجابة.</span>
          </div>

          <button
            onClick={handleOpenPlatform}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#e50914] hover:bg-[#ff1a1a] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#e50914]/30 cursor-pointer transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            <span>تشغيل البث الآن</span>
          </button>
        </div>
      )}
    </div>
  );
};
