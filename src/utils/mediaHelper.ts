/**
 * Media detection, YouTube ID extraction, and thumbnail utilities for Awn Tv pro
 */

export function extractYouTubeVideoId(url?: string): string | null {
  if (!url) return null;

  // 1. youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // 2. youtube.com/live/VIDEO_ID
  const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch && liveMatch[1]) return liveMatch[1];

  // 3. youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // 4. youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // 5. youtube.com/v/VIDEO_ID or /shorts/VIDEO_ID
  const otherMatch = url.match(/youtube\.com\/(?:v|shorts)\/([a-zA-Z0-9_-]{11})/);
  if (otherMatch && otherMatch[1]) return otherMatch[1];

  return null;
}

export function extractYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;

  const originParam = typeof window !== 'undefined' && window.location?.origin
    ? `&origin=${encodeURIComponent(window.location.origin)}`
    : '';

  // Check if it's already an embed URL
  if (url.includes('youtube.com/embed/')) {
    const hasQuery = url.includes('?');
    let updated = url;
    if (!updated.includes('enablejsapi=')) {
      updated += `${hasQuery ? '&' : '?'}enablejsapi=1&playsinline=1${originParam}`;
    }
    return updated;
  }

  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&playsinline=1${originParam}`;
  }

  // Handle channel live stream: https://www.youtube.com/channel/CHANNEL_ID/live or @handle/live
  const channelMatch = url.match(/youtube\.com\/(?:channel\/|c\/|@)([a-zA-Z0-9_-]+)/);
  if (channelMatch && url.includes('live')) {
    return `https://www.youtube.com/embed/live_stream?channel=${channelMatch[1]}&autoplay=1&enablejsapi=1&playsinline=1${originParam}`;
  }

  return null;
}

export function getYouTubeThumbnails(videoId: string) {
  return {
    maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    sd: `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    hq: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    mq: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
  };
}

export function detectMediaType(url: string): 'youtube' | 'hls' | 'video' | 'netflix' | 'web' {
  if (!url) return 'video';

  const lower = url.toLowerCase();

  if (lower.includes('netflix.com')) {
    return 'netflix';
  }

  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'youtube';
  }

  if (lower.includes('.m3u8') || lower.includes('/hls/')) {
    return 'hls';
  }

  if (lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.ogg') || lower.startsWith('blob:')) {
    return 'video';
  }

  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    if (lower.includes('shahid.mbc.net') || lower.includes('twitch.tv')) {
      return 'web';
    }
  }

  return 'video';
}
