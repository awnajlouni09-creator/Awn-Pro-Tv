import React, { useState } from 'react';
import { Download, Share, PlusSquare, WifiOff, X, Smartphone } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-xl bg-[#e50914] hover:bg-[#ff1a1a] text-white font-bold shadow-md shadow-[#e50914]/25 transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0 ${
          compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-xs'
        }`}
        title="تثبيت التطبيق على الهاتف أو الكمبيوتر"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 px-2.5 py-1.5 text-[11px] font-bold text-zinc-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="تثبيت التطبيق على آيفون وآيباد"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#e50914]" />
          <span>تثبيت iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-[#141414] border border-[#2a2a2a] p-6 shadow-2xl text-white text-right relative animate-in fade-in zoom-in-95">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 left-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center text-[#ff4d4d] mb-3">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-base font-black text-white">تثبيت Awn Tv pro على آيفون وآيباد</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                لإضافة التطبيق إلى شاشتك الرئيسية وتشغيله بملء الشاشة كتطبيق مستقل:
              </p>

              <ol className="mt-4 space-y-3 text-xs text-zinc-200">
                <li className="flex items-center gap-2.5 bg-[#1d1d1d] p-2.5 rounded-xl border border-[#2c2c2c]">
                  <Share className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>1. اضغط على زر <strong>مشاركة (Share)</strong> في أسفل متصفح سفاري.</span>
                </li>
                <li className="flex items-center gap-2.5 bg-[#1d1d1d] p-2.5 rounded-xl border border-[#2c2c2c]">
                  <PlusSquare className="w-4 h-4 text-[#e50914] shrink-0" />
                  <span>2. اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</span>
                </li>
              </ol>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#e50914] hover:bg-[#ff1a1a] py-2.5 text-xs font-extrabold text-white transition-colors cursor-pointer"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-4 z-[60] flex items-center gap-2 rounded-xl bg-amber-600/95 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white shadow-xl border border-amber-400/40">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>أنت غير متصل بالإنترنت — يتم عرض البيانات المخزنة</span>
    </div>
  );
};
