import React, { useState } from 'react';
import { 
  Play, 
  ExternalLink, 
  LogIn, 
  Search, 
  Tv, 
  Sparkles, 
  Film, 
  BookmarkCheck, 
  ShieldCheck, 
  Monitor,
  Flame,
  Layers,
  ArrowRight,
  RotateCw,
  ArrowLeft,
  Lock,
  Maximize2,
  Globe
} from 'lucide-react';

interface NetflixHubProps {
  onBackToChannels?: () => void;
}

export const NetflixHub: React.FC<NetflixHubProps> = ({ onBackToChannels }) => {
  const [viewMode, setViewMode] = useState<'cinema' | 'browser' | 'search'>('cinema');
  const [browserUrl, setBrowserUrl] = useState('https://www.netflix.com/browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'movies' | 'series' | 'trending'>('all');
  const [activeTrailerVideo, setActiveTrailerVideo] = useState<string | null>(null);

  // Curated Netflix in-app items with in-app video streams or deep links
  const netflixShowcase = [
    {
      id: 'n1',
      title: 'Stranger Things (أشياء غريبة)',
      category: 'series',
      genre: 'خيال علمي · غموض · رعب',
      badge: '4K Ultra HD',
      rating: '16+',
      image: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=500&auto=format&fit=crop&q=80',
      synopsis: 'عندما يختفي صبي صغير في بلدة هوكينز، يكشف أصدقاؤه وعائلته عن لغز مرعب يتضمن تجارب سرية وبوابات لعالم مظلم.',
      query: 'Stranger Things',
      inAppStream: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
    },
    {
      id: 'n2',
      title: 'Squid Game (لعبة الحبار)',
      category: 'series',
      genre: 'إثارة · دراما · تشويق',
      badge: 'الأكثر مشاهدة عالمياً',
      rating: '18+',
      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
      synopsis: 'مئات اللاعبين المثقلين بالديون يقبلون دعوة غريبة للتنافس في ألعاب أطفال خطيرة بجائزة مالية هائلة.',
      query: 'Squid Game',
      inAppStream: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
    },
    {
      id: 'n3',
      title: 'Wednesday (وينزداي)',
      category: 'series',
      genre: 'فانتازيا · كوميديا سوداء',
      badge: 'TOP 10',
      rating: '13+',
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
      synopsis: 'سنوات مراهقة وينزداي آدامز كطالبة في أكاديمية نيفرمور ومحاولتها إتقان قدراتها النفسية لحل لغز غامض.',
      query: 'Wednesday',
      inAppStream: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    },
    {
      id: 'n4',
      title: 'Extraction (إكستراكشن)',
      category: 'movies',
      genre: 'حركة · إثارة وقتال',
      badge: 'فيلم نتفلكس الأصلي',
      rating: '18+',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
      synopsis: 'مرتزق جريء في السوق السوداء يُكلف بمهمة إنقاذ خطيرة لابن أحد أكبر زعماء الجريمة في بنغلاديش.',
      query: 'Extraction',
      inAppStream: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
    },
    {
      id: 'n5',
      title: 'Our Planet (كوكبنا 4K)',
      category: 'trending',
      genre: 'وثائقي طبيعة · 4K HDR',
      badge: 'وثائقي حصري',
      rating: 'للجميع',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80',
      synopsis: 'تجربة بصرية مذهلة تستكشف موائل الأرض الطبيعية النادرة وتأثير تغير المناخ على الكائنات الحية.',
      query: 'Our Planet',
      inAppStream: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    },
    {
      id: 'n6',
      title: 'The Queen\'s Gambit (مناورة الملكة)',
      category: 'series',
      genre: 'دراما · شطرنج',
      badge: 'حائز على جوائز إيمي',
      rating: '16+',
      image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=500&auto=format&fit=crop&q=80',
      synopsis: 'يتيمة شابة تكتشف موهبة خارقة في الشطرنج وتشق طريقها نحو القمة وسط صراعات الشهرة والضغوط.',
      query: 'The Queens Gambit',
      inAppStream: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    }
  ];

  const handleOpenNetflixLogin = () => {
    // Open in smart window
    window.open('https://www.netflix.com/login', 'NetflixLogin', 'width=1100,height=750');
  };

  const handleOpenNetflixSearch = (query?: string) => {
    const q = query || searchQuery;
    if (q.trim()) {
      window.open(`https://www.netflix.com/search?q=${encodeURIComponent(q.trim())}`, 'NetflixPlayer');
    } else {
      window.open('https://www.netflix.com/browse', 'NetflixPlayer');
    }
  };

  const filteredItems = netflixShowcase.filter(item => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      return item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             item.genre.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col text-white select-none overflow-hidden">
      {/* Smart TV In-App Browser Top Navigation Bar */}
      <div className="h-12 bg-[#121212] border-b border-[#242424] px-4 flex items-center justify-between gap-3 shrink-0">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="h-7 px-2.5 bg-[#E50914] rounded-lg flex items-center justify-center font-black tracking-widest text-white text-xs font-['Outfit'] uppercase shadow">
            NETFLIX
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hidden sm:inline">
            حساب المشتركين
          </span>
        </div>

        {/* Browser URL Bar Address */}
        <div className="flex-1 max-w-xl mx-2 flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#2e2e2e]">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs font-mono text-zinc-300 truncate select-text">
            {browserUrl}
          </span>
        </div>

        {/* View Mode Switchers & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Cinema Hub Mode */}
          <button
            onClick={() => setViewMode('cinema')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'cinema'
                ? 'bg-[#E50914] text-white shadow-sm'
                : 'bg-[#1e1e1e] text-zinc-400 hover:text-white'
            }`}
          >
            كتالوج نتفلكس
          </button>

          {/* In-App Browser Mode */}
          <button
            onClick={() => setViewMode('browser')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'browser'
                ? 'bg-[#E50914] text-white shadow-sm'
                : 'bg-[#1e1e1e] text-zinc-400 hover:text-white'
            }`}
          >
            المتصفح الداخلي
          </button>

          {/* Quick Login button */}
          <button
            onClick={handleOpenNetflixLogin}
            className="flex items-center gap-1 px-3 py-1 bg-[#222222] hover:bg-[#2e2e2e] text-zinc-200 text-xs font-semibold rounded-lg border border-[#333333] cursor-pointer"
            title="تسجيل الدخول بحسابك في نتفلكس"
          >
            <LogIn className="w-3.5 h-3.5 text-[#E50914]" />
            <span className="hidden md:inline">تسجيل الدخول</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'browser' ? (
        /* In-App Web View Container */
        <div className="flex-1 flex flex-col bg-black relative">
          {/* Interactive In-App Browser Sandbox */}
          <div className="flex-1 w-full h-full relative">
            <iframe
              src="https://www.netflix.com/browse"
              title="Netflix In-App Browser"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              className="w-full h-full border-0 bg-[#141414]"
            />

            {/* Informative Assistant Overlay for Browser CSP policy */}
            <div className="absolute bottom-4 left-6 right-6 bg-black/90 backdrop-blur-md p-4 rounded-2xl border border-[#E50914]/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] shrink-0 font-bold">
                  N
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    تنبيه أمان متصفح نتفلكس (Netflix Security):
                  </p>
                  <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                    تقوم نتفلكس بحماية صفحة تسجيل الدخول أمنياً. اضغط زر <strong className="text-white">"تسجيل الدخول في نافذة ذكية"</strong> لتسجيل حسابك، وسيبقى حسابك نشطاً داخل التطبيق!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleOpenNetflixLogin}
                  className="px-4 py-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  تسجيل الدخول في نافذة ذكية
                </button>
                <button
                  onClick={() => setViewMode('cinema')}
                  className="px-4 py-2 bg-[#222222] hover:bg-[#2c2c2c] text-zinc-300 text-xs font-medium rounded-xl cursor-pointer"
                >
                  عرض الكتالوج والتشغيل
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* In-App Netflix Cinema Showcase & Trailer Player */
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
          {/* Active Player if an item is selected */}
          {activeTrailerVideo && (
            <div className="bg-[#121212] rounded-2xl border border-[#2b2b2b] p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-ping"></span>
                  <span className="text-xs font-bold text-white">مشغل نتفلكس جو التطبيق بدقة فائقة 4K</span>
                </div>
                <button
                  onClick={() => setActiveTrailerVideo(null)}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
                >
                  إغلاق المشغل ✕
                </button>
              </div>
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
                <video
                  src={activeTrailerVideo}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Quick Search inside Netflix */}
          <div className="bg-[#141414] p-4 rounded-2xl border border-[#242424] flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOpenNetflixSearch()}
                placeholder="ابحث عن أي فيلم أو مسلسل في مكتبة نتفلكس (مثال: Stranger Things, Wednesday, Peaky Blinders)..."
                className="w-full h-10 bg-[#0d0d0d] text-white text-xs pl-4 pr-10 rounded-xl border border-[#2e2e2e] focus:border-[#E50914] focus:outline-none transition-all placeholder:text-zinc-500"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>

            <button
              onClick={() => handleOpenNetflixSearch()}
              className="w-full md:w-auto px-5 h-10 bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>تشغيل في نتفلكس</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 pb-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'bg-[#181818] text-zinc-400 hover:text-white'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setActiveCategory('series')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'series'
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'bg-[#181818] text-zinc-400 hover:text-white'
              }`}
            >
              المسلسلات
            </button>
            <button
              onClick={() => setActiveCategory('movies')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'movies'
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'bg-[#181818] text-zinc-400 hover:text-white'
              }`}
            >
              الأفلام
            </button>
            <button
              onClick={() => setActiveCategory('trending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'trending'
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'bg-[#181818] text-zinc-400 hover:text-white'
              }`}
            >
              الأكثر مشاهدة 4K
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-[#141414] hover:bg-[#1a1a1a] rounded-2xl border border-[#242424] hover:border-[#E50914] overflow-hidden transition-all duration-300 flex flex-col shadow-lg"
              >
                {/* Thumbnail */}
                <div className="h-44 w-full relative overflow-hidden bg-zinc-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E50914] text-white shadow">
                      {item.badge}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-zinc-300">
                      {item.rating}
                    </span>
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                    <button
                      onClick={() => setActiveTrailerVideo(item.inAppStream)}
                      className="px-3 py-1.5 bg-white text-black font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-lg cursor-pointer hover:bg-zinc-200"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>تشغيل جو التطبيق</span>
                    </button>
                    <button
                      onClick={() => handleOpenNetflixSearch(item.query)}
                      className="px-3 py-1.5 bg-[#E50914] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-lg cursor-pointer hover:bg-[#b80710]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>بحسابك</span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-[#E50914] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#ff4d4d] font-medium mt-0.5">{item.genre}</p>
                    <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                      {item.synopsis}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-xs">
                    <button
                      onClick={() => setActiveTrailerVideo(item.inAppStream)}
                      className="text-[#E50914] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>تشغيل فوري جو التطبيق</span>
                    </button>
                    <span className="text-[10px] text-zinc-500 font-mono">Ultra HD</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
