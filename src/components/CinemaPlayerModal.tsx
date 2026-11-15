import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  ArrowRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  AlertCircle,
  RotateCcw,
  RotateCw,
  Smartphone,
  Repeat,
  X,
  Headphones,
  ChevronDown,
  Music,
  Tv,
  SlidersHorizontal,
  Timer
} from 'lucide-react';
import { Channel, AspectRatio, ChannelServer } from '../types/iptv';
import { NetflixHub } from './NetflixHub';
import { WebPlatformHub } from './WebPlatformHub';
import { ChannelThumbnail } from './ChannelThumbnail';
import { extractYouTubeEmbedUrl, detectMediaType } from '../utils/mediaHelper';

interface CinemaPlayerModalProps {
  channel: Channel | null;
  isOpen: boolean;
  isMinimized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onNextChannel: () => void;
  onPrevChannel: () => void;
  totalChannels: number;
  channelIndex: number;
  customCovers?: Record<string, string>;
  onPlayingStateChange?: (isPlaying: boolean) => void;
  externalVolume?: number;
  onExternalVolumeChange?: (vol: number) => void;
  externalMuted?: boolean;
  onExternalMutedToggle?: () => void;
  externalPlaySignal?: number;
  externalFullscreenSignal?: number;
  initialSeekTime?: number;
  onProgressUpdate?: (channel: Channel, currentTime: number, duration: number) => void;
  onOpenRemote?: () => void;
}

