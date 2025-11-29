/**
 * Game service for business logic related to game mechanics
 */

import { phases } from '@/lib/gameData';
import type { Hero } from '@/lib/gameData';
import type { Side } from '@/app/types';

export interface GameAction {
  type: 'pick' | 'ban';
  side: Side;
  heroId: number;
}

export interface PhaseData {
  side: Side;
  action: 'pick' | 'ban';
  count: number;
}

export class GameService {
  static getAvailableHeroes(heroes: Hero[], leftBans: number[], rightBans: number[], leftPicks: number[], rightPicks: number[]): number[] {
    const banned = new Set([...leftBans, ...rightBans]);
    const picked = new Set([...leftPicks, ...rightPicks]);
    return heroes.filter(h => !banned.has(h.id) && !picked.has(h.id)).map(h => h.id);
  }

  static getNextPhase(currentPhase: number, actionCount: number): { newPhase: number; newCount: number } {
    if (currentPhase >= phases.length) return { newPhase: currentPhase, newCount: actionCount };

    const phase = phases[currentPhase];
    let newCount = actionCount + 1;
    let newPhase = currentPhase;

    if (newCount >= phase.count) {
      newPhase = currentPhase + 1;
      newCount = 0;
    }

    return { newPhase, newCount };
  }

  static performAutoAction(
    heroes: Hero[],
    currentPhase: number,
    leftBans: number[],
    rightBans: number[],
    leftPicks: number[],
    rightPicks: number[]
  ): GameAction | null {
    if (currentPhase >= phases.length) return null;

    const phase = phases[currentPhase];
    const available = this.getAvailableHeroes(heroes, leftBans, rightBans, leftPicks, rightPicks);

    if (available.length === 0) return null;

    const rand = available[Math.floor(Math.random() * available.length)]!;
    return {
      type: phase.action,
      side: phase.side,
      heroId: rand,
    };
  }

  static applyAction(
    action: GameAction,
    leftBans: number[],
    rightBans: number[],
    leftPicks: number[],
    rightPicks: number[]
  ): { leftBans: number[]; rightBans: number[]; leftPicks: number[]; rightPicks: number[] } {
    const newLeftBans = [...leftBans];
    const newRightBans = [...rightBans];
    const newLeftPicks = [...leftPicks];
    const newRightPicks = [...rightPicks];

    if (action.type === 'ban') {
      if (action.side === 'left') newLeftBans.push(action.heroId);
      else newRightBans.push(action.heroId);
    } else {
      if (action.side === 'left') newLeftPicks.push(action.heroId);
      else newRightPicks.push(action.heroId);
    }

    return { leftBans: newLeftBans, rightBans: newRightBans, leftPicks: newLeftPicks, rightPicks: newRightPicks };
  }

  static getEffectivePhase(currentPhase: number, swapSides: boolean): PhaseData | null {
    if (currentPhase >= phases.length) return null;

    const p = phases[currentPhase];
    // Swap sides for both visual positioning and action order
    const effectiveSide = swapSides ? (p.side === 'left' ? 'right' : 'left') : p.side;
    return { ...p, side: effectiveSide };
  }

  static canPerformAction(
    userSide: Side,
    isStarted: boolean,
    currentPhase: number,
    phaseData: PhaseData | null,
    heroId: number,
    leftBans: number[],
    rightBans: number[],
    leftPicks: number[],
    rightPicks: number[],
    isProcessingAction: boolean
  ): boolean {
    if (userSide === 'spectator') return false;
    if (!isStarted) return false;
    if (currentPhase >= phases.length) return false;
    if (isProcessingAction) return false;
    if (!phaseData || phaseData.side !== userSide) return false;

    const allBanned = [...leftBans, ...rightBans];
    const allPicked = [...leftPicks, ...rightPicks];
    return !allBanned.includes(heroId) && !allPicked.includes(heroId);
  }
}