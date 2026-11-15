import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Maximize2, 
  Minimize2, 
  PictureInPicture2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  AlertCircle, 
  RotateCcw, 
  Tv, 
  Film,
  Sparkles,
  Ratio,
  Info,
  ExternalLink,
  Server,
  Check
} from 'lucide-react';
import { Channel, AspectRatio, ChannelServer } from '../types/iptv';
import { NetflixHub } from './NetflixHub';
import { WebPlatformHub } from './WebPlatformHub';
import { extractYouTubeEmbedUrl, detectMediaType } from '../utils/mediaHelper';

interface SmartTvPlayerProps {
  channel: Channel | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
  onNextChannel: () => void;
  onPrevChannel: () => void;
  channelIndex: number;
  totalChannels: number;
}

export const SmartTvPlayer: React.FC<SmartTvPlayerProps> = ({
  channel,
  isPlaying,
  onTogglePlay,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  aspectRatio,
  onChangeAspectRatio,
  onNextChannel,
  onPrevChannel,
  channelIndex,
  totalChannels
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOsd, setShowOsd] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [activeServer, setActiveServer] = useState<ChannelServer | null>(null);

  const osdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or reset active server when channel changes
  useEffect(() => {
    if (channel?.servers && channel.servers.length > 0) {
      setActiveServer(channel.servers[0]);
    } else {
      setActiveServer(null);
    }
  }, [channel]);

  // Determine current active URL and effective media type
  const activeUrl = activeServer ? activeServer.url : (channel?.url || '');
  const activeType = activeServer ? activeServer.type : (channel?.type || detectMediaType(activeUrl));

  const youtubeEmbedUrl = activeType === 'youtube'
    ? (extractYouTubeEmbedUrl(activeUrl) || activeUrl)
    : null;

  // Trigger OSD visibility and auto-hide
  const triggerOsd = () => {
    setShowOsd(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setShowOsd(false);
    }, 4000);
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle standard video & HLS stream loading (Only for video/vod/live streams)
  useEffect(() => {
    if (!channel || activeType === 'netflix' || activeType === 'web' || activeType === 'youtube') {
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    if (!videoRef.current) return;

    setErrorMessage(null);
    setIsLoading(true);
    triggerOsd();

    const video = videoRef.current;
    const url = activeUrl;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHlsStream = url.includes('.m3u8') || url.includes('/hls/') || activeType === 'hls';

    if (isHlsStream && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (isPlaying) {
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMessage('تعذر الاتصال بهذا السيرفر. جرب التبديل لسيرفر آخر من القائمة.');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setErrorMessage('حدث خطأ في فك ترميز البث.');
              hls.destroy();
              break;
          }
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHlsStream) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (isPlaying) video.play().catch(() => {});
      });
    } else {
      video.src = url;
      video.load();
    }

    const onCanPlay = () => setIsLoading(false);
    const onWaiting = () => setIsLoading(true);
    const onError = () => {
      setIsLoading(false);
      setErrorMessage('تعذر تشغيل هذا الرابط. يرجى اختيار سيرفر بديل.');
    };
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
      setIsLive(isNaN(video.duration) || !isFinite(video.duration) || video.duration === 0);
    };

    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
      video.removeEventListener('timeupdate', onTimeUpdate);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, activeUrl, activeType]);

  // Synchronize playing state
  useEffect(() => {
    if (!videoRef.current || activeType === 'netflix' || activeType === 'web' || activeType === 'youtube') return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, activeType]);

  // Synchronize volume and mute
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = volume / 100;
    videoRef.current.muted = isMuted;
  }, [volume, isMuted]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Toggle Picture in Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Seek bar handling for local files / VOD
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Get object-fit class based on aspect ratio
  const getObjectFitStyle = () => {
    switch (aspectRatio) {
      case 'fill':
        return 'w-full h-full object-cover';
      case '4:3':
        return 'max-w-[133.33vh] h-full object-contain aspect-[4/3] mx-auto';
      case '16:9':
        return 'w-full h-full object-contain aspect-video';
      case 'original':
      default:
        return 'w-full h-full object-contain';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={triggerOsd}
      onMouseEnter={triggerOsd}
      className="relative flex-1 bg-black flex items-center justify-center overflow-hidden select-none group"
    >
      {/* 1. NETFLIX MODE (IN-APP) */}
      {channel && channel.type === 'netflix' ? (
        <NetflixHub onBackToChannels={onNextChannel} />
      ) : channel && channel.type === 'web' ? (
        /* 2. SMART WEB PLATFORM (Shahid VIP) */
        <WebPlatformHub channel={channel} />
      ) : channel && (activeType === 'youtube' || youtubeEmbedUrl) ? (
        /* 3. YOUTUBE 24/7 LIVE STREAM (Al Jazeera Arabic bNyUyrR0PHo, France 24, etc.) */
        <div className="w-full h-full relative bg-black flex items-center justify-center">
          <iframe
            key={activeUrl}
            src={youtubeEmbedUrl || activeUrl}
            title={channel.name}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        /* 4. STANDARD HTML5 / HLS VIDEO PLAYER */
        <video
          ref={videoRef}
          playsInline
          className={`${getObjectFitStyle()} transition-all`}
          onDoubleClick={toggleFullscreen}
          onClick={onTogglePlay}
        />
      )}

      {/* Loading Spinner for Video Stream */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs z-10 pointer-events-none">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-zinc-800 border-t-[#cc0000] animate-spin"></div>
            <Tv className="w-6 h-6 text-[#ff1a1a] absolute inset-0 m-auto" />
          </div>
          <p className="mt-3 text-xs font-semibold tracking-wide text-zinc-300">
            جاري استقبال الإشارة وتهيئة البث المباشر...
          </p>
        </div>
      )}

      {/* Error Overlay with Actionable Buttons */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 z-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-[#cc0000]/40 flex items-center justify-center mb-4 text-[#ff4d4d]">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">تنبيه في تشغيل هذا السيرفر</h3>
          <p className="text-xs text-zinc-400 max-w-md mb-5 leading-relaxed">
            {errorMessage}
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {channel?.servers && channel.servers.length > 1 && (
              <div className="flex items-center gap-2">
                {channel.servers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setErrorMessage(null);
                      setActiveServer(s);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      activeServer?.id === s.id ? 'bg-[#cc0000] text-white' : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                setErrorMessage(null);
                if (videoRef.current && channel) {
                  videoRef.current.src = activeUrl;
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#cc0000] hover:bg-[#ff1a1a] text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty State when no channel selected */}
      {!channel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-gradient-to-b from-[#141414] to-black">
          <div className="w-16 h-16 rounded-2xl bg-[#1c1c1c] border border-[#2b2b2b] flex items-center justify-center mb-4 shadow-xl text-[#ff1a1a]">
            <Tv className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Awn Tv pro Receiver</h2>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">
            اختر قناة من القائمة الجانبية أو اضغط على "الجزيرة الإخبارية" أو "Netflix جو التطبيق".
          </p>
        </div>
      )}

      {/* Smart TV On-Screen Display (OSD Banner) */}
      {channel && channel.type !== 'netflix' && (
        <div
          className={`absolute top-6 left-6 right-6 transition-all duration-300 pointer-events-none z-20 ${
            showOsd ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          <div className="max-w-2xl bg-black/85 backdrop-blur-md border border-[#333333] rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Channel Number Badge */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#cc0000] to-[#800000] flex flex-col items-center justify-center text-white border border-[#ff1a1a]/40 shadow-lg shrink-0">
                  <span className="text-[10px] uppercase font-bold text-white/70">CH</span>
                  <span className="text-lg font-black font-mono leading-none">
                    {(channelIndex + 1).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Title & Group */}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-extrabold text-white truncate max-w-md">
                      {channel.name}
                    </h1>
                    {channel.resolution && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {channel.resolution}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                    <span>{channel.group || 'عام'}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-[#ff4d4d] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#cc0000] inline-block animate-ping"></span>
                      {activeType === 'youtube'
                        ? 'بث الجزيرة مباشر 24/7'
                        : channel.type === 'vod' || channel.type === 'local'
                        ? 'فيلم / وسائط'
                        : 'بث تلفزيوني حي'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats on right */}
              <div className="text-left font-mono text-xs text-zinc-400 shrink-0 hidden sm:block">
                <div>القناة {channelIndex + 1} من {totalChannels}</div>
                <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>متصل ومستقر</span>
                </div>
              </div>
            </div>

            {/* Multiple Servers Switcher (e.g. for Al Jazeera Arabic) */}
            {channel.servers && channel.servers.length > 1 && (
              <div className="pt-2 border-t border-[#262626] flex items-center gap-2 pointer-events-auto">
                <span className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1">
                  <Server className="w-3 h-3 text-[#ff1a1a]" />
                  <span>السيرفر:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {channel.servers.map((srv) => {
                    const isSelected = activeServer?.id === srv.id;
                    return (
                      <button
                        key={srv.id}
                        onClick={() => {
                          setActiveServer(srv);
                          triggerOsd();
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#cc0000] text-white font-bold shadow-sm'
                            : 'bg-[#1e1e1e] text-zinc-400 hover:text-white hover:bg-[#282828]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{srv.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Player Quick Tools (Bottom Overlay inside player on hover) */}
      {channel?.type !== 'netflix' && channel?.type !== 'web' && (
        <div
          className={`absolute bottom-4 left-6 right-6 transition-all duration-300 z-20 ${
            showOsd ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="bg-black/75 backdrop-blur-md border border-[#2b2b2b] rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 shadow-2xl">
            {/* Scrubber if VOD or Local Video */}
            {!isLive && duration > 0 ? (
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xs font-mono text-zinc-400">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1.5 bg-zinc-700 rounded-lg accent-[#cc0000] cursor-pointer"
                />
                <span className="text-xs font-mono text-zinc-400">{formatTime(duration)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-zinc-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#cc0000] animate-pulse"></span>
                <span>بث مباشر (Live Stream Feed)</span>
              </div>
            )}

            {/* Quick Corner Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Aspect Ratio Switcher */}
              <button
                onClick={() => {
                  const ratios: AspectRatio[] = ['16:9', '4:3', 'fill', 'original'];
                  const nextIdx = (ratios.indexOf(aspectRatio) + 1) % ratios.length;
                  onChangeAspectRatio(ratios[nextIdx]);
                }}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-mono border border-zinc-700 cursor-pointer flex items-center gap-1.5"
                title="تغيير أبعاد الشاشة (16:9, 4:3, Fill)"
              >
                <Ratio className="w-3.5 h-3.5 text-[#ff4d4d]" />
                <span>{aspectRatio}</span>
              </button>

              {/* Picture-in-Picture */}
              <button
                onClick={togglePiP}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg border border-zinc-700 cursor-pointer"
                title="صورة داخل صورة (PiP)"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 bg-[#cc0000] hover:bg-[#ff1a1a] text-white rounded-lg cursor-pointer transition-all"
                title="ملء الشاشة (F11 أو انقر مرتين)"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
