/**
 * Centralized type definitions for the app
 */

export type Mode = 'menu' | 'game';
export type Side = 'left' | 'right' | 'spectator' | null;

export interface SavedRound {
  game: number;
  leftName: string;
  rightName: string;
  leftBans: number[];
  rightBans: number[];
  leftPicks: number[];
  rightPicks: number[];
  timestamp: number;
}

export interface GameState {
  currentPhase: number;
  actionCount: number;
  leftBans: number[];
  rightBans: number[];
  leftPicks: number[];
  rightPicks: number[];
  leftName?: string;
  rightName?: string;
  savedRounds?: SavedRound[];
  swapSides?: boolean;
  hasBeenSaved?: boolean;
}

export type HeroStatus = 'available' | 'banned' | 'picked-left' | 'picked-right';
