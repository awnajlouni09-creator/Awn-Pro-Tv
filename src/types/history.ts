import { Channel } from './iptv';

export interface ContinueWatchingItem {
  channelId: string;
  channel: Channel;
  progressPercent: number; // 0 to 100
  currentTime: number; // seconds
  duration: number; // seconds
  lastWatchedAt: number; // timestamp ms
}
