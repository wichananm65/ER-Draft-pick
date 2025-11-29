'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getHeroes, phases } from '@/lib/gameData';
import { GameService } from '@/lib/services/gameService';
import { wsClient } from '@/lib/api/websocket';
import type { Side } from '@/app/types';
import type { Hero } from '@/lib/gameData';
import Header from '@/app/components/common/Header';
import PhaseInfo from './PhaseInfo';
import TeamPanel from './TeamPanel';
import HeroGrid from './HeroGrid';
import RecentActionBanner from './RecentActionBanner';
import HistoryModal from './HistoryModal';
import { useTranslation } from '@/lib/i18n';
import { useAudio } from '@/app/hooks/useAudio';
import { useStartCountdown, useActionTimer } from '@/app/hooks/useTimers';
import { useGameState } from '@/app/hooks/useGameState';
import { useHeroActions } from '@/app/hooks/useHeroActions';

interface GameRoomProps {
  roomCode: string;
  userSide: Side;
  onExit: () => void;
}

export default function GameRoomContainer({ roomCode, userSide, onExit }: GameRoomProps) {
  const { t } = useTranslation();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Show only the most recent action at the top of the hero section
  const [lastAction, setLastAction] = useState<{ type: 'pick' | 'ban'; side: Side; heroId: number; ts: number } | null>(null);

  const { playSoundForEvent } = useAudio();

  // Ref for the action callback that needs to be updated when swapSides changes
  const onActionPerformedRef = useRef<((type: 'pick' | 'ban', side: Side, heroId: number) => void) | undefined>(undefined);

  const {
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
    animatingSwap,
    readyToStartLeft,
    readyToStartRight,
    readyRestartLeft,
    readyRestartRight,
    hasBeenSaved,
    setLeftName,
    setRightName,
    setSavedRounds,
    setHasBeenSaved,
    setCurrentPhase,
    setActionCount,
    setLeftBans,
    setRightBans,
    setLeftPicks,
    setRightPicks,
    setReadyRestartLeft,
    setReadyRestartRight,
    getHeroStatus,
    saveCurrentState,
  } = useGameState({
    roomCode,
    playSoundForEvent,
    onGameStart: () => playSoundForEvent('start'),
    onPhaseChange: (prev, newPhase) => {
      // Play phase change sound
      if (newPhase < phases.length) {
        const phase = phases[newPhase];
        if (phase.action === 'ban') playSoundForEvent('ban');
        else if (phase.action === 'pick') playSoundForEvent('pick');
        else playSoundForEvent('phase');
      } else {
        playSoundForEvent('phase');
      }
    },
    onActionPerformedRef,
  });

  // Update the callback when swapSides changes
  useEffect(() => {
    onActionPerformedRef.current = (type: 'pick' | 'ban', side: Side, heroId: number) => {
      const visualSide: Side = swapSides ? (side === 'left' ? 'right' : 'left') : side;
      setLastAction({ type, side: visualSide, heroId, ts: Date.now() });
    };
  }, [swapSides]);

  const { startCountdown } = useStartCountdown(
    isStarted,
    readyToStartLeft,
    readyToStartRight,
    () => {
      setIsStarted(true);
    }
  );

  useEffect(() => {
    getHeroes().then(setHeroes).catch(console.error);
  }, []);

  const { handleHeroClick, performAutoAction } = useHeroActions({
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
    addRecentAction: (type, side, id) => {
      const visualSide: Side = swapSides ? (side === 'left' ? 'right' : 'left') : side;
      setLastAction({ type, side: visualSide, heroId: id, ts: Date.now() });
    },
  });

  const { actionTimer } = useActionTimer(
    isStarted,
    currentPhase,
    actionCount,
    phases.length,
    async () => {
      if (currentPhase >= phases.length) return;
      await performAutoAction();
    }
  );



  const resetGame = async () => {
    // Signal readiness to restart; server will reset when both sides ready
    if (userSide === 'left') setReadyRestartLeft(true);
    if (userSide === 'right') setReadyRestartRight(true);
    wsClient.send({
      type: 'ready-to-restart',
      roomCode,
      side: userSide,
    });
  };

  const handleReadyToStart = () => {
    wsClient.send({
      type: 'ready-to-start',
      roomCode,
      side: userSide,
    });
  };

  const handleSaveRound = async () => {
    // Only allow saving once per game and only when game is finished
    if (hasBeenSaved || currentPhase < phases.length) return;

    const round = {
      game: (savedRounds.length || 0) + 1,
      leftName: leftName ?? 'Left',
      rightName: rightName ?? 'Right',
      leftBans: leftBans.slice(),
      rightBans: rightBans.slice(),
      leftPicks: leftPicks.slice(),
      rightPicks: rightPicks.slice(),
      timestamp: Date.now()
    };

    const newSaved = [...savedRounds, round];
    setSavedRounds(newSaved);
    setHasBeenSaved(true);
    // persist names and savedRounds with game state
    const stateToSave = {
      currentPhase,
      actionCount,
      leftBans,
      rightBans,
      leftPicks,
      rightPicks,
      leftName,
      rightName,
      savedRounds: newSaved,
      hasBeenSaved: true
    };
    try {
      await saveCurrentState(stateToSave);
    } catch (e) {
      console.error('Failed to save round', e);
    }
  };

  // Compute effective phase (no longer based on swap flag for order)
  const effectivePhase = currentPhase < phases.length ? phases[currentPhase] : null;
  const currentPhaseData = effectivePhase;
  const isGameOver = currentPhase >= phases.length;

  if (!heroes.length) {
    return <div className="h-screen bg-gray-900 flex items-center justify-center text-white">Loading heroes...</div>;
  }

  return (
    <div className="h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col p-4 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full overflow-hidden">
        <Header roomCode={roomCode} userSide={userSide} onExit={onExit} />

        <div className="shrink-0">
          <PhaseInfo
            currentPhaseData={currentPhaseData}
            actionCount={actionCount}
            isGameOver={isGameOver}
              onReset={resetGame}
              onSave={handleSaveRound}
            hasBeenSaved={hasBeenSaved}
            startCountdown={startCountdown}
            actionTimer={actionTimer}
            userSide={userSide}
            readyToStartLeft={readyToStartLeft}
            readyToStartRight={readyToStartRight}
            onReadyToStart={handleReadyToStart}
            isStarted={isStarted}
            restartReadyLeft={readyRestartLeft}
            restartReadyRight={readyRestartRight}
            swapSides={swapSides}
            leftName={leftName}
            rightName={rightName}
          />
        </div>

        <div className={`mt-2 flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden items-start min-h-0 swap-container ${animatingSwap ? 'swap-anim' : ''}`}>
          {/* Left panel: show data depending on swapSides */}
          <div className="w-full lg:w-1/4 team-slot left-slot">
            {/** When swapped, left view should display right team's data and color */}
            {swapSides ? (
              <TeamPanel
                side="right"
                isVisuallyLeft={true}
                bans={rightBans}
                picks={rightPicks}
                name={rightName}
                isEditable={userSide === 'right'}
                onNameChange={(v) => { setRightName(v); saveCurrentState({ rightName: v }); }}
                heroes={heroes}
              />
            ) : (
              <TeamPanel
                side="left"
                isVisuallyLeft={true}
                bans={leftBans}
                picks={leftPicks}
                name={leftName}
                isEditable={userSide === 'left'}
                onNameChange={(v) => { setLeftName(v); saveCurrentState({ leftName: v }); }}
                heroes={heroes}
              />
            )}
          </div>

          <div className="w-full lg:w-1/2 flex flex-col h-full min-h-0">
            {/* center: recent action banner (centered) */}
            <div className="w-full flex justify-center">
              <div className="w-full lg:w-full px-2">
                <RecentActionBanner lastAction={lastAction} heroes={heroes} />
              </div>
            </div>
            <HeroGrid
              heroes={heroes}
              getHeroStatus={getHeroStatus}
              onHeroClick={handleHeroClick}
              isClickable={(heroId: number) => {
                const status = getHeroStatus(heroId);
                const effectivePhaseData = GameService.getEffectivePhase(currentPhase, swapSides);
                return userSide !== 'spectator' && 
                       !isGameOver && 
                       effectivePhaseData?.side === userSide && 
                       status === 'available' &&
                       !isProcessingAction;
              }}
            />
          </div>

          <div className="w-full lg:w-1/4 team-slot right-slot">
            {/* Right panel: show opposite team when swapped */}
            {swapSides ? (
              <TeamPanel
                side="left"
                isVisuallyLeft={false}
                bans={leftBans}
                picks={leftPicks}
                name={leftName}
                isEditable={userSide === 'left'}
                onNameChange={(v) => { setLeftName(v); saveCurrentState({ leftName: v }); }}
                heroes={heroes}
              />
            ) : (
              <TeamPanel
                side="right"
                isVisuallyLeft={false}
                bans={rightBans}
                picks={rightPicks}
                name={rightName}
                isEditable={userSide === 'right'}
                onNameChange={(v) => { setRightName(v); saveCurrentState({ rightName: v }); }}
                heroes={heroes}
              />
            )}
          </div>
        </div>

        {/* Floating history button */}
        <div className="fixed right-6 bottom-6 z-50">
          <button
            onClick={() => setShowHistory(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg"
          >
            {t('history_button')}
          </button>
        </div>

        <HistoryModal
          showHistory={showHistory}
          onClose={() => setShowHistory(false)}
          savedRounds={savedRounds}
          heroes={heroes}
        />
      </div>
    </div>
  );
}