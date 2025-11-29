'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import type { Phase } from '@/lib/gameData';
import type { Side } from '@/app/types';

interface PhaseInfoProps {
  currentPhaseData: Phase | null;
  actionCount: number;
  isGameOver: boolean;
  onReset: () => void;
  userSide: Side;
  onSave?: () => void;
  hasBeenSaved?: boolean;
  startCountdown?: number | null;
  actionTimer?: number | null;
  readyToStartLeft?: boolean;
  readyToStartRight?: boolean;
  onReadyToStart?: () => void;
  isStarted?: boolean;
  restartReadyLeft?: boolean;
  restartReadyRight?: boolean;
  swapSides?: boolean;
  leftName?: string;
  rightName?: string;
}

export default function PhaseInfo({
  currentPhaseData,
  actionCount,
  isGameOver,
  onReset,
  userSide,
  startCountdown,
  actionTimer,
  onSave,
  hasBeenSaved = false,
  readyToStartLeft = false,
  readyToStartRight = false,
  onReadyToStart,
  isStarted = false,
  restartReadyLeft = false,
  restartReadyRight = false,
  swapSides = false,
  leftName,
  rightName
}: PhaseInfoProps) {
  const { t } = useTranslation();

  // Visual mapping: when swapped, the left visual slot represents logical right team
  const visualReadyToStartLeft = swapSides ? readyToStartRight : readyToStartLeft;
  const visualReadyToStartRight = swapSides ? readyToStartLeft : readyToStartRight;
  const visualRestartReadyLeft = swapSides ? restartReadyRight : restartReadyLeft;
  const visualRestartReadyRight = swapSides ? restartReadyLeft : restartReadyRight;

  const userIsVisuallyLeft = swapSides ? userSide === 'right' : userSide === 'left';
  const restartButtonColorClass = userIsVisuallyLeft ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';
  // flash/pulse when phase changes to make it more obvious
  const [flashKey, setFlashKey] = useState(0);
  const prevPhaseDescRef = useRef<string | null>(null);

  useEffect(() => {
    const desc = currentPhaseData ? currentPhaseData.desc : null;
    if (prevPhaseDescRef.current && desc && prevPhaseDescRef.current !== desc) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFlashKey(prev => prev + 1);
    }
    prevPhaseDescRef.current = desc;
  }, [currentPhaseData]);
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6 text-center">
      {!isStarted && startCountdown == null ? (
        <>
          <h3 className="text-2xl font-bold text-white mb-2">{t('waiting_for_players')}</h3>
          {userSide !== 'spectator' && (
            <button
              onClick={onReadyToStart}
              className={`px-6 py-2 rounded-lg transition-colors ${
                (userSide === 'left' && readyToStartLeft) || (userSide === 'right' && readyToStartRight)
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white mt-3`}
              disabled={(userSide === 'left' && readyToStartLeft) || (userSide === 'right' && readyToStartRight)}
            >
              {(userSide === 'left' && readyToStartLeft) || (userSide === 'right' && readyToStartRight)
                ? t('waiting_opponent')
                : t('ready')}
            </button>
          )}
          {(visualReadyToStartLeft || visualReadyToStartRight) && (
            <div className="mt-3 text-sm text-gray-300">
              <div className="flex items-center justify-center gap-4">
                <span className={visualReadyToStartLeft ? 'text-green-400' : 'text-gray-500'}>
                  {visualReadyToStartLeft ? '✓' : '○'} 🔵
                </span>
                <span className={visualReadyToStartRight ? 'text-green-400' : 'text-gray-500'}>
                  {visualReadyToStartRight ? '✓' : '○'} 🔴
                </span>
              </div>
            </div>
          )}
        </>
      ) : !isGameOver && currentPhaseData ? (
        <>
          <div
            key={flashKey}
            className={`mx-auto inline-flex items-center gap-3 px-4 py-2 rounded-lg transition-transform duration-300 animate-pulse-once ${currentPhaseData.side === 'left' ? 'phase-active-left' : 'phase-active-right'}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              {((swapSides ? (currentPhaseData.side === 'left' ? rightName : leftName) : (currentPhaseData.side === 'left' ? leftName : rightName))) ? (
                <span className={`text-2xl font-bold ${currentPhaseData.side === 'left' ? 'text-blue-400' : 'text-red-400'}`}>
                  {swapSides ? (currentPhaseData.side === 'left' ? rightName : leftName) : (currentPhaseData.side === 'left' ? leftName : rightName)}
                </span>
              ) : (
                <div className={`w-3.5 h-3.5 rounded-full ${currentPhaseData.side === 'left' ? 'bg-blue-500' : 'bg-red-500'}`} />
              )}
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-bold text-white leading-tight">
                {currentPhaseData ? t(currentPhaseData.desc) : ''}
              </h3>
              <div className="text-sm text-gray-400">
                ({actionCount}/{currentPhaseData?.count ?? 0}) • {currentPhaseData?.action === 'ban' ? t('ban') : t('pick')}
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex flex-col items-center gap-2">
            {startCountdown != null ? (
              <div className="flex flex-col items-center">
                <div className="text-yellow-300 text-6xl font-extrabold">{startCountdown}</div>
                <div className="text-sm text-yellow-200">{t('start_in')}</div>
              </div>
            ) : null}

            {actionTimer != null ? (
              <div className="w-full max-w-sm">
                <div className="text-green-300 text-5xl font-extrabold text-center">{actionTimer}{t('seconds')}</div>
                <div className="h-2 bg-gray-700 rounded mt-2 overflow-hidden">
                  <div
                    className="h-2 bg-green-400"
                    style={{ width: `${Math.max(0, Math.min(100, Math.round((actionTimer / 60) * 100)))}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={onSave}
              disabled
              className="bg-gray-600 cursor-not-allowed text-white px-4 py-2 rounded-lg opacity-50"
            >
              {t('save_game')}
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-3xl font-bold text-green-400 mb-2">✓ {t('finished')}</h3>
          {startCountdown != null && (
            <div className="mt-2 flex flex-col items-center">
              <div className="text-yellow-300 text-5xl font-extrabold">{startCountdown}</div>
              <div className="text-sm text-yellow-200">{t('start_in')}</div>
            </div>
          )}
          <div className="mt-3 flex items-center gap-3 justify-center">
            <button
              onClick={onSave}
              disabled={hasBeenSaved}
              className={hasBeenSaved ? "bg-gray-600 cursor-not-allowed text-white px-5 py-2 rounded-lg opacity-50" : "bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded-lg"}
            >
              {hasBeenSaved ? t('saved') : t('save_results')}
            </button>
            {userSide !== 'spectator' && (
              <button
                onClick={onReset}
                className={`px-6 py-2 rounded-lg text-white ${
                  (userSide === 'left' && restartReadyLeft) || (userSide === 'right' && restartReadyRight)
                    ? 'bg-gray-500 cursor-not-allowed'
                    : restartButtonColorClass
                }`}
                disabled={(userSide === 'left' && restartReadyLeft) || (userSide === 'right' && restartReadyRight)}
              >
                {(userSide === 'left' && restartReadyLeft) || (userSide === 'right' && restartReadyRight)
                  ? t('waiting_opponent')
                  : t('restart_game')}
              </button>
            )}
          </div>
          {(visualRestartReadyLeft || visualRestartReadyRight) && (
            <div className="mt-3 text-sm text-gray-300">
              <div className="flex items-center justify-center gap-4">
                <span className={visualRestartReadyLeft ? 'text-green-400' : 'text-gray-500'}>
                  {visualRestartReadyLeft ? '✓' : '○'} 🔵
                </span>
                <span className={visualRestartReadyRight ? 'text-green-400' : 'text-gray-500'}>
                  {visualRestartReadyRight ? '✓' : '○'} 🔴
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
