import { useCallback } from 'react';
import { GameService, type GameAction } from '@/lib/services/gameService';
import type { Side, GameState, SavedRound } from '@/app/types';
import type { Hero } from '@/lib/gameData';

interface UseHeroActionsProps {
  userSide: Side;
  isStarted: boolean;
  currentPhase: number;
  actionCount: number;
  leftBans: number[];
  rightBans: number[];
  leftPicks: number[];
  rightPicks: number[];
  leftName: string | undefined;
  rightName: string | undefined;
  savedRounds: SavedRound[];
  swapSides: boolean;
  heroes: Hero[];
  isProcessingAction: boolean;
  setIsProcessingAction: (processing: boolean) => void;
  setLeftBans: (bans: number[]) => void;
  setRightBans: (bans: number[]) => void;
  setLeftPicks: (picks: number[]) => void;
  setRightPicks: (picks: number[]) => void;
  setCurrentPhase: (phase: number) => void;
  setActionCount: (count: number) => void;
  saveCurrentState: (updates: Partial<GameState>) => Promise<void>;
  addRecentAction: (type: 'pick' | 'ban', side: Side, id: number) => void;
}

export function useHeroActions({
  userSide,
  isStarted,
  currentPhase,
  actionCount,
  leftBans,
  rightBans,
  leftPicks,
  rightPicks,
  leftName,
  rightName,
  savedRounds,
  swapSides,
  heroes,
  isProcessingAction,
  setIsProcessingAction,
  setLeftBans,
  setRightBans,
  setLeftPicks,
  setRightPicks,
  setCurrentPhase,
  setActionCount,
  saveCurrentState,
  addRecentAction,
}: UseHeroActionsProps) {
  const handleHeroClick = useCallback(async (heroId: number) => {
    const phaseData = GameService.getEffectivePhase(currentPhase, swapSides);
    if (!GameService.canPerformAction(
      userSide,
      isStarted,
      currentPhase,
      phaseData,
      heroId,
      leftBans,
      rightBans,
      leftPicks,
      rightPicks,
      isProcessingAction
    )) return;

    const action: GameAction = {
      type: phaseData!.action,
      side: phaseData!.side,
      heroId,
    };

    const { leftBans: newLeftBans, rightBans: newRightBans, leftPicks: newLeftPicks, rightPicks: newRightPicks } =
      GameService.applyAction(action, leftBans, rightBans, leftPicks, rightPicks);

    const { newPhase, newCount } = GameService.getNextPhase(currentPhase, actionCount);

    setIsProcessingAction(true);
    await saveCurrentState({
      currentPhase: newPhase,
      actionCount: newCount,
      leftBans: newLeftBans,
      rightBans: newRightBans,
      leftPicks: newLeftPicks,
      rightPicks: newRightPicks,
      leftName,
      rightName,
      savedRounds,
    });

    setLeftBans(newLeftBans);
    setRightBans(newRightBans);
    setLeftPicks(newLeftPicks);
    setRightPicks(newRightPicks);
    setCurrentPhase(newPhase);
    setActionCount(newCount);

    addRecentAction(action.type, action.side, heroId);
    setIsProcessingAction(false);
  }, [
    userSide,
    isStarted,
    currentPhase,
    actionCount,
    leftBans,
    rightBans,
    leftPicks,
    rightPicks,
    leftName,
    rightName,
    savedRounds,
    swapSides,
    isProcessingAction,
    setIsProcessingAction,
    setLeftBans,
    setRightBans,
    setLeftPicks,
    setRightPicks,
    setCurrentPhase,
    setActionCount,
    saveCurrentState,
    addRecentAction,
  ]);

  const performAutoAction = useCallback(async () => {
    const action = GameService.performAutoAction(heroes, currentPhase, leftBans, rightBans, leftPicks, rightPicks);
    if (!action) return;

    const { leftBans: newLeftBans, rightBans: newRightBans, leftPicks: newLeftPicks, rightPicks: newRightPicks } =
      GameService.applyAction(action, leftBans, rightBans, leftPicks, rightPicks);

    const { newPhase, newCount } = GameService.getNextPhase(currentPhase, actionCount);

    await saveCurrentState({
      currentPhase: newPhase,
      actionCount: newCount,
      leftBans: newLeftBans,
      rightBans: newRightBans,
      leftPicks: newLeftPicks,
      rightPicks: newRightPicks,
      leftName,
      rightName,
      savedRounds,
    });

    setLeftBans(newLeftBans);
    setRightBans(newRightBans);
    setLeftPicks(newLeftPicks);
    setRightPicks(newRightPicks);
    setCurrentPhase(newPhase);
    setActionCount(newCount);

    addRecentAction(action.type, action.side, action.heroId);
  }, [
    heroes,
    currentPhase,
    actionCount,
    leftBans,
    rightBans,
    leftPicks,
    rightPicks,
    leftName,
    rightName,
    savedRounds,
    setLeftBans,
    setRightBans,
    setLeftPicks,
    setRightPicks,
    setCurrentPhase,
    setActionCount,
    saveCurrentState,
    addRecentAction,
  ]);

  return {
    handleHeroClick,
    performAutoAction,
  };
}