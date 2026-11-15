export interface ChannelServer {
  id: string;
  name: string;
  url: string;
  type: 'youtube' | 'hls' | 'video' | 'embed' | 'web';
}

export interface Channel {
  id: string;
  name: string;
  url: string;
  group: string;
  logo?: string;
  poster?: string;
  backdrop?: string;
  tvgId?: string;
  resolution?: '4K' | 'FHD' | 'HD' | 'SD';
  isFavorite?: boolean;
  type?: 'live' | 'vod' | 'local' | 'youtube' | 'netflix' | 'web' | 'hls';
  youtubeId?: string;
  embedUrl?: string;
  duration?: number;
  description?: string;
  servers?: ChannelServer[];
  badge?: string; // e.g. "LIVE", "الأكثر مشاهدة", "جديد"
  isLocalSaved?: boolean;
  localMediaId?: string;
  fileName?: string;
  fileSizeBytes?: number;
}

export type AspectRatio = '16:9' | '4:3' | 'fill' | 'original';

export interface PlaylistStats {
  name: string;
  totalChannels: number;
  groups: string[];
  loadedAt: string;
}
