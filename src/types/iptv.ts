export interface ChannelServer {
  id: string;
  name: string;
  url: string;
  type: 'youtube' | 'hls' | 'video' | 'embed' | 'web';
}

export interface ChannelEpisode {
  id: string;
  number: number;
  title: string;
  duration?: string;
  url: string;
  thumbnail?: string;
  description?: string;
}

export interface CastMember {
  id: string;
  name: string;
  character?: string;
  imageUrl?: string;
}

export interface TitleReviewReply {
  id: string;
  authorName: string;
  date: string;
  text: string;
}

export interface TitleReview {
  id: string;
  authorName: string;
  authorAvatar?: string;
  date: string;
  rating: number; // 1 to 5
  comment: string;
  likesCount: number;
  repliesCount?: number;
  replies?: TitleReviewReply[];
  source?: 'admin' | 'visitor';
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
  durationLabel?: string;
  year?: string;
  maturityRating?: 'kids' | '7+' | '13+' | '16+' | '18+' | 'عائلي';
  genres?: string[];
  imdbRating?: string;
  primaryColor?: string;
  secondaryColor?: string;
  cast?: string[];
  castMembers?: CastMember[];
  reviews?: TitleReview[];
  director?: string;
  collectionName?: string;
  isRecentlyAdded?: boolean;
  episodes?: ChannelEpisode[];
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
