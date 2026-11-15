import React from 'react';
import { BellRing, Flame, Trophy, Megaphone, X, Play } from 'lucide-react';
import { AppNotification } from '../types/notifications';

interface NotificationToastProps {
  notification: AppNotification | null;
  onDismiss: () => void;
  onAction?: (notification: AppNotification) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onAction
}) => {
  if (!notification) return null;

  const getStyle = () => {
    switch (notification.type) {
      case 'urgent':
        return {
          container: 'bg-[#1a0709]/95 border-[#e50914] shadow-[0_12px_40px_rgba(229,9,20,0.45)]',
          iconWrap: 'bg-[#e50914] text-white',
          badge: 'تنبيه عاجل',
          badgeClass: 'bg-[#e50914] text-white',
          icon: <Flame className="w-5 h-5" />
        };
      case 'sports':
      case 'match_alert':
        return {
          container: 'bg-[#071911]/95 border-emerald-500/70 shadow-[0_12px_40px_rgba(16,185,129,0.3)]',
          iconWrap: 'bg-emerald-500 text-black',
          badge: notification.type === 'match_alert' ? 'انطلاق مباراة' : 'خبر رياضي',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
          icon: <Trophy className="w-5 h-5" />
        };
      default:
        return {
          container: 'bg-[#151518]/95 border-amber-400/50 shadow-[0_12px_40px_rgba(0,0,0,0.75)]',
          iconWrap: 'bg-amber-400 text-black',
          badge: 'إعلان عام',
          badgeClass: 'bg-amber-400/20 text-amber-300 border border-amber-400/40',
          icon: <Megaphone className="w-5 h-5" />
        };
    }
  };

  const s = getStyle();

  return (
    <div className="fixed top-16 sm:top-20 left-3 right-3 sm:left-6 sm:right-auto sm:w-[400px] z-[65] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`rounded-2xl border backdrop-blur-xl p-3.5 sm:p-4 text-right ${s.container}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow ${s.iconWrap}`}>
            {s.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${s.badgeClass}`}>
                {s.badge}
              </span>
              <button
                onClick={onDismiss}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="إغلاق الإشعار"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
              {notification.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-zinc-300 mt-1 leading-relaxed">
              {notification.message}
            </p>

            {notification.matchId && onAction && (
              <button
                onClick={() => onAction(notification)}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black transition-all cursor-pointer active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>الانتقال للمباراة الآن</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
