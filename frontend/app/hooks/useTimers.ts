import { useEffect, useRef, useState } from 'react';

export function useStartCountdown(
  isStarted: boolean,
  readyToStartLeft: boolean,
  readyToStartRight: boolean,
  onCountdownEnd: () => void
) {
  const [startCountdown, setStartCountdown] = useState<number | null>(null);
  const startIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (readyToStartLeft && readyToStartRight && !isStarted && startCountdown == null) {
      setTimeout(() => setStartCountdown(10), 0);
    }
  }, [readyToStartLeft, readyToStartRight, isStarted, startCountdown]);

  useEffect(() => {
    if (startCountdown == null) return;
    if (startCountdown <= 0) {
      setTimeout(() => {
        setStartCountdown(null);
        onCountdownEnd();
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
  }, [startCountdown, onCountdownEnd]);

  return { startCountdown, setStartCountdown };
}

export function useActionTimer(
  isStarted: boolean,
  currentPhase: number,
  actionCount: number,
  phasesLength: number,
  onTimerEnd: () => void
) {
  const [actionTimer, setActionTimer] = useState<number | null>(null);
  const actionIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isStarted) return;
    if (currentPhase >= phasesLength) {
      setTimeout(() => setActionTimer(null), 0);
      return;
    }
    setTimeout(() => setActionTimer(60), 0);
  }, [currentPhase, actionCount, isStarted, phasesLength]);

  useEffect(() => {
    if (actionTimer == null) return;
    if (actionTimer <= 0) {
      onTimerEnd();
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
  }, [actionTimer, onTimerEnd]);

  return { actionTimer };
}