import { MatchItem, MatchThemeId, TournamentId, TournamentTheme } from '../types/matches';

export const TOURNAMENT_THEMES: Record<MatchThemeId, TournamentTheme> = {
  default: {
    id: 'default',
    name: 'Awn Tv pro الرياضي',
    shortName: 'ALL LEAGUES',
    tagline: 'تغطية شاملة لأهم البطولات العالمية والمحلية بتوقيت مكة المكرمة والأردن',
    bgHex: '#0a0a0a',
    secondaryHex: '#151515',
    accentHex: '#e50914',
    buttonTextHex: '#ffffff'
  },
  ucl: {
    id: 'ucl',
    name: 'دوري أبطال أوروبا',
    shortName: 'UEFA CHAMPIONS LEAGUE',
    tagline: 'ليالي الأبطال الأوروبية — مواجهات النخبة بنظام الإضاءة الليلية',
    bgHex: '#060c24',
    secondaryHex: '#0d183b',
    accentHex: '#3b82f6',
    buttonTextHex: '#ffffff'
  },
  laliga: {
    id: 'laliga',
    name: 'الدوري الإسباني',
    shortName: 'LA LIGA EA SPORTS',
    tagline: 'متعة الكرة الإسبانية والكلاسيكو ومنافسات القمة',
    bgHex: '#1c0909',
    secondaryHex: '#2c1010',
    accentHex: '#ff4b44',
    buttonTextHex: '#ffffff'
  },
  epl: {
    id: 'epl',
    name: 'الدوري الإنجليزي الممتاز',
    shortName: 'PREMIER LEAGUE',
    tagline: 'أقوى وأسرع دوريات العالم — إثارة مستمرة في كل جولة',
    bgHex: '#160724',
    secondaryHex: '#250e3d',
    accentHex: '#00ff87',
    buttonTextHex: '#160724'
  },
  saudi: {
    id: 'saudi',
    name: 'دوري روشن السعودي',
    shortName: 'ROSHN SAUDI LEAGUE',
    tagline: 'قمة الكرة العربية ومنافسات نجوم العالم في الملاعب السعودية',
    bgHex: '#061a12',
    secondaryHex: '#0d2b1e',
    accentHex: '#10b981',
    buttonTextHex: '#05140e'
  }
};

export const TOURNAMENT_LIST: TournamentTheme[] = (
  ['ucl', 'laliga', 'epl', 'saudi'] as TournamentId[]
).map((id) => TOURNAMENT_THEMES[id]);

export const DEFAULT_MATCHES: MatchItem[] = [
  {
    id: 'match-ucl-1',
    tournament: 'ucl',
    homeTeam: 'ريال مدريد',
    awayTeam: 'مانشستر سيتي',
    matchTime: 'الليلة 11:00 مساءً',
    channelName: 'beIN Sports 1 HD',
    streamUrl: 'https://www.youtube.com/live/2lJZPT6OljI',
    status: 'live'
  },
  {
    id: 'match-laliga-1',
    tournament: 'laliga',
    homeTeam: 'برشلونة',
    awayTeam: 'أتلتيكو مدريد',
    matchTime: 'اليوم 10:30 مساءً',
    channelName: 'beIN Sports 3 HD',
    streamUrl: 'https://www.youtube.com/live/2lJZPT6OljI',
    status: 'upcoming'
  },
  {
    id: 'match-epl-1',
    tournament: 'epl',
    homeTeam: 'ليفربول',
    awayTeam: 'أرسنال',
    matchTime: 'غداً 08:30 مساءً',
    channelName: 'beIN Sports 1 HD',
    streamUrl: 'https://www.youtube.com/live/2lJZPT6OljI',
    status: 'upcoming'
  },
  {
    id: 'match-saudi-1',
    tournament: 'saudi',
    homeTeam: 'الهلال',
    awayTeam: 'النصر',
    matchTime: 'الجمعة 09:00 مساءً',
    channelName: 'SSC 1 HD',
    streamUrl: 'https://www.youtube.com/live/2lJZPT6OljI',
    status: 'upcoming'
  }
];
