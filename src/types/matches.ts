export type TournamentId = 'ucl' | 'laliga' | 'epl' | 'saudi';

export type MatchThemeId = 'default' | TournamentId;

export type MatchStatus = 'live' | 'upcoming';

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

export interface TournamentTheme {
  id: MatchThemeId;
  name: string;
  shortName: string;
  tagline: string;
  bgHex: string;
  secondaryHex: string;
  accentHex: string;
  buttonTextHex: string;
}