export const CinemaPlayerModal: React.FC<CinemaPlayerModalProps> = ({
  channel,
  isOpen,
  isMinimized,
  onMinimize,
  onMaximize,
  onClose,
  onNextChannel,
  onPrevChannel,
  totalChannels,
  channelIndex,
  customCovers = {},
  onPlayingStateChange,
  externalVolume,
  onExternalVolumeChange,
  externalMuted,
  onExternalMutedToggle,
  externalPlaySignal = 0,
  externalFullscreenSignal = 0,
  initialSeekTime,
  onProgressUpdate,
  onOpenRemote
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytIframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isLooping, setIsLooping] = useState(false);
  const [internalVolume, setInternalVolume] = useState(85);
  const [internalMuted, setInternalMuted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [activeServer, setActiveServer] = useState<ChannelServer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreviewTime, setSeekPreviewTime] = useState<number | null>(null);
  const [hoverSeekInfo, setHoverSeekInfo] = useState<{ xPercent: number; time: number } | null>(null);
  const [skipFeedback, setSkipFeedback] = useState<{ label: string; key: number } | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [sleepRemainingSeconds, setSleepRemainingSeconds] = useState<number | null>(null);

  const volume = externalVolume !== undefined ? externalVolume : internalVolume;
  const isMuted = externalMuted !== undefined ? externalMuted : internalMuted;

  const setVolumeValue = (v: number) => {
    setInternalVolume(v);
    onExternalVolumeChange?.(v);
  };

  const toggleMutedValue = () => {
    setInternalMuted((m) => !m);
    onExternalMutedToggle?.();
  };

  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoopingRef = useRef(isLooping);
  const onNextRef = useRef(onNextChannel);
  const lastProgressReportRef = useRef<number>(0);
  const initialSeekAppliedRef = useRef<string | null>(null);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const isSeekingRef = useRef(false);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    isSeekingRef.current = isSeeking;
  }, [isSeeking]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    onNextRef.current = onNextChannel;
  }, [onNextChannel]);

  useEffect(() => {
    onPlayingStateChange?.(isPlaying);
  }, [isPlaying, onPlayingStateChange]);

  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Initialize server & reset timing when channel changes
  useEffect(() => {
    if (channel?.servers && channel.servers.length > 0) {
      setActiveServer(channel.servers[0]);
    } else {
      setActiveServer(null);
    }
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    setErrorMessage(null);
    setPlaybackSpeed(1);
    setShowSettingsMenu(false);
    setShowTimerMenu(false);
    initialSeekAppliedRef.current = null;
    lastProgressReportRef.current = 0;
  }, [channel]);

  // Determine active URL and type
  const activeUrl = activeServer ? activeServer.url : (channel?.url || '');
  const activeType = activeServer ? activeServer.type : (channel?.type || detectMediaType(activeUrl));
  const youtubeEmbedUrl = activeType === 'youtube'
    ? (extractYouTubeEmbedUrl(activeUrl) || activeUrl)
    : null;
  const isYouTube = activeType === 'youtube' || !!youtubeEmbedUrl;
  const isWebHub = channel?.type === 'netflix' || channel?.type === 'web';

  // Helper to send command to YouTube iframe via JS API postMessage
  const sendYouTubeCommand = useCallback((func: string, args: unknown[] = []) => {
    const win = ytIframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    } catch (e) {}
  }, []);

  // Handle YouTube iframe load handshake for events + sync initial volume
  const handleYouTubeLoad = useCallback(() => {
    const win = ytIframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
      sendYouTubeCommand('addEventListener', ['onStateChange']);
      sendYouTubeCommand('setVolume', [volume]);
      sendYouTubeCommand('setPlaybackRate', [playbackSpeed]);
      if (isMuted) {
        sendYouTubeCommand('mute');
      } else {
        sendYouTubeCommand('unMute');
      }
      if (!isPlaying) {
        sendYouTubeCommand('pauseVideo');
      }
      if (
        initialSeekTime &&
        initialSeekTime > 5 &&
        channel &&
        initialSeekAppliedRef.current !== channel.id
      ) {
        initialSeekAppliedRef.current = channel.id;
        sendYouTubeCommand('seekTo', [initialSeekTime, true]);
      }
    } catch (e) {}
  }, [sendYouTubeCommand, volume, playbackSpeed, isMuted, isPlaying, initialSeekTime, channel]);

  // Listen for YouTube postMessage events (state changes, ended, progress)
  useEffect(() => {
    if (!isOpen || !channel || !isYouTube) return;

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.origin === 'string' && !event.origin.includes('youtube')) {
        return;
      }
      let data = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== 'object') return;

      if (data.event === 'infoDelivery' && data.info) {
        const nextTime =
          typeof data.info.currentTime === 'number' ? data.info.currentTime : currentTimeRef.current;
        const nextDur =
          typeof data.info.duration === 'number' && data.info.duration > 0
            ? data.info.duration
            : durationRef.current;
        if (typeof data.info.currentTime === 'number' && !isSeekingRef.current) {
          setCurrentTime(data.info.currentTime);
        }
        if (typeof data.info.duration === 'number' && data.info.duration > 0) {
          setDuration(data.info.duration);
        }
        if (channel && onProgressUpdate && Date.now() - lastProgressReportRef.current > 3000) {
          lastProgressReportRef.current = Date.now();
          onProgressUpdate(channel, nextTime, nextDur);
        }
        if (typeof data.info.playerState === 'number') {
          const state = data.info.playerState;
          if (state === 1) {
            setIsPlaying(true);
            setIsLoading(false);
          } else if (state === 2) {
            setIsPlaying(false);
          } else if (state === 0) {
            // Video/Song Ended!
            if (isLoopingRef.current) {
              sendYouTubeCommand('seekTo', [0, true]);
              sendYouTubeCommand('playVideo');
              setIsPlaying(true);
            } else {
              onNextRef.current();
            }
          }
        }
      } else if (data.event === 'onStateChange') {
        const state = data.info;
        if (state === 1) setIsPlaying(true);
        else if (state === 2) setIsPlaying(false);
        else if (state === 0) {
          if (isLoopingRef.current) {
            sendYouTubeCommand('seekTo', [0, true]);
            sendYouTubeCommand('playVideo');
            setIsPlaying(true);
          } else {
            onNextRef.current();
          }
        }
      }
    };

    // Ensure YouTube widget listening handshake succeeds even if iframe loaded quickly
    const pingInterval = setInterval(() => {
      if (durationRef.current === 0 && ytIframeRef.current?.contentWindow) {
        try {
          ytIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
            '*'
          );
        } catch (e) {}
      }
    }, 2000);

    window.addEventListener('message', handleMessage);
    return () => {
      clearInterval(pingInterval);
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, channel, isYouTube, sendYouTubeCommand, onProgressUpdate]);

  // Auto-hide controls after 3 seconds of mouse/touch inactivity
  const triggerControls = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
      setShowSettingsMenu(false);
      setShowTimerMenu(false);
    }, 3000);
  }, []);

  // Fullscreen listener & ESC handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isMinimized) {
        if (!document.fullscreenElement) {
          if (channel?.group === 'أغاني وموسيقى') {
            onMinimize();
          } else {
            onClose();
          }
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onMinimize, isOpen, isMinimized, channel]);

  // Handle standard video / HLS playback
  useEffect(() => {
    if (!isOpen || !channel || isWebHub || isYouTube) {
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    if (!videoRef.current) return;

    setErrorMessage(null);
    setIsLoading(true);
    triggerControls();

    const video = videoRef.current;
    const url = activeUrl;

    if (!url) {
      if (channel.isLocalSaved) {
        setIsLoading(true);
        setErrorMessage(null);
      } else {
        setIsLoading(false);
        setErrorMessage('تعذر العثور على رابط التشغيل لهذا المحتوى.');
      }
      return;
    }

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
        if (isPlaying) video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMessage('تعذر الاتصال بهذا السيرفر. جرب التبديل لسيرفر بديل.');
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
      video.play().catch(() => {});
    }

    const onCanPlay = () => {
      setIsLoading(false);
      video.playbackRate = playbackSpeed;
      if (
        initialSeekTime &&
        initialSeekTime > 5 &&
        channel &&
        initialSeekAppliedRef.current !== channel.id &&
        video.duration &&
        isFinite(video.duration) &&
        initialSeekTime < video.duration - 2
      ) {
        initialSeekAppliedRef.current = channel.id;
        video.currentTime = initialSeekTime;
      }
    };
    const onWaiting = () => setIsLoading(true);
    const onError = () => {
      setIsLoading(false);
      setErrorMessage('تعذر تشغيل هذا الرابط في المتصفح.');
    };
    const onTimeUpdate = () => {
      const ct = video.currentTime || 0;
      const dur = video.duration && isFinite(video.duration) ? video.duration : 0;
      if (!isSeekingRef.current) {
        setCurrentTime(ct);
      }
      if (dur > 0) {
        setDuration(dur);
      }
      if (channel && onProgressUpdate && Date.now() - lastProgressReportRef.current > 3000) {
        lastProgressReportRef.current = Date.now();
        onProgressUpdate(channel, ct, dur);
      }
    };
    const onEnded = () => {
      if (isLoopingRef.current) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        onNextRef.current();
      }
    };

    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isOpen, channel, activeUrl, activeType, isWebHub, isYouTube]);

  // Sync play/pause across both <video> and YouTube <iframe>
  const handleTogglePlayPause = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPlaying(prev => {
      const next = !prev;
      if (isYouTube) {
        sendYouTubeCommand(next ? 'playVideo' : 'pauseVideo');
      } else if (videoRef.current) {
        if (next) videoRef.current.play().catch(() => {});
        else videoRef.current.pause();
      }
      return next;
    });
  }, [isYouTube, sendYouTubeCommand]);

  // Sync volume, mute & playback speed across both <video> and YouTube <iframe>
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackSpeed;
    }
    if (isYouTube) {
      sendYouTubeCommand('setVolume', [volume]);
      sendYouTubeCommand(isMuted ? 'mute' : 'unMute');
      sendYouTubeCommand('setPlaybackRate', [playbackSpeed]);
    }
  }, [volume, isMuted, playbackSpeed, isYouTube, sendYouTubeCommand]);

  // Sleep Timer countdown effect
  useEffect(() => {
    if (sleepRemainingSeconds === null || !isOpen) return;
    if (sleepRemainingSeconds <= 0) {
      setSleepRemainingSeconds(null);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (isYouTube) {
        sendYouTubeCommand('pauseVideo');
      }
      setIsPlaying(false);
      onClose();
      return;
    }
    const timerId = setTimeout(() => {
      setSleepRemainingSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timerId);
  }, [sleepRemainingSeconds, isOpen, isYouTube, sendYouTubeCommand, onClose]);

  // Seek handler (supports both full cinema seek bar & mini player bar)
  const handleSeekToTime = useCallback(
    (targetSeconds: number) => {
      const maxDur = durationRef.current;
      const clamped =
        maxDur > 0 && isFinite(maxDur)
          ? Math.max(0, Math.min(maxDur, targetSeconds))
          : Math.max(0, targetSeconds);

      setCurrentTime(clamped);
      if (isYouTube) {
        sendYouTubeCommand('seekTo', [clamped, true]);
      } else if (videoRef.current) {
        videoRef.current.currentTime = clamped;
      }
    },
    [isYouTube, sendYouTubeCommand]
  );

  const handleSeekToFraction = (fraction: number) => {
    if (!duration || !isFinite(duration)) return;
    handleSeekToTime(fraction * duration);
  };

  const handleSkipSeconds = useCallback(
    (deltaSeconds: number) => {
      const baseTime = currentTimeRef.current;
      const maxDur = durationRef.current;
      const rawTarget = baseTime + deltaSeconds;
      const target =
        maxDur > 0 && isFinite(maxDur)
          ? Math.max(0, Math.min(maxDur, rawTarget))
          : Math.max(0, rawTarget);

      handleSeekToTime(target);
      triggerControls();

      const feedbackKey = Date.now();
      setSkipFeedback({
        label: deltaSeconds > 0 ? `+${deltaSeconds} ثانية ⏩` : `⏪ ${deltaSeconds} ثانية`,
        key: feedbackKey
      });
      setTimeout(() => {
        setSkipFeedback((curr) => (curr?.key === feedbackKey ? null : curr));
      }, 900);
    },
    [handleSeekToTime]
  );

  // Toggle Fullscreen & Attempt landscape lock on mobile
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        try {
          if (screen.orientation && 'lock' in screen.orientation) {
            (screen.orientation as any).lock('landscape').catch(() => {});
          }
        } catch (e) {}
      }).catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Respond to external Remote Control Play/Pause & Fullscreen signals
  const prevPlaySignalRef = useRef(externalPlaySignal);
  useEffect(() => {
    if (externalPlaySignal !== prevPlaySignalRef.current) {
      prevPlaySignalRef.current = externalPlaySignal;
      if (isOpen && channel) {
        handleTogglePlayPause();
      }
    }
  }, [externalPlaySignal, isOpen, channel, handleTogglePlayPause]);

  const prevFsSignalRef = useRef(externalFullscreenSignal);
  useEffect(() => {
    if (externalFullscreenSignal !== prevFsSignalRef.current) {
      prevFsSignalRef.current = externalFullscreenSignal;
      if (isOpen && channel && !isMinimized) {
        toggleFullscreen();
      }
    }
  }, [externalFullscreenSignal, isOpen, channel, isMinimized, toggleFullscreen]);

  // Object fit style
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

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
    const total = Math.max(0, Math.floor(secs));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts when Cinema Player is active in full screen
  useEffect(() => {
    if (!isOpen || isMinimized || isWebHub) return;
    const handlePlayerKeys = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handleTogglePlayPause();
        triggerControls();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSkipSeconds(10);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSkipSeconds(-10);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMutedValue();
      }
    };
    window.addEventListener('keydown', handlePlayerKeys);
    return () => window.removeEventListener('keydown', handlePlayerKeys);
  }, [isOpen, isMinimized, isWebHub, handleTogglePlayPause, handleSkipSeconds, toggleFullscreen]);

  if (!isOpen || !channel) return null;

  const effectiveTime = isSeeking && seekPreviewTime !== null ? seekPreviewTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, (effectiveTime / duration) * 100) : 0;
  const isMusicTrack = channel.group === 'أغاني وموسيقى';

  const handleBackAction = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    // For music tracks, returning to browse keeps playback alive in Spotify Mini Player
    if (isMusicTrack) {
      onMinimize();
    } else {
      onClose();
    }
  };

  return (
    <>
      {/* 1. PERSISTENT PLAYER CONTAINER (Full-Screen Cinema OR Invisible Active Stream Engine when Minimized) */}
      <div
        ref={containerRef}
        onMouseMove={!isMinimized ? triggerControls : undefined}
        onClick={!isMinimized ? triggerControls : undefined}
        onTouchStart={!isMinimized ? triggerControls : undefined}
        className={
          isMinimized
            ? 'fixed bottom-0 left-0 w-[240px] h-[135px] opacity-0 pointer-events-none -z-10 overflow-hidden'
            : 'fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden'
        }
      >
        {/* Top Cinema Header (Clean Netflix Back Arrow & Optional Actions) */}
        {!isMinimized && (
          <div
            className={`absolute top-0 left-0 right-0 z-30 h-20 px-4 sm:px-8 flex items-center justify-between gap-4 bg-gradient-to-b from-black/85 via-black/35 to-transparent transition-opacity duration-300 ${
              showControls || showSettingsMenu || showTimerMenu
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Right (RTL start): Netflix Back Arrow & Listening Mode */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBackAction();
                }}
                aria-label="العودة للرئيسية"
                title={isMusicTrack ? 'تصفح مع استمرار الصوت' : 'العودة للرئيسية'}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-all cursor-pointer active:scale-95"
              >
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {!isWebHub && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (document.fullscreenElement) {
                      document.exitFullscreen().catch(() => {});
                    }
                    onMinimize();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-[#E50914] text-zinc-200 hover:text-white text-xs font-semibold backdrop-blur-md border border-white/15 transition-all cursor-pointer active:scale-95"
                  title="تصغير المشغل / وضع الاستماع المستمر"
                >
                  <Headphones className="w-4 h-4" />
                  <span className="hidden sm:inline">وضع الاستماع</span>
                  <ChevronDown className="w-3.5 h-3.5 hidden sm:inline" />
                </button>
              )}
            </div>

            {/* Left (RTL end): Servers Switcher & Smart Remote */}
            <div className="flex items-center gap-2 shrink-0">
              {channel.servers && channel.servers.length > 1 && (
                <div className="flex items-center gap-1 bg-black/60 p-1 rounded-full border border-white/20 backdrop-blur-md overflow-x-auto no-scrollbar shrink-0">
                  <span className="text-[10px] text-zinc-400 font-semibold px-2 hidden md:inline">السيرفر:</span>
                  {channel.servers.map((srv) => {
                    const isSelected = activeServer?.id === srv.id;
                    return (
                      <button
                        key={srv.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveServer(srv);
                          triggerControls();
                        }}
                        className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium cursor-pointer transition-all ${
                          isSelected ? 'bg-[#E50914] text-white font-bold' : 'text-zinc-300 hover:text-white'
                        }`}
                      >
                        {srv.name.replace('سيرفر ', 'S')}
                      </button>
                    );
                  })}
                </div>
              )}

              {onOpenRemote && !isWebHub && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenRemote();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-[#E50914] text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all cursor-pointer active:scale-95"
                  title="فتح الريموت الذكي"
                >
                  <Tv className="w-4 h-4" />
                  <span className="hidden sm:inline">الريموت</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. Media Viewport (Kept alive seamlessly across Minimized & Fullscreen!) */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {channel.type === 'netflix' ? (
            <NetflixHub onBackToChannels={onClose} />
          ) : channel.type === 'web' ? (
            <WebPlatformHub channel={channel} />
          ) : isYouTube ? (
            <div className="w-full h-full relative bg-black flex items-center justify-center">
              <iframe
                ref={ytIframeRef}
                key={activeUrl}
                src={youtubeEmbedUrl || activeUrl}
                title={channel.name}
                onLoad={handleYouTubeLoad}
                className={`w-full h-full border-0 ${!isMinimized && isPortrait ? 'max-h-[50vh] sm:max-h-full' : ''}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              className={`${getObjectFitStyle()} transition-all`}
              onDoubleClick={toggleFullscreen}
              onClick={handleTogglePlayPause}
            />
          )}

          {/* Rotate to Landscape Prompt on Mobile Portrait */}
          {!isMinimized && isPortrait && showControls && (
            <button
              onClick={toggleFullscreen}
              className="absolute bottom-24 z-20 flex items-center gap-2 px-3.5 py-1.5 bg-black/75 backdrop-blur-md border border-white/20 rounded-full text-zinc-200 text-xs font-semibold sm:hidden shadow-lg animate-pulse"
            >
              <Smartphone className="w-3.5 h-3.5 rotate-90 text-[#e50914]" />
              <span>دوّر الهاتف لملء الشاشة بالعرض</span>
            </button>
          )}

          {/* Loading Spinner */}
          {!isMinimized && isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 pointer-events-none">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-4 border-zinc-800 border-t-[#e50914] animate-spin"></div>
              <p className="mt-3 text-xs font-semibold text-zinc-300">جاري بدء البث...</p>
            </div>
          )}

          {/* Visual Skip Feedback Badge (+10s / -10s) */}
          {!isMinimized && skipFeedback && (
            <div
              key={skipFeedback.key}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 px-5 py-2.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 text-white text-sm sm:text-base font-black shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-150"
            >
              {skipFeedback.label}
            </div>
          )}

          {/* Error Overlay */}
          {!isMinimized && errorMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 z-30 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-[#e50914]/40 flex items-center justify-center mb-3 text-[#ff4d4d]">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">تنبيه في تشغيل هذا السيرفر</h3>
              <p className="text-xs text-zinc-400 max-w-md mb-4">{errorMessage}</p>
              <button
                onClick={() => {
                  setErrorMessage(null);
                  if (videoRef.current && channel) {
                    videoRef.current.src = activeUrl;
                    videoRef.current.play().catch(() => {});
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#e50914] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Netflix Fullscreen Bottom Control Bar */}
        {!isMinimized && !isWebHub && (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseMove={triggerControls}
            className={`absolute bottom-0 left-0 right-0 z-30 pt-14 pb-4 sm:pb-6 px-4 sm:px-8 md:px-12 flex flex-col gap-3 bg-gradient-to-t from-black/95 via-black/75 to-transparent transition-opacity duration-300 safe-area-pb ${
              showControls || showSettingsMenu || showTimerMenu
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Row 1: Netflix Red Timeline Scrubber (#E50914) + Remaining Time */}
            {duration > 0 ? (
              <div dir="ltr" className="flex items-center gap-3 w-full">
                <div
                  className="relative flex-1 h-5 flex items-center group/seek cursor-pointer"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    setHoverSeekInfo({ xPercent: ratio * 100, time: ratio * duration });
                  }}
                  onMouseLeave={() => setHoverSeekInfo(null)}
                >
                  {/* Hover Time Preview Bubble */}
                  {hoverSeekInfo && (
                    <div
                      className="absolute -top-8 -translate-x-1/2 px-2 py-0.5 rounded bg-[#181818] border border-white/20 text-white text-[11px] font-mono font-bold shadow-lg pointer-events-none whitespace-nowrap"
                      style={{ left: `${hoverSeekInfo.xPercent}%` }}
                    >
                      {formatTime(hoverSeekInfo.time)}
                    </div>
                  )}

                  {/* Track Background */}
                  <div className="w-full h-1 group-hover/seek:h-1.5 transition-all rounded-full bg-white/30 overflow-hidden">
                    <div
                      className="h-full bg-[#E50914] rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Netflix Red Circular Thumb Dot (#E50914) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.85)] scale-95 group-hover/seek:scale-125 transition-transform pointer-events-none"
                    style={{ left: `${progressPercent}%` }}
                  />

                  {/* Native Range Scrubber Overlay */}
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={effectiveTime}
                    onMouseDown={() => setIsSeeking(true)}
                    onTouchStart={() => setIsSeeking(true)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSeekPreviewTime(val);
                      triggerControls();
                    }}
                    onMouseUp={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      setIsSeeking(false);
                      setSeekPreviewTime(null);
                      handleSeekToTime(val);
                    }}
                    onTouchEnd={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      setIsSeeking(false);
                      setSeekPreviewTime(null);
                      handleSeekToTime(val);
                    }}
                    aria-label="شريط تقديم وتأخير الفيديو"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {/* Remaining Time on Edge (-MM:SS) */}
                <span
                  className="text-xs sm:text-sm font-mono font-semibold text-zinc-200 tabular-nums shrink-0 min-w-[52px] text-right"
                  title={`${formatTime(effectiveTime)} / ${formatTime(duration)}`}
                >
                  -{formatTime(Math.max(0, duration - effectiveTime))}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-zinc-300 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
                  <span className="font-bold text-white">بث مباشر</span>
                </div>
                <div className="flex-1 mx-3 h-1 rounded-full bg-[#E50914]/60" />
                <span className="font-mono text-[11px] text-zinc-400">LIVE</span>
              </div>
            )}

            {/* Row 2: Netflix Bottom Controls (Right: Playback & Volume | Center: Title | Left: Quality/Speed, Timer, Fullscreen) */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 relative">
              {/* RIGHT (RTL Start): Play/Pause, Rewind 10s, Forward 10s, Mute & Volume Slider */}
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <button
                  onClick={handleTogglePlayPause}
                  className="p-2 text-white hover:scale-110 transition-transform cursor-pointer"
                  title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                  aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                  )}
                </button>

                {/* Rewind 10s */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSkipSeconds(-10);
                  }}
                  className="relative p-1.5 sm:p-2 text-zinc-200 hover:text-white hover:scale-110 transition-all cursor-pointer flex items-center justify-center"
                  title="ترجيع 10 ثواني"
                >
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[9px] font-mono font-black absolute mt-0.5">10</span>
                </button>

                {/* Forward 10s */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSkipSeconds(10);
                  }}
                  className="relative p-1.5 sm:p-2 text-zinc-200 hover:text-white hover:scale-110 transition-all cursor-pointer flex items-center justify-center"
                  title="تقديم 10 ثواني"
                >
                  <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[9px] font-mono font-black absolute mt-0.5">10</span>
                </button>

                {/* Prev / Next item */}
                <div className="hidden lg:flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrevChannel();
                    }}
                    className="p-1.5 text-zinc-300 hover:text-white cursor-pointer transition-colors"
                    title="السابق"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNextChannel();
                    }}
                    className="p-1.5 text-zinc-300 hover:text-white cursor-pointer transition-colors"
                    title="التالي"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                </div>

                {/* Volume Mute + Slider */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMutedValue();
                    }}
                    className="p-1.5 text-zinc-200 hover:text-white cursor-pointer transition-transform hover:scale-110"
                    title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolumeValue(Number(e.target.value));
                      if (isMuted) toggleMutedValue();
                      triggerControls();
                    }}
                    aria-label="مستوى الصوت"
                    className="hidden sm:block w-16 md:w-24 h-1 bg-zinc-600 rounded-lg accent-[#E50914] cursor-pointer"
                  />
                </div>
              </div>

              {/* CENTER: Movie / Episode Title */}
              <div className="flex-1 text-center min-w-0 px-2">
                <p className="text-xs sm:text-sm md:text-base font-bold text-white truncate">
                  {channel.name}
                </p>
              </div>

              {/* LEFT (RTL End): Quality/Speed Settings, Sleep Timer, Fullscreen */}
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 relative">
                {/* Quality & Speed Menu Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTimerMenu(false);
                      setShowSettingsMenu((prev) => !prev);
                      triggerControls();
                    }}
                    title="إعدادات الجودة والسرعة"
                    aria-label="إعدادات الجودة والسرعة"
                    className={`p-2 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      showSettingsMenu || playbackSpeed !== 1
                        ? 'text-white bg-white/15'
                        : 'text-zinc-200 hover:text-white hover:scale-110'
                    }`}
                  >
                    <SlidersHorizontal className="w-5 h-5 sm:w-6 sm:h-6" />
                    {playbackSpeed !== 1 && (
                      <span className="text-[10px] font-mono font-bold text-[#E50914]">
                        {playbackSpeed}x
                      </span>
                    )}
                  </button>

                  {showSettingsMenu && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-12 left-0 w-60 bg-[#181818]/95 backdrop-blur-xl border border-white/15 rounded-xl p-3.5 shadow-2xl space-y-3 text-right z-40"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-bold text-white">سرعة التشغيل والجودة</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E50914] text-white font-bold">
                          {channel.resolution || 'HD'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] text-zinc-400 block">سرعة التشغيل:</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                            <button
                              key={spd}
                              type="button"
                              onClick={() => setPlaybackSpeed(spd)}
                              className={`py-1 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                                playbackSpeed === spd
                                  ? 'bg-[#E50914] text-white'
                                  : 'bg-white/10 hover:bg-white/20 text-zinc-200'
                              }`}
                            >
                              {spd}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] text-zinc-400 block">نسبة أبعاد العرض:</span>
                        <div className="grid grid-cols-4 gap-1">
                          {(['16:9', '4:3', 'fill', 'original'] as AspectRatio[]).map((ratio) => (
                            <button
                              key={ratio}
                              type="button"
                              onClick={() => setAspectRatio(ratio)}
                              className={`py-1 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                                aspectRatio === ratio
                                  ? 'bg-white text-black'
                                  : 'bg-white/10 hover:bg-white/20 text-zinc-300'
                              }`}
                            >
                              {ratio === 'fill' ? 'ملء' : ratio === 'original' ? 'أصلي' : ratio}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsLooping((l) => !l)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          isLooping
                            ? 'bg-[#E50914]/20 text-white border border-[#E50914]/50'
                            : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Repeat className="w-3.5 h-3.5" />
                          <span>تكرار تلقائي</span>
                        </span>
                        <span>{isLooping ? 'مفعّل' : 'متوقف'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sleep Timer Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettingsMenu(false);
                      setShowTimerMenu((prev) => !prev);
                      triggerControls();
                    }}
                    title="مؤقت النوم"
                    aria-label="مؤقت النوم"
                    className={`p-2 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      showTimerMenu || sleepRemainingSeconds !== null
                        ? 'text-white bg-white/15'
                        : 'text-zinc-200 hover:text-white hover:scale-110'
                    }`}
                  >
                    <Timer className="w-5 h-5 sm:w-6 sm:h-6" />
                    {sleepRemainingSeconds !== null && (
                      <span className="text-[10px] font-mono font-bold text-[#E50914] tabular-nums">
                        {formatTime(sleepRemainingSeconds)}
                      </span>
                    )}
                  </button>

                  {showTimerMenu && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-12 left-0 w-48 bg-[#181818]/95 backdrop-blur-xl border border-white/15 rounded-xl p-3 shadow-2xl space-y-1.5 text-right z-40"
                    >
                      <div className="text-xs font-bold text-white border-b border-white/10 pb-1.5 mb-1">
                        مؤقت إيقاف التشغيل
                      </div>
                      {[
                        { label: 'إيقاف المؤقت', minutes: 0 },
                        { label: '15 دقيقة', minutes: 15 },
                        { label: '30 دقيقة', minutes: 30 },
                        { label: '45 دقيقة', minutes: 45 },
                        { label: '60 دقيقة', minutes: 60 }
                      ].map((opt) => {
                        const isActive =
                          opt.minutes === 0
                            ? sleepRemainingSeconds === null
                            : sleepRemainingSeconds !== null &&
                              Math.ceil(sleepRemainingSeconds / 60) === opt.minutes;
                        return (
                          <button
                            key={opt.minutes}
                            type="button"
                            onClick={() => {
                              setSleepRemainingSeconds(opt.minutes === 0 ? null : opt.minutes * 60);
                              setShowTimerMenu(false);
                            }}
                            className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                              isActive
                                ? 'bg-[#E50914] text-white'
                                : 'text-zinc-200 hover:bg-white/10'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Fullscreen Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                    triggerControls();
                  }}
                  className="p-2 text-zinc-200 hover:text-white hover:scale-110 transition-all cursor-pointer"
                  title={isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة'}
                  aria-label={isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. SPOTIFY-STYLE STICKY BOTTOM MINI PLAYER BAR (When Minimized) */}
      {isMinimized && !isWebHub && (
        <div
          className="fixed left-0 right-0 bottom-[58px] md:bottom-0 z-40 bg-[#121212]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.85)] select-none animate-in slide-in-from-bottom-4 duration-300"
        >
          {/* Spotify-style Interactive Progress Line on Top Edge */}
          <div
            onClick={(e) => {
              if (!duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              // In RTL, fill grows from right to left or standard left to right — track clicks from left edge consistently
              const ratio = (e.clientX - rect.left) / rect.width;
              handleSeekToFraction(ratio);
            }}
            className={`w-full h-1 bg-zinc-800/90 relative group/progress ${duration > 0 ? 'cursor-pointer hover:h-1.5 transition-all' : ''}`}
            title={duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : undefined}
          >
            <div
              className="h-full bg-gradient-to-r from-[#e50914] to-[#ff4d4d] transition-all duration-200 relative"
              style={{ width: duration > 0 ? `${progressPercent}%` : (isPlaying ? '100%' : '0%'), opacity: duration > 0 ? 1 : 0.45 }}
            />
          </div>

          <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 md:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-3">
            {/* RIGHT (RTL Start): Square Album Art + Track Title & Status */}
            <div
              onClick={onMaximize}
              className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:w-[30%] cursor-pointer group/info"
              title="اضغط لتكبير الفيديو"
            >
              <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-zinc-900 border border-white/10 shadow-lg shrink-0">
                <ChannelThumbnail
                  channel={channel}
                  customCover={customCovers[channel.id]}
                  className="w-full h-full object-cover group-hover/info:scale-105 transition-transform duration-300"
                />
                {isPlaying && (
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/75 flex items-end gap-[2px]">
                    <span className="w-[2px] h-2 bg-[#e50914] animate-pulse rounded-full" />
                    <span className="w-[2px] h-3 bg-[#e50914] animate-bounce rounded-full" />
                    <span className="w-[2px] h-1.5 bg-[#e50914] animate-pulse rounded-full" />
                  </div>
                )}
              </div>

              <div className="min-w-0 text-right">
                <div className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-[#e50914] shrink-0" />
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover/info:text-[#ff4d4d] transition-colors">
                    {channel.name}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-zinc-400 mt-0.5">
                  <span className="truncate">{channel.group}</span>
                  {duration > 0 ? (
                    <span className="font-mono text-zinc-500 hidden sm:inline">
                      · {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  ) : (
                    <span className="text-[#ff4d4d] font-semibold hidden sm:inline">
                      · {isPlaying ? 'قيد التشغيل' : 'متوقف مؤقتاً'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CENTER: Spotify Playback Controls (Prev, Play/Pause, Next, Loop) */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-3 shrink-0">
              {/* Previous */}
              <button
                onClick={onPrevChannel}
                className="p-1.5 sm:p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="المقطع السابق"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Play / Pause */}
              <button
                onClick={handleTogglePlayPause}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-lg shadow-black/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={onNextChannel}
                className="p-1.5 sm:p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="المقطع التالي"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Loop Toggle */}
              <button
                onClick={() => setIsLooping(l => !l)}
                className={`p-1.5 sm:p-2 rounded-full transition-all cursor-pointer relative ${
                  isLooping
                    ? 'text-[#e50914] bg-[#e50914]/15 ring-1 ring-[#e50914]/40'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
                title={isLooping ? 'التكرار مفعّل (Loop)' : 'تفعيل التكرار (Loop)'}
              >
                <Repeat className="w-4 h-4" />
                {isLooping && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#e50914]" />
                )}
              </button>
            </div>

            {/* LEFT (RTL End): Volume Slider + Expand Video + Close (X) */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 sm:w-[30%] shrink-0">
              {/* Volume Mute & Slider (Desktop/Tablet) */}
              <div className="hidden md:flex items-center gap-2 bg-[#1c1c1c] px-2.5 py-1.5 rounded-full border border-white/10">
                <button
                  onClick={toggleMutedValue}
                  className="text-zinc-300 hover:text-white cursor-pointer"
                  title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-[#ff4d4d]" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolumeValue(Number(e.target.value));
                    if (isMuted) toggleMutedValue();
                  }}
                  className="w-20 lg:w-24 h-1.5 bg-zinc-700 rounded-lg accent-[#e50914] cursor-pointer"
                  title={`مستوى الصوت: ${isMuted ? 0 : volume}%`}
                />
              </div>

              {/* Mute button on mobile */}
              <button
                onClick={toggleMutedValue}
                className="md:hidden p-1.5 text-zinc-300 hover:text-white rounded-full hover:bg-white/10 cursor-pointer"
                title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-[#ff4d4d]" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Maximize / Expand Video Button */}
              <button
                onClick={onMaximize}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#1e1e1e] hover:bg-[#e50914] text-zinc-200 hover:text-white border border-white/10 hover:border-[#e50914] text-[11px] font-bold transition-all cursor-pointer active:scale-95"
                title="تكبير الفيديو"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">تكبير الفيديو</span>
              </button>

              {/* Close / Stop Button */}
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-full bg-[#1e1e1e] hover:bg-red-950 text-zinc-400 hover:text-[#ff4d4d] border border-white/10 hover:border-[#e50914]/40 transition-all cursor-pointer"
                title="إغلاق وإيقاف الصوت"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
