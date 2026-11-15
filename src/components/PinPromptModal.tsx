import React, { useState } from 'react';
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
  title = 'رمز الحماية الأبوي',
  subtitle = 'أدخل الرمز المكون من 4 أرقام للخروج من حساب الأطفال',
  errorHint = 'رمز PIN غير صحيح. حاول مرة أخرى.'
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === expectedPin || expectedPin === '') {
          setTimeout(() => {
            onSuccess();
            setPin('');
          }, 180);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#141414] border border-[#2b2b2b] w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-white flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={() => {
            setPin('');
            setError(false);
            onClose();
          }}
          className="absolute top-4 left-4 p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#cc0000]/20 border border-[#cc0000]/40 flex items-center justify-center text-[#ff4d4d] mb-3 shadow-lg">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-white text-center mb-1">{title}</h3>
        <p className="text-xs text-zinc-400 text-center mb-5 max-w-xs">{subtitle}</p>

        {/* 4 Digit Boxes */}
        <div className={`flex items-center gap-3 mb-6 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const hasVal = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-12 h-14 rounded-2xl border flex items-center justify-center text-xl font-mono font-bold transition-all ${
                  error
                    ? 'border-[#ff1a1a] bg-red-950/30 text-[#ff4d4d]'
                    : hasVal
                    ? 'border-[#cc0000] bg-[#1f1f1f] text-white shadow-md shadow-[#cc0000]/20'
                    : 'border-[#2d2d2d] bg-[#121212] text-zinc-600'
                }`}
              >
                {hasVal ? '●' : ''}
              </div>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-[#ff4d4d] font-semibold mb-3 flex items-center gap-1 text-center">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{errorHint}</span>
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-2xl bg-[#1c1c1c] hover:bg-[#282828] active:bg-[#cc0000] text-lg font-bold font-mono text-zinc-200 hover:text-white border border-[#262626] transition-all cursor-pointer flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="h-12 rounded-2xl bg-[#171717] hover:bg-[#222222] text-xs font-semibold text-zinc-400 hover:text-white border border-[#222222] cursor-pointer flex items-center justify-center"
          >
            مسح
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-[#1c1c1c] hover:bg-[#282828] active:bg-[#cc0000] text-lg font-bold font-mono text-zinc-200 hover:text-white border border-[#262626] transition-all cursor-pointer flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-[#171717] hover:bg-[#222222] text-zinc-400 hover:text-white border border-[#222222] cursor-pointer flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
