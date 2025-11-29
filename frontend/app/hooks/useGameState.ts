import { useState, useEffect, useRef } from 'react';
import { loadGameState, saveGameState, checkRoomCapacity } from '@/lib/api/storage';
import { wsClient } from '@/lib/api/websocket';
import type { GameState, HeroStatus, SavedRound, Side } from '@/app/types';

interface UseGameStateProps {
  roomCode: string;
  playSoundForEvent: (ev: 'start' | 'pick' | 'ban' | 'phase') => void;
  onGameStart: () => void;
  onPhaseChange: (prevPhase: number, newPhase: number) => void;
  onActionPerformedRef: React.MutableRefObject<((type: 'pick' | 'ban', side: Side, heroId: number) => void) | undefined>;
}

export function useGameState({
  roomCode,
  playSoundForEvent,
  onGameStart,
  onPhaseChange,
  onActionPerformedRef,
}: UseGameStateProps) {
  // Game state
  const [currentPhase, setCurrentPhase] = useState(0);
  const [actionCount, setActionCount] = useState(0);
  const [leftBans, setLeftBans] = useState<number[]>([]);
  const [rightBans, setRightBans] = useState<number[]>([]);
  const [leftPicks, setLeftPicks] = useState<number[]>([]);
  const [rightPicks, setRightPicks] = useState<number[]>([]);
  const [leftName, setLeftName] = useState<string | undefined>(undefined);
  const [rightName, setRightName] = useState<string | undefined>(undefined);
  const [savedRounds, setSavedRounds] = useState<SavedRound[]>([]);
  const [swapSides, setSwapSides] = useState(false);
  const [animatingSwap, setAnimatingSwap] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  // Player presence
  const [leftPresent, setLeftPresent] = useState(false);
  const [rightPresent, setRightPresent] = useState(false);

  // Ready states
  const [readyToStartLeft, setReadyToStartLeft] = useState(false);
  const [readyToStartRight, setReadyToStartRight] = useState(false);
  const [readyRestartLeft, setReadyRestartLeft] = useState(false);
  const [readyRestartRight, setReadyRestartRight] = useState(false);

  // refs to keep latest picks/bans for diffing incoming state updates
  const leftPicksRef = useRef<number[]>(leftPicks);
  const rightPicksRef = useRef<number[]>(rightPicks);
  const leftBansRef = useRef<number[]>(leftBans);
  const rightBansRef = useRef<number[]>(rightBans);
  const swapRef = useRef<boolean>(swapSides);

  // keep refs in sync
  useEffect(() => {
    leftPicksRef.current = leftPicks;
    rightPicksRef.current = rightPicks;
    leftBansRef.current = leftBans;
    rightBansRef.current = rightBans;
    swapRef.current = swapSides;
  }, [leftPicks, rightPicks, leftBans, rightBans, swapSides]);

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
          if (state.leftName) setLeftName(state.leftName);
          if (state.rightName) setRightName(state.rightName);
          if (state.savedRounds) setSavedRounds(state.savedRounds);
          if (state.hasBeenSaved !== undefined) setHasBeenSaved(state.hasBeenSaved);
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
      if (animatingSwap) return;
      setAnimatingSwap(true);
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
        const prevPhase = currentPhase;
        const newPhase = roomState.currentPhase;

        // compute diffs
        const newLeftPicks = Array.isArray(roomState.leftPicks) ? (roomState.leftPicks as number[]) : [];
        const newRightPicks = Array.isArray(roomState.rightPicks) ? (roomState.rightPicks as number[]) : [];
        const newLeftBans = Array.isArray(roomState.leftBans) ? (roomState.leftBans as number[]) : [];
        const newRightBans = Array.isArray(roomState.rightBans) ? (roomState.rightBans as number[]) : [];

        const leftPicksAdded = newLeftPicks.filter(id => !leftPicksRef.current.includes(id));
        const rightPicksAdded = newRightPicks.filter(id => !rightPicksRef.current.includes(id));
        const leftBansAdded = newLeftBans.filter(id => !leftBansRef.current.includes(id));
        const rightBansAdded = newRightBans.filter(id => !rightBansRef.current.includes(id));

        // play sounds
        let delay = 0;
        leftPicksAdded.forEach((heroId) => { 
          setTimeout(() => playSoundForEvent('pick'), delay); 
          delay += 80; 
          onActionPerformedRef.current?.('pick', 'left', heroId);
        });
        rightPicksAdded.forEach((heroId) => { 
          setTimeout(() => playSoundForEvent('pick'), delay); 
          delay += 80; 
          onActionPerformedRef.current?.('pick', 'right', heroId);
        });
        leftBansAdded.forEach((heroId) => { 
          setTimeout(() => playSoundForEvent('ban'), delay); 
          delay += 80; 
          onActionPerformedRef.current?.('ban', 'left', heroId);
        });
        rightBansAdded.forEach((heroId) => { 
          setTimeout(() => playSoundForEvent('ban'), delay); 
          delay += 80; 
          onActionPerformedRef.current?.('ban', 'right', heroId);
        });

        // apply state
        setCurrentPhase(newPhase);
        setActionCount(roomState.actionCount);
        setLeftBans(newLeftBans);
        setRightBans(newRightBans);
        setLeftPicks(newLeftPicks);
        setRightPicks(newRightPicks);
        if (roomState.leftName) setLeftName(roomState.leftName);
        if (roomState.rightName) setRightName(roomState.rightName);
        if (roomState.savedRounds) setSavedRounds(roomState.savedRounds);
        if (roomState.hasBeenSaved !== undefined) setHasBeenSaved(roomState.hasBeenSaved);
        if (roomState.swapSides !== undefined) {
          const newSwap = !!roomState.swapSides;
          if (swapRef.current !== newSwap) {
            performSwapTransition(newSwap);
          } else {
            setSwapSides(newSwap);
          }
        }

        // update refs
        leftPicksRef.current = newLeftPicks;
        rightPicksRef.current = rightPicks;
        leftBansRef.current = newLeftBans;
        rightBansRef.current = newRightBans;

        // notify phase change
        if (prevPhase !== newPhase) {
          onPhaseChange(prevPhase, newPhase);
        }
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
        if (roomState.leftName) setLeftName(roomState.leftName);
        if (roomState.rightName) setRightName(roomState.rightName);
      }
      if (side === 'left') setLeftPresent(true);
      if (side === 'right') setRightPresent(true);
    };

    const handlePlayerLeft = (message: Record<string, unknown>) => {
      const side = message.side as string;
      if (side === 'left') setLeftPresent(false);
      if (side === 'right') setRightPresent(false);
    };

    const handleReadyToStartStatus = (message: Record<string, unknown>) => {
      const leftReady = !!message.readyLeft;
      const rightReady = !!message.readyRight;
      setReadyToStartLeft(leftReady);
      setReadyToStartRight(rightReady);
    };

    const handleRestartReadyStatus = (message: Record<string, unknown>) => {
      const leftReady = !!message.readyLeft;
      const rightReady = !!message.readyRight;
      console.log('restart-ready-status received', { leftReady, rightReady });
      setReadyRestartLeft(leftReady);
      setReadyRestartRight(rightReady);
    };

    const handleRestartApproved = () => {
      console.log('restart-approved received');
      setCurrentPhase(0);
      setActionCount(0);
      setLeftBans([]);
      setRightBans([]);
      setLeftPicks([]);
      setRightPicks([]);
      setReadyRestartLeft(false);
      setReadyRestartRight(false);
      setSwapSides(!swapSides);
      setHasBeenSaved(false);
    };

    const unsubscribeStateUpdate = wsClient.on('state-updated', handleStateUpdate as unknown as (message: Record<string, unknown>) => void);
    const unsubscribePlayerJoined = wsClient.on('player-joined', handlePlayerJoined as unknown as (message: Record<string, unknown>) => void);
    const unsubscribePlayerLeft = wsClient.on('player-left', handlePlayerLeft as unknown as (message: Record<string, unknown>) => void);
    const unsubscribeReadyToStart = wsClient.on('ready-to-start-status', handleReadyToStartStatus as unknown as (message: Record<string, unknown>) => void);
    const unsubscribeRestartReady = wsClient.on('restart-ready-status', handleRestartReadyStatus as unknown as (message: Record<string, unknown>) => void);
    const unsubscribeRestartApproved = wsClient.on('restart-approved', handleRestartApproved);

    return () => {
      unsubscribeStateUpdate();
      unsubscribePlayerJoined();
      unsubscribePlayerLeft();
      unsubscribeReadyToStart();
      unsubscribeRestartReady();
      unsubscribeReadyToStart();
      unsubscribeRestartApproved();
    };
  }, [roomCode, animatingSwap, currentPhase, playSoundForEvent, onPhaseChange, rightPicks]);

  // Play sound when game actually starts
  useEffect(() => {
    if (currentPhase === 0 && actionCount === 0 && leftPicks.length === 0 && rightPicks.length === 0) {
      onGameStart();
    }
  }, [currentPhase, actionCount, leftPicks, rightPicks, onGameStart]);

  const getHeroStatus = (heroId: number): HeroStatus => {
    if (leftBans.includes(heroId) || rightBans.includes(heroId)) return 'banned';
    if (leftPicks.includes(heroId)) return 'picked-left';
    if (rightPicks.includes(heroId)) return 'picked-right';
    return 'available';
  };

  const saveCurrentState = async (updates: Partial<GameState>) => {
    const newState = {
      currentPhase,
      actionCount,
      leftBans,
      rightBans,
      leftPicks,
      rightPicks,
      leftName,
      rightName,
      savedRounds,
      ...updates,
    };
    await saveGameState(roomCode, newState);
  };

  return {
    // state
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
    leftPresent,
    rightPresent,
    readyToStartLeft,
    readyToStartRight,
    readyRestartLeft,
    readyRestartRight,
    hasBeenSaved,
    // setters
    setLeftName,
    setRightName,
    setSavedRounds,
    setCurrentPhase,
    setActionCount,
    setLeftBans,
    setRightBans,
    setLeftPicks,
    setRightPicks,
    setReadyRestartLeft,
    setReadyRestartRight,
    setHasBeenSaved,
    // functions
    getHeroStatus,
    saveCurrentState,
  };
}