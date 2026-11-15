import React, { useState } from 'react';
import {
  Tv,
  Gift,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  CreditCard,
  AlertCircle,
  Lock,
  Film,
  Trophy,
  Music,
  Gamepad2,
  HardDrive
} from 'lucide-react';
import { SubscriptionConfig } from '../types/subscription';

interface SubscriptionGateProps {
  config: SubscriptionConfig;
  expiredNotice?: boolean;
  onActivatePayPal: (details: { payerEmail?: string; reference?: string }) => void;
  onActivateGiftCode: (code: string) => void;
  onRequestAdminAccess: () => void;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  config,
  expiredNotice = false,
  onActivatePayPal,
  onActivateGiftCode,
  onRequestAdminAccess
}) => {
  const [activeTab, setActiveTab] = useState<'paypal' | 'gift'>('paypal');

  // PayPal confirmation state
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [payerEmail, setPayerEmail] = useState('');
  const [paypalReference, setPaypalReference] = useState('');
  const [hasConfirmedPayment, setHasConfirmedPayment] = useState(false);
  const [paypalError, setPaypalError] = useState('');

  // Gift code state
  const [giftCodeInput, setGiftCodeInput] = useState('');
  const [giftError, setGiftError] = useState('');
  const [giftSuccess, setGiftSuccess] = useState(false);

  const priceFormatted = Number.isInteger(config.monthlyPriceUsd)
    ? `${config.monthlyPriceUsd}`
    : config.monthlyPriceUsd.toFixed(2);

  const paypalCheckoutUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(
    config.paypalEmail
  )}&item_name=${encodeURIComponent(
    'Awn Tv pro - Monthly Subscription (1 Month)'
  )}&amount=${encodeURIComponent(
    config.monthlyPriceUsd.toFixed(2)
  )}&currency_code=USD&no_shipping=1`;

  const handleCopyPaypalEmail = async () => {
    try {
      await navigator.clipboard.writeText(config.paypalEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    } catch {
      // Fallback if clipboard API blocked
      const input = document.createElement('input');
      input.value = config.paypalEmail;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const handlePayPalConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaypalError('');

    if (!hasConfirmedPayment) {
      setPaypalError('يرجى إتمام الدفع عبر PayPal ثم تأكيد المربع أدناه لتفعيل الاشتراك.');
      return;
    }

    if (!paypalReference.trim() && !payerEmail.trim()) {
      setPaypalError('يرجى كتابة بريدك في PayPal أو رقم/مرجع العملية للتحقق.');
      return;
    }

    onActivatePayPal({
      payerEmail: payerEmail.trim() || undefined,
      reference: paypalReference.trim() || undefined
    });
  };

  const handleGiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGiftError('');
    const normalized = giftCodeInput.trim().toLowerCase();

    if (!normalized) {
      setGiftError('يرجى إدخال رمز الهدية أولاً.');
      return;
    }

    const matchedCode = config.giftCodes.find(
      (code) => code.trim().toLowerCase() === normalized
    );

    if (!matchedCode) {
      setGiftError('رمز الهدية غير صحيح. تأكد من الرمز أو اشترك عبر PayPal.');
      return;
    }

    setGiftSuccess(true);
    setTimeout(() => {
      onActivateGiftCode(matchedCode);
    }, 550);
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-40 bg-[#070707] text-white overflow-y-auto select-none flex flex-col justify-between"
    >
      {/* Cinematic Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-[-10%] w-[550px] h-[550px] rounded-full bg-[#e50914]/15 blur-[150px]" />
        <div className="absolute -bottom-40 left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0070ba]/15 blur-[150px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-5 sm:pt-7 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#e50914] to-[#800000] flex items-center justify-center shadow-lg shadow-[#e50914]/30 border border-[#ff4d4d]/40">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-wider text-white font-['Outfit']">
            Awn Tv <span className="text-[#e50914]">pro</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onRequestAdminAccess}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-[#ff4d4d]" />
          <span>دخول الإدارة</span>
        </button>
      </header>

      {/* Main Content Grid */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10 my-auto">
        {expiredNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-3 text-amber-200 text-xs sm:text-sm font-semibold">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              انتهت مدة اشتراكك الشهري الحالي. يرجى تجديد الاشتراك عبر PayPal (${priceFormatted}/شهر) أو تفعيل رمز هدية للاستمرار.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Right Column: Plan Details & Value */}
          <div className="lg:col-span-6 space-y-6 text-right">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#ff4d4d]">
                <Lock className="w-4 h-4" />
                <span>بوابة العضوية المميزة</span>
                <span aria-hidden="true">·</span>
                <span className="text-zinc-400">تفعيل فوري</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                افتح عالم الترفيه الكامل في{' '}
                <span className="text-[#e50914]">Awn Tv pro</span>
              </h1>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
                شاهد جميع القنوات الإخبارية، الأفلام، المسلسلات، ملخصات الأنمي، المباريات المباشرة، واستمع للأغاني أثناء التصفح باشتراك شهري رمزي أو عبر رمز الهدية المجاني.
              </p>
            </div>

            {/* Pricing Highlight */}
            <div className="py-5 border-y border-white/10 flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-white font-['Outfit']">
                ${priceFormatted}
              </span>
              <div className="text-sm text-zinc-400">
                <span className="font-bold text-white">دولار أمريكي / شهرياً</span>
                <span className="block text-xs text-zinc-400 mt-0.5">
                  دفع مباشر عبر محفظة PayPal أو دخول مجاني برمز الهدية
                </span>
              </div>
            </div>

            {/* Included Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm text-zinc-200">
              <div className="flex items-center gap-2.5">
                <Film className="w-4 h-4 text-[#e50914] shrink-0" />
                <span>أفلام، مسلسلات وملخصات أنمي</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>مركز المباريات المباشرة والتنبيهات</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Music className="w-4 h-4 text-rose-400 shrink-0" />
                <span>مشغل أغاني متواصل بأسلوب سبوتيفاي</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Gamepad2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>صالة الألعاب المصغرة والريموت الذكي</span>
              </div>
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>رفع وحفظ أفلامك الخاصة من الجهاز</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <span>حسابات متعددة ووضع آمن للأطفال</span>
              </div>
            </div>
          </div>

          {/* Left Column: PayPal Payment & Gift Code Box */}
          <div className="lg:col-span-6">
            <div className="bg-[#121212] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl">
              {/* Segmented Method Switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-[#090909] border border-white/10 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('paypal')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                    activeTab === 'paypal'
                      ? 'bg-[#0070ba] text-white shadow-lg'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>دفع PayPal (${priceFormatted})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('gift')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                    activeTab === 'gift'
                      ? 'bg-[#e50914] text-white shadow-lg'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Gift className="w-4 h-4" />
                  <span>لدي رمز هدية مجاني</span>
                </button>
              </div>

              {activeTab === 'paypal' ? (
                <div className="space-y-5">
                  {/* PayPal Wallet Box */}
                  <div className="p-4 rounded-2xl bg-[#0b1624] border border-[#0070ba]/40 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-sky-300">
                        محفظة PayPal المعتمدة للاشتراك (${priceFormatted} شهرياً)
                      </span>
                      <span className="text-xs font-black text-white font-['Outfit']">
                        PayPal
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-black/50 border border-white/10 rounded-xl px-3 py-2.5">
                      <span className="text-xs sm:text-sm font-mono text-white truncate dir-ltr text-left select-all">
                        {config.paypalEmail}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyPaypalEmail}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white shrink-0 cursor-pointer transition-colors"
                      >
                        {copiedEmail ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>

                    <a
                      href={paypalCheckoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-11 rounded-xl bg-[#0070ba] hover:bg-[#0086dd] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <span>الانتقال للدفع عبر PayPal (${priceFormatted} USD)</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Step 2: Confirm Payment */}
                  <form onSubmit={handlePayPalConfirmSubmit} className="space-y-3.5 pt-1">
                    <p className="text-xs font-bold text-zinc-300">
                      بعد إتمام التحويل إلى <span className="text-sky-400 font-mono">{config.paypalEmail}</span>، أكّد العملية للدخول:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          بريد PayPal الخاص بك
                        </label>
                        <input
                          type="email"
                          value={payerEmail}
                          onChange={(e) => {
                            setPayerEmail(e.target.value);
                            setPaypalError('');
                          }}
                          placeholder="name@example.com"
                          className="w-full h-10 bg-[#1a1a1a] text-white text-xs px-3 rounded-xl border border-[#2f2f2f] focus:border-[#0070ba] focus:outline-none font-mono text-left dir-ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          رقم العملية / المرجع (Transaction ID)
                        </label>
                        <input
                          type="text"
                          value={paypalReference}
                          onChange={(e) => {
                            setPaypalReference(e.target.value);
                            setPaypalError('');
                          }}
                          placeholder="مثال: 8AB12345XY"
                          className="w-full h-10 bg-[#1a1a1a] text-white text-xs px-3 rounded-xl border border-[#2f2f2f] focus:border-[#0070ba] focus:outline-none font-mono text-left dir-ltr"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#181818] border border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasConfirmedPayment}
                        onChange={(e) => {
                          setHasConfirmedPayment(e.target.checked);
                          setPaypalError('');
                        }}
                        className="mt-0.5 w-4 h-4 accent-[#0070ba] cursor-pointer shrink-0"
                      />
                      <span className="text-xs text-zinc-300 leading-relaxed">
                        أؤكد أنني دفعت رسوم الاشتراك الشهري (${priceFormatted}) عبر محفظة PayPal ({config.paypalEmail}).
                      </span>
                    </label>

                    {paypalError && (
                      <div className="p-3 rounded-xl bg-red-950/50 border border-[#e50914]/40 text-xs text-[#ff6666] flex items-center gap-2 font-semibold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{paypalError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm font-black transition-all cursor-pointer shadow-lg"
                    >
                      تفعيل الاشتراك والدخول الآن
                    </button>
                  </form>
                </div>
              ) : (
                /* GIFT CODE FORM */
                <form onSubmit={handleGiftSubmit} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#1a0b0d] border border-[#e50914]/30 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e50914]/20 text-[#ff4d4d] flex items-center justify-center shrink-0">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <h3 className="text-sm font-extrabold text-white">
                        الدخول المجاني برمز الهدية
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        إذا حصلت على رمز هدية خاص من مالك التطبيق، أدخله هنا لتفتح جميع المزايا والقنوات مجاناً بدون دفع شهري.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">
                      أدخل رمز الهدية:
                    </label>
                    <input
                      type="text"
                      value={giftCodeInput}
                      onChange={(e) => {
                        setGiftCodeInput(e.target.value);
                        setGiftError('');
                      }}
                      placeholder="اكتب رمز الهدية هنا..."
                      autoFocus
                      className="w-full h-12 bg-[#1a1a1a] text-white text-base font-mono font-bold tracking-widest text-center px-4 rounded-xl border border-[#333333] focus:border-[#e50914] focus:outline-none transition-all"
                    />
                  </div>

                  {giftError && (
                    <div className="p-3 rounded-xl bg-red-950/50 border border-[#e50914]/40 text-xs text-[#ff6666] flex items-center gap-2 font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{giftError}</span>
                    </div>
                  )}

                  {giftSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 font-bold">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>تم قبول رمز الهدية بنجاح! جاري فتح التطبيق مجاناً...</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={giftSuccess}
                    className="w-full h-12 rounded-xl bg-[#e50914] hover:bg-[#ff1a1a] disabled:opacity-70 text-white text-sm font-black shadow-lg shadow-[#e50914]/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Gift className="w-4 h-4" />
                    <span>تفعيل الرمز والدخول مجاناً</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pb-6 pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span>Awn Tv pro · بوابة الاشتراك والدخول</span>
        <span>PayPal: {config.paypalEmail}</span>
      </footer>
    </div>
  );
};
