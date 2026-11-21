import React, { useState, useEffect, useCallback } from 'react';
import { Lock, X, Delete, ShieldAlert } from 'lucide-react';

interface PinPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedPin: string;
  title?: string;
  subtitle?: string;
  errorHint?: string;
}

export const PinPromptModal: React.FC<PinPromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expectedPin,
  title = 'قفل الملف الشخصي',
  subtitle = 'أدخل الرمز المكون من 4 أرقام للمتابعة',
  errorHint = 'رمز PIN غير صحيح. حاول مرة أخرى.'
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleClose = useCallback(() => {
    setPin('');
    setError(false);
    onClose();
  }, [onClose]);

  const handleDigit = useCallback(
    (digit: string) => {
      setPin((prev) => {
        if (prev.length >= 4) return prev;
        const nextPin = prev + digit;
        setError(false);

        if (nextPin.length === 4) {
          if (nextPin === expectedPin || expectedPin === '') {
            setTimeout(() => {
              onSuccess();
              setPin('');
            }, 160);
          } else {
            setError(true);
            setTimeout(() => {
              setPin('');
            }, 550);
          }
        }
        return nextPin;
      });
    },
    [expectedPin, onSuccess]
  );

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setPin('');
    setError(false);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (/^\d$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose, handleDigit, handleDelete]);

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181818] border border-white/15 w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.95)] relative text-white flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="إغلاق"
          className="absolute top-4 left-4 min-w-[40px] min-h-[40px] text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] mb-4">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-white text-center mb-1.5">{title}</h3>
        <p className="text-xs sm:text-sm text-zinc-400 text-center mb-6 max-w-xs leading-relaxed">
          {subtitle}
        </p>

        {/* 4 Netflix-style PIN Boxes (Supports Keyboard + Keypad) */}
        <div dir="ltr" className={`flex items-center justify-center gap-3.5 mb-5 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const hasVal = pin.length > idx;
            const isActive = pin.length === idx;
            return (
              <div
                key={idx}
                className={`w-14 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-mono font-black transition-all duration-150 ${
                  error
                    ? 'border-[#E50914] bg-red-950/35 text-[#ff4d4d]'
                    : hasVal
                    ? 'border-white bg-[#242424] text-white shadow-[0_0_16px_rgba(255,255,255,0.18)]'
                    : isActive
                    ? 'border-white/80 bg-[#141414] ring-2 ring-white/20 text-zinc-500'
                    : 'border-zinc-700 bg-[#121212] text-zinc-600'
                }`}
              >
                {hasVal ? '●' : isActive ? <span className="w-0.5 h-6 bg-white/70 animate-pulse" /> : ''}
              </div>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-[#ff4d4d] font-semibold mb-4 flex items-center gap-1.5 text-center">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorHint}</span>
          </p>
        )}

        {/* Touch & Remote Numeric Keypad */}
        <div dir="ltr" className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] mt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl bg-[#222222] hover:bg-[#303030] active:bg-[#E50914] text-lg font-bold font-mono text-zinc-100 hover:text-white border border-white/10 transition-all cursor-pointer flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setPin('');
              setError(false);
            }}
            className="h-12 rounded-xl bg-[#161616] hover:bg-[#242424] text-xs font-semibold text-zinc-400 hover:text-white border border-white/10 cursor-pointer flex items-center justify-center"
          >
            مسح
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-[#222222] hover:bg-[#303030] active:bg-[#E50914] text-lg font-bold font-mono text-zinc-100 hover:text-white border border-white/10 transition-all cursor-pointer flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="حذف رقم"
            className="h-12 rounded-xl bg-[#161616] hover:bg-[#242424] text-zinc-400 hover:text-white border border-white/10 cursor-pointer flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 mt-4">
          يمكنك الكتابة مباشرة عبر لوحة المفاتيح أو الأزرار
        </p>
      </div>
    </div>
  );
};
