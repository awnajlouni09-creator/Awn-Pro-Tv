export type NotificationType = 'urgent' | 'sports' | 'general' | 'match_alert';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: number;
  read: boolean;
  matchId?: string;
}

export interface BreakingTickerConfig {
  enabled: boolean;
  text: string;
  style: 'urgent' | 'sports';
}
