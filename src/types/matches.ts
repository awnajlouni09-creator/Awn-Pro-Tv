export type TournamentId = 'ucl' | 'laliga' | 'epl' | 'saudi';

export type MatchThemeId = 'default' | TournamentId;

export type MatchStatus = 'upcoming' | 'live';

export interface MatchItem {
  id: string;
  tournament: TournamentId;
  homeTeam: string;
  awayTeam: string;
  matchTime: string;
  channelName: string;
  streamUrl: string;
  status: MatchStatus;
  kickoffTimestamp?: number;
}

export interface TournamentThemeConfig {
  id: MatchThemeId;
  name: string;
  shortName: string;
  tagline: string;
  bgHex: string;
  accentHex: string;
  secondaryHex: string;
  buttonTextHex: string;
  cardBgClass: string;
  borderClass: string;
}
