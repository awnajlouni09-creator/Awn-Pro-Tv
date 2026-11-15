import { MatchItem, TournamentId, TournamentThemeConfig } from '../types/matches';

export const TOURNAMENT_THEMES: Record<'default' | TournamentId, TournamentThemeConfig> = {
  default: {
    id: 'default',
    name: 'الثيم الافتراضي (Awn Tv pro)',
    shortName: 'Awn Tv pro',
    tagline: 'مركز البث الرياضي والمباريات المباشرة',
    bgHex: '#0a0a0a',
    accentHex: '#e50914',
    secondaryHex: '#181818',
    buttonTextHex: '#ffffff',
    cardBgClass: 'bg-[#141414]/90',
    borderClass: 'border-[#e50914]/35'
  },
  ucl: {
    id: 'ucl',
    name: 'دوري أبطال أوروبا',
    shortName: 'Champions League',
    tagline: 'ليالي الأبطال الأوروبية — بث مباشر فائق الجودة',
    bgHex: '#06113c',
    accentHex: '#1e56a0',
    secondaryHex: '#0b1d5e',
    buttonTextHex: '#ffffff',
    cardBgClass: 'bg-[#09184d]/90',
    borderClass: 'border-[#3b82f6]/40'
  },
  laliga: {
    id: 'laliga',
    name: 'الدوري الإسباني',
    shortName: 'LaLiga',
    tagline: 'إثارة الكلاسيكو والليغا الإسبانية مباشرة',
    bgHex: '#121212',
    accentHex: '#ff4b44',
    secondaryHex: '#1f1414',
    buttonTextHex: '#ffffff',
    cardBgClass: 'bg-[#181414]/95',
    borderClass: 'border-[#ff4b44]/45'
  },
  epl: {
    id: 'epl',
    name: 'الدوري الإنجليزي',
    shortName: 'Premier League',
    tagline: 'أقوى دوري في العالم — الدوري الإنجليزي الممتاز',
    bgHex: '#38003c',
    accentHex: '#00ff85',
    secondaryHex: '#260029',
    buttonTextHex: '#38003c',
    cardBgClass: 'bg-[#2a002e]/90',
    borderClass: 'border-[#00ff85]/45'
  },
  saudi: {
    id: 'saudi',
    name: 'الدوري السعودي والبطولات العربية',
    shortName: 'دوري روشن والعرب',
    tagline: 'قمة الكرة السعودية والعربية بأعلى دقة',
    bgHex: '#004d25',
    accentHex: '#d4af37',
    secondaryHex: '#00361a',
    buttonTextHex: '#002b14',
    cardBgClass: 'bg-[#003b1c]/90',
    borderClass: 'border-[#d4af37]/50'
  }
};

export const TOURNAMENT_LIST: TournamentThemeConfig[] = [
  TOURNAMENT_THEMES.ucl,
  TOURNAMENT_THEMES.laliga,
  TOURNAMENT_THEMES.epl,
  TOURNAMENT_THEMES.saudi
];

const NOW = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

export const DEFAULT_MATCHES: MatchItem[] = [
  {
    id: 'match-ucl-1',
    tournament: 'ucl',
    homeTeam: 'ريال مدريد',
    awayTeam: 'بايرن ميونخ',
    matchTime: 'مباشر الآن · توقيت مكة والأردن',
    channelName: 'beIN Sports 1 HD',
    streamUrl: 'https://www.youtube.com/live/2lJZPT6OljI',
    status: 'live'
  },
  {
    id: 'match-ucl-2',
    tournament: 'ucl',
    homeTeam: 'باريس سان جيرمان',
    awayTeam: 'إنتر ميلان',
    matchTime: 'اليوم 10:00 مساءً · توقيت مكة والأردن',
    channelName: 'beIN Sports 2 HD',
    streamUrl: 'https://www.youtube.com/live/2lJZPT6OljI',
    status: 'upcoming',
    kickoffTimestamp: NOW + 45 * MIN
  },
  {
    id: 'match-laliga-1',
    tournament: 'laliga',
    homeTeam: 'برشلونة',
    awayTeam: 'أتلتيكو مدريد',
    matchTime: 'مباشر الآن · توقيت مكة والأردن',
    channelName: 'beIN Sports 3 HD',
    streamUrl: 'https://www.youtube.com/live/2lJZPT6OljI',
    status: 'live'
  },
  {
    id: 'match-laliga-2',
    tournament: 'laliga',
    homeTeam: 'ريال بيتيس',
    awayTeam: 'إشبيلية',
    matchTime: 'غداً 9:30 مساءً · توقيت مكة والأردن',
    channelName: 'beIN Sports LaLiga',
    streamUrl: 'https://www.youtube.com/live/2lJZPT6OljI',
    status: 'upcoming',
    kickoffTimestamp: NOW + 3 * HOUR + 20 * MIN
  },
  {
    id: 'match-epl-1',
    tournament: 'epl',
    homeTeam: 'ليفربول',
    awayTeam: 'مانشستر سيتي',
    matchTime: 'مباشر الآن · توقيت مكة والأردن',
    channelName: 'beIN Sports Premium 1',
    streamUrl: 'https://www.youtube.com/live/2lJZPT6OljI',
    status: 'live'
  },
  {
    id: 'match-epl-2',
    tournament: 'epl',
    homeTeam: 'أرسنال',
    awayTeam: 'تشيلسي',
    matchTime: 'السبت 7:30 مساءً · توقيت مكة والأردن',
    channelName: 'beIN Sports Premium 2',
    streamUrl: 'https://www.youtube.com/live/2lJZPT6OljI',
    status: 'upcoming',
    kickoffTimestamp: NOW + 6 * HOUR + 15 * MIN
  },
  {
    id: 'match-saudi-1',
    tournament: 'saudi',
    homeTeam: 'الهلال',
    awayTeam: 'النصر',
    matchTime: 'مباشر الآن · توقيت مكة والأردن',
    channelName: 'SSC 1 HD',
    streamUrl: 'https://www.youtube.com/live/2lJZPT6OljI',
    status: 'live'
  },
  {
    id: 'match-saudi-2',
    tournament: 'saudi',
    homeTeam: 'الاتحاد',
    awayTeam: 'الأهلي',
    matchTime: 'الجمعة 9:00 مساءً · توقيت مكة والأردن',
    channelName: 'SSC Extra 1',
    streamUrl: 'https://www.youtube.com/live/2lJZPT6OljI',
    status: 'upcoming',
    kickoffTimestamp: NOW + 11 * HOUR + 40 * MIN
  }
];
