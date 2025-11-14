/**
 * Centralized type definitions for the app
 */

export type Mode = 'menu' | 'game';
export type Side = 'left' | 'right' | 'spectator' | null;

export interface GameState {
  currentPhase: number;
  actionCount: number;
  leftBans: number[];
  rightBans: number[];
  leftPicks: number[];
  rightPicks: number[];
}

export type HeroStatus = 'available' | 'banned' | 'picked-left' | 'picked-right';
