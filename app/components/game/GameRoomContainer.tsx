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
import RecentActionBanner from './RecentActionBanner';

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
  const [leftName, setLeftName] = useState<string | undefined>(undefined);
  const [rightName, setRightName] = useState<string | undefined>(undefined);
  const [savedRounds, setSavedRounds] = useState<Array<Record<string, unknown>>>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Player presence
  const [leftPresent, setLeftPresent] = useState(false);
  const [rightPresent, setRightPresent] = useState(false);

  // Timers
  const [startCountdown, setStartCountdown] = useState<number | null>(null);
  const [actionTimer, setActionTimer] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [readyToStartLeft, setReadyToStartLeft] = useState(false);
  const [readyToStartRight, setReadyToStartRight] = useState(false);
  const [readyRestartLeft, setReadyRestartLeft] = useState(false);
  const [readyRestartRight, setReadyRestartRight] = useState(false);
  const [swapSides, setSwapSides] = useState(false);
  const [animatingSwap, setAnimatingSwap] = useState(false);
  const swapRef = useRef<boolean>(swapSides);
  // Show only the most recent action at the top of the hero section
  const [lastAction, setLastAction] = useState<{ type: 'pick' | 'ban'; side: Side; heroId: number; ts: number } | null>(null);

  // refs to keep latest picks/bans for diffing incoming state updates
  const leftPicksRef = useRef<number[]>(leftPicks);
  const rightPicksRef = useRef<number[]>(rightPicks);
  const leftBansRef = useRef<number[]>(leftBans);
  const rightBansRef = useRef<number[]>(rightBans);

  // Audio helpers (WebAudio) for start/pick/ban/phase-change sounds
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ensureAudioContext = () => {
    if (audioCtxRef.current) return audioCtxRef.current;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
      return audioCtxRef.current;
    } catch {
      return null;
    }
  };

  const playTone = (freq: number, duration = 0.12, type: OscillatorType = 'sine') => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.stop(now + duration + 0.02);
  };

  const playSequence = (notes: Array<{ f: number; d?: number }>) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    let t = ctx.currentTime;
    notes.forEach((n) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = n.f;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      o.start(t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (n.d ?? 0.12));
      o.stop(t + (n.d ?? 0.12) + 0.02);
      t += (n.d ?? 0.12) + 0.02;
    });
  };

  const playSoundForEvent = (ev: 'start' | 'pick' | 'ban' | 'phase') => {
    try {
      if (ev === 'start') {
        playSequence([{ f: 440, d: 0.08 }, { f: 660, d: 0.12 }, { f: 880, d: 0.16 }]);
      } else if (ev === 'pick') {
        playTone(880, 0.12, 'sine');
      } else if (ev === 'ban') {
        playTone(220, 0.12, 'sine');
      } else if (ev === 'phase') {
        playSequence([{ f: 660, d: 0.06 }, { f: 880, d: 0.06 }]);
      }
    } catch (e) {
      // ignore audio errors
    }
  };

  useEffect(() => {
    swapRef.current = swapSides;
  }, [swapSides]);

  // helper to set the latest action (shows for everyone, local immediate and from server)
  const addRecentAction = (type: 'pick' | 'ban', side: Side, id: number) => {
    const visualSide: Side = swapRef.current ? (side === 'left' ? 'right' : 'left') : side;
    setLastAction({ type, side: visualSide, heroId: id, ts: Date.now() });
  };

  // keep refs in sync with local state so diffs work for any source of updates
  useEffect(() => {
    leftPicksRef.current = leftPicks;
    rightPicksRef.current = rightPicks;
    leftBansRef.current = leftBans;
    rightBansRef.current = rightBans;
  }, [leftPicks, rightPicks, leftBans, rightBans]);

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
          if ((state as any).leftName) setLeftName((state as any).leftName as string);
          if ((state as any).rightName) setRightName((state as any).rightName as string);
          if ((state as any).savedRounds) setSavedRounds((state as any).savedRounds as Array<Record<string, unknown>>);
        }

        try {
          const cap = await checkRoomCapacity(roomCode);
          setLeftPresent(!!cap.hasLeft);
          setRightPresent(!!cap.hasRight);
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
    const performSwapTransition = (newSwap: boolean) => {
      // play circular shrink-expand animation, swap content at midpoint
      if (animatingSwap) return;
      setAnimatingSwap(true);
      // midpoint at ~300ms
      setTimeout(() => {
        setSwapSides(newSwap);
      }, 300);
      setTimeout(() => {
        setAnimatingSwap(false);
      }, 600);
    };

    const handleStateUpdate = (message: Record<string, unknown>) => {
      const roomState = message.roomState as unknown as GameState;
      if (roomState) {
        // compute diffs vs last known picks/bans and play sounds for additions
        const newLeftPicks = Array.isArray(roomState.leftPicks) ? (roomState.leftPicks as number[]) : [];
        const newRightPicks = Array.isArray(roomState.rightPicks) ? (roomState.rightPicks as number[]) : [];
        const newLeftBans = Array.isArray(roomState.leftBans) ? (roomState.leftBans as number[]) : [];
        const newRightBans = Array.isArray(roomState.rightBans) ? (roomState.rightBans as number[]) : [];

        const leftPicksAdded = newLeftPicks.filter(id => !leftPicksRef.current.includes(id));
        const rightPicksAdded = newRightPicks.filter(id => !rightPicksRef.current.includes(id));
        const leftBansAdded = newLeftBans.filter(id => !leftBansRef.current.includes(id));
        const rightBansAdded = newRightBans.filter(id => !rightBansRef.current.includes(id));

        // (use shared addRecentAction helper)

        // play sounds in a short sequence to avoid overlapping
        let delay = 0;
        leftPicksAdded.forEach(() => { setTimeout(() => playSoundForEvent('pick'), delay); delay += 80; });
        rightPicksAdded.forEach(() => { setTimeout(() => playSoundForEvent('pick'), delay); delay += 80; });
        leftBansAdded.forEach(() => { setTimeout(() => playSoundForEvent('ban'), delay); delay += 80; });
        rightBansAdded.forEach(() => { setTimeout(() => playSoundForEvent('ban'), delay); delay += 80; });

        // if multiple actions arrived, show only the latest one in the banner
        const addedEvents: Array<{ type: 'pick' | 'ban'; side: Side; id: number }> = [];
        leftPicksAdded.forEach((id) => addedEvents.push({ type: 'pick', side: 'left', id }));
        rightPicksAdded.forEach((id) => addedEvents.push({ type: 'pick', side: 'right', id }));
        leftBansAdded.forEach((id) => addedEvents.push({ type: 'ban', side: 'left', id }));
        rightBansAdded.forEach((id) => addedEvents.push({ type: 'ban', side: 'right', id }));
        if (addedEvents.length > 0) {
          const last = addedEvents[addedEvents.length - 1];
          addRecentAction(last.type, last.side, last.id);
        }

        // apply state
        setCurrentPhase(roomState.currentPhase);
        setActionCount(roomState.actionCount);
        setLeftBans(newLeftBans);
        setRightBans(newRightBans);
        setLeftPicks(newLeftPicks);
        setRightPicks(newRightPicks);
        if ((roomState as any).leftName) setLeftName((roomState as any).leftName as string);
        if ((roomState as any).rightName) setRightName((roomState as any).rightName as string);
        if ((roomState as any).savedRounds) setSavedRounds((roomState as any).savedRounds as Array<Record<string, unknown>>);
        if (Object.prototype.hasOwnProperty.call(roomState as any, 'swapSides')) {
          const newSwap = !!(roomState as any).swapSides;
          if (swapRef.current !== newSwap) {
            performSwapTransition(newSwap);
          } else {
            setSwapSides(newSwap);
          }
        }

        // update refs
        leftPicksRef.current = newLeftPicks;
        rightPicksRef.current = newRightPicks;
        leftBansRef.current = newLeftBans;
        rightBansRef.current = newRightBans;
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
          if ((roomState as any).leftName) setLeftName((roomState as any).leftName as string);
          if ((roomState as any).rightName) setRightName((roomState as any).rightName as string);
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

    const handleReadyToStartStatus = (message: Record<string, unknown>) => {
      const leftReady = !!message.readyLeft;
      const rightReady = !!message.readyRight;
      setReadyToStartLeft(leftReady);
      setReadyToStartRight(rightReady);
      // Start countdown when both ready
      if (leftReady && rightReady && !isStarted && startCountdown == null) {
        setTimeout(() => setStartCountdown(10), 0);
      }
    };

    const handleRestartReadyStatus = (message: Record<string, unknown>) => {
      const leftReady = !!message.readyLeft;
      const rightReady = !!message.readyRight;
      console.log('restart-ready-status received', { leftReady, rightReady });
      setReadyRestartLeft(leftReady);
      setReadyRestartRight(rightReady);
      // When both ready for restart, trigger local countdown
      if (leftReady && rightReady && startCountdown == null) {
        setIsStarted(false);
        setTimeout(() => setStartCountdown(10), 0);
      }
    };

    const unsubscribeStateUpdate = wsClient.on('state-updated', handleStateUpdate as unknown as (message: Record<string, unknown>) => void);
    const unsubscribePlayerJoined = wsClient.on('player-joined', handlePlayerJoined as unknown as (message: Record<string, unknown>) => void);
    const unsubscribePlayerLeft = wsClient.on('player-left', handlePlayerLeft as unknown as (message: Record<string, unknown>) => void);
    const unsubscribeReadyToStart = wsClient.on('ready-to-start-status', handleReadyToStartStatus as unknown as (message: Record<string, unknown>) => void);
    const unsubscribeRestartReady = wsClient.on('restart-ready-status', handleRestartReadyStatus as unknown as (message: Record<string, unknown>) => void);
    const handleRestartApproved = (message: Record<string, unknown>) => {
      // When server confirms restart, clear game state locally (visual sync)
      console.log('restart-approved received');
      setCurrentPhase(0);
      setActionCount(0);
      setLeftBans([]);
      setRightBans([]);
      setLeftPicks([]);
      setRightPicks([]);
      setReadyRestartLeft(false);
      setReadyRestartRight(false);
    };
    const unsubscribeRestartApproved = wsClient.on('restart-approved', handleRestartApproved as unknown as (message: Record<string, unknown>) => void);

    return () => {
      unsubscribeStateUpdate();
      unsubscribePlayerJoined();
      unsubscribePlayerLeft();
      unsubscribeReadyToStart();
      unsubscribeRestartReady();
      unsubscribeRestartApproved();
    };
  }, []);

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

  // Play sound when game actually starts
  useEffect(() => {
    if (isStarted) {
      playSoundForEvent('start');
    }
  }, [isStarted]);

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

          let autoChosen: { type?: 'pick' | 'ban'; side?: Side; id?: number } = {};
          if (available.length > 0) {
            const rand = available[Math.floor(Math.random() * available.length)];
            if (phase.action === 'ban') {
              if (phase.side === 'left') newLeftBans.push(rand);
              else newRightBans.push(rand);
              autoChosen = { type: 'ban', side: phase.side, id: rand };
            } else {
              if (phase.side === 'left') newLeftPicks.push(rand);
              else newRightPicks.push(rand);
              autoChosen = { type: 'pick', side: phase.side, id: rand };
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
            leftName,
            rightName,
            savedRounds
          };

          await saveGameState(roomCode, newState);
          setLeftBans(newLeftBans);
          setRightBans(newRightBans);
          setLeftPicks(newLeftPicks);
          setRightPicks(newRightPicks);
          setCurrentPhase(newPhase);
          setActionCount(newCount);
          // If auto-chosen action occurred, show it immediately in recent actions
          if (autoChosen.id && autoChosen.type && autoChosen.side) {
            addRecentAction(autoChosen.type, autoChosen.side, autoChosen.id);
          }
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
  }, [actionTimer, actionCount, currentPhase, leftBans, rightBans, leftPicks, rightPicks, roomCode, leftName, rightName, savedRounds]);

  const handleHeroClick = async (heroId: number) => {
    if (userSide === 'spectator') return;
    if (startCountdown != null) return;
    if (!isStarted) return;
    if (currentPhase >= phases.length) return;
    if (isProcessingAction) return;

    const phase = effectivePhase!;
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

    setIsProcessingAction(true);
    await saveGameState(roomCode, {
      currentPhase: newPhase,
      actionCount: finalCount,
      leftBans: newLeftBans,
      rightBans: newRightBans,
      leftPicks: newLeftPicks,
      rightPicks: newRightPicks,
      leftName,
      rightName,
      savedRounds
    });

    setLeftBans(newLeftBans);
    setRightBans(newRightBans);
    setLeftPicks(newLeftPicks);
    setRightPicks(newRightPicks);
    setActionCount(finalCount);
    setCurrentPhase(newPhase);
    // show recent action immediately for the acting player
    addRecentAction(phase.action === 'ban' ? 'ban' : 'pick', phase.side, heroId);
    setIsProcessingAction(false);
  };

  const resetGame = async () => {
    // Signal readiness to restart; server will reset when both sides ready
    if (userSide === 'left') setReadyRestartLeft(true);
    if (userSide === 'right') setReadyRestartRight(true);
    wsClient.send({
      type: 'ready-to-restart',
      roomCode,
      side: userSide,
    } as any);
  };

  const handleReadyToStart = () => {
    wsClient.send({
      type: 'ready-to-start',
      roomCode,
      side: userSide,
    });
  };

  const handleSaveRound = async () => {
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
      savedRounds: newSaved
    };
    try {
      await saveGameState(roomCode, stateToSave as any);
    } catch (e) {
      console.error('Failed to save round', e);
    }
  };

  const getHeroStatus = (heroId: number): HeroStatus => {
    if (leftBans.includes(heroId) || rightBans.includes(heroId)) return 'banned';
    if (leftPicks.includes(heroId)) return 'picked-left';
    if (rightPicks.includes(heroId)) return 'picked-right';
    return 'available';
  };

  // Compute effective phase based on swap flag
  const effectivePhase = currentPhase < phases.length ? (() => {
    const p = phases[currentPhase];
    const side = swapSides ? (p.side === 'left' ? 'right' : 'left') : p.side;
    return { ...p, side };
  })() : null;
  const currentPhaseData = effectivePhase;
  const isGameOver = currentPhase >= phases.length;

  // Play sounds on phase change (pick/ban/phase)
  const prevPhaseRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevPhaseRef.current === null) {
      prevPhaseRef.current = currentPhase;
      return;
    }
    if (currentPhase !== prevPhaseRef.current) {
      // phase changed
      const prev = prevPhaseRef.current;
      prevPhaseRef.current = currentPhase;
      const newPhase = phases[currentPhase];
      if (newPhase) {
        if (newPhase.action === 'ban') playSoundForEvent('ban');
        else if (newPhase.action === 'pick') playSoundForEvent('pick');
        else playSoundForEvent('phase');
      } else {
        playSoundForEvent('phase');
      }
    }
  }, [currentPhase]);

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
          />
        </div>

        {/* Recent action banner — moved into center column for centered layout */}

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
                onNameChange={(v) => { setRightName(v); saveGameState(roomCode, { currentPhase, actionCount, leftBans, rightBans, leftPicks, rightPicks, leftName, rightName: v, savedRounds } as any); }}
              />
            ) : (
              <TeamPanel
                side="left"
                isVisuallyLeft={true}
                bans={leftBans}
                picks={leftPicks}
                name={leftName}
                isEditable={userSide === 'left'}
                onNameChange={(v) => { setLeftName(v); saveGameState(roomCode, { currentPhase, actionCount, leftBans, rightBans, leftPicks, rightPicks, leftName: v, rightName, savedRounds } as any); }}
              />
            )}
          </div>

          <div className="w-full lg:w-1/2 flex flex-col h-full min-h-0">
            {/* center: recent action banner (centered) */}
            <div className="w-full flex justify-center">
              <div className="w-full lg:w-full px-2">
                <RecentActionBanner lastAction={lastAction} />
              </div>
            </div>
            <HeroGrid
              heroes={heroes}
              getHeroStatus={getHeroStatus}
              onHeroClick={handleHeroClick}
              isClickable={(heroId: number) => {
                const status = getHeroStatus(heroId);
                return userSide !== 'spectator' && 
                       !isGameOver && 
                       currentPhaseData?.side === userSide && 
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
                onNameChange={(v) => { setLeftName(v); saveGameState(roomCode, { currentPhase, actionCount, leftBans, rightBans, leftPicks, rightPicks, leftName: v, rightName, savedRounds } as any); }}
              />
            ) : (
              <TeamPanel
                side="right"
                isVisuallyLeft={false}
                bans={rightBans}
                picks={rightPicks}
                name={rightName}
                isEditable={userSide === 'right'}
                onNameChange={(v) => { setRightName(v); saveGameState(roomCode, { currentPhase, actionCount, leftBans, rightBans, leftPicks, rightPicks, leftName, rightName: v, savedRounds } as any); }}
              />
            )}
          </div>
        </div>

        {null}
      </div>

      {/* Floating history button */}
      <div className="fixed right-6 bottom-6 z-50">
        <button
          onClick={() => setShowHistory(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg"
        >
          ประวัติเกม
        </button>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          />
          <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-[92vw] max-w-4xl max-h-[82vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
              <div className="text-white font-semibold">ประวัติเกมที่บันทึกไว้</div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-300 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[72vh]">
              {savedRounds.length === 0 ? (
                <div className="text-gray-400 text-sm">ยังไม่มีการบันทึก</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {savedRounds.map((r, idx) => {
                    const rr = r as any;
                    const leftBansNames = ((rr.leftBans || []) as number[])
                      .map((id: number) => heroes.find((h) => h.id === id)?.name)
                      .filter(Boolean);
                    const rightBansNames = ((rr.rightBans || []) as number[])
                      .map((id: number) => heroes.find((h) => h.id === id)?.name)
                      .filter(Boolean);
                    const leftPicksNames = ((rr.leftPicks || []) as number[])
                      .map((id: number) => heroes.find((h) => h.id === id)?.name)
                      .filter(Boolean);
                    const rightPicksNames = ((rr.rightPicks || []) as number[])
                      .map((id: number) => heroes.find((h) => h.id === id)?.name)
                      .filter(Boolean);
                    return (
                      <div key={idx} className="bg-gray-800/70 border border-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-300 font-semibold">
                            เกมที่ {rr.game} — {rr.leftName} vs {rr.rightName}
                          </div>
                          {rr.timestamp ? (
                            <div className="text-xs text-gray-500">
                              {new Date(rr.timestamp).toLocaleString()}
                            </div>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          <div className="bg-gray-900/50 rounded p-2">
                            <div className="text-xs text-gray-400">แบน (🔵)</div>
                            <div className="text-sm text-gray-200 wrap-break-word">
                              {leftBansNames.length ? leftBansNames.join(', ') : '-'}
                            </div>
                          </div>
                          <div className="bg-gray-900/50 rounded p-2">
                            <div className="text-xs text-gray-400">แบน (🔴)</div>
                            <div className="text-sm text-gray-200 wrap-break-word">
                              {rightBansNames.length ? rightBansNames.join(', ') : '-'}
                            </div>
                          </div>
                          <div className="bg-gray-900/50 rounded p-2">
                            <div className="text-xs text-gray-400">เลือก (🔵)</div>
                            <div className="text-sm text-gray-200 wrap-break-word">
                              {leftPicksNames.length ? leftPicksNames.join(', ') : '-'}
                            </div>
                          </div>
                          <div className="bg-gray-900/50 rounded p-2">
                            <div className="text-xs text-gray-400">เลือก (🔴)</div>
                            <div className="text-sm text-gray-200 wrap-break-word">
                              {rightPicksNames.length ? rightPicksNames.join(', ') : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
