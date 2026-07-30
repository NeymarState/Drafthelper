export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'DST' | 'K';

export type PlayerStatus = 'Verfügbar' | 'Mein Team' | 'Gedraftet (Gegner)';

export type ScoringFormat = 'Half-PPR' | 'Full-PPR' | 'Standard';

export type LeagueType = 'Redraft' | 'Dynasty';

export interface Player {
  id: string;
  ovrRank: number;
  posRank: string;
  name: string;
  pos: Position;
  team: string;
  bye: number;
  tier: string;
  tierNumber: number;
  status: PlayerStatus;
  targetShare: number; // e.g., 0.26 for 26%
  rzTouches: number;   // e.g., 38
  airYards: number;    // e.g., 0.35 for 35%
  basePointsHalfPpr: number; // Base projected points for Half-PPR
  age?: number;
  dynastyTier?: string;
  profile: string;     // Fantasy Footballers notes & upside
  customTag?: 'Sleeper' | 'Target' | 'Avoid' | 'Fade' | 'Value' | null | '';
  rbRole?: 'RB1' | 'RB2' | 'Timeshare' | 'Handcuff' | 'RB3';
  wrRole?: 'WR1' | 'WR2' | 'WR3' | 'WR4';
  playerArchetype?: 'Upside' | 'Baseline';
  isRookie?: boolean;
  adp?: number;
}

export interface DraftSettings {
  leagueSize: number; // 8, 10, 12, 14, 16
  scoringFormat: ScoringFormat;
  leagueType: LeagueType;
  userPickSlot: number; // 1 to leagueSize
  currentOverallPick: number;
}

export interface RosterState {
  QB: Player | null;
  RB1: Player | null;
  RB2: Player | null;
  WR1: Player | null;
  WR2: Player | null;
  TE: Player | null;
  FLEX: Player | null;
  DST: Player | null;
  K: Player | null;
  BENCH: Player[];
}

export interface AlertItem {
  id: string;
  type: 'tier-scarcity' | 'stack' | 'bye-overlap' | 'value-steal';
  severity: 'high' | 'medium' | 'info' | 'success';
  title: string;
  message: string;
  details?: string[];
}

export interface StackCombo {
  qb: Player;
  passCatchers: Player[];
  team: string;
}

