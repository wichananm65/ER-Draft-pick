'use client';

import React, { useState, useEffect, useRef } from 'react';
import { heroes, phases } from '@/lib/gameData';
import { loadGameState, saveGameState, checkRoomCapacity } from '@/lib/api/storage';
import { wsClient } from '@/lib/api/websocket';
import type { Side, GameState, HeroStatus } from '@/app/types';
import Header from '@/app/components/common/Header';
import PhaseInfo from './PhaseInfo';
import TeamPanel from './TeamPanel';
import HeroGrid from './HeroGrid';

interface GameRoomProps {
  roomCode: string;
  userSide: Side;
  onExit: () => void;
}

export default function GameRoomContainer({ roomCode, userSide, onExit }: GameRoomProps) {
  // Game state
  const [currentPhase, setCurrentPhase] = useState(0);
  const [actionCount, setActionCount] = useState(0);
  const [leftBans, setLeftBans] = useState<number[]>([]);
  const [rightBans, setRightBans] = useState<number[]>([]);
  const [leftPicks, setLeftPicks] = useState<number[]>([]);
  const [rightPicks, setRightPicks] = useState<number[]>([]);

  // Player presence
  const [leftPresent, setLeftPresent] = useState(false);
  const [rightPresent, setRightPresent] = useState(false);

  // Timers
  const [startCountdown, setStartCountdown] = useState<number | null>(null);
  const [actionTimer, setActionTimer] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const startIntervalRef = useRef<number | null>(null);
  const actionIntervalRef = useRef<number | null>(null);

  // Initialize room and load state
  useEffect(() => {
    const setupRoom = async () => {
      try {
        await wsClient.connect();

        const state = await loadGameState(roomCode);
        if (state) {
          setCurrentPhase(state.currentPhase);
          setActionCount(state.actionCount);
          setLeftBans(state.leftBans);
          setRightBans(state.rightBans);
          setLeftPicks(state.leftPicks);
          setRightPicks(state.rightPicks);
        }

        try {
          const cap = await checkRoomCapacity(roomCode);
          setLeftPresent(!!cap.hasLeft);
          setRightPresent(!!cap.hasRight);
          if (cap.hasLeft && cap.hasRight) {
            setTimeout(() => setStartCountdown(10), 0);
          }
        } catch {
          // ignore
        }
      } catch (err) {
        console.error('Failed to setup room:', err);
      }
    };

    setupRoom();
  }, [roomCode]);

  // Listen for real-time state updates
  useEffect(() => {
    const handleStateUpdate = (message: Record<string, unknown>) => {
      const roomState = message.roomState as unknown as GameState;
      if (roomState) {
        setCurrentPhase(roomState.currentPhase);
        setActionCount(roomState.actionCount);
        setLeftBans(roomState.leftBans);
        setRightBans(roomState.rightBans);
        setLeftPicks(roomState.leftPicks);
        setRightPicks(roomState.rightPicks);
      }
    };

    const handlePlayerJoined = (message: Record<string, unknown>) => {
      const side = message.side as string;
      console.log(`Player joined: ${side}`);
      const roomState = message.roomState as unknown as GameState;
      if (roomState) {
        setCurrentPhase(roomState.currentPhase);
        setActionCount(roomState.actionCount);
        setLeftBans(roomState.leftBans);
        setRightBans(roomState.rightBans);
        setLeftPicks(roomState.leftPicks);
        setRightPicks(roomState.rightPicks);
      }
      if (side === 'left') setLeftPresent(true);
      if (side === 'right') setRightPresent(true);
    };

    const handlePlayerLeft = (message: Record<string, unknown>) => {
      const side = message.side as string;
      if (side === 'left') setLeftPresent(false);
      if (side === 'right') setRightPresent(false);
      setStartCountdown(null);
      setIsStarted(false);
      setActionTimer(null);
    };

    const unsubscribeStateUpdate = wsClient.on('state-updated', handleStateUpdate as unknown as (message: Record<string, unknown>) => void);
    const unsubscribePlayerJoined = wsClient.on('player-joined', handlePlayerJoined as unknown as (message: Record<string, unknown>) => void);
    const unsubscribePlayerLeft = wsClient.on('player-left', handlePlayerLeft as unknown as (message: Record<string, unknown>) => void);

    return () => {
      unsubscribeStateUpdate();
      unsubscribePlayerJoined();
      unsubscribePlayerLeft();
    };
  }, []);

  // Start countdown when both players present
  useEffect(() => {
    if (leftPresent && rightPresent && !isStarted && startCountdown == null) {
      setTimeout(() => setStartCountdown(10), 0);
    }
  }, [leftPresent, rightPresent, isStarted, startCountdown]);

  // Start countdown ticking
  useEffect(() => {
    if (startCountdown == null) return;
    if (startCountdown <= 0) {
      setTimeout(() => {
        setStartCountdown(null);
        setIsStarted(true);
        setActionTimer(60);
      }, 0);
      return;
    }
    const id = setInterval(() => {
      setStartCountdown((s) => (s != null ? s - 1 : s));
    }, 1000);
    startIntervalRef.current = id as unknown as number;
    return () => {
      if (startIntervalRef.current) {
        clearInterval(startIntervalRef.current);
        startIntervalRef.current = null;
      }
      clearInterval(id);
    };
  }, [startCountdown]);

  // Reset action timer when phase changes
  useEffect(() => {
    if (!isStarted) return;
    if (currentPhase >= phases.length) {
      setTimeout(() => setActionTimer(null), 0);
      return;
    }
    setTimeout(() => setActionTimer(60), 0);
  }, [currentPhase, actionCount, isStarted]);

  // Action timer ticking and auto-advance
  useEffect(() => {
    if (actionTimer == null) return;
    if (actionTimer <= 0) {
      (async () => {
        try {
          if (currentPhase >= phases.length) return;
          const phase = phases[currentPhase];

          const getAvailable = () => {
            const banned = new Set([...leftBans, ...rightBans]);
            const picked = new Set([...leftPicks, ...rightPicks]);
            return heroes.filter(h => !banned.has(h.id) && !picked.has(h.id)).map(h => h.id);
          };

          const available = getAvailable();
          const newLeftBans = leftBans.slice();
          const newRightBans = rightBans.slice();
          const newLeftPicks = leftPicks.slice();
          const newRightPicks = rightPicks.slice();

          if (available.length > 0) {
            const rand = available[Math.floor(Math.random() * available.length)];
            if (phase.action === 'ban') {
              if (phase.side === 'left') newLeftBans.push(rand);
              else newRightBans.push(rand);
            } else {
              if (phase.side === 'left') newLeftPicks.push(rand);
              else newRightPicks.push(rand);
            }
          }

          let newCount = actionCount + 1;
          let newPhase = currentPhase;
          if (newCount >= phase.count) {
            newPhase = currentPhase + 1;
            newCount = 0;
          }

          const newState = {
            currentPhase: newPhase,
            actionCount: newCount,
            leftBans: newLeftBans,
            rightBans: newRightBans,
            leftPicks: newLeftPicks,
            rightPicks: newRightPicks,
          };

          await saveGameState(roomCode, newState);
          setLeftBans(newLeftBans);
          setRightBans(newRightBans);
          setLeftPicks(newLeftPicks);
          setRightPicks(newRightPicks);
          setCurrentPhase(newPhase);
          setActionCount(newCount);
          setActionTimer(null);
        } catch (e) {
          console.error('Auto-advance failed', e);
        }
      })();
      return;
    }
    const id = setInterval(() => {
      setActionTimer((t) => (t != null ? t - 1 : t));
    }, 1000);
    actionIntervalRef.current = id as unknown as number;
    return () => {
      if (actionIntervalRef.current) {
        clearInterval(actionIntervalRef.current);
        actionIntervalRef.current = null;
      }
      clearInterval(id);
    };
  }, [actionTimer, actionCount, currentPhase, leftBans, rightBans, leftPicks, rightPicks, roomCode]);

  const handleHeroClick = async (heroId: number) => {
    if (userSide === 'spectator') return;
    if (startCountdown != null) return;
    if (!isStarted) return;
    if (currentPhase >= phases.length) return;

    const phase = phases[currentPhase];
    if (phase.side !== userSide) return;

    const allBanned = [...leftBans, ...rightBans];
    const allPicked = [...leftPicks, ...rightPicks];

    if (allBanned.includes(heroId) || allPicked.includes(heroId)) return;

    let newLeftBans = leftBans;
    let newRightBans = rightBans;
    let newLeftPicks = leftPicks;
    let newRightPicks = rightPicks;

    if (phase.action === 'ban') {
      if (phase.side === 'left') {
        newLeftBans = [...leftBans, heroId];
      } else {
        newRightBans = [...rightBans, heroId];
      }
    } else {
      if (phase.side === 'left') {
        newLeftPicks = [...leftPicks, heroId];
      } else {
        newRightPicks = [...rightPicks, heroId];
      }
    }

    const newCount = actionCount + 1;
    let newPhase = currentPhase;
    let finalCount = newCount;

    if (newCount >= phase.count) {
      newPhase = currentPhase + 1;
      finalCount = 0;
    }

    await saveGameState(roomCode, {
      currentPhase: newPhase,
      actionCount: finalCount,
      leftBans: newLeftBans,
      rightBans: newRightBans,
      leftPicks: newLeftPicks,
      rightPicks: newRightPicks
    });

    setLeftBans(newLeftBans);
    setRightBans(newRightBans);
    setLeftPicks(newLeftPicks);
    setRightPicks(newRightPicks);
    setActionCount(finalCount);
    setCurrentPhase(newPhase);
  };

  const resetGame = async () => {
    const newState = {
      currentPhase: 0,
      actionCount: 0,
      leftBans: [],
      rightBans: [],
      leftPicks: [],
      rightPicks: []
    };

    await saveGameState(roomCode, newState);

    setCurrentPhase(0);
    setActionCount(0);
    setLeftBans([]);
    setRightBans([]);
    setLeftPicks([]);
    setRightPicks([]);
  };

  const getHeroStatus = (heroId: number): HeroStatus => {
    if (leftBans.includes(heroId) || rightBans.includes(heroId)) return 'banned';
    if (leftPicks.includes(heroId)) return 'picked-left';
    if (rightPicks.includes(heroId)) return 'picked-right';
    return 'available';
  };

  const currentPhaseData = currentPhase < phases.length ? phases[currentPhase] : null;
  const isGameOver = currentPhase >= phases.length;

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
            startCountdown={startCountdown}
            actionTimer={actionTimer}
            userSide={userSide}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          <TeamPanel side="left" bans={leftBans} picks={leftPicks} />
          <HeroGrid
            heroes={heroes}
            getHeroStatus={getHeroStatus}
            onHeroClick={handleHeroClick}
            isClickable={(heroId: number) => {
              const status = getHeroStatus(heroId);
              return userSide !== 'spectator' && 
                     !isGameOver && 
                     currentPhaseData?.side === userSide && 
                     status === 'available';
            }}
          />
          <TeamPanel side="right" bans={rightBans} picks={rightPicks} />
        </div>
      </div>
    </div>
  );
}
